var config =  {
    vehicleZIndex: 10,
    stopZIndex: 5,
    REFRESH_INTERVAL: 15 * 1000,
    MAX_RETRIES: 2,
    MARKER_ANIMATION_REFRESH_RATE: 10,
    DEFAULT_MARKER_ANIMATION_STEPS: 200,
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
