buster.testCase('Neuro Sync Model', {
    setUp: function(){
        var testModel = this.testModel = new Class({
            Extends: Neuro.Model,
            _accessors: {
                'fullName': {
                    set: function(prop, val){
                        if (val) {
                            var names = val.split(' '),
                                first = names[0],
                                last = names[1];

                            this.set('firstName', first);
                            this.set('lastName', last);
                            this._data[prop] = first + ' ' + last;
                        }
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

        this.mockRequestOptions = {
            url: buster.env.contextPath + '/test/data/users/1/response.json'
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
            model = this.mockModel,
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
            model = this.mockModel,
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
            model = this.mockModel,
            test1 = 'first';

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

        model.fireEvent('sync', test1);

        refute.called(spy);
    }
});