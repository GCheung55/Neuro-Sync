buster.testCase('Neuro Sync Model', {
    setUp: function(){
        var testModel = new Class({
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

    'sync events (request, complete, sync, failure, error) should be set via request option': function(){
        assert(true);
    }
});