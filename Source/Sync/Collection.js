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
    Sync = require('../Sync');

var Collection = new Class({
    Extends: Neuro.Collection,

    options: {
        request: {},
        Model: Neuro.Model
    },

    setup: function(models, options){
        this.parent(models, options);

        this.setSync();
    },

    setSync: function(options){
        var _this = this,
            events = {
                request: function(){
                    _this.fireEvent('sync:request', [this, _this]);
                },
                complete: function(response){
                    _this.fireEvent('sync:complete', [response, _this]);
                },
                success: function(response){
                    _this.fireEvent('sync', [response, _this]);
                    _this.fireEvent('sync:' + this.syncId, [response, _this]);
                },
                failure: function(){
                    _this.fireEvent('sync:failure', [this, _this]);
                },
                error: function(){
                    _this.fireEvent('sync:error', [this, _this]);
                }
            },
            request = new Sync(Object.merge({}, this.options.request, options || {}));

        this.request = request.addEvents(events);

        return this;
    },

    parse: function(response, collection){
        return response;
    },

    sync: function(type, options, callback){
        var data = this.toJSON();

        if (!options) { options = {}; }

        options.data = Object.merge({}, options.data, data);

        this.request.sync(type, options, callback);

        return this;
    },

    _syncFetch: function(response, collection, callback){
        // If data returns, set it
        if (response) {
            reset && collection.empty();
            collection.add(collection.parse.apply(collection, arguments));
        }

        collection.fireEvent('fetch', arguments);

        callback && callback.call(this, response, collection);

        return this;
    },

    fetch: function(options, callback){
        var _this = this;

        // Issue read command to server
        this.sync('read', options, function(response, collection){
            _this._syncFetch.call(_this, response, collection, callback);
            _this.fireEvent('read', arguments)
        });

        return this;
    }
});

module.exports = Collection;