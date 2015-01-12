var _ = require('underscore');
var ko = require('knockout');
var geolib = require('geolib');
var L = require('leaflet');
var when = require('when');

var config = require('../config');
var requests = require('../requests');
var Stop = require('./Stop');

function StopCollection(routeID, directionID) {
    this.routeID = ko.observable(routeID);
    this.directionID = ko.observable(directionID);

    this.active = ko.observable();
    this.stops = ko.observableArray();

    window.addEventListener("hashchange", this.hashChange.bind(this));
}

StopCollection.prototype.start = function(layer) {
    var promise = this.fetch()
        .tap(this.draw.bind(this, layer))
        .tap(this.hashChange.bind(this));

    return promise;
};

StopCollection.prototype.fetch = function() {
    var promise = requests.get('data/stops_' + this.routeID() + '_' + this.directionID() + '.json')
        .then(function(data) {
            var stops = data.map(function(stopData) {
                return new Stop(stopData);
            });

            return stops;
        })
        .tap(function(stops) {
            this.stops(stops);
        }.bind(this));

    return promise;
};

StopCollection.prototype.refresh = function() {
    if (this.active()) {
        return this.active().refresh();
    }
};

StopCollection.prototype.draw = function(layer) {
    this.stops().forEach(function(stop) {
        stop.marker.addTo(layer);
    });
};

StopCollection.prototype.closest = function(lat, lng) {
    if (!lat || !lng || !this.stops() || !this.stops().length) {
        return;
    }

    var points = this.stops().map(function(s) {
        return {latitude: s.lat(), longitude: s.lon()};
    });
    var nearestPoint = geolib.findNearest({latitude: lat, longitude: lng}, points, 0, 1);
    var closest = this.stops()[parseInt(nearestPoint.key)];

    return closest;
};

StopCollection.prototype.hashChange = function() {
    var routeMatches = location.hash.match(/route\/\d+\/direction\/\d+\/stop\/\d+/g);

    if (routeMatches) {
        var stopID = /stop\/(\d+)/g.exec(location.hash)[1];
        var stop = _.find(this.stops(), function(s) {
            return s.stopID().toString() === stopID.toString();
        });

        if (stop) {
            console.debug('/route/direction/stop: found', location.hash);
            this.active(stop);
            this.active().setupMarker();
            this.active().refresh();
        }
    }
};


module.exports = StopCollection;
