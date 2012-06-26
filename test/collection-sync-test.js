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
    }
});