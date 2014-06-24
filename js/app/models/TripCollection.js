define(['jquery', 'when', 'xml2json', 'utils', 'models/Trip'],
function($, when, X2JS, utils, Trip) {
    var x2js = new X2JS({});

    var TripCollection = {
        fetch: function(route, direction, stop) {
            var deferred = when.defer(),
                url = 'http://query.yahooapis.com/v1/public/yql',
                cap_url = 'http://www.capmetro.org/planner/s_service.asp?output=xml&opt=2&tool=SI&route=' + route + '&stopid=' + stop;

            $.ajax({
                url: url,
                data: {
                    q: 'select * from xml where url="' + cap_url + '"',
                    format: 'xml'
                }
            }).done(
                function(data) {
                    var doc = x2js.xml2json(data),
                        fault = doc.query.results.Envelope.Body.Fault,
                        services,
                        trips;

                    if (fault) {
                        console.error(fault);
                        deferred.reject(new Error(fault.faultstring));
                        return;
                    }

                    services = doc.query.results.Envelope.Body.SchedulenearbyResponse.Atstop.Service;
                    if (Array.isArray(services)) {
                        // filter out the wrong direction
                        services = services.filter(function(s) { return utils.getDirectionID(s.Direction) === direction; })[0];
                    }

                    console.log(trips);
                    trips = services.Tripinfo.map(function(tripData) { return new Trip(tripData); });

                    deferred.resolve(trips);
                }.bind(this))
            .fail(
                function(xhr, status, err) {
                    console.error('Fetch arrivals', err);
                    deferred.reject();
                }
            );

            return deferred.promise;
        }
    };

    return TripCollection;
});
