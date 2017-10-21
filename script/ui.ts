interface JsonBound {
	pivot: string,
	inclusive: boolean
}
interface JsonRange {
	lowerBound: JsonBound,
	upperBound: JsonBound
}
interface JsonData {
	maxGridLoad?: number,
	currentCharge?: number,
	chargeCapacity?: number,
	chargePerHour?: number,
	chargeDrainPerHour?: number,
	unavailableTimes?: JsonRange[]
}
function getJsonData(area: HTMLTextAreaElement) {
	return JSON.parse(area.value) as JsonData;
}
function writeJsonData(area: HTMLTextAreaElement, data: JsonData) {
	area.value = JSON.stringify(data, undefined, "\t");
}

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
	function updateField(inKey: string, outEle: HTMLInputElement, json: JsonData) {
		outEle.value = json[inKey];
	}
	function valueToInput(n: number | undefined, input: HTMLInputElement, noChange: HTMLInputElement) {
		console.log(n);
		if (n !== undefined) {
			input.value = (Math.round(100*n)/100).toString();
			noChange.checked = false;
		} else {
			input.value = "";
			noChange.checked = true;
		}
		input.disabled = noChange.checked;
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
				let jsonData = getJsonData(json);
				valueToInput(jsonData.maxGridLoad, fields.gridLoad, fields.gridLoadNoChange);
				valueToInput(jsonData.currentCharge, fields.currentCharge, fields.currentChargeNoChange);
				valueToInput(jsonData.chargeCapacity, fields.maxCharge, fields.maxChargeNoChange);
				valueToInput(jsonData.chargePerHour, fields.chargeRate, fields.chargeRateNoChange);
				valueToInput(jsonData.chargeDrainPerHour, fields.chargeDrain, fields.chargeDrainNoChange);
				Templating.killAll("ut");
				let utCheckedValue = jsonData.unavailableTimes === undefined;
				if (!utCheckedValue) {
					(jsonData.unavailableTimes as JsonRange[]).forEach((ut: JsonRange) => FieldsForm.templateUt(ut, json));					
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
		gridLoadNoChange: HTMLInputElement,
		currentCharge: HTMLInputElement,
		currentChargeNoChange: HTMLInputElement,
		maxCharge: HTMLInputElement,
		maxChargeNoChange: HTMLInputElement,
		chargeRate: HTMLInputElement,
		chargeRateNoChange: HTMLInputElement,
		chargeDrain: HTMLInputElement,
		chargeDrainNoChange: HTMLInputElement,
		utLowValue: HTMLInputElement,
		utLowInclusive: HTMLInputElement,
		utHighValue: HTMLInputElement,
		utHighInclusive: HTMLInputElement,
		utAddButton: HTMLButtonElement,
		utNoChange: HTMLInputElement
	}
	function getNum(inEle: HTMLInputElement, callback: (n: number) => void) {
		let value = parseFloat(inEle.value);
		if (isNaN(value) || !isFinite(value)) {
			console.error(inEle.id + " not a number.");
		} else {
			callback(value);
		}	
	}
	function changeValue(inEle: HTMLInputElement, outKey: string, json: HTMLTextAreaElement) {
		getNum(inEle, value => {
			let jsonData = getJsonData(json);
			jsonData[outKey] = value;
			writeJsonData(json, jsonData);
		});
	}
	function change(inEle: HTMLInputElement, outKey: string, dnc: HTMLInputElement, json: HTMLTextAreaElement) {
		inEle.addEventListener("change", () => {
			if (!dnc.checked) {
				changeValue(inEle, outKey, json);				
			}
		});
		dnc.addEventListener("change", () => {
			inEle.disabled = dnc.checked;
			if (dnc.checked) {
				let jsonData = getJsonData(json);
				delete jsonData[outKey];
				writeJsonData(json, jsonData);
			} else {
				changeValue(inEle, outKey, json)
			}
		});
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
					let jsonData = getJsonData(json);
					let jsonArr = jsonData.unavailableTimes as JsonRange[];
					jsonArr.splice(rangeIndex(jsonArr, rng), 1);
					writeJsonData(json, jsonData);
					parent.removeChild(root);
				});
			}
		});
	}
	function utSwitchEnable(f: Form, json: HTMLTextAreaElement) {
		f.utLowValue.disabled = f.utNoChange.checked;
		f.utLowInclusive.disabled = f.utNoChange.checked;
		f.utHighValue.disabled = f.utNoChange.checked;
		f.utHighInclusive.disabled = f.utNoChange.checked;
		f.utAddButton.disabled = f.utNoChange.checked;
		if (f.utNoChange.checked) {
			Templating.killAll("ut");
			let jsonData = getJsonData(json);
			delete jsonData.unavailableTimes;
			writeJsonData(json, jsonData);
		} else {
			let jsonData = getJsonData(json);
			jsonData.unavailableTimes = [];
			writeJsonData(json, jsonData);			
		}
	}
	export function setupListeners(mode: GlobalForm.Form, f: Form, json: HTMLTextAreaElement) {
		change(f.gridLoad, "maxGridLoad", f.gridLoadNoChange, json);
		change(f.currentCharge, "currentCharge", f.currentChargeNoChange, json);
		change(f.maxCharge, "chargeCapacity", f.maxChargeNoChange, json);
		change(f.chargeRate, "chargePerHour", f.chargeRateNoChange, json);
		change(f.chargeDrain, "chargeDrainPerHour", f.chargeDrainNoChange, json);
		f.utNoChange.addEventListener("change", () => utSwitchEnable(f, json));
		f.utAddButton.addEventListener("click", () => {
			if (f.utNoChange.checked) {
				alert("Error: Cannot add an unavailable time range when the Do Not Change checkbox is checked.");
			} else {
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
					let jsonData = getJsonData(json);
					(jsonData.unavailableTimes as JsonRange[]).push(rng);
					writeJsonData(json, jsonData);
					templateUt(rng, json);
				}));
			}
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
						let data: any = getJsonData(json);
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
		form: document.getElementById("form-fields") as HTMLFormElement,
		gridLoad: document.getElementById("input-grid-load") as HTMLInputElement,
		gridLoadNoChange: document.getElementById("input-grid-load-nc") as HTMLInputElement,
		currentCharge: document.getElementById("input-current-charge") as HTMLInputElement,
		currentChargeNoChange: document.getElementById("input-current-charge-nc") as HTMLInputElement,
		maxCharge: document.getElementById("input-charge-capacity") as HTMLInputElement,
		maxChargeNoChange: document.getElementById("input-charge-capacity-nc") as HTMLInputElement,
		chargeRate: document.getElementById("input-charge-rate") as HTMLInputElement,
		chargeRateNoChange: document.getElementById("input-charge-rate-nc") as HTMLInputElement,
		chargeDrain: document.getElementById("input-charge-drain") as HTMLInputElement,
		chargeDrainNoChange: document.getElementById("input-charge-drain-nc") as HTMLInputElement,
		utLowValue: document.getElementById("input-ut-low") as HTMLInputElement,
		utLowInclusive: document.getElementById("input-ut-low-inc") as HTMLInputElement,
		utHighValue: document.getElementById("input-ut-high") as HTMLInputElement,
		utHighInclusive: document.getElementById("input-ut-high-inc") as HTMLInputElement,
		utAddButton: document.getElementById("input-ut-add") as HTMLButtonElement,
		utNoChange: document.getElementById("input-ut-nc") as HTMLInputElement
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


