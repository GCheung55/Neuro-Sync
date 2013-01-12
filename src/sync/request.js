/**
 * Sync, inherits Request.JSON methods, providing additional CRUD methods
 *
 * @requires [MooTools-Core/Class, MooTools-Core/Request/Request.JSON]
 */

var methods = {};
Object.each({
    create: 'post',
    read: 'get',
    update: 'put',
    patch: 'patch'
}, function(val, key){
    var fnc = function(data){
        var object = {
            method: val
        }

        if (data != null) object.data = data

        return this.send(object)
    }

    methods[key] = fnc;
    methods[key.toUpperCase()] = fnc;
})

exports.Request = new Class({
    Extends: Request.JSON,

    /**
     * Override onSuccess to include firing Sync custom event
     */
    // onSuccess: function(){
    //     this.fireEvent('complete', arguments).fireEvent('success', arguments).fireEvent('sync', arguments).callChain();
    // },

}).implement( methods );