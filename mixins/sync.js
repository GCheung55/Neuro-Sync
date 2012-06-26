/**
 * Inspired by Epitome.Model.Sync by Dimitar Christoff (https://github.com/DimitarChristoff/Epitome)
 */

var Sync = require('../Source/Sync');

var SyncMix = new Class({
    setSync: function(options){
        var _this = this,
            id = 0,
            incrementId = function(){id++;},
            events = {
                request: function(){
                    incrementId();
                    _this.signalSyncRequest();
                },
                complete: function(response){
                    _this.signalSyncComplete(response);
                },
                failure: function(){
                    _this.signalSyncFailure();
                },
                error: function(){
                    _this.signalSyncError();
                },
                sync: function(){
                    _this.signalSync(response);
                    _this.fireEvent('sync:' + this.syncId, response);
                }
            },
            request = new Sync(Object.merge({}, this.options.request, options || {}));

        // var id = 0;
        this.getOnceId = function(){
            return id + 1;
        };

        // this.incrementOnceId = function(){
        //     onceId++;
        //     return this;
        // };

        this.request = request.addEvents(events);

        return this;
    },

    sync: function(method, data, callback){
        var request = this.request;
        if (!request.check.apply(request, arguments)) return this;

        // default to read if the type do
        method = request[method] ? method : 'read';

        /** Doesn't need to pass data because request would use request.options.data by default */
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
            syncId = this.getOnceId(),
            cancelType = type + ':' + (syncId),
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
        this.fireEvent('sync:' + this.getOnceId() );
        return this;
    },

    signalSyncRequest: function(){
        this.fireEvent('sync:request', arguments);
    },

    signalSync: function(){
        this.fireEvent('sync', arguments);
        return this;
    },

    signalSyncComplete: function(){
        this.fireEvent('sync:complete', arguments);
        return this;
    },

    signalSyncError: function(){
        this.fireEvent('sync:error', arguments);
        return this;
    },

    signalSyncFailure: function(){
        this.fireEvent('sync:failure', arguments);
        return this;
    }
});

exports.Sync = SyncMix;