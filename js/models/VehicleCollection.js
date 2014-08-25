var L = require('leaflet');
var when = require('when');
var _ = require('underscore');
var utils = require('../utils');
var config = require('../config');
var requests = require('../requests');
var Vehicle = require('./Vehicle');

var CapMetroAPIError = config.errors.CapMetroAPIError();

var VehicleCollection = {
    fetch: function(route, direction) {
        var deferred = when.defer(),
            yqlURL = 'http://query.yahooapis.com/v1/public/yql',
            capURL = 'http://www.capmetro.org/planner/s_buslocation.asp?route=' + route,
            params = {
                q: 'select * from xml where url="' + capURL + '"',
                format: 'json' // let yql do the conversion from xml to json
            };

        function retryAtMost(maxRetries) {
            requests.get(yqlURL, params)
                .then(this.parseLocationResponse.bind(this, direction))
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
            console.log(vehicle);
            if (vehicle.directionID === direction) {
                return vehicles.push(vehicle);
            }
        });

        return vehicles;
    },
    draw: function(vehicles, existingMarkers, layer) {
        var existingVehicleIDs = vehicles.map(function(v) { return v.id; }),
            addedVehicles = [],
            deletedVehicleIDs = [];

        for (var vehicleID in existingMarkers) {
            if (!existingVehicleIDs[vehicleID]) {
                var marker = existingMarkers[vehicleID];
                deletedVehicleIDs.push(vehicleID);
                layer.removeLayer(marker);
            }
        }

        console.info('Showing', existingVehicleIDs.length, 'vehicles', existingVehicleIDs);
        console.info('Added', addedVehicles.length, 'vehicles', addedVehicles);
        console.info('Deleted', deletedVehicleIDs.length, 'vehicles', deletedVehicleIDs);

        vehicles.forEach(function(vehicle) {
            var newMarker = vehicle.draw(existingMarkers, layer);
            if (newMarker) {
                existingMarkers[vehicleID] = newMarker;
            }
        });

        return existingMarkers;
    }
};

module.exports = VehicleCollection;
