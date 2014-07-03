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
                        Service,
                        Tripinfo,
                        trips;

                    if (fault) {
                        console.error(fault);
                        deferred.reject(new Error(fault.faultstring));
                        return;
                    }

                    Service = doc.query.results.Envelope.Body.SchedulenearbyResponse.Atstop.Service;
                    if (Array.isArray(Service)) {
                        // Filter out the wrong direction
                        // But don't filter out the wrong direction if only one service is returned: this happens at the last stop in a route
                        Service = Service.filter(function(s) {
                            // `Direction` in the xml is N or S, not 0 or 1. convert it to something sane
                            return utils.getDirectionID(s.Route, s.Direction) === direction;
                        })[0];
                    }


                    Tripinfo = Service.Tripinfo;
                    if (!Array.isArray(Tripinfo)) {
                        Tripinfo = [Tripinfo];
                    }

                    trips = Tripinfo.map(function(tripData) { return new Trip(tripData); });

                    // show only the most recent old trip
                    for (var i = 0; i < trips.length; i++) {
                        if (! trips[i].old()) {
                            if (i > 0) {
                                trips = trips.slice(i-1);
                            }
                            break;
                        }
                    }

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
