var ko = require('knockout');
var _ = require('underscore');

var mapController = require('../MapController');
var VehiclesView = require('./views/VehiclesView');
var StopsView = require('./views/StopCollection');
var Shape = require('./models/Shape');
var config = require('./config');


function RouteView(route) {
    this.route = route;

    this.shapes = [];
    this.stopCollections = [];

    this.vehiclesView = new VehiclesView(this.routeID());

    this.route.directions.forEach(function(direction) {
        var shape = new Shape(this.route.routeID(), direction.direction_id);
        this.shapes.push(shape);

        var stopCollection = new StopCollection(this.routeID(), direction.direction_id);
        this.stopCollections.push(stopCollection);
    }, this);

    window.addEventListener("hashchange", this.hashChange.bind(this));
    this.hashChange();
}

_.extend(RouteView.prototype, {
    init: function() {

    },
    hashChange: function() {

    }
});

module.exports = RouteView;
