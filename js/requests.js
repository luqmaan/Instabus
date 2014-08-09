var when = require('when');

var requests = {
    requestID: 0,
    send: function(method, url, data, headers) {
        var self = this,
            deferred = when.defer(),
            xhr = new XMLHttpRequest(),
            done = false,
            lowerMethod = method.toLowerCase(),
            isGetRequest = lowerMethod === 'get',
            isDeleteRequest = lowerMethod === 'delete',
            requestID;

        this.requestID += 1;
        requestID = this.requestID;

        if (isGetRequest && data && Object.keys(data).length > 0) {
            url += '?' + this.serializeParams(data);
        }

        xhr.onload = function(event) {
            // Sometimes webkit gets a little trigger happy and calls this multiple times
            // https://code.google.com/p/chromium/issues/detail?id=159827
            if (done) return;
            done = true;

            var logFn = xhr.status > 299 ? console.error : console.log;
            // logFn.call(undefined, requestID.toString(), '[' + method.toUpperCase() + ']', url, '=>', xhr.status);
            console.log(requestID.toString(), '[' + method.toUpperCase() + ']', url, '=>', xhr.status);

            // Sometimes different environments don't use case-insensitive matching
            var contentType = xhr.getResponseHeader('content-type') || xhr.getResponseHeader('Content-type');

            if (xhr.status >= 200 && xhr.status < 400) {
                var result = null;
                if (/application\/json/i.test(contentType)) {
                    result = JSON.parse(xhr.responseText);
                } else if (/text\/xml/i.test(contentType)) {
                    var parser = new DOMParser();
                    result = parser.parseFromString(xhr.responseText, "text/xml");
                } else {
                    result = xhr.responseText;
                }
                deferred.resolve(result);
            }
            else {
                deferred.reject(xhr.responseText);
            }
        };

        xhr.onerror = function() {
            deferred.reject(new Error('Unable to connect to the server.'));
        };

        xhr.ontimeout = function() {
            deferred.reject(new Error('It took too long for the server to respond.'));
        };

        xhr.open(method, url, true);

        if (headers) {
            headers.forEach(function(value, headerName) {
                xhr.setRequestHeader(headerName, value);
            });
        }

        var requestData = data !== undefined && !isGetRequest ? JSON.stringify(data) : undefined;

        // NOTE: nginx gets pissy if the content-length header is set to 0 so we send along garbage data
        if (isDeleteRequest && (!requestData || requestData.length === 0)) {
            requestData = '1';
        }

        xhr.timeout = 30000;
        xhr.send(requestData);

        return deferred.promise;
    },
    serializeParams: function(params) {
        var keyValues = [];

        function push(key, val) {
            keyValues.push(encodeURIComponent(key) + '=' + encodeURIComponent(val));
        }

        for (var key in params) {
            if (params.hasOwnProperty(key)) {
                var val = params[key];

                if (Array.isArray(val)) {
                    var pushArrayVal = push.bind(undefined, key);
                    val.forEach(pushArrayVal);
                }
                else {
                    push(key, val);
                }
            }
        }

        return keyValues.join('&');
    }
};

requests.get = requests.send.bind(requests, 'GET');
requests.put = requests.send.bind(requests, 'PUT');
requests.patch = requests.send.bind(requests, 'PATCH');
requests.post = requests.send.bind(requests, 'POST');
requests.delete = requests.send.bind(requests, 'DELETE');

module.exports = requests;
