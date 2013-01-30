var Model = require('Neuro/src/model/main').Model,
    Strategy = require('./strategy/strategy').Strategy;

// Model to store different Sync Strategies
var Strategies = new Model({}, {
    // Make sure that all strategies extend from Strategy Class
    // And should be a Class, not an Object, is what an Class instance is
    validators: function(prop, val){
        return val && Strategy.prototype.isPrototypeOf(val.prototype) && typeOf(val, Class);
    }
});

exports = module.exports = Strategies;