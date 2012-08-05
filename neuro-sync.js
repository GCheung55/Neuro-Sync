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
        Neuro.Sync = require("d").Sync;
        Neuro.Model = require("e").Model;
        Neuro.Collection = require("g").Collection;
        exports = module.exports = Neuro;
    },
    "1": function(require, module, exports, global) {
        var Neuro = require("2");
        Neuro.Model = require("3").Model;
        Neuro.Collection = require("b").Collection;
        Neuro.View = require("c").View;
        exports = module.exports = Neuro;
    },
    "2": function(require, module, exports, global) {
        var Neuro = {
            version: "0.2.1"
        };
        exports = module.exports = Neuro;
    },
    "3": function(require, module, exports, global) {
        var Model = require("4").Model, Butler = require("a").Butler;
        var curryGetter = function(isPrevious) {
            return function(prop) {
                var accessor = this.getAccessor(prop, isPrevious ? "getPrevious" : "get"), accessorName = this._accessorName;
                if (accessor && accessorName != prop) {
                    return accessor();
                }
                return this.parent(prop);
            }.overloadGetter();
        };
        Model.implement(new Butler);
        exports.Model = new Class({
            Extends: Model,
            setup: function(data, options) {
                this.setupAccessors();
                this.parent(data, options);
                return this;
            },
            __set: function(prop, val) {
                var accessor = this.getAccessor(prop, "set");
                if (accessor && this._accessorName != prop) {
                    return accessor.apply(this, arguments);
                }
                return this.parent(prop, val);
            }.overloadSetter(),
            get: curryGetter(),
            getPrevious: curryGetter(true),
            setAccessor: function(name, val) {
                if (name && val) {
                    if (val.get && !val.getPrevious) {
                        val.getPrevious = val.get;
                    }
                    this.parent(name, val);
                }
                return this;
            }.overloadSetter()
        });
    },
    "4": function(require, module, exports, global) {
        var Is = require("5").Is, Silence = require("6").Silence, Connector = require("7").Connector, signalFactory = require("9");
        var isObject = function(obj) {
            return Type.isObject(obj);
        };
        var cloneVal = function(val) {
            switch (typeOf(val)) {
              case "array":
                val = val.slice();
                break;
              case "object":
                if (!val.$constructor || val.$constructor && !instanceOf(val.$constructor, Class)) {
                    val = Object.clone(val);
                }
                break;
            }
            return val;
        };
        var curryGetter = function(type) {
            var isPrevious = type == "_previousData" || void 0;
            return function(prop) {
                return this._deepGet(this[type], prop, isPrevious);
            }.overloadGetter();
        };
        var curryGetData = function(type) {
            return function() {
                var props = this.keys(), obj = {};
                props.each(function(prop) {
                    obj[prop] = cloneVal(this[type](prop));
                }.bind(this));
                return obj;
            };
        };
        var Signals = new Class(signalFactory([ "change", "destroy", "reset" ], {
            signalChangeProperty: function(prop, newVal, oldVal) {
                !this.isSilent() && this.fireEvent("change:" + prop, [ this, prop, newVal, oldVal ]);
                return this;
            }
        }));
        var Model = new Class({
            Implements: [ Connector, Events, Options, Silence, Signals ],
            primaryKey: undefined,
            _data: {},
            _changed: false,
            _changedProperties: {},
            _previousData: {},
            _setting: 0,
            options: {
                primaryKey: undefined,
                defaults: {}
            },
            initialize: function(data, options) {
                if (instanceOf(data, this.constructor)) {
                    return data;
                }
                this.setOptions(options);
                this.setup(data, options);
            },
            setup: function(data, options) {
                this.primaryKey = this.options.primaryKey;
                this.silence(function() {
                    this.set(this.options.defaults);
                }.bind(this));
                if (data) {
                    this.set(data);
                }
                return this;
            },
            _deepSet: function(object, path, val) {
                path = typeof path == "string" ? path.split(".") : path.slice(0);
                var key = path.pop(), len = path.length, i = 0, current;
                while (len--) {
                    current = path[i++];
                    object = current in object ? object[current] : object[current] = {};
                    if (instanceOf(object, Model)) {
                        path = path.slice(i);
                        path.push(key);
                        object.set(path.join("."), val);
                        return this;
                    }
                }
                if (isObject(object)) {
                    object[key] = val;
                } else {
                    throw new Error("Can not set to this path: " + path);
                }
                return this;
            },
            _deepGet: function(object, path, prev) {
                if (typeof path == "string") {
                    path = path.split(".");
                }
                for (var i = 0, l = path.length; i < l; i++) {
                    if (!object) continue;
                    if (hasOwnProperty.call(object, path[i])) {
                        object = object[path[i]];
                    } else if (instanceOf(object, Model)) {
                        object = object[prev ? "getPrevious" : "get"](path[i]);
                    } else {
                        return object[path[i]];
                    }
                }
                return object;
            },
            __set: function(prop, val) {
                var old = this.get(prop);
                if (!Is.Equal(old, val)) {
                    val = cloneVal(val);
                    this._deepSet(this._data, prop, val);
                    if (Is.Equal(this.get(prop), val)) {
                        this._changed = true;
                        this._deepSet(this._changedProperties, prop, val);
                    }
                }
                return this;
            }.overloadSetter(),
            _set: function(prop, val) {
                this._setting++;
                this.__set(prop, val);
                this._setting--;
                return this;
            },
            set: function(prop, val) {
                var isSetting;
                if (prop) {
                    isSetting = this.isSetting();
                    !isSetting && this._setPrevious(this.getData());
                    prop = instanceOf(prop, Model) ? prop.getData() : prop;
                    this._set(prop, val);
                    if (!isSetting) {
                        if (this._changed) {
                            this._changeProperty(this._changedProperties);
                            this.signalChange();
                            this._resetChanged();
                        }
                    }
                }
                return this;
            },
            isSetting: function() {
                return !!this._setting;
            },
            unset: function(prop) {
                var props = {}, len, i = 0, item;
                prop = Array.from(prop);
                len = prop.length;
                while (len--) {
                    props[prop[i++]] = void 0;
                }
                this.set(props);
                return this;
            },
            reset: function(prop) {
                var props = {}, defaults = this.options.defaults, len, i = 0, item;
                if (prop) {
                    prop = Array.from(prop);
                    len = prop.length;
                    while (len--) {
                        item = prop[i++];
                        props[item] = this._deepGet(defaults, item);
                    }
                } else {
                    props = defaults;
                }
                this.set(props);
                this.signalReset();
                return this;
            },
            get: curryGetter("_data"),
            getData: curryGetData("get"),
            _setPrevious: function(prop, val) {
                this._previousData[prop] = val;
                return this;
            }.overloadSetter(),
            getPrevious: curryGetter("_previousData"),
            getPreviousData: curryGetData("getPrevious"),
            _resetChanged: function() {
                this._changed = false;
                this._changedProperties = {};
                return this;
            },
            _changeProperty: function(object, basePath) {
                basePath = basePath ? basePath + "." : "";
                Object.each(object, function(val, prop) {
                    var path = basePath + prop, newVal = this.get(path), oldVal = this.getPrevious(path), newValIsObject = isObject(newVal), oldValIsObject = isObject(oldVal);
                    this.signalChangeProperty(path, newVal, oldVal);
                    newValIsObject && !instanceOf(object, Class) && this._changeProperty(val, path);
                    oldValIsObject && this._changeProperty(oldVal, path);
                }, this);
                return this;
            },
            destroy: function() {
                this.signalDestroy();
                return this;
            },
            toJSON: function() {
                return this.getData();
            },
            spy: function(prop, callback) {
                if (Type.isString(prop) && prop in this._data && Type.isFunction(callback)) {
                    this.addEvent("change:" + prop, callback);
                }
                return this;
            }.overloadSetter(),
            unspy: function(prop, callback) {
                if (Type.isString(prop) && prop in this._data) {
                    this.removeEvents("change:" + prop, callback);
                }
                return this;
            }.overloadSetter()
        });
        [ "each", "subset", "map", "filter", "every", "some", "keys", "values", "getLength", "keyOf", "contains", "toQueryString" ].each(function(method) {
            Model.implement(method, function() {
                return Object[method].apply(Object, [ this._data ].append(Array.from(arguments)));
            });
        });
        exports.Model = Model;
    },
    "5": function(require, module, exports, global) {
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
    "6": function(require, module, exports, global) {
        var Silence = new Class({
            _silent: 0,
            silence: function(fnc) {
                this._silent++;
                fnc && fnc.call(this);
                this._silent--;
                return this;
            },
            isSilent: function() {
                return !!this._silent;
            }
        });
        exports.Silence = Silence;
    },
    "7": function(require, module, exports, global) {
        require("8");
        var processFn = function(type, evt, fn, obj) {
            if (type == "string") {
                fn = obj && obj[fn] ? obj.bound(fn) : undefined;
            }
            return fn;
        };
        var mapSubEvents = function(obj, baseEvt) {
            var map = {};
            Object.each(obj, function(val, key) {
                key = key == "*" ? baseEvt : baseEvt + ":" + key;
                map[key] = val;
            });
            return map;
        };
        var process = function(methodStr, map, obj) {
            Object.each(map, function(methods, evt) {
                methods = Array.from(methods);
                methods.each(function(method) {
                    var type = typeOf(method);
                    switch (type) {
                      case "object":
                        if (!instanceOf(method, Class)) {
                            process.call(this, methodStr, mapSubEvents(method, evt), obj);
                        }
                        break;
                      case "string":
                      case "function":
                        method = processFn.call(this, type, evt, method, obj);
                        method && this[methodStr](evt, method);
                        break;
                    }
                }, this);
            }, this);
        };
        var curryConnection = function(str) {
            var methodStr = str == "connect" ? "addEvent" : "removeEvent";
            return function(obj, oneWay) {
                var map = this.options.connector;
                process.call(this, methodStr, map, obj);
                !oneWay && obj && obj[str](this, true);
                return this;
            };
        };
        var Connector = new Class({
            Implements: [ Class.Binds ],
            options: {
                connector: {}
            },
            connect: curryConnection("connect"),
            disconnect: curryConnection("disconnect")
        });
        exports.Connector = Connector;
    },
    "8": function(require, module, exports, global) {
        Class.Binds = new Class({
            $bound: {},
            bound: function(name) {
                return this.$bound[name] ? this.$bound[name] : this.$bound[name] = this[name].bind(this);
            }
        });
    },
    "9": function(require, module, exports, global) {
        exports = module.exports = function(names, curryFnc, stack) {
            if (!Type.isFunction(curryFnc)) {
                stack = curryFnc;
                curryFnc = undefined;
            }
            stack = stack || {};
            Array.from(names).each(function(name) {
                stack["signal" + name.capitalize()] = curryFnc ? curryFnc(name) : function() {
                    !this.isSilent() && this.fireEvent(name, this);
                    return this;
                };
            });
            return stack;
        };
    },
    a: function(require, module, exports, global) {
        var modelObj = require("4");
        exports.Butler = new Class({
            _accessorName: undefined,
            options: {
                accessors: {}
            },
            setupAccessors: function() {
                this._accessors = new modelObj.Model;
                this.setAccessor(this.options.accessors);
                return this;
            },
            isAccessing: function() {
                return !!this._accessorName;
            },
            _processAccess: function(name, fnc) {
                var value;
                if (name) {
                    this._accessorName = name;
                    value = fnc();
                    this._accessorName = void 0;
                }
                return value;
            },
            setAccessor: function(name, obj) {
                var accessors = {};
                if (!!name && Type.isObject(obj)) {
                    Object.each(obj, function(fnc, type) {
                        var f;
                        if (fnc && !accessors[type]) {
                            f = accessors[type] = function() {
                                return this._processAccess(name, fnc.pass(arguments, this));
                            }.bind(this);
                            f._orig = fnc;
                        }
                    }, this);
                    this._accessors.set(name, accessors);
                }
                return this;
            }.overloadSetter(),
            getAccessor: function(name, type) {
                var accessors;
                if (name) {
                    name = type ? name + "." + type : name;
                    accessors = this._accessors.get(name);
                }
                return accessors;
            },
            unsetAccessor: function(name, type) {
                if (name) {
                    name = type ? name + "." + type : name;
                    this._accessors.unset(name);
                }
                return this;
            }
        });
    },
    b: function(require, module, exports, global) {
        var Model = require("3").Model, Silence = require("6").Silence, Connector = require("7").Connector, signalFactory = require("9");
        var Signals = new Class(signalFactory([ "empty", "sort" ], signalFactory([ "add", "remove" ], function(name) {
            return function(model) {
                !this.isSilent() && this.fireEvent(name, [ this, model ]);
                return this;
            };
        })));
        var Collection = new Class({
            Implements: [ Connector, Events, Options, Silence, Signals ],
            _models: [],
            _Model: Model,
            length: 0,
            primaryKey: undefined,
            options: {
                primaryKey: undefined,
                Model: undefined,
                modelOptions: undefined
            },
            initialize: function(models, options) {
                this.setOptions(options);
                this.setup(models, options);
            },
            setup: function(models, options) {
                this.primaryKey = this.options.primaryKey;
                if (this.options.Model) {
                    this._Model = this.options.Model;
                }
                if (models) {
                    this.add(models);
                }
                return this;
            },
            hasModel: function(model) {
                var pk = this.primaryKey, has, modelId;
                has = this._models.contains(model);
                if (pk && !has) {
                    modelId = instanceOf(model, Model) ? model.get(pk) : model[pk];
                    has = this.some(function(item) {
                        return modelId === item.get(pk);
                    });
                }
                return !!has;
            },
            _add: function(model, at) {
                model = new this._Model(model, this.options.modelOptions);
                if (!this.hasModel(model)) {
                    model.addEvent("destroy", this.bound("remove"));
                    at = this.length == 0 ? void 0 : at;
                    if (at != void 0) {
                        this._models.splice(at, 0, model);
                    } else {
                        this._models.push(model);
                    }
                    this.length = this._models.length;
                    this.signalAdd(model);
                }
                return this;
            },
            add: function(models, at) {
                models = Array.from(models);
                var len = models.length, i = 0;
                while (len--) {
                    this._add(models[i++], at);
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
                if (this.hasModel(model)) {
                    model.removeEvent("destroy", this.bound("remove"));
                    this._models.erase(model);
                    this.length = this._models.length;
                    this.signalRemove(model);
                }
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
            replace: function(oldModel, newModel) {
                var index;
                if (oldModel && newModel && this.hasModel(oldModel) && !this.hasModel(newModel)) {
                    index = this.indexOf(oldModel);
                    if (index > -1) {
                        this.add(newModel, index);
                        this.remove(oldModel);
                    }
                }
                return this;
            },
            sort: function(fnc) {
                this._models.sort(fnc);
                this.signalSort();
                return this;
            },
            reverse: function() {
                this._models.reverse();
                this.signalSort();
                return this;
            },
            empty: function() {
                this.remove(this._models);
                this.signalEmpty();
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
        exports.Collection = Collection;
    },
    c: function(require, module, exports, global) {
        var Connector = require("7").Connector, Silence = require("6").Silence, signalFactory = require("9");
        var eventHandler = function(handler) {
            return function() {
                var events = this.options.events, element = this.element;
                if (element && events) {
                    Object.each(events, function(val, key) {
                        var methods = Array.from(val), len = methods.length, i = 0, method;
                        while (len--) {
                            method = methods[i++];
                            this.element[handler](key, typeOf(method) == "function" ? method : this.bound(method));
                        }
                    }, this);
                }
                return this;
            };
        };
        var Signals = new Class(signalFactory([ "ready", "render", "dispose", "destroy" ], {
            signalInject: function(reference, where) {
                !this.isSilent() && this.fireEvent("inject", [ this, reference, where ]);
                return this;
            }
        }));
        var View = new Class({
            Implements: [ Connector, Events, Options, Silence, Signals ],
            options: {
                element: undefined,
                events: {}
            },
            initialize: function(options) {
                this.setup(options);
                this.signalReady();
            },
            setup: function(options) {
                this.setOptions(options);
                if (this.options.element) {
                    this.setElement(this.options.element);
                }
                return this;
            },
            toElement: function() {
                return this.element;
            },
            setElement: function(element) {
                if (element) {
                    this.element && this.destroy();
                    element = this.element = document.id(element);
                    if (element) {
                        this.attachEvents();
                    }
                }
                return this;
            },
            attachEvents: eventHandler("addEvent"),
            detachEvents: eventHandler("removeEvent"),
            create: function() {
                return this;
            },
            render: function(data) {
                this.signalRender();
                return this;
            },
            inject: function(reference, where) {
                if (this.element) {
                    reference = document.id(reference);
                    where = where || "bottom";
                    this.element.inject(reference, where);
                    this.signalInject(reference, where);
                }
                return this;
            },
            dispose: function() {
                if (this.element) {
                    this.element.dispose();
                    this.signalDispose();
                }
                return this;
            },
            destroy: function() {
                var element = this.element;
                if (element) {
                    element && (this.detachEvents(), element.destroy(), this.element = undefined);
                    this.signalDestroy();
                }
                return this;
            }
        });
        exports.View = View;
    },
    d: function(require, module, exports, global) {
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
        exports.Sync = Sync;
    },
    e: function(require, module, exports, global) {
        var modelObj = require("3"), Sync = require("d").Sync, Mixins = require("f");
        var Model = new Class({
            Extends: modelObj.Model,
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
                response = this.process(response);
                if (response) {
                    this.set(response);
                }
                this.fireEvent("save", response);
                callback && callback.call(this, response);
                return this;
            },
            save: function(callback) {
                var isNew = this.isNew(), method = [ "create", "update" ][+isNew], data = this.toJSON();
                this.sync(method, data, function(response) {
                    this._syncSave(response, callback);
                });
                isNew && this.setNew(false);
                return this;
            },
            _syncFetch: function(response, callback) {
                response = this.process(response);
                if (response) {
                    this.set(response);
                }
                this.setNew(false);
                this.fireEvent("fetch", response);
                callback && callback.call(this, response);
                return this;
            },
            fetch: function(callback) {
                var data = this.toJSON();
                this.sync("read", data, function(response) {
                    this._syncFetch(response, callback);
                });
                return this;
            },
            _syncDestroy: function(response, callback) {
                callback && callback.call(this, response);
                return this;
            },
            destroy: function(callback) {
                this.request.cancel();
                this.sync("delete", {}, function(response) {
                    this._syncDestroy(response, callback);
                });
                this.parent();
                return this;
            }
        });
        modelObj.Model = exports.Model = Model;
    },
    f: function(require, module, exports, global) {
        var Sync = require("d").Sync, Is = require("5").Is;
        var SyncSignals = {}, signalSyncPrefix = "signalSync", syncPrefix = "sync:", syncFnc = function(str) {
            return function() {
                this.fireEvent(str, arguments);
                return this;
            };
        };
        SyncSignals[signalSyncPrefix] = syncFnc("sync");
        [ "Request", "Complete", "Success", "Failure", "Error" ].each(function(item) {
            SyncSignals[signalSyncPrefix + item] = syncFnc(syncPrefix + item.toLowerCase());
        });
        SyncSignals = new Class(SyncSignals);
        var SyncMix = new Class({
            Implements: [ SyncSignals ],
            _syncId: 0,
            _incrementSyncId: function() {
                this._syncId++;
                return this;
            }.protect(),
            _getSyncId: function() {
                return this._syncId;
            },
            setSync: function(options) {
                var _this = this, getSyncId = this._getSyncId.bind(this), events = {
                    request: function() {
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
                        _this.fireEvent("sync:" + getSyncId());
                    },
                    error: function() {
                        _this.signalSyncError();
                        _this.fireEvent("sync:" + getSyncId());
                    },
                    sync: function(response) {
                        _this.signalSync(response);
                        _this.fireEvent("sync:" + getSyncId());
                    }
                }, request = new Sync(Object.merge({}, this.options.request, options || {}));
                this.request = request.addEvents(events);
                return this;
            },
            syncCheck: function() {
                var request = this.request;
                if (!request.running) return true;
                switch (request.options.link) {
                  case "cancel":
                    this.cancel();
                    return true;
                  case "chain":
                    request.chain(this.caller.pass(arguments, this));
                    return false;
                }
                return false;
            },
            sync: function(method, data, callback) {
                var request = this.request;
                if (!this.syncCheck(method, data, callback)) return this;
                this._incrementSyncId();
                method = request[method] ? method : "read";
                if (callback && Is.Function(callback)) {
                    this._addEventOnce(function() {
                        callback.apply(this, arguments);
                        this.fireEvent(method, arguments);
                    });
                }
                request[method](data);
                return this;
            },
            _addEventOnce: function(fnc) {
                var type = "sync", syncId = this._getSyncId(), cancelType = type + ":" + syncId, once, cancel;
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
            process: function(response) {
                return response;
            },
            cancel: function() {
                this.request.cancel();
                this.fireEvent("sync:" + this._getSyncId());
                return this;
            }
        });
        exports.Sync = SyncMix;
    },
    g: function(require, module, exports, global) {
        var collectionObj = require("b"), Model = require("e").Model, Sync = require("d").Sync, Mixins = require("f");
        var Collection = new Class({
            Extends: collectionObj.Collection,
            Implements: [ Mixins.Sync ],
            options: {
                request: {},
                Model: Model
            },
            setup: function(models, options) {
                this.parent(models, options);
                this.setSync();
            },
            _syncFetch: function(response, empty, callback) {
                response = this.process(response);
                if (response) {
                    empty && this.empty();
                    this.add(response);
                }
                this.fireEvent("fetch", response);
                callback && callback.call(this, response);
                return this;
            },
            fetch: function(empty, callback) {
                var data = this.toJSON();
                this.sync("read", data, function(response) {
                    this._syncFetch(response, empty, callback);
                });
                return this;
            }
        });
        collectionObj.Collection = exports.Collection = Collection;
    }
});