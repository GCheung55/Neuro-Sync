var SyncRequest = Neuro.Sync.Request;

buster.testCase('Neuro Sync Request', {
    setUp: function(){
        this.server = sinon.fakeServer.create();
        this.server.autoRespond = true;
    },

    tearDown: function(){
        this.server.restore();
    },

    'should be an instance of Request.JSON': function(){
        assert(instanceOf(new SyncRequest, Request.JSON));
    }
});