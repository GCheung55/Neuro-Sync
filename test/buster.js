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
        // "test/view-test.js",
        "test/sync-test.js",
        "test/model-sync-test.js"
        // "test/collection-sync-test.js"
    ],
    resources: [
        // used as a static response json stub
        "test/data/users/1/response.json",
        "test/data/users/response.json"
    ]
};
