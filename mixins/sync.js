/**
 * Inspired by Epitome.Model.Sync by Dimitar Christoff (https://github.com/DimitarChristoff/Epitome)
 */

var Sync = require('../Source/Sync');

/**
 * Create a Class that contains all the Sync specific Signals
 * @type {Object}
 */
var SyncSignals = {}, 
    signalSyncPrefix = 'signalSync',
    syncPrefix = 'sync:',
    syncFnc = function(str){
        str = syncPrefix + str.toLowerCase();
        return function(){
            this.fireEvent(str, arguments);
            return this;
        };
    };

SyncSignals[signalSyncPrefix] = syncFnc('');

['Request', 'Complete', 'Success', 'Failure', 'Error'].each(function(item){
    SyncSignals[signalSyncPrefix + item] = syncFnc(item);
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
    }.protect(),

    setSync: function(options){
        var _this = this,
            getSyncId = function(){this._getSyncId}.bind(this),
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
                sync: function(){
                    _this.signalSync(response);
                    _this.fireEvent('sync:' + getSyncId());
                }
            },
            request = new Sync(Object.merge({}, this.options.request, options || {}));

        this.request = request.addEvents(events);

        return this;
    },

    sync: function(method, data, callback){
        var request = this.request;
        // This will utilize requests check to decide to cancel and continue, or chain
        if (!request.check.apply(request, arguments)) return this;

        this._incrementSyncId();

        // default to read if the type doesn't exist
        method = request[method] ? method : 'read';

        // Doesn't need to pass data because request would use request.options.data by default
        // data = data ? data : this.toJSON();

        if (callback && Type.isFunction(callback)) {            
            // this.incrementOnceId();

            this._addEventOnce(callback);
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

    parse: function(response, _this){
        return response;
    },

    cancel: function(){
        this.request.cancel();
        this.fireEvent('sync:' + this._getSyncId());
        return this;
    }
});

exports.Sync = SyncMix;