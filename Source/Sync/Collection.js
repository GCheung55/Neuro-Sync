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

var Model = require('./Model'),
    Collection = require('../Collection'),
    Sync = require('../Sync');

Collection = new Class({
    Extends: Collection,

    options: {
        request: {},
        Model: Model
    },

    setup: function(models, options){
        this.parent(models, options);

        this.setupSync();
    },

    setupSync: function(options){
        var _this = this,
            events = {
                request: function(){
                    _this.fireEvent('sync:request', [this, _this]);
                },
                success: function(response){
                    _this.fireEvent('sync', [response, _this]);
                },
                failure: function(){
                    _this.fireEvent('sync:failure', [this, _this]);
                },
                error: function(){
                    _this.fireEvent('sync:error', [this, _this]);
                }
            },
            request = new Sync(this.options.request);

        this.request = request.addEvents(events);

        return this;
    },

    sync: function(type, options, callback){
        var data = this.toJSON();

        if (!options) { options = {}; }

        options.data = Object.merge({}, options.data, data);

        this.request.sync(type, options, callback);

        return this;
    },

    fetch: function(options){
        // Issue read command to server
        this.sync('read', options, function(response, collection){
            // If data returns, set it
            if (response) {
                collection.add(response);
            }

            collection.fireEvent('fetch', arguments);
        });

        return this;
    }
});

module.exports = Collection;