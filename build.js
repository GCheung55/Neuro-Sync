var fs = require('fs')
,   wrup = require('wrapup')()
,   root = __dirname + '/';

// Write the neuro.js file

var neuro = wrup.require('Neuro', './')
,   src = neuro.up()
,   compressed = neuro.up({compress: true});

var writeNeuro = function(){
    fs.writeFile(root + 'neuro-sync.js', src);
    fs.writeFile(root + './neuro-sync-min.js', compressed);
    console.log('Neuro Sync created.');
};

writeNeuro();