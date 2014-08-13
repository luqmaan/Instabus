var L = require('leaflet');
var when = require('when');
var config = require('../config');
var requests = require('../requests');

function Shape(route, direction) {
    this.route = route;
    this.direction = direction;
    this._shape = [];
}

Shape.prototype = {
    fetch: function() {
        var deferred = when.defer();

        requests.get('data/shapes_' + this.route + '_' + this.direction + '.json')
            .then(function(data) {
                this._shape = data.map(function(el) {
                    return new L.LatLng(el.shape_pt_lat, el.shape_pt_lon);
                });
                deferred.resolve();
            }.bind(this))
            .catch(function(err) {
                console.error("problem fetching shape", err);
                deferred.reject(err);
            });

        return deferred.promise;
    },
    draw: function(layer) {
        var color ='rgb(199,16,22)',
            line = new L.Polyline(this._shape, {
                color: color,
                stroke: true,
                weight: 5,
                opacity: 0.9,
                smoothFactor: 1
            });
        line.addTo(layer);
        line.bringToBack();  // https://github.com/Leaflet/Leaflet/issues/185
    }
};

module.exports = Shape;
