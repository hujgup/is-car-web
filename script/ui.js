"use strict";
function getJsonData(area) {
    return JSON.parse(area.value);
}
function writeJsonData(area, data) {
    area.value = JSON.stringify(data, undefined, "\t");
}
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
    function setupListeners(mode, fields, json, out) {
        mode.inputJson.addEventListener("change", function () { return switchDisplayedForm(mode, fields, json); });
        mode.inputFields.addEventListener("change", function () { return switchDisplayedForm(mode, fields, json); });
        formSubmit(mode, mode.form, json, "constraints", out);
    }
    GlobalForm.setupListeners = setupListeners;
    function updateField(inKey, outEle, json) {
        outEle.value = json[inKey];
    }
    function valueToInput(n, input, noChange) {
        if (n !== undefined) {
            input.value = (Math.round(100 * n) / 100).toString();
            noChange.checked = false;
        }
        else {
            input.value = "";
            noChange.checked = true;
        }
        input.disabled = noChange.checked;
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
                var jsonData = getJsonData(json);
                valueToInput(jsonData.maxGridLoad, fields.gridLoad, fields.gridLoadNoChange);
                valueToInput(jsonData.currentCharge, fields.currentCharge, fields.currentChargeNoChange);
                valueToInput(jsonData.chargeCapacity, fields.maxCharge, fields.maxChargeNoChange);
                valueToInput(jsonData.chargePerHour, fields.chargeRate, fields.chargeRateNoChange);
                valueToInput(jsonData.chargeDrainPerHour, fields.chargeDrain, fields.chargeDrainNoChange);
                Templating.killTemplate(fields.utTemplate);
                var utCheckedValue = jsonData.unavailableTimes === undefined;
                if (!utCheckedValue) {
                    jsonData.unavailableTimes.forEach(function (ut) { return FieldsForm.pushUtTemplate(fields.utTemplate, ut, json); });
                }
                fields.utNoChange.checked = utCheckedValue;
                fields.utLowValue.disabled = utCheckedValue;
                fields.utLowInclusive.disabled = utCheckedValue;
                fields.utHighValue.disabled = utCheckedValue;
                fields.utHighInclusive.disabled = utCheckedValue;
                fields.utAddButton.disabled = utCheckedValue;
                fields.utAddButton.disabled = utCheckedValue;
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
    function setupListeners(mode, f, json, out) {
        formSubmit(mode, f.form, json, "constraints", out);
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
    function changeValue(inEle, outKey, json) {
        getNum(inEle, function (value) {
            var jsonData = getJsonData(json);
            jsonData[outKey] = value;
            writeJsonData(json, jsonData);
        });
    }
    function change(inEle, outKey, dnc, json) {
        inEle.addEventListener("change", function () {
            if (!dnc.checked) {
                changeValue(inEle, outKey, json);
            }
        });
        dnc.addEventListener("change", function () {
            inEle.disabled = dnc.checked;
            if (dnc.checked) {
                var jsonData = getJsonData(json);
                delete jsonData[outKey];
                writeJsonData(json, jsonData);
            }
            else {
                changeValue(inEle, outKey, json);
            }
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
    function pushUtTemplate(template, rng, json) {
        Templating.pushTemplate(template, {
            LOW: rng.lowerBound.pivot,
            LOW_BRACKET: rng.lowerBound.inclusive ? "[" : "(",
            HIGH: rng.upperBound.pivot,
            HIGH_BRACKET: rng.upperBound.inclusive ? "]" : ")"
        }, function (id, element, root, parent) {
            if (id === "remove-btn") {
                element.addEventListener("click", function () {
                    var jsonData = getJsonData(json);
                    var jsonArr = jsonData.unavailableTimes;
                    jsonArr.splice(rangeIndex(jsonArr, rng), 1);
                    writeJsonData(json, jsonData);
                    parent.removeChild(root);
                });
            }
        });
    }
    FieldsForm.pushUtTemplate = pushUtTemplate;
    function utSwitchEnable(f, json) {
        f.utLowValue.disabled = f.utNoChange.checked;
        f.utLowInclusive.disabled = f.utNoChange.checked;
        f.utHighValue.disabled = f.utNoChange.checked;
        f.utHighInclusive.disabled = f.utNoChange.checked;
        f.utAddButton.disabled = f.utNoChange.checked;
        if (f.utNoChange.checked) {
            Templating.killTemplate(f.utTemplate);
            var jsonData = getJsonData(json);
            delete jsonData.unavailableTimes;
            writeJsonData(json, jsonData);
        }
        else {
            var jsonData = getJsonData(json);
            jsonData.unavailableTimes = [];
            writeJsonData(json, jsonData);
        }
    }
    function setupListeners(mode, f, json, out) {
        change(f.gridLoad, "maxGridLoad", f.gridLoadNoChange, json);
        change(f.currentCharge, "currentCharge", f.currentChargeNoChange, json);
        change(f.maxCharge, "chargeCapacity", f.maxChargeNoChange, json);
        change(f.chargeRate, "chargePerHour", f.chargeRateNoChange, json);
        change(f.chargeDrain, "chargeDrainPerHour", f.chargeDrainNoChange, json);
        f.utNoChange.addEventListener("change", function () { return utSwitchEnable(f, json); });
        f.utAddButton.addEventListener("click", function () {
            if (f.utNoChange.checked) {
                alert("Error: Cannot add an unavailable time range when the Do Not Change checkbox is checked.");
            }
            else {
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
                    var jsonData = getJsonData(json);
                    jsonData.unavailableTimes.push(rng);
                    writeJsonData(json, jsonData);
                    pushUtTemplate(f.utTemplate, rng, json);
                }); });
            }
        });
        formSubmit(mode, f.form, json, "constraints", out);
    }
    FieldsForm.setupListeners = setupListeners;
})(FieldsForm || (FieldsForm = {}));
function formSubmit(f, f2, json, action, out) {
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
                    var jsonText = void 0;
                    if (action === "constraints") {
                        var data = getJsonData(json);
                        data.action = action;
                        jsonText = JSON.stringify(data);
                    }
                    else {
                        jsonText = JSON.stringify({
                            action: action
                        });
                    }
                    req.setData({
                        "json": jsonText
                    });
                    req.execute(function (res) {
                        if (res.status !== 0) {
                            Output.renderResponse(out, port_1, res.status, res.text);
                            //resolve("response/?port=" + port + "&status=" + res.status + "&request=" + encodeURIComponent(jsonText) + "&response=" + encodeURIComponent(res.text));							
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
var Output;
(function (Output) {
    function isJsonErrorResponse(x) {
        return x.hasOwnProperty("error");
    }
    function extractHour(b, mod) {
        var res = parseInt(b.pivot.substr(0, 2));
        if (!b.inclusive) {
            res += mod;
        }
        return res;
    }
    function compressRanges(rngSet, max) {
        var res = Utils.Array.fill(false, max);
        rngSet.forEach(function (rng) {
            var low = extractHour(rng.lowerBound, 1);
            var high = extractHour(rng.upperBound, -1);
            if (high < low) {
                for (var i = low; i < max; i++) {
                    res[i] = true;
                }
                for (var i = 0; i < high; i++) {
                    res[i] = true;
                }
            }
            else {
                for (var i = low; i <= high; i++) {
                    res[i] = true;
                }
            }
        });
        return res;
    }
    function renderResponse(out, id, status, json) {
        Templating.killTemplate(out.timetableTemplate);
        var jsonRes = JSON.parse(json);
        out.raw.textContent = JSON.stringify(jsonRes, undefined, "\t");
        out.car.textContent = id.toString();
        out.status.textContent = status.toString();
        if (isJsonErrorResponse(jsonRes)) {
            out.errorHead.style.display = null;
            out.error.style.display = null;
            out.timetableContainer.style.display = "none";
            out.error.textContent = jsonRes.error;
        }
        else {
            out.errorHead.style.display = "none";
            out.error.style.display = "none";
            out.timetableContainer.style.display = null;
            var templates_1 = {};
            var times_1 = {};
            jsonRes.result.forEach(function (entry) {
                var carId = entry.id.toString();
                if (!templates_1.hasOwnProperty(carId)) {
                    var tmp = Templating.pushTemplate(out.timetableTemplate, {
                        CAR: carId
                    });
                    templates_1[carId] = new Templating.Templater(tmp);
                    times_1[carId] = [];
                }
                times_1[carId].push(entry.range);
            });
            Object.keys(templates_1).forEach(function (carId) {
                compressRanges(times_1[carId], out.timetableSize).map(function (isOn, i) {
                    templates_1[carId].pushTemplate(out.timetableSubTemplateId, {
                        CLASS: isOn ? "tt-range" : ""
                    });
                });
            });
        }
        out.inContainer.style.display = "none";
        out.outContainer.style.display = null;
    }
    Output.renderResponse = renderResponse;
    function switchDisplayedOutput(out) {
        if (out.switchModeVis.checked) {
            out.visSection.style.display = null;
            out.raw.style.display = "none";
        }
        else {
            out.visSection.style.display = "none";
            out.raw.style.display = null;
        }
    }
    function setupListeners(out) {
        out.inContainer.style.display = null;
        out.outContainer.style.display = "none";
        Utils.asyncFormSubmit(out.switchForm);
        out.switchModeVis.addEventListener("change", function () { return switchDisplayedOutput(out); });
        out.switchModeRaw.addEventListener("change", function () { return switchDisplayedOutput(out); });
        switchDisplayedOutput(out);
        out.backBtn.addEventListener("click", function () {
            out.inContainer.style.display = null;
            out.outContainer.style.display = "none";
        });
    }
    Output.setupListeners = setupListeners;
})(Output || (Output = {}));
window.addEventListener("DOMContentLoaded", function () {
    var masterTemplater = new Templating.Templater(document.body);
    var jsonForm = {
        form: document.getElementById("form-json"),
        text: document.getElementById("input-json")
    };
    var fieldsForm = {
        form: document.getElementById("form-fields"),
        gridLoad: document.getElementById("input-grid-load"),
        gridLoadNoChange: document.getElementById("input-grid-load-nc"),
        currentCharge: document.getElementById("input-current-charge"),
        currentChargeNoChange: document.getElementById("input-current-charge-nc"),
        maxCharge: document.getElementById("input-charge-capacity"),
        maxChargeNoChange: document.getElementById("input-charge-capacity-nc"),
        chargeRate: document.getElementById("input-charge-rate"),
        chargeRateNoChange: document.getElementById("input-charge-rate-nc"),
        chargeDrain: document.getElementById("input-charge-drain"),
        chargeDrainNoChange: document.getElementById("input-charge-drain-nc"),
        utLowValue: document.getElementById("input-ut-low"),
        utLowInclusive: document.getElementById("input-ut-low-inc"),
        utHighValue: document.getElementById("input-ut-high"),
        utHighInclusive: document.getElementById("input-ut-high-inc"),
        utAddButton: document.getElementById("input-ut-add"),
        utNoChange: document.getElementById("input-ut-nc"),
        utTemplate: masterTemplater.getTemplate("ut")
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
    var out = {
        inContainer: document.getElementById("sec-input"),
        outContainer: document.getElementById("sec-output"),
        visSection: document.getElementById("out-vis-sec"),
        switchForm: document.getElementById("out-switch"),
        switchModeVis: document.getElementById("out-vis"),
        switchModeRaw: document.getElementById("out-raw"),
        backBtn: document.getElementById("return-to-input"),
        raw: document.getElementById("out-var-raw"),
        car: document.getElementById("out-var-car"),
        status: document.getElementById("out-var-status"),
        errorHead: document.getElementById("out-var-error-head"),
        error: document.getElementById("out-var-error"),
        timetableContainer: document.getElementById("out-var-tt"),
        timetableTemplate: masterTemplater.getTemplate("tt-data-wrap"),
        timetableSubTemplateId: "tt-data-hours",
        timetableSize: 24
    };
    for (var i = 0; i < out.timetableSize; i++) {
        masterTemplater.pushTemplate("tt-hours", {
            N: i.toString()
        });
    }
    GlobalForm.setupListeners(globalForm, fieldsForm, jsonForm.text, out);
    JsonForm.setupListeners(globalForm, jsonForm, jsonForm.text, out);
    FieldsForm.setupListeners(globalForm, fieldsForm, jsonForm.text, out);
    formSubmit(globalForm, forceForm, jsonForm.text, "negotiate", out);
    GlobalForm.switchDisplayedForm(globalForm, fieldsForm, jsonForm.text);
    Output.setupListeners(out);
});
