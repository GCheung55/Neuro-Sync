/**
 * Sync Model
 * Inspired by Epitome.Model.Sync by Dimitar Christoff (https://github.com/DimitarChristoff/Epitome)
 * 
 * @type {Class}
 * 
 * @todo Need to setup the url to be like /path/:id. This would allow plugin in data to the url
 * Then set it to the request options url property
 *
 * @requires [MooTools-Core/Class]
 */

var modelObj = require('Neuro/src/model/main'),
    Sync = require('./Sync').Sync,
    Mixins = require('../mixins/sync');

var Model = new Class({
    Extends: modelObj.Model,

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
        response = this.process(response);

        // If data returns, set it
        if (response) {
            this.set(response);
        }

        this.fireEvent('save', response);

        callback && callback.call(this, response);

        return this;
    },

    save: function(callback){
        // Determine whether method is create or update;
        var isNew = this.isNew(),
            method = ['create', 'update'][+isNew],
            data = this.toJSON();

        // Issue create/update command to server
        this.sync(method, data, function(response){
            this._syncSave(response, callback);
        });

        // Optimistically set this model as old
        isNew && this.setNew(false);

        return this;
    },

    _syncFetch: function(response, callback){
        response = this.process(response);
        // If data returns, set it
        if (response) {
            this.set(response);
        }

        this.setNew(false);
        this.fireEvent('fetch', response);

        callback && callback.call(this, response);

        return this;
    },

    fetch: function(callback){
        var data = this.toJSON();

        // Issue read command to server
        this.sync('read', data, function(response){
            this._syncFetch(response, callback);
        });

        return this;
    },

    _syncDestroy: function(response, callback){
        callback && callback.call(this, response);
        return this;
    },

    destroy: function(callback){
        // Cancel the currently executing request before continuing
        this.request.cancel();

        // Issue delete command to server
        this.sync('delete', {}, function(response){
            this._syncDestroy(response, callback);
        });

        this.parent();

        return this;
    }
});

modelObj.Model =exports.Model = Model;