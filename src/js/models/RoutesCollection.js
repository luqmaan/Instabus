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
    var inner = div.querySelector('.inner');

    if (inner) {
        ko.cleanNode(inner);
        inner.remove();
    }
    div.innerHTML = routesListHTML;
    inner = div.querySelector('.inner');
    ko.applyBindings(this, inner);
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
        var key = 'rappid:route:id',
            item = route.id();
        console.debug(key, item);
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
    // history.pushState(null, null, hash);
    route.activeDirection(direction);
    this.active(route);
};

RoutesCollection.prototype.findAndSelect = function(routeId, directionId) {
    var route = this.routes().filter(function(route) {
        return route.id().toString() === routeId;
    });
    var direction;

    route = route.length ? route[0]: null;

    if (route) {
        direction = route.directions().filter(function(direction) {
            return direction.directionId().toString() === directionId;
        });
        direction = direction.length ? direction[0]: null;
    }

    if (route && direction) {
        console.log('Selecting route', route, direction);
        route.activeDirection(direction);
        this.active(route);
    }

    return route, direction;
};

RoutesCollection.prototype.hashChange = function() {
    if (location.hash === '#' || location.hash === '' || location.hash === '/') {
        this.applyBindings();
    }

    if (location.hash.match(/route\/\d+\/direction\/\d+/g)) {
        var routeId = /route\/(\d+)/g.exec(location.hash)[1];
        var directionId = /direction\/(\d+)/g.exec(location.hash)[1];

        if (!this.active()) {
            console.log('First time');
            this.findAndSelect(routeId, directionId);
        }
        else {
            var routeChanged = routeId !== this.active().id();
            var directionChanged = directionId !== this.active().directionId();

            console.log('Route changed?', routeChanged, 'directionChanged?', directionChanged);

            if (routeChanged || directionChanged) {
                this.findAndSelect(routeId, directionId);
            }
        }
    }
};

module.exports = RoutesCollection;
