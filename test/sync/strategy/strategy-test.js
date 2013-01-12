var Strategy = Neuro.Sync.Strategy;

buster.testCase('Neuro Sync Strategy', {
    setUp: function(){
        this.strategy = new Strategy;
    },

    tearDown: function(){},

    'should be an instance of Class': function(){
        assert(instanceOf(Strategy, Class));
    },

    'should contain': {
        'sync()': function(){
            assert.equals(typeOf(this.strategy.sync), 'function');
        },

        'cancel()': function(){
            assert.equals(typeOf(this.strategy.cancel), 'function');
        }
    }
});