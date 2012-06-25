var fs = require('fs')
,   wrup = require('wrapup')();

// Write the neuro.js file

var src = wrup.require('Neuro', './Source/main-sync.js').up();

fs.writeFile('./neuro-sync.js', src);
console.log('Neuro Sync created.');