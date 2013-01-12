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
    },

    'create()': {
        'should make a POST AJAX request': function(done){
            var url = "test/request/create",
                request = new SyncRequest({
                    url: url
                });

            this.server.respondWith('POST', url, [200, {"content-type": "application/json"}, '{}']);

            request.addEvent('success', function(){
                assert(true);
                done();
            });

            request.create();

            this.server.respond();
        }
    },

    'read()': {
        'should make a GET AJAX request': function(done){
            var url = "test/request/read",
                request = new SyncRequest({
                    url: url
                });

            this.server.respondWith('GET', url, [200, {"content-type": "application/json"}, '{}']);

            request.addEvent('success', function(){
                assert(true);
                done();
            });

            request.read();

            this.server.respond();
        }
    },

    'update()': {
        'should make an emulated PUT AJAX request': function(done){
            var url = "test/request/update",
                request = new SyncRequest({
                    url: url
                });

            this.server.respondWith('POST', url, [200, {"content-type": "application/json"}, '{}']);

            request.addEvent('success', function(){
                assert(true);
                done();
            });

            request.update();

            this.server.respond();

            assert.equals(this.server.requests[0].requestBody, '_method=put');
        },

        'should make a PUT AJAX request': function(done){
            var url = "test/request/update",
                request = new SyncRequest({
                    url: url,
                    emulation:false
                });

            this.server.respondWith('PUT', url, [200, {"content-type": "application/json"}, '{}']);

            request.addEvent('success', function(){
                assert(true);
                done();
            });

            request.update();

            this.server.respond();
        }
    },

    'delete()': {
        'should make an emulated DELETE AJAX request': function(done){
            var url = "test/request/delete",
                request = new SyncRequest({
                    url: url
                });

            this.server.respondWith('POST', url, [200, {"content-type": "application/json"}, '{}']);

            request.addEvent('success', function(){
                assert(true);
                done();
            });

            request.delete();
            
            assert.equals(this.server.requests[0].requestBody, '_method=delete');

            this.server.respond();
        },

        'should make a DELETE AJAX request': function(done){
            var url = "test/request/delete",
                request = new SyncRequest({
                    url: url,
                    emulation:false
                });

            this.server.respondWith('DELETE', url, [200, {"content-type": "application/json"}, '{}']);

            request.addEvent('success', function(){
                assert(true);
                done();
            });

            request.delete();

            this.server.respond();
        }
    },

    'patch()': {
        'should make an emulated PATCH AJAX request': function(done){
            var url = "test/request/patch",
                request = new SyncRequest({
                    url: url
                });

            this.server.respondWith('POST', url, [200, {"content-type": "application/json"}, '{}']);

            request.addEvent('success', function(){
                assert(true);
                done();
            });

            request.patch();
          
            assert.equals(this.server.requests[0].requestBody, '_method=patch');

            this.server.respond();
            
        },

        'should make a PATCH AJAX request': function(done){
            var url = "test/request/patch",
                request = new SyncRequest({
                    url: url,
                    emulation:false
                });

            this.server.respondWith('PATCH', url, [200, {"content-type": "application/json"}, '{}']);

            request.addEvent('success', function(){
                assert(true);
                done();
            });

            request.patch();

            this.server.respond();
        }
    }
});