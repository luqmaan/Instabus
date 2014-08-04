var $ = require('jquery');
var when = require('when');

var RoutesCollection = {
    fetch: function() {
        var deferred = when.defer();

        $.ajax({
            url: 'data/routes.json'
        }).done(
            function(data) {
                var routes = data.map(function(row) {
                    return row;
                });

                deferred.resolve(routes);
            }.bind(this)
        ).fail(
            function(xhr, status, err) {
                console.error(err);
                deferred.reject(err);
            }
        );

        return deferred.promise;
    }
};

module.exports = RoutesCollection;
