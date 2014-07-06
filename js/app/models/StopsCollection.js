define(['jquery', 'leaflet', 'when', 'config', 'models/Stop'],
function($, L, when, config, Stop) {
    var StopsCollection = {
        fetch: function(route, direction) {
            var deferred = when.defer();

            $.ajax({
                url: 'data/stops_' + route + '_' + direction + '.json'
            }).done(
                function(data) {
                    var stops = data.map(function(stopData) {
                        return new Stop(stopData);
                    });

                    deferred.resolve(stops);
                }
            ).fail(
                function(a, b, err) {
                    console.error(err);
                    deferred.reject(err);
                }
            );

            return deferred.promise;
        },
        draw: function(stops, layer) {
            stops.forEach(function(stop) {
                stop.marker.addTo(layer);
            });
        },
        closest: function(stops, latlng) {
            return ;  // return the closest stop in stops
        }
    };

    return StopsCollection;
});
