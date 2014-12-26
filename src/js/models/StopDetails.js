var _ = require('underscore');
var ko = require('knockout');
var when = require('when');

var requests = require('../requests');
var utils = require('../utils');
var config = require('../config');
var TripCollection = require('./TripCollection');

var CapMetroAPIError = config.errors.CapMetroAPIError();

var mockdata = require('./mockdata');

function StopDetails(routeID, directionID, stopID) {
    this.routeID = ko.observable(routeID);
    this.directionID = ko.observable(directionID);
    this.stopID = ko.observable(stopID);

    this.errorMsg = ko.observable();
    this.loading = ko.observable(true);

    this.tripCollections = ko.observableArray();

    this.activeTripCollections = ko.computed(function() {
        return _.find(this.tripCollections(), function(t) {
            return t.routeID().toString() === this.routeID().toString();
        }.bind(this));
    }, this);
}

StopDetails.prototype.fetch = function() {
    var deferred = when.defer();
    var yqlURL = 'http://query.yahooapis.com/v1/public/yql';
    var capURL = 'http://www.capmetro.org/planner/s_service.asp?output=xml&opt=2&tool=SI&stopid=' + this.stopID();
    var params = {
        q: 'select * from xml where url="' + capURL + '"',
        format: 'json'
    };

    function retryAtMost(maxRetries) {
        // requests.get(yqlURL, params)
        when.resolve(mockdata.arrivalsForStop)
            .then(this.parseResponse.bind(this))
            .tap(function(Services) {
                var tripCollections = Services.map(function(Service) {
                    return new TripCollection(this.stopID(), Service);
                }.bind(this));

                this.tripCollections(tripCollections);
            }.bind(this))
            .catch(CapMetroAPIError, function(err) {
                var msg = err.message + '. Retrying ' + maxRetries + ' more times';
                console.error(msg);
                this.errorMsg(msg);

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

StopDetails.prototype.parseResponse = function(res) {
    var Services;

    if (!res.query.results || !res.query.results.Envelope) {
        throw new CapMetroAPIError('The CapMetro Stop Arrival Times API is unavailable');
    }

    if (res.query.results.Envelope.Body.Fault) {
        var fault = res.query.results.Envelope.Body.Fault,
            faultstring = fault.faultstring,
            faultcode = fault.faultcode;

        throw new Error(faultcode + ' ' + faultstring);
    }

    Services = res.query.results.Envelope.Body.SchedulenearbyResponse.Atstop.Service;
    if (!Array.isArray(Services)) {
        Services = [Services];
    }

    return Services;
};


module.exports = StopDetails;
