var _ = require('underscore');
var fs = require('fs');
var ko = require('knockout');
var when = require('when');
var requests = require('../requests');
var Route = require('./Route');
var routesListHTML = fs.readFileSync(__dirname + '/../templates/routes-list.html', 'utf8');

function RoutesCollection() {
    this.routeModels = ko.observableArray();
    window.addEventListener("hashchange", this.hashChange.bind(this));
    this.hashChange();
}

RoutesCollection.prototype.init = function() {
    var promise = this.fetch()
        .tap(this.applyBindings)
        .tap(this.hashChange.bind(this));

    return promise;
};

RoutesCollection.prototype.applyBindings = function() {
    var div = document.querySelector("#content-wrapper");
    div.innerHTML = routesListHTML;

    var inner = div.querySelector('.inner');
    ko.applyBindings(this, inner);
};

RoutesCollection.prototype.removeBindings = function() {
    var div = document.querySelector("#content-wrapper");
    var inner = div.querySelector('.inner');

    if (inner) {
        ko.cleanNode(inner);
        inner.remove();
    }
};

RoutesCollection.prototype.fetch = function() {
    return requests.get('data/routes.json')
        .then(function(data) {
            return data.map(function(routeData) {
                return new Route(routeData);
            });
        });
};

RoutesCollection.prototype.selectRoute = function(route) {
    console.log('Selecting route', route);
    var hash = '#/route/' + route.id();
    window.location.hash = hash;
};

RoutesCollection.prototype.findRouteById = function(routeId) {
    return _.find(this.routes(), function(route) {
        return route.id().toString() === routeId;
    });
};

RoutesCollection.prototype.hashChange = function() {
    if (location.hash === '#' || location.hash === '' || location.hash === '/') {
        console.log('/ found:', location.hash);
        this.active(null);
        this.removeBindings();
        this.applyBindings();
    }

    if (location.hash.match(/route\/\d+/g)) {
        var routeId = /route\/(\d+)/g.exec(location.hash)[1];
        var route;
        var routeChanged = this.active() && (routeId.toString() !== this.active().id().toString());

        // Hide the route list
        this.removeBindings();

        // Set the active route
        if (!this.active() || routeChanged) {
            console.log('/route/id/: The active route changed');
            route = this.findRouteById(routeId);
        }
    }
    else {
        this.active(null);
    }
};

module.exports = new RoutesCollection();
