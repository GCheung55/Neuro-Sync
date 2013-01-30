var Strategies = require('../src/sync/strategies');
var Silence = require('Neuro/mixins/silence').Silence;
var Model = require('Neuro/src/model/main').Model;

exports.Sync = new Class({
    Implements: [Class.Binds, Events, Silence],

    setupSync: function(options){
        options = Object.merge({}, {
            default: undefined, 
            Strategies: {}
        }, options);

        this._strategies = new Model;

        this.setStrategy(options.Strategies);

        this.changeStrategy(options.default);

        return this;
    },

    // attachStrategyEvents: function(strategy){
    //     strategy.addEvents({
    //         'success': this.bound('signalSync'),
    //         'cancel': this.bound('signalSyncCancel')
    //     });

    //     return this;
    // },

    // detachStrategyEvents: function(strategy){
    //     strategy.removeEvents({
    //         'success': this.bound('signalSync'),
    //         'cancel': this.bound('signalSyncCancel')
    //     });

    //     return this;
    // },

    setStrategy: function(name, options){
        var strategy = Strategies.get(name)
        var instance;

        options = options || {};

        if (strategy) {
            instance = new strategy(options);
            
            // this.attachStrategyEvents(instance);

            this._strategies.set(name, instance);
        }

        return this;
    }.overloadSetter(),

    getStrategy: function(name){
        return this._strategies.get(name);
    }.overloadGetter(),

    getCurrentStrategy: function(){
        return this.getStrategy(this._currentStrategy);
    },

    changeStrategy: function(name){
        var strategy = this._strategies.get(name);

        strategy && (this._currentStrategy = name);

        return this;
    },

    useStrategy: function(name, callback){
        var current;

        if (this.getStrategy(name)) {
            current = this._currentStrategy;

            this.changeStrategy(name);

            callback.call(this);

            this.changeStrategy(current);
        }

        return this;
    },

    sync: function(method, options, callback){
        var strategy = this.getCurrentStrategy();
        var cb = callback;

        method = method || 'sync';

        if (this.isSilent()) {
            cb = this.silence.bind(this, callback);
        }

        strategy[method].call(strategy, options, cb);

        return this;
    },

    process: function(response){
        return response;
    },

    cancel: function(){
        var strategy = this.getStrategy(this._currentStrategy)
        strategy && strategy.cancel();
        return this;
    }

    // ,signalSync: function(response){
    //     !this.isSilent() && this.fireEvent('sync', [this].append(arguments));
    //     return this;
    // },

    // signalSyncCancel: function(){
    //     !this.isSilent() && this.fireEvent('sync:cancel', [this]);
    //     return this;
    // }

});