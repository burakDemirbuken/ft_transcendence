import AView from "./AView.js";

export default class extends AView {
    constructor() {
        super();
        this.setTitle("Play");
    }

    async getHtml(): Promise<string> {
        const response = await fetch(`templates/play.html`);
        return await response.text();
    }

    async setEventHandlers() {}
    async unsetEventHandlers() {}

    async setStylesheet() {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "styles/play.css"
        document.head.appendChild(link);
    }

    async unsetStylesheet() {
        const link = document.querySelector("link[href='styles/play.css']");
        if (link) document.head.removeChild(link);
    }
}