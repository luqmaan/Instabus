var _ = require('underscore');
var ko = require('knockout');
var config = require('../config');

var Trip = require('./Trip');


function TripCollection(stopID, Runs) {
    this.stopID = ko.observable(stopID);
    this.routeID = ko.observable(Runs[0].Route);
    this.sign = ko.observable(Runs[0].Sign);

    this.trips = ko.observableArray(this.parseTrips(Runs));
}

TripCollection.prototype.parseTrips = function(Runs) {
    var trips = Runs.map(function(Run) {
        return new Trip(Run);
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
