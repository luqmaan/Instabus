var L = require('leaflet');
var when = require('when');
var _ = require('underscore');

var config = require('../config');
var requests = require('../requests');
var mapController = require('../MapController');


function ShapeModel(routeID, directionID) {
    this.routeID = routeID;
    this.directionID = directionID;
    this._polylineCoords = [];
    this._layer = null;
}

_.extend(ShapeModel.prototype, {
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
    }
});

module.exports = ShapeModel;
