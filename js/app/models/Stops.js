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
            var color = 'rgb(199,16,22)';

            this._stops.forEach(function(stop) {
                var marker = L.circleMarker([stop.lat(), stop.lon()], {
                        color: 'white',
                        opacity: 1,
                        weight: 3,
                        fillColor: color,
                        fill: true,
                        fillOpacity: 1,
                        radius: 10,
                        zIndexOffset: config.stopZIndex
                    });

                marker.bindPopup(stop.popupContent());
                marker.addTo(layer);

                marker.addEventListener('click', function(e) {
                    if (!stop.showTrips()) {
                        stop.loadTrips();
                    }
                });
            });
        }
    };

    return Stops;
});
