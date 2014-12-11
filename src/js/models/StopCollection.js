var geolib = require('geolib');
var L = require('leaflet');
var when = require('when');
var config = require('../config');
var Stop = require('./Stop');
var requests = require('../requests');

var StopCollection = {
    fetch: function(route, direction) {
        var deferred = when.defer();

        requests.get('data/stops_' + route + '_' + direction + '.json')
            .then(function(data) {
                var stops = data.map(function(stopData) {
                    return new Stop(stopData);
                });

                deferred.resolve(stops);
            })
            .catch(function(err) {
                deferred.reject(err);
            });

        return deferred.promise;
    },
    draw: function(stops, layer) {
        stops.forEach(function(stop) {
            stop.marker.addTo(layer);
        });
    },
    closest: function(lat, lng, stops) {
        if (!lat || !lng || !stops || !stops.length) return;

        var points = stops.map(function(s) { return {latitude: s.lat(), longitude: s.lon()};}),
            nearestPoint = geolib.findNearest({latitude: lat, longitude: lng}, points, 0, 1),
            closest = stops[parseInt(nearestPoint.key)];

        return closest;
    }
};

module.exports = StopCollection;
