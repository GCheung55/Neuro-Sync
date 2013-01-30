/**
 * Sync, inherits Request.JSON methods, providing additional CRUD methods
 *
 * @requires [MooTools-Core/Class, MooTools-Core/Request/Request.JSON]
 */

exports.Request = new Class({
    Extends: Request.JSON,

    /**
     * Override onSuccess to include firing Sync custom event
     */
    // onSuccess: function(){
    //     this.fireEvent('complete', arguments).fireEvent('success', arguments).fireEvent('sync', arguments).callChain();
    // },

});