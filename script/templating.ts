namespace Templating {
	export interface Template {
		readonly source: HTMLElement,
		readonly display: string | null
	}
	export function killTemplate(template: Template) {
		const parent = template.source.parentElement as HTMLElement;
		ArrayLike.reduce(ArrayLike.cast<HTMLElement>(parent.children), (toRemove, child) => {
			if (child.hasAttribute("data-template-clone")) {
				toRemove.push(child);
			}
			return toRemove;
		}, [] as HTMLElement[]).forEach(child => parent.removeChild(child));
	}
	
	interface RegexReplacer {
		readonly regex: RegExp,
		readonly replacement: string
	}
	function replace(str: string, replacer: RegexReplacer): string {
		return str.replace(replacer.regex, replacer.replacement);
	}

	const validIdRegex = /^[a-z0-9 \-_]+$/i;
	function argsToRegex(args: Utils.ReadonlyDictionary<string>): ReadonlyArray<RegexReplacer> {
		const res: RegexReplacer[] = [];
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
	export function pushTemplate(template: Template, args: Utils.ReadonlyDictionary<string>, callback?: (id: string, element: HTMLElement, root: HTMLElement, parent: HTMLElement) => void): HTMLElement {
		console.log(template);
		const newEle = template.source.cloneNode(true) as HTMLElement;
		newEle.style.display = template.display;
		newEle.setAttribute("data-template-clone", "");
		const parent = template.source.parentElement as HTMLElement;
		const args2 = argsToRegex(args);
		let tParent: Node | null = null;
		Utils.domIterate(newEle, {
			open: node => {
				switch (node.nodeType) {
					case Node.ELEMENT_NODE:
						const node2 = node as HTMLElement;
						ArrayLike.forEach(node2.attributes, attr => {
							attr.value = argReplace(attr.value, args2);
						});
						if (tParent === null) {
							if (node2.hasAttribute("data-template")) {
								tParent = node;
							}
						}
						if (tParent === null) {
							if (node2.hasAttribute("data-template-style")) {
								let style = node2.getAttribute("style");
								style = style || "";
								style += node2.getAttribute("data-template-style") as string;
								node2.setAttribute("style", style);
								node2.removeAttribute("data-template-style");
							}
							if (typeof callback !== "undefined" && node2.hasAttribute("data-template-callback")) {
								let id = node2.getAttribute("data-template-callback") as string;
								node2.removeAttribute("data-template-callback");
								callback(id, node2, newEle, parent);
							}
						}
					break;
					case Node.TEXT_NODE:
						node.textContent = argReplace(node.textContent as string, args2);
						break;
				}
				return false;
			},
			close: node => {
				if (node === tParent) {
					tParent = null;
				}
			}
		}, true, Node.ELEMENT_NODE, Node.TEXT_NODE);
		parent.appendChild(newEle);
		return newEle;
	}

	export class Templater {
		private templates: Utils.Dictionary<Template>;
		public constructor(root: HTMLElement, includeSelf: boolean = false) {
			let templates: HTMLElement[];
			if (includeSelf && root.hasAttribute("data-template")) {
				templates = [root];
			} else {
				const potential = root.querySelectorAll("[data-template]") as NodeListOf<HTMLElement>;
				templates = ArrayLike.filter(potential, p => !Utils.hasParentWithAttribute(p, "data-template"));
			}
			this.templates = templates.reduce((obj, curr) => {
				const name = curr.getAttribute("data-template") as string;
				if (obj.hasOwnProperty(name)) {
					console.error("Templater: Duplicate template ID \"" + name + "\".");
				} else {
					curr.removeAttribute("data-template");
					obj[name] = {
						source: curr,
						display: curr.style.display
					};
					curr.style.display = "none";
				}
				return obj;
			}, {} as Utils.Dictionary<Template>);
		}
		public getCount(): number {
			return this.getIds().length;
		}
		public getIds(): ReadonlyArray<string> {
			return Object.keys(this.templates);
		}
		public getTemplate(tid: string): Template | undefined {
			return this.templates[tid];
		}
		public killTemplate(tid: string) {
			const tmp = this.getTemplate(tid);
			if (typeof tmp !== "undefined") {
				killTemplate(tmp);			
			}
		}
		public pushTemplate(tid: string, args: Utils.ReadonlyDictionary<string>, callback?: (id: string, element: HTMLElement, root: HTMLElement, parent: HTMLElement) => void): HTMLElement | undefined {
			const tmp = this.getTemplate(tid);
			let res;
			if (typeof tmp !== "undefined") {
				res = pushTemplate(tmp, args, callback);			
			}
			return res;
		}
	}
}
