define(['jquery', 'leaflet', 'when', 'config', 'models/Stop'],
function($, L, when, config, Stop) {
    function Stops(route, direction) {
        this.route = route;
        this.direction = direction;
        this._stops = null;
    }

    Stops.prototype = {
        fetch: function() {
            var deferred = when.defer();

            $.ajax({
                url: 'data/stops_' + this.route + '_' + this.direction + '.json'
            }).done(
                function(data) {
                    this._stops = data.map(function(stopData) {
                        return new Stop(stopData);
                    });

                    deferred.resolve();
                }.bind(this)
            ).fail(
                function(a, b, err) {
                    console.error(err);
                    deferred.reject(err);
                }
            );

            return deferred.promise;
        },
        draw: function(layer) {
            this._stops.forEach(function(stop) {
                stop.marker.addTo(layer);
            });
        }
    };

    return Stops;
});
