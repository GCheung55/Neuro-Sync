var REST = function(type){
    return function(){
        this[type].apply(this, arguments);
        return this;
    };
};

var Sync = new Class({
    Extends: Request.JSON,

    onSuccess: function(){
        this.fireEvent('complete', arguments).fireEvent('success', arguments).fireEvent('sync', arguments).callChain();
    },

    create: REST('POST'),

    read: REST('GET'),

    update: REST('PUT')
});

module.exports = Sync;