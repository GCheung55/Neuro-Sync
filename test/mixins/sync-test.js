buster.testCase('Neuro Sync Mixin', {
    setUp: function(){
        this.syncMixin = new Neuro.Mixins.Sync;
        this.server = sinon.fakeServer.create();
        this.server.autoRespond = true;
    },

    tearDown: function(){
        this.server.restore();
    },

    'setupSync() should create a _strategies model object, set strategies in options.Strategies, and set the default strategy': function(){
        var sync = this.syncMixin.setupSync({
            default: 'Server',
            Strategies: {
                Server: {
                    request: {
                        url: 'abc/def'
                    }
                }
            }
        });

        assert(sync._strategies);
        assert.equals(sync._strategies.get('Server').options.request.url, 'abc/def');
        assert.equals(sync._currentStrategy, 'Server');
    },

    // 'attachStrategyEvents() should attach handlers to strategy success and cancel events': function(){
    //     var success = this.spy();
    //     var cancel = this.spy();
    //     var sync = this.syncMixin.setupSync({
    //         default: 'Server',
    //         Strategies: {
    //             Server: {}
    //         }
    //     });

    //     sync.addEvent('sync', success)
    //     sync.addEvent('sync:cancel', cancel)

    //     sync.getStrategy('Server').fireEvent('success').fireEvent('cancel');

    //     assert.calledWith(success);
    //     assert.calledWith(cancel);
    // },

    // 'detachStrategyEvents() should detach handlers from strategy success and cancel events': function(){
    //     var success = this.spy();
    //     var cancel = this.spy();
    //     var sync = this.syncMixin.setupSync({
    //         default: 'Server',
    //         Strategies: {
    //             Server: {}
    //         }
    //     });

    //     sync.addEvent('sync', success)
    //     sync.addEvent('sync:cancel', cancel)

    //     sync.detachStrategyEvents(sync.getStrategy('Server'));

    //     sync.getStrategy('Server').fireEvent('success').fireEvent('cancel');

    //     refute.calledWith(success);
    //     refute.calledWith(cancel);
    // },

    'setStrategy() should set a strategy to the _strategies object, where the name references the Strategy class stored in the Strategies object': function(){
        var sync = this.syncMixin.setupSync();
        var ServerClass = Neuro.Sync.Strategies.get('Server');
        
        sync.setStrategy('Server');

        assert(instanceOf(sync._strategies.get('Server'), ServerClass));
    },

    'getStrategy() should return a stored strategy instance with a key from the _strategies object': function(){
        var sync = this.syncMixin.setupSync();
        var ServerClass = Neuro.Sync.Strategies.get('Server');
        
        sync.setStrategy('Server');

        assert(instanceOf(sync.getStrategy('Server'), ServerClass));
    },

    
    'changeStrategy()': {
        setUp: function(){
            var ServerClass = Neuro.Sync.Strategies.get('Server');
            var ServerClassII = new Class({
                Extends: ServerClass
            });

            Neuro.Sync.Strategies.set('ServerII', ServerClassII);
        },

        tearDown: function(){
            Neuro.Sync.Strategies.unset('ServerII', void 0);
        },

        'should change the currentStrategy, if it exists': function(){
            var sync = this.syncMixin.setupSync({
                default: 'Server',
                Strategies: {
                    Server: {},
                    ServerII: {}
                }
            });

            assert.equals(sync._currentStrategy, 'Server');

            sync.changeStrategy('ServerIII');

            refute.equals(sync._currentStrategy, 'ServerIII');

            sync.changeStrategy('ServerII');

            assert.equals(sync._currentStrategy, 'ServerII');
        }
    },

    'useStrategy()': {
        setUp: function(){
            var ServerClass = Neuro.Sync.Strategies.get('Server');
            var ServerClassII = new Class({
                Extends: ServerClass
            });

            Neuro.Sync.Strategies.set('ServerII', ServerClassII);
        },

        tearDown: function(){
            Neuro.Sync.Strategies.unset('ServerII', void 0);
        },

        'should temporarily switch to a strategy and execute the callback': function(){
            var sync = this.syncMixin.setupSync({
                default: 'Server',
                Strategies: {
                    Server: {},
                    ServerII: {}
                }
            });

            assert.equals(sync._currentStrategy, 'Server');

            sync.useStrategy('ServerII', function(){
                assert.equals(this._currentStrategy, 'ServerII');
            });

            assert.equals(sync._currentStrategy, 'Server');
        }
    },

    'sync()': {
        'should execute a strategy method': function(){
            var url = 'abc/def';
            var sync = this.syncMixin.setupSync({
                default: 'Server',
                Strategies: {
                    Server: {
                        request: {
                            url: url
                        }
                    }
                }
            });
            var spy = this.spy(sync.getStrategy('Server'), 'sync');

            this.server.respondWith('GET', url, [200, {"content-type": "application/json"}, '{}']);

            sync.sync('sync', {
                method: 'GET'
            });

            this.server.respond();

            assert.calledOnce(spy);
        },

        'should execute a callback that is passed as an argument': function(){
            var url = 'abc/def';
            var sync = this.syncMixin.setupSync({
                default: 'Server',
                Strategies: {
                    Server: {
                        request: {
                            url: url
                        }
                    }
                }
            });
            var cb = this.spy();

            this.server.respondWith('GET', url, [200, {"content-type": "application/json"}, '{}']);

            sync.sync('sync', {
                method: 'GET'
            }, cb);

            this.server.respond();

            assert.calledOnce(cb);
        },

        'silently (not triggering any events that have been attached to the mixin)': function(){
            var url = 'abc/def';
            var sync = this.syncMixin.setupSync({
                default: 'Server',
                Strategies: {
                    Server: {
                        request: {
                            url: url
                        }
                    }
                }
            });
            var cb = this.spy();
            var success = this.spy();

            sync.addEvent('sync', success);

            this.server.respondWith('GET', url, [200, {"content-type": "application/json"}, '{}']);

            sync.silence(function(){
                this.sync('sync', {
                    method: 'GET'
                }, cb);
            });

            this.server.respond();

            assert.calledOnce(cb);
            refute.calledOnce(success);
        }
    },

    'process() should return the argument passed into it': function(){
        assert.equals(this.syncMixin.process(123), 123);
    },

    'cancel() should cancel the strategies current action and trigger sync:cancel event': function(){
        var url = 'abc/def';
        var sync = this.syncMixin.setupSync({
            default: 'Server',
            Strategies: {
                Server: {
                    request: {
                        url: url
                    }
                }
            }
        });
        var cancel = this.spy();

        sync.addEvent('sync:cancel', cancel);

        sync.cancel();

        assert.calledOnce(cancel);
    }

    // ,'signalSync()': {
    //     'should fire sync event and pass "this" + arguments': function(){
    //         var sync = this.syncMixin;
    //         var spy = this.spy();
    //         var args = 123;

    //         sync.addEvent('sync', spy);

    //         sync.signalSync(args);

    //         assert.calledOnceWith(spy, sync, args);
    //     },

    //     'should not fire sync event if isSilent is true': function(){
    //         var sync = this.syncMixin;
    //         var spy = this.spy();
    //         var args = 123;

    //         sync.addEvent('sync', spy);

    //         sync.silence(function(){
    //             this.signalSync(args);
    //         });

    //         refute.calledOnceWith(spy, sync, args);
    //     }
    // },

    // 'signalSyncCancel()': {
    //     'should fire sync:cancel event and pass "this"': function(){
    //         var sync = this.syncMixin;
    //         var spy = this.spy();
    //         var args = 123;

    //         sync.addEvent('sync:cancel', spy);

    //         sync.signalSyncCancel(args);

    //         assert.calledOnceWith(spy, sync);

    //         refute.calledOnceWith(spy, args);
    //     },

    //     'should not fire sync event if isSilent is true': function(){
    //         var sync = this.syncMixin;
    //         var spy = this.spy();

    //         sync.addEvent('sync:cancel', spy);

    //         sync.silence(function(){
    //             this.signalSyncCancel();
    //         });

    //         refute.calledOnceWith(spy, sync);
    //     }
    // }
});