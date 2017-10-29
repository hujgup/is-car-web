"use strict";
exports.__esModule = true;
var electron_1 = require("electron");
var es6_promise_1 = require("es6-promise");
var Path = require("path");
var UrlImport = require("url");
var Url;
(function (Url) {
    function local(path) {
        return {
            pathname: Path.join(__dirname, path),
            protocol: "file:"
        };
    }
    Url.local = local;
    function remote(path) {
        return {
            pathname: path,
            protocol: "http:"
        };
    }
    Url.remote = remote;
})(Url || (Url = {}));
var Window;
(function (Window) {
    var specs = [];
    var windows = [];
    var activeWindows = [];
    // Mac OS doesn't close the program uless you Cmd+Q, so windows need to be restored sometimes
    electron_1.app.addListener("window-all-closed", function () {
        if (process.platform !== "darwin") {
            electron_1.app.quit();
        }
    });
    electron_1.app.addListener("activate", function () {
        if (activeWindows.length === 0) {
            specs.forEach(function (spec, i) {
                if (windows[i] === undefined) {
                    baseCreate(spec, i);
                }
            });
        }
    });
    function baseCreate(spec, id) {
        var w = new electron_1.BrowserWindow(spec);
        w.loadURL(UrlImport.format(spec.url));
        w.on("close", function () {
            activeWindows.splice(windows.indexOf(windows[id]), 1);
            windows[id] = undefined;
        });
        windows[id] = w;
        specs[id] = spec;
        activeWindows.push(w);
        return id;
    }
    function createOne(spec) {
        return new es6_promise_1.Promise(function (resolve) {
            electron_1.app.addListener("ready", function () {
                var id = baseCreate(spec, specs.length);
                if (typeof spec.awaitLoad === "undefined" || spec.awaitLoad) {
                    var w = get(id);
                    w.webContents.addListener("did-finish-load", function () { return resolve(id); });
                }
                else {
                    resolve(id);
                }
            });
        });
    }
    Window.createOne = createOne;
    function createMany(specs) {
        return specs.map(function (spec) { return createOne(spec); });
    }
    Window.createMany = createMany;
    function exists(id) {
        return windows[id] !== undefined;
    }
    Window.exists = exists;
    function get(id) {
        return windows[id];
    }
    Window.get = get;
    function getContents(id) {
        return windows[id].webContents;
    }
    Window.getContents = getContents;
    function awaitLoad(id) {
        return new es6_promise_1.Promise(function (resolve) {
            get(id).webContents.addListener("did-finish-load", function () { return resolve(); });
        });
    }
    Window.awaitLoad = awaitLoad;
    function all() {
        return activeWindows;
    }
    Window.all = all;
    function debug() {
        all().forEach(function (w) { return w.webContents.openDevTools(); });
    }
    Window.debug = debug;
})(Window || (Window = {}));
Window.createOne({
    url: Url.local("../index.html")
});
