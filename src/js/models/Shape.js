var L = require('leaflet');
var when = require('when');
var _ = require('underscore');

var config = require('../config');
var requests = require('../requests');
var mapController = require('../MapController');


function Shape(routeID, directionID) {
    this.routeID = routeID;
    this.directionID = directionID;
    this._polylineCoords = [];
    this._layer = null;
}

_.extend(Shape.prototype, {
    start: function() {
        var promise = this.fetch()
                          .with(this)
                          .tap(this.applyBindings)
                          .tap(this.draw);
        return promise;
    },
    fetch: function() {
        var promise = requests.get('data/shapes_' + this.routeID + '_' + this.directionID + '.json')
            .then(function(data) {
                return data.map(function(el) {
                    return new L.LatLng(el.shape_pt_lat, el.shape_pt_lon);
                });
            })
            .tap(function(coords) {
                this._polylineCoords = coords;
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

        this._polylineCoords = [];
    },
    draw: function() {
        var line = new L.Polyline(this._polylineCoords, {
            color: 'rgb(199,16,22)',
            stroke: true,
            weight: 5,
            opacity: 0.9,
            smoothFactor: 1
        });
        line.addTo(this._layer);
        line.bringToBack();  // https://github.com/Leaflet/Leaflet/issues/185
    },
    hashChange: function() {
        var hashRouteID = !!location.hash.match(/route\/\d+/g) ? /route\/(\d+)/g.exec(location.hash)[1] : null;

        if (hashRouteID === this.routeID && !this._layer) {
            this.start();
        }
        else if (hashRouteID && hashRouteID !== this.routeID && this._layer){
            this.removeBindings();
        }
    }
});

module.exports = Shape;
