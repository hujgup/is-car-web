import { app, BrowserWindow } from "electron";
import { Promise } from "es6-promise";
import * as Path from "path";
import * as UrlImport from "url";

namespace Url {
	export type Object = UrlImport.UrlObject;
	export function local(path: string): Object {
		return {
			pathname: Path.join(__dirname, path),
			protocol: "file:"
		};
	}
	export function remote(path: string): Object {
		return {
			pathname: path,
			protocol: "http:"
		};
	}
}

namespace Window {
	export interface Spec extends Electron.BrowserWindowConstructorOptions {
		readonly url: Url.Object,
		readonly awaitLoad?: boolean
	}

	let specs: Spec[] = [];
	let windows: (BrowserWindow | undefined)[] = [];
	let activeWindows: BrowserWindow[] = [];

	// Mac OS doesn't close the program uless you Cmd+Q, so windows need to be restored sometimes
	app.addListener("window-all-closed", () => {
		if (process.platform !== "darwin") {
			app.quit();
		}
	});
	app.addListener("activate", () => {
		if (activeWindows.length === 0) {
			specs.forEach((spec, i) => {
				if (windows[i] === undefined) {
					baseCreate(spec, i);
				}
			});
		}
	});
	function baseCreate(spec: Spec, id: number) {
		let w = new BrowserWindow(spec);
		w.loadURL(UrlImport.format(spec.url));
		w.on("close", () => {
			activeWindows.splice(windows.indexOf(windows[id]), 1);
			windows[id] = undefined;
		});
		windows[id] = w;
		specs[id] = spec;
		activeWindows.push(w);
		return id;
	}
	export function createOne(spec: Spec): Promise<number> {
		return new Promise<number>(resolve => {
			app.addListener("ready", () => {
				let id = baseCreate(spec, specs.length);
				if (typeof spec.awaitLoad === "undefined" || spec.awaitLoad) {
					let w = get(id);
					w.webContents.addListener("did-finish-load", () => resolve(id));
				} else {
					resolve(id);
				}
			});
		});
	}
	export function createMany(specs: ReadonlyArray<Spec>): Promise<number>[] {
		return specs.map(spec => createOne(spec));
	}
	export function exists(id: number) {
		return windows[id] !== undefined;
	}
	export function get(id: number) {
		return windows[id] as BrowserWindow;
	}
	export function getContents(id: number) {
		return (windows[id] as BrowserWindow).webContents;
	}
	export function awaitLoad(id: number) {
		return new Promise<undefined>(resolve => {
			get(id).webContents.addListener("did-finish-load", () => resolve());
		});
	}
	export function all(): ReadonlyArray<BrowserWindow> {
		return activeWindows;
	}
	export function debug() {
		all().forEach(w => w.webContents.openDevTools());
	}
}

Window.createOne({
	url: Url.local("../index.html")
});