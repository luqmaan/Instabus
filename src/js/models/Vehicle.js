var ko = require('knockout');
var L = require('leaflet');
var fs = require('fs');
var moment = require('moment');
require('leaflet.label');
var config = require('../config');
var utils = require('../utils');
var vehiclePopupHTML = fs.readFileSync(__dirname + '/../templates/vehicle-popup.html', 'utf8');
var vehicleMarkerSVG = fs.readFileSync(__dirname + '/../templates/vehicle-marker.svg', 'utf8');

// https://github.com/danro/jquery-easing/blob/818a47a97fa5ea25f1e4c8a6121e0bca9407d51a/jquery.easing.js
function easeInOutCubic(t, b, c, d) {
    if ((t/=d/2) < 1) return c/2*t*t*t + b;
    return c/2*((t-=2)*t*t + 2) + b;
}

function animateMarker(marker, i, steps, startLatLng, deltaLatLng) {
    var x = easeInOutCubic(i, startLatLng[0], deltaLatLng[0], steps),
    y = easeInOutCubic(i, startLatLng[1], deltaLatLng[1], steps);

    marker.setLatLng([x, y]);

    if (i < steps) {
        L.Util.requestAnimFrame(animateMarker.bind(null, marker, i + 1, steps, startLatLng, deltaLatLng), null, false, marker._container);
    }
}

function prettyTime(aMoment) {
    var secondsAgo = Math.abs(aMoment.diff(moment(), 'seconds'));
    if (secondsAgo < 60) {
        return secondsAgo + 's';
    }

    var diff = Math.abs(aMoment.diff(moment(), 'minutes'));
    if (diff <= 60) {
        return diff + 'm ' + (secondsAgo % 60) + 's';
    }
    diff = Math.abs(aMoment.diff(moment(), 'hours'));
    return diff + 'h';
}

function directionForHeadsign(headsign) {
    var head = headsign.toLowerCase();

    if (head.indexOf('-eb') !== -1) {
        return 'East';
    }
    if (head.indexOf('-wb') !== -1) {
        return 'West';
    }
    if (head.indexOf('-nb') !== -1) {
        return 'North';
    }
    if (head.indexOf('-sb') !== -1) {
        return 'South';
    }
    return headsign;
}


function obaResponseAsTurd(res) {
    var time = moment.unix(res.vehicle.timestamp);
    var updatetime = prettyTime(time) + ' ago';

    var location = res.vehicle.position ? [res.vehicle.position.latitude, res.vehicle.position.longitude] : [null, null];

    var heading = res.vehicle.position.bearing;

    return {
        vehicleid: res.vehicle.vehicle.id,
        location: location,
        routeid: res.vehicle.trip.route_id,
        direction: '',
        updatetime: updatetime,
        inservice: '',
        heading: heading,
    };
}

function Vehicle(res) {
    var data = obaResponseAsTurd(res);

    this.id = this.vehicleID = data.vehicleid;
    this.location = data.location;

    // observables
    this.route = ko.observable(data.routeid);
    this.direction = ko.observable(data.direction);
    this.directionID = ko.observable(utils.getDirectionID(this.route(), data.direction));
    this.updateTime = ko.observable(data.updatetime);
    this.inService = ko.observable(data.inservice === "Y" ? true : false);
    this.routeID = ko.observable(Number(data.routeid));
    this.heading = ko.observable(Number(data.heading) * 10);  // heading is a value between 0 and 36

    // computeds
    this.lat = ko.observable(this.location[0]);
    this.lon = ko.observable(this.location[1]);
    this.inServiceReadable = ko.computed(function() { return this.inService() ? "In Service": "Not In Service"; }.bind(this));
    this.svgTransform = ko.computed(function() { return "rotate(" + this.heading() + " 15 15)"; }.bind(this));

    this.marker = this.newMarker();
}

Vehicle.prototype = {
    parseLocationString: function (location) {
        var pos = location.split(',');
        return [Number(pos[0]), Number(pos[1])];
    },
    update: function(newVehicle) {
        this.route(newVehicle.route());
        this.directionID(newVehicle.directionID());
        this.direction(newVehicle.direction());
        this.updateTime(newVehicle.updateTime());
        this.inService(newVehicle.inService());
        this.routeID(newVehicle.routeID());
        this.heading(newVehicle.heading());

        this.location = newVehicle.location;

        this.marker.label._content = this.updateTime() + ' ' +  this.direction();
        this.marker.label._update();

        this.move();
    },
    animateTo: function(lat, lng, steps) {
        steps = steps || config.DEFAULT_MARKER_ANIMATION_STEPS;
        var deltaLatLng = [lat - this.marker.getLatLng().lat, lng - this.marker.getLatLng().lng];
        if (document.visibilityState === 'visible') {
            animateMarker(this.marker, 0, steps, [this.marker.getLatLng().lat, this.marker.getLatLng().lng], deltaLatLng);
        }
        else {
            this.marker.setLatLng([lat, lng]);
        }
    },
    draw: function(layer) {
        var steps = 50;

        this.marker.addTo(layer);
    },
    move: function() {
        this.animateTo(this.location[0], this.location[1]);
        this.rotate();
    },
    rotate: function() {
        var path = this.marker._icon.querySelector('g .Arrow');
        path.setAttribute("transform", this.svgTransform());
    },
    remove: function(layer) {
        layer.removeLayer(this.marker);
    },
    newMarker: function() {
        var svg = vehicleMarkerSVG.replace('{svg-transform}', this.svgTransform());
        var icon = L.divIcon({
            className: 'vehicle-icon',
            html: svg,  // has to be string, otherwise could data-bind this.svgTransform
        });

        var marker = L.marker([this.location[0], this.location[1]], {
            icon: icon,
            zIndexOffset: config.VEHICLE_Z_INDEX
        });

        marker.bindPopup(this.popupContent());
        marker.bindLabel(this.updateTime() + ' ' + this.direction(), {
            noHide: true,
            direction: 'left',
            className: 'vehicle-leaflet-label',
            offset: [25, -10],
        });

        return marker;
    },
    popupContent: function() {
        var div = document.createElement('div');
        div.innerHTML = vehiclePopupHTML;
        ko.applyBindings(this, div);
        return div;
    }
};

module.exports = Vehicle;
