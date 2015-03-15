var _ = require('underscore');
var ko = require('knockout');
var config = require('../config');

var Trip = require('./Trip');


function TripCollection(stopID, routeID, runs) {
    this.stopID = ko.observable(stopID);
    this.routeID = ko.observable(routeID);
    this.sign = ko.observable(runs[0].sign);

    this.trips = ko.observableArray(this.parseTrips(runs));
}

TripCollection.prototype.parseTrips = function(runs) {
    var trips = runs.map(function(run) {
        return new Trip(run);
    });

    // show only the most recent missed trip
    for (var i = 0; i < trips.length; i++) {
        if (! trips[i].old()) {
            if (i > 0) {
                trips = trips.slice(i-1);
            }
            break;
        }
    }

    return trips.slice(0, config.MAX_TRIPS);
};

module.exports = TripCollection;
