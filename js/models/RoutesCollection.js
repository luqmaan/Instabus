var when = require('when');
var requests = require('../requests');

var RoutesCollection = {
    fetch: function() {
        var deferred = when.defer();

        requests.get('data/routes.json')
            .then(function(data) {
                var routes = data.map(function(row) {
                    return row;
                });

                deferred.resolve(routes);
            })
            .catch(function(err) {
                console.error(err);
                deferred.reject(err);
            });

        return deferred.promise;
    }
};

module.exports = RoutesCollection;
