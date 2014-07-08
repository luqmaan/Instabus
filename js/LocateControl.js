define(['leaflet', 'when'],
function(leaflet, when) {
    var LocateControl = leaflet.Control.extend({
        userLatLng: [0, 0],
        innerMarker: null,
        outerMarker: null,
        map: null,
        options: {
            icon: 'icon-location',
            position: 'topleft',
            zoomLevel: 16,
            pollInterval: 30 * 1000
        },
        onAdd: function (map) {
            this.container = leaflet.DomUtil.create('div', 'locate-control leaflet-bar leaflet-control');
            this.map = map; // i wonder if this will cause memory leak

            var link = leaflet.DomUtil .create('a', 'leaflet-bar-part leaflet-bar-part-single ' + this.options.icon, this.container);

            leaflet.DomEvent
                .on(link, 'click', leaflet.DomEvent.stopPropagation)
                .on(link, 'click', leaflet.DomEvent.preventDefault)
                .on(link, 'click', this.zoomToLocation.bind(this))
                .on(link, 'dblclick', leaflet.DomEvent.stopPropagation);

            this.locate();

            return this.container;
        },
        zoomToLocation: function(map) {
            this.map.setView(this.userLatLng, this.options.zoomLevel);
        },
        locate: function() {
            this.container.classList.add('loading');

            this.map.locate({
                maximumAge: 1000,
                enableHighAccuracy: true,
                watch: true
            });

            this.map.on('locationfound', function(e) {
                console.log('Found location', e.latlng, 'Accuracy', e.accuracy);
                this.userLatLng = e.latlng;
                this.updateMarkers();
                this.container.classList.remove('loading');
             }.bind(this));

            this.map.on('locationerror', function(e) {
                console.error('Unable to find location', e.message);
                this.container.classList.remove('loading');
            }.bind(this));
        },
        updateMarkers: function() {
            if (!this.innerMarker || !this.outerMarker) {
                this.createMarkers(this.map);
            }

            this.innerMarker.setLatLng(this.userLatLng);
            this.outerMarker.setLatLng(this.userLatLng);
        },
        createMarkers: function() {
            this.innerMarker = leaflet.circleMarker(this.userLatLng,{
                weight: 0,
                fillColor: 'rgb(16,94,251)',
                fill: true,
                fillOpacity: 1,
                radius: 5
            });
            this.outerMarker = leaflet.circleMarker(this.userLatLng, {
                color: 'rgb(20,130,210)',
                opacity: 1,
                weight: 2,
                fillColor: 'rgb(108,196,253)',
                fill: true,
                fillOpacity: 0.4,
                radius: 15
            });
            this.outerMarker.addTo(this.map);
            this.outerMarker.bindPopup('Current Location');
            this.innerMarker.addTo(this.map);
        }
    });

    return LocateControl;
});
