var L = require('leaflet');
var when = require('when');
var _ = require('underscore');
var utils = require('../utils');
var config = require('../config');
var requests = require('../requests');
var Vehicle = require('./Vehicle');

var VehicleCollection = {
    fetch: function(route, direction) {
        var deferred = when.defer(),
            yqlURL = 'http://query.yahooapis.com/v1/public/yql',
            url = 'http://www.capmetro.org/planner/s_buslocation.asp?route=' + route,
            params = {
                q: 'select * from xml where url="' + url + '"',
                format: 'json' // let yql do the conversion from xml to json
            };

        function retryAtMost(maxRetries) {
            console.log(url);
            requests.get(yqlURL, params)
                .then(this.parseLocationResponse.bind(this, direction))
                .catch(function(err) {
                    console.error(err);
                    if (err.message === 'The CapMetro API is unavailable') {
                        console.error('Retrying', maxRetries - 1, 'more times');
                        return retryAtMost(maxRetries - 1);
                    }
                    deferred.reject(err);
                })
                .done(function(vehicles) {
                    console.info('API responded with', vehicles.length, 'vehicles');
                    deferred.resolve(vehicles);
                });
        }

        retryAtMost.call(this, 3);

        return deferred.promise;
    },
    parseLocationResponse: function(direction, res) {
        var vehicles = [],
            BuslocationResponse;

        if (!res.query.results) {
            throw new Error('The CapMetro API is unavailable');
        }
        if (res.query.results.Envelope.Body.Fault) {
            var fault = res.query.results.Envelope.Body.Fault,
                faultstring = fault.faultstring,
                faultcode = fault.faultcode;

            // soap:15006 => SOAP - empty response
            if (faultcode === 'soap:15006') {
                throw new Error('Zero active vehicles');
            }
            else {
                throw new Error(faultcode + ' ' + faultstring);
            }
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
