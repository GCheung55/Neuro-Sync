var Strategy = require('./strategy').Strategy,
    SyncRequest = require('../request').Request,
    Route = require('Neuro/src/route/main').Route;

exports.Server = new Class({
    Extends: Strategy,

    options: {
        route: {},
        request: {
            // interpolateUrl: false
        }
    },

    _id: 0,

    _incrementId: function(){
        this._id++;
        return this;
    },

    _getId: function(){
        return this._id;
    },

    setup: function(options){
        this.parent(options);

        this.setupRequest(this.options.request);

        // this.setupRoute(this.options.route);

        return this;
    },

    setupRequest: function(options){
        /**
         * Remove the events from an existing request before proceeding to create a new one
         */
        if (this.request) {
            Object.each(this.request.$events, function(val, key){
                this.request.removeEvents(key);
            }, this);
        }

        var request = new SyncRequest(options);

        this.request = (this.attachRequestEvents(request), request);

        return this;
    },

    attachRequestEvents: function(req){
        var _this = this,
            getId = this._getId.bind(this),
            cancelOnce = function(){
                _this.fireEvent('success:' + getId());
            };

        req && req.addEvent && Object.each({
            request: function(){
                    _this.fireEvent('request');
            },
            complete: function(response){
                _this.fireEvent('complete', _this.process(response));
            },
            success: function(response){
                _this.fireEvent('success', _this.process(response));
                cancelOnce();
            },
            failure: function(){
                _this.fireEvent('failure');
                cancelOnce();
            },
            error: function(){
                _this.fireEvent('error');
                cancelOnce();
            }
        }, function(val, key){
            req.addEvent(key, val, true);
        }, this);

        return this;
    },

    // setupRoute: function(obj){
    //     var route = new Route(obj);
    //     if (route.proof()) {
    //         this.route = route;
    //     }

    //     return this;
    // },

    sync: function(options, callback){
        var request = this.request;

        // This will utilize requests check to decide to cancel and continue, or chain
        if (!this.check(options, callback)) {
            return this;
        }

        if (typeOf(options) == 'function') {
            callback = options;
            options = {};
        }

        options = Object.merge({}, this.options.request, options);

        // interpolate the url with the data in the options
        // if (this.route && options.interpolateUrl) {
        //     options.url = this.route.interpolate(options.data);
        // }

        this._incrementId();

        // default to read if the type doesn't exist
        // method = request[method] ? method : 'read';

        if (callback && typeOf(callback) == 'function') {
            this._addEventOnce(function(){
                callback.apply(this, arguments);
                // this.fireEvent(options.method, arguments);
            });
        }

        request.send(options);

        return this;
    },

    // Implement just the original check method so that SyncMix's sync method can do the same
    // that Request does. It provides chaining when using the sync method.
    check: function(){
        var request = this.request;

        if (!request.running) return true;
        switch (request.options.link){
            case 'cancel': this.cancel(); return true;
            case 'chain': request.chain(this.caller.pass(arguments, this)); return false;
        }
        return false;
    },

    cancel: function(){
        this.request.cancel();
        this.fireEvent('cancel');
        this.fireEvent('success:' + this._getId());
        return this;
    },

    _addEventOnce: function(fnc){
        var type = 'success',
            id = this._getId(),
            cancelType = type + ':' + id,
            once, cancel;

        cancel = function(){
            this.removeEvent(type, once);
            this.removeEvent(cancelType, cancel);
        };

        once = function(){
            fnc.apply(this, arguments);
            cancel.call(this);
        };

        this.addEvent(type, once);
        this.addEvent(cancelType, cancel);

        return this;
    },

    save: function(options, callback){
        var cb = function(){
            this.setNew(false);
            callback.apply(null, arguments);
        }.bind(this);

        options = Object.merge({}, options, {method: ['update', 'create'][+this.isNew()]});

        this.sync(options, cb);
    },

    fetch: function(options, callback){
        var cb = function(){
            this.setNew(false);
            callback.apply(null, arguments);
        }.bind(this);

        options = Object.merge({}, options, {method: 'read'});

        this.sync(options, cb)
    },

    destroy: function(options, callback){
        options = Object.merge({}, options, {method: 'delete'});

        this.sync.apply(this, arguments);
    }
});