/**
 * Inspired by Epitome.Model.Sync by Dimitar Christoff (https://github.com/DimitarChristoff/Epitome)
 * @requires [MooTools-Core/Class]
 */

var Sync = require('../src/sync/main').Sync,
    Is = require('neuro-is').Is;

/**
 * Create a Class that contains all the Sync specific Signals
 * @type {Object}
 */
var SyncSignals = {}, 
    signalSyncPrefix = 'signalSync',
    syncPrefix = 'sync:',
    syncFnc = function(str){
        return function(){
            this.fireEvent(str, arguments);
            return this;
        };
    };

SyncSignals[signalSyncPrefix] = syncFnc('sync');

['Request', 'Complete', 'Success', 'Failure', 'Error'].each(function(item){
    SyncSignals[signalSyncPrefix + item] = syncFnc(syncPrefix + item.toLowerCase());
});

SyncSignals = new Class(SyncSignals);

var SyncMix = new Class({
    Implements: [SyncSignals],

    _syncId: 0,

    _incrementSyncId: function(){
        this._syncId++;
        return this;
    }.protect(),

    _getSyncId: function(){
        return this._syncId;
    },

    setSync: function(options){
        var _this = this,
            getSyncId = this._getSyncId.bind(this),
            events = {
                request: function(){
                    _this.signalSyncRequest();
                },
                complete: function(response){
                    _this.signalSyncComplete(response);
                },
                success: function(response){
                    _this.signalSyncSuccess(response);
                },
                failure: function(){
                    _this.signalSyncFailure();
                    _this.fireEvent('sync:' + getSyncId());
                },
                error: function(){
                    _this.signalSyncError();
                    _this.fireEvent('sync:' + getSyncId());
                },
                sync: function(response){
                    _this.signalSync(response);
                    _this.fireEvent('sync:' + getSyncId());
                }
            },
            request = new Sync(Object.merge({}, this.options.request, options || {}));

        this.request = request.addEvents(events);

        return this;
    },

    // Implement just the original check method so that SyncMix's sync method can do the same
    // that Request does. It provides chaining when using the sync method.
    syncCheck: function(){
        var request = this.request;

        if (!request.running) return true;
        switch (request.options.link){
            case 'cancel': this.cancel(); return true;
            case 'chain': request.chain(this.caller.pass(arguments, this)); return false;
        }
        return false;
    },

    sync: function(method, data, callback){
        var request = this.request;
        // This will utilize requests check to decide to cancel and continue, or chain
        if (!this.syncCheck(method, data, callback)) return this;

        this._incrementSyncId();

        // default to read if the type doesn't exist
        method = request[method] ? method : 'read';

        // Doesn't need to pass data because request would use request.options.data by default
        // data = data ? data : this.toJSON();

        if (callback && Is.Function(callback)) {            
            // this.incrementOnceId();
            this._addEventOnce(function(){
                callback.apply(this, arguments);
                this.fireEvent(method, arguments);
            });
        }

        request[method](data);

        return this;
    },

    _addEventOnce: function(fnc){
        var type = 'sync',
            syncId = this._getSyncId(),
            cancelType = type + ':' + syncId,
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
    }.protect(),

    /**
     * Process the response data before it's added or set by the Collection or Model during request response.
     * This should be refactored by your super Class of Collection or Model.
     * @param  {Object} response The response object from the request
     * @return {Object}          The returned object would be used to add / set in the Collection or Model. Nothing returned means nothing is added / set.
     */
    process: function(response){
        return response;
    },

    cancel: function(){
        this.request.cancel();
        this.fireEvent('sync:' + this._getSyncId());
        return this;
    }
});



exports.Sync = SyncMix;