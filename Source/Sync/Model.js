/**
 * Sync Model
 * Inspired by Epitome.Model.Sync by Dimitar Christoff (https://github.com/DimitarChristoff/Epitome)
 * 
 * @type {Class}
 * 
 * @todo Need to setup the url to be like /path/:id. This would allow plugin in data to the url
 * Then set it to the request options url property
 *
 * 
 */

var Model = require('../Model'),
    Sync = require('../Sync');

Model = new Class({
    Extends: Model,

    _new: true,

    options: {
        request: {},
        isNew: true
    },

    isNew: function(){
        return this._new;
    },

    setNew: function(bool){
        this._new = !!bool;

        return this;
    },

    setup: function(data, options){
        this.parent(data, options);

        // Defining whether model is new is optional
        this.setNew(this.options.isNew);

        this.setupSync(this.options.request);

        return this;
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

    save: function(prop, val, options){
        // If prop and val are objects, then val must be options.
        if (typeOf(prop) == 'object' && typeOf(val) == 'object'){
            options = val;
            val = undefined;
        }

        // Determine whether method is create or update;
        var isNew = this.isNew()
            method = ['create', 'update'][+isNew];

        // Set data if property exists
        if (prop) {
            this.set(prop, val);
        }

        // Issue create/update command to server
        this.sync(method, options, function(response, model){
            // If data returns, set it
            if (response) {
                model.set(response);
            }

            model.fireEvent('save', arguments);
            model.fireEvent(method);
        });

        // Optimistically set this model as old
        isNew && this.setNew(false);

        return this;
    },

    fetch: function(options){
        // Issue read command to server
        this.sync('read', options, function(response, model){
            // If data returns, set it
            if (response) {
                model.set(response);
            }

            model.setNew(false);
            model.fireEvent('fetch', arguments);
        });

        return this;
    },

    destroy: function(options){
        // Cancel the currently executing request before continuing
        this.request.cancel();

        // Issue delete command to server
        this.sync('delete', options, function(response, model){
            model.fireEvent('delete', arguments);
        });

        this.parent();

        return this;
    }
});

module.exports = Model;