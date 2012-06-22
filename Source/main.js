var Model = require('./Model'),
    Collection = require('./Collection'),
    Sync = require('./Sync');

Model.Sync = require('./Sync/Model');
Collection.Sync = require('./Sync/Collection');

exports = module.exports = {
    Model: Model,
    Collection: Collection,
    Sync: Sync
};