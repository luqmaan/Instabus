function fetchArrivals(routeID, directionID, stopID) {
    var deferred = new $.Deferred(),
        next_arrival_url = 'http://www.capmetro.org/planner/s_service.asp?output=xml&opt=2&tool=SI&route=' + routeID + '&stopid=' + stopID;

    console.log('Fetching next arrival', next_arrival_url);

    $.ajax({
        url: 'http://query.yahooapis.com/v1/public/yql',
        data: {
            q: 'select * from xml where url="' + next_arrival_url + '"',
            format: 'xml'
        }
    }).done(function(data) {
        var doc = x2js.xml2json(data),
            fault = doc.query.results.Envelope.Body.Fault,
            service,
            times;

        if (fault) {
            console.error(fault);
            deferred.reject(fault);
        }

        service = doc.query.results.Envelope.Body.SchedulenearbyResponse.Atstop.Service;
        if (Array.isArray(service)) {
            service = service.filter(function(s) { return utils.getDirectionID(s.Direction) === directionID; })[0];
        }
        times = service.Times;

        deferred.resolve(times);
    }.bind(this)).fail(function(xhr, status, err) {
        console.error('Fetch arrivals', err);
        deferred.reject();
    });

    return deferred.promise();
}
