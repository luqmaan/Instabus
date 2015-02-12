var ko = require('knockout');

var mapController = require('../MapController');
var VehicleCollection = require('./models/VehicleCollection');
var StopCollection = require('./models/StopCollection');
var Shape = require('./models/Shape');
var config = require('./config');


function Route(data) {
    this.routeID = ko.observable(data.route_id);
    this.routeType = ko.observable(data.route_type);
    this.name = ko.observable(data.name);

    this.directions = data.directions;
    this.shapes = [];
    this.stopCollections = [];

    this.vehicleCollection = new VehicleCollection(this.routeID());

    data.directions.forEach(function(direction) {
        var shape = new Shape(this.routeID(), direction.direction_id);
        this.shapes.push(shape);

        var stopCollection = new StopCollection(this.routeID(), direction.direction_id);
        this.stopCollections.push(stopCollection);
    }, this);

    window.addEventListener("hashchange", this.hashChange.bind(this));
}

module.exports = Route;
