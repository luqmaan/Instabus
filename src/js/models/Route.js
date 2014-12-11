var ko = require('knockout');

function Route(data) {
    this.type = ko.observable(data.route_type);
    this.id = ko.observable(data.route_id);
    this.name = ko.observable(data.name);
    this.directions = ko.observableArray(this.parseDirections(data));
    this.activeDirection = ko.observable();  // RoutesCollection sets activeDirection
    this.directionId = ko.computed(function() {
        if (this.activeDirection()) {
            return this.activeDirection().directionId();
        }
    }.bind(this));
    this.headsign = ko.computed(function() {
        if (this.activeDirection()) {
            return this.activeDirection().headsign();
        }
    }.bind(this));

    this.showDirections = ko.observable(false);
    this.toggleText = ko.computed(function() {
        if (this.showDirections()) {
            return '-';
        }
        return '+';
    }.bind(this));
}

function RouteDirection(direction) {
    this.directionId = ko.observable(direction.direction_id);
    this.headsign = ko.observable(direction.headsign);
}

Route.prototype.parseDirections = function(data) {
    return data.directions.map(function(direction) {
        return new RouteDirection(direction);
    });
};

Route.prototype.toggleDirections = function() {
    this.showDirections(!this.showDirections());
};


module.exports = Route;
