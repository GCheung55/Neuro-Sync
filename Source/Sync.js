var REST = function(type){
    return function(){
        this[type].apply(this, arguments);
        return this;
    };
};

var Sync = new Class({
    Extends: Request.JSON,

    sync: function(type, options, callback){
        if (callback && typeOf(callback) == 'function'){
            this.attachEventOnce('sync', callback);
        }

        this[type ? type : 'update'](options);

        return this;
    },

    attachEventOnce: function(type, fnc){
        var once, cancel;

        cancel = function(){
            this.removeEvent(type, once);
            this.removeEvent('cancel', cancel);
        };

        once = function(){
            fnc.apply(this, arguments);
            cancel.call(this);
        };

        this.addEvent(type, once);
        this.addEvent('cancel', cancel);

        return this;
    },

    create: REST('POST'),

    read: REST('GET'),

    update: REST('PUT')

    //Delete already exists on Request, so no need to add that
});

module.exports = Sync;