"use strict";
var Templating;
(function (Templating) {
    function killTemplate(template) {
        var parent = template.source.parentElement;
        ArrayLike.reduce(ArrayLike.cast(parent.children), function (toRemove, child) {
            if (child.hasAttribute("data-template-clone")) {
                toRemove.push(child);
            }
            return toRemove;
        }, []).forEach(function (child) { return parent.removeChild(child); });
    }
    Templating.killTemplate = killTemplate;
    function replace(str, replacer) {
        return str.replace(replacer.regex, replacer.replacement);
    }
    var validIdRegex = /^[a-z0-9 \-_]+$/i;
    function argsToRegex(args) {
        var res = [];
        Utils.dictionaryForEach(args, function (value, key) {
            if (validIdRegex.test(key)) {
                res.push({
                    regex: new RegExp("%" + Utils.regexEscape(key) + "%", "gi"),
                    replacement: value
                });
            }
            else {
                console.error("Template arg key \"" + key + "\" is invalid: failed regex test " + validIdRegex.source);
            }
        });
        return res;
    }
    function argReplace(str, args) {
        return args.reduce(function (prevStr, currRegex) { return replace(prevStr, currRegex); }, str);
    }
    function pushTemplate(template, args, callback) {
        console.log(template);
        var newEle = template.source.cloneNode(true);
        newEle.style.display = template.display;
        newEle.setAttribute("data-template-clone", "");
        var parent = template.source.parentElement;
        var args2 = argsToRegex(args);
        var tParent = null;
        Utils.domIterate(newEle, {
            open: function (node) {
                switch (node.nodeType) {
                    case Node.ELEMENT_NODE:
                        var node2 = node;
                        ArrayLike.forEach(node2.attributes, function (attr) {
                            attr.value = argReplace(attr.value, args2);
                        });
                        if (tParent === null) {
                            if (node2.hasAttribute("data-template")) {
                                tParent = node;
                            }
                        }
                        if (tParent === null) {
                            if (node2.hasAttribute("data-template-style")) {
                                var style = node2.getAttribute("style");
                                style = style || "";
                                style += node2.getAttribute("data-template-style");
                                node2.setAttribute("style", style);
                                node2.removeAttribute("data-template-style");
                            }
                            if (typeof callback !== "undefined" && node2.hasAttribute("data-template-callback")) {
                                var id = node2.getAttribute("data-template-callback");
                                node2.removeAttribute("data-template-callback");
                                callback(id, node2, newEle, parent);
                            }
                        }
                        break;
                    case Node.TEXT_NODE:
                        node.textContent = argReplace(node.textContent, args2);
                        break;
                }
                return false;
            },
            close: function (node) {
                if (node === tParent) {
                    tParent = null;
                }
            }
        }, true, Node.ELEMENT_NODE, Node.TEXT_NODE);
        parent.appendChild(newEle);
        return newEle;
    }
    Templating.pushTemplate = pushTemplate;
    var Templater = (function () {
        function Templater(root, includeSelf) {
            if (includeSelf === void 0) { includeSelf = false; }
            var templates;
            if (includeSelf && root.hasAttribute("data-template")) {
                templates = [root];
            }
            else {
                var potential = root.querySelectorAll("[data-template]");
                templates = ArrayLike.filter(potential, function (p) { return !Utils.hasParentWithAttribute(p, "data-template"); });
            }
            this.templates = templates.reduce(function (obj, curr) {
                var name = curr.getAttribute("data-template");
                if (obj.hasOwnProperty(name)) {
                    console.error("Templater: Duplicate template ID \"" + name + "\".");
                }
                else {
                    curr.removeAttribute("data-template");
                    obj[name] = {
                        source: curr,
                        display: curr.style.display
                    };
                    curr.style.display = "none";
                }
                return obj;
            }, {});
        }
        Templater.prototype.getCount = function () {
            return this.getIds().length;
        };
        Templater.prototype.getIds = function () {
            return Object.keys(this.templates);
        };
        Templater.prototype.getTemplate = function (tid) {
            return this.templates[tid];
        };
        Templater.prototype.killTemplate = function (tid) {
            var tmp = this.getTemplate(tid);
            if (typeof tmp !== "undefined") {
                killTemplate(tmp);
            }
        };
        Templater.prototype.pushTemplate = function (tid, args, callback) {
            var tmp = this.getTemplate(tid);
            var res;
            if (typeof tmp !== "undefined") {
                res = pushTemplate(tmp, args, callback);
            }
            return res;
        };
        return Templater;
    }());
    Templating.Templater = Templater;
})(Templating || (Templating = {}));
