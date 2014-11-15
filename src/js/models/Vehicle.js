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
    // FIXME: Do these have to be observables? There isn't two way binding.
    // FIXME: yes they do
    this.id = this.vehicleID = Number(data.Vehicleid);
    this.route = data.Route;
    this.directionID = utils.getDirectionID(this.route, data.Direction);
    this.direction = utils.formatDirection(this.route, this.directionID);
    this.updateTime = data.Updatetime;
    this.block = data.Block;
    this.adherance = data.Adherance;
    this.adheranceChange = data.Adhchange;
    this.reliable = data.Reliable === "Y" ? true : false;
    this.offRoute = data.Offroute === "Y" ? true : false;
    this.stopped = data.Stopped === "Y" ? true : false;
    this.inService = data.Inservice === "Y" ? true : false;
    this.routeID = data.Routeid;
    this.speed = data.Speed;
    this.heading = data.Heading;

    this.updateReadable();

    this.positions = this.parsePositions(data.Positions.Position);

    this.oldestPos = this.positions[0];
    this.newestPos = this.positions[this.positions.length - 1];

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
        this.id = newVehicle.id;
        this.route = newVehicle.route;
        this.directionID = newVehicle.directionID;
        this.direction = newVehicle.direction;
        this.updateTime = newVehicle.updateTime;
        this.block = newVehicle.block;
        this.adherance = newVehicle.adherance;
        this.adheranceChange = newVehicle.adheranceChange;
        this.reliable = newVehicle.reliable === "Y" ? true : false;
        this.offRoute = newVehicle.offRoute === "Y" ? true : false;
        this.stopped = newVehicle.stopped === "Y" ? true : false;
        this.inService = newVehicle.inService === "Y" ? true : false;
        this.routeID = newVehicle.routeID;
        this.speed = newVehicle.speed;
        this.heading = newVehicle.heading;
        this.positions = newVehicle.positions;

        this.oldestPos = newVehicle.oldestPos;
        this.newestPos = newVehicle.newestPos;

        this.move();
        this.updateReadable();
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
    },
    remove: function(layer) {
        layer.removeLayer(this.marker);
    },
    newMarker: function() {
        var icon = L.divIcon({
            className: 'my-div-icon',
            html: vehicleMarkerSVG.replace('{vehicle-id}', this.id).replace('{vehicle-heading}', this.heading),
        });

        var marker = L.marker([this.oldestPos[0], this.oldestPos[1]], {
            icon: icon,
            color: '#fff',
            weight: 3,
            radius: 15,
            opacity: 1,
            fillOpacity: '0.9',
            fillColor: this.inService ? 'rgb(34,189,252)' : 'rgb(188,188,188)',
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
    },
    updateReadable: function() {
        this.reliableReadable = this.reliable ? "reliable": "unreliable";
        this.offRouteReadable = this.offRoute ? "off": "on";
        this.stoppedReadable = this.stopped ? "stopped": "moving";
        this.inServiceReadable = this.inService ? "In Service": "Not In Service";
    },
};

module.exports = Vehicle;
