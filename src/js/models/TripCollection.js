var when = require('when');
var utils = require('../utils');
var Trip = require('./Trip');
var requests = require('../requests');
var config = require('../config');

var CapMetroAPIError = config.errors.CapMetroAPIError();

var TripCollection = {
    fetch: function(route, direction, stop) {
        var deferred = when.defer(),
            yqlURL = 'http://query.yahooapis.com/v1/public/yql',
            capURL = 'http://www.capmetro.org/planner/s_service.asp?output=xml&opt=2&tool=SI&route=' + route + '&stopid=' + stop,
            params = {
                q: 'select * from xml where url="' + capURL + '"',
                format: 'json' // let yql do the conversion from xml to json
            };

        function retryAtMost(maxRetries) {
            requests.get(yqlURL, params)
                .then(this.parseResponse.bind(this, direction))
                .then(function(trips) {
                    deferred.resolve(trips);
                })
                .catch(CapMetroAPIError, function(err) {
                    var msg = err.message + '. Retrying ' + maxRetries + ' more times';
                    console.error(msg);
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
                    deferred.reject(err);
                });
        }

        retryAtMost.call(this, config.MAX_RETRIES);

        return deferred.promise;
    },
    parseResponse: function(direction, res) {
        var Service,
            Tripinfo,
            trips;

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
                return utils.getDirectionID(s.Route, s.Direction) === direction;
            })[0];
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
    }
};

module.exports = TripCollection;
