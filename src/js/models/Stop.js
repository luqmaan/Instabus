var ko = require('knockout');
var when = require('when');
var leaflet = require('leaflet');
var moment = require('moment');
require('leaflet.label');
var StopDetails = require('./StopDetails');
var fs = require('fs');
var config = require('../config');
var requests = require('../requests');

var stopPopupHTML = fs.readFileSync(__dirname + '/../templates/stop-popup.html', 'utf8');

var uniqueTrips = window.uniqueTrips = {};


function Stop(data) {
    var stop_name = data.stop_name.replace('(SB)', '').replace('(NB)', '');
    this.name = ko.observable(stop_name);
    this.stopID = ko.observable(data.stop_id);
    this.directionID = ko.observable(parseInt(data.direction_id));
    this.routeID = ko.observable(parseInt(data.route_id));
    this.code = ko.observable(data.stop_code);
    this.desc = ko.observable(data.stop_desc);
    this.lat = ko.observable(data.stop_lat);
    this.lon = ko.observable(data.stop_lon);
    this.timezone = ko.observable(data.stop_timezone);
    this.url = ko.observable(data.url);

    this.stopDetails = new StopDetails(this.routeID(), this.directionID(), this.stopID());
    this.trips = ko.observableArray();
    this.transitimeTrips = ko.observableArray();

    this._errorMsg = ko.observable();
    this.errorMsg = ko.computed(function() {
        return this.stopDetails.errorMsg() || this._errorMsg();
    }, this);

    this.cssId = ko.observable('stop-' + data.stop_id);

    this.showTrips = ko.observable(false);
    this.loadedTrips = ko.observable(false);
    this.loading = ko.observable(false);
    this.showProgress = ko.computed(function() {
        // don't show after the first load
        return this.loading() && !this.loadedTrips();
    }.bind(this));

    this.color = 'rgb(199,16,22)';

    this.marker = leaflet.circleMarker([this.lat(), this.lon()], {
        color: 'white',
        opacity: 1,
        weight: 3,
        fillColor: this.color,
        fill: true,
        fillOpacity: 1,
        radius: 12,
        zIndexOffset: config.STOP_Z_INDEX
    });

    this.marker.bindLabel(this.name(), {
        noHide: false,
        direction: 'right',
        className: 'stop-leaflet-label',
        offset: [15, -10],
        clickable: true
   });

    this.marker.on('click', this.centerMarker.bind(this));
    this.marker.on('click', this.stopClicked.bind(this));
}

Stop.prototype = {
    stopClicked: function() {
        var hash = '#/route/' + this.routeID() + '/direction/' + this.directionID() + '/stop/' + this.stopID();
        location.hash = hash;
    },
    refresh: function() {
        this.loading(true);

        this.stopDetails.fetch()
            .progress(function(msg) {
                this._errorMsg(msg);
            }.bind(this))
            .then(function() {
                if (this.stopDetails.tripCollection) {
                    this.trips(this.stopDetails.tripCollection.trips());
                }
                this.loadedTrips(true);
                this.loading(false);
                this._errorMsg(null);
            }.bind(this))
            .catch(function(e) {
                window.Raven.captureException(e);
                window.Bugsnag.notifyException(e);
                this.loadedTrips(false);
                this.loading(false);
                this._errorMsg(e.message);
            }.bind(this));

        this.transitimeRefresh();
    },
    setupMarker: function() {
        this.marker.bindPopup(this.popupContent());
        this.marker.openPopup();
    },
    popupContent: function() {
        var div = document.createElement('div');
        div.innerHTML = stopPopupHTML;
        ko.applyBindings(this, div);
        return div;
    },
    centerMarker: function() {
        try {
            this.marker._map.setView(this.marker._latlng);
        }
        catch (e) {
            console.log('Marker does not have ._map yet, retrying in 1000ms', e);
            setTimeout(function() {
                this.marker._map.setView(this.marker._latlng);
            }.bind(this), 1000);
        }
    },
    transitimeRefresh: function() {
        if (!localStorage.getItem('showtransitime')) {
            return;
        }

        var routeStop = this.routeID() + '|' + this.stopID();
        var url = 'http://crossorigin.me/http://transitime-host.cloudapp.net/api/v1/key/f18a8240/agency/cap-metro/command/predictions?rs=' + routeStop;
        var routeID = this.routeID;

        return requests.get(url)
            .then(function (data) {
                var transitimeTrips = data.predictions[0].dest[0].pred.map(function(prediction) {
                    var intervalId;
                    var trip = {
                        route: routeID,
                        moment: moment.unix(prediction.time),
                        prettySeconds: ko.observable(),
                        prettyMinutes: ko.observable(),
                        prettyHour: ko.observable(),
                        old: ko.observable(),
                    };

                    function seconds() {
                        return (trip.moment.diff(moment(), 'seconds') % 60) + 's';
                    }
                    function minutes() {
                        var diff = trip.moment.diff(moment(), 'minutes');
                        if (diff < 60) {
                            return diff + 'm';
                        }
                        else {
                            diff = trip.moment.diff(moment(), 'hours');
                            return diff + 'h';
                        }
                    }
                    function hours() {
                        return trip.moment.format('h:mm');
                    }
                    function old() {
                        return !trip.moment.isAfter();
                    }
                    function calculate() {
                        console.log('interval', intervalId);
                        trip.prettySeconds(seconds());
                        trip.prettyMinutes(minutes());
                        trip.prettyHour(hours());
                        trip.old(old());
                    }

                    if (uniqueTrips[prediction.trip]) {
                        clearInterval(uniqueTrips[prediction.trip]);
                    }
                    uniqueTrips[prediction.trip] = intervalId = setInterval(calculate, 1000);

                    calculate();

                    return trip;
                });

                return transitimeTrips;
            }.bind(this))
            .then(function(transitimeTrips) {
                console.log('transitimeTrips', transitimeTrips);
                this.transitimeTrips(transitimeTrips);
            }.bind(this))
            .catch(function(err) {
                console.error(err);
                window.Raven.captureException(e);
            });
    }
};

module.exports = Stop;
