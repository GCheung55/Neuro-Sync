(function(context){

var Collection = context.Collection = new Class({

    //Implements: [Unit],
    Extends: Unit,

    // Set prefix when Extending to differentiate against other Collections
    Prefix: '',

    Model: Model,

    _models: [],

    initialize: function(models, options){
        return this.setup(models, options);
    },

    setup: function(models, options){
        if (!options) { options = {}; }

        if (options.prefix) { this.Prefix = options.prefix; }

        this.setupUnit();

        if (models) {
            if (options.silent) {
                this.detachUnit();
            }

            this.add(models).attachUnit();
        }
    },

    hasModel: function(model){
        return this._models.contains(model);
    },

    // Silent publishing by using detachUnit before adding
    _add: function(model){
        model = new this.Model(model);

        if (!this.hasModel(model)) {
            this._models.push(model);

            this.publish('add', [this, model]);
        }

        return this;
    },

    add: function(){
        var l;

        models = Array.from(arguments);
        l = models.length;

        while(l--){
            this._add(models[l]);
        }

        return this;
    },

    /**
     * Get model by index
     * Overloaded to return an array of models if more than one 'index'
     * argument is passed
     *
     * @param  {Number} index Index of model to return
     * @return {Class} Model instance
     */
    get: function(index){
        return this._models[index];
    }.overloadGetter(),

    _remove: function(model){
        model.destroy();

        this._models.erase(model);

        // Silent publishing by using detachUnit before removing
        this.publish('remove', [this, model]);

        return this;
    },

    remove: function(){
        var models = Array.from(arguments), l = models.length;

        while(l--){
            this._remove(models[l]);
        }

        return this;
    },

    empty: function(){
        this.remove.apply(this, this._models);

        this.publish('empty', this);

        return this;
    },

    toJSON: function(){
        return this.map(function(model){
            return model.toJSON();
        });
    }
});

['forEach', 'each', 'invoke', 'every', 'filter', 'clean',  'indexOf', 'map', 'some', 'associate', 'link', 'contains', /*'append',*/ 'getLast', 'getRandom', /*'include', 'combine', 'erase', 'empty',*/ 'flatten', 'pick'].each(function(method){
    Collection.implement(method, function(){
        return Array[method].apply( Array, [this._models].append( Array.from(arguments) ) );
    });
});

}(typeof exports != 'undefined' ? exports : window));