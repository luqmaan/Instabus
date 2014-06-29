define(['jquery', 'when'],
function($, when) {

    function Routes(routes) {
        this._routes = routes;
    }

    Routes.prototype = {
        fetch: function() {
            var deferred = when.defer();

            $.ajax({
                url: 'data/routes.json'
            }).done(
                function(data) {
                    this._routes = data.map(function(row) {
                        return row;
                    });

                    deferred.resolve();
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
    return Routes;
});
