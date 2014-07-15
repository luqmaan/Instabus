({
    baseUrl: '.',
    mainConfigFile: 'build.js',
    include: 'main',
    insertRequire: ['main'],
    name: '../bower_components/almond/almond',
    out: 'built.js',
    wrap: true,
    optimize: 'uglify2',
    preserveLicenseComments: false,
    generateSourceMaps: true
})
