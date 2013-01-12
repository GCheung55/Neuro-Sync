exports = module.exports = {
    Request: require('./request').Request,
    Strategy: require('./strategy/strategy').Strategy,
    Strategies: require('./strategies').set({
        Server: require('./strategy/server').Server
    })
};