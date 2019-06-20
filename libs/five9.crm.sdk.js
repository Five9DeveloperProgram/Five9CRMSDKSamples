/*!
 * Five9 CRM SDK Javascript library
 * version: 0.12.0
 * build-version: 11.0.0
 *
 * Copyright (c)2019 Five9, Inc.
 */

(function (root, factory) {
  if (typeof define === 'function') {
    define(factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.Five9 = root.Five9 || {};
    root.Five9.CrmSdk = factory();
  }
}(this, function () {

// We use RequireJS modules inside.
// Since this library can be included into projects with JS/node modules support
// we need to prevent using outer exports definition.
if (typeof(exports) !== 'undefined'){
  exports = undefined;
}

/**
 * almond 0.1.1 Copyright (c) 2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var defined = {},
        waiting = {},
        config = {},
        defining = {},
        aps = [].slice,
        main, req;

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {},
            nameParts, nameSegment, mapValue, foundMap, i, j, part;

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);

                name = baseParts.concat(name.split("/"));

                //start trimDots
                for (i = 0; (part = name[i]); i++) {
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            return true;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                break;
                            }
                        }
                    }
                }

                foundMap = foundMap || starMap[nameSegment];

                if (foundMap) {
                    nameParts.splice(0, i, foundMap);
                    name = nameParts.join('/');
                    break;
                }
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (waiting.hasOwnProperty(name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!defined.hasOwnProperty(name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    function makeMap(name, relName) {
        var prefix, plugin,
            index = name.indexOf('!');

        if (index !== -1) {
            prefix = normalize(name.slice(0, index), relName);
            name = name.slice(index + 1);
            plugin = callDep(prefix);

            //Normalize according
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            p: plugin
        };
    }

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    main = function (name, deps, callback, relName) {
        var args = [],
            usingExports,
            cjsModule, depName, ret, map, i;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (typeof callback === 'function') {

            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i++) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = makeRequire(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = defined[name] = {};
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = {
                        id: name,
                        uri: '',
                        exports: defined[name],
                        config: makeConfig(name)
                    };
                } else if (defined.hasOwnProperty(depName) || waiting.hasOwnProperty(depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else if (!defining[depName]) {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback.apply(defined[name], args);

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                    cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync) {
        if (typeof deps === "string") {
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 15);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        config = cfg;
        return req;
    };

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        waiting[name] = [name, deps, callback];
    };

    define.amd = {
        jQuery: true
    };
}());

define("almondlib", function(){});

//     Underscore.js 1.9.1
//     http://underscorejs.org
//     (c) 2009-2018 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` (`self`) in the browser, `global`
  // on the server, or `this` in some virtual machines. We use `self`
  // instead of `window` for `WebWorker` support.
  var root = typeof self == 'object' && self.self === self && self ||
            typeof global == 'object' && global.global === global && global ||
            this ||
            {};

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype;
  var SymbolProto = typeof Symbol !== 'undefined' ? Symbol.prototype : null;

  // Create quick reference variables for speed access to core prototypes.
  var push = ArrayProto.push,
      slice = ArrayProto.slice,
      toString = ObjProto.toString,
      hasOwnProperty = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var nativeIsArray = Array.isArray,
      nativeKeys = Object.keys,
      nativeCreate = Object.create;

  // Naked function reference for surrogate-prototype-swapping.
  var Ctor = function(){};

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for their old module API. If we're in
  // the browser, add `_` as a global object.
  // (`nodeType` is checked to ensure that `module`
  // and `exports` are not HTML elements.)
  if (typeof exports != 'undefined' && !exports.nodeType) {
    if (typeof module != 'undefined' && !module.nodeType && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.9.1';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var optimizeCb = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      // The 2-argument case is omitted because we’re not using it.
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };

  var builtinIteratee;

  // An internal function to generate callbacks that can be applied to each
  // element in a collection, returning the desired result — either `identity`,
  // an arbitrary callback, a property matcher, or a property accessor.
  var cb = function(value, context, argCount) {
    if (_.iteratee !== builtinIteratee) return _.iteratee(value, context);
    if (value == null) return _.identity;
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
    if (_.isObject(value) && !_.isArray(value)) return _.matcher(value);
    return _.property(value);
  };

  // External wrapper for our callback generator. Users may customize
  // `_.iteratee` if they want additional predicate/iteratee shorthand styles.
  // This abstraction hides the internal-only argCount argument.
  _.iteratee = builtinIteratee = function(value, context) {
    return cb(value, context, Infinity);
  };

  // Some functions take a variable number of arguments, or a few expected
  // arguments at the beginning and then a variable number of values to operate
  // on. This helper accumulates all remaining arguments past the function’s
  // argument length (or an explicit `startIndex`), into an array that becomes
  // the last argument. Similar to ES6’s "rest parameter".
  var restArguments = function(func, startIndex) {
    startIndex = startIndex == null ? func.length - 1 : +startIndex;
    return function() {
      var length = Math.max(arguments.length - startIndex, 0),
          rest = Array(length),
          index = 0;
      for (; index < length; index++) {
        rest[index] = arguments[index + startIndex];
      }
      switch (startIndex) {
        case 0: return func.call(this, rest);
        case 1: return func.call(this, arguments[0], rest);
        case 2: return func.call(this, arguments[0], arguments[1], rest);
      }
      var args = Array(startIndex + 1);
      for (index = 0; index < startIndex; index++) {
        args[index] = arguments[index];
      }
      args[startIndex] = rest;
      return func.apply(this, args);
    };
  };

  // An internal function for creating a new object that inherits from another.
  var baseCreate = function(prototype) {
    if (!_.isObject(prototype)) return {};
    if (nativeCreate) return nativeCreate(prototype);
    Ctor.prototype = prototype;
    var result = new Ctor;
    Ctor.prototype = null;
    return result;
  };

  var shallowProperty = function(key) {
    return function(obj) {
      return obj == null ? void 0 : obj[key];
    };
  };

  var has = function(obj, path) {
    return obj != null && hasOwnProperty.call(obj, path);
  }

  var deepGet = function(obj, path) {
    var length = path.length;
    for (var i = 0; i < length; i++) {
      if (obj == null) return void 0;
      obj = obj[path[i]];
    }
    return length ? obj : void 0;
  };

  // Helper for collection methods to determine whether a collection
  // should be iterated as an array or as an object.
  // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
  // Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094
  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
  var getLength = shallowProperty('length');
  var isArrayLike = function(collection) {
    var length = getLength(collection);
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    iteratee = optimizeCb(iteratee, context);
    var i, length;
    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  _.map = _.collect = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length);
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  // Create a reducing function iterating left or right.
  var createReduce = function(dir) {
    // Wrap code that reassigns argument variables in a separate function than
    // the one that accesses `arguments.length` to avoid a perf hit. (#1991)
    var reducer = function(obj, iteratee, memo, initial) {
      var keys = !isArrayLike(obj) && _.keys(obj),
          length = (keys || obj).length,
          index = dir > 0 ? 0 : length - 1;
      if (!initial) {
        memo = obj[keys ? keys[index] : index];
        index += dir;
      }
      for (; index >= 0 && index < length; index += dir) {
        var currentKey = keys ? keys[index] : index;
        memo = iteratee(memo, obj[currentKey], currentKey, obj);
      }
      return memo;
    };

    return function(obj, iteratee, memo, context) {
      var initial = arguments.length >= 3;
      return reducer(obj, optimizeCb(iteratee, context, 4), memo, initial);
    };
  };

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = createReduce(1);

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = createReduce(-1);

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var keyFinder = isArrayLike(obj) ? _.findIndex : _.findKey;
    var key = keyFinder(obj, predicate, context);
    if (key !== void 0 && key !== -1) return obj[key];
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    predicate = cb(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(cb(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given item (using `===`).
  // Aliased as `includes` and `include`.
  _.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {
    if (!isArrayLike(obj)) obj = _.values(obj);
    if (typeof fromIndex != 'number' || guard) fromIndex = 0;
    return _.indexOf(obj, item, fromIndex) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = restArguments(function(obj, path, args) {
    var contextPath, func;
    if (_.isFunction(path)) {
      func = path;
    } else if (_.isArray(path)) {
      contextPath = path.slice(0, -1);
      path = path[path.length - 1];
    }
    return _.map(obj, function(context) {
      var method = func;
      if (!method) {
        if (contextPath && contextPath.length) {
          context = deepGet(context, contextPath);
        }
        if (context == null) return void 0;
        method = context[path];
      }
      return method == null ? method : method.apply(context, args);
    });
  });

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matcher(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matcher(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null || typeof iteratee == 'number' && typeof obj[0] != 'object' && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value != null && value > result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(v, index, list) {
        computed = iteratee(v, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = v;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null || typeof iteratee == 'number' && typeof obj[0] != 'object' && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value != null && value < result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(v, index, list) {
        computed = iteratee(v, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = v;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection.
  _.shuffle = function(obj) {
    return _.sample(obj, Infinity);
  };

  // Sample **n** random values from a collection using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (!isArrayLike(obj)) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    var sample = isArrayLike(obj) ? _.clone(obj) : _.values(obj);
    var length = getLength(sample);
    n = Math.max(Math.min(n, length), 0);
    var last = length - 1;
    for (var index = 0; index < n; index++) {
      var rand = _.random(index, last);
      var temp = sample[index];
      sample[index] = sample[rand];
      sample[rand] = temp;
    }
    return sample.slice(0, n);
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    var index = 0;
    iteratee = cb(iteratee, context);
    return _.pluck(_.map(obj, function(value, key, list) {
      return {
        value: value,
        index: index++,
        criteria: iteratee(value, key, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior, partition) {
    return function(obj, iteratee, context) {
      var result = partition ? [[], []] : {};
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, value, key) {
    if (has(result, key)) result[key].push(value); else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, value, key) {
    if (has(result, key)) result[key]++; else result[key] = 1;
  });

  var reStrSymbol = /[^\ud800-\udfff]|[\ud800-\udbff][\udc00-\udfff]|[\ud800-\udfff]/g;
  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (_.isString(obj)) {
      // Keep surrogate pair characters together
      return obj.match(reStrSymbol);
    }
    if (isArrayLike(obj)) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return isArrayLike(obj) ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = group(function(result, value, pass) {
    result[pass ? 0 : 1].push(value);
  }, true);

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null || array.length < 1) return n == null ? void 0 : [];
    if (n == null || guard) return array[0];
    return _.initial(array, array.length - n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array.
  _.last = function(array, n, guard) {
    if (array == null || array.length < 1) return n == null ? void 0 : [];
    if (n == null || guard) return array[array.length - 1];
    return _.rest(array, Math.max(0, array.length - n));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, Boolean);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, output) {
    output = output || [];
    var idx = output.length;
    for (var i = 0, length = getLength(input); i < length; i++) {
      var value = input[i];
      if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
        // Flatten current level of array or arguments object.
        if (shallow) {
          var j = 0, len = value.length;
          while (j < len) output[idx++] = value[j++];
        } else {
          flatten(value, shallow, strict, output);
          idx = output.length;
        }
      } else if (!strict) {
        output[idx++] = value;
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = restArguments(function(array, otherArrays) {
    return _.difference(array, otherArrays);
  });

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // The faster algorithm will not work with an iteratee if the iteratee
  // is not a one-to-one function, so providing an iteratee will disable
  // the faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = cb(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = getLength(array); i < length; i++) {
      var value = array[i],
          computed = iteratee ? iteratee(value, i, array) : value;
      if (isSorted && !iteratee) {
        if (!i || seen !== computed) result.push(value);
        seen = computed;
      } else if (iteratee) {
        if (!_.contains(seen, computed)) {
          seen.push(computed);
          result.push(value);
        }
      } else if (!_.contains(result, value)) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = restArguments(function(arrays) {
    return _.uniq(flatten(arrays, true, true));
  });

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = getLength(array); i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) continue;
      var j;
      for (j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      if (j === argsLength) result.push(item);
    }
    return result;
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = restArguments(function(array, rest) {
    rest = flatten(rest, true, true);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  });

  // Complement of _.zip. Unzip accepts an array of arrays and groups
  // each array's elements on shared indices.
  _.unzip = function(array) {
    var length = array && _.max(array, getLength).length || 0;
    var result = Array(length);

    for (var index = 0; index < length; index++) {
      result[index] = _.pluck(array, index);
    }
    return result;
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = restArguments(_.unzip);

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values. Passing by pairs is the reverse of _.pairs.
  _.object = function(list, values) {
    var result = {};
    for (var i = 0, length = getLength(list); i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Generator function to create the findIndex and findLastIndex functions.
  var createPredicateIndexFinder = function(dir) {
    return function(array, predicate, context) {
      predicate = cb(predicate, context);
      var length = getLength(array);
      var index = dir > 0 ? 0 : length - 1;
      for (; index >= 0 && index < length; index += dir) {
        if (predicate(array[index], index, array)) return index;
      }
      return -1;
    };
  };

  // Returns the first index on an array-like that passes a predicate test.
  _.findIndex = createPredicateIndexFinder(1);
  _.findLastIndex = createPredicateIndexFinder(-1);

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = cb(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = getLength(array);
    while (low < high) {
      var mid = Math.floor((low + high) / 2);
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Generator function to create the indexOf and lastIndexOf functions.
  var createIndexFinder = function(dir, predicateFind, sortedIndex) {
    return function(array, item, idx) {
      var i = 0, length = getLength(array);
      if (typeof idx == 'number') {
        if (dir > 0) {
          i = idx >= 0 ? idx : Math.max(idx + length, i);
        } else {
          length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
        }
      } else if (sortedIndex && idx && length) {
        idx = sortedIndex(array, item);
        return array[idx] === item ? idx : -1;
      }
      if (item !== item) {
        idx = predicateFind(slice.call(array, i, length), _.isNaN);
        return idx >= 0 ? idx + i : -1;
      }
      for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
        if (array[idx] === item) return idx;
      }
      return -1;
    };
  };

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
  _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (stop == null) {
      stop = start || 0;
      start = 0;
    }
    if (!step) {
      step = stop < start ? -1 : 1;
    }

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // Chunk a single array into multiple arrays, each containing `count` or fewer
  // items.
  _.chunk = function(array, count) {
    if (count == null || count < 1) return [];
    var result = [];
    var i = 0, length = array.length;
    while (i < length) {
      result.push(slice.call(array, i, i += count));
    }
    return result;
  };

  // Function (ahem) Functions
  // ------------------

  // Determines whether to execute a function as a constructor
  // or a normal function with the provided arguments.
  var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
    var self = baseCreate(sourceFunc.prototype);
    var result = sourceFunc.apply(self, args);
    if (_.isObject(result)) return result;
    return self;
  };

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = restArguments(function(func, context, args) {
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    var bound = restArguments(function(callArgs) {
      return executeBound(func, bound, context, this, args.concat(callArgs));
    });
    return bound;
  });

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder by default, allowing any combination of arguments to be
  // pre-filled. Set `_.partial.placeholder` for a custom placeholder argument.
  _.partial = restArguments(function(func, boundArgs) {
    var placeholder = _.partial.placeholder;
    var bound = function() {
      var position = 0, length = boundArgs.length;
      var args = Array(length);
      for (var i = 0; i < length; i++) {
        args[i] = boundArgs[i] === placeholder ? arguments[position++] : boundArgs[i];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return executeBound(func, bound, this, this, args);
    };
    return bound;
  });

  _.partial.placeholder = _;

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = restArguments(function(obj, keys) {
    keys = flatten(keys, false, false);
    var index = keys.length;
    if (index < 1) throw new Error('bindAll must be passed function names');
    while (index--) {
      var key = keys[index];
      obj[key] = _.bind(obj[key], obj);
    }
  });

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = '' + (hasher ? hasher.apply(this, arguments) : key);
      if (!has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = restArguments(function(func, wait, args) {
    return setTimeout(function() {
      return func.apply(null, args);
    }, wait);
  });

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = _.partial(_.delay, _, 1);

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var timeout, context, args, result;
    var previous = 0;
    if (!options) options = {};

    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };

    var throttled = function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };

    throttled.cancel = function() {
      clearTimeout(timeout);
      previous = 0;
      timeout = context = args = null;
    };

    return throttled;
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, result;

    var later = function(context, args) {
      timeout = null;
      if (args) result = func.apply(context, args);
    };

    var debounced = restArguments(function(args) {
      if (timeout) clearTimeout(timeout);
      if (immediate) {
        var callNow = !timeout;
        timeout = setTimeout(later, wait);
        if (callNow) result = func.apply(this, args);
      } else {
        timeout = _.delay(later, wait, this, args);
      }

      return result;
    });

    debounced.cancel = function() {
      clearTimeout(timeout);
      timeout = null;
    };

    return debounced;
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a negated version of the passed-in predicate.
  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // Returns a function that will only be executed on and after the Nth call.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed up to (but not including) the Nth call.
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      }
      if (times <= 1) func = null;
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  _.restArguments = restArguments;

  // Object Functions
  // ----------------

  // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
  var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
  var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
    'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

  var collectNonEnumProps = function(obj, keys) {
    var nonEnumIdx = nonEnumerableProps.length;
    var constructor = obj.constructor;
    var proto = _.isFunction(constructor) && constructor.prototype || ObjProto;

    // Constructor is a special case.
    var prop = 'constructor';
    if (has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

    while (nonEnumIdx--) {
      prop = nonEnumerableProps[nonEnumIdx];
      if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
        keys.push(prop);
      }
    }
  };

  // Retrieve the names of an object's own properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`.
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (has(obj, key)) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve all the property names of an object.
  _.allKeys = function(obj) {
    if (!_.isObject(obj)) return [];
    var keys = [];
    for (var key in obj) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Returns the results of applying the iteratee to each element of the object.
  // In contrast to _.map it returns an object.
  _.mapObject = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys = _.keys(obj),
        length = keys.length,
        results = {};
    for (var index = 0; index < length; index++) {
      var currentKey = keys[index];
      results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  // Convert an object into a list of `[key, value]` pairs.
  // The opposite of _.object.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`.
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // An internal function for creating assigner functions.
  var createAssigner = function(keysFunc, defaults) {
    return function(obj) {
      var length = arguments.length;
      if (defaults) obj = Object(obj);
      if (length < 2 || obj == null) return obj;
      for (var index = 1; index < length; index++) {
        var source = arguments[index],
            keys = keysFunc(source),
            l = keys.length;
        for (var i = 0; i < l; i++) {
          var key = keys[i];
          if (!defaults || obj[key] === void 0) obj[key] = source[key];
        }
      }
      return obj;
    };
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = createAssigner(_.allKeys);

  // Assigns a given object with all the own properties in the passed-in object(s).
  // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
  _.extendOwn = _.assign = createAssigner(_.keys);

  // Returns the first key on an object that passes a predicate test.
  _.findKey = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = _.keys(obj), key;
    for (var i = 0, length = keys.length; i < length; i++) {
      key = keys[i];
      if (predicate(obj[key], key, obj)) return key;
    }
  };

  // Internal pick helper function to determine if `obj` has key `key`.
  var keyInObj = function(value, key, obj) {
    return key in obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = restArguments(function(obj, keys) {
    var result = {}, iteratee = keys[0];
    if (obj == null) return result;
    if (_.isFunction(iteratee)) {
      if (keys.length > 1) iteratee = optimizeCb(iteratee, keys[1]);
      keys = _.allKeys(obj);
    } else {
      iteratee = keyInObj;
      keys = flatten(keys, false, false);
      obj = Object(obj);
    }
    for (var i = 0, length = keys.length; i < length; i++) {
      var key = keys[i];
      var value = obj[key];
      if (iteratee(value, key, obj)) result[key] = value;
    }
    return result;
  });

  // Return a copy of the object without the blacklisted properties.
  _.omit = restArguments(function(obj, keys) {
    var iteratee = keys[0], context;
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
      if (keys.length > 1) context = keys[1];
    } else {
      keys = _.map(flatten(keys, false, false), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  });

  // Fill in a given object with default properties.
  _.defaults = createAssigner(_.allKeys, true);

  // Creates an object that inherits from the given prototype object.
  // If additional properties are provided then they will be added to the
  // created object.
  _.create = function(prototype, props) {
    var result = baseCreate(prototype);
    if (props) _.extendOwn(result, props);
    return result;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Returns whether an object has a given set of `key:value` pairs.
  _.isMatch = function(object, attrs) {
    var keys = _.keys(attrs), length = keys.length;
    if (object == null) return !length;
    var obj = Object(object);
    for (var i = 0; i < length; i++) {
      var key = keys[i];
      if (attrs[key] !== obj[key] || !(key in obj)) return false;
    }
    return true;
  };


  // Internal recursive comparison function for `isEqual`.
  var eq, deepEq;
  eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // `null` or `undefined` only equal to itself (strict comparison).
    if (a == null || b == null) return false;
    // `NaN`s are equivalent, but non-reflexive.
    if (a !== a) return b !== b;
    // Exhaust primitive checks
    var type = typeof a;
    if (type !== 'function' && type !== 'object' && typeof b != 'object') return false;
    return deepEq(a, b, aStack, bStack);
  };

  // Internal recursive comparison function for `isEqual`.
  deepEq = function(a, b, aStack, bStack) {
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN.
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
      case '[object Symbol]':
        return SymbolProto.valueOf.call(a) === SymbolProto.valueOf.call(b);
    }

    var areArrays = className === '[object Array]';
    if (!areArrays) {
      if (typeof a != 'object' || typeof b != 'object') return false;

      // Objects with different constructors are not equivalent, but `Object`s or `Array`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                               _.isFunction(bCtor) && bCtor instanceof bCtor)
                          && ('constructor' in a && 'constructor' in b)) {
        return false;
      }
    }
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

    // Initializing stack of traversed objects.
    // It's done here since we only need them for objects and arrays comparison.
    aStack = aStack || [];
    bStack = bStack || [];
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }

    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);

    // Recursively compare objects and arrays.
    if (areArrays) {
      // Compare array lengths to determine if a deep comparison is necessary.
      length = a.length;
      if (length !== b.length) return false;
      // Deep compare the contents, ignoring non-numeric properties.
      while (length--) {
        if (!eq(a[length], b[length], aStack, bStack)) return false;
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      length = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      if (_.keys(b).length !== length) return false;
      while (length--) {
        // Deep compare each member
        key = keys[length];
        if (!(has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return true;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
    return _.keys(obj).length === 0;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError, isMap, isWeakMap, isSet, isWeakSet.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error', 'Symbol', 'Map', 'WeakMap', 'Set', 'WeakSet'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE < 9), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
  // IE 11 (#1621), Safari 8 (#1929), and PhantomJS (#2236).
  var nodelist = root.document && root.document.childNodes;
  if (typeof /./ != 'function' && typeof Int8Array != 'object' && typeof nodelist != 'function') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return !_.isSymbol(obj) && isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`?
  _.isNaN = function(obj) {
    return _.isNumber(obj) && isNaN(obj);
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, path) {
    if (!_.isArray(path)) {
      return has(obj, path);
    }
    var length = path.length;
    for (var i = 0; i < length; i++) {
      var key = path[i];
      if (obj == null || !hasOwnProperty.call(obj, key)) {
        return false;
      }
      obj = obj[key];
    }
    return !!length;
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value;
  };

  // Predicate-generating functions. Often useful outside of Underscore.
  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  // Creates a function that, when passed an object, will traverse that object’s
  // properties down the given `path`, specified as an array of keys or indexes.
  _.property = function(path) {
    if (!_.isArray(path)) {
      return shallowProperty(path);
    }
    return function(obj) {
      return deepGet(obj, path);
    };
  };

  // Generates a function for a given object that returns a given property.
  _.propertyOf = function(obj) {
    if (obj == null) {
      return function(){};
    }
    return function(path) {
      return !_.isArray(path) ? obj[path] : deepGet(obj, path);
    };
  };

  // Returns a predicate for checking whether an object has a given set of
  // `key:value` pairs.
  _.matcher = _.matches = function(attrs) {
    attrs = _.extendOwn({}, attrs);
    return function(obj) {
      return _.isMatch(obj, attrs);
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = optimizeCb(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() {
    return new Date().getTime();
  };

  // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped.
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // Traverses the children of `obj` along `path`. If a child is a function, it
  // is invoked with its parent as context. Returns the value of the final
  // child, or `fallback` if any child is undefined.
  _.result = function(obj, path, fallback) {
    if (!_.isArray(path)) path = [path];
    var length = path.length;
    if (!length) {
      return _.isFunction(fallback) ? fallback.call(obj) : fallback;
    }
    for (var i = 0; i < length; i++) {
      var prop = obj == null ? void 0 : obj[path[i]];
      if (prop === void 0) {
        prop = fallback;
        i = length; // Ensure we don't continue iterating.
      }
      obj = _.isFunction(prop) ? prop.call(obj) : prop;
    }
    return obj;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate: /<%([\s\S]+?)%>/g,
    interpolate: /<%=([\s\S]+?)%>/g,
    escape: /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'": "'",
    '\\': '\\',
    '\r': 'r',
    '\n': 'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escapeRegExp = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escapeRegExp, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offset.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    var render;
    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var chainResult = function(instance, obj) {
    return instance._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return chainResult(this, func.apply(_, args));
      };
    });
    return _;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return chainResult(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return chainResult(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // Provide unwrapping proxy for some methods used in engine operations
  // such as arithmetic and JSON stringification.
  _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

  _.prototype.toString = function() {
    return String(this._wrapped);
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define == 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}());

/// @copyright Five9, Inc. The content presented herein may not, under
/// any circumstances, be reproduced in whole or in any part or form without
/// written permission from Five9, Inc.

define('msgbus/object',['underscore'], function (_) {
  var Object = function Object() {
    this._destructors = [];

    if (_(this._init).isFunction()) {
      this._init.apply(this, arguments);
    }
  };

  Object.extend = function (protoProps, staticProps) {
    var Super = this;
    var Sub = function Sub() {
      Super.apply(this, arguments);
    };

    _(Sub).extend(Super, staticProps);

    var SuperClone = function SuperClone() {};
    SuperClone.prototype = Super.prototype;
    Sub.prototype = new SuperClone();

    _(Sub.prototype).extend(protoProps);
    Sub.prototype._super = Super.prototype;

    return Sub;
  };

  Object.mixin = function (protoProps, staticProps) {
    _(this.prototype).extend(protoProps);
    _(this).extend(staticProps || {});
  };

  Object.mixin({
    bind: function bind(f) {
      return _.bind(f, this);
    },

    destroy: function destroy() {
      _.each(this._destructors, function (destructor) {
        destructor();
      });
    }
  });

  return Object;
});
//# sourceMappingURL=object.js.map
;
/// @copyright Five9, Inc. The content presented herein may not, under
/// any circumstances, be reproduced in whole or in any part or form without
/// written permission from Five9, Inc.

define('msgbus/message',['msgbus/object', 'underscore'], function (Object, _) {
  var MessageType = {
    isResponse: function isResponse(raw) {
      return !_(raw.response).isUndefined();
    },

    isEvent: function isEvent(raw) {
      return !_(raw.event).isUndefined();
    },

    isError: function isError(raw) {
      return !_(raw.error).isUndefined();
    },

    isCommunicatonError: function isCommunicatonError(raw) {
      return !_(raw.communicationError).isUndefined();
    },

    isConnect: function isConnect(raw) {
      return _.isString(raw) && raw.indexOf('connect') === 0;
    },

    isConnected: function isConnected(raw) {
      return _.isString(raw) && raw.indexOf('connected:') === 0;
    },

    isRequest: function isRequest(raw) {
      return !_(raw.request).isUndefined();
    },

    isDisconnect: function isDisconnect(raw) {
      return _.isString(raw) && raw.indexOf('disconnect') === 0;
    }
  };

  var Message = Object.extend({
    _init: function _init(raw) {
      this._type = 'unknown';

      if (MessageType.isResponse(raw)) {
        this._type = 'response';
        this._id = raw.id;
        this._data = raw.response;
      } else if (MessageType.isEvent(raw)) {
        this._type = 'event';
        this._data = raw.event;
      } else if (MessageType.isError(raw)) {
        this._type = 'error';
        this._id = raw.id;
        this._data = raw.error;
      } else if (MessageType.isCommunicatonError(raw)) {
        this._type = 'communication:error';
        this._data = raw.communicationError;
      } else if (MessageType.isConnected(raw)) {
        this._type = 'connected';
        this._data = raw.slice('connected:'.length);
        if (_.isEmpty(this._data)) {
          delete this._data;
        }
      } else if (MessageType.isConnect(raw)) {
        this._type = 'connect';
        this._data = '';
      } else if (MessageType.isRequest(raw)) {
        this._type = 'request';
        this._id = raw.id;
        this._data = raw.request;
      } else if (MessageType.isDisconnect(raw)) {
        this._type = 'disconnect';
        this._data = '';
      }
    },

    data: function data() {
      return this._data;
    },

    id: function id() {
      return this._id;
    },

    type: function type() {
      return this._type;
    }
  });

  return Message;
});
//# sourceMappingURL=message.js.map
;
!function(){var n,e,r,t,u,o,i,l,s,a,c,f,p,h,y=[].slice;u="3.0.0",e="pending",t="resolved",r="rejected",s=function(n,e){return null!=n?n.hasOwnProperty(e):void 0},c=function(n){return s(n,"length")&&s(n,"callee")},f=function(n){return s(n,"promise")&&"function"==typeof(null!=n?n.promise:void 0)},l=function(n){return c(n)?l(Array.prototype.slice.call(n)):Array.isArray(n)?n.reduce(function(n,e){return Array.isArray(e)?n.concat(l(e)):(n.push(e),n)},[]):[n]},o=function(n,e){return 0>=n?e():function(){return--n<1?e.apply(this,arguments):void 0}},p=function(n,e){return function(){var r;return r=[n].concat(Array.prototype.slice.call(arguments,0)),e.apply(this,r)}},i=function(n,e,r){var t,u,o,i,s;for(i=l(n),s=[],u=0,o=i.length;o>u;u++)t=i[u],s.push(t.call.apply(t,[r].concat(y.call(e))));return s},n=function(){var u,o,s,a,c,p,h;return h=e,a=[],c=[],p=[],s={resolved:{},rejected:{},pending:{}},this.promise=function(u){var o,d;return u=u||{},u.state=function(){return h},d=function(n,r,t){return function(){return h===e&&r.push.apply(r,l(arguments)),n()&&i(arguments,s[t]),u}},u.done=d(function(){return h===t},a,t),u.fail=d(function(){return h===r},c,r),u.progress=d(function(){return h!==e},p,e),u.always=function(){var n;return(n=u.done.apply(u,arguments)).fail.apply(n,arguments)},o=function(e,r,t){var o,i;return i=new n,o=function(n,e,r){return r?u[n](function(){var n,t;return n=1<=arguments.length?y.call(arguments,0):[],t=r.apply(null,n),f(t)?t.done(i.resolve).fail(i.reject).progress(i.notify):i[e](t)}):u[n](i[e])},o("done","resolve",e),o("fail","reject",r),o("progress","notify",t),i},u.pipe=o,u.then=o,null==u.promise&&(u.promise=function(){return u}),u},this.promise(this),u=this,o=function(n,r,t){return function(){return h===e?(h=n,s[n]=arguments,i(r,s[n],t),u):this}},this.resolve=o(t,a),this.reject=o(r,c),this.notify=o(e,p),this.resolveWith=function(n,e){return o(t,a,n).apply(null,e)},this.rejectWith=function(n,e){return o(r,c,n).apply(null,e)},this.notifyWith=function(n,r){return o(e,p,n).apply(null,r)},this},h=function(){var e,r,t,u,i,s,a;if(r=l(arguments),1===r.length)return f(r[0])?r[0]:(new n).resolve(r[0]).promise();if(i=new n,!r.length)return i.resolve().promise();for(u=[],t=o(r.length,function(){return i.resolve.apply(i,u)}),r.forEach(function(n,e){return f(n)?n.done(function(){var n;return n=1<=arguments.length?y.call(arguments,0):[],u[e]=n.length>1?n:n[0],t()}):(u[e]=n,t())}),s=0,a=r.length;a>s;s++)e=r[s],f(e)&&e.fail(i.reject);return i.promise()},a=function(e){return e.Deferred=function(){return new n},e.ajax=p(e.ajax,function(e,r){var t,u,o,i;return null==r&&(r={}),u=new n,t=function(n,e){return p(n,function(){var n,r;return r=arguments[0],n=2<=arguments.length?y.call(arguments,1):[],r&&r.apply(null,n),e.apply(null,n)})},r.success=t(r.success,u.resolve),r.error=t(r.error,u.reject),i=e(r),o=u.promise(),o.abort=function(){return i.abort()},o}),e.when=h},"undefined"!=typeof exports?(exports.Deferred=function(){return new n},exports.when=h,exports.installInto=a):"function"==typeof define&&define.amd?define('simply.deferred',[],function(){return"undefined"!=typeof Zepto?a(Zepto):(n.when=h,n.installInto=a,n)}):"undefined"!=typeof Zepto?a(Zepto):(this.Deferred=function(){return new n},this.Deferred.when=h,this.Deferred.installInto=a)}.call(this);
/// @copyright Five9, Inc. The content presented herein may not, under
/// any circumstances, be reproduced in whole or in any part or form without
/// written permission from Five9, Inc.

define('msgbus/deferred',['underscore', 'simply.deferred', 'msgbus/object'], function (_, Deferred, Object) {
  var DeferredWrapper = Object.extend({
    _init: function _init() {
      this._deferred = new Deferred();
    },

    resolve: function resolve() {
      var args = arguments;

      _.defer(_.bind(function () {
        this._deferred.resolve.apply(this._deferred, args);
      }, this));

      return this;
    },

    reject: function reject() {
      var args = arguments;

      _.defer(_.bind(function () {
        this._deferred.reject.apply(this._deferred, args);
      }, this));

      return this;
    },

    promise: function promise() {
      return this._deferred.promise();
    }
  });

  return DeferredWrapper;
});
//# sourceMappingURL=deferred.js.map
;
/*! backbone-events-standalone 0.2.6 2015-05-18 */
!function(){function a(){return{keys:Object.keys||function(a){if("object"!=typeof a&&"function"!=typeof a||null===a)throw new TypeError("keys() called on a non-object");var b,c=[];for(b in a)a.hasOwnProperty(b)&&(c[c.length]=b);return c},uniqueId:function(a){var b=++g+"";return a?a+b:b},has:function(a,b){return e.call(a,b)},each:function(a,b,c){if(null!=a)if(d&&a.forEach===d)a.forEach(b,c);else if(a.length===+a.length)for(var e=0,f=a.length;f>e;e++)b.call(c,a[e],e,a);else for(var g in a)this.has(a,g)&&b.call(c,a[g],g,a)},once:function(a){var b,c=!1;return function(){return c?b:(c=!0,b=a.apply(this,arguments),a=null,b)}}}}var b,c=this,d=Array.prototype.forEach,e=Object.prototype.hasOwnProperty,f=Array.prototype.slice,g=0,h=a();b={on:function(a,b,c){if(!j(this,"on",a,[b,c])||!b)return this;this._events||(this._events={});var d=this._events[a]||(this._events[a]=[]);return d.push({callback:b,context:c,ctx:c||this}),this},once:function(a,b,c){if(!j(this,"once",a,[b,c])||!b)return this;var d=this,e=h.once(function(){d.off(a,e),b.apply(this,arguments)});return e._callback=b,this.on(a,e,c)},off:function(a,b,c){var d,e,f,g,i,k,l,m;if(!this._events||!j(this,"off",a,[b,c]))return this;if(!a&&!b&&!c)return this._events={},this;for(g=a?[a]:h.keys(this._events),i=0,k=g.length;k>i;i++)if(a=g[i],f=this._events[a]){if(this._events[a]=d=[],b||c)for(l=0,m=f.length;m>l;l++)e=f[l],(b&&b!==e.callback&&b!==e.callback._callback||c&&c!==e.context)&&d.push(e);d.length||delete this._events[a]}return this},trigger:function(a){if(!this._events)return this;var b=f.call(arguments,1);if(!j(this,"trigger",a,b))return this;var c=this._events[a],d=this._events.all;return c&&k(c,b),d&&k(d,arguments),this},stopListening:function(a,b,c){var d=this._listeners;if(!d)return this;var e=!b&&!c;"object"==typeof b&&(c=this),a&&((d={})[a._listenerId]=a);for(var f in d)d[f].off(b,c,this),e&&delete this._listeners[f];return this}};var i=/\s+/,j=function(a,b,c,d){if(!c)return!0;if("object"==typeof c){for(var e in c)a[b].apply(a,[e,c[e]].concat(d));return!1}if(i.test(c)){for(var f=c.split(i),g=0,h=f.length;h>g;g++)a[b].apply(a,[f[g]].concat(d));return!1}return!0},k=function(a,b){var c,d=-1,e=a.length,f=b[0],g=b[1],h=b[2];switch(b.length){case 0:for(;++d<e;)(c=a[d]).callback.call(c.ctx);return;case 1:for(;++d<e;)(c=a[d]).callback.call(c.ctx,f);return;case 2:for(;++d<e;)(c=a[d]).callback.call(c.ctx,f,g);return;case 3:for(;++d<e;)(c=a[d]).callback.call(c.ctx,f,g,h);return;default:for(;++d<e;)(c=a[d]).callback.apply(c.ctx,b)}},l={listenTo:"on",listenToOnce:"once"};h.each(l,function(a,c){b[c]=function(b,c,d){var e=this._listeners||(this._listeners={}),f=b._listenerId||(b._listenerId=h.uniqueId("l"));return e[f]=b,"object"==typeof c&&(d=this),b[a](c,d,this),this}}),b.bind=b.on,b.unbind=b.off,b.mixin=function(a){var b=["on","once","off","trigger","stopListening","listenTo","listenToOnce","bind","unbind"];return h.each(b,function(b){a[b]=this[b]},this),a},"undefined"!=typeof exports?("undefined"!=typeof module&&module.exports&&(exports=module.exports=b),exports.BackboneEvents=b):"function"==typeof define&&"object"==typeof define.amd?define('backbone.events',[],function(){return b}):c.BackboneEvents=b}(this);
/// @copyright Five9, Inc. The content presented herein may not, under
/// any circumstances, be reproduced in whole or in any part or form without
/// written permission from Five9, Inc.

define('msgbus/events',['underscore', 'backbone.events'], function (_, BackboneEvents) {
  var Events = _.clone(BackboneEvents);

  Events._originalTrigger = Events.trigger;

  Events.trigger = function () {
    var args = arguments;

    _.defer(_.bind(function () {
      Events._originalTrigger.apply(this, args);
    }, this));
  };

  delete Events.bind;
  delete Events.unbind;

  return Events;
});
//# sourceMappingURL=events.js.map
;
define('msgbus/utils',['underscore'], function (_) {
  var forEachIframe = function forEachIframe(func) {
    // Due to different security restrictions on some sites (Salesforce Lightning, ServiceNow Agent Workspace, may be others)
    // we might not have an access to 'frames' property in top/parent window objects.
    // So we are going to construct a list of all frames on the page collecting frames
    // from bottom (window) to top (window.parent(s)/window.top) objects.
    var frames = [];

    // Add a frame and all it's subframes to the list
    var _pushAllFrames = function _pushAllFrames(frame) {
      if (!frame || _.contains(frames, frame)) {
        return;
      }

      frames.push(frame);

      try {
        for (var i = 0; i < frame.frames.length; i++) {
          if (frame.frames[i]) {
            _pushAllFrames(frame.frames[i]);
          }
        }
      } catch (err) {
        // do nothing
      }
    };

    try {
      // Go through all windows from the current one to top
      var cWindow = window;
      while (true) {
        _pushAllFrames(cWindow);

        if (cWindow.parent && cWindow.parent !== cWindow) {
          cWindow = cWindow.parent;
        } else {
          break;
        }
      }

      // In theory window.top has been already added to the list
      // but according to documentation support of window.parent is not guaranty in all browsers.
      // So let's try to add window.top one more time
      _pushAllFrames(window.top);
    } catch (err) {
      // Do nothing
    }

    _.each(frames, function (frame) {
      try {
        func(frame);
      } catch (err) {
        // do nothing
      }
    });
  };

  var randomId = function randomId(str) {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }

    return str + '-' + s4() + s4() + s4() + s4();
  };

  return { randomId: randomId, forEachIframe: forEachIframe };
});
//# sourceMappingURL=utils.js.map
;
define('msgbus/channel',['msgbus/object', 'msgbus/message', 'msgbus/deferred', 'msgbus/events', 'underscore', 'msgbus/utils'], function (Object, Message, Deferred, Events, _, Utils) {
  var Dispatcher = Object.extend(Events);

  var REQUEST_ID_SEPARATOR = '#';

  var Channel = Object.extend({
    connect: function connect(options) {
      var force = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      if (!this._connectPromise || this._connectPromise.state() === "rejected") {
        var requestFunc = this.bind(function () {
          this._logDebug('connecting...');

          this._io.connect();
        });

        options = _.extend({}, { timeout: 15000 }, options);
        this._connectPromise = this._doRequest({ requestId: 'connect', requestFunc: requestFunc }, options);
      } else if (force && this._connectPromise.state() === "resolved") {
        // Ask io to connect but keep the current connect promise
        this._io.connect();
      }

      return this._connectPromise;
    },

    sendRequest: function sendRequest(request) {
      var requestId = '' + this._channelId + REQUEST_ID_SEPARATOR + _.uniqueId();

      var requestFunc = this.bind(function () {
        var msg = {
          hostId: this._hostId,
          id: requestId,
          request: request
        };

        this._logDebug('sending request:', request, ', id:', msg.id);

        this._send(msg);
      });

      return this._doRequest({ requestId: requestId, requestFunc: requestFunc });
    },

    sendResponse: function sendResponse(response, id) {
      var responseFunc = this.bind(function () {
        var msg = {
          id: id,
          response: response
        };

        this._logDebug('sending response:', response, ', id:', id);

        this._send(msg);
      });

      this._doResponse(responseFunc);
    },

    sendErrorResponse: function sendErrorResponse(error, id) {
      var responseFunc = this.bind(function () {
        var msg = {
          id: id,
          error: error
        };

        this._logDebug('sending error response:', error, ', id:', id);

        this._send(msg);
      });

      this._doResponse(responseFunc);
    },

    sendEvent: function sendEvent(event) {
      var eventFunc = this.bind(function () {
        var msg = {
          event: event
        };

        this._logDebug('sending event:', event);

        this._send(msg);
      });

      this._doEvent(eventFunc);
    },

    onEvent: function onEvent(fn) {
      this._dispatcher.on('event', fn);
    },

    offEvent: function offEvent(fn) {
      this._dispatcher.off('event', fn);
    },

    onCommunicationError: function onCommunicationError(fn) {
      this._dispatcher.on('communication:error', fn);
    },

    setRequestHandler: function setRequestHandler(handler) {
      this._requestHandler = handler;
    },

    _init: function _init(io) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      this._channelId = Utils.randomId(io.getName());
      this._io = io;
      this._options = options;
      this._pendingRequests = {};
      this._defaultOptions = { timeout: 60000, retries: 1 };
      this._dispatcher = new Dispatcher();
      this._io.onMessage(this.bind(this._dispatch));
      this._dispatcher.on('connect', this.bind(this._onConnect));
      this._dispatcher.on('connected', this.bind(this._onConnected));
      this._dispatcher.on('disconnect', this.bind(this._onDisconnect));
      this._dispatcher.on('request', this.bind(this._onRequest));
      this._dispatcher.on('response', this.bind(this._resolvePendingRequest));
      this._dispatcher.on('error', this.bind(this._rejectPendingRequest));
      this._dispatcher.on('communication:error', this.bind(this._rejectAllPendingRequests));

      if (this._options.autoConnect) {
        var autoConnect = this._options.autoConnect;
        var connectOptions = {
          timeout: autoConnect.timeout,
          retries: autoConnect.retries
        };

        this.connect(connectOptions);

        if (autoConnect.refreshInterval && autoConnect.refreshInterval !== 0) {
          this._refreshIntervalHandle = setInterval(this.bind(function () {
            this.connect(connectOptions, true);
          }), autoConnect.refreshInterval);

          this._destructors.push(this.bind(function () {
            clearInterval(this._refreshIntervalHandle);
          }));
        }
      }

      this._destructors.push(this.bind(function () {
        this._io.destroy();
        this._dispatcher.destroy();
      }));

      this._logDebug('initialized');
    },

    _send: function _send(msg) {
      var _this = this;

      var autoConnect = this._options.autoConnect;
      if (autoConnect) {
        this.connect(autoConnect).done(function () {
          return _this._sendToIO(msg);
        });
      } else {
        this._sendToIO(msg);
      }
    },

    // overridden in child
    _sendToIO: function _sendToIO(msg) {
      this._io.send(msg);
    },

    _dispatch: function _dispatch(raw) {
      if (_(raw.hostId).isUndefined() || raw.hostId === this._hostId) {
        var msg = new Message(raw);

        this._logDebug('received', msg.type() + ':', msg.data(), msg.id() ? ', id: ' + msg.id() : '');

        this._dispatcher.trigger(msg.type(), msg.data(), msg.id());
      }
    },

    _onConnect: function _onConnect() {
      this._logDebug('Got connect message. Send "connected" back');
      this._io.send('connected:');

      if (!this._resolvePendingRequest(undefined, 'connect')) {
        this._connectPromise = new Deferred().resolve().promise();
      }
    },

    _onConnected: function _onConnected(hostId) {
      this._logDebug('connected: ' + hostId);
      this._hostId = hostId;
      this._resolvePendingRequest(undefined, 'connect');
    },

    _onDisconnect: function _onDisconnect() {
      this._logDebug('disconnected');
      delete this._connectPromise;
    },

    _onRequest: function _onRequest(data, msgId) {
      this._requestHandler.handle(data, msgId);
    },

    _doResponse: function _doResponse(responseFunc) {
      responseFunc.call(this);
    },

    _doEvent: function _doEvent(eventFunc) {
      eventFunc.call(this);
    },

    _doRequest: function _doRequest(requestObj, options, pending) {
      options = _.extend({}, { requestObj: requestObj }, options);
      var promise = this._savePendingRequest(options, pending);

      requestObj.requestFunc.call(this);

      return promise;
    },

    _savePendingRequest: function _savePendingRequest(options, pending) {
      options = _.extend({}, this._defaultOptions, options);
      var msgId = options.requestObj.requestId;

      if (!_(this._pendingRequests[msgId]).isObject()) {
        var timerId = setTimeout(this.bind(function () {
          this._logDebug('timeout for request with id:', msgId);

          this._rejectPendingRequest('Timeout', msgId);
        }), options.timeout);

        this._pendingRequests[msgId] = {
          deferred: _(pending).isObject() ? pending.deferred : new Deferred(),
          timerId: timerId,
          options: options
        };
      }

      return this._pendingRequests[msgId].deferred.promise();
    },

    _resolvePendingRequest: function _resolvePendingRequest(response, msgId) {
      return this._handlePendingRequest('resolve', response, msgId);
    },

    _rejectPendingRequest: function _rejectPendingRequest(error, msgId, noretry) {
      return this._handlePendingRequest('reject', error, msgId, noretry);
    },

    _handlePendingRequest: function _handlePendingRequest(method, msg, msgId, noretry) {
      var pending = this._pendingRequests[msgId];

      if (!_(pending).isUndefined()) {
        clearTimeout(pending.timerId);
        delete this._pendingRequests[msgId];
        if (noretry || !this._retryPendingRequest(method, pending)) {
          pending.deferred[method](msg);
        }
        return true;
      }
      return false;
    },

    _retryPendingRequest: function _retryPendingRequest(method, pending) {
      var options = pending.options;
      if (method === 'resolve') {
        return false;
      }

      if (options.retries === 1) {
        return false;
      }

      this._logDebug('retry pending request ', method);

      options.retries -= 1;
      this._doRequest(options.requestObj, options, pending);
      return true;
    },

    _rejectAllPendingRequests: function _rejectAllPendingRequests(error) {
      var msgIds = _(this._pendingRequests).keys();

      _(msgIds).each(this.bind(function (msgId) {
        this._rejectPendingRequest(error, msgId, true);
      }));
    },

    _addModuleName: function _addModuleName() {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      args.unshift('msgbus.js channel [' + this._io.getName() + '] ');
      return args;
    },

    _logDebug: function _logDebug() {
      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      console.debug.apply(console, this._addModuleName(args));
    },

    _logWarn: function _logWarn() {
      for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }

      console.warn.apply(console, this._addModuleName(args));
    }
  });

  return Channel;
});
//# sourceMappingURL=channel.js.map
;
define('msgbus/channel-throttling',['msgbus/channel', 'underscore'], function (Channel, _) {
  var defaultThrottlingOptions = {
    outgoingQueueSize: 50,
    messageRateMs: 10
  };

  var ChannelThrottling = Channel.extend({
    _init: function _init(io) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      this._super._init.call(this, io, options);

      this._throttlingOptions = _.extend({}, defaultThrottlingOptions, options.throttling);
      this._outgoingQueue = [];
      this._isProcessing = false;
    },

    _startOutgoingQueueProcessing: function _startOutgoingQueueProcessing() {
      var _this2 = this;

      if (this._isProcessing) {
        return;
      }

      this._logDebug('start outgoing queue processing with rate(ms):', this._throttlingOptions.messageRateMs);

      this._queueProcessor = function () {
        var _this = this;

        if (this._outgoingQueue.length > 0) {
          this._logDebug('Process message from outgoing queue. Total messages:', this._outgoingQueue.length);

          var msg = this._outgoingQueue.shift();
          this._io.send(msg);

          setTimeout(function () {
            return _this._queueProcessor();
          }, this._throttlingOptions.messageRateMs);
        } else {
          this._logDebug('No messages in queue, stop outgoing queue processing');
          this._isProcessing = false;
        }
      };

      // set timeout to 0 to send almost immediatelly
      setTimeout(function () {
        return _this2._queueProcessor();
      }, 0);
      this._isProcessing = true;
    },

    _enqueueMsg: function _enqueueMsg(msg) {
      this._startOutgoingQueueProcessing();

      if (this._outgoingQueue.length >= this._throttlingOptions.outgoingQueueSize) {
        this._logDebug('Drop message due to high api call rate:', msg);
        this._rejectPendingRequest('Message dropped', msg.id, true);
        return;
      }

      this._outgoingQueue.push(msg);
    },

    _sendToIO: function _sendToIO(msg) {
      if (msg.request || msg.event) {
        this._enqueueMsg(msg);
      } else {
        this._io.send(msg);
      }
    }
  });

  return ChannelThrottling;
});
//# sourceMappingURL=channel-throttling.js.map
;
/// @copyright Five9, Inc. The content presented herein may not, under
/// any circumstances, be reproduced in whole or in any part or form without
/// written permission from Five9, Inc.

define('msgbus/event-dispatcher',['msgbus/object', 'msgbus/events'], function (Object, Events) {
  var EventDispatcher = Object.extend({
    _init: function _init(channel) {
      var eventHandler = this.bind(function (event) {
        var args = [EventDispatcher.eventId(event.objectId, event.name)].concat(event.data);
        this.trigger.apply(this, args);
      });

      channel.onEvent(eventHandler);

      this._destructors.push(this.bind(function () {
        this.off();
        channel.offEvent(eventHandler);
      }));
    }
  }, {
    eventId: function eventId(objectId, eventName) {
      return objectId + ':' + eventName;
    }
  });

  EventDispatcher.mixin(Events);

  return EventDispatcher;
});
//# sourceMappingURL=event-dispatcher.js.map
;
define('msgbus/api-object',['msgbus/object', 'msgbus/events'], function (Object, Events) {
  var ApiObject = Object.extend({
    _init: function _init(api, apiFactory, config) {
      this._api = apiFactory.defineApi(api);

      if (config.methods) {
        _.each(config.methods, this.bind(function (methodName) {
          this[methodName] = apiFactory.defineSimpleMethod(methodName);
        }));
      }

      if (config.events) {
        _.each(config.events, this.bind(function (eventName) {
          apiFactory.defineEvent(this, eventName);
        }));
      }

      this._destructors.push(this.bind(this.off));
    }
  });

  ApiObject.mixin(Events);

  return ApiObject;
});
//# sourceMappingURL=api-object.js.map
;
define('msgbus/data-object',['underscore', 'msgbus/object', 'msgbus/events'], function (_, Object, Events) {
  var DataObject = Object.extend({
    _init: function _init(data, apiFactory) {
      var _this = this;

      this._data = data;
      this._api = this._name + '_' + this.get('id');

      apiFactory.defineEvent(this, 'dataChanged');
      this.on('dataChanged', function (newData) {
        return _this.set(newData);
      });

      this.dataChanged = apiFactory.defineEventTrigger('dataChanged');

      this._destructors.push(this.bind(this.off));
    },
    get: function get(key) {
      return this._data[key];
    },
    set: function set(key, value) {
      if (_.isString(key)) {
        this._data[key] = value;
      } else if (_.isObject(key)) {
        _.extend(this._data, key);
      }
      this.trigger('change');
    },
    getData: function getData() {
      return this._data;
    }
  });

  DataObject.mixin(Events);

  return DataObject;
});
//# sourceMappingURL=data-object.js.map
;
define('msgbus/request-handler',['underscore', 'simply.deferred', 'msgbus/object', 'msgbus/data-object'], function (_, Deferred, Object, DataObject) {
  var RequestHandler = Object.extend({
    addMethodProvider: function addMethodProvider(obj, methodProvider) {
      methodProvider = methodProvider || obj;
      this._methodProviders[obj._api] = methodProvider;
    },
    registerSimpleMethodImplementation: function registerSimpleMethodImplementation(obj, name, func) {
      var _this = this;

      var methodImpl = function methodImpl() {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        var method = func || _this._getMethodFromProvider(obj._api, name);
        return _this._makeThenableMethod(method).apply(null, args);
      };

      var methodId = RequestHandler.methodId(obj._api, name);
      this._methodImpls[methodId] = methodImpl;
    },
    registerSimplePropertyImplementation: function registerSimplePropertyImplementation(obj, name, func) {
      var _this2 = this;

      var methodImpl = function methodImpl() {
        for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          args[_key2] = arguments[_key2];
        }

        var method = func || _this2._getMethodFromProvider(obj._api, name);
        return _this2._makeThenableMethod(method).apply(null, args);
      };

      var methodId = RequestHandler.methodId(obj._api, name);
      this._methodImpls[methodId] = methodImpl;
    },
    registerApiPropertyImplementation: function registerApiPropertyImplementation(obj, name, func) {
      var _this3 = this;

      var methodImpl = function methodImpl() {
        for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
          args[_key3] = arguments[_key3];
        }

        var method = func || _this3._getMethodFromProvider(obj._api, name);

        return _this3._makeThenableMethod(method).apply(null, args).then(function (object) {
          return RequestHandler.serialize(object);
        });
      };

      var methodId = RequestHandler.methodId(obj._api, name);
      this._methodImpls[methodId] = methodImpl;
    },
    registerApiArrayPropertyImplementation: function registerApiArrayPropertyImplementation(obj, name, func) {
      var _this4 = this;

      var methodImpl = function methodImpl() {
        for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
          args[_key4] = arguments[_key4];
        }

        var method = func || _this4._getMethodFromProvider(obj._api, name);

        return _this4._makeThenableMethod(method).apply(null, args).then(function () {
          var objects = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

          objects = Array.isArray(objects) ? objects : [objects];
          return _.map(objects, function (object) {
            return RequestHandler.serialize(object);
          });
        });
      };

      var methodId = RequestHandler.methodId(obj._api, name);
      this._methodImpls[methodId] = methodImpl;
    },
    handle: function handle(request, id) {
      var _this5 = this;

      var methodId = RequestHandler.methodId(request.objectId, request.attrName);
      var func = this._methodImpls[methodId];

      if (func) {
        func.call(this, request.args).then(function () {
          var response = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
          return _this5._channel.sendResponse(response, id);
        }, function () {
          var error = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'Unknown error';
          return _this5._channel.sendErrorResponse(error, id);
        });
      } else {
        throw 'Not Registered: \'' + request.attrName + '\' method was not registered';
      }
    },
    _init: function _init(channel) {
      this._channel = channel;
      this._methodImpls = {};
      this._methodProviders = {};
    },
    _getMethodFromProvider: function _getMethodFromProvider(objectId, name) {
      var methodProvider = this._methodProviders[objectId];
      if (methodProvider) {
        var func = methodProvider.getMethod(name);
        if (func) {
          return func;
        } else {
          return function () {
            return new Deferred().reject('Not Implemented: \'' + name + '\' method was not found in method provider for \'' + objectId + '\' api').promise();
          };
        }
      } else {
        return function () {
          return new Deferred().reject('Not Implemented: method provider for \'' + objectId + '\' api was not found').promise();
        };
      }
    },
    _makeThenableMethod: function _makeThenableMethod(method) {
      return function () {
        var d = new Deferred();

        try {
          for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
            args[_key5] = arguments[_key5];
          }

          var result = method.apply(this, args);
          if (result && _.isFunction(result.then)) {
            result.then(function (response) {
              d.resolve(response);
              return true;
            }, function (error) {
              d.reject(error);
              return true;
            });
          } else {
            d.resolve(result);
          }
        } catch (err) {
          d.reject('Exception thrown from an implementation method: ' + err);
        }

        return d.promise();
      };
    }
  }, {
    methodId: function methodId(objectId, methodName) {
      return objectId + ':' + methodName;
    },
    serialize: function serialize(object) {
      if (object && object instanceof DataObject) {
        return object.getData();
      }
      return object;
    }
  });

  return RequestHandler;
});
//# sourceMappingURL=request-handler.js.map
;
/// @copyright Five9, Inc. The content presented herein may not, under
/// any circumstances, be reproduced in whole or in any part or form without
/// written permission from Five9, Inc.

define('msgbus/api-factory',['msgbus/channel', 'msgbus/channel-throttling', 'msgbus/object', 'msgbus/deferred', 'msgbus/event-dispatcher', 'msgbus/api-object', 'msgbus/request-handler', 'underscore'], function (Channel, ChannelThrottling, F9Object, Deferred, EventDispatcher, ApiObject, RequestHandler, _) {
  var apiFactory = F9Object.extend({
    channel: function channel() {
      return this._channel;
    },

    defineApi: function defineApi(apiId) {
      return apiId;
    },

    definePropertyOrMethod: function definePropertyOrMethod(verb, name, mapData) {
      var factory = this;
      return function (options) {
        var deferred = new Deferred();
        var objectId = this._api;

        factory.channel().sendRequest({
          objectId: objectId,
          verb: verb,
          attrName: name,
          args: options
        }).done(function (data) {
          var result = mapData(data);

          if (result.success) {
            deferred.resolve(result.data);
          } else {
            deferred.reject({ what: 'Data validation failed', data: result.data });
          }
        }).fail(function (err) {
          deferred.reject(err);
        });

        return deferred.promise();
      };
    },

    addMethodProvider: function addMethodProvider(obj, methodProvider) {
      this._requestHandler.addMethodProvider(obj, methodProvider);
    },

    defineSimpleProperty: function defineSimpleProperty(name) {
      return this.definePropertyOrMethod('get', name, function (data) {
        return { success: true, data: data };
      });
    },

    defineSimplePropertyImplementation: function defineSimplePropertyImplementation(obj, name, func) {
      this._requestHandler.registerSimplePropertyImplementation(obj, name, func);
    },

    defineApiProperty: function defineApiProperty(name, Wrapper) {
      var factory = this;
      return this.definePropertyOrMethod('get', name, function (data) {
        var ret = new Wrapper(data, factory);

        return { success: true, data: ret };
      });
    },

    defineApiPropertyImplementation: function defineApiPropertyImplementation(obj, name, func) {
      this._requestHandler.registerApiPropertyImplementation(obj, name, func);
    },

    defineApiArrayProperty: function defineApiArrayProperty(name, Wrapper) {
      var factory = this;
      return this.definePropertyOrMethod('get', name, function (data) {
        var ret = _(data).map(function (d) {
          return new Wrapper(d, factory);
        });

        return { success: true, data: ret };
      });
    },

    defineApiArrayPropertyImplementation: function defineApiArrayPropertyImplementation(obj, name, func) {
      this._requestHandler.registerApiArrayPropertyImplementation(obj, name, func);
    },

    defineSimpleMethod: function defineSimpleMethod(name, failIndicator) {
      return this.definePropertyOrMethod('post', name, function (data) {
        var ok = true;

        if (!_(failIndicator).isUndefined()) {
          ok = data !== failIndicator;
        }

        return { success: ok, data: data };
      });
    },

    defineSimpleMethodImplementation: function defineSimpleMethodImplementation(obj, name, func) {
      this._requestHandler.registerSimpleMethodImplementation(obj, name, func);
    },

    defineApiMethod: function defineApiMethod(name, Wrapper) {
      var factory = this;
      return this.definePropertyOrMethod('post', name, function (data) {
        var ok = false;
        var ret;

        if (_(data).isString()) {
          ok = true;
          if (_(Wrapper).isFunction()) {
            ret = new Wrapper(data, factory);
          } else if (_(Wrapper).isObject()) {
            ret = new ApiObject(data, factory, Wrapper);
          }
        }

        return { success: ok, data: ret };
      });
    },

    defineEvent: function defineEvent() {
      var that = this;
      var addCommonListener = function addCommonListener(obj, name, commonListener) {
        var objectId = obj._api;
        obj.listenTo(that._eventDispatcher, EventDispatcher.eventId(objectId, name), commonListener);
      };

      var removeCommonListener = function removeCommonListener(obj) {
        obj.stopListening();
      };

      this._defineEventTemplate(arguments, addCommonListener, removeCommonListener);
    },

    defineEventTrigger: function defineEventTrigger(name) {
      var that = this;
      return function (data) {
        var message = {
          data: data,
          objectId: this._api,
          name: name
        };

        that.channel().sendEvent(message);
      };
    },

    defineLocalEventTrigger: function defineLocalEventTrigger(name) {
      var that = this;
      return function (data) {
        that._eventDispatcher.trigger(EventDispatcher.eventId(this._api, name), data);
      };
    },

    resetEvents: function resetEvents() {
      this._eventDispatcher.off();
    },

    _init: function _init(io, options) {
      this._initChannel(io, options);
      this._eventDispatcher = new EventDispatcher(this.channel());
      this._requestHandler = new RequestHandler(this.channel());

      this.channel().onCommunicationError(this.bind(function () {
        this._eventDispatcher.off();
      }));

      this.channel().setRequestHandler(this._requestHandler);

      this._destructors.push(this.bind(function () {
        this._eventDispatcher.destroy();
        this._channel.destroy();
      }));
    },

    _initChannel: function _initChannel(io, options) {
      if (options && options.throttling) {
        this._channel = new ChannelThrottling(io, options);
      } else {
        this._channel = new Channel(io, options);
      }
    },

    _defineEventTemplate: function _defineEventTemplate(args, addCommonListener, removeCommonListener) {
      args = _(args).toArray();
      var obj = args.shift();
      var name = args.shift();
      var originalName = _(args[0]).isString() ? args.shift() : name;
      var factory = this;

      var commonListener = function commonListener() {
        var wrappers = _(args).clone();

        var rawEventArgs = _(arguments).toArray();
        var eventArgs = _(rawEventArgs).map(function (eventArg) {
          var Wrapper = wrappers.shift();
          return _(Wrapper).isUndefined() ? eventArg : new Wrapper(eventArg, factory);
        });

        var eventArgsStr = _(rawEventArgs).reduce(function (acc, eventArg) {
          return acc + ':' + eventArg;
        }, '');

        if (!_(eventArgs).isEmpty()) {
          obj.trigger.apply(obj, [name + eventArgsStr].concat(eventArgs));
        }

        obj.trigger.apply(obj, [originalName].concat(eventArgs));
      };

      obj._destructors.push(function () {
        removeCommonListener(obj, originalName, commonListener);
      });

      addCommonListener(obj, originalName, commonListener);
    }
  });

  return apiFactory;
});
//# sourceMappingURL=api-factory.js.map
;
define('msgbus/duplex-iframe-io',['underscore', 'msgbus/object', 'msgbus/events', 'msgbus/utils'], function (_, MsgBusObject, Events, Utils) {
  var DuplexIframeIO = MsgBusObject.extend({
    connect: function connect() {
      throw 'Abstract method';
    },
    send: function send(message) {
      var _this = this;

      if (_.isEmpty(this._ports)) {
        this._logError(this.getName(), ' native port is not connected yet');
        return;
      }

      var packedMsg = this._pack(message);
      _.each(this._ports, function (port, portId) {
        _this._logDebug('Send message to port:', portId);
        port.postMessage(packedMsg);
      });
    },
    onMessage: function onMessage(fn) {
      this.on('message', fn);
    },
    getName: function getName() {
      return this._name;
    },
    _init: function _init(channelName) {
      this._name = Utils.randomId(channelName);
      this._iframeName = channelName;
      this._ports = {};
      this._channels = {};
      this._frames = {};

      var disconnect = _.bind(this._disconnect, this);
      var originalBeforeUnload = window.onbeforeunload;
      window.onbeforeunload = function () {
        disconnect();

        if (originalBeforeUnload) {
          for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }

          return originalBeforeUnload.apply(this, args);
        }
      };
    },
    _pack: function _pack(message) {
      return {
        iframeName: this._iframeName,
        message: message,
        sender: this._name
      };
    },
    _triggerMessage: function _triggerMessage(msg) {
      this.trigger('message', msg);
    },
    _fromExpectedSource: function _fromExpectedSource(data) {
      return this._name !== data.sender && data.iframeName === this._iframeName;
    },
    _onPortDisconnected: function _onPortDisconnected(portId) {
      this._deletePort(portId);

      if (_.isEmpty(this._ports)) {
        this._logDebug(this.getName(), 'No active ports. Let the channel know.');
        this._triggerMessage(DuplexIframeIO.MESSAGE_DISCONNECT);
      }
    },
    _onPortMessage: function _onPortMessage(event) {
      var data = event.data;

      if (_.isObject(data) && this._fromExpectedSource(data)) {
        if (data.message === DuplexIframeIO.MESSAGE_DISCONNECT) {
          this._logDebug('Got disconnect request from: ', data.sender);
          this._onPortDisconnected(data.sender);
        } else {

          this._triggerMessage(data.message);
        }
      }
    },
    _onPortMessageError: function _onPortMessageError(error) {
      this._logError(this.getName(), ' native port error:', error);
    },
    _disconnect: function _disconnect() {
      var _this2 = this;

      if (_.isEmpty(this._ports)) {
        this._logError(this.getName(), ' native port is not connected yet');
        return;
      }

      var packedMsg = this._pack(DuplexIframeIO.MESSAGE_DISCONNECT);
      _.each(this._ports, function (port, portId) {
        _this2._logDebug('Send disconnect to port:', portId);
        port.postMessage(packedMsg);

        _this2._deletePort(portId);
      });
    },
    _deletePort: function _deletePort(portId) {
      if (this._ports[portId]) {
        this._ports[portId].close();

        delete this._ports[portId];
        delete this._channels[portId];
        delete this._frames[portId];
      }
    },


    _addModuleName: function _addModuleName() {
      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      args.unshift('msgbus.js duplex-io [' + this.getName() + '] ');
      return args;
    },

    _logDebug: function _logDebug() {
      for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }

      console.debug.apply(console, this._addModuleName(args));
    },

    _logError: function _logError() {
      for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
        args[_key4] = arguments[_key4];
      }

      console.error.apply(console, this._addModuleName(args));
    }
  }, {
    MESSAGE_CONNECT: 'connect',
    MESSAGE_ASKING_CONNECT: 'asking_connect',
    MESSAGE_DISCONNECT: 'disconnect'
  });

  DuplexIframeIO.mixin(Events);

  return DuplexIframeIO;
});
//# sourceMappingURL=duplex-iframe-io.js.map
;
define('msgbus/duplex-iframe-io-remote',['underscore', 'msgbus/duplex-iframe-io', 'msgbus/utils'], function (_, DuplexIo, Utils) {
  var DuplexIframeIO = DuplexIo.extend({
    connect: function connect() {
      this._logDebug('Start broadcast asking_connect');

      Utils.forEachIframe(this.bind(this._sendAskConnect));
    },
    _init: function _init(channelName) {
      this._super._init.call(this, channelName);
      this._name = 'remote_' + this._name;

      window.addEventListener('message', this.bind(this._onWindowMessage), false);
    },
    _onWindowMessage: function _onWindowMessage(event) {
      var data = event.data;

      if (_.isObject(data) && this._fromExpectedSource(data)) {
        if (data.message === DuplexIo.MESSAGE_CONNECT) {
          this._logDebug('Got incoming connect request: ', data.message);
          this._onConnect(event);
        }
      }
    },
    _onConnect: function _onConnect(event) {
      var _this = this;

      _.each(this._ports, function (port, portId) {
        _this._logDebug('Close existing port:', portId);
        _this._deletePort(portId);
      });

      if (event.ports && event.ports[0] && event.data.sender) {
        this._ports[event.data.sender] = event.ports[0];
        this._ports[event.data.sender].onmessage = this.bind(this._onPortMessage);
        this._ports[event.data.sender].onmessageerror = this.bind(this._onPortMessageError);
      }
      this._triggerMessage(DuplexIo.MESSAGE_CONNECT);
    },
    _sendAskConnect: function _sendAskConnect(targetWindow) {
      try {
        var data = this._pack(DuplexIo.MESSAGE_ASKING_CONNECT);
        targetWindow.postMessage(data, '*');
      } catch (err) {
        this._logDebug('Could not send ask connection message to', targetWindow, err);
      }
    }
  });

  return DuplexIframeIO;
});
//# sourceMappingURL=duplex-iframe-io-remote.js.map
;
define('msgbus/method-provider',['underscore'], function (_) {
  return {
    _methods: {},

    setMethod: function setMethod(name, func) {
      if (_.isFunction(func)) {
        this._methods[name] = func;
      } else {
        console.error('msgbus.js: ' + name + ' is not a function');
      }
    },
    getMethod: function getMethod(name) {
      return this._methods[name];
    },
    setMethods: function setMethods(object) {
      var _this = this;

      _.each(this.Methods, function (method) {
        if (_.isFunction(object[method])) {
          _this.setMethod(method, _.bind(object[method], object));
        }
      });
    }
  };
});
//# sourceMappingURL=method-provider.js.map
;
define('sdk.public/crm/interaction.api/interaction.api',['underscore', 'simply.deferred', 'msgbus/object', 'msgbus/events', 'msgbus/method-provider'], function (_, Deferred, Object, Events, MethodProvider) {

  /**
   * @class InteractionApi
   */
  var InteractionApi = Object.extend({
    EventTriggers: {

      /**
       * @function click2dial
       * @memberof InteractionApi
       * @instance
       * @description Communicate to Five9 adapter that user pressed phone number and wants to initiate click to dial.
       * call will be started automatically if default campaign is configured by administrator or campaign name is provided
       * in click2dialData parameter.
       * @param {object} params
       * @param {Click2DialData} params.click2DialData data associated with click 2 dial operation
       * @returns {void}
       */
      CLICK_TO_DIAL: 'click2dial'
    },

    Events: {
      InteractionEvent: 'interactionEvent'
    },

    /**
    * @interface InteractionApiEvents
    */

    /**
    * @function callStarted
    * @abstract
    * @memberof InteractionApiEvents
    * @instance
    * @description Implement this callback to execute your code when ADT starts handling new call
    * This event is also executed after every page refresh if ADT is handling call.
    * @param {object} params
    * @param {CallData} params.callData Call information
    * @returns {void}
    */

    /**
    * @function callFinished
    * @abstract
    * @memberof InteractionApiEvents
    * @instance
    * @description Implement this callback to execute your code when ADT finished handling a call
    * It's called after a disposition was set and a call log is saved in a CRM system
    * (applicable when used with an adapter integrated with a CRM system)
    * @param {object} params
    * @param {CallData} params.callData Call information
    * @param {CallLogData} params.callLogData Call log data
    * @returns {void}
    */

    /**
    * @function callAccepted
    * @abstract
    * @memberof InteractionApiEvents
    * @instance
    * @description Implement this callback to execute your code when a call moves to TALKING, ON_HOLD or RINGING_ON_OTHER_SIDE states.
    * This event is executed only once for a call.
    * It is also executed after every page refresh right after callStarted event
    * if a call is in a one of the mentioned states.
    * @param {object} params
    * @param {CallData} params.callData Call information
    */

    /**
     * @function callEnded
     * @abstract
     * @memberof InteractionApiEvents
     * @instance
     * @description Implement this callback to execute your code when call was ended either by agent or customer
     * but before it has been dispositioned
     * @param {object} params
     * @param {CallData} params.callData Call information
     */

    /**
     * @function callRejected
     * @abstract
     * @memberof InteractionApiEvents
     * @instance
     * @description Implement this callback to execute your code when call was rejected by agent
     * @param {object} params
     * @param {CallData} params.callData Call information
     */

    /**
    * @function emailOffered
    * @abstract
    * @memberof InteractionApiEvents
    * @instance
    * @description Implement this callback to execute your code when ADT starts handling new call
    * @param {object} params
    * @param {EmailData} params.emailData Email interaction information
    * @returns {void}
    */

    /**
    * @function emailFinished
    * @abstract
    * @memberof InteractionApiEvents
    * @instance
    * @description Implement this callback to execute your code when ADT finished handling an email.
    * It's called after a disposition was set and an email log is saved in a CRM system
    * (applicable when used with an adapter integrated with a CRM system)
    * @param {object} params
    * @param {EmailData} params.emailData Email interaction information
    * @param {EmailLogData} params.emailLogData Email log data
    * @returns {void}
    */

    /**
     * @function emailAccepted
     * @abstract
     * @memberof InteractionApiEvents
     * @instance
     * @description Implement this callback to execute your code when an email is locked by agent.
     * This event is executed after each page refresh right after emailOffered event.
     * @param {object} params
     * @param {EmailData} params.emailData Email interaction information
     * @returns {void}
     */

    /**
     * @function emailRejected
     * @abstract
     * @memberof InteractionApiEvents
     * @instance
     * @description Implement this callback to execute your code when email was rejected by agent
     * @param {object} params
     * @param {EmailData} params.emailData Email interaction information
     * @returns {void}
     */

    /**
       * @function chatOffered
       * @abstract
       * @memberof InteractionApiEvents
       * @instance
       * @description Implement this callback to execute your code when ADT starts handling new call
       * @param {object} params
       * @param {ChatData} params.chatData Chat interaction information
       * @returns {void}
       */
    /**
    * @function chatFinished
    * @abstract
    * @memberof InteractionApiEvents
    * @instance
    * @description Implement this callback to execute your code when ADT finished handling a chat.
    * It's called after a disposition was set and a chat log is saved in a CRM system
    * (applicable when used with an adapter integrated with a CRM system)
    * @param {object} params
    * @param {ChatData} params.chatData Chat interaction information
    * @param {ChatLogData} params.chatLogData Chat log data
    * @returns {void}
    */
    /**
    * @function chatAccepted
    * @abstract
    * @memberof InteractionApiEvents
    * @instance
    * @description Implement this callback to execute your code when a chat is locked by an agent or the agent is added to a conference.
    * This event is also executed after each page refresh.
    * @param {object} params
    * @param {ChatData} params.chatData Chat interaction information
    * @returns {void}
    */

    /**
     * @function chatEnded
     * @abstract
     * @memberof InteractionApiEvents
     * @instance
     * @description Implement this callback to execute your code when call was ended either by agent or customer
     * and before it has been dispositioned
     * @param {object} params
     * @param {ChatData} params.chatData Chat interaction information
     * @returns {void}
     */

    /**
     * @function chatRejected
     * @abstract
     * @memberof InteractionApiEvents
     * @instance
     * @description Implement this callback to execute your code when chat was rejected by agent
     * @param {object} params
     * @param {ChatData} params.chatData Chat interaction information
     * @returns {void}
     */

    /**
    * @function subscribe
    * @memberof InteractionApi
    * @instance
    * @description Subscribes to Interaction Api events.
    *```
    * var interactionApi = window.Five9.CrmSdk.interactionApi();
    * interactionApi.subscribe({
    *     callStarted: function (params) {
    *     },
    *     callFinished: function (params) {
    *     },
    *     callAccepted: function (params) {
    *     },
    *     callRejected: function (params) {
    *     },
    *     callEnded: function (params) {
    *     },
    *     emailOffered: function (params) {
    *     },
    *     emailAccepted: function (params) {
    *     },
    *     emailRejected: function (params) {
    *     },
    *     emailFinished: function (params) {
    *     },
    *     chatOffered: function (params) {
    *     },
    *     chatAccepted: function (params) {
    *     },
    *     chatRejected: function (params) {
    *     },
    *     chatEnded: function (params) {
    *     },
    *     chatFinished: function (params) {
    *     }
    * });   
    *```
    * @param {InteractionApiEvents} apiEvents Callbacks corresponding to the events will be called on object passed as parameter
    * @returns {void}
    */

    Apis: {
      /**
      * @function setCav
      * @memberof InteractionApi
      * @instance
      * @description Sets value of call attached variables
      * ```
      * interactionApi.setCav({interactionId: "45E471D607A94072A553A1406CC0BF03", cavList: [{id: "641", value: "test value"}, {id:"219", value: "test@example.com"}]});
      * ```
      * @param {object} params Parameters
      * @param {string} params.interactionId Five9 Call Session Id (see {@link CallData})
      * @param {object[]} params.cavList list of call attached variables to update
      * @param {string} params.cavList[].id ID of call attached variable
      * @param {string} params.cavList[].value New value of call attached variable
      * @returns {Promise} Success callback is invoked upon successful call to Five9 REST API. Error code will be provided otherwise
      */
      SetCav: 'setCav',

      /**
      * @function getCav
      * @memberof InteractionApi
      * @instance
      * @description Retreives list of call attached variables
      * ```
      * interactionApi.subscribe({
      *      callStarted: function (params) {
      *         interactionApi.getCav({interactionId: params.callData.interactionId}).then(function (cavList) {
      *           console.debug('IframeV2 got cavList: ' + JSON.stringify(cavList));
      *         });
      *      }});
      * ```
      * @param {object} params Parameters
      * @param {string} params.interactionId Five9 Call Session Id (see {@link CallData})
      * @returns {Promise} Promise objects represents {@link Cav}[]
      */
      GetCav: 'getCav',

      /**
      * @function setDisposition
      * @memberof InteractionApi
      * @instance
      * @description Sets  disposition for current call
      *```
      * interactionApi.setDisposition({interactionType: 'Call', interactionId: "92544E7EFD1B4858A93C54092CB51886", dispositionId: "3558"});
      *```
      * @param {object} params
      * @param {InteractionType} params.interactionType Type of interaction
      * @param {string} params.interactionId Five9 Interaction Session Id (see {@link CallData} | {@link ChatData} | {@link EmailData})
      * @param {string} params.dispositionId Disposition Id
      * @param {string} params.timeout  Value of the timer, which applies only when the disposition is REDIAL or DND.
      * When setting the disposition, the agent may change the value if the disposition has either of these flags:
      * - ALLOW_SET_REACTIVATE_TIMER
      * - ALLOW_SET_REDIAL_TIMER
      * @returns {Promise} Success callback is invoked upon successful call to Five9 REST API. Error code will be provided otherwise
      */
      SetDisposition: 'setDisposition',

      /**
      * @function getDispositions
      * @memberof InteractionApi
      * @instance
      * @description Retrieves list of dispositions for specified interaction
      * ```
      * interactionApi.subscribe({
      *      callStarted: function (params) {
      *          interactionApi.getDispositions({interactionType: 'Call', interactionId: params.callData.interactionId}).then(function (dispList) {
      *            console.debug('IframeV2 got dispList: ' + JSON.stringify(dispList));
      *      });              
      *      }});
      * ```
      * @param {object} params
      * @param {InteractionType} params.interactionType type of interaction
      * @param {string} params.interactionId Five9 Interaction Session Id (see {@link CallData} | {@link ChatData} | {@link EmailData})
      * @returns {Promise} Promise objects represents {@link Disposition}[]
      */
      GetDispositions: 'getDispositions',

      /**
       * @function isMasterPage
       * @memberof InteractionApi
       * @instance
       * @description Determines if this page contains ADT instance which holds websocket connection
       * @returns {Promise} Promise objects represents boolean value
       */
      IsMasterPage: 'isMasterPage'
    },

    _init: function _init(apiFactory) {
      var _this = this;

      this._api = 'interactionApi';
      this._apiFactory = apiFactory;

      // Define Event triggers
      _.each(this.EventTriggers, function (name) {
        _this[name] = apiFactory.defineEventTrigger(name);
      });

      // Define Events
      apiFactory.defineEvent(this, this.Events.InteractionEvent);

      // Define Apis
      _.each(this.Apis, function (method) {
        _this[method] = apiFactory.defineSimpleMethod(method);
      });

      this._destructors.push(this.bind(this.off));
    }
  });

  InteractionApi.mixin(Events);
  InteractionApi.mixin(MethodProvider);

  return InteractionApi;
});
//# sourceMappingURL=interaction.api.js.map
;
define('sdk.public/generic.public.api',['underscore'], function (_) {
  var PublicApi = function PublicApi(api) {
    if (_.isObject(api.Events)) {
      this.subscribe = function (name, func) {
        if (_.isObject(name)) {
          var callbacks = name;
          _.each(callbacks, function (func, name) {
            api.on(name, function (data) {
              func.call(callbacks, data);
            });
          });
        } else {
          api.on(name, function (data) {
            func.call(null, data);
          });
        }
      };

      this.unsubscribe = function (name, func) {
        if (_.isObject(name)) {
          var callbacks = name;
          _.each(callbacks, function (func, name) {
            api.off(name, function (data) {
              func.call(callbacks, data);
            });
          });
        } else {
          api.off(name, function (data) {
            func.call(null, data);
          });
        }
      };
    }

    if (_.isObject(api.Methods)) {
      this.registerApi = function (name, func) {
        if (_.isObject(name)) {
          var methods = name;
          api.setMethods(methods);
        } else {
          api.setMethod(name, func);
        }
      };
    }

    var apiPublicProperties = ['Events', 'Methods', _.values(api.EventTriggers), _.values(api.Apis)];
    var publicProperties = _.chain(apiPublicProperties).flatten().compact().filter(function (propertyName) {
      return !!api[propertyName];
    }).map(function (propertyName) {
      var value = void 0;
      if (_.isFunction(api[propertyName])) {
        value = function value(data) {
          var ret = api[propertyName](data);
          if (ret && _.isFunction(ret.then)) {
            return Promise.resolve(ret);
          } else {
            return ret;
          }
        };
      } else {
        value = api[propertyName];
      }
      return [propertyName, value];
    }).object().value();
    _.extend(this, publicProperties);
  };

  return PublicApi;
});
//# sourceMappingURL=generic.public.api.js.map
;
define('api/sdk/interaction/interaction.event.reason',[], function () {
  return {
    // Call events
    CallStarted: 'callStarted',
    CallAccepted: 'callAccepted',
    CallRejected: 'callRejected',
    CallEnded: 'callEnded',
    CallFinished: 'callFinished',

    // Email events
    EmailOffered: 'emailOffered',
    EmailAccepted: 'emailAccepted',
    EmailRejected: 'emailRejected',
    EmailFinished: 'emailFinished',

    // Chat events
    ChatOffered: 'chatOffered',
    ChatAccepted: 'chatAccepted',
    ChatRejected: 'emailRejected',
    ChatEnded: 'chatEnded',
    ChatFinished: 'chatFinished'
  };
});
//# sourceMappingURL=interaction.event.reason.js.map
;
define('sdk.public/crm/interaction.api/interaction.public.api',['underscore', 'sdk.public/generic.public.api', 'api/sdk/interaction/interaction.event.reason'], function (_, PublicApi, InteractionEventReason) {
  var InteractionPublicApi = function InteractionPublicApi(api) {
    PublicApi.call(this, api);

    // Override subscribe function
    this.subscribe = function (arg1, arg2) {
      if (_.isObject(arg1)) {
        var object = arg1;
        api.on(api.Events.InteractionEvent, function (params) {
          var callbackName = params.reason;
          if (_.isFunction(object[callbackName])) {
            object[callbackName].call(object, params.payload);
          } else {
            console.error(callbackName + ' is not implemented');
          }
        });
      } else {
        var eventName = arg1;
        var callback = arg2;
        api.on(api.Events.InteractionEvent, function (params) {
          if (params.reason === eventName) {
            callback(params.payload);
          }
        });
      }
    };

    // Override Events object
    this.Events = _.chain(_.values(InteractionEventReason)).map(function (event) {
      return [event, event];
    }).object().value();
  };

  return InteractionPublicApi;
});
//# sourceMappingURL=interaction.public.api.js.map
;
define('sdk.public/crm/interaction.api/interaction.api.factory',['underscore', 'msgbus/api-factory', 'msgbus/duplex-iframe-io-remote', 'sdk.public/crm/interaction.api/interaction.api', 'sdk.public/crm/interaction.api/interaction.public.api'], function (_, ApiFactory, IFrameIO, InteractionApi, PublicApi) {
  var apiFactoryOptions = {
    autoConnect: {
      timeout: 5000,
      retries: 3
    },
    throttling: {
      outgoingQueueSize: 50,
      messageRateMs: 10
    }
  };

  var interactionApis = {};

  function createInteractionApi() {
    var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

    if (!_(interactionApis[name]).isObject()) {
      var factory = new ApiFactory(new IFrameIO('intrx_plugin_' + name), apiFactoryOptions);
      var interactionApi = new InteractionApi(factory);
      interactionApis[name] = new PublicApi(interactionApi);
    }

    return interactionApis[name];
  }

  return createInteractionApi;
});
//# sourceMappingURL=interaction.api.factory.js.map
;
define('sdk.public/crm/custom.components.api/components.api',['underscore', 'simply.deferred', 'msgbus/object', 'msgbus/events', 'msgbus/method-provider'], function (_, Deferred, Object, Events, MethodProvider) {
  var Api = Object.extend({
    Events: {
      ComponentEvent: 'componentEvent'
    },

    Methods: {
      GetCustomComponents: 'getCustomComponents'
    },

    _init: function _init(apiFactory) {
      this._api = 'customComponentsApi';

      apiFactory.addMethodProvider(this);

      apiFactory.defineSimpleMethodImplementation(this, this.Methods.GetCustomComponents);

      apiFactory.defineEvent(this, this.Events.ComponentEvent);

      this._destructors.push(this.bind(this.off));
    }
  });

  Api.mixin(Events);
  Api.mixin(MethodProvider);

  return Api;
});
//# sourceMappingURL=components.api.js.map
;
define('sdk.public/crm/custom.components.api/components.public.api',['underscore', 'sdk.public/generic.public.api'], function (_, PublicApi) {
  /**
   * @class CustomComponentsApi
   */
  var ComponentsPublicApi = function ComponentsPublicApi(api) {
    PublicApi.call(this, api);
    /**
     * @function registerCustomComponents
     * @memberof CustomComponentsApi
     * @instance
     * @description Registers template for custom components and callbacks that should be executed on component events
     * refer to {@tutorial customcomponents} for template specification
     * @param {object} params
     * @param {string} params.template Markdown for custom components
     * @param {object} params.callbacks Map of functions representing callbacks defined in the custom component template.
     * These functions will be executed when corresponding UI controls are changed or clicked
     * @returns {void} 
     */
    this.registerCustomComponents = function (params) {
      if (params && params.template) {
        api.setMethod(api.Methods.GetCustomComponents, function () {
          return params.template;
        });

        if (!_.isEmpty(params.callbacks)) {
          api.on(api.Events.ComponentEvent, function (event) {
            if (_.isFunction(params.callbacks[event.callbackName])) {
              params.callbacks[event.callbackName].call(params.callbacks, event.payload);
            } else {
              console.error(event.callbackName + ' is not implemented');
            }
          });
        }
      }
    };
  };

  return ComponentsPublicApi;
});
//# sourceMappingURL=components.public.api.js.map
;
define('sdk.public/crm/custom.components.api/components.api.factory',['underscore', 'msgbus/api-factory', 'msgbus/duplex-iframe-io-remote', 'sdk.public/crm/custom.components.api/components.api', 'sdk.public/crm/custom.components.api/components.public.api'], function (_, ApiFactory, IFrameIO, Api, PublicApi) {
  var apiFactoryOptions = {
    autoConnect: {
      timeout: 5000,
      retries: 3
    },
    throttling: {
      outgoingQueueSize: 50,
      messageRateMs: 10
    }
  };

  var apis = {};

  function createApi() {
    var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

    if (!_(apis[name]).isObject()) {
      var factory = new ApiFactory(new IFrameIO('cust_comp_plugin_' + name), apiFactoryOptions);
      var api = new Api(factory);
      apis[name] = new PublicApi(api);
    }

    return apis[name];
  }

  return createApi;
});
//# sourceMappingURL=components.api.factory.js.map
;
define('sdk.public/crm/crm.api/crm.api',['underscore', 'simply.deferred', 'msgbus/object', 'msgbus/events', 'msgbus/method-provider'], function (_, Deferred, Object, Events, MethodProvider) {

  /**
    * @class CrmApi
    */

  /**
  * @typedef {Object} AdtConfig
  * @property {string} providerName  Name of the integration provider. Will be displayed on the login screen.
  * @property {boolean} myCallsTodayEnabled  Flag to define if My Calls Today button should be shown on home screen
  * @property {boolean} myChatsTodayEnabled  Flag to define if My Chats Today button should be shown on home screen
  * @property {boolean} myEmailsTodayEnabled  Flag to define if My Emails Today button should be shown on home screen
  * @property {boolean} showContactInfo Flag to define if VCC contact fields should be shown on Five9 Adapter search panel
  * per profile configuration in VCC
  * @property {string} guideLink Link to the agent guide for adapter. Points to Five9 ADT agent guide by default.
  */

  /**
  * @typedef {Object} SearchResult
  * @property {CrmObject[]} crmObjects List of found CRM objects
  * @property {CrmObject} screenPopObject CRM object that should be used for screen pop
  */

  var Api = Object.extend({

    /**
    * @function registerApi
    * @memberof CrmApi
    * @instance
    * @description Registers implementation of callbacks integrating ADT with CRM system. See example in {@tutorial basicintegration}
    * @param {CrmApiCallbacks} object with properties corresponding to callbacks you would like to implement
    * @returns {void}
    */

    EventTriggers: {
      /**
       * @function objectVisited
       * @memberof CrmApi
       * @instance
       * @description Communicate details of object visited by user in CRM system to Five9 Agent Desktop toolkit. Five9 adapter will
       * display this object in the list of objects available for saving call logs.
       * ```
       * crmApi.objectVisited({crmObject: {id: "456", label: "Case", name: "Broken microwave", isWho: false, isWhat: true}});
       * ```
       * @param {object} params
       * @param {CrmObject} params.crmObject data of visited CRM object
       * @returns {void}
       */
      CRM_OBJECT_VISITED: 'objectVisited',

      /**
       * @function click2dial
       * @memberof CrmApi
       * @instance
       * @description Communicate to Five9 adapter that user pressed phone number and wants to initiate click to dial.
       * call will be started automatically if default campaign is configured by administrator or campaign name is provided
       * in click2DialData parameter.
       * ```
       * crmApi.click2dial({click2DialData: {clickToDialNumber: "9250000111", crmObject: {id: "789", label: "Account", name: "XYZ", isWho: false, isWhat: true}}});
       * ```
       * @param {object} params
       * @param {Click2DialData} params.click2DialData data associated with click 2 dial operation
       * @returns {void}
       */
      CRM_CLICK_2_DIAL: 'click2dial',

      /**
       * @function suggestedNumbers
       * @memberof CrmApi
       * @instance
       * @description Communicate to Five9 adapter that user navigated to object with phone numbers and those numbers need to
       * be displayed in the list of suggested numbers if agent navigates to make call screen.
       * ```
       * crmApi.suggestedNumbers({suggestedNumbers: [
       *  {clickToDialNumber:"9250000111", crmObject: {id: "441", label: "Case", name: "Engine broken", isWho: false, isWhat: true}},
       *  {clickToDialNumber:"9250000112", crmObject: {id: "789", label: "Account", name: "XYZ", isWho: false, isWhat: true}},
       *  {clickToDialNumber:"9250000113", crmObject: {id: "731", label: "Contact", name: "Tim", isWho: true, isWhat: false}}]});
       * ```
       * @param {object} params objects and configuration that will be used to populate suggested numbers menu
       * @param {Click2DialData[]} params.suggestedNumbers list of objects
       * @returns {void}
       */
      CRM_SUGGESTED_NUMBERS: 'suggestedNumbers'
    },

    /**
     * @interface CrmApiCallbacks
     */

    Methods: {
      /**
       * @function bringAppToFront
       * @abstract
       * @memberof CrmApiCallbacks
       * @instance
       * @description Implement this callback to bring Five9 ADT iframe to front and make it visible
       * @returns {void}
       */
      BringAppToFront: 'bringAppToFront',

      /**
       * @function getTodayCallsCount
       * @abstract
       * @memberof CrmApiCallbacks
       * @instance
       * @description Implement this callback to populate value of today's call count tile in Five9 ADT
       * ```
       * crmApi.registerApi({
       *     getTodayCallsCount: function (params) {
       *      return Promise.resolve(77);
       *  }});
       * ```
       * @returns {Promise(number)} Promise object represents number of today's calls.
       */
      GetTodayCallsCount: 'getTodayCallsCount',

      /**
       * @function getTodayChatsCount
       * @abstract
       * @memberof CrmApiCallbacks
       * @instance
       * @description Implement this callback to populate value of today's chat count tile in Five9 ADT
       * @returns {Promise(number)} Promise object represents number of today's chats.
       */
      GetTodayChatsCount: 'getTodayChatsCount',
      /**
       * @function getTodayEmailsCount
       * @abstract
       * @memberof CrmApiCallbacks
       * @instance
       * @description Implement this callback to populate value of today's email count tile in Five9 ADT
       * @returns {Promise(number)} Promise object represents number of today's emails.
       */
      GetTodayEmailsCount: 'getTodayEmailsCount',

      /**
       * @function saveLog
       * @abstract
       * @memberof CrmApiCallbacks
       * @instance
       * @description Implement this callback to save interaction (Call, Email, Chat) log in CRM system for CRM object
       * selected in ADT and using comments entered by user in ADT. Executed when agent sets interaction disposition in Five9 Adapter.
       * @param {object} params
       * @param {InteractionType} params.interactionType Interaction type
       * @param {CallData | ChatData | EmailData} params.interactionData Interaction data
       * @param {CallLogData | ChatLogData | EmailLogData} params.interactionLogData Interaction log data
       * @returns void
       */
      SaveLog: 'saveLog',
      /**
       * @function openMyCallsToday
       * @abstract
       * @memberof CrmApiCallbacks
       * @instance
       * @description Implement this callback to open my calls today report when user clicks on 'Calls' tile in ADT.
       * @returns {void}
       */
      OpenMyCallsToday: 'openMyCallsToday',

      /**
       * @function openMyChatsToday
       * @abstract
       * @memberof CrmApiCallbacks
       * @instance
       * @description Implement this callback to open my calls today report when user clicks on 'Chats' tile in ADT.
       * @returns {void}
       */
      OpenMyChatsToday: 'openMyChatsToday',
      /**
       * @function openMyChatsToday
       * @abstract
       * @memberof CrmApiCallbacks
       * @instance
       * @description Implement this callback to open my calls today report when user clicks on 'Emails' tile in ADT.
       * @returns {void}
       */
      OpenMyEmailsToday: 'openMyEmailsToday',

      /**
       * @function screenPop
       * @abstract
       * @memberof CrmApiCallbacks
       * @instance
       * @description Implement this callback to execute screen pop to the CRM object. ADT will execute this call back
       * in case {@link SearchResult} result returned by search method contains only one object or screenPopObject attribute of {@link SearchResult} is not empty.
       * @param {object} params
       * @param {CrmObject} params.crmObject Object selected for screen pop. Can be executed either because single matching result
       * was identified during search or because agent clicked one of the multiple search results in Five9 Adapter
       * @returns {void}
       */
      ScreenPop: 'screenPop',

      /**
       * @function enableClickToDial
       * @abstract
       * @memberof CrmApiCallbacks
       * @instance
       * @description Implement this callback to enable click 2 dial capability in CRM while agent is not handling call in ADT
       * @returns {void}
       */
      EnableClickToDial: 'enableClickToDial',

      /**
       * @function disableClickToDial
       * @abstract
       * @memberof CrmApiCallbacks
       * @instance
       * @description Implement this callback to disable click 2 dial capability in CRM while agent is handling call in ADT
       * @returns {void}
       */
      DisableClickToDial: 'disableClickToDial',

      /**
       * @function search
       * @abstract
       * @memberof CrmApiCallbacks
       * @instance
       * @description Implement this callback to search for CRM objects based on phone number and Call attached variables associated
       * with call being handled in ADT
       * ```
       * crmApi.registerApi({
       *  search: function (params) {
       *           var crmObjects = [{id: "123", label: "Contact", name: "Joe", isWho: true, isWhat: false, fields:[{displayName: "Company", value: "ABC"}]}];
       *           return Promise.resolve({crmObjects: crmObjects, screenPopObject: crmObjects[0]}); 
       *       }});
       * ```
       * @param {object} params
       * @param {InteractionType} params.interactionType Interaction type
       * @param {CallData | ChatData | EmailData} params.interactionData Interaction information
       * @param {CallSearchData} params.interactionSearchData Additional data. Used only when interaction type is 'Call'
       * @returns {Promise}  Promise represents {@link SearchResult}
       */
      Search: 'search',

      /**
       * @function getAdtConfig
       * @abstract
       * @memberof CrmApiCallbacks
       * @instance
       * @description Implement this callback to configure behavior of ADT. This method is called only once when ADT establishes connection
       * with CrmSdk
       * ```
       * crmApi.registerApi({
       *   getAdtConfig: function (params) {
       *       var config = {
       *           providerName: 'Demo CRM ADT adapter',
       *           myCallsTodayEnabled: true,
       *           myChatsTodayEnabled: true,
       *           myEmailsTodayEnabled: true,
       *           showContactInfo: false
       *       };
       *       return Promise.resolve(config);
       *   }});
       * ```
       * @returns {Promise} Promise represents {@link AdtConfig}
       */
      GetAdtConfig: 'getAdtConfig'
    },

    _init: function _init(apiFactory) {
      var _this = this;

      this._api = 'crmApi';

      apiFactory.addMethodProvider(this);

      // Define methods
      _.each(this.Methods, function (method) {
        apiFactory.defineSimpleMethodImplementation(_this, method);
      });

      // Define Event triggers
      _.each(this.EventTriggers, function (name) {
        _this[name] = apiFactory.defineEventTrigger(name);
      });

      this._destructors.push(this.bind(this.off));
    }
  });

  Api.mixin(Events);
  Api.mixin(MethodProvider);

  return Api;
});
//# sourceMappingURL=crm.api.js.map
;
define('sdk.public/crm/crm.api/crm.api.factory',['underscore', 'msgbus/api-factory', 'msgbus/duplex-iframe-io-remote', 'sdk.public/crm/crm.api/crm.api', 'sdk.public/generic.public.api'], function (_, ApiFactory, IFrameIO, Api, PublicApi) {
  var apiFactoryOptions = {
    autoConnect: {
      timeout: 5000,
      retries: 3
    },
    throttling: {
      outgoingQueueSize: 50,
      messageRateMs: 10
    }
  };

  var apis = {};

  function createApi() {
    var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

    if (!_(apis[name]).isObject()) {
      var factory = new ApiFactory(new IFrameIO('crm_api_plugin_' + name), apiFactoryOptions);
      var api = new Api(factory);
      apis[name] = new PublicApi(api);
    }

    return apis[name];
  }

  return createApi;
});
//# sourceMappingURL=crm.api.factory.js.map
;
/**
 * @namespace Five9
 */
define('five9.crm.sdk',['underscore', 'sdk.public/crm/interaction.api/interaction.api.factory', 'sdk.public/crm/custom.components.api/components.api.factory', 'sdk.public/crm/crm.api/crm.api.factory'], function (_, interactionApi, customComponentsApi, crmApi) {

  _.noConflict();

  /**
   * @namespace CrmSdk
   * @memberof Five9
   */
  return {
    /**
     * @function interactionApi
     * @memberof Five9.CrmSdk
     * @instance
     * @description Use this method to obtain reference to Interaction API instance. If Five9 Plugin SDK is loaded
     *```
     * var interactionApi = window.Five9.CrmSdk.interactionApi();
     *```   
     * in multiple iframes on the same page all instances will receive events and can be used to execute methods. 
     * @returns {InteractionApi} reference to Interaction API instance 
     */
    interactionApi: interactionApi,

    /**
    * @function customComponentsApi
    * @memberof Five9.CrmSdk
    * @instance
    * @description Use this method to obtain reference to Custom Components API instance. Only one instance of Custom Components API can be used on the same page.
    * If Five9 Plugin SDK is loaded in multiple iframes on the same page the first instance of Custom Components API that establishes connection to Five9 
    * Agent Desktop Toolkit will receive events    
    *```
    * var customComponentsApi = window.Five9.CrmSdk.customComponentsApi();
    *```
    * @returns {CustomComponentsApi} reference to Custom Components API instance
    */
    customComponentsApi: customComponentsApi,

    /**
    * @function crmApi
    * @memberof Five9.CrmSdk
    * @instance
    * @description Use this method to obtain reference to CRM API instance. Only one instance of CRM API can be used on the same page.
    * If Five9 Plugin SDK is loaded in multiple iframes on the same page the first instance of CRM API that establishes connection to Five9 
    * Agent Desktop Toolkit will receive events 
    *```
    * var crmApi = window.Five9.CrmSdk.crmApi();
    *```
    * @returns {CrmApi} reference to CRM API instance 
    */
    crmApi: crmApi
  };
});
//# sourceMappingURL=five9.crm.sdk.js.map
;
  return require('five9.crm.sdk');
}));
