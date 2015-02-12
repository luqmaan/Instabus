var _ = require('underscore');
var ko = require('knockout');
var geolib = require('geolib');
var L = require('leaflet');
var when = require('when');

var config = require('../config');
var requests = require('../requests');
var Stop = require('./Stop');
var mapController = require('../MapController');


function StopCollection(routeID, directionID) {
    this.routeID = ko.observable(routeID);
    this.directionID = ko.observable(directionID);

    this.stops = ko.observableArray();

    this._layer = null;

    window.addEventListener("hashchange", this.hashChange.bind(this));
    this.hashChange();
}

_.extend(StopCollection.prototype, {
    start: function(layer) {
        var promise = this.fetch()
                          .tap(this.draw.bind(this, layer))
                          .tap(this.hashChange.bind(this));
        return promise;
    },
    fetch: function() {
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
    },
    applyBindings: function() {
        this._layer = L.layerGroup();
        this._layer.addTo(mapController.map);
    },
    removeBindings: function() {
        mapController.map.removeLayer(this._layer);
        this._layer = null;
    },
    draw: function() {
        this.stops().forEach(function(stop) {
            stop.marker.addTo(this._layer);
        }, this);
    },
    hashChange: function() {
        var hashRouteID = !!location.hash.match(/route\/\d+/g) ? /route\/(\d+)/g.exec(location.hash)[1] : null;

        if (hashRouteID === this.routeID && !this._layer) {
            this.start();
        }
        else if (hashRouteID && hashRouteID !== this.routeID && this._layer){
            this.removeBindings();
        }

        if (hashRouteID === this.routeID && location.hash.match(/route\/\d+\/direction\/\d+\/stop\/\d+/g)) {
            var stopID = /stop\/(\d+)/g.exec(location.hash)[1];
            var stop = _.find(this.stops(), function(s) {
                return s.stopID().toString() === stopID.toString();
            });

            if (stop) {
                console.debug('/route/:id/stop/:id/: found', location.hash);
                // FIXME: display the stop popup
            }
        }
    },
});


module.exports = StopCollection;
