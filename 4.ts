import AView from "./AView.js";

let currentlyOpen: HTMLDetailsElement | null = null;

function toggle(e: Event) {
    // Implementation for toggle function
    const target = e.target as HTMLDetailsElement;
    // Add your toggle logic here
}

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
        detailsElements.forEach(details => {
            details.removeEventListener('click', toggle);
        });
    }

    async setStylesheet() {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "styles/settings.css"
        document.head.appendChild(link);
    }

    async unsetStylesheet() {
        const link = document.querySelector("link[href='styles/settings.css']");
        if (link) document.head.removeChild(link);
    }
}