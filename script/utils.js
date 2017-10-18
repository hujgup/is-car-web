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
            promise.call(form, event)
                .then(function (redirect) { return location.href = redirect; })["catch"](function (err) {
                if (errorHandler !== undefined) {
                    errorHandler(err);
                }
            });
            event.returnValue = false;
            return false;
        };
    }
    Utils.asyncFormSubmit = asyncFormSubmit;
    function dictionaryNotEmpty(dic) {
        return Object.keys(dic).length > 0;
    }
    Utils.dictionaryNotEmpty = dictionaryNotEmpty;
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
