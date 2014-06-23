define(['libs/knockout', 'models/TripCollection'],
function(ko, TripCollection) {
    function Stop(data) {
        this.name = ko.observable(data.stop_name);
        this.direction = ko.observable(parseInt(data.direction_id));
        this.route = ko.observable(parseInt(data.route_id));
        this.code = ko.observable(data.stop_code);
        this.desc = ko.observable(data.stop_desc);
        this.id = ko.observable(data.stop_id);
        this.lat = ko.observable(data.stop_lat);
        this.lon = ko.observable(data.stop_lon);
        this.name = ko.observable(data.stop_name);
        this.timezone = ko.observable(data.stop_timezone);
        this.url = ko.observable(data.url);

        this.trips = ko.observableArray();
    }

    Stop.prototype = {
        loadTrips: function() {
            TripCollection.fetch(this.route(), this.direction(), this.id()).then(function(trips) {
                this.trips(trips);
            }.bind(this), function(e) {
                console.error(e);
            });
        },
        showOnMap: function() {
            // perhaps publish a message that indicates this stop wants to be shown on the map?
        }
    };

    return Stop;
});
8
