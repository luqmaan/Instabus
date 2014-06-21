requirejs.config({
    baseUrl: 'js/app',
    paths: {
        libs: '../libs'
    },
    shim: {
        'libs/jquery': {
            exports: '$'
        },
        'libs/xml2json': {
            exports: 'X2JS'
        },
        'libs/underscore': {
            exports: '_'
        }
    }
});

requirejs(['main']);
1
