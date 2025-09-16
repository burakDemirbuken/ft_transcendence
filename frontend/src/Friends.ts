import AView from "./AView.js";

export default class extends AView {
	constructor() {
		super();
		this.setTitle("Friends");
	}

	async getHtml(): Promise<string> {
		const response = await fetch(`templates/friends.html`);
		return await response.text();
	}

	async setEventHandlers() {}
	async unsetEventHandlers() {}

	async setStylesheet() {
		const link = document.createElement("link");
		link.rel = "stylesheet";
		link.href = "styles/friends.css"
		document.head.appendChild(link);
	}

	async unsetStylesheet() {
		const link = document.querySelector("link[href='styles/friends.css']");
		document.head.removeChild(link);
	}
}
