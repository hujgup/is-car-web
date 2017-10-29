"use strict";

namespace Utils {
	export interface DomIteratorCallback {
		readonly open?: (node: Node) => boolean,
		readonly close?: (node: Node) => void
	}
	export function domIterate(root: Node, callback: DomIteratorCallback, includeRoot: boolean = true, ...nodeTypes: number[]): void {
		let skipChildren = false;
		if (includeRoot && callback.open) {
			skipChildren = callback.open(root);
		}
		if (!skipChildren) {
			const allNodeTypes = nodeTypes.length === 0;
			ArrayLike.forEach(root.childNodes, child => {
				if (allNodeTypes || nodeTypes.indexOf(child.nodeType) >= 0) {
					domIterate.apply(undefined, [child, callback, true].concat(nodeTypes as any[]));
				}
			});	
		}
		if (includeRoot && callback.close) {
			callback.close(root);
		}
	}
	export function hasParentWithAttribute(element: HTMLElement, attrName: string): boolean {
		let res = false;
		while (!res && element.parentElement !== null) {
			element = element.parentElement;
			if (element.hasAttribute(attrName)) {
				res = true;
			}
		}
		return res;
	}

	export function assertNever(x: never) {
		throw new Error("Value should never be possible.");
	}

	export function formatJson(json: any): string {
		return JSON.stringify(json, undefined, "\t");
	}
	export function expandJson(json: string): string {
		return formatJson(JSON.parse(json));
	}

	let queryObj: Dictionary<string>;
	export function query() {
		if (typeof queryObj === "undefined") {
			const queryStr = location.search.substr(1).split("&");
			queryObj = {};
			queryStr.forEach(kvp => {
				const kvp2 = kvp.split("=", 2);
				queryObj[decodeURIComponent(kvp2[0])] = decodeURIComponent(kvp2[1]);
			});
		}
		return queryObj;
	}

	export function asyncFormSubmit(form: HTMLFormElement): void;
	export function asyncFormSubmit(form: HTMLFormElement, promise: (this: HTMLFormElement, event: Event) => Promise<string>, errorHandler?: (err?: any | null) => void): void;	
	export function asyncFormSubmit(form: HTMLFormElement, promise?: (this: HTMLFormElement, event: Event) => Promise<string>, errorHandler?: (err?: any | null) => void): void {
		form.onsubmit = event => {
			if (promise) {
				(promise.call(form, event) as Promise<string>)
					.then(redirect => location.href = redirect)
					.catch(err => {
						if (errorHandler !== undefined) {
							errorHandler(err);
						}
					});
			}
			event.returnValue = false;
			return false;
		};
	}

	export function regexEscape(str: string): string {
		// Credit to https://stackoverflow.com/a/3561711
		return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
	}

	export interface Dictionary<T> {
		[key: string]: T
	}
	export interface ReadonlyDictionary<T> {
		readonly [key: string]: T
	}
	export function dictionaryNotEmpty<T>(dic: ReadonlyDictionary<T>): boolean {
		return Object.keys(dic).length > 0;
	}
	export function dictionaryForEach<T>(dic: ReadonlyDictionary<T>, callback: (value: T, key: string, dic: ReadonlyDictionary<T>) => void): void;
	export function dictionaryForEach<T>(dic: Dictionary<T>, callback: (value: T, key: string, dic: Dictionary<T>) => void): void;
	export function dictionaryForEach<T>(dic: Dictionary<T> | ReadonlyDictionary<T>, callback: (value: T, key: string, dic: Dictionary<T> | ReadonlyDictionary<T>) => void): void {
		for (const key in dic) {
			if (dic.hasOwnProperty(key)) {
				callback(dic[key], key, dic);
			}
		}
	}
	
	export namespace Comparison {
		export interface Bound<T> {
			readonly value: T,
			readonly inclusive: boolean
		}
		export interface Range<T> {
			readonly low: Bound<T>,
			readonly high: Bound<T>
		}
		export type Equator<T> = (a: T, b: T) => boolean;
		export type Comparer<T> = (a: T, b: T) => number;

		export function makeBound<T>(value: T, inclusive: boolean = false): Bound<T> {
			return {
				value: value,
				inclusive: inclusive
			};
		}
		export function makeRange<T>(low: Bound<T>, high: Bound<T>): Range<T> {
			return {
				low: low,
				high: high
			};
		}
	}

	export namespace Array {
		export function fill<T>(value: T, size: number): T[] {
			const res: T[] = [];
			for (let i = 0; i < size; i++) {
				res.push(value);
			}
			return res;
		}
		export function unique<T>(arr: ReadonlyArray<T>, cmp?: Comparison.Equator<T>): T[] {
			const res: T[] = [];
			const exists = cmp ? (a: T) => res.some(b => cmp(a, b)) : (a: T) => res.indexOf(a) >= 0;
			arr.forEach(item => {
				if (!exists(item)) {
					res.push(item);
				}
			});
			return res;
		}
	}

	export abstract class Random {
		public static Standard = new class extends Random {
			protected nextImp(min: number, max: number) {
				return Math.random()*(max - min) + min;
			}
		}
		protected abstract nextImp(min: number, max: number): number;
		public next(min: number = 0, max: number = 1): number {
			return this.nextImp(min, max);
		}
		public nextInt(min: number, max: number): number {
			return Math.floor(this.nextImp(min, max));
		}
	}
	export abstract class SeededRandom<T> extends Random {
		private seed: Readonly<T>;
		public constructor(seed: T) {
			super();
			this.updateSeed(seed);
		}
		protected updateSeed(seed: T | Readonly<T>): void {
			this.seed = seed;
		}
		public getSeed(): Readonly<T> {
			return this.seed;
		}
	}
}