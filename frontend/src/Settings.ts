import AView from "./AView.js";

let currentlyOpen = null;

// async function toggle(e) {
// }

export default class extends AView {
	constructor() {
		super();
		this.setTitle("Settings");
	}

	async getHtml(): Promise<string> {
		const response = await fetch(`templates/settings.html`);
		return await response.text();
	}

	async setEventHandlers() {
		const detailsElements = document.querySelectorAll('details');

		detailsElements.forEach(details => {
			details.addEventListener('click', toggle);
		});
	}

	async unsetEventHandlers() {
		const detailsElements = document.querySelectorAll('details');

		// detailsElements.forEach(details => {
		// 	details.removeEventListener('click', toggle);
		// });
	}

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
