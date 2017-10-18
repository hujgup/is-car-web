window.addEventListener("DOMContentLoaded", () => {
	if (Utils.query().hasOwnProperty("port") && Utils.query().hasOwnProperty("status") && Utils.query().hasOwnProperty("request") && Utils.query().hasOwnProperty("response")) {
		(document.getElementById("car") as HTMLElement).textContent = Utils.query().port;
		(document.getElementById("request") as HTMLElement).textContent = Utils.expandJsonString(Utils.query().request);
		let response = document.getElementById("response") as HTMLElement;
		let text = "HTTP " + Utils.query().status + "\n\n";
		if (Utils.query().response.length > 0) {
			text += Utils.expandJsonString(Utils.query().response);
		} else {
			text += "ERR: No JSON.";
		}
		response.textContent =  text;
	} else {
		document.body.appendChild(document.createTextNode("ERR: Query params \"port\", \"status\" \"request\", and \"response\" should all be defined (direct access causes this error)."));
	}
});