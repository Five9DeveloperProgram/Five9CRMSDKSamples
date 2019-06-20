/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/assets/";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	window.sforce = window.sforce || {};
	/* global sforce */
	sforce.opencti = __webpack_require__(1);
	sforce.opencti.initialize();

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	var config = __webpack_require__(2);
	var utils = __webpack_require__(3);
	var topFrameOriginPattern = /^http[s]?:\/\/[\w-.]+(\.force\.com|\.salesforce\.com)(:\d+)?$/;

	module.exports = {
	    /**
	     * Initializes API to listen for responses from Salesforce.
	     */
	    initialize: function initialize() {
	        // Set the Salesforce frame origin and the nonce needed to call API methods.
	        var params = utils.parseUrlQueryString(location.search);
	        var sfdcIframeOrigin = params.sfdcIframeOrigin;
	        if (sfdcIframeOrigin && params.mode && topFrameOriginPattern.test(sfdcIframeOrigin) && sfdcIframeOrigin.indexOf(window.location.protocol) === 0) {
	            config.sfdcIframeOrigin = params.sfdcIframeOrigin;
	            config.mode = params.mode;
	        } else {
	            //Fatal error: Can't proceed in initialization because the page didn't initialize properly.
	            //TODO : think about providing validation utils to perform validation tasks in multiple methods
	            throw "Failed to initialize Open CTI. Ensure that it is loaded from the right frame with correct URL parameters";
	        }
	        window.addEventListener('message', utils.processPostMessage, false);
	    },

	    /**
	     * Returns in callback true if the softphone panel was successfully shown or hidden, false otherwise.
	     * If false is returned, an error message is also returned.
	     * @param {Object} args - An object holding arguments for calls to this method.
	     * @param {boolean} args.visible - true to show and false to hide the softphone container.
	     * @param {Function} args.callback - Function which will be called upon completion of this method's invocation.
	     */
	    setSoftphonePanelVisibility: function setSoftphonePanelVisibility(args) {
	        utils.validateArguments(arguments);
	        var callback = args ? args.callback : undefined;
	        utils.invokeApiCall('setSoftphonePanelVisibility', { visible: args.visible }, callback);
	    },

	    /**
	     * Returns true if the softphone panel is currently shown, false otherwise.
	     * If false is returned, an error message is also returned.
	     * @param {Object} args - An object holding arguments for calls to this method.
	     * @param {Function} args.callback - Function which will be called upon completion of this method's invocation.
	     */
	    isSoftphonePanelVisible: function isSoftphonePanelVisible(args) {
	        utils.validateArguments(arguments);
	        utils.validateCallback(args);
	        utils.invokeApiCall('isSoftphonePanelVisible', {}, args.callback);
	    },

	    /**
	     * Enum of the different screenpop types
	    */
	    SCREENPOP_TYPE: {
	        URL: "url",
	        SOBJECT: "sobject",
	        OBJECTHOME: "objecthome",
	        LIST: "list",
	        SEARCH: "search",
	        NEW_RECORD_MODAL: "newRecord",
	        FLOW: "flow"
	    },

	    /**
	     * Pops to the specified navigation type. 
	     * If false is returned, an error message is also returned.
	     * @param {Object} args - An object holding arguments for calls to this method.
	     * @param {Object} args.type - The enumerated type to screen-pop to.
	     * @param {Object} args.params - An object holding arguments depending on the type.
	     * @param {Function} args.callback - Function which will be called upon completion of this method's invocation.
	     */
	    screenPop: function screenPop(args) {
	        utils.validateArguments(arguments);
	        var callback = args ? args.callback : undefined;
	        utils.invokeApiCall('screenPop', { type: args.type, params: args.params }, callback);
	    },

	    /**
	     * Enum of the different call types for searchandscreenpop.
	     */
	    CALL_TYPE: {
	        INBOUND: "inbound",
	        OUTBOUND: "outbound",
	        INTERNAL: "internal"
	    },

	    /**
	     * Searches objects specified in the softphone layout for a given string. Returns search results and screen pops any matching records. This method respects screen pop settings defined in the softphone layout.
	     * @param {Object} args - An object holding arguments for calls to this method.
	     * @param {string} args.searchParams - The string to search for specified objects. The minimum character length is 3.
	     * @param {Object} args.callType - One of the following types: sforce.openct.INBOUND | sforce.openct.OUTBOUND | sforce.openct.INTERNAL
	     * @param {Object|String} args.queryParams - Specifies the query parameters to pass to the VisualForce URLs (when we pop to VisualForce page). Specify a string OR object. Objects are converted to strings of key/value pair and escaped before being passed.
	     * @param {Object} args.defaultFieldValues - Specifies the default field values to pass to the new entity page(when we pop to new entity page). 
	     * @param {boolean} args.deferred - The default is false. If true, this function doesn't perform screen pop but instead passes back an object which can later be passed to sforce.opencti.screenPop API as an input to perform the same operation.
	     */
	    searchAndScreenPop: function searchAndScreenPop(args) {
	        utils.validateArguments(arguments);
	        var callback = args ? args.callback : undefined;
	        utils.invokeApiCall('searchAndScreenPop', { searchParams: args.searchParams, callType: args.callType, queryParams: args.queryParams, defaultFieldValues: args.defaultFieldValues, deferred: args.deferred, params: args.params }, callback);
	    },

	    /**
	     * Returns information about the current page as a JSON string.
	     * @param {Object} args - An object holding arguments for calls to this method.
	     * @param {Function} args.callback - Function which will be called upon completion of this method's invocation.
	     */
	    getAppViewInfo: function getAppViewInfo(args) {
	        utils.validateArguments(arguments);
	        utils.validateCallback(args);
	        utils.invokeApiCall('getAppViewInfo', {}, args.callback);
	    },

	    /**
	     * Returns true and provides the new object Id in callback if the object was successfully created or updated, null otherwise.
	     * If false is returned, an error message is also returned.
	     * @param {Object} args - An object holding arguments for calls to this method.
	     * @param {Object} args.value - New object to create.
	     * @param {Function} args.callback - Function which will be called upon completion of this method's invocation.
	     */
	    saveLog: function saveLog(args) {
	        utils.validateArguments(arguments);
	        utils.validateValueObject(args);
	        var callback = args ? args.callback : undefined;
	        utils.invokeApiCall('saveLog', { object: args.value }, callback);
	    },

	    /**
	     * Refreshes the current view and returns JSON string true as part of the result if API call is successful.
	     * If API call fails, an error message is also returned.
	     * @param {Object} args - An object holding arguments for calls to this method.
	     * @param {Function} args.callback - An optional function which will be called upon completion of this method's invocation.
	     */
	    refreshView: function refreshView(args) {
	        utils.validateArguments(arguments, true);
	        var callback = args ? args.callback : undefined;
	        utils.invokeApiCall('refreshView', {}, callback);
	    },

	    /**
	     * Notifies that the adapter url has been successfully loaded.
	     */
	    notifyInitializationComplete: function notifyInitializationComplete(args) {
	        var callback = args ? args.callback : undefined;
	        utils.invokeApiCall('notifyInitializationComplete', {}, callback);
	    },

	    /**
	     * Sets the label in the softphone utility item.
	     * @param {Object} args - An object holding arguments for calls to this method.
	     * @param {string} args.label - The label to set.
	     * @param {Function} args.callback - Function which will be called upon completion of this method's invocation.
	     */
	    setSoftphoneItemLabel: function setSoftphoneItemLabel(args) {
	        utils.validateArguments(arguments);
	        var callback = args ? args.callback : undefined;
	        utils.invokeApiCall('setSoftphoneItemLabel', { label: args.label }, callback);
	    },

	    /**
	     * Sets the label in the softphone panel's header.
	     * @param {Object} args - An object holding arguments for calls to this method.
	     * @param {string} args.label - The label to set.
	     * @param {Function} args.callback - Function which will be called upon completion of this method's invocation.
	     */
	    setSoftphonePanelLabel: function setSoftphonePanelLabel(args) {
	        utils.validateArguments(arguments);
	        var callback = args ? args.callback : undefined;
	        utils.invokeApiCall('setSoftphonePanelLabel', { label: args.label }, callback);
	    },

	    /**
	     * Sets the icon in the softphone utility item.
	     * @param {Object} args - An object holding arguments for calls to this method.
	     * @param {string} args.key - The image key of the icon to display.
	     * @param {Function} args.callback - Function which will be called upon completion of this method's invocation.
	     */
	    setSoftphoneItemIcon: function setSoftphoneItemIcon(args) {
	        utils.validateArguments(arguments);
	        var callback = args ? args.callback : undefined;
	        utils.invokeApiCall('setSoftphoneItemIcon', { key: args.key }, callback);
	    },

	    /**
	     * Sets the icon in the softphone panel's header.
	     * @param {Object} args - An object holding arguments for calls to this method.
	     * @param {string} args.key - The image key of the icon to display.
	     * @param {Function} args.callback - Function which will be called upon completion of this method's invocation.
	     */
	    setSoftphonePanelIcon: function setSoftphonePanelIcon(args) {
	        utils.validateArguments(arguments);
	        var callback = args ? args.callback : undefined;
	        utils.invokeApiCall('setSoftphonePanelIcon', { key: args.key }, callback);
	    },

	    /**
	     * Sets the height of the softphone panel.
	     * @param {Object} args - An object holding arguments for calls to this method.
	     * @param {number} args.heightPX - To set the height of the softphone panel, specify the height value in pixels.
	     * @param {Function} args.callback - Function which will be called upon completion of this method's invocation.
	     */
	    setSoftphonePanelHeight: function setSoftphonePanelHeight(args) {
	        utils.validateArguments(arguments);
	        var callback = args ? args.callback : undefined;
	        utils.invokeApiCall('setSoftphonePanelHeight', { heightPX: args.heightPX }, callback);
	    },

	    /**
	     * Sets the width of the softphone panel.
	     * @param {Object} args - An object holding arguments for calls to this method.
	     * @param {number} args.widthPX - To set the width of the softphone panel, specify the width in pixels.
	     * @param {Function} args.callback - Function which will be called upon completion of this method's invocation.
	     */
	    setSoftphonePanelWidth: function setSoftphonePanelWidth(args) {
	        utils.validateArguments(arguments);
	        var callback = args ? args.callback : undefined;
	        utils.invokeApiCall('setSoftphonePanelWidth', { widthPX: args.widthPX }, callback);
	    },

	    /**
	     * Returns callCenterSettings in a JSON string as part of the results if the API call was successful.
	     * If the API call fails, an error message is also returned.
	     * @param {Object} args - An object holding arguments for calls to this method.
	     * @param {Function} args.callback - Function which will be called upon completion of this method's invocation.
	     */
	    getCallCenterSettings: function getCallCenterSettings(args) {
	        utils.validateArguments(arguments);
	        utils.validateCallback(args);
	        utils.invokeApiCall('getCallCenterSettings', {}, args.callback);
	    },

	    /**
	     * Registers a function to call when a user clicks an enabled phone number.
	     * @param {Object} args - An object holding arguments for calls to this method.
	     * @param {Function} args.listener - Function which will be called when a user clicks an enabled phone number.
	     */
	    onClickToDial: function onClickToDial(args) {
	        utils.validateArguments(arguments);
	        utils.validateListener(args);
	        utils.invokeApiCall('onClickToDial', {}, undefined, args.listener);
	    },

	    /**
	     * Returns callCenterSettings in a JSON string as part of the results if the API call was successful.
	     * If the API call fails, an error message is also returned.
	     * @param {Object} callback - An input object with the following parameter:
	     *            {Function} callback - Executes function on success and returns an error on failure.
	     */
	    enableClickToDial: function enableClickToDial(args) {
	        utils.validateArguments(arguments, true);
	        var callback = args ? args.callback : undefined;
	        utils.invokeApiCall('enableClickToDial', {}, callback);
	    },

	    /**
	     * Returns callCenterSettings in a JSON string as part of the results if the API call was successful.
	     * If the API call fails, an error message is also returned.
	     * @param {Object} args - An input object with the following parameter:
	     * @param {Function} args.callback - Executes function on success and returns an error on failure.
	     */
	    disableClickToDial: function disableClickToDial(args) {
	        utils.validateArguments(arguments, true);
	        var callback = args ? args.callback : undefined;
	        utils.invokeApiCall('disableClickToDial', {}, callback);
	    },

	    /**
	     * Returns the softphone layout in a JSON string as part of the results if the API call was successful.
	     * If the API call fails, an error message is also returned.
	     * @param {Object} args - An input object with the following parameter:
	     * @param {Function} args.callback - Executes function on success and returns an error on failure.
	     */
	    getSoftphoneLayout: function getSoftphoneLayout(args) {
	        utils.validateArguments(arguments);
	        utils.validateCallback(args);
	        utils.invokeApiCall('getSoftphoneLayout', {}, args.callback);
	    },

	    /**
	     * Registers a function to be invoked on navigation changes.
	     * @param {Object} args - An object holding arguments for calls to this method.
	     * @param {Function} args.listener - Function which will be called when navigation has changed.
	     */
	    onNavigationChange: function onNavigationChange(args) {
	        utils.validateArguments(arguments);
	        utils.validateListener(args);
	        utils.invokeApiCall('onNavigationChange', {}, undefined, args.listener);
	    },

	    /**
	     * Runs a method from an Apex class with supplied parameters.
	     * @param {Object} args - An object holding arguments for calls to this method. For this method to work, you must provide an args object containing the following: apexClass (i.e. AccountRetrieval), methodName (i.e. getAccount) and methodParams (i.e. firstName=Charles&lastName=Green).
	     * @param {Function} args.callback - An optional function which will be called upon completion of this method's invocation.
	     */
	    runApex: function runApex(args) {
	        utils.validateArguments(arguments);
	        var callback = args ? args.callback : undefined;
	        utils.invokeApiCall('runApex', {
	            apexClass: args.apexClass,
	            methodName: args.methodName,
	            methodParams: args.methodParams
	        }, callback);
	    }
	};

/***/ }),
/* 2 */
/***/ (function(module, exports) {

	'use strict';

	module.exports = {
	    API_VERSION: 43,
	    API_TYPE: 'opencti',
	    sfdcIframeOrigin: null, // will be populated in during initialization
	    mode: null // will be populated in during initialization
	};

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

	var config = __webpack_require__(2);
	var callbackManager = __webpack_require__(4);
	var listenerManager = __webpack_require__(5);

	/**
	 * Get a unique Call ID.
	 */
	var getCallId = function () {
	    //All API Calls increment this value and thus will have a unique ID
	    var callId = 0;
	    return function () {
	        return callId++;
	    };
	}();

	/**
	 * Process messages received from Salesforce by executing callbacks, if any.
	 * The event.data object contains the following fields:
	 * {
	 *  apiVersion {Integer} - The version of API.
	 *  apiType {String} - The type of API.
	 *  methodName {String} - The name of the API method to be invoked.
	 *  callId {Integer} - A unique ID for this window and API call.
	 *  response - {Object}
	 *      success - Boolean value indicating if the API executed correctly.
	 *      returnValue - Any return value.
	 *      errors - Any error if present.
	 * }
	 */
	var processPostMessage = function processPostMessage(event) {
	    var eventData = event.data;
	    if (eventData && eventData.apiVersion === config.API_VERSION && eventData.apiType === config.API_TYPE && event.origin === config.sfdcIframeOrigin) {
	        // execute callbacks and listeners registered for the method called
	        callbackManager.executeCallback(eventData.methodName, eventData.callId, eventData.response);
	        listenerManager.executeListeners(eventData.methodName, eventData.response);
	    }
	};

	/**
	 * TODO: Replace this with a more robust implementation.
	 * Utility method to create a query string object.
	 * @param  {String} queryString - Represents the location.search value or any GET (key/value) pair string in the URL.
	 * @return {Object} - JSON of the key/value pairs in the given string of GET values in the URL.
	 */
	var parseUrlQueryString = function parseUrlQueryString(queryString) {
	    var params = {};
	    if (typeof queryString !== 'string') {
	        return params;
	    }

	    if (queryString.charAt(0) === '?') {
	        queryString = queryString.slice(1);
	    }

	    if (queryString.length === 0) {
	        return params;
	    }

	    var pairs = queryString.split('&');
	    for (var i = 0; i < pairs.length; i++) {
	        var pair = pairs[i].split('=');
	        if (pair[0]) {
	            // Pre-emptive gaurd agains bad URLS which have no key "&=1234"
	            if (params[pair[0]]) {
	                //encountered a multi value input GET
	                if (_typeof(params[pair[0]]) === 'object') {
	                    //already created an array.. push to it
	                    params[pair[0]].push(pair[1] ? decodeURIComponent(pair[1]) : null);
	                } else {
	                    // create new array and push to it.
	                    var tmp = params[pair[0]];
	                    params[pair[0]] = [];
	                    params[pair[0]].push(tmp);
	                    params[pair[0]].push(pair[1] ? decodeURIComponent(pair[1]) : null);
	                }
	            } else {
	                params[pair[0]] = pair[1] ? decodeURIComponent(pair[1]) : null;
	            }
	        }
	    }

	    return params;
	};

	/**
	 * Makes an API call to the Salesforce domain in the top window.
	 * @param  {String}   methodName - Represents the name of the API method being invoked.
	 * @param  {Object}   args       - Represents the data to be sent for the API to function.
	 * @param  {Function} callback   [optional]   - The callback to be called after the API returns a value (success or failure).
	 */
	var invokeApiCall = function invokeApiCall(methodName, args, callback, listener) {

	    /**
	     * Post message object.
	     *
	     * API methods should have a unique ID in case they are called multiple times in an asynchronous manner.
	     * This helps differentiate between calls and also calculating performance for each of the calls.
	     * {
	     *  apiVersion {Integer} - The version of API.
	     *  apiType {String} - The type of API.
	     *  methodName {String} - The name of the API method to be invoked.
	     *  callId {Integer} - A unique ID for this window and API call.
	     *  isListenerRegistered {Boolean} - Indicates if a listener was registered.
	     *  isCallbackRegistered {Boolean} - Indicates if the user supplied a callback
	     *  args {Object} - Depends on the API type. Holds all the information passed for that API to function.
	     * }
	     */
	    var params = {
	        methodName: methodName,
	        callId: getCallId(),
	        apiVersion: config.API_VERSION,
	        apiType: config.API_TYPE,
	        isCallbackRegistered: false,
	        isListenerRegistered: false,
	        args: args
	    };

	    if (typeof callback === 'function') {
	        callbackManager.registerCallback(params.methodName, params.callId, callback);
	        params.isCallbackRegistered = true;
	    }

	    if (typeof listener === 'function') {
	        listenerManager.registerListener(params.methodName, listener);
	        params.isListenerRegistered = true;
	    }

	    parent.postMessage(params, config.sfdcIframeOrigin);
	};

	/**
	 * Validates the callback argument in args.
	 */
	var validateCallback = function validateCallback(args) {
	    if (!(args && typeof args.callback === 'function')) {
	        throw new Error("Missing the required argument `callback`!");
	    }
	};

	/**
	 * Validates the listener argument in args.
	 */
	var validateListener = function validateListener(args) {
	    if (!(args && typeof args.listener === 'function')) {
	        throw new Error("Missing the required argument `listener`!");
	    }
	};

	/**
	 * TODO: Shouldn't this be handled by opencti:openCtiApiHandler?
	 * Validates the value argument in args for saveLog API.
	 */
	var validateValueObject = function validateValueObject(args) {
	    if (!(args && _typeof(args.value) === 'object')) {
	        throw new Error("Missing the required argument `value object`!");
	    }
	};

	/**
	 * Validates the input arguments to ensure there is only one argument passed in which is of type object if isOptional is false or isOptional is true but args.length > 0.
	 */
	var validateArguments = function validateArguments(args, isOptional) {
	    if (isOptional && args.length || !isOptional) {
	        if (!(args.length === 1 && _typeof(args[0]) === 'object' && Object.keys(args[0]).length)) {
	            throw new Error("Must pass in only one object which holds arguments to this API method call.");
	        }
	    }
	};

	module.exports = {
	    processPostMessage: processPostMessage,
	    parseUrlQueryString: parseUrlQueryString,
	    invokeApiCall: invokeApiCall,
	    validateCallback: validateCallback,
	    validateListener: validateListener,
	    validateValueObject: validateValueObject,
	    validateArguments: validateArguments
	};

/***/ }),
/* 4 */
/***/ (function(module, exports) {

	'use strict';

	// Key => Value | [methodName_callId] => callbackFunctionReference

	var callbacksMap = {};
	var getKey = function getKey(methodName, callId) {
	    return methodName + "_" + callId;
	};

	module.exports = {
	    /**
	     * Registers the callback so that it can be called after a response is received from the top window.
	     * @param  {String}   methodName - Represents the name of the API method being invoked. Use one of the CONSTANTS.
	     * @param  {Integer}  callId     - Represents a unique integer ID to be associated with the method call. Use getCallId() to generate this.
	     * @param  {Function} callback   - The function to be called.
	     */
	    registerCallback: function registerCallback(methodName, callId, callback) {
	        callbacksMap[getKey(methodName, callId)] = callback;
	    },

	    /**
	     * Executes the callback for the given method call ID and deletes it from the map after its executed.
	     * @param  {String} methodName - Represents the name of the API method being invoked. Use one of the CONSTANTS.
	     * @param  {Integer} callId    - Represents a unique integer ID to be associated with the method call. Use getCallId() to generate this.
	     * @param  {Object} data       - The data to be passed to the callback function.
	     */
	    executeCallback: function executeCallback(methodName, callId, data) {
	        var key = getKey(methodName, callId);
	        if (callbacksMap[key]) {
	            callbacksMap[key].call(null, data);
	            delete callbacksMap[key];
	        }
	    }
	};

/***/ }),
/* 5 */
/***/ (function(module, exports) {

	'use strict';

	// Contains a list listeners (key-> method name_uniqueId, value -> listener methods)

	var listenersMap = {};

	module.exports = {
	    /**
	     * Registers the listener for the API method to be called when a value is returned from the top window.
	     * @param  {String}   methodName - Represents the name of the API method being invoked.
	     * @param  {Function} listener   - The function to be called whenever the API "methodName" returns a value.
	     */
	    registerListener: function registerListener(methodName, listener) {
	        if (listenersMap[methodName]) {
	            listenersMap[methodName].push(listener);
	        } else {
	            listenersMap[methodName] = [listener];
	        }
	    },

	    /**
	     * Executes the registered.
	     * @param  {[type]} methodName the api method name to be executed
	     * @param  {[type]} data       the arguments to be passed to callback
	     */
	    executeListeners: function executeListeners(methodName, data) {
	        var listeners = listenersMap[methodName];
	        if (listeners) {
	            listeners.forEach(function (listener) {
	                listener.call(null, data);
	            });
	        }
	    }
	};

/***/ })
/******/ ]);