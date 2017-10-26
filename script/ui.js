"use strict";
function getJsonData(area) {
    return JSON.parse(area.value);
}
function writeJsonData(area, data) {
    area.value = Utils.formatJson(data);
}
var Input;
(function (Input) {
    var Global;
    (function (Global) {
        function getPort(f) {
            return parseInt(f.inputPort.value);
        }
        Global.getPort = getPort;
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
        Global.validatePort = validatePort;
        function setupListeners(mode, fields, json, out) {
            mode.inputJson.addEventListener("change", function () { return switchDisplayedForm(mode, fields, json); });
            mode.inputFields.addEventListener("change", function () { return switchDisplayedForm(mode, fields, json); });
            formSubmit(mode, mode.form, json, "constraints", out);
        }
        Global.setupListeners = setupListeners;
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
            if (mode.inputJson.checked) {
                mode.formJson.style.display = "";
                mode.formFields.style.display = "none";
            }
            else {
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
                    jsonData.unavailableTimes.forEach(function (ut) { return Fields.pushUtTemplate(fields.utTemplate, ut, json); });
                }
                fields.utNoChange.checked = utCheckedValue;
                fields.utLowValue.disabled = utCheckedValue;
                fields.utLowInclusive.disabled = utCheckedValue;
                fields.utHighValue.disabled = utCheckedValue;
                fields.utHighInclusive.disabled = utCheckedValue;
                fields.utAddButton.disabled = utCheckedValue;
                fields.utAddButton.disabled = utCheckedValue;
            }
        }
        Global.switchDisplayedForm = switchDisplayedForm;
    })(Global = Input.Global || (Input.Global = {}));
    var Json;
    (function (Json) {
        function setupListeners(mode, f, json, out) {
            formSubmit(mode, f.form, json, "constraints", out);
        }
        Json.setupListeners = setupListeners;
    })(Json = Input.Json || (Input.Json = {}));
    var Fields;
    (function (Fields) {
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
                var brk = value.lowerBound.value === rng.lowerBound.value && value.lowerBound.inclusive == rng.lowerBound.inclusive
                    && value.upperBound.value === rng.upperBound.value && value.upperBound.inclusive === rng.upperBound.inclusive;
                if (brk) {
                    res = index;
                }
                return brk;
            });
            return res;
        }
        function pushUtTemplate(template, rng, json) {
            Templating.pushTemplate(template, {
                LOW: rng.lowerBound.value,
                LOW_BRACKET: rng.lowerBound.inclusive ? "[" : "(",
                HIGH: rng.upperBound.value,
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
        Fields.pushUtTemplate = pushUtTemplate;
        function utSwitchEnable(f, json) {
            f.utLowValue.disabled = f.utNoChange.checked;
            f.utLowInclusive.disabled = f.utNoChange.checked;
            f.utHighValue.disabled = f.utNoChange.checked;
            f.utHighInclusive.disabled = f.utNoChange.checked;
            f.utAddButton.disabled = f.utNoChange.checked;
            var jsonData = getJsonData(json);
            if (f.utNoChange.checked) {
                Templating.killTemplate(f.utTemplate);
                delete jsonData.unavailableTimes;
                writeJsonData(json, jsonData);
            }
            else {
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
                                value: zeroPad(low),
                                inclusive: f.utLowInclusive.checked
                            },
                            upperBound: {
                                value: zeroPad(high),
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
        Fields.setupListeners = setupListeners;
    })(Fields = Input.Fields || (Input.Fields = {}));
})(Input || (Input = {}));
function switchButtonDisabled(btns, disabled) {
    ArrayLike.forEach(btns, function (x) {
        if (typeof x === "function") {
            switchButtonDisabled(x(), disabled);
        }
        else {
            x.disabled = disabled;
        }
    });
}
function formSubmit(f, f2, json, action, out) {
    Utils.asyncFormSubmit(f2, function () { return new Promise(function (resolve, reject) {
        try {
            var port_1 = Input.Global.getPort(f);
            var portErr = Input.Global.validatePort(port_1);
            if (portErr) {
                reject(portErr);
            }
            else {
                try {
                    switchButtonDisabled(f.buttons, true);
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
                        switchButtonDisabled(f.buttons, false);
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
    function toStdRange(rng) {
        return {
            lowerBound: {
                value: rng.low.value.hour.toString(),
                inclusive: rng.low.inclusive
            },
            upperBound: {
                value: rng.high.value.hour.toString(),
                inclusive: rng.high.inclusive
            }
        };
    }
    function isJsonErrorResponse(x) {
        return x.hasOwnProperty("error");
    }
    function extractHour(b, mod) {
        var res = parseInt(b.value.substr(0, 2));
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
                for (var i = 0; i <= high; i++) {
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
        out.raw.textContent = Utils.formatJson(jsonRes);
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
            console.log(jsonRes);
            jsonRes.result.entries.forEach(function (entry) {
                var carId = entry.id.id.toString();
                if (!templates_1.hasOwnProperty(carId)) {
                    var tmp = Templating.pushTemplate(out.timetableTemplate, {
                        CAR: carId
                    });
                    templates_1[carId] = new Templating.Templater(tmp);
                    times_1[carId] = [];
                }
                times_1[carId].push(toStdRange(entry.range));
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
        formFields: fieldsForm.form,
        buttons: [
            document.getElementById("json-submit"),
            document.getElementById("fields-submit"),
            document.getElementById("force-submit"),
            fieldsForm.utAddButton,
            function () { return ArrayLike.toArray(fieldsForm.utTemplate.source.parentElement.getElementsByTagName("button")); }
        ]
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
    Input.Global.setupListeners(globalForm, fieldsForm, jsonForm.text, out);
    Input.Json.setupListeners(globalForm, jsonForm, jsonForm.text, out);
    Input.Fields.setupListeners(globalForm, fieldsForm, jsonForm.text, out);
    formSubmit(globalForm, forceForm, jsonForm.text, "negotiate", out);
    Input.Global.switchDisplayedForm(globalForm, fieldsForm, jsonForm.text);
    Output.setupListeners(out);
});
