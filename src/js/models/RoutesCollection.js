var _ = require('underscore');
var fs = require('fs');
var ko = require('knockout');
var when = require('when');

var requests = require('../requests');
var Route = require('./Route');


function RoutesCollection() {
    this.routes = ko.observableArray();
}

_.extend(RoutesCollection.prototype, {
    fetchAll: function() {
        var promise = requests.get('data/routes.json')
            .then(function(data) {
                return data.map(function(routeData) {
                    return new Route(routeData);
                });
            })
            .then(function(routes) {
                return this.routes(routes);
            }.bind(this));

        return promise;
    }
});

module.exports = new RoutesCollection();
