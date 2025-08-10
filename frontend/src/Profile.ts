import AView from "./AView.js";

export default class extends AView {
	constructor() {
		super();
		this.setTitle("Profile");
	}

	async getHtml(): Promise<string> {
		const response = await fetch(`templates/profile.html`);
		return await response.text();
	}
}
