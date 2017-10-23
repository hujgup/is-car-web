"use strict";

namespace Ajax {
	export enum Method {
		OPTIONS = "OPTIONS",
		GET = "GET",
		HEAD = "HEAD",
		POST = "POST",
		PUT = "PUT",
		DELETE = "DELETE",
		TRACE = "TRACE",
		CONNECT = "CONNECT"
	}

	export enum Header {
		ACCEPT = "Accept",
		ACCEPT_LANGUAGE = "Accept-Language",
		AUTHORIZATION =  "Authorization",
		CACHE_CONTROL =  "Cache-Control",
		CONTENT_TYPE =  "Content-Type",
		FROM =  "From",
		IF_MATCH =  "If-Match",
		IF_MODIFIED_SINCE =  "If-Modified-Since",
		IF_NONE_MATCH =  "If-None-Match",
		IF_RANGE =  "If-Range",
		IF_UNMOFIFIED_SINCE =  "If-Unmodified-Since",
		MAX_FORWARDS =  "Max-Forwards",
		PRAGMA =  "Pragma",
		RANGE =  "Range",
		WARNING =  "Warning"
	}

	export interface Response {
		readonly error: boolean,
		readonly status: number,
		readonly text: string,
		readonly type: string
		readonly xml?: Document,
		readonly json?: any
	}

	function makeResponse(req?: XMLHttpRequest): Response {
		let res;
		if (typeof req === "undefined") {
			res = {
				error: true,
				status: 0,
				text: "",
				type: "text/plain"
			};
		} else {
			res = {
				error: req.status >= 400 || req.status === 0,
				status: req.status,
				text: req.responseText,
				type: req.responseType,
				xml: req.responseXML !== null ? req.responseXML : undefined,
				json: req.responseType as string === "application/json" ? JSON.parse(req.responseText) : undefined
			};
		}
		return res;
	}

	export function responseIsSuccess(x: Response): boolean {
		return !x.error && typeof x.text !== "undefined";
	}

	export type Callback = (res: Response) => void;

	interface QueueItem {
		readonly request: Request,
		readonly callback: Callback,
		readonly mime?: string
	}

	const MAX_THREADS = 16;
	const queue: QueueItem[] = [];
	let threads = 0;
	setInterval(() => {
		while (queue.length > 0 && threads < MAX_THREADS) {
			threads++;
			let item = queue.shift() as QueueItem;
			item.request.execute((res: Response) => {
				threads--;
				item.callback(res);
			}, item.mime);
		}
	}, 16);

	export class Request {
		private readonly headers: Utils.Dictionary<string>;
		private readonly method: Method;
		private readonly url: string;
		private data: Utils.Dictionary<string>;
		public constructor(method: Method, url: string) {
			this.headers = {};
			this.data = {};
			this.method = method;
			this.url = url;
		}
		private encodeData(appendTo?: string) {
			const preExisting = typeof appendTo === "string";
			appendTo = preExisting ? appendTo as string : "";
			let append = "";
			if (preExisting) {
				append += appendTo.indexOf("?") >= 0 ? "&" : "?";
			}
			for (const key in this.data) {
				if (this.data.hasOwnProperty(key)) {
					append += encodeURIComponent(key);
					append += "=";
					append += encodeURIComponent(this.data[key]);
					append += "&";
				}
			}
			append = append.substr(0, append.length - 1);
			appendTo += append;
			return appendTo;
		}
		public getMethod() {
			return this.method;
		}
		public getUrl() {
			return this.url;
		}
		public getData() {
			return this.data;
		}
		public setData(data: Utils.Dictionary<string>) {
			this.data = data;
		}
		public hasHeader(key: Header) {
			return this.headers.hasOwnProperty(key);
		}
		public getHeader(key: Header) {
			return this.hasHeader(key) ? this.headers[key] : undefined;
		}
		public setHeader(key: Header, value: string) {
			this.headers[key] = value;
		}
		public unsetHeader(key: Header) {
			if (this.hasHeader(key)) {
				delete this.headers[key];
			}
		}
		public queue(callback: Callback, mime?: string) {
			queue.push({
				request: this,
				callback: callback,
				mime: mime
			});
		}
		public execute(callback: Callback, mime?: string) {
			const hasMime = typeof mime === "string";
			const isPost = this.method === Method.POST;
			const hasData = Utils.dictionaryNotEmpty(this.data);
			let url = this.url;
			if (hasData && !isPost) {
				url = this.encodeData(url);
			}
			const req = new XMLHttpRequest();
			req.open(this.method, url, true);
			if (isPost) {
				req.setRequestHeader(Header.CONTENT_TYPE, "application/x-www-form-urlencoded");
			}
			for (const key in this.headers) {
				if (this.headers.hasOwnProperty(key)) {
					req.setRequestHeader(key, this.headers[key]);
				}
			}
			req.onreadystatechange = () => {
				if (req.readyState === 4) {
					callback(makeResponse(req));
				}
			};
			req.onabort = () => {
				callback(makeResponse());
			};
			if (hasMime) {
				req.overrideMimeType(mime as string);
			}
			if (hasData && isPost) {
				req.send(this.encodeData());
			} else {
				req.send();
			}
		}
	}
}