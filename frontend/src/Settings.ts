import AView from "./AView.js";

export default class extends AView {
	constructor() {
		super();
		this.setTitle("Settings");
	}

	async getHtml(): Promise<string> {
		const response = await fetch(`templates/settings.html`);
		return await response.text();
	}

	async setEventHandlers() {}
	async unsetEventHandlers() {}

	async setStylesheet() {
		const link = document.createElement("link");
		link.rel = "stylesheet";
		link.href = "styles/settings.css"
		document.head.appendChild(link);
	}

	async unsetStylesheet() {
		const link = document.querySelector("link[href='styles/settings.css']");
		document.head.removeChild(link);
	}
}
