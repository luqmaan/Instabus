var config =  {
    vehicleZIndex: 10,
    stopZIndex: 5,
    MAX_RETRIES: 2,
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
