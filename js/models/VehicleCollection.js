var L = require('leaflet');
var when = require('when');
var _ = require('underscore');
var utils = require('../utils');
var config = require('../config');
var requests = require('../requests');
var Vehicle = require('./Vehicle');

var response = {
    "query": {
        "count": 1,
        "created": "2014-08-25T03:36:33Z",
        "lang": "en-US",
        "results": {
            "Envelope": {
                "encodingStyle": "http://schemas.xmlsoap.org/soap/encoding/",
                "soap": "http://schemas.xmlsoap.org/soap/envelope/",
                "soapenc": "http://schemas.xmlsoap.org/soap/encoding/",
                "xsd": "http://www.w3.org/2001/XMLSchema",
                "xsi": "http://www.w3.org/2001/XMLSchema-instance",
                "Body": {
                    "BuslocationResponse": {
                        "xmlns": "AT_WEB",
                        "Version": "1.0",
                        "Input": {
                            "Route": "803",
                            "Direction": "*"
                        },
                        "Vehicles": {
                            "Vehicle": [{
                                "Route": "803",
                                "Direction": "N",
                                "Updatetime": "10:34 PM",
                                "Vehicleid": "5058",
                                "Block": "803-06",
                                "Adherance": "-2",
                                "Adhchange": "I",
                                "Reliable": "Y",
                                "Offroute": "N",
                                "Stopped": "N",
                                "Inservice": "Y",
                                "Speed": "11.59",
                                "Heading": " 0",
                                "Routeid": "52297",
                                "Positions": {
                                    "Position": ["30.399532,-97.720520", "30.400908,-97.720009", "30.395077,-97.720482", "30.391283,-97.722420", "30.388203,-97.727135", "30.387817,-97.727325"]
                                }
                            }, {
                                "Route": "803",
                                "Direction": "S",
                                "Updatetime": "10:32 PM",
                                "Vehicleid": "5061",
                                "Block": "803-90",
                                "Adherance": "3",
                                "Adhchange": "S",
                                "Reliable": "Y",
                                "Offroute": "N",
                                "Stopped": "N",
                                "Inservice": "Y",
                                "Speed": "10.56",
                                "Heading": "23",
                                "Routeid": "52302",
                                "Positions": {
                                    "Position": ["30.231371,-97.792213", "30.236458,-97.792526", "30.244762,-97.780807", "30.246742,-97.777863", "30.247980,-97.771751", "30.254745,-97.762383"]
                                }
                            }]
                        },
                        "Mapextents": "30.231371,-97.792526,30.400908,-97.720009",
                        "Requestor": "192.168.10.91",
                        "Host": "cmtaatisweb2",
                        "Copyright": "XML schema Copyright (c) 2003-2013 Trapeze Software ULC, its subsidiaries and affiliates.  All rights reserved.",
                        "Soapversion": "2.6.3 - 09/23/13"
                    }
                }
            }
        }
    }
};

var VehicleCollection = {
    fetch: function(route, direction) {
        var deferred = when.defer(),
            yqlURL = 'http://query.yahooapis.com/v1/public/yql',
            url = 'http://www.capmetro.org/planner/s_buslocation.asp?route=' + route,
            params = {
                q: 'select * from xml where url="' + url + '"',
                format: 'json' // let yql do the conversion from xml to json
            };

        return when.resolve(this.parseLocationResponse(direction, response));

        function retryAtMost(maxRetries) {
            console.log(url);
            requests.get(yqlURL, params)
                .then(this.parseLocationResponse.bind(direction))
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
    parseLocationResponse: function(directoin, res) {
        var BuslocationResponse;

        if (!res.query.results) {
            throw new Error('The CapMetro API is unavailable');
        }
        if (!res.query.results.Envelope.Body.BuslocationResponse.Vehicles) {
            throw new Error('Zero active vehicles');
        }

        var data = res.query.results.Envelope.Body.BuslocationResponse.Vehicles.Vehicle;
        if (!Array.isArray(data)) {
            data = [data];
        }

        var vehicles = data.map(function(v) {
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
