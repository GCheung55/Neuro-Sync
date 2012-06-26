/**
 * Inspired by Epitome.Model.Sync by Dimitar Christoff (https://github.com/DimitarChristoff/Epitome)
 */

var REST = function(type){
    return function(){
        this[type].apply(this, arguments);
        return this;
    };
};

var Sync = new Class({
    Extends: Request.JSON,

    options: {
        link: 'chain'
    },

    syncId: 0,

    sync: function(type, options, callback){
        if (callback && typeOf(callback) == 'function'){
            this.syncId++;
            this.addEventOnce('sync', callback);
        }

        this[type ? type : 'update'](options);

        return this;
    },

    addEventOnce: function(type, fnc){
        var syncId = this.syncId,
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
    },

    create: REST('POST'),

    read: REST('GET'),

    update: REST('PUT'),

    cancel: function(){
        if (!this.running) {
            this.fireEvent('cancel');
            this.fireEvent('sync:' + (this.syncId) );
            return this;
        }

        this.parent();
        this.fireEvent('sync:' + (this.syncId) );
        return this;
    }
});

module.exports = Sync;