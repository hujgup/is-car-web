// TODO: Interfaces for JSON data

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
	export function setupListeners(mode: Form, fields: FieldsForm.Form, json: HTMLTextAreaElement) {
		mode.inputJson.addEventListener("change", () => switchDisplayedForm(mode, fields, json));
		mode.inputFields.addEventListener("change", () => switchDisplayedForm(mode, fields, json));
		formSubmit(mode, mode.form, json, "constraints");
	}
	function updateField(inKey: string, outEle: HTMLInputElement, json: any) {
		outEle.value = json.inKey;
	}
	export function switchDisplayedForm(mode: Form, fields: FieldsForm.Form, json: HTMLTextAreaElement) {
		let inputType = getInputType(mode);
		switch (inputType) {
			case InputType.JSON:
				mode.formJson.style.display = "";
				mode.formFields.style.display = "none";
				break;
			case InputType.FIELDS:
				mode.formJson.style.display = "none";
				mode.formFields.style.display = "";
				let jsonData = JSON.parse(json.value);
				fields.gridLoad.value = jsonData.maxGridLoad;
				fields.currentCharge.value = jsonData.currentCharge;
				fields.maxCharge.value = jsonData.chargeCapacity;
				fields.chargeRate.value = jsonData.chargePerHour;
				fields.chargeDrain.value = jsonData.chargeDrainPerHour;
				Templating.killAll("ut");
				jsonData.unavailableTimes.forEach((ut: FieldsForm.JsonRange) => FieldsForm.templateUt(ut, json));
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
		gridLoad: HTMLInputElement,
		currentCharge: HTMLInputElement,
		maxCharge: HTMLInputElement,
		chargeRate: HTMLInputElement,
		chargeDrain: HTMLInputElement,
		utLowValue: HTMLInputElement,
		utLowInclusive: HTMLInputElement,
		utHighValue: HTMLInputElement,
		utHighInclusive: HTMLInputElement,
		utAddButton: HTMLButtonElement
	}
	function getNum(inEle: HTMLInputElement, callback: (n: number) => void) {
		let value = parseFloat(inEle.value);
		if (isNaN(value) || !isFinite(value)) {
			console.error(inEle.id + " not a number.");
		} else {
			callback(value);
		}	
	}
	function change(inEle: HTMLInputElement, outKey: string, json: HTMLTextAreaElement) {
		inEle.addEventListener("change", () => {
			getNum(inEle, value => {
				let jsonData = JSON.parse(json.value);
				jsonData[outKey] = value;
				json.value = JSON.stringify(jsonData, undefined, "\t");
			});
		});
	}
	export interface JsonBound {
		pivot: string,
		inclusive: boolean
	}
	export interface JsonRange {
		lowerBound: JsonBound,
		upperBound: JsonBound
	}
	function zeroPad(n: number) {
		let res = n.toString();
		if (res.length === 1) {
			res = "0" + res;
		}
		return res + ":00";
	}
	function rangeIndex(arr: ReadonlyArray<JsonRange>, rng: JsonRange) {
		let res = -1;
		arr.some((value, index) => {
			let brk = value.lowerBound.pivot === rng.lowerBound.pivot && value.lowerBound.inclusive == rng.lowerBound.inclusive
				&& value.upperBound.pivot === rng.upperBound.pivot && value.upperBound.inclusive === rng.upperBound.inclusive;
			if (brk) {
				res = index;
			}
			return brk;
		});
		return res;
	}
	export function templateUt(rng: JsonRange, json: HTMLTextAreaElement) {
		Templating.push(Templating.getTemplate("ut") as Templating.Template, {
			LOW: rng.lowerBound.pivot,
			LOW_BRACKET: rng.lowerBound.inclusive ? "[" : "(",
			HIGH: rng.upperBound.pivot,
			HIGH_BRACKET: rng.upperBound.inclusive ? "]" : ")"
		}, (id, element, root, parent) => {
			if (id === "remove-btn") {
				element.addEventListener("click", () => {
					let jsonData = JSON.parse(json.value);
					let jsonArr = jsonData.unavailableTimes as JsonRange[];
					jsonArr.splice(rangeIndex(jsonArr, rng), 1);
					json.value = JSON.stringify(jsonData, undefined, "\t");
					parent.removeChild(root);
				});
			}
		});
	}
	export function setupListeners(mode: GlobalForm.Form, f: Form, json: HTMLTextAreaElement) {
		change(f.gridLoad, "maxGridLoad", json);
		change(f.currentCharge, "currentCharge", json);
		change(f.maxCharge, "chargeCapacity", json);
		change(f.chargeRate, "chargePerHour", json);
		change(f.chargeDrain, "chargeDrainPerHour", json);
		f.utAddButton.addEventListener("click", () => {
			getNum(f.utLowValue, low => getNum(f.utHighValue, high => {
				let rng: JsonRange = {
					lowerBound: {
						pivot: zeroPad(low),
						inclusive: f.utLowInclusive.checked
					},
					upperBound: {
						pivot: zeroPad(high),
						inclusive: f.utHighInclusive.checked
					}
				};
				let jsonData = JSON.parse(json.value);
				jsonData.unavailableTimes.push(rng);
				json.value = JSON.stringify(jsonData, undefined, "\t");
				templateUt(rng, json);
			}));
		});
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
	interface Form extends FormContainer {
		gridLoad: HTMLInputElement,
		currentCharge: HTMLInputElement,
		maxCharge: HTMLInputElement,
		chargeRate: HTMLInputElement,
		chargeDrain: HTMLInputElement,
		utLowValue: HTMLInputElement,
		utLowInclusive: HTMLInputElement,
		utHighValue: HTMLInputElement,
		utHighInclusive: HTMLInputElement,
		utAddButton: HTMLButtonElement
	}
	let jsonForm: JsonForm.Form = {
		form: document.getElementById("form-json") as HTMLFormElement,
		text: document.getElementById("input-json") as HTMLTextAreaElement
	};
	let fieldsForm: FieldsForm.Form = {
		form: document.getElementById("form-fields") as HTMLFormElement,
		gridLoad: document.getElementById("input-grid-load") as HTMLInputElement,
		currentCharge: document.getElementById("input-current-charge") as HTMLInputElement,
		maxCharge: document.getElementById("input-charge-capacity") as HTMLInputElement,
		chargeRate: document.getElementById("input-charge-rate") as HTMLInputElement,
		chargeDrain: document.getElementById("input-charge-drain") as HTMLInputElement,
		utLowValue: document.getElementById("input-ut-low") as HTMLInputElement,
		utLowInclusive: document.getElementById("input-ut-low-inc") as HTMLInputElement,
		utHighValue: document.getElementById("input-ut-high") as HTMLInputElement,
		utHighInclusive: document.getElementById("input-ut-high-inc") as HTMLInputElement,
		utAddButton: document.getElementById("input-ut-add") as HTMLButtonElement
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

	Templating.setup();
	GlobalForm.setupListeners(globalForm, fieldsForm, jsonForm.text);
	JsonForm.setupListeners(globalForm, jsonForm, jsonForm.text);
	FieldsForm.setupListeners(globalForm, fieldsForm, jsonForm.text);
	formSubmit(globalForm, forceForm, jsonForm.text, "negotiate");
	GlobalForm.switchDisplayedForm(globalForm, fieldsForm, jsonForm.text);
});


