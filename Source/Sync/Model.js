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
    Sync = require('../Sync'),
    Mixins = require('../../mixins/sync');

var Model = new Class({
    Extends: Neuro.Model,

    Implements: [Mixins.Sync],

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

    _syncSave: function(response, callback){
        // If data returns, set it
        if (response) {
            this.set(this.parse.apply(this, response));
        }

        this.fireEvent('save', response);

        callback && callback.call(this, response);

        return this;
    },

    save: function(prop, val, callback){
        // Determine whether method is create or update;
        var _this = this,
            isNew = this.isNew(),
            method = ['create', 'update'][+isNew],
            data;

        // Set data if property exists
        if (prop) {
            this.set(prop, val);
        }

        data = this.toJSON();

        // Issue create/update command to server
        this.sync(method, data, function(response){
            _this._syncSave.call(_this, response, callback);
            _this.fireEvent(method, arguments);
        });

        // Optimistically set this model as old
        isNew && this.setNew(false);

        return this;
    },

    _syncFetch: function(response, callback, reset){
        // If data returns, set it
        if (response) {
            // Reset to what the default is before setting the response
            reset && (this._data = Object.merge({}, this.options.defaults));
            this.set(this.parse.apply(this, arguments));
        }

        this.setNew(false);
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
            _this.fireEvent('read', arguments);
        });

        return this;
    },

    _syncDestroy: function(response, callback){
        this.fireEvent('delete', arguments);

        callback && callback.call(this, response);
        return this;
    },

    destroy: function(options, callback){
        var _this = this;

        // Cancel the currently executing request before continuing
        this.request.cancel();

        // Issue delete command to server
        this.sync('delete', options, function(response){
            _this._syncDestroy.call(_this, response, callback);
            _this.fireEvent('delete', arguments);
        });

        this.parent();

        return this;
    }
});

module.exports = Model;