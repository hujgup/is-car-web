"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Utils;
(function (Utils) {
    function domIterate(root, callback, includeRoot) {
        if (includeRoot === void 0) { includeRoot = true; }
        var nodeTypes = [];
        for (var _i = 3; _i < arguments.length; _i++) {
            nodeTypes[_i - 3] = arguments[_i];
        }
        var skipChildren = false;
        if (includeRoot && callback.open) {
            skipChildren = callback.open(root);
        }
        if (!skipChildren) {
            var allNodeTypes_1 = nodeTypes.length === 0;
            ArrayLike.forEach(root.childNodes, function (child) {
                if (allNodeTypes_1 || nodeTypes.indexOf(child.nodeType) >= 0) {
                    domIterate.apply(undefined, [child, callback, true].concat(nodeTypes));
                }
            });
        }
        if (includeRoot && callback.close) {
            callback.close(root);
        }
    }
    Utils.domIterate = domIterate;
    function hasParentWithAttribute(element, attrName) {
        var res = false;
        while (!res && element.parentElement !== null) {
            element = element.parentElement;
            if (element.hasAttribute(attrName)) {
                res = true;
            }
        }
        return res;
    }
    Utils.hasParentWithAttribute = hasParentWithAttribute;
    function assertNever(x) {
        throw new Error("Value should never be possible.");
    }
    Utils.assertNever = assertNever;
    function expandJsonString(json) {
        return JSON.stringify(JSON.parse(json), null, "\t");
    }
    Utils.expandJsonString = expandJsonString;
    var queryObj;
    function query() {
        if (typeof queryObj === "undefined") {
            var queryStr = location.search.substr(1).split("&");
            queryObj = {};
            queryStr.forEach(function (kvp) {
                var kvp2 = kvp.split("=", 2);
                queryObj[decodeURIComponent(kvp2[0])] = decodeURIComponent(kvp2[1]);
            });
        }
        return queryObj;
    }
    Utils.query = query;
    function asyncFormSubmit(form, promise, errorHandler) {
        form.onsubmit = function (event) {
            if (promise) {
                promise.call(form, event)
                    .then(function (redirect) { return location.href = redirect; })["catch"](function (err) {
                    if (errorHandler !== undefined) {
                        errorHandler(err);
                    }
                });
            }
            event.returnValue = false;
            return false;
        };
    }
    Utils.asyncFormSubmit = asyncFormSubmit;
    function regexEscape(str) {
        // Credit to https://stackoverflow.com/a/3561711
        return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    }
    Utils.regexEscape = regexEscape;
    function dictionaryNotEmpty(dic) {
        return Object.keys(dic).length > 0;
    }
    Utils.dictionaryNotEmpty = dictionaryNotEmpty;
    function dictionaryForEach(dic, callback) {
        for (var key in dic) {
            if (dic.hasOwnProperty(key)) {
                callback(dic[key], key, dic);
            }
        }
    }
    Utils.dictionaryForEach = dictionaryForEach;
    var Comparison;
    (function (Comparison) {
        function makeBound(value, inclusive) {
            if (inclusive === void 0) { inclusive = false; }
            return {
                value: value,
                inclusive: inclusive
            };
        }
        Comparison.makeBound = makeBound;
        function makeRange(low, high) {
            return {
                low: low,
                high: high
            };
        }
        Comparison.makeRange = makeRange;
    })(Comparison = Utils.Comparison || (Utils.Comparison = {}));
    var Array;
    (function (Array) {
        function fill(value, size) {
            var res = [];
            for (var i = 0; i < size; i++) {
                res.push(value);
            }
            return res;
        }
        Array.fill = fill;
    })(Array = Utils.Array || (Utils.Array = {}));
    var Random = (function () {
        function Random() {
        }
        Random.prototype.next = function (min, max) {
            if (min === void 0) { min = 0; }
            if (max === void 0) { max = 1; }
            return this.nextImp(min, max);
        };
        Random.prototype.nextInt = function (min, max) {
            return Math.floor(this.nextImp(min, max));
        };
        Random.Standard = new (function (_super) {
            __extends(class_1, _super);
            function class_1() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            class_1.prototype.nextImp = function (min, max) {
                return Math.random() * (max - min) + min;
            };
            return class_1;
        }(Random));
        return Random;
    }());
    Utils.Random = Random;
    var SeededRandom = (function (_super) {
        __extends(SeededRandom, _super);
        function SeededRandom(seed) {
            var _this = _super.call(this) || this;
            _this.updateSeed(seed);
            return _this;
        }
        SeededRandom.prototype.updateSeed = function (seed) {
            this.seed = seed;
        };
        SeededRandom.prototype.getSeed = function () {
            return this.seed;
        };
        return SeededRandom;
    }(Random));
    Utils.SeededRandom = SeededRandom;
})(Utils || (Utils = {}));
