var ko = require('knockout');
var when = require('when');

var requests = require('../requests');
var utils = require('../utils');
var config = require('../config');
var Trip = require('./Trip');

var CapMetroAPIError = config.errors.CapMetroAPIError();

var mockdata = require('./mockdata');

function TripCollection(routeID, directionID, stopID) {
    this.routeID = routeID;
    this.directionID = directionID;
    this.stopID = stopID;

    this.errorMsg = ko.observable();
    this.loading = ko.observable(true);

    this.trips = ko.observableArray();
}


TripCollection.prototype.fetch = function() {
    var deferred = when.defer();
    var yqlURL = 'http://query.yahooapis.com/v1/public/yql';
    var capURL = 'http://www.capmetro.org/planner/s_service.asp?output=xml&opt=2&tool=SI&stopid=' + this.stopID;
    var params = {
        q: 'select * from xml where url="' + capURL + '"',
        format: 'json'
    };

    function retryAtMost(maxRetries) {
        // requests.get(yqlURL, params)
        when.resolve(mockdata.arrivalsForStop)
            .then(this.parseResponse.bind(this))
            .tap(function(trips) {
                this.trips(trips);
            }.bind(this))
            .catch(CapMetroAPIError, function(err) {
                var msg = err.message + '. Retrying ' + maxRetries + ' more times';
                console.error(msg);
                this.errorMsg(msg);
                deferred.notify(msg);

                if (maxRetries > 0) {
                    return retryAtMost.call(this, maxRetries - 1);
                }
                else {
                    deferred.reject(CapMetroAPIError);
                }
            }.bind(this))
            .catch(function(err) {
                console.error(err);
                this.errorMsg(err);
                deferred.reject(err);
            }.bind(this))
            .finally(function() {
                this.loading(false);
            }.bind(this));
    }

    retryAtMost.call(this, config.MAX_RETRIES);

    return deferred.promise;
};

TripCollection.prototype.parseResponse = function(res) {
    var Service;
    var Tripinfo;
    var trips;

    if (!res.query.results || !res.query.results.Envelope) {
        throw new CapMetroAPIError('The CapMetro Stop Arrival Times API is unavailable');
    }

    if (res.query.results.Envelope.Body.Fault) {
        var fault = res.query.results.Envelope.Body.Fault,
            faultstring = fault.faultstring,
            faultcode = fault.faultcode;

        throw new Error(faultcode + ' ' + faultstring);
    }

    Service = res.query.results.Envelope.Body.SchedulenearbyResponse.Atstop.Service;
    if (Array.isArray(Service)) {
        // Filter out the wrong direction
        // But don't filter out the wrong direction if only one service is returned: this happens at the last stop in a route
        Service = Service.filter(function(s) {
            // `Direction` in the xml is N or S, not 0 or 1. convert it to something sane
            return utils.getDirectionID(s.Route, s.Direction) === this.directionID;
        }.bind(this))[0];
    }

    Tripinfo = Service.Tripinfo;
    if (!Array.isArray(Tripinfo)) {
        Tripinfo = [Tripinfo];
    }

    trips = Tripinfo.map(function(tripData) { return new Trip(tripData); });

    // show only the most recent old trip
    for (var i = 0; i < trips.length; i++) {
        if (! trips[i].old()) {
            if (i > 0) {
                trips = trips.slice(i-1);
            }
            break;
        }
    }

    return trips;
};

module.exports = TripCollection;
