var Neuro = require('Neuro');

Neuro.Sync = require('./sync/main');

// Neuro.Sync = require('./sync/main').Sync;
Neuro.Model = require('./model/main').Model;
// Neuro.Collection = require('./collection/main').Collection;

exports = module.exports = Neuro;