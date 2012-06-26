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
        var Neuro = require("1");
        Neuro.Sync = require("7");
        Neuro.Model = require("8");
        Neuro.Collection = require("a");
        exports = module.exports = Neuro;
    },
    "1": function(require, module, exports, global) {
        var Neuro = require("2");
        Neuro.Model = require("3");
        Neuro.Collection = require("6");
        exports = module.exports = Neuro;
    },
    "2": function(require, module, exports, global) {
        var Neuro = {
            version: "0.1.x"
        };
        exports = module.exports = Neuro;
    },
    "3": function(require, module, exports, global) {
        var Is = require("4").Is, Silence = require("5");
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
                !this.isSilent() && this.fireEvent("change");
                return this;
            },
            signalChangeProperty: function(prop, val) {
                !this.isSilent() && this.fireEvent("change:" + prop, [ prop, val ]);
                return this;
            },
            signalDestroy: function() {
                !this.isSilent() && this.fireEvent("destroy");
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
    "4": function(require, module, exports, global) {
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
    "5": function(require, module, exports, global) {
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
    "6": function(require, module, exports, global) {
        var Model = require("3"), Silence = require("5");
        var Collection = new Class({
            Implements: [ Events, Options, Silence ],
            _models: [],
            _bound: {},
            options: {
                Model: Model,
                modelOptions: undefined,
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
                model = new this._Model(model, this.options.modelOptions);
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
                        newModel = new this._Model(newModel, this.options.modelOptions);
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
                !this.isSilent() && this.fireEvent("add", model);
                return this;
            },
            signalRemove: function(model) {
                !this.isSilent() && this.fireEvent("remove", model);
                return this;
            },
            signalEmpty: function() {
                !this.isSilent() && this.fireEvent("empty");
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
    "7": function(require, module, exports, global) {
        var REST = function(type) {
            return function() {
                this[type].apply(this, arguments);
                return this;
            };
        };
        var Sync = new Class({
            Extends: Request.JSON,
            onSuccess: function() {
                this.fireEvent("complete", arguments).fireEvent("success", arguments).fireEvent("sync", arguments).callChain();
            },
            create: REST("POST"),
            read: REST("GET"),
            update: REST("PUT")
        });
        module.exports = Sync;
    },
    "8": function(require, module, exports, global) {
        var Neuro = require("2"), Sync = require("7"), Mixins = require("9");
        var Model = new Class({
            Extends: Neuro.Model,
            Implements: [ Mixins.Sync ],
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
                this.setSync(this.options.request);
                return this;
            },
            _syncSave: function(response, callback) {
                if (response) {
                    this.set(this.parse.apply(this, response));
                }
                this.fireEvent("save", response);
                callback && callback.call(this, response);
                return this;
            },
            save: function(prop, val, callback) {
                var _this = this, isNew = this.isNew(), method = [ "create", "update" ][+isNew], data;
                if (prop) {
                    this.set(prop, val);
                }
                data = this.toJSON();
                this.sync(method, data, function(response) {
                    _this._syncSave.call(_this, response, callback);
                    _this.fireEvent(method, arguments);
                });
                isNew && this.setNew(false);
                return this;
            },
            _syncFetch: function(response, callback, reset) {
                if (response) {
                    reset && (this._data = Object.merge({}, this.options.defaults));
                    this.set(this.parse.apply(this, arguments));
                }
                this.setNew(false);
                this.fireEvent("fetch", response);
                callback && callback.call(this, response);
                return this;
            },
            fetch: function(callback, reset) {
                var _this = this, data = this.toJSON();
                this.sync("read", data, function(response) {
                    _this._syncFetch.call(_this, response, callback, reset);
                    _this.fireEvent("read", arguments);
                });
                return this;
            },
            _syncDestroy: function(response, callback) {
                this.fireEvent("delete", arguments);
                callback && callback.call(this, response);
                return this;
            },
            destroy: function(options, callback) {
                var _this = this;
                this.request.cancel();
                this.sync("delete", options, function(response) {
                    _this._syncDestroy.call(_this, response, callback);
                    _this.fireEvent("delete", arguments);
                });
                this.parent();
                return this;
            }
        });
        module.exports = Model;
    },
    "9": function(require, module, exports, global) {
        var Sync = require("7");
        var SyncSignals = {}, signalSyncPrefix = "signalSync", syncPrefix = "sync:", syncFnc = function(str) {
            str = syncPrefix + str.toLowerCase();
            return function() {
                this.fireEvent(str, arguments);
                return this;
            };
        };
        SyncSignals[signalSyncPrefix] = syncFnc("");
        [ "Request", "Complete", "Success", "Failure", "Error" ].each(function(item) {
            SyncSignals[signalSyncPrefix + item] = syncFnc(item);
        });
        SyncSignals = new Class(SyncSignals);
        var SyncMix = new Class({
            Implements: [ SyncSignals ],
            setSync: function(options) {
                var _this = this, id = 0, incrementId = function() {
                    id++;
                }, getOnceId = function() {
                    return id + 1;
                }, events = {
                    request: function() {
                        incrementId();
                        _this.signalSyncRequest();
                    },
                    complete: function(response) {
                        _this.signalSyncComplete(response);
                    },
                    success: function(response) {
                        _this.signalSyncSuccess(response);
                    },
                    failure: function() {
                        _this.signalSyncFailure();
                    },
                    error: function() {
                        _this.signalSyncError();
                    },
                    sync: function() {
                        _this.signalSync(response);
                        _this.fireEvent("sync:" + getOnceId(), response);
                    }
                }, request = new Sync(Object.merge({}, this.options.request, options || {}));
                this.getOnceId = getOnceId;
                this.request = request.addEvents(events);
                return this;
            },
            sync: function(method, data, callback) {
                var request = this.request;
                if (!request.check.apply(request, arguments)) return this;
                method = request[method] ? method : "read";
                if (callback && Type.isFunction(callback)) {
                    this._addEventOnce(callback);
                }
                request[method](data);
                return this;
            },
            _addEventOnce: function(fnc) {
                var type = "sync", syncId = this.getOnceId(), cancelType = type + ":" + syncId, once, cancel;
                cancel = function() {
                    this.removeEvent(type, once);
                    this.removeEvent(cancelType, cancel);
                };
                once = function() {
                    fnc.apply(this, arguments);
                    cancel.call(this);
                };
                this.addEvent(type, once);
                this.addEvent(cancelType, cancel);
                return this;
            }.protect(),
            parse: function(response, _this) {
                return response;
            },
            cancel: function() {
                this.request.cancel();
                this.fireEvent("sync:" + this.getOnceId());
                return this;
            }
        });
        exports.Sync = SyncMix;
    },
    a: function(require, module, exports, global) {
        var Neuro = require("2"), Sync = require("7"), Mixins = require("9");
        var Collection = new Class({
            Extends: Neuro.Collection,
            Implements: [ Mixins.Sync ],
            options: {
                request: {},
                Model: Neuro.Model
            },
            setup: function(models, options) {
                this.parent(models, options);
                this.setSync();
            },
            _syncFetch: function(response, callback, reset) {
                if (response) {
                    reset && this.empty();
                    this.add(this.parse.apply(this, response));
                }
                this.fireEvent("fetch", response);
                callback && callback.call(this, response);
                return this;
            },
            fetch: function(callback, reset) {
                var _this = this, data = this.toJSON();
                this.sync("read", data, function(response) {
                    _this._syncFetch.call(_this, response, callback, reset);
                    _this.fireEvent("read", arguments);
                });
                return this;
            }
        });
        module.exports = Collection;
    }
});