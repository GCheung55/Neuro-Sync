buster.testCase('Neuro Sync Model', {
    setUp: function(){
        var testModel = this.testModel = new Class({
            Extends: Neuro.Model,
            options: {
                defaults: {
                    'firstName': '',
                    'lastName': '',
                    'age': 0
                }
            },
            _accessors: {
                'fullName': {
                    set: function(prop, val){
                        if (val) {
                            var names = val.split(' '),
                                first = names[0],
                                last = names[1];

                            this.set('firstName', first);
                            this.set('lastName', last);
                        }

                        return val;
                    },
                    get: function(isPrevious){
                        var data = isPrevious ? this._data : this._previousData;

                        return data['fullName'];
                    }
                }
            },

            // Proxying because _addEventOnce is protected
            addEventOnce: function(){
                this._addEventOnce.apply(this, arguments);
                return this;
            }
        });

        this.mockModel = new testModel();

        this.mockData = {
            'firstName': 'Garrick',
            'lastName': 'Cheung',
            'fullName': 'Garrick Cheung',
            'age': 29
        };
    },

    tearDown: function(){
        this.mockModel = new this.testModel();
    },

    'should be marked as "new" on instantiation': function(){
        var test = (new Neuro.Model).isNew();

        assert(test);
    },

    '"new" mark can be changed on instantiation via options': function(){
        var model = new Neuro.Model(undefined, {
                isNew: false
            }),
            test = model.isNew();

        refute(test);
    },

    'should be able to change "new" mark after instantiation': function(){
        var model = new Neuro.Model(undefined, {
                isNew: false
            }),
            test = model.isNew();

        refute(test);

        model.setNew(true);

        assert(model.isNew());
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
                data: '{"id":"1","firstName":"Garrick","lastName":"Cheung","age":"29"}'
            };

            this.mockUpdateResponse = {
                code: '200',
                contentType: {"Content-Type": "application/json"},
                data: '{"id":"1","firstName":"Patrick","lastName":"Cheung","age":"29"}'
            };

            this.mockDeleteResponse = {
                code: '200',
                contentType: {"Content-Type": "application/json"},
                data: '{}'
            };

            var reqOpts = this.mockRequestOptions = {
                url: buster.env.contextPath + '/test/data/users/1/response.json'
            };

            this.mockSyncModel = new this.testModel(undefined, {
                request: reqOpts
            });
        },

        tearDown: function(){
            // Restore original XHR
            // this.xhr.restore();

            this.server.restore();

            var keys = this.mockSyncModel.keys();
            this.mockSyncModel.reset();
        },

        'should have a request object created that is an instance of Sync': function(){
            var model = this.mockModel,
                test = model.request && instanceOf(model.request, Neuro.Sync);

            assert(test);
        },

        'onRequest/onSuccess/onComplete/onError/onFailure/onCancel events should be set via request option': function(){
            var spy = this.spy(),
                fnc = function(type){
                    return function(){
                        spy(type);
                    };
                },
                events = ['request', 'success', 'complete', 'error', 'failure', 'cancel'],
                model = new Neuro.Model(undefined, {
                    request: {
                        url: this.mockRequestOptions.url,
                        onRequest: fnc('request'),
                        onSuccess: fnc('success'),
                        onComplete: fnc('complete'),
                        onError: fnc('error'),
                        onFailure: fnc('failure'),
                        onCancel: fnc('cancel')
                    }
                });

            events.each(function(item){
                model.request.fireEvent(item);
            });

            events.each(function(item){
                assert.calledWith(spy, item);
            });
        },

        '_addEventOnce should attach an event that is removed once excuted': function(){
            var spy = this.spy(),
                model = this.mockSyncModel,
                test1 = 'first', test2 = 'second';

            model.addEventOnce(function(){
                spy.apply(this, arguments);
            });

            model.fireEvent('sync', test1);
            model.fireEvent('sync', test2);

            assert.calledOnceWith(spy, test1);
            refute.calledOnceWith(spy, test2);
        },

        'cancel should remove the event added by addEventOnce': function(){
            var spy = this.spy(),
                model = this.mockSyncModel,
                test1 = 'first';
            
            model.addEventOnce(function(){
                spy.apply(this, arguments);
            });

            model.cancel();

            model.fireEvent('sync', test1);

            refute.called(spy);
        },

        'cancel should remove the event added by addEventOnce during request': function(){
            var spy = this.spy(),
                model = this.mockSyncModel,
                test1 = 'first',
                response = this.mockResponse,
                server = this.server;

            model.sync(undefined, model.toJSON(), function(){
                spy.apply(this, arguments);
            });

            // Request should be running
            assert(model.request.isRunning());

            model.cancel();

            // Request should no longer be running
            refute(model.request.isRunning());

            // The event that's added should be undefined
            refute(model.$events.sync[0]);

            server.respond([response.code, response.contentType, response.data]);

            model.fireEvent('sync', test1);

            refute.called(spy);
        },

        'save should mark the model as not new once a request is made': function(){
            var spy = this.spy(),
                model = this.mockSyncModel,
                response = this.mockResponse;

            this.server.respondWith([response.code, response.contentType, response.data]);

            model.addEvent('save', function(response){spy(JSON.encode(response));});

            assert.equals(model.isNew(), true);

            model.save();

            assert.equals(model.isNew(), false);

            this.server.respond();

            assert.calledWith(spy, response.data);
        },

        'with link:chain option, should make AJAX requests one after another': function(done){
            var spy = this.spy(),
                model = this.mockSyncModel,
                response = this.mockResponse, count = 0, server = this.server;

            // Set the link option to chain
            model.request.setOptions({link: 'chain'});

            model.save(function(response){
                spy(response.count);
                assert.calledWith(spy, 1);
                
                this.request.addEvent('request', function(){
                    server.respond([response.code, response.contentType, JSON.stringify({count:2})]);
                });
            }).save(function(response){
                spy(response.count);
                assert.calledWith(spy, 2);
                done();
            });

            server.respond([response.code, response.contentType, JSON.stringify({count:1})]);
        },

        'save should make a create request if the model is new, and update request if it is old': function(){
            var spy = this.spy(),
                model = this.mockSyncModel,
                response = this.mockResponse,
                server = this.server;

            model.addEvent('create', function(){spy('create');});
            model.addEvent('update', function(){spy('update');});

            assert.equals(model.isNew(), true);

            model.save();

            assert.equals(model.isNew(), false);

            server.respond([response.code, response.contentType, '{"method":"create"}']);

            model.save();

            server.respond([response.code, response.contentType, '{"method":"update"}']);

            assert.calledWith(spy, 'create');
            assert.calledWith(spy, 'update');
        },

        'save should send the model\'s data': function(){
            var spy = this.spy(),
                createResponse = this.mockResponse,
                model = this.mockSyncModel.set(JSON.decode(createResponse.data)),
                server = this.server;

            // make sure _method is a part of the request body so we can test a query string
            model.request.setOptions({emulation: false})

            model.save();

            server.respond();

            assert.equals(server.requests[0].requestBody, model.toQueryString());
        },

        'fetch should make a request with a read request method': function(){
            var model = this.mockSyncModel,
                response = this.mockResponse,
                server = this.server;

            model.request.setOptions({emulation:false});

            model.fetch();

            server.respond([response.code, response.contentType, response.data]);

            assert(server.requests[0].method, 'READ');
        },

        'fetch should set data from the response': function(){
            var spy = this.spy(),
                model = this.mockSyncModel,
                response = this.mockResponse,
                server = this.server;

            assert.equals(model.toJSON(), model.options.defaults);

            model.fetch();

            server.respond([response.code, response.contentType, response.data]);

            assert.equals(model.toJSON(), JSON.decode(response.data));
        },

        // 'reset before setting data when fetched': function(){
        //     var spy = this.spy(),
        //         model = this.mockSyncModel,
        //         response = this.mockResponse,
        //         server = this.server,
        //         reset = true;

        //     model.addEvent('reset', function(){
        //         assert.equals(this.toJSON(), this.options.defaults);
        //     });

        //     assert.equals(model.toJSON(), model.options.defaults);

        //     model.fetch(reset);

        //     server.respond([response.code, response.contentType, response.data]);

        //     assert.equals(model.get('id'), JSON.decode(response.data)['id']);
        // },

        'destroy should make a request with a delete request method': function(){
            var model = this.mockSyncModel,
                response = this.mockResponse,
                server = this.server;

            model.request.setOptions({emulation:false});

            model.destroy();

            server.respond([response.code, response.contentType, response.data]);

            assert(server.requests[0].method, 'DELETE');
        }
    }
});