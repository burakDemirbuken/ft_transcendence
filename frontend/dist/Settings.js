var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
    getHtml() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(`templates/settings.html`);
            return yield response.text();
        });
    }
    setEventHandlers() {
        return __awaiter(this, void 0, void 0, function* () {
            document.addEventListener("click", settingsClick);
            document.addEventListener("input", settingsInput);
        });
    }
    unsetEventHandlers() {
        return __awaiter(this, void 0, void 0, function* () {
            document.removeEventListener("click", settingsClick);
            document.removeEventListener("input", settingsInput);
        });
    }
    setStylesheet() {
        return __awaiter(this, void 0, void 0, function* () {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = "styles/settings.css";
            document.head.appendChild(link);
        });
    }
    unsetStylesheet() {
        return __awaiter(this, void 0, void 0, function* () {
            const link = document.querySelector("link[href='styles/settings.css']");
            document.head.removeChild(link);
        });
    }
}
//# sourceMappingURL=Settings.js.map