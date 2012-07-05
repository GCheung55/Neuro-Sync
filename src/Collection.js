/**
 * Sync Collection
 * Inspired by Epitome.Model.Sync by Dimitar Christoff (https://github.com/DimitarChristoff/Epitome)
 * 
 * @type {Class}
 * 
 * @todo Need to setup the url to be like /path/:id. This would allow plugin in data to the url
 * Then set it to the request options url property
 *
 * @requires [MooTools-Core/Class]
 */

var Neuro = require('Neuro'),
    Sync = require('./Sync'),
    Mixins = require('../mixins/sync');

var Collection = new Class({
    Extends: Neuro.Collection,

    Implements: [Mixins.Sync],

    options: {
        request: {},
        Model: Neuro.Model
    },

    setup: function(models, options){
        this.parent(models, options);

        this.setSync();
    },

    _syncFetch: function(response, callback, empty){
        response = this.process(response);

        // If data returns, set it
        if (response) {
            empty && this.empty();
            this.add(response);
        }

        this.fireEvent('fetch', response);

        callback && callback.call(this, response);

        return this;
    },

    fetch: function(callback, empty){
        var data = this.toJSON();

        // Issue read command to server
        this.sync('read', data, function(response){
            this._syncFetch(response, callback, empty);
        });

        return this;
    }
});

module.exports = Collection;