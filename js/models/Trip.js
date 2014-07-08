define(['knockout', 'moment'],
function(ko, moment) {
    function Trip(data) {
        this.tripTime = ko.observable(data.Triptime);
        this.id = ko.observable(data.Tripid);
        this.skedTripID = ko.observable(data.Skedtripid);
        this.block = ko.observable(data.Block);
        this.exception = ko.observable(data.Exception);

        this.moment = ko.computed(function() { return moment(this.tripTime(), 'hh:mm A'); }.bind(this));
        this.prettyTime = ko.computed(function() { return this.moment().fromNow(); }.bind(this));
        this.old = ko.computed(function() { return ! this.moment().isAfter(); }.bind(this));
    }

    return Trip;
});
