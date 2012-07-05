buster.testCase('Neuro Collection Sync', {
    setUp: function(){
        this.mockCollection = new Neuro.Collection();

        this.mockData = {
            a: 'str', b: [], c: {}
        };
    },

    'should have a request object that is an instance of Sync': function(){
        var collection = this.mockCollection,
            test = collection.request && instanceOf(collection.request, Neuro.Sync);

        assert(test);
    },

    'Sync': {
        setUp: function(){
            // Setup fake XHR
            // this.xhr = sinon.useFakeXMLHttpRequest();
            // var requests = this.requests = [];

            // this.xhr.onCreate = function (xhr) {
            //     requests.push(xhr);
            // };
            this.server = new this.useFakeServer();
            // console.log(this.server.xhr.onCreate);

            this.mockResponse = {
                code: '200',
                contentType: {"Content-Type": "application/json"},
                data: '[{"id": "1", "firstName": "Garrick", "lastName": "Cheung"}, {"id": "2", "firstName": "Mark", "lastName": "Obcena"}, {"id": "3", "firstName": "Dimitar", "lastName": "Christoff"}, {"id": "4", "firstName": "Chase", "lastName": "Wilson"}]'
            };

            var reqOpts = this.mockRequestOptions = {
                url: buster.env.contextPath + '/test/data/users/response.json'
            };

            this.mockSyncCollection = new Neuro.Collection(undefined, {
                request: reqOpts
            });
        },

        tearDown: function(){
            // Restore original XHR
            // this.xhr.restore();

            this.server.restore();

            this.mockSyncCollection.empty();
        },

        'fetch should send a READ AJAX request': function(){
            var response = this.mockResponse,
                collection = this.mockSyncCollection,
                server = this.server;

            collection.fetch();

            server.respond([response.code, response.contentType, '{}']);

            assert(server.requests[0].method, 'READ');
        },

        'fetch should take a callback function as an argument and excute it upon request completion and passing the response as an argument': function(){
            var spy = this.spy(),
                response = this.mockResponse,
                collection = this.mockSyncCollection,
                server = this.server;

            collection.fetch(false, spy);

            server.respond([response.code, response.contentType, response.data]);

            assert.calledWith(spy, JSON.decode(response.data));
        },

        'fetch should add the data from the response as models': function(){
            var response = this.mockResponse,
                collection = this.mockSyncCollection,
                server = this.server;

            collection.fetch();

            server.respond([response.code, response.contentType, response.data]);

            assert(collection._models.length, 4);
        },

        'upon request response, fetch should empty existing models from the collection if an empty flag is passed to fetch': function(){
            var response = this.mockResponse,
                model = new Neuro.Model(this.mockData),
                collection = this.mockSyncCollection.add(model),
                server = this.server;

            assert(collection._models.length, 1);

            collection.fetch(true);

            server.respond([response.code, response.contentType, response.data]);

            assert(collection._models.length, 4);

            refute(collection.contains(model));
        }
    }
});