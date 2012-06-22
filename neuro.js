(function(modules) {
    var cache = {}, require = function(id) {
        var module = cache[id];
        if (!module) {
            module = cache[id] = {};
            var exports = module.exports = {};
            modules[id].call(exports, require, module, exports, window);
        }
        return module.exports;
    };
    window["Neuro"] = require("0");
})({
    "0": function(require, module, exports, global) {
        var Model = require("1"), Collection = require("4"), Sync = require("5");
        Model.Sync = require("6");
        Collection.Sync = require("7");
        exports = module.exports = {
            Model: Model,
            Collection: Collection,
            Sync: Sync
        };
    },
    "1": function(require, module, exports, global) {
        var Is = require("2").Is, Silence = require("3");
        var createGetter = function(type) {
            var isPrevious = type == "_previousData" || void 0;
            return function(prop) {
                var val = this[type][prop], accessor = this.getAccessor[prop], getter = accessor && accessor.get;
                return getter ? getter.call(this, isPrevious) : val;
            }.overloadGetter();
        };
        var Model = new Class({
            Implements: [ Events, Options, Silence ],
            _data: {},
            _changed: false,
            _changedProperties: {},
            _previousData: {},
            _accessors: {},
            options: {
                accessors: {},
                defaults: {},
                silent: false
            },
            initialize: function(data, options) {
                if (instanceOf(data, this.constructor)) {
                    return data;
                }
                this.setup(data, options);
            },
            setup: function(data, options) {
                this.setOptions(options);
                this.setAccessor(this.options.accessors);
                this.silence(this.options.silent);
                if (data) {
                    this._data = Object.merge({}, this.options.defaults, data);
                }
                return this;
            },
            _set: function(prop, val) {
                var old = this._data[prop], accessor = this.getAccessor(prop), setter = accessor && accessor.set;
                if (Is.Array(val)) {
                    val = val.slice();
                } else if (Is.Object(val)) {
                    val = Object.clone(val);
                }
                if (!Is.Equal(old, val)) {
                    this._changed = true;
                    this._changedProperties[prop] = val;
                    if (setter) {
                        setter.apply(this, arguments);
                    } else {
                        this._data[prop] = val;
                    }
                }
                return this;
            }.overloadSetter(),
            set: function(prop, val) {
                this._setPreviousData();
                this._set(prop, val);
                this.changeProperty(this._changedProperties);
                this.change();
                this._resetChanged();
                return this;
            },
            unset: function(prop) {
                this.set(prop, void 0);
                return this;
            },
            get: createGetter("_data"),
            getData: function() {
                return Object.clone(this._data);
            },
            _setPreviousData: function() {
                this._previousData = Object.clone(this._data);
                return this;
            },
            getPrevious: createGetter("_previousData"),
            getPreviousData: function() {
                return Object.clone(this._previousData);
            },
            _resetChanged: function() {
                if (this._changed) {
                    this._changed = false;
                    this._changedProperties = {};
                }
                return this;
            },
            change: function() {
                if (this._changed) {
                    this.signalChange();
                }
                return this;
            },
            changeProperty: function(prop, val) {
                if (this._changed) {
                    this.signalChangeProperty(prop, val);
                }
                return this;
            }.overloadSetter(),
            destroy: function() {
                this.signalDestroy();
                return this;
            },
            signalChange: function() {
                !this.isSilent() && this.fireEvent("change", this);
                return this;
            },
            signalChangeProperty: function(prop, val) {
                !this.isSilent() && this.fireEvent("change:" + prop, [ this, prop, val ]);
                return this;
            },
            signalDestroy: function() {
                !this.isSilent() && this.fireEvent("destroy", this);
                return this;
            },
            toJSON: function() {
                return this.getData();
            },
            setAccessor: function(key, val) {
                this._accessors[key] = val;
                return this;
            }.overloadSetter(),
            getAccessor: function(key) {
                return this._accessors[key];
            }.overloadGetter(),
            unsetAccessor: function(key) {
                delete this._accessors[key];
                this._accessors[key] = undefined;
                return this;
            }
        });
        [ "subset", "map", "filter", "every", "some", "keys", "values", "getLength", "keyOf", "contains", "toQueryString" ].each(function(method) {
            Model.implement(method, function() {
                return Object[method].apply(Object, [ this._data ].append(Array.from(arguments)));
            });
        });
        module.exports = Model;
    },
    "2": function(require, module, exports, global) {
        (function(context) {
            var toString = Object.prototype.toString, hasOwnProperty = Object.prototype.hasOwnProperty, oldType = window.Type, Is = context.Is = {};
            var Type = window.Type = function(name, object) {
                var obj = new oldType(name, object), str;
                if (!obj) {
                    return obj;
                }
                str = "is" + name, Is[name] = Is.not[name] = Type[str] = oldType[str];
                return obj;
            }.extend(oldType);
            Type.prototype = oldType.prototype;
            for (var i in oldType) {
                if (Type.hasOwnProperty(i) && i.test("is")) {
                    i = i.replace("is", "");
                    Is[i] = Type["is" + i];
                }
            }
            Is["NaN"] = function(a) {
                return a !== a;
            };
            Is["Null"] = function(a) {
                return a === null;
            };
            Is["Undefined"] = function(a) {
                return a === void 0;
            };
            var matchMap = {
                string: function(a, b) {
                    return a == String(b);
                },
                number: function(a, b) {
                    return a != +a ? b != +b : a == 0 ? 1 / a == 1 / b : a == +b;
                },
                date: function(a, b) {
                    return +a == +b;
                },
                "boolean": function(a, b) {
                    return this.date(a, b);
                },
                regexp: function(a, b) {
                    return a.source == b.source && a.global == b.global && a.multiline == b.multiline && a.ignoreCase == b.ignoreCase;
                }
            };
            var has = function(obj, key) {
                return obj.hasOwnProperty(key);
            };
            var eq = function(a, b, stack) {
                if (a === b) return a !== 0 || 1 / a == 1 / b;
                if (a == null || b == null) return a === b;
                if (a.isEqual && Is.Function(a.isEqual)) return a.isEqual(b);
                if (b.isEqual && Is.Function(b.isEqual)) return b.isEqual(a);
                var typeA = typeOf(a), typeB = typeOf(b);
                if (typeA != typeB) {
                    return false;
                }
                if (matchMap[typeA]) {
                    return matchMap[typeA](a, b);
                }
                if (typeA != "object" || typeB != "object") return false;
                var length = stack.length;
                while (length--) {
                    if (stack[length] == a) return true;
                }
                stack.push(a);
                var size = 0, result = true;
                if (typeA == "array") {
                    size = a.length;
                    result = size == b.length;
                    if (result) {
                        while (size--) {
                            if (!(result = size in a == size in b && eq(a[size], b[size], stack))) break;
                        }
                    }
                } else {
                    if ("constructor" in a != "constructor" in b || a.constructor != b.constructor) return false;
                    for (var key in a) {
                        if (has(a, key)) {
                            size++;
                            if (!(result = has(b, key) && eq(a[key], b[key], stack))) break;
                        }
                    }
                    if (result) {
                        for (key in b) {
                            if (has(b, key) && !(size--)) break;
                        }
                        result = !size;
                    }
                }
                stack.pop();
                return result;
            };
            Is.Equal = function(a, b) {
                return eq(a, b, []);
            };
            (function(obj) {
                var not = {};
                for (var key in obj) {
                    if (has(obj, key)) {
                        not[key] = function(name) {
                            return function(a, b) {
                                return !obj[name].call(obj, a, b);
                            };
                        }(key);
                    }
                }
                obj.not = not;
            })(Is);
        })(typeof exports != "undefined" ? exports : window);
    },
    "3": function(require, module, exports, global) {
        var Silence = new Class({
            _silent: false,
            silence: function(silent) {
                this._silent = !!silent;
                return this;
            },
            isSilent: function() {
                return !!this._silent;
            }
        });
        exports = module.exports = Silence;
    },
    "4": function(require, module, exports, global) {
        var Model = require("1"), Silence = require("3");
        var Collection = new Class({
            Implements: [ Events, Options, Silence ],
            _models: [],
            _bound: {},
            options: {
                Model: Model,
                silent: false
            },
            initialize: function(models, options) {
                this.setup(models, options);
            },
            setup: function(models, options) {
                this.setOptions(options);
                this._bound = {
                    remove: this.remove.bind(this)
                };
                this._Model = this.options.Model;
                this.silence(this.options.silent);
                if (models) {
                    this.add(models);
                }
                return this;
            },
            hasModel: function(model) {
                return this._models.contains(model);
            },
            _add: function(model) {
                model = new this._Model(model);
                if (!this.hasModel(model)) {
                    model.addEvent("destroy", this._bound.remove);
                    this._models.push(model);
                    this.signalAdd(model);
                }
                return this;
            },
            add: function(models) {
                models = Array.from(models);
                var len = models.length, i = 0;
                while (len--) {
                    this._add(models[i++]);
                }
                return this;
            },
            get: function(index) {
                var len = arguments.length, i = 0, results;
                if (len > 1) {
                    results = [];
                    while (len--) {
                        results.push(this.get(arguments[i++]));
                    }
                    return results;
                }
                return this._models[index];
            },
            _remove: function(model) {
                model.removeEvent("destroy", this._bound.remove);
                this._models.erase(model);
                this.signalRemove(model);
                return this;
            },
            remove: function(models) {
                models = Array.from(models).slice();
                var l = models.length, i = 0;
                while (l--) {
                    this._remove(models[i++]);
                }
                return this;
            },
            replace: function(oldModel, newModel, signal) {
                var index;
                if (oldModel && newModel) {
                    index = this.indexOf(oldModel);
                    if (index > -1) {
                        newModel = new this._Model(newModel);
                        this._models.splice(index, 1, newModel);
                        if (signal) {
                            this.signalAdd(newModel);
                            this.signalRemove(oldModel);
                        }
                    }
                }
                return this;
            },
            empty: function() {
                this.remove(this._models);
                this.signalEmpty();
                return this;
            },
            signalAdd: function(model) {
                !this.isSilent() && this.fireEvent("add", [ this, model ]);
                return this;
            },
            signalRemove: function(model) {
                !this.isSilent() && this.fireEvent("remove", [ this, model ]);
                return this;
            },
            signalEmpty: function() {
                !this.isSilent() && this.fireEvent("empty", this);
                return this;
            },
            toJSON: function() {
                return this.map(function(model) {
                    return model.toJSON();
                });
            }
        });
        [ "forEach", "each", "invoke", "every", "filter", "clean", "indexOf", "map", "some", "associate", "link", "contains", "getLast", "getRandom", "flatten", "pick" ].each(function(method) {
            Collection.implement(method, function() {
                return Array.prototype[method].apply(this._models, arguments);
            });
        });
        module.exports = Collection;
    },
    "5": function(require, module, exports, global) {
        var REST = function(type) {
            return function() {
                this[type].apply(this, arguments);
                return this;
            };
        };
        var Sync = new Class({
            Extends: Request.JSON,
            sync: function(type, options, callback) {
                if (callback && typeOf(callback) == "function") {
                    this.attachEventOnce("sync", callback);
                }
                this[type ? type : "update"](options);
                return this;
            },
            attachEventOnce: function(type, fnc) {
                var once, cancel;
                cancel = function() {
                    this.removeEvent(type, once);
                    this.removeEvent("cancel", cancel);
                };
                once = function() {
                    fnc.apply(this, arguments);
                    cancel.call(this);
                };
                this.addEvent(type, once);
                this.addEvent("cancel", cancel);
                return this;
            },
            create: REST("POST"),
            read: REST("GET"),
            update: REST("PUT")
        });
        module.exports = Sync;
    },
    "6": function(require, module, exports, global) {
        var Model = require("1"), Sync = require("5");
        Model = new Class({
            Extends: Model,
            _new: true,
            options: {
                request: {},
                isNew: true
            },
            isNew: function() {
                return this._new;
            },
            setNew: function(bool) {
                this._new = !!bool;
                return this;
            },
            setup: function(data, options) {
                this.parent(data, options);
                this.setNew(this.options.isNew);
                this.setupSync(this.options.request);
                return this;
            },
            setupSync: function(options) {
                var _this = this, events = {
                    request: function() {
                        _this.fireEvent("sync:request", [ this, _this ]);
                    },
                    success: function(response) {
                        _this.fireEvent("sync", [ response, _this ]);
                    },
                    failure: function() {
                        _this.fireEvent("sync:failure", [ this, _this ]);
                    },
                    error: function() {
                        _this.fireEvent("sync:error", [ this, _this ]);
                    }
                }, request = new Sync(this.options.request);
                this.request = request.addEvents(events);
                return this;
            },
            sync: function(type, options, callback) {
                var data = this.toJSON();
                if (!options) {
                    options = {};
                }
                options.data = Object.merge({}, options.data, data);
                this.request.sync(type, options, callback);
                return this;
            },
            save: function(prop, val, options) {
                if (typeOf(prop) == "object" && typeOf(val) == "object") {
                    options = val;
                    val = undefined;
                }
                var isNew = this.isNew();
                method = [ "create", "update" ][+isNew];
                if (prop) {
                    this.set(prop, val);
                }
                this.sync(method, options, function(response, model) {
                    if (response) {
                        model.set(response);
                    }
                    model.fireEvent("save", arguments);
                    model.fireEvent(method);
                });
                isNew && this.setNew(false);
                return this;
            },
            fetch: function(options) {
                this.sync("read", options, function(response, model) {
                    if (response) {
                        model.set(response);
                    }
                    model.setNew(false);
                    model.fireEvent("fetch", arguments);
                });
                return this;
            },
            destroy: function(options) {
                this.request.cancel();
                this.sync("delete", options, function(response, model) {
                    model.fireEvent("delete", arguments);
                });
                this.parent();
                return this;
            }
        });
        module.exports = Model;
    },
    "7": function(require, module, exports, global) {
        var Model = require("6"), Collection = require("4"), Sync = require("5");
        Collection = new Class({
            Extends: Collection,
            options: {
                request: {},
                Model: Model
            },
            setup: function(models, options) {
                this.parent(models, options);
                this.setupSync();
            },
            setupSync: function(options) {
                var _this = this, events = {
                    request: function() {
                        _this.fireEvent("sync:request", [ this, _this ]);
                    },
                    success: function(response) {
                        _this.fireEvent("sync", [ response, _this ]);
                    },
                    failure: function() {
                        _this.fireEvent("sync:failure", [ this, _this ]);
                    },
                    error: function() {
                        _this.fireEvent("sync:error", [ this, _this ]);
                    }
                }, request = new Sync(this.options.request);
                this.request = request.addEvents(events);
                return this;
            },
            sync: function(type, options, callback) {
                var data = this.toJSON();
                if (!options) {
                    options = {};
                }
                options.data = Object.merge({}, options.data, data);
                this.request.sync(type, options, callback);
                return this;
            },
            fetch: function(options) {
                this.sync("read", options, function(response, collection) {
                    if (response) {
                        collection.add(response);
                    }
                    collection.fireEvent("fetch", arguments);
                });
                return this;
            }
        });
        module.exports = Collection;
    }
});