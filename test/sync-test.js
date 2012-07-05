buster.testCase('Neuro Sync', {
    setUp: function(){
        // Setup fake XHR
        this.xhr = sinon.useFakeXMLHttpRequest();
        var requests = this.requests = [];

        this.xhr.onCreate = function (xhr) {
            requests.push(xhr);
        };

        this.mockResponse = {
            code: 200,
            contentType: {"Content-Type": "application/json"},
            data: '{"id":"1","firstName":"Garrick","lastName":"Cheung"}'
        };

        this.mockUpdateResponse = {
            code: 200,
            contentType: {"Content-Type": "application/json"},
            data: '{"id":"1","firstName":"Patrick","lastName":"Cheung"}'
        };

        this.mockDeleteResponse = {
            code: 200,
            contentType: {"Content-Type": "application/json"},
            data: '{}'
        };

        this.syncObj = new Neuro.Sync({
            url: buster.env.contextPath + '/test/data/users/1/response.json'
        });
    },

    tearDown: function(){
        // Restore original XHR
        this.xhr.restore();
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
    },

    'should send a POST when create method is used': function(){
        var spy = this.spy(),
            syncObj = this.syncObj,
            response = this.mockResponse,
            request;

        syncObj.addEvent('success', function(json, text){spy(text)});

        syncObj.create();

        assert.equals(this.requests.length, 1);

        request = this.requests[0];

        request.respond(response.code, response.contentType, response.data);

        assert.calledWith(spy, response.data);
        assert.equals(request.method, 'POST');
    },

    'should send a GET when read method is used': function(){
        var spy = this.spy(),
            syncObj = this.syncObj,
            response = this.mockResponse,
            request;

        syncObj.addEvent('success', function(json, text){spy(text)});

        syncObj.read();

        assert.equals(this.requests.length, 1);

        request = this.requests[0];

        request.respond(response.code, response.contentType, response.data);

        assert.calledWith(spy, response.data);
        assert.equals(request.method, 'GET');
    },

    'should send a POST, when emulation is true, when update method is used': function(){
        var spy = this.spy(),
            syncObj = this.syncObj,
            response = this.mockUpdateResponse,
            request;

        syncObj.addEvent('success', function(json, text){spy(text)});

        syncObj.update();

        assert.equals(this.requests.length, 1);

        request = this.requests[0];

        request.respond(response.code, response.contentType, response.data);

        assert.calledWith(spy, response.data);
        assert.equals(request.method, 'POST');
        assert.equals(request.requestBody, '_method=put');
    },

    'should send a PUT, when emulation is false, when update method is used': function(){
        var spy = this.spy(),
            syncObj = this.syncObj.setOptions({emulation:false}),
            response = this.mockUpdateResponse,
            request;

        syncObj.addEvent('success', function(json, text){spy(text)});

        syncObj.update();

        assert.equals(this.requests.length, 1);

        request = this.requests[0];

        request.respond(response.code, response.contentType, response.data);

        assert.calledWith(spy, response.data);
        assert.equals(request.method, 'PUT');
    },



    'should send a POST, when emulation is true, when delete method is used': function(){
        var spy = this.spy(),
            syncObj = this.syncObj,
            response = this.mockDeleteResponse,
            request;

        syncObj.addEvent('success', function(json, text){spy(text)});

        syncObj.delete();

        assert.equals(this.requests.length, 1);

        request = this.requests[0];

        request.respond(response.code, response.contentType, response.data);

        assert.calledWith(spy, response.data);
        assert.equals(request.method, 'POST');
        assert.equals(request.requestBody, '_method=delete');
    },

    'should send a PUT, when emulation is false, when update method is used': function(){
        var spy = this.spy(),
            syncObj = this.syncObj.setOptions({emulation:false}),
            response = this.mockDeleteResponse,
            request;

        syncObj.addEvent('success', function(json, text){spy(text)});

        syncObj.delete();

        assert.equals(this.requests.length, 1);

        request = this.requests[0];

        request.respond(response.code, response.contentType, response.data);

        assert.calledWith(spy, response.data);
        assert.equals(request.method, 'DELETE');
    }
});