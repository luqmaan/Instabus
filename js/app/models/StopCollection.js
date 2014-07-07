define(['jquery', 'leaflet', 'when', 'geolib', 'config', 'models/Stop'],
function($, L, when, geolib, config, Stop) {
    var StopCollection = {
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
            var points = stops.map(function(s) { return { latitude: s.lat(), longitude: s.lon()}; }),
                _latlng = {latitude: latlng.lat, longitude: latlng.lng },
                nearestPoint,
                stop;

            nearestPoint = geolib.findNearest(_latlng, points, 1);
            stop = stops[nearestPoint.key];

            stop.closest(true);
            document.getElementById('list').scrollTop = document.getElementById(stop.cssId()).offsetTop;
            stop.toggleTrips();

            return stop;
        }
    };

    return StopCollection;
});
