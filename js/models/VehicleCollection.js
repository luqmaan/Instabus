var L = require('leaflet');
var when = require('when');
var _ = require('underscore');
var utils = require('../utils');
var config = require('../config');
var requests = require('../requests');
var Vehicles = require('./Vehicle');

var VehicleCollection = {
    fetch: function(route, direction) {
        var deferred = when.defer(),
            url = 'http://query.yahooapis.com/v1/public/yql',
            params = {
                q: 'select * from xml where url="http://www.capmetro.org/planner/s_buslocation.asp?route=*"',
                format: 'json' // let yql do the conversion from xml to json
            };

        function retryAtMost(maxRetries) {
            requests.get(url, params)
                .then(this.parseLocationResponse)
                .catch(function(err) {
                    console.error(err);
                    if (err.message === 'The CapMetro API is unavailable') {
                        console.error('Retrying', maxRetries - 1, 'more times');
                        return retryAtMost(maxRetries - 1);
                    }
                    deferred.reject(err);
                })
                .done(function(vehicles) {
                    console.log('Got vehicles', vehicles);
                    deferred.resolve(vehicles);
                });
        }

        retryAtMost.call(this, 3);

        return deferred.promise;
    },
    parseLocationResponse: function(res) {
        var BuslocationResponse,
            data,
            vehicles;

        if (!data.query.results) {
            throw new Error('The CapMetro API is unavailable');
        }
        if (!data.query.results.Envelope.Body.BuslocationResponse.Vehicles) {
            throw new Error('Zero active vehicles');
        }

        data = data.query.results.Envelope.Body.BuslocationResponse.Vehicles.Vehicle;
        if (!Array.isArray(data)) {
            data = [data];
        }

        vehicles = data.map(function(v) {
            return new Vehicle(v);
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
