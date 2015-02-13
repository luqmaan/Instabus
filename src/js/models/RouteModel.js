var ko = require('knockout');
var _ = require('underscore');

var VehiclesCollection = require('./VehiclesCollection');
var StopCollection = require('./StopCollection');
var ShapeModel = require('./ShapeModel');


function RouteModel(data) {
    this.routeID = ko.observable(data.route_id);
    this.routeType = ko.observable(data.route_type);
    this.name = ko.observable(data.name);
    this.url = ko.observable('#/route/' + this.routeID);
    this.directions = ko.observableArray(data.directions);

    this.vehiclesCollection = new VehiclesCollection();
    this.stops = data.directions.map(function(direction) {
        return new StopCollection(this.routeID(), direction.direction_id);
    }, this);
    this.shapes = data.directions.map(function(direction) {
        return new ShapeModel(this.routeID(), direction.direction_id);
    }, this);
}

_.extend(RouteModel.prototype, {
    init: function() {

    }
});

module.exports = RouteModel;
