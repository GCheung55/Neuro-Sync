buster.testCase('Neuro Sync', {
    setUp: function(){
        this.syncObj = new Neuro.Sync({
            url: buster.env.contextPath + '/test/data/users/1/response.json',
            onSuccess: function(response){
                this.fireEvent('sync', [response]);
            }
        });
        // console.log(this.useFakeServer.toString());
    },

    'should extend from Request.JSON': function(){
        // Checks if Request.JSON is in the prototype chain
        assert(instanceOf(this.syncObj, Request.JSON));
    },

    'sync should initiate request': function(done){
        this.syncObj.addEvent('request', function(){
            assert(true);
            done();
        });

        this.syncObj.sync();
    },

    'addEventOnce should attach an event that is removed once excuted': function(){
        var spy = this.spy(),
            syncObj = this.syncObj,
            test1 = 'first', test2 = 'second';

        syncObj.addEventOnce('sync', function(){
            spy.apply(this, arguments);
        });

        syncObj.fireEvent('sync', test1);
        syncObj.fireEvent('sync', test2);

        assert.calledOnceWith(spy, test1);
        refute.calledOnceWith(spy, test2);
    },

    'cancel should remove the event added by addEventOnce': function(){
        var spy = this.spy(),
            syncObj = this.syncObj,
            test1 = 'first';
        
        syncObj.sync(undefined, {}, function(){
            spy.apply(this, arguments);
        });

        syncObj.cancel();

        syncObj.fireEvent('sync', test1);

        refute.called(spy);
    },

    'cancel should remove the event added by addEventOnce during request': function(){
        var spy = this.spy(),
            syncObj = this.syncObj,
            test1 = 'first';

        syncObj.sync(undefined, {}, function(){
            spy.apply(this, arguments);
        });

        // Request should be running
        assert(syncObj.running);

        syncObj.cancel();

        // Request should no longer be running
        refute(syncObj.running);

        syncObj.fireEvent('sync', test1);

        refute.called(spy);
    }
});