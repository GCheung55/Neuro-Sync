var Strategy = Neuro.Sync.Strategy,
    Strategies = Neuro.Sync.Strategies,
    SyncRequest = Neuro.Sync.Request;

buster.testCase('Neuro Sync Strategy Server', {
    setUp: function(){
        this.strategies = Strategies;
        this.dummyKlass = new Class({Implements: [Events, Options]});
    },

    tearDown: function(){

    },

    'should be an instance of Strategy': function(){
        assert(instanceOf(new (this.strategies.get('Server')), Strategy));
    },

    'setupRequest()': {
        setUp: function(){

        },

        tearDown: function(){

        },

        'should create a Sync.Request instance': {
            'without options argument': function(){
                var sync = new (this.strategies.get('Server'));

                assert(instanceOf(sync.request, SyncRequest));
            },

            'with options argument': function(){
                var sync = new (this.strategies.get('Server')),
                    requestOpts = {
                        url: 'blah/blah',
                        method: 'create'
                    };

                sync.setupRequest(requestOpts);

                assert.equals(sync.request.options.url, requestOpts.url);
                assert.equals(sync.request.options.method, requestOpts.method);
            }
        },

        'request instance': {
            setUp: function(){
                this.strategyInstance = new (this.strategies.get('Server'));
            },

            tearDown: function(){
                delete this.strategyInstance;
            },

            'should trigger': {
                'request event': function(){
                    var spy = this.spy();

                    this.strategyInstance.addEvent('request', spy);

                    this.strategyInstance.request.fireEvent('request');

                    assert.calledOnce(spy);
                },

                'complete event': function(){
                    var spy = this.spy();

                    this.strategyInstance.addEvent('complete', spy);

                    this.strategyInstance.request.fireEvent('complete');

                    assert.calledOnce(spy);
                },

                'success event': function(){
                    var spy = this.spy();

                    this.strategyInstance.addEvent('success', spy);

                    this.strategyInstance.request.fireEvent('success');

                    assert.calledOnce(spy);
                },

                'failure event': function(){
                    var spy = this.spy();

                    this.strategyInstance.addEvent('failure', spy);

                    this.strategyInstance.request.fireEvent('failure');

                    assert.calledOnce(spy);
                },

                'error event': function(){
                    var spy = this.spy();

                    this.strategyInstance.addEvent('error', spy);

                    this.strategyInstance.request.fireEvent('error');

                    assert.calledOnce(spy);
                }
            }
        }
    },

    '_addEventOnce': {
        'should add an event listener that is removed':{
            'once triggered': function(){
                var sync = new (this.strategies.get('Server')),
                    spy = this.spy();

                sync._addEventOnce(spy);

                sync.fireEvent('success');
                sync.fireEvent('success');

                assert.calledOnce(spy);
            },

            'when cancel() is called': function(){
                var sync = new (this.strategies.get('Server')),
                    spy = this.spy();

                sync._addEventOnce(spy);

                sync.cancel();

                sync.fireEvent('success');

                refute.calledOnce(spy);
            }
        }
    },

    'sync()': {
        setUp: function(){
            this.server = sinon.fakeServer.create();
            this.server.autoRespond = true;
            this.syncServer = this.strategies.get('Server');
        },

        tearDown: function(){
            this.server.restore();
        },

        'should take options and callback to make a request': function(){
            var sync = new this.syncServer,
                url = 'abc/def',
                spy = this.spy();

            this.server.respondWith('GET', url, [200, {"content-type": "application/json"}, '{}']);

            sync.sync({
                url: url,
                method: 'GET'
            }, spy);

            this.server.respond();

            assert.calledWith(spy);
        },

        'with save()': {
            'should take options and callback to make a request with': {
                'CREATE method if is new': function(){
                    var sync = new this.syncServer({
                        request: {emulation: false}
                    })
                    var url = 'abc/def';
                    var spy = this.spy();

                    this.server.respondWith('CREATE', url, [200, {"content-type": "application/json"}, '{}']);

                    assert.equals(sync.isNew(), true);

                    sync.save({
                        url: url
                    }, spy);

                    this.server.respond();

                    assert.equals(this.server.requests[0].requestBody, '');

                    assert.equals(sync.isNew(), false);

                    assert.calledWith(spy);
                },

                'UPDATE method if is not new': function(){
                    var sync = new this.syncServer({
                        request: {emulation: false}
                    })
                    var url = 'abc/def';
                    var spy = this.spy();

                    this.server.respondWith('UPDATE', url, [200, {"content-type": "application/json"}, '{}']);

                    assert.equals(sync.isNew(), true);

                    sync.setNew(false);

                    sync.save({
                        url: url
                    }, spy);

                    this.server.respond();

                    assert.equals(this.server.requests[0].requestBody, '');

                    assert.equals(sync.isNew(), false);

                    assert.calledWith(spy);
                }
            }
        },

        'with fetch()': {
            'should take options and callback to make a request with READ method': function(){
                var sync = new this.syncServer({
                    request: {emulation: false}
                })
                var url = 'abc/def';
                var spy = this.spy();

                this.server.respondWith('READ', url, [200, {"content-type": "application/json"}, '{}']);

                assert.equals(sync.isNew(), true);

                sync.fetch({
                    url: url
                }, spy);

                this.server.respond();

                assert.equals(this.server.requests[0].requestBody, '');

                assert.equals(sync.isNew(), false);

                assert.calledWith(spy);
            }
        },

        'with destroy()': {
            'should take options and callback to make a request with DELETE method': function(){
                var sync = new this.syncServer({
                    request: {emulation: false}
                })
                var url = 'abc/def';
                var spy = this.spy();

                this.server.respondWith('DELETE', url, [200, {"content-type": "application/json"}, '{}']);

                sync.destroy({
                    url: url
                }, spy);

                this.server.respond();

                assert.equals(this.server.requests[0].requestBody, '');

                assert.calledWith(spy);
            }
        }
    },

    'cancel() should': {
        setUp: function(){
            this.server = sinon.fakeServer.create();
            this.server.autoRespond = true;
            this.syncServer = this.strategies.get('Server');
        },

        tearDown: function(){
            this.server.restore();
        },

        'trigger sync:cancel and not trigger the callback': function(){
            var sync = new this.syncServer,
                url = 'abc/def',
                cancelSpy = this.spy(),
                callbackSpy = this.spy();

            sync.addEvent('cancel', cancelSpy);

            this.server.respondWith('GET', url, [200, {"content-type": "application/json"}, '{}']);

            sync.sync({
                url: url,
                method: 'GET'
            }, callbackSpy);

            sync.cancel();

            this.server.respond();

            assert.calledWith(cancelSpy);
            refute.calledWith(callbackSpy);
        }
    },

    'check() should': {
        setUp: function(){
            this.server = sinon.fakeServer.create();
            this.server.autoRespond = true;
            this.syncServer = this.strategies.get('Server');
        },

        tearDown: function(){
            this.server.restore();
        },

        'chain request calls if request.options.link == "chain"': function(){
            var cancelSpy = this.spy(),
                spy1 = this.spy(),
                spy2 = this.spy(),
                server = this.server,
                url = 'abc/def',
                sync = new this.syncServer({
                    request: {
                        url: url,
                        link: 'chain'
                    }
                });

                sync.addEvent('cancel', cancelSpy);

                sync.sync(spy1).sync(spy2);

                server.respondWith('POST', url, [200, {"content-type": "application/json"}, '{}']);

                server.respond();

                server.respond();

                refute.calledWith(cancelSpy);

                assert.calledOnce(spy1);

                assert.calledOnce(spy2);
        },

        'cancel request calls if request.options.link == "cancel"': function(){
            var cancelSpy = this.spy(),
                spy1 = this.spy(),
                spy2 = this.spy(),
                server = this.server,
                url = 'abc/def',
                sync = new this.syncServer({
                    request: {
                        url: url,
                        link: 'cancel'
                    }
                });

                sync.addEvent('cancel', cancelSpy);

                sync.sync(spy1).sync(spy2);

                server.respondWith('POST', url, [200, {"content-type": "application/json"}, '{}']);

                server.respond();

                server.respond();

                assert.calledOnce(cancelSpy);

                refute.calledOnce(spy1);

                assert.calledOnce(spy2);
        }
    }
});