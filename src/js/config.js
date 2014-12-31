var version = require('../../package.json').version;

var config =  {
    VERSION: version,
    VEHICLE_Z_INDEX: 10,
    STOP_Z_INDEX: 5,
    REFRESH_INTERVAL: 15 * 1000,
    MAX_RETRIES: 2,
    DEFAULT_MARKER_ANIMATION_STEPS: 200,
    MAP_INITIAL_COORDINATES: [30.267153, -97.743061],
    MAP_INITIAL_ZOOM_LEVEL: 14,
    MAX_TRIPS: 4,
    errors: {
        CapMetroAPIError: function() {
            function CapMetroAPIError(message) {
                this.name = 'CapMetroAPIError';
                this.message = message;
                this.stack = (new Error()).stack;
                this.toString = function() {
                    return  this.name + ': ' + this.message;
                };
            }
            CapMetroAPIError.prototype = new Error;
            return CapMetroAPIError;
        }
    }
};
module.exports = config;
