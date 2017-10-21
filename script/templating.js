"use strict";
var Templating;
(function (Templating) {
    var templates = {};
    function getIds() {
        return Object.keys(templates);
    }
    Templating.getIds = getIds;
    function getTemplate(tid) {
        return templates[tid];
    }
    Templating.getTemplate = getTemplate;
    function killAll(tid) {
        var t = getTemplate(tid);
        if (typeof t !== "undefined") {
            var parent_1 = t.source.parentElement;
            var toRemove = [];
            var child = void 0;
            for (var i = 0; i < parent_1.children.length; i++) {
                child = parent_1.children[i];
                if (child.hasAttribute("data-template-clone")) {
                    toRemove.push(child);
                }
            }
            toRemove.forEach(function (child) { return parent_1.removeChild(child); });
        }
    }
    Templating.killAll = killAll;
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
    function resolveArgs(node, args, root, parent, callback) {
        switch (node.nodeType) {
            case Node.ELEMENT_NODE:
                var hasCallback = false;
                var attr = void 0;
                for (var i = 0; i < node.attributes.length; i++) {
                    attr = node.attributes.item(i);
                    attr.value = argReplace(attr.value, args);
                    hasCallback = hasCallback || attr.name === "data-template-callback";
                }
                for (var i = 0; i < node.childNodes.length; i++) {
                    resolveArgs(node.childNodes[i], args, root, parent, callback);
                }
                if (hasCallback && typeof callback !== "undefined") {
                    callback(node.attributes.getNamedItem("data-template-callback").value, node, root, parent);
                }
                break;
            case Node.TEXT_NODE:
                node.textContent = argReplace(node.textContent, args);
                break;
        }
    }
    function push(template, args, callback) {
        var newEle = template.source.cloneNode(true);
        newEle.style.display = template.display;
        newEle.setAttribute("data-template-clone", "");
        var parent = template.source.parentElement;
        resolveArgs(newEle, argsToRegex(args), newEle, parent, callback);
        parent.appendChild(newEle);
        return newEle;
    }
    Templating.push = push;
    function setup() {
        var elements = document.querySelectorAll("[data-template]");
        var element;
        var tid;
        for (var i = 0; i < elements.length; i++) {
            element = elements[i];
            tid = element.getAttribute("data-template");
            if (templates.hasOwnProperty(tid)) {
                console.error("Templater: Duplicate template ID \"" + tid + "\".");
            }
            else {
                element.removeAttribute("data-template");
                templates[tid] = {
                    source: element,
                    display: element.style.display
                };
                element.style.display = "none";
            }
        }
    }
    Templating.setup = setup;
})(Templating || (Templating = {}));