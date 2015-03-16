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
    var proxyURL = 'http://scenic-cedar-88515.appspot.com/';
    var capURL = 'https://www.capmetro.org/planner/s_nextbus2.asp?stopid=' + this.stopID() + '&route=' + this.routeID();
    var params = {
        url: capURL,
    };

    this.errorMsg(null);

    function retryAtMost(maxRetries) {
        requests.get(proxyURL, params)
            .tap(function(res) {
                if (res.runs && res.runs.length > 0) {
                    this.tripCollection = new TripCollection(this.stopID(), this.routeID(), res.runs);
                }
                else {
                    this.errorMsg("No trips available at this time.");
                }
                deferred.resolve();
            }.bind(this))
            .catch(CapMetroAPIError, function(err) {
                window.Raven.captureException(err);
                window.Bugsnag.notify('CapMetroAPIError', err);
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
                window.Raven.captureException(err);
                window.Bugsnag.notifyException(err);
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

module.exports = StopDetails;
