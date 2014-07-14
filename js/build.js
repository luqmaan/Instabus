requirejs.config({
    baseUrl: 'js',
    // FIXME: Copy pasta ing the paths/packages between almond.build and build may suck
    // When it does suck, fix it.
    paths: {
        'text': '../bower_components/requirejs-text/text',
        'jquery': '../bower_components/jquery/dist/jquery.min',
        'knockout': '../bower_components/knockout-dist/knockout',
        'underscore': '../bower_components/underscore/underscore',
        'leaflet': '../bower_components/leaflet/dist/leaflet-src',
        'Leaflet.label': '../bower_components/Leaflet.label/dist/leaflet.label-src',
        'moment': '../bower_components/moment/moment',
        'geolib': '../bower_components/geolib/dist/geolib',
        'NProgress': '../bower_components/nprogress/nprogress'
    },
    packages: [{
        name: 'when',
        location: '../bower_components/when',
        main: 'when'
    }],
});

requirejs(['main']);
