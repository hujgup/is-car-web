interface JsonBound {
	readonly value: string,
	readonly inclusive: boolean
}
interface JsonRange {
	readonly lowerBound: JsonBound,
	readonly upperBound: JsonBound
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
	area.value = Utils.formatJson(data);
}

interface FormContainer {
	readonly form: HTMLFormElement
}

namespace Input {
	export namespace Global {
		export interface Form extends FormContainer {
			readonly inputJson: HTMLInputElement,
			readonly inputFields: HTMLInputElement,
			readonly inputPort: HTMLInputElement,
			readonly formJson: HTMLFormElement,
			readonly formFields: HTMLFormElement
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
		export function setupListeners(mode: Form, fields: Fields.Form, json: HTMLTextAreaElement, out: Output.Data) {
			mode.inputJson.addEventListener("change", () => switchDisplayedForm(mode, fields, json));
			mode.inputFields.addEventListener("change", () => switchDisplayedForm(mode, fields, json));
			formSubmit(mode, mode.form, json, "constraints", out);
		}
		function valueToInput(n: number | undefined, input: HTMLInputElement, noChange: HTMLInputElement) {
			if (n !== undefined) {
				input.value = (Math.round(100*n)/100).toString();
				noChange.checked = false;
			} else {
				input.value = "";
				noChange.checked = true;
			}
			input.disabled = noChange.checked;
		}
		export function switchDisplayedForm(mode: Form, fields: Fields.Form, json: HTMLTextAreaElement) {
			if (mode.inputJson.checked) {
				mode.formJson.style.display = "";
				mode.formFields.style.display = "none";
			} else {
				mode.formJson.style.display = "none";
				mode.formFields.style.display = "";
				const jsonData = getJsonData(json);
				valueToInput(jsonData.maxGridLoad, fields.gridLoad, fields.gridLoadNoChange);
				valueToInput(jsonData.currentCharge, fields.currentCharge, fields.currentChargeNoChange);
				valueToInput(jsonData.chargeCapacity, fields.maxCharge, fields.maxChargeNoChange);
				valueToInput(jsonData.chargePerHour, fields.chargeRate, fields.chargeRateNoChange);
				valueToInput(jsonData.chargeDrainPerHour, fields.chargeDrain, fields.chargeDrainNoChange);
				Templating.killTemplate(fields.utTemplate);
				const utCheckedValue = jsonData.unavailableTimes === undefined;
				if (!utCheckedValue) {
					(jsonData.unavailableTimes as JsonRange[]).forEach((ut: JsonRange) => Fields.pushUtTemplate(fields.utTemplate, ut, json));					
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
	}
	
	export namespace Json {
		export interface Form extends FormContainer {
			readonly text: HTMLTextAreaElement
		}
		export function setupListeners(mode: Global.Form, f: Form, json: HTMLTextAreaElement, out: Output.Data) {
			formSubmit(mode, f.form, json, "constraints", out);
		}
	}
	
	export namespace Fields {
		export interface Form extends FormContainer {
			readonly gridLoad: HTMLInputElement,
			readonly gridLoadNoChange: HTMLInputElement,
			readonly currentCharge: HTMLInputElement,
			readonly currentChargeNoChange: HTMLInputElement,
			readonly maxCharge: HTMLInputElement,
			readonly maxChargeNoChange: HTMLInputElement,
			readonly chargeRate: HTMLInputElement,
			readonly chargeRateNoChange: HTMLInputElement,
			readonly chargeDrain: HTMLInputElement,
			readonly chargeDrainNoChange: HTMLInputElement,
			readonly utLowValue: HTMLInputElement,
			readonly utLowInclusive: HTMLInputElement,
			readonly utHighValue: HTMLInputElement,
			readonly utHighInclusive: HTMLInputElement,
			readonly utAddButton: HTMLButtonElement,
			readonly utNoChange: HTMLInputElement,
			readonly utTemplate: Templating.Template
		}
		function getNum(inEle: HTMLInputElement, callback: (n: number) => void) {
			const value = parseFloat(inEle.value);
			if (isNaN(value) || !isFinite(value)) {
				console.error(inEle.id + " not a number.");
			} else {
				callback(value);
			}	
		}
		function changeValue(inEle: HTMLInputElement, outKey: string, json: HTMLTextAreaElement) {
			getNum(inEle, value => {
				const jsonData = getJsonData(json);
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
					const jsonData = getJsonData(json);
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
				const brk = value.lowerBound.value === rng.lowerBound.value && value.lowerBound.inclusive == rng.lowerBound.inclusive
					&& value.upperBound.value === rng.upperBound.value && value.upperBound.inclusive === rng.upperBound.inclusive;
				if (brk) {
					res = index;
				}
				return brk;
			});
			return res;
		}
		export function pushUtTemplate(template: Templating.Template, rng: JsonRange, json: HTMLTextAreaElement) {
			Templating.pushTemplate(template, {
				LOW: rng.lowerBound.value,
				LOW_BRACKET: rng.lowerBound.inclusive ? "[" : "(",
				HIGH: rng.upperBound.value,
				HIGH_BRACKET: rng.upperBound.inclusive ? "]" : ")"
			}, (id, element, root, parent) => {
				if (id === "remove-btn") {
					element.addEventListener("click", () => {
						const jsonData = getJsonData(json);
						const jsonArr = jsonData.unavailableTimes as JsonRange[];
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
			const jsonData = getJsonData(json);
			if (f.utNoChange.checked) {
				Templating.killTemplate(f.utTemplate);
				delete jsonData.unavailableTimes;
				writeJsonData(json, jsonData);
			} else {
				jsonData.unavailableTimes = [];
				writeJsonData(json, jsonData);			
			}
		}
		export function setupListeners(mode: Global.Form, f: Form, json: HTMLTextAreaElement, out: Output.Data) {
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
						const rng: JsonRange = {
							lowerBound: {
								value: zeroPad(low),
								inclusive: f.utLowInclusive.checked
							},
							upperBound: {
								value: zeroPad(high),
								inclusive: f.utHighInclusive.checked
							}
						};
						const jsonData = getJsonData(json);
						(jsonData.unavailableTimes as JsonRange[]).push(rng);
						writeJsonData(json, jsonData);
						pushUtTemplate(f.utTemplate, rng, json);
					}));
				}
			});
			formSubmit(mode, f.form, json, "constraints", out);
		}
	}	
}

function formSubmit(f: Input.Global.Form, f2: HTMLFormElement, json: HTMLTextAreaElement, action: string, out: Output.Data) {
	Utils.asyncFormSubmit(f2, () => new Promise<string>((resolve, reject) => {
		try {
			const port = Input.Global.getPort(f);
			const portErr = Input.Global.validatePort(port);
			if (portErr) {
				reject(portErr);
			} else {
				try {
					const req = new Ajax.Request(Ajax.Method.POST, "http://localhost:" + port + "/");
					let jsonText;
					if (action === "constraints") {
						const data: any = getJsonData(json);
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
							Output.renderResponse(out, port, res.status, res.text);
							//resolve("response/?port=" + port + "&status=" + res.status + "&request=" + encodeURIComponent(jsonText) + "&response=" + encodeURIComponent(res.text));							
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

namespace Output {
	export interface Data {
		readonly inContainer: HTMLElement,
		readonly outContainer: HTMLElement,
		readonly visSection: HTMLElement,
		readonly switchForm: HTMLFormElement,
		readonly switchModeVis: HTMLInputElement,
		readonly switchModeRaw: HTMLInputElement,
		readonly backBtn: HTMLButtonElement,
		readonly raw: HTMLElement,
		readonly car: HTMLElement,
		readonly status: HTMLElement,
		readonly errorHead: HTMLElement,
		readonly error: HTMLElement,
		readonly timetableContainer: HTMLElement,
		readonly timetableTemplate: Templating.Template,
		readonly timetableSubTemplateId: string,
		readonly timetableSize: number
	}
	
	interface JsonResponseBound {
		readonly value: {
			readonly hour: number
		},
		readonly inclusive: boolean
	}
	interface JsonResponseRange {
		readonly low: JsonResponseBound,
		readonly high: JsonResponseBound
	}
	interface JsonErrorResponse {
		readonly error: string
	}
	interface JsonTimetableEntry {
		readonly id: {
			readonly id: number
		},
		readonly range: JsonResponseRange
	}
	function toStdRange(rng: JsonResponseRange): JsonRange {
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
	interface JsonGoodResponse {
		readonly result: {
			readonly entries: ReadonlyArray<JsonTimetableEntry>
		}
	}
	type JsonResponse = JsonErrorResponse | JsonGoodResponse;
	function isJsonErrorResponse(x: JsonResponse): x is JsonErrorResponse {
		return x.hasOwnProperty("error");
	}
	
	function extractHour(b: JsonBound, mod: number): number {
		let res = parseInt(b.value.substr(0, 2));
		if (!b.inclusive) {
			res += mod;
		}
		return res;
	}
	function compressRanges(rngSet: ReadonlyArray<JsonRange>, max: number): boolean[] {
		const res: boolean[] = Utils.Array.fill(false, max);
		rngSet.forEach(rng => {
			const low = extractHour(rng.lowerBound, 1);
			const high = extractHour(rng.upperBound, -1);
			if (high < low) {
				for (let i = low; i < max; i++) {
					res[i] = true;
				}
				for (let i = 0; i <= high; i++) {
					res[i] = true;
				}
			} else {
				for (let i = low; i <= high; i++) {
					res[i] = true;
				}
			}
		});
		return res;
	}
	export function renderResponse(out: Data, id: number, status: number, json: string) {
		Templating.killTemplate(out.timetableTemplate);
		const jsonRes: JsonResponse = JSON.parse(json);
		out.raw.textContent = Utils.formatJson(json);
		out.car.textContent = id.toString();
		out.status.textContent = status.toString();
		if (isJsonErrorResponse(jsonRes)) {
			out.errorHead.style.display = null;
			out.error.style.display = null;
			out.timetableContainer.style.display = "none";
			out.error.textContent = jsonRes.error;
		} else {
			out.errorHead.style.display = "none";
			out.error.style.display = "none";
			out.timetableContainer.style.display = null;
			const templates: Utils.Dictionary<Templating.Templater> = {};
			const times: Utils.Dictionary<JsonRange[]> = {};
			console.log(jsonRes);
			jsonRes.result.entries.forEach(entry => {
				const carId = entry.id.id.toString();
				if (!templates.hasOwnProperty(carId)) {
					const tmp = Templating.pushTemplate(out.timetableTemplate, {
						CAR: carId
					});
					templates[carId] = new Templating.Templater(tmp);
					times[carId] = [];
				}
				times[carId].push(toStdRange(entry.range));
			});
			Object.keys(templates).forEach(carId => {
				compressRanges(times[carId], out.timetableSize).map((isOn, i) => {
					templates[carId].pushTemplate(out.timetableSubTemplateId, {
						CLASS: isOn ? "tt-range" : ""
					});
				});
			});
		}
		out.inContainer.style.display = "none";
		out.outContainer.style.display = null;
	}
	function switchDisplayedOutput(out: Data) {
		if (out.switchModeVis.checked) {
			out.visSection.style.display = null;
			out.raw.style.display = "none";
		} else {
			out.visSection.style.display = "none";
			out.raw.style.display = null;
		}
	}
	export function setupListeners(out: Data) {
		out.inContainer.style.display = null;
		out.outContainer.style.display = "none";
		Utils.asyncFormSubmit(out.switchForm);
		out.switchModeVis.addEventListener("change", () => switchDisplayedOutput(out));
		out.switchModeRaw.addEventListener("change", () => switchDisplayedOutput(out));
		switchDisplayedOutput(out);
		out.backBtn.addEventListener("click", () => {
			out.inContainer.style.display = null;
			out.outContainer.style.display = "none";	
		});
	}
}


window.addEventListener("DOMContentLoaded", () => {
	const masterTemplater = new Templating.Templater(document.body);
	const jsonForm: Input.Json.Form = {
		form: document.getElementById("form-json") as HTMLFormElement,
		text: document.getElementById("input-json") as HTMLTextAreaElement
	};
	const fieldsForm: Input.Fields.Form = {
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
		utNoChange: document.getElementById("input-ut-nc") as HTMLInputElement,
		utTemplate: masterTemplater.getTemplate("ut") as Templating.Template
	};
	const globalForm: Input.Global.Form = {
		form: document.getElementById("form-global") as HTMLFormElement,
		inputJson: document.getElementById("mode-json") as HTMLInputElement,
		inputFields: document.getElementById("mode-fields") as HTMLInputElement,
		inputPort: document.getElementById("port") as HTMLInputElement,
		formJson: jsonForm.form,
		formFields: fieldsForm.form
	};
	const forceForm = document.getElementById("form-force") as HTMLFormElement;
	const out: Output.Data = {
		inContainer: document.getElementById("sec-input") as HTMLElement,
		outContainer: document.getElementById("sec-output") as HTMLElement,
		visSection: document.getElementById("out-vis-sec") as HTMLElement,
		switchForm: document.getElementById("out-switch") as HTMLFormElement,
		switchModeVis: document.getElementById("out-vis") as HTMLInputElement,
		switchModeRaw: document.getElementById("out-raw") as HTMLInputElement,
		backBtn: document.getElementById("return-to-input") as HTMLButtonElement,
		raw: document.getElementById("out-var-raw") as HTMLElement,
		car: document.getElementById("out-var-car") as HTMLElement,
		status: document.getElementById("out-var-status") as HTMLElement,
		errorHead: document.getElementById("out-var-error-head") as HTMLElement,
		error: document.getElementById("out-var-error") as HTMLElement,
		timetableContainer: document.getElementById("out-var-tt") as HTMLElement,
		timetableTemplate: masterTemplater.getTemplate("tt-data-wrap") as Templating.Template,
		timetableSubTemplateId: "tt-data-hours",
		timetableSize: 24
	};

	for (let i = 0; i < out.timetableSize; i++) {
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


