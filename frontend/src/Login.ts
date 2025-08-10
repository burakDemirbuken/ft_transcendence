import AView from "./AView.js";

export default class extends AView {
	constructor() {
		super();
		this.setTitle("Login");
	}

	async getHtml(): Promise<string> {
		const response = await fetch(`templates/login.html`);
		return await response.text();
	}
}
