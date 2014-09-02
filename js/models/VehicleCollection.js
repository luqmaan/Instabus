var L = require('leaflet');
var when = require('when');
var _ = require('underscore');
var utils = require('../utils');
var config = require('../config');
var requests = require('../requests');
var Vehicle = require('./Vehicle');

var CapMetroAPIError = config.errors.CapMetroAPIError();

function VehicleCollection(route, direction) {
    this.route = route;
    this.direction = direction;
    this.vehicles = [];
    this.layer = L.layerGroup();
}

VehicleCollection.prototype = {
    refresh: function() {
        return this.fetch()
            .tap(this.draw.bind(this));
    },
    fetch: function() {
        var deferred = when.defer(),
            yqlURL = 'http://query.yahooapis.com/v1/public/yql',
            capURL = 'http://www.capmetro.org/planner/s_buslocation.asp?route=' + this.route,
            params = {
                q: 'select * from xml where url="' + capURL + '"',
                format: 'json' // let yql do the conversion from xml to json
            };

        function retryAtMost(maxRetries) {
            requests.get(yqlURL, params)
                .then(this.parseLocationResponse.bind(this, this.direction))
                .then(function(vehicles) {
                    console.info('API responded with', vehicles.length, 'vehicles');
                    deferred.resolve(vehicles);
                })
                .catch(CapMetroAPIError, function(err) {
                    var msg = err.message + '. Retrying ' + maxRetries + ' more times';
                    console.error(msg);
                    deferred.notify(msg);
                    if (maxRetries > 0) {
                        return retryAtMost.call(this, maxRetries - 1);
                    }
                    else {
                        deferred.reject(CapMetroAPIError);
                    }
                }.bind(this))
                .catch(function(err) {
                    deferred.reject(err);
                });
        }

        retryAtMost.call(this, config.MAX_RETRIES);

        return deferred.promise;
    },
    parseLocationResponse: function(direction, res) {
        var vehicles = [],
            BuslocationResponse;

        if (!res.query.results || !res.query.results.Envelope) {
            throw new CapMetroAPIError('The CapMetro Bus Location API is unavailable');
        }
        if (res.query.results.Envelope.Body.Fault) {
            var fault = res.query.results.Envelope.Body.Fault,
                faultstring = fault.faultstring,
                faultcode = fault.faultcode;

            throw new Error(faultcode + ' ' + faultstring);
        }
        if (!res.query.results.Envelope.Body.BuslocationResponse.Vehicles) {
            throw new Error('Zero active vehicles');
        }

        var data = res.query.results.Envelope.Body.BuslocationResponse.Vehicles.Vehicle;
        if (!Array.isArray(data)) {
            data = [data];
        }

        data.forEach(function(v) {
            var vehicle = new Vehicle(v);
            if (vehicle.directionID === direction) {
                return vehicles.push(vehicle);
            }
        });

        return vehicles;
    },
    draw: function(newVehicles) {
        var addedVehicles = [],
            existingVehicles = [],
            deletedVehicles = [],
            vehicleComparator = function(a, b) { return a.id === b.id; };

        // find added and existing vehicles
        newVehicles.forEach(function(v) {
            var existing = _.find(this.vehicles, vehicleComparator.bind(null, v));
            if (existing) {
                existingVehicles.push(existing);
            }
            else {
                addedVehicles.push(v);
            }
        }.bind(this));

        // find deleted vehicles
        this.vehicles.forEach(function(v) {
            var equal = _.find(newVehicles, vehicleComparator.bind(null, v));
            if (!equal) {
                deletedVehicles.push(v);
            }
        });

        console.info('Existing', existingVehicles.length, 'vehicles', existingVehicles);
        console.info('Added', addedVehicles.length, 'vehicles', addedVehicles);
        console.info('Deleted', deletedVehicles.length, 'vehicles', deletedVehicles);

        // remove from map and delete from this.vehicles
        deletedVehicles.forEach(function(v) {
            v.remove(this.layer);

            var index = this.vehicles.indexOf(v);
            if (index > -1) {
                this.vehicles.splice(index, 1);
            }
        }.bind(this));

        // draw on map and add to this.vehicles
        addedVehicles.forEach(function(v) {
            this.vehicles.push(v);
            v.draw(this.layer);
        }.bind(this));

        // update the existing vehicle with the new vehicle's data
        // then move the existing vehicle's marker to its new location
        existingVehicles.forEach(function(v) {
            var newVehicle = _.find(newVehicles, vehicleComparator.bind(null, v));

            v.update(newVehicle);
        });
    }
};

module.exports = VehicleCollection;
