namespace ArrayLike {
	export type Type<T> = ReadonlyArray<T> | {
		readonly [index: number]: T,
		readonly length: number
	};
	
	export function isArrayLike(arr: any): arr is Type<any>;
	// Generic is convenience method - no actual enforcement takes place
	// Just here so that if you know an array's element type already you don't have to do an as cast after this check
	export function isArrayLike<T>(arr: any): arr is Type<T>;
	export function isArrayLike(arr: any): boolean {
		return Array.isArray(arr) || typeof arr.length === "number";
	}

	export function toArray<T>(arr: Type<T>): T[] {
		return slice(arr);
	}

	// This is mainly to get things like HTMLElement.prototype.children to spit out HTMLElements as items
	export function cast<T>(arr: Type<any>): Type<T> {
		return (arr as any) as Type<T>;
	}

	export function every<T>(arr: Type<T>, callback: (value: T, index: number, array: Type<T>) => boolean, thisArg?: any): boolean {
		return Array.prototype.every.call(arr, callback, thisArg);
	}

	export function some<T>(arr: Type<T>, callback: (value: T, index: number, array: Type<T>) => boolean, thisArg?: any): boolean {
		return Array.prototype.some.call(arr, callback, thisArg);
	}

	export function forEach<T>(arr: Type<T>, callback: (value: T, index: number, array: Type<T>) => void, thisArg?: any): void {
		return Array.prototype.forEach.call(arr, callback, thisArg);
	}

	export function reduce<T>(arr: Type<T>, callback: (previousValue: T, currentValue: T, currentIndex: number, array: Type<T>) => T, initialValue?: T): T | undefined;
	export function reduce<TItem, TAccumulator>(arr: Type<TItem>, callback: (previousValue: TAccumulator, currentValue: TItem, currentIndex: number, array: Type<TItem>) => TAccumulator, initialValue: TAccumulator): TAccumulator;
	export function reduce<TItem, TAccumulator>(arr: Type<TItem>, callback: (previousValue: TAccumulator, currentValue: TItem, currentIndex: number, array: Type<TItem>) => TAccumulator, initialValue?: TAccumulator): TAccumulator | undefined {
		return Array.prototype.reduce.call(arr, callback, initialValue);
	}

	export function reduceRight<T>(arr: Type<T>, callback: (previousValue: T, currentValue: T, currentIndex: number, array: Type<T>) => T, initialValue: T): T;
	export function reduceRight<TItem, TAccumulator>(arr: Type<TItem>, callback: (previousValue: TAccumulator, currentValue: TItem, currentIndex: number, array: Type<TItem>) => TAccumulator, initialValue: TAccumulator): TAccumulator;
	export function reduceRight<TItem, TAccumulator>(arr: Type<TItem>, callback: (previousValue: TAccumulator, currentValue: TItem, currentIndex: number, array: Type<TItem>) => TAccumulator, initialValue?: TAccumulator): TAccumulator | undefined {
		return Array.prototype.reduceRight.call(arr, callback, initialValue);
	}

	export function map<TItemIn, TItemOut>(arr: Type<TItemIn>, callback: (value: TItemIn, index: number, array: Type<TItemIn>) => TItemOut, thisArg?: any): TItemOut[] {
		return Array.prototype.map.call(arr, callback, thisArg);
	}

	export function filter<T>(arr: Type<T>, callback: (value: T, index: number, array: Type<T>) => boolean, thisArg?: any): T[] {
		return Array.prototype.filter.call(arr, callback, thisArg);
	}

	export function concat<T>(arr: Type<T>, ...arrs: (T | Type<T>)[]): T[] {
		return Array.prototype.concat.apply(toArray(arr), map<T | Type<T>, T | T[]>(arrs, (value) => {
			return isArrayLike(value) ? toArray(value) : value;
		}));
	}

	export function indexOf<T>(arr: Type<T>, item: T, fromIndex?: number): number {
		return Array.prototype.indexOf.call(arr, item, fromIndex);
	}
	export function lastIndexOf<T>(arr: Type<T>, item: T, fromIndex?: number): number {
		return Array.prototype.lastIndexOf.call(arr, item, fromIndex);
	}

	export function join<T>(arr: Type<T>, separator?: string): string {
		return Array.prototype.join.call(arr, separator);
	}

	// API difference: Does not reverse in-place
	export function reverse<T>(arr: Type<T>): T[] {
		return Array.prototype.reverse.call(toArray(arr));
	}

	export function slice<T>(arr: Type<T>, start?: number, end?: number): T[] {
		return Array.prototype.slice.call(arr, start, end);
	}

	// API difference: Does not sort in-place
	export function sort<T>(arr: Type<T>, comparer?: (a: T, b: T) => number): T[] {
		return Array.prototype.sort.call(toArray(arr), comparer);
	}

	export function toString<T>(arr: Type<T>): string {
		return Array.prototype.toString.call(arr);
	}
	export function toLocaleString<T>(arr: Type<T>): string {
		return Array.prototype.toLocaleString.call(arr);
	}
}