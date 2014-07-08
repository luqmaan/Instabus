({
    baseUrl: '.',
    paths: {
        'text': '../bower_components/requirejs-text/text',
        'jquery': '../bower_components/jquery/dist/jquery.min',
        'knockout': '../bower_components/knockout-dist/knockout',
        'underscore': '../bower_components/underscore/underscore',
        'leaflet': '../bower_components/leaflet/dist/leaflet-src',
        'Leaflet.label': '../bower_components/Leaflet.label/dist/leaflet.label-src',
        'moment': '../bower_components/moment/moment',
        'geolib': '../bower_components/geolib/dist/geolib'
    },
    packages: [{
        name: 'when',
        location: '../bower_components/when',
        main: 'when'
    }],
    include: 'main',
    insertRequire: ['main'],
    name: '../bower_components/almond/almond',
    out: 'built.js',
    wrap: true,
    optimize: 'uglify2',
    preserveLicenseComments: false,
    generateSourceMaps: true
})
