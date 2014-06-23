define(['libs/knockout'],
function(ko) {
    function Stop(data) {
        this.name = ko.observable(data.stop_name);
        this.direction_id = ko.observable(data.direction_id);
        this.route_id = ko.observable(data.route_id);
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
            this.trips.push({
                arrivalTime: '3m'
            }, {
                arrivalTime: '11m'
            }, {
                arrivalTime: '28m'
            });
        },
        showOnMap: function() {
            // perhaps publish a message that indicates this stop wants to be shown on the map?
        }
    };

    return Stop;
});
