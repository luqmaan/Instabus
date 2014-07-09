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
            if (!stops.length) return;

            var points = stops.map(function(s) { return { latitude: s.lat(), longitude: s.lon()}; }),
                _latlng = {latitude: latlng.lat, longitude: latlng.lng },
                nearestPoint,
                stop,
                k;

            nearestPoint = geolib.findNearest(_latlng, points, 1);

            // for some reason the nearest point is off by one, in opposite ways depending on the route
            k = parseInt(nearestPoint.key);
            stop = stops[k];
            if (stop.direction() === 0) {
                stop = stops[k + 1];
            }
            else if (stop.direction() === 1) {
                stop = stops[k - 1];
            }

            stop.closest(true);
            document.body.scrollTop = document.getElementById(stop.cssId()).offsetTop;  // mobile
            document.getElementById('list').scrollTop = document.getElementById(stop.cssId()).offsetTop;  // desktop
            stop.toggleTrips();

            return stop;
        }
    };

    return StopCollection;
});
