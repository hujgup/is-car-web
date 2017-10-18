"use strict";

interface FormContainer {
	form: HTMLFormElement
}

namespace GlobalForm {
	export interface Form extends FormContainer {
		inputJson: HTMLInputElement,
		inputFields: HTMLInputElement,
		inputPort: HTMLInputElement,
		formJson: HTMLFormElement,
		formFields: HTMLFormElement
	}
	export enum InputType {
		JSON,
		FIELDS,
		ERR_NONE,
		ERR_MANY	
	}
	export function getPort(f: Form): number {
		return parseInt(f.inputPort.value);
	}
	export function validatePort(port: number): string | undefined {
		let res: string | undefined = undefined;
		if (isNaN(port)) {
			res = "Port number is not a number.";
		} else if (port%1 !== 0) {
			res = "Port number must be an integer.";
		} else if (port < 8080 || port > 28080) {
			res = "Port number must be between 8080 and 28080, inclusive.";
		}
		return res;
	}
	export function getInputType(mode: Form): InputType {
		let res: InputType;
		if (mode.inputJson.checked) {
			if (mode.inputFields.checked) {
				res = InputType.ERR_MANY;
			} else {
				res = InputType.JSON;
			}
		} else if (mode.inputFields.checked) {
			res = InputType.FIELDS;
		} else {
			res = InputType.ERR_NONE;
		}
		return res;
	}
	export function setupListeners(mode: Form, json: HTMLTextAreaElement) {
		mode.inputJson.addEventListener("change", () => switchDisplayedForm(mode));
		mode.inputFields.addEventListener("change", () => switchDisplayedForm(mode));
		formSubmit(mode, mode.form, json, "constraints");
	}
	export function switchDisplayedForm(mode: Form) {
		let inputType = getInputType(mode);
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
}

namespace JsonForm {
	export interface Form extends FormContainer {
		text: HTMLTextAreaElement
	}
	export function setupListeners(mode: GlobalForm.Form, f: Form, json: HTMLTextAreaElement) {
		formSubmit(mode, f.form, json, "constraints");
	}
}

namespace FieldsForm {
	export interface Form extends FormContainer {
	}
	export function setupListeners(mode: GlobalForm.Form, f: Form, json: HTMLTextAreaElement) {
		formSubmit(mode, f.form, json, "constraints");
	}
}

function formSubmit(f: GlobalForm.Form, f2: HTMLFormElement, json: HTMLTextAreaElement, action: string) {
	Utils.asyncFormSubmit(f2, () => new Promise<string>((resolve, reject) => {
		try {
			let port = GlobalForm.getPort(f);
			let portErr = GlobalForm.validatePort(port);
			if (portErr) {
				reject(portErr);
			} else {
				try {
					let req = new Ajax.Request(Ajax.Method.POST, "http://localhost:" + port + "/");
					let jsonText;
					if (action === "constraints") {
						let data = JSON.parse(json.value);
						data.action = action;
						jsonText = JSON.stringify(data);
					} else {
						jsonText = JSON.stringify({
							action: action
						});
					}
					req.setData({
						"json": jsonText
					});		
					req.execute(res => {
						if (res.status !== 0) {
							resolve("response/?port=" + port + "&status=" + res.status + "&request=" + encodeURIComponent(jsonText) + "&response=" + encodeURIComponent(res.text));							
						} else {
							reject("JADE was not activated, or the provided port number was incorrect.");
						}
					});
				} catch (e) {
					if (e instanceof SyntaxError) {
						reject("Input was not valid JSON.\n\n" + e.message);
					} else {
						throw e;
					}
				}
						}
		} catch (e) {
			reject("Unhandled exception: " + e.message);
		}
	}), err => {
		alert("Error: " + err);
	});
}

window.addEventListener("DOMContentLoaded", () => {
	let jsonForm: JsonForm.Form = {
		form: document.getElementById("form-json") as HTMLFormElement,
		text: document.getElementById("input-json") as HTMLTextAreaElement
	};
	let fieldsForm: FieldsForm.Form = {
		form: document.getElementById("form-fields") as HTMLFormElement
	};
	let globalForm: GlobalForm.Form = {
		form: document.getElementById("form-global") as HTMLFormElement,
		inputJson: document.getElementById("mode-json") as HTMLInputElement,
		inputFields: document.getElementById("mode-fields") as HTMLInputElement,
		inputPort: document.getElementById("port") as HTMLInputElement,
		formJson: jsonForm.form,
		formFields: fieldsForm.form
	};
	let forceForm = document.getElementById("form-force") as HTMLFormElement;

	GlobalForm.setupListeners(globalForm, jsonForm.text);
	JsonForm.setupListeners(globalForm, jsonForm, jsonForm.text);
	FieldsForm.setupListeners(globalForm, fieldsForm, jsonForm.text);
	formSubmit(globalForm, forceForm, jsonForm.text, "negotiate");
	GlobalForm.switchDisplayedForm(globalForm);
});


