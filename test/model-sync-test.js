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

    'should add strategies via options': function(){

        var model = new Neuro.Model({}, {
            Sync: {
                default: 'Server',
                Strategies:{
                    Server: {
                        options: {
                            request: {
                                url: 'abc/def'
                            }
                        }
                    }
                }
            }
        });

        var serverStrategy = model._strategies.get('Server');

        assert(serverStrategy);
    },

    'save()': function(){},

    'fetch()': function(){},

    'destroy()': function(){}
});