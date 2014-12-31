var _ = require('underscore');
var fs = require('fs');
var ko = require('knockout');
var when = require('when');
var requests = require('../requests');
var Route = require('./Route');
var routesListHTML = fs.readFileSync(__dirname + '/../templates/routes-list.html', 'utf8');

function RoutesCollection() {
    this.routes = ko.observableArray();
    this.active = ko.observable();
}

RoutesCollection.prototype.start = function() {
    window.addEventListener("hashchange", this.hashChange.bind(this));

    var promise = this.fetch()
        .tap(this.routes)
        .tap(this.setupCache.bind(this))
        .tap(this.restoreCache.bind(this))
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

RoutesCollection.prototype.setupCache = function() {
    this.active.subscribe(function(route) {
        if (!route) {
            return;
        }
        var key = 'rappid:route:id';
        var item = route.id();
        console.debug('localstorage', key, item);
        localStorage.setItem(key, item);
    }.bind(this));
};

RoutesCollection.prototype.restoreCache = function() {
    var cachedRouteID = localStorage.getItem('rappid:route:id'),
        filteredRoutes,
        route;

    console.log('cachedRouteID', cachedRouteID);

    if (cachedRouteID) {
        filteredRoutes = this.routes().filter(function(r) {
            return cachedRouteID.toString() === r.id().toString();
        });
        if (filteredRoutes) {
            route = filteredRoutes[0];
            route.showDirections(true);
            console.log('Restoring cached route', route);
        }
    }
};

RoutesCollection.prototype.selectClicked = function(routedirection, route, direction, e) {
    console.log('Selecting route', route, direction);
    var hash = '#/route/' + route.id() + '/direction/' + direction.directionId();
    location.hash = hash;
    route.activeDirection(direction);
    this.active(route);
};

RoutesCollection.prototype.findAndSelectRouteDirection = function(routeId, directionId) {
    var route = _.find(this.routes(), function(route) {
        return route.id().toString() === routeId;
    });
    var direction;

    if (route) {
        direction = _.find(route.directions(), function(direction) {
            return direction.directionId().toString() === directionId;
        });
    }

    if (route && direction) {
        console.log('Selecting route', route, direction);
        route.activeDirection(direction);
        this.active(route);
    }
};

RoutesCollection.prototype.hashChange = function() {

    if (location.hash === '#' || location.hash === '' || location.hash === '/') {
        this.active(null);
        this.removeBindings();
        this.applyBindings();
    }

    if (location.hash.match(/route\/\d+\/direction\/\d+/g)) {
        this.removeBindings();

        var routeId = /route\/(\d+)/g.exec(location.hash)[1];
        var directionId = /direction\/(\d+)/g.exec(location.hash)[1];

        if (!this.active()) {
            console.log('First time');
            this.findAndSelectRouteDirection(routeId, directionId);
        }
        else {
            var routeChanged = routeId.toString() !== this.active().id().toString();
            var directionChanged = directionId.toString() !== this.active().directionId().toString();

            if (routeChanged || directionChanged) {
                console.debug('/route/direction: found', location.hash);
                this.findAndSelectRouteDirection(routeId, directionId);
            }
        }
    }
    else {
        this.active(null);
    }
};

module.exports = RoutesCollection;
