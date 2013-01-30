/**
 * Sync Model
 * Inspired by Epitome.Model.Sync by Dimitar Christoff (https://github.com/DimitarChristoff/Epitome)
 * 
 * @type {Class}
 *
 * @requires [MooTools-Core/Class]
 */

var modelObj = require('Neuro/src/model/main');
var Sync = require('../../mixins/sync').Sync;

var Model = new Class({
    Extends: modelObj.Model,

    Implements: Sync,

    options: {
        Sync: {
            default: undefined,
            Strategies: {}
        }
    },

    setup: function(data, options){
        this.parent(data, options);

        this.setupSync(this.options.Sync);
    },

    _syncSave: function(response, callback){
        response = this.process(response);

        // If data returns, set it
        if (response) {
            this.set(response);
        }

        this.signalSave(response);

        callback && callback.call(this, response, silent);

        return this;
    },

    save: function(options, callback){
        var _this = this;

        this.sync('save', options, function(response){
            _this._syncSave(response, callback, silent);
        });

        return this;
    },

    _syncFetch: function(response, callback){
        response = this.process(response);

        // If data returns, set it
        if (response) {
            this.set(response);
        }

        this.signalFetch(response);

        callback && callback.call(this, response);

        return this;
    },

    fetch: function(options, callback){
        var _this = this;

        this.sync('fetch', options, function(response){
            _this._syncFetch(response, callback);
        });

        return this;
    },

    _syncDestroy: function(response, callback){
        callback && callback.call(this, response)
        return this;
    },

    destroy: function(options, callback){
        var _this = this;

        this.cancel();

        this.sync('destroy', options, function(response){
            _this._syncDestroy(response, callback);
        });

        this.parent();

        return this;
    },

    signalSave: function(response){
        !this.isSilent() && this.fireEvent('save', response);
        return this;
    },

    signalFetch: function(response){
        !this.isSilent() && this.fireEvent('fetch', response);
        return this;
    }
});

modelObj.Model = exports.Model = Model;