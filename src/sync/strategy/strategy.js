/**
 * The base for all strategies
 * @type {Class}
 */
exports.Strategy = new Class({
    Implements: [Events, Options],

    options: {
        isNew: true
    },

    initialize: function(options){
        this.setOptions(options);

        this.setup(options);

        return this;
    },

    setup: function(options){
        this.setNew(this.options.isNew);

        return this;
    },

    process: function(response){
        return response;
    },

    sync: function(options, callback){
        return this;
    },

    cancel: function(){
        return this;
    },

    isNew: function(){
        return this._isNew;
    },

    setNew: function(val){
        this._isNew = !!val;
        return this; 
    }
});