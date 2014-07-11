define(['knockout', 'when', 'leaflet', 'models/TripCollection', 'text!templates/stop-popup.html', 'config'],
function(ko, when, leaflet, TripCollection, stopPopupHTML, config) {
    function Stop(data) {
        var stop_name = data.stop_name.replace('(SB)', '').replace('(NB)', '');
        this.name = ko.observable(stop_name);
        this.direction = ko.observable(parseInt(data.direction_id));
        this.route = ko.observable(parseInt(data.route_id));
        this.code = ko.observable(data.stop_code);
        this.desc = ko.observable(data.stop_desc);
        this.id = ko.observable(data.stop_id);
        this.lat = ko.observable(data.stop_lat);
        this.lon = ko.observable(data.stop_lon);
        this.timezone = ko.observable(data.stop_timezone);
        this.url = ko.observable(data.url);

        this.trips = ko.observableArray();

        this.closest = ko.observable(false);
        this.cssId = ko.observable('stop-' + data.stop_id);

        this.showTrips = ko.observable(false);
        this.loadedTrips = ko.observable(false);
        this.loading = ko.observable(false);
        this.showProgress = ko.computed(function() {
            // don't show after the first load
            return this.loading() && !this.loadedTrips();
        }.bind(this));

        this.color = 'rgb(199,16,22)';

        this.marker = leaflet.circleMarker([this.lat(), this.lon()], {
                color: 'white',
                opacity: 1,
                weight: 3,
                fillColor: this.color,
                fill: true,
                fillOpacity: 1,
                radius: 8,
                zIndexOffset: config.stopZIndex
            });

        this.marker.bindPopup(this.popupContent());

        this.marker.addEventListener('click', function(e) {
            if (!this.loadedTrips()) {
                this.loadTrips().catch(console.error);
            }
        }.bind(this));
    }

    Stop.prototype = {
        toggleTrips: function() {
            this.showTrips(!this.showTrips());

            if (this.showTrips()) {
                this.marker.openPopup();
            }
            else {
                this.marker.closePopup();
            }

            if (!this.loadedTrips()) {
                this.loadTrips().then(
                    null,  // FIXME: Should make the map fit the popup
                    console.error
                );
            }
        },
        loadTrips: function() {
            var deferred = when.defer();

            this.showTrips(true);
            this.loading(true);

            TripCollection.fetch(this.route(), this.direction(), this.id()).then(
                function(trips) {
                    this.trips(trips);
                    this.loading(false);
                    this.loadedTrips(true);
                    deferred.resolve();
                }.bind(this),
                function(e) {
                    this.loading(false);
                    if (e.message.indexOf('20005') !== -1) {
                        // fault 20005 = #20005--No service at origin at the date/time specified
                        this.loadedTrips(true);
                    }
                    deferred.reject(e);
                }.bind(this)
            );

            return deferred.promise;
        },
        refresh: function() {
            if (this.showTrips()) {
                return this.loadTrips();
            }
        },
        popupContent: function() {
            var div = document.createElement('div');
            div.innerHTML = stopPopupHTML;
            ko.applyBindings(this, div);
            return div;
        }
    };

    return Stop;
});
