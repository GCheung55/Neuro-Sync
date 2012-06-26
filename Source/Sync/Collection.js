/**
 * Sync Collection
 * Inspired by Epitome.Model.Sync by Dimitar Christoff (https://github.com/DimitarChristoff/Epitome)
 * 
 * @type {Class}
 * 
 * @todo Need to setup the url to be like /path/:id. This would allow plugin in data to the url
 * Then set it to the request options url property
 *
 * 
 */

var Neuro = require('../Neuro'),
    Sync = require('../Sync'),
    Mixins = require('../../mixins/sync');

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

    _syncFetch: function(response, callback, reset){
        // If data returns, set it
        if (response) {
            reset && this.empty();
            this.add(this.parse.apply(this, response));
        }

        this.fireEvent('fetch', response);

        callback && callback.call(this, response);

        return this;
    },

    fetch: function(callback, reset){
        var _this = this,
            data = this.toJSON();

        // Issue read command to server
        this.sync('read', data, function(response){
            _this._syncFetch.call(_this, response, callback, reset);
            _this.fireEvent('read', arguments)
        });

        return this;
    }
});

module.exports = Collection;