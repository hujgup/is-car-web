"use strict";

namespace Utils {
	export function assertNever(x: never) {
		throw new Error("Value should never be possible.");
	}

	export function expandJsonString(json: string): string {
		return JSON.stringify(JSON.parse(json), null, "\t");
	}

	let queryObj: Dictionary<string>;
	export function query() {
		if (typeof queryObj === "undefined") {
			let queryStr = location.search.substr(1).split("&");
			queryObj = {};
			queryStr.forEach(kvp => {
				let kvp2 = kvp.split("=", 2);
				queryObj[decodeURIComponent(kvp2[0])] = decodeURIComponent(kvp2[1]);
			});
		}
		return queryObj;
	}

	export function asyncFormSubmit(form: HTMLFormElement, promise: (this: HTMLFormElement, event: Event) => Promise<string>, errorHandler?: (err?: any | null) => void) {
		form.onsubmit = event => {
			(promise.call(form, event) as Promise<string>)
				.then(redirect => location.href = redirect)
				.catch(err => {
					if (errorHandler !== undefined) {
						errorHandler(err);
					}
				});
			event.returnValue = false;
			return false;
		};
	}

	export interface Dictionary<T> {
		[key: string]: T
	}
	export function dictionaryNotEmpty<T>(dic: Dictionary<T>): boolean {
		return Object.keys(dic).length > 0;
	}
	
	export namespace Comparison {
		export interface Bound<T> {
			value: T,
			inclusive: boolean
		}
		export interface Range<T> {
			low: Bound<T>,
			high: Bound<T>
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
			let res: T[] = [];
			for (let i = 0; i < size; i++) {
				res.push(value);
			}
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