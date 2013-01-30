/**
 * Sync Collection
 * Inspired by Epitome.Model.Sync by Dimitar Christoff (https://github.com/DimitarChristoff/Epitome)
 * 
 * @type {Class}
 *
 * @requires [MooTools-Core/Class]
 */
var collectionObj = require('Neuro/src/collection/main')
var modelObj = require('../model/main')
var Sync = require('../../mixins/sync').Sync

var Collection = new Class({
    Extends: collectionObj.Collection,

    Implements: [Sync],

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

    _syncFetch: function(response, callback, empty){
        response = this.process(response);

        // If data returns, set it
        if (response) {
            empty && this.empty();
            this.add(response);
        }

        this.signalFetch(response);

        callback && callback.call(this, response);

        return this;
    },

    fetch: function(options, callback, empty){
        var _this = this;

        this.sync('fetch', options, function(response){
            _this._syncFetch(response, callback, empty);
        });

        return this;
    },

    signalFetch: function(response){
        !this.isSilent() && this.fireEvent('fetch', response);
        return this;
    }
});

collectionObj.Collection = exports.Collection = Collection;