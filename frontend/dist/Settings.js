import AView from "./AView.js";
import I18n from './translations.js';
function settingsClick(e) {
    var _a;
    if (!e.target.classList.contains("current") && e.target.classList.contains("lang")) {
        if (e.target.classList.contains("eng")) {
            I18n.switchLanguage("eng", "navbar");
        }
        else if (e.target.classList.contains("deu")) {
            I18n.switchLanguage("deu", "navbar");
        }
        else if (e.target.classList.contains("tur")) {
            I18n.switchLanguage("tur", "navbar");
        }
        I18n.loadLanguage("settings");
        (_a = document.querySelector(".current")) === null || _a === void 0 ? void 0 : _a.classList.remove("current");
        e.target.classList.add("current");
    }
    // ADD DELETE ACCOUNT
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