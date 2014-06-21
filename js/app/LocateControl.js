define(['libs/leaflet-src'],
function(L) {
    var LocateControl = L.Control.extend({
        options: {
            icon: 'icon-location',
            position: 'topleft',
            zoomLevel: 16,
        },
        onAdd: function (map) {
            var container = L.DomUtil.create('div', 'locate-control leaflet-bar leaflet-control'),
                link = L.DomUtil.create('a', 'leaflet-bar-part leaflet-bar-part-single ' + this.options.icon, container);

            this.locate = function() {
                container.classList.add('loading');

                map.locate({maximumAge: 1000, enableHighAccuracy: true});
                map.on('locationfound', function onLocationFound(e) {
                    var radius = e.accuracy / 2;
                    console.log('found location:', e.latlng, 'accuracy:', e.accuracy);

                    container.classList.remove('loading');

                    map.setView(e.latlng, this.options.zoomLevel, {
                        zoom: {
                            animate: true
                        },
                        pan: {
                            animate: true
                        },
                    });
                    if (!this.locationMarker) {
                        this.circleMarker = L.circleMarker(e.latlng, {
                            color: 'rgb(20,130,210)',
                            opacity: 1,
                            weight: 2,
                            fillColor: 'rgb(108,196,253)',
                            fill: true,
                            fillOpacity: 0.4,
                            radius: 15
                        }).addTo(map);
                        this.locationMarker = L.circleMarker(e.latlng,{
                            weight: 0,
                            fillColor: 'rgb(16,94,251)',
                            fill: true,
                            fillOpacity: 1,
                            radius: 5
                        }).addTo(map);
                        this.circleMarker.bindPopup('Current Location');
                    }
                    this.locationMarker.setLatLng(e.latlng);
                    console.log('circle marker', this.circleMarker);
                    this.circleMarker.setLatLng(e.latlng);

                }.bind(this));

                map.on('locationerror', function onLocationError(e) {
                    console.log('unable to find location: ', e.message);
                    container.classList.remove('loading');
                });

            };

            L.DomEvent
                .on(link, 'click', L.DomEvent.stopPropagation)
                .on(link, 'click', L.DomEvent.preventDefault)
                .on(link, 'click', this.locate.bind(this))
                .on(link, 'dblclick', L.DomEvent.stopPropagation);

            return container;
        }
    });

    return LocateControl;
});
