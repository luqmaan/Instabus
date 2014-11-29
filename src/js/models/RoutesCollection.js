var fs = require('fs');
var when = require('when');
var requests = require('../requests');
var Route = require('./Route');
var routesListHTML = fs.readFileSync(__dirname + '/../templates/routes-list.html', 'utf8');

function RoutesCollection() {
    this.routes = ko.observableArray();
    this.active = ko.observable();
};

RoutesCollection.prototype.start = function() {
    this.applyBindings();

    this.fetch()
        .tap(this.routes)
        // .then(this.defaultRoute.bind(this));
}

RoutesCollection.prototype.applyBindings = function() {
    var div = document.querySelector("#routes");
    div.innerHTML = routesListHTML;
    ko.applyBindings(this, div);
}

RoutesCollection.prototype.fetch = function() {
    return requests.get('data/routes.json')
        .then(function(data) {
            return data.map(function(routeData) {
                return new Route(routeData);
            });
        });
}

RoutesCollection.prototype.defaultRoute = function() {
    // var cachedRoute = JSON.parse(localStorage.getItem('rappid:route')),
    //     defaultRoute = this.availableRoutes()[0];
    // if (cachedRoute) {
    //     defaultRoute = this.availableRoutes().filter(function(r) { return cachedRoute.id === r.id && cachedRoute.direction === r.direction; })[0];
    // }
    // this.active(this.routes()[0].trips()[0]);

    // this.active.subscribe =>
    // localStorage.setItem('rappid:route', ko.toJSON(route));
}

RoutesCollection.prototype.selectTrip = function(_, route, direction) {
    console.log('this', this);
    console.log('arguments', arguments);
    route.activeDirection(direction);
    this.active(route);
}

module.exports = RoutesCollection;
