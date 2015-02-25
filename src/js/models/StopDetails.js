var _ = require('underscore');
var ko = require('knockout');
var when = require('when');

var requests = require('../requests');
var utils = require('../utils');
var config = require('../config');
var TripCollection = require('./TripCollection');

var CapMetroAPIError = config.errors.CapMetroAPIError();

function StopDetails(routeID, directionID, stopID) {
    this.routeID = ko.observable(routeID);
    this.directionID = ko.observable(directionID);
    this.stopID = ko.observable(stopID);

    this.errorMsg = ko.observable();
    this.loading = ko.observable(true);

    this.tripCollection = null;
}

StopDetails.prototype.fetch = function() {
    var deferred = when.defer();
    var yqlURL = 'http://query.yahooapis.com/v1/public/yql';
    var capURL = 'http://www.capmetro.org/planner/s_nextbus2.asp?stopid=' + this.stopID() + '&route=' + this.routeID();
    var params = {
        q: 'select * from xml where url="' + capURL + '"',
        format: 'json'
    };

    this.errorMsg(null);

    function retryAtMost(maxRetries) {
        requests.get(yqlURL, params)
            .then(this.parseResponse.bind(this))
            .tap(function(Runs) {
                if (Runs.length > 0) {
                    this.tripCollection = new TripCollection(this.stopID(), this.routeID(), Runs);
                }
                else {
                    this.errorMsg("No trips available at this time.");
                }
                deferred.resolve();
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
    // har de har
    var Runs;

    if (!res.query.results || !res.query.results.Envelope) {
        throw new CapMetroAPIError('The CapMetro Stop Arrival Times API is unavailable');
    }

    if (res.query.results.Envelope.Body.Fault) {
        var fault = res.query.results.Envelope.Body.Fault,
            faultstring = fault.faultstring,
            faultcode = fault.faultcode;

        throw new Error(faultcode + ' ' + faultstring);
    }
    Runs = res.query.results.Envelope.Body.Nextbus2Response.Runs.Run;

    if (!Array.isArray(Runs)) {
        Runs = [Runs];
    }
    return Runs;
};

module.exports = StopDetails;
