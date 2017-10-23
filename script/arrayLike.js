"use strict";
var ArrayLike;
(function (ArrayLike) {
    ;
    function isArrayLike(arr) {
        return Array.isArray(arr) || typeof arr.length === "number";
    }
    ArrayLike.isArrayLike = isArrayLike;
    function toArray(arr) {
        return slice(arr);
    }
    ArrayLike.toArray = toArray;
    // This is mainly to get things like HTMLElement.prototype.children to spit out HTMLElements as items
    function cast(arr) {
        return arr;
    }
    ArrayLike.cast = cast;
    function every(arr, callback, thisArg) {
        return Array.prototype.every.call(arr, callback, thisArg);
    }
    ArrayLike.every = every;
    function some(arr, callback, thisArg) {
        return Array.prototype.some.call(arr, callback, thisArg);
    }
    ArrayLike.some = some;
    function forEach(arr, callback, thisArg) {
        return Array.prototype.forEach.call(arr, callback, thisArg);
    }
    ArrayLike.forEach = forEach;
    function reduce(arr, callback, initialValue) {
        return Array.prototype.reduce.call(arr, callback, initialValue);
    }
    ArrayLike.reduce = reduce;
    function reduceRight(arr, callback, initialValue) {
        return Array.prototype.reduceRight.call(arr, callback, initialValue);
    }
    ArrayLike.reduceRight = reduceRight;
    function map(arr, callback, thisArg) {
        return Array.prototype.map.call(arr, callback, thisArg);
    }
    ArrayLike.map = map;
    function filter(arr, callback, thisArg) {
        return Array.prototype.filter.call(arr, callback, thisArg);
    }
    ArrayLike.filter = filter;
    function concat(arr) {
        var arrs = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            arrs[_i - 1] = arguments[_i];
        }
        return Array.prototype.concat.apply(toArray(arr), map(arrs, function (value) {
            return isArrayLike(value) ? toArray(value) : value;
        }));
    }
    ArrayLike.concat = concat;
    function indexOf(arr, item, fromIndex) {
        return Array.prototype.indexOf.call(arr, item, fromIndex);
    }
    ArrayLike.indexOf = indexOf;
    function lastIndexOf(arr, item, fromIndex) {
        return Array.prototype.lastIndexOf.call(arr, item, fromIndex);
    }
    ArrayLike.lastIndexOf = lastIndexOf;
    function join(arr, separator) {
        return Array.prototype.join.call(arr, separator);
    }
    ArrayLike.join = join;
    // API difference: Does not reverse in-place
    function reverse(arr) {
        return Array.prototype.reverse.call(toArray(arr));
    }
    ArrayLike.reverse = reverse;
    function slice(arr, start, end) {
        return Array.prototype.slice.call(arr, start, end);
    }
    ArrayLike.slice = slice;
    // API difference: Does not sort in-place
    function sort(arr, comparer) {
        return Array.prototype.sort.call(toArray(arr), comparer);
    }
    ArrayLike.sort = sort;
    function toString(arr) {
        return Array.prototype.toString.call(arr);
    }
    ArrayLike.toString = toString;
    function toLocaleString(arr) {
        return Array.prototype.toLocaleString.call(arr);
    }
    ArrayLike.toLocaleString = toLocaleString;
})(ArrayLike || (ArrayLike = {}));
