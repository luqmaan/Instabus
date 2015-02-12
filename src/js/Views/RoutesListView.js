var _ = require('underscore');
var fs = require('fs');
var ko = require('knockout');
var when = require('when');
var requests = require('../requests');
var Route = require('./RouteModel');
var routesListHTML = fs.readFileSync(__dirname + '/../templates/routes-list.html', 'utf8');

function RoutesCollection() {
    this.routeModels = ko.observableArray();
}

RoutesCollection.prototype.fetch = function() {
    return requests.get('data/routes.json')
        .then(function(data) {
            return data.map(function(routeData) {
                return new Route(routeData);
            });
        });
};


module.exports = new RoutesCollection();
