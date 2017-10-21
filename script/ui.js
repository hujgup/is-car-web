"use strict";
// TODO: Interfaces for JSON data
var GlobalForm;
(function (GlobalForm) {
    var InputType;
    (function (InputType) {
        InputType[InputType["JSON"] = 0] = "JSON";
        InputType[InputType["FIELDS"] = 1] = "FIELDS";
        InputType[InputType["ERR_NONE"] = 2] = "ERR_NONE";
        InputType[InputType["ERR_MANY"] = 3] = "ERR_MANY";
    })(InputType = GlobalForm.InputType || (GlobalForm.InputType = {}));
    function getPort(f) {
        return parseInt(f.inputPort.value);
    }
    GlobalForm.getPort = getPort;
    function validatePort(port) {
        var res = undefined;
        if (isNaN(port)) {
            res = "Port number is not a number.";
        }
        else if (port % 1 !== 0) {
            res = "Port number must be an integer.";
        }
        else if (port < 8080 || port > 28080) {
            res = "Port number must be between 8080 and 28080, inclusive.";
        }
        return res;
    }
    GlobalForm.validatePort = validatePort;
    function getInputType(mode) {
        var res;
        if (mode.inputJson.checked) {
            if (mode.inputFields.checked) {
                res = InputType.ERR_MANY;
            }
            else {
                res = InputType.JSON;
            }
        }
        else if (mode.inputFields.checked) {
            res = InputType.FIELDS;
        }
        else {
            res = InputType.ERR_NONE;
        }
        return res;
    }
    GlobalForm.getInputType = getInputType;
    function setupListeners(mode, fields, json) {
        mode.inputJson.addEventListener("change", function () { return switchDisplayedForm(mode, fields, json); });
        mode.inputFields.addEventListener("change", function () { return switchDisplayedForm(mode, fields, json); });
        formSubmit(mode, mode.form, json, "constraints");
    }
    GlobalForm.setupListeners = setupListeners;
    function updateField(inKey, outEle, json) {
        outEle.value = json.inKey;
    }
    function switchDisplayedForm(mode, fields, json) {
        var inputType = getInputType(mode);
        switch (inputType) {
            case InputType.JSON:
                mode.formJson.style.display = "";
                mode.formFields.style.display = "none";
                break;
            case InputType.FIELDS:
                mode.formJson.style.display = "none";
                mode.formFields.style.display = "";
                var jsonData = JSON.parse(json.value);
                fields.gridLoad.value = jsonData.maxGridLoad;
                fields.currentCharge.value = jsonData.currentCharge;
                fields.maxCharge.value = jsonData.chargeCapacity;
                fields.chargeRate.value = jsonData.chargePerHour;
                fields.chargeDrain.value = jsonData.chargeDrainPerHour;
                Templating.killAll("ut");
                jsonData.unavailableTimes.forEach(function (ut) { return FieldsForm.templateUt(ut, json); });
                break;
            case InputType.ERR_NONE:
                alert("ERR: Radio button logic failure (none selected).");
                break;
            case InputType.ERR_MANY:
                alert("ERR: Radio button logic failure (more than one selected).");
                break;
            default:
                Utils.assertNever(inputType);
        }
    }
    GlobalForm.switchDisplayedForm = switchDisplayedForm;
})(GlobalForm || (GlobalForm = {}));
var JsonForm;
(function (JsonForm) {
    function setupListeners(mode, f, json) {
        formSubmit(mode, f.form, json, "constraints");
    }
    JsonForm.setupListeners = setupListeners;
})(JsonForm || (JsonForm = {}));
var FieldsForm;
(function (FieldsForm) {
    function getNum(inEle, callback) {
        var value = parseFloat(inEle.value);
        if (isNaN(value) || !isFinite(value)) {
            console.error(inEle.id + " not a number.");
        }
        else {
            callback(value);
        }
    }
    function change(inEle, outKey, json) {
        inEle.addEventListener("change", function () {
            getNum(inEle, function (value) {
                var jsonData = JSON.parse(json.value);
                jsonData[outKey] = value;
                json.value = JSON.stringify(jsonData, undefined, "\t");
            });
        });
    }
    function zeroPad(n) {
        var res = n.toString();
        if (res.length === 1) {
            res = "0" + res;
        }
        return res + ":00";
    }
    function rangeIndex(arr, rng) {
        var res = -1;
        arr.some(function (value, index) {
            var brk = value.lowerBound.pivot === rng.lowerBound.pivot && value.lowerBound.inclusive == rng.lowerBound.inclusive
                && value.upperBound.pivot === rng.upperBound.pivot && value.upperBound.inclusive === rng.upperBound.inclusive;
            if (brk) {
                res = index;
            }
            return brk;
        });
        return res;
    }
    function templateUt(rng, json) {
        Templating.push(Templating.getTemplate("ut"), {
            LOW: rng.lowerBound.pivot,
            LOW_BRACKET: rng.lowerBound.inclusive ? "[" : "(",
            HIGH: rng.upperBound.pivot,
            HIGH_BRACKET: rng.upperBound.inclusive ? "]" : ")"
        }, function (id, element, root, parent) {
            if (id === "remove-btn") {
                element.addEventListener("click", function () {
                    var jsonData = JSON.parse(json.value);
                    var jsonArr = jsonData.unavailableTimes;
                    jsonArr.splice(rangeIndex(jsonArr, rng), 1);
                    json.value = JSON.stringify(jsonData, undefined, "\t");
                    parent.removeChild(root);
                });
            }
        });
    }
    FieldsForm.templateUt = templateUt;
    function setupListeners(mode, f, json) {
        change(f.gridLoad, "maxGridLoad", json);
        change(f.currentCharge, "currentCharge", json);
        change(f.maxCharge, "chargeCapacity", json);
        change(f.chargeRate, "chargePerHour", json);
        change(f.chargeDrain, "chargeDrainPerHour", json);
        f.utAddButton.addEventListener("click", function () {
            getNum(f.utLowValue, function (low) { return getNum(f.utHighValue, function (high) {
                var rng = {
                    lowerBound: {
                        pivot: zeroPad(low),
                        inclusive: f.utLowInclusive.checked
                    },
                    upperBound: {
                        pivot: zeroPad(high),
                        inclusive: f.utHighInclusive.checked
                    }
                };
                var jsonData = JSON.parse(json.value);
                jsonData.unavailableTimes.push(rng);
                json.value = JSON.stringify(jsonData, undefined, "\t");
                templateUt(rng, json);
            }); });
        });
        formSubmit(mode, f.form, json, "constraints");
    }
    FieldsForm.setupListeners = setupListeners;
})(FieldsForm || (FieldsForm = {}));
function formSubmit(f, f2, json, action) {
    Utils.asyncFormSubmit(f2, function () { return new Promise(function (resolve, reject) {
        try {
            var port_1 = GlobalForm.getPort(f);
            var portErr = GlobalForm.validatePort(port_1);
            if (portErr) {
                reject(portErr);
            }
            else {
                try {
                    var req = new Ajax.Request(Ajax.Method.POST, "http://localhost:" + port_1 + "/");
                    var jsonText_1;
                    if (action === "constraints") {
                        var data = JSON.parse(json.value);
                        data.action = action;
                        jsonText_1 = JSON.stringify(data);
                    }
                    else {
                        jsonText_1 = JSON.stringify({
                            action: action
                        });
                    }
                    req.setData({
                        "json": jsonText_1
                    });
                    req.execute(function (res) {
                        if (res.status !== 0) {
                            resolve("response/?port=" + port_1 + "&status=" + res.status + "&request=" + encodeURIComponent(jsonText_1) + "&response=" + encodeURIComponent(res.text));
                        }
                        else {
                            reject("JADE was not activated, or the provided port number was incorrect.");
                        }
                    });
                }
                catch (e) {
                    if (e instanceof SyntaxError) {
                        reject("Input was not valid JSON.\n\n" + e.message);
                    }
                    else {
                        throw e;
                    }
                }
            }
        }
        catch (e) {
            reject("Unhandled exception: " + e.message);
        }
    }); }, function (err) {
        alert("Error: " + err);
    });
}
window.addEventListener("DOMContentLoaded", function () {
    var jsonForm = {
        form: document.getElementById("form-json"),
        text: document.getElementById("input-json")
    };
    var fieldsForm = {
        form: document.getElementById("form-fields"),
        gridLoad: document.getElementById("input-grid-load"),
        currentCharge: document.getElementById("input-current-charge"),
        maxCharge: document.getElementById("input-charge-capacity"),
        chargeRate: document.getElementById("input-charge-rate"),
        chargeDrain: document.getElementById("input-charge-drain"),
        utLowValue: document.getElementById("input-ut-low"),
        utLowInclusive: document.getElementById("input-ut-low-inc"),
        utHighValue: document.getElementById("input-ut-high"),
        utHighInclusive: document.getElementById("input-ut-high-inc"),
        utAddButton: document.getElementById("input-ut-add")
    };
    var globalForm = {
        form: document.getElementById("form-global"),
        inputJson: document.getElementById("mode-json"),
        inputFields: document.getElementById("mode-fields"),
        inputPort: document.getElementById("port"),
        formJson: jsonForm.form,
        formFields: fieldsForm.form
    };
    var forceForm = document.getElementById("form-force");
    Templating.setup();
    GlobalForm.setupListeners(globalForm, fieldsForm, jsonForm.text);
    JsonForm.setupListeners(globalForm, jsonForm, jsonForm.text);
    FieldsForm.setupListeners(globalForm, fieldsForm, jsonForm.text);
    formSubmit(globalForm, forceForm, jsonForm.text, "negotiate");
    GlobalForm.switchDisplayedForm(globalForm, fieldsForm, jsonForm.text);
});
