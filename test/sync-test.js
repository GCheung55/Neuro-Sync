buster.testCase('Neuro Sync', {
    setUp: function(){
        this.syncObj = new Neuro.Sync({
            url: buster.env.contextPath + '/test/data/users/1/response.json'
        });
        // console.log(this.useFakeServer.toString());
    },

    'should extend from Request.JSON': function(){
        // Checks if Request.JSON is in the prototype chain
        assert(instanceOf(this.syncObj, Request.JSON));
    },

    'should contain create/read/update/delete methods': function(){
        var syncObj = this.syncObj;

        assert(syncObj.create);
        assert(syncObj.read);
        assert(syncObj.update);
        assert(syncObj.delete);
    }
});