namespace Templating {
	export interface Template {
		readonly source: HTMLElement,
		readonly display: string | null
	}

	const templates: Utils.Dictionary<Template> = {};
	export function getIds(): ReadonlyArray<string> {
		return Object.keys(templates);
	}
	export function getTemplate(tid: string): Template | undefined {
		return templates[tid];
	}
	export function killAll(tid: string) {
		let t = getTemplate(tid);
		if (typeof t !== "undefined") {
			let parent = t.source.parentElement as HTMLElement;
			let toRemove: HTMLElement[] = [];
			let child: HTMLElement;
			for (let i = 0; i < parent.children.length; i++) {
				child = parent.children[i] as HTMLElement;
				if (child.hasAttribute("data-template-clone")) {
					toRemove.push(child);
				}
			}
			toRemove.forEach(child => parent.removeChild(child));
		}
	}

	interface RegexReplacer {
		readonly regex: RegExp,
		readonly replacement: string
	}
	function replace(str: string, replacer: RegexReplacer): string {
		return str.replace(replacer.regex, replacer.replacement);
	}

	export type TemplateCallback = (id: string, element: HTMLElement, root: HTMLElement, parent: HTMLElement) => void;
	const validIdRegex = /^[a-z0-9 \-_]+$/i;
	function argsToRegex(args: Utils.ReadonlyDictionary<string>): ReadonlyArray<RegexReplacer> {
		let res: RegexReplacer[] = [];
		Utils.dictionaryForEach(args, (value, key) => {
			if (validIdRegex.test(key)) {
				res.push({
					regex: new RegExp("%" + Utils.regexEscape(key) + "%", "gi"),
					replacement: value
				});
			} else {
				console.error("Template arg key \"" + key + "\" is invalid: failed regex test " + validIdRegex.source);
			}
		});
		return res;
	}
	function argReplace(str: string, args: ReadonlyArray<RegexReplacer>): string {
		return args.reduce((prevStr, currRegex) => replace(prevStr, currRegex), str);
	}
	function resolveArgs(node: Node, args: ReadonlyArray<RegexReplacer>, root: HTMLElement, parent: HTMLElement, callback?: TemplateCallback) {
		switch (node.nodeType) {
			case Node.ELEMENT_NODE:
				let hasCallback = false;
				let attr: Attr;
				for (let i = 0; i < node.attributes.length; i++) {
					attr = node.attributes.item(i);
					attr.value = argReplace(attr.value, args);
					hasCallback = hasCallback || attr.name === "data-template-callback";
				}
				for (let i = 0; i < node.childNodes.length; i++) {
					resolveArgs(node.childNodes[i], args, root, parent, callback);
				}
				if (hasCallback && typeof callback !== "undefined") {
					callback(node.attributes.getNamedItem("data-template-callback").value, node as HTMLElement, root, parent);
				}
				break;
			case Node.TEXT_NODE:
				node.textContent = argReplace(node.textContent as string, args);
				break;
		}
	}
	export function push(template: Template, args: Utils.ReadonlyDictionary<string>, callback?: TemplateCallback): HTMLElement {
		const newEle = template.source.cloneNode(true) as HTMLElement;
		newEle.style.display = template.display;
		newEle.setAttribute("data-template-clone", "");
		let parent = template.source.parentElement as HTMLElement;
		resolveArgs(newEle, argsToRegex(args), newEle, parent, callback);
		parent.appendChild(newEle);
		return newEle;
	}

	export function setup() {
		const elements = document.querySelectorAll("[data-template]");
		let element: HTMLElement;
		let tid: string;
		for (let i = 0; i < elements.length; i++) {
			element = elements[i] as HTMLElement;
			tid = element.getAttribute("data-template") as string;
			if (templates.hasOwnProperty(tid)) {
				console.error("Templater: Duplicate template ID \"" + tid + "\".");
			} else {
				element.removeAttribute("data-template");
				templates[tid] = {
					source: element,
					display: element.style.display
				};
				element.style.display = "none";
			}
		}
	}
}