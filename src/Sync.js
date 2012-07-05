/**
 * Sync, inherits Request.JSON methods, providing additional CRUD methods
 *
 * @requires [MooTools-Core/Class, MooTools-Core/Request/Request.JSON]
 */
var REST = function(type){
    return function(){
        this[type].apply(this, arguments);
        return this;
    };
};

var Sync = new Class({
    Extends: Request.JSON,

    /**
     * Override onSuccess to include firing Sync custom event
     */
    onSuccess: function(){
        this.fireEvent('complete', arguments).fireEvent('success', arguments).fireEvent('sync', arguments).callChain();
    },

    create: REST('POST'),

    read: REST('GET'),

    update: REST('PUT')
});

module.exports = Sync;