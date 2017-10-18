"use strict";
var Ajax;
(function (Ajax) {
    var Method;
    (function (Method) {
        Method["OPTIONS"] = "OPTIONS";
        Method["GET"] = "GET";
        Method["HEAD"] = "HEAD";
        Method["POST"] = "POST";
        Method["PUT"] = "PUT";
        Method["DELETE"] = "DELETE";
        Method["TRACE"] = "TRACE";
        Method["CONNECT"] = "CONNECT";
    })(Method = Ajax.Method || (Ajax.Method = {}));
    var Header;
    (function (Header) {
        Header["ACCEPT"] = "Accept";
        Header["ACCEPT_LANGUAGE"] = "Accept-Language";
        Header["AUTHORIZATION"] = "Authorization";
        Header["CACHE_CONTROL"] = "Cache-Control";
        Header["CONTENT_TYPE"] = "Content-Type";
        Header["FROM"] = "From";
        Header["IF_MATCH"] = "If-Match";
        Header["IF_MODIFIED_SINCE"] = "If-Modified-Since";
        Header["IF_NONE_MATCH"] = "If-None-Match";
        Header["IF_RANGE"] = "If-Range";
        Header["IF_UNMOFIFIED_SINCE"] = "If-Unmodified-Since";
        Header["MAX_FORWARDS"] = "Max-Forwards";
        Header["PRAGMA"] = "Pragma";
        Header["RANGE"] = "Range";
        Header["WARNING"] = "Warning";
    })(Header = Ajax.Header || (Ajax.Header = {}));
    function makeResponse(req) {
        var res;
        if (typeof req === "undefined") {
            res = {
                error: true,
                status: 0,
                text: "",
                type: "text/plain"
            };
        }
        else {
            res = {
                error: req.status >= 400 || req.status === 0,
                status: req.status,
                text: req.responseText,
                type: req.responseType,
                xml: req.responseXML !== null ? req.responseXML : undefined,
                json: req.responseType === "application/json" ? JSON.parse(req.responseText) : undefined
            };
        }
        return res;
    }
    function responseIsSuccess(x) {
        return !x.error && typeof x.text !== "undefined";
    }
    Ajax.responseIsSuccess = responseIsSuccess;
    var MAX_THREADS = 16;
    var queue = [];
    var threads = 0;
    setInterval(function () {
        var _loop_1 = function () {
            threads++;
            var item = queue.shift();
            item.request.execute(function (res) {
                threads--;
                item.callback(res);
            }, item.mime);
        };
        while (queue.length > 0 && threads < MAX_THREADS) {
            _loop_1();
        }
    }, 16);
    var Request = (function () {
        function Request(method, url) {
            this.headers = {};
            this.data = {};
            this.method = method;
            this.url = url;
        }
        Request.prototype.encodeData = function (appendTo) {
            var preExisting = typeof appendTo === "string";
            appendTo = preExisting ? appendTo : "";
            var append = "";
            if (preExisting) {
                append += appendTo.indexOf("?") >= 0 ? "&" : "?";
            }
            for (var key in this.data) {
                if (this.data.hasOwnProperty(key)) {
                    append += encodeURIComponent(key);
                    append += "=";
                    append += encodeURIComponent(this.data[key]);
                    append += "&";
                }
            }
            append = append.substr(0, append.length - 1);
            appendTo += append;
            return appendTo;
        };
        Request.prototype.getMethod = function () {
            return this.method;
        };
        Request.prototype.getUrl = function () {
            return this.url;
        };
        Request.prototype.getData = function () {
            return this.data;
        };
        Request.prototype.setData = function (data) {
            this.data = data;
        };
        Request.prototype.hasHeader = function (key) {
            return this.headers.hasOwnProperty(key);
        };
        Request.prototype.getHeader = function (key) {
            return this.hasHeader(key) ? this.headers[key] : undefined;
        };
        Request.prototype.setHeader = function (key, value) {
            this.headers[key] = value;
        };
        Request.prototype.unsetHeader = function (key) {
            if (this.hasHeader(key)) {
                delete this.headers[key];
            }
        };
        Request.prototype.queue = function (callback, mime) {
            queue.push({
                request: this,
                callback: callback,
                mime: mime
            });
        };
        Request.prototype.execute = function (callback, mime) {
            var hasMime = typeof mime === "string";
            var isPost = this.method === Method.POST;
            var hasData = Utils.dictionaryNotEmpty(this.data);
            var url = this.url;
            if (hasData && !isPost) {
                url = this.encodeData(url);
            }
            var req = new XMLHttpRequest();
            req.open(this.method, url, true);
            if (isPost) {
                req.setRequestHeader(Header.CONTENT_TYPE, "application/x-www-form-urlencoded");
            }
            for (var key in this.headers) {
                if (this.headers.hasOwnProperty(key)) {
                    req.setRequestHeader(key, this.headers[key]);
                }
            }
            req.onreadystatechange = function () {
                if (req.readyState === 4) {
                    callback(makeResponse(req));
                }
            };
            req.onabort = function () {
                callback(makeResponse());
            };
            if (hasMime) {
                req.overrideMimeType(mime);
            }
            if (hasData && isPost) {
                req.send(this.encodeData());
            }
            else {
                req.send();
            }
        };
        return Request;
    }());
    Ajax.Request = Request;
})(Ajax || (Ajax = {}));
