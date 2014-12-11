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
    this.applyBindings();

    return this.fetch()
                .tap(this.routes)
                .tap(this.setupCache.bind(this))
                .tap(this.restoreCache.bind(this));
};

RoutesCollection.prototype.applyBindings = function() {
    var div = document.querySelector("#routes");
    div.innerHTML = routesListHTML;
    ko.applyBindings(this, div);
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

RoutesCollection.prototype.select = function(_, route, direction) {
    console.log('Selecting route', route, direction);
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

    console.log('wefwef', route, direction);

    if (route && direction) {
        this.select(route, direction);
    }

    return route, direction;
};

module.exports = RoutesCollection;
