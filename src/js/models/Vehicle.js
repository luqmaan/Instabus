var ko = require('knockout');
var L = require('leaflet');
var config = require('../config');
var utils = require('../utils');
var fs = require('fs');
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

function Vehicle(data) {
    this.id = this.vehicleID = Number(data.Vehicleid);
    this.positions = this.parsePositions(data.Positions.Position);
    this.oldestPos = this.positions[0];
    this.newestPos = this.positions[this.positions.length - 1];

    // observables
    this.route = ko.observable(data.Route);
    this.directionID = ko.observable(utils.getDirectionID(this.route(), data.Direction));
    this.direction =  ko.observable(utils.formatDirection(this.route(), this.directionID()));
    this.updateTime = ko.observable(data.Updatetime);
    this.inService = ko.observable(data.Inservice === "Y" ? true : false);
    this.routeID = ko.observable(data.Routeid);
    this.heading = ko.observable(data.Heading * 10);  // heading is a value between 0 and 36

    // computeds
    this.lat = ko.computed(function() { return this.newestPos[0]; }.bind(this));
    this.lon = ko.computed(function() { return this.newestPos[1]; }.bind(this));
    this.inServiceReadable = ko.computed(function() { return this.inService() ? "In Service": "Not In Service"; }.bind(this));
    this.svgTransform = ko.computed(function() { return "scale(1.5) rotate(" + this.heading() + " 15 15)"; }.bind(this));

    this.marker = this.newMarker();
}

Vehicle.prototype = {
    parsePositions: function (positions) {
        if (!Array.isArray(positions)) {
            positions = [positions];
        }
        var parsed = positions.map(function(pos) {
            pos = pos.split(',');
            return [Number(pos[0]), Number(pos[1])];
        });

        // reverse so the positions are in chronological order
        parsed.reverse();

        return parsed;
    },
    update: function(newVehicle) {
        this.route(newVehicle.route());
        this.directionID(newVehicle.directionID());
        this.direction(newVehicle.direction());
        this.updateTime(newVehicle.updateTime());
        this.inService(newVehicle.inService());
        this.routeID(newVehicle.routeID());
        this.heading(newVehicle.heading());

        this.positions = newVehicle.positions;
        this.oldestPos = newVehicle.oldestPos;
        this.newestPos = newVehicle.newestPos;

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

        this.positions.forEach(function(pos) {
            this.animateTo(pos[0], pos[1], steps);
        }.bind(this));
    },
    move: function() {
        this.animateTo(this.newestPos[0], this.newestPos[1]);
        this.rotate();
    },
    rotate: function() {
        var g = this.marker._icon.querySelector('g');
        g.setAttribute("transform", this.svgTransform());
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

        var marker = L.marker([this.oldestPos[0], this.oldestPos[1]], {
            icon: icon,
            zIndexOffset: config.VEHICLE_Z_INDEX
        });

        marker.bindPopup(this.popupContent());

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
