import AView from "./AView.js";
function settingsClick(e) {
    if (e.target.id === "delete-account") {
        e.preventDefault();
        const isConfirmed = confirm("You sure bout that?");
        if (isConfirmed)
            console.log("DELETE THE FRKN THING!!");
    }
}
function settingsInput(e) {
    console.log(e);
    // ADD USER INFORMATION CHANGE
}
export default class extends AView {
    constructor() {
        super();
        this.setTitle("Settings");
    }
    async getHtml() {
        const response = await fetch(`templates/settings.html`);
        return await response.text();
    }
    async setEventHandlers() {
        document.addEventListener("click", settingsClick);
        document.addEventListener("input", settingsInput);
    }
    async unsetEventHandlers() {
        document.removeEventListener("click", settingsClick);
        document.removeEventListener("input", settingsInput);
    }
    async setStylesheet() {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "styles/settings.css";
        document.head.appendChild(link);
    }
    async unsetStylesheet() {
        const link = document.querySelector("link[href='styles/settings.css']");
        document.head.removeChild(link);
    }
}
//# sourceMappingURL=Settings.js.map