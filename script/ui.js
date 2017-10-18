"use strict";
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
    function setupListeners(mode, json) {
        mode.inputJson.addEventListener("change", function () { return switchDisplayedForm(mode); });
        mode.inputFields.addEventListener("change", function () { return switchDisplayedForm(mode); });
        formSubmit(mode, mode.form, json, "constraints");
    }
    GlobalForm.setupListeners = setupListeners;
    function switchDisplayedForm(mode) {
        var inputType = getInputType(mode);
        switch (inputType) {
            case InputType.JSON:
                mode.formJson.style.display = "";
                mode.formFields.style.display = "none";
                break;
            case InputType.FIELDS:
                mode.formJson.style.display = "none";
                mode.formFields.style.display = "";
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
    function setupListeners(mode, f, json) {
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
        form: document.getElementById("form-fields")
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
    GlobalForm.setupListeners(globalForm, jsonForm.text);
    JsonForm.setupListeners(globalForm, jsonForm, jsonForm.text);
    FieldsForm.setupListeners(globalForm, fieldsForm, jsonForm.text);
    formSubmit(globalForm, forceForm, jsonForm.text, "negotiate");
    GlobalForm.switchDisplayedForm(globalForm);
});
