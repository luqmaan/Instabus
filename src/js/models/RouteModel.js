var ko = require('knockout');

var mapController = require('../MapController');
var VehicleCollection = require('./models/VehicleCollection');
var StopCollection = require('./models/StopCollection');
var Shape = require('./models/Shape');
var config = require('./config');


function RouteModel(data) {
    this.routeID = ko.observable(data.route_id);
    this.routeType = ko.observable(data.route_type);
    this.name = ko.observable(data.name);
}

module.exports = RouteModel;
