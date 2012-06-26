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

var Neuro = require('../Neuro'),
    Sync = require('../Sync');

var Model = new Class({
    Extends: Neuro.Model,

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

        this.setSync(this.options.request);

        return this;
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

    sync: function(type, options, callback){
        var data = this.toJSON();

        if (!options) { options = {}; }

        options.data = Object.merge({}, options.data, data);

        this.request.sync(type, options, callback);

        return this;
    },

    parse: function(response, model){
        return response;
    },

    _syncSave: function(response, model, callback){
        // If data returns, set it
        if (response) {
            model.set(model.parse.apply(model, arguments));
        }

        model.fireEvent('save', arguments);

        callback && callback.call(this, request, model);

        return this;
    },

    save: function(options, prop, val, fnc){

        // Determine whether method is create or update;
        var _this = this,
            isNew = this.isNew(),
            method = ['create', 'update'][+isNew];

        // Set data if property exists
        if (prop) {
            this.set(prop, val);
        }

        // Issue create/update command to server
        this.sync(method, options, function(response, model){
            _this._syncSave.call(_this, response, model, fnc);
            _this.fireEvent(method, arguments);
        });

        // Optimistically set this model as old
        isNew && this.setNew(false);

        return this;
    },

    _syncFetch: function(response, model, callback){
        // If data returns, set it
        if (response) {
            model.set(model.parse.apply(model, arguments));
        }

        model.setNew(false);
        model.fireEvent('fetch', arguments);

        callback && callback.call(this, response, model);

        return this;
    },

    fetch: function(options, callback){
        var _this = this;

        // Issue read command to server
        this.sync('read', options, function(response, model){
            _this.syncFetch.call(_this, response, model, callback);
            _this.fireEvent('read', arguments);
        });

        return this;
    },

    _syncDestroy: function(response, model, callback){
        model.fireEvent('delete', arguments);

        callback && callback.call(this, response, model);
        return this;
    },

    destroy: function(options, callback){
        var _this = this;

        // Cancel the currently executing request before continuing
        this.request.cancel();

        // Issue delete command to server
        this.sync('delete', options, function(){
            _this._syncDestroy.call(_this, response, model, callback);
            _this.fireEvent('delete', arguments);
        });

        this.parent();

        return this;
    }
});

module.exports = Model;