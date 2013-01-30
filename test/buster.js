var config = module.exports;

config["Neuro-Sync"] = {
    rootPath: "../",
    environment: "browser", // or "node"
    sources: [
        "test/assets/js/mootools-core.js",
        "neuro-sync.js"
    ],
    tests: [
        // "test/*-test.js"
        //@todo finish
        "test/model-sync-test.js",
        //@todo finish
        // "test/collection-sync-test.js",
        "test/mixins/sync-test.js",
        "test/sync/request-test.js",
        "test/sync/strategy/strategy-test.js",
        "test/sync/strategy/server-test.js"
    ],
    resources: [
        // used as a static response json stub
        "test/data/users/1/response.json",
        "test/data/users/response.json"
    ]
};
