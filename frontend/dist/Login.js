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
import { navigateTo } from './index.js';
import I18n from './translations.js';
let currentStep = "welcome";
let userRegistered;
let rememberMe = false;
let userEmail;
function goToNextField(field) {
    let step = document.querySelector(`.field[data-step="${currentStep}"]`);
    step.classList.remove("active");
    step === null || step === void 0 ? void 0 : step.setAttribute("inert", "");
    currentStep = field;
    step = document.querySelector(`[data-step="${currentStep}"]`);
    step.classList.add("active");
    step === null || step === void 0 ? void 0 : step.removeAttribute("inert");
}
function showError(message) {
    const activeField = document.querySelector(".active");
    const error = document.querySelector("#error");
    error.textContent = message;
    activeField.classList.add('shake');
    setTimeout(() => {
        activeField.classList.remove('shake');
    }, 500);
}
function username() {
    return __awaiter(this, void 0, void 0, function* () {
        const form = document.querySelector("#loginForm");
        const formData = new FormData(form);
        const username = formData.get("username");
        if (!username) {
            showError("uname cant be empty");
            return;
        }
        if (username.length < 1 || username.length > 20) {
            showError("uname has to be 1-20 characters long");
            return;
        }
        if (!/^[a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]+$/u.test(username)) {
            showError("uname has to be valid characters");
            return;
        }
        const address = `http://localhost:3000/api/users/checkUsername?username=${username}`;
        const response = yield fetch(address);
        const json = yield response.json();
        if (json.exists) {
            userRegistered = true;
            goToNextField("password");
        }
        else {
            userRegistered = false;
            goToNextField("email");
        }
    });
}
function email() {
    return __awaiter(this, void 0, void 0, function* () {
        const form = document.querySelector("#loginForm");
        const formData = new FormData(form);
        const email = formData.get("email");
        if (!email) {
            showError("email can't be empty");
            return;
        }
        if (email.length < 5 || email.length > 254) {
            showError("invalid email");
            return;
        }
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/u.test(email)) {
            showError("invalid email");
            return;
        }
        goToNextField("password");
    });
}
function login() {
    return __awaiter(this, void 0, void 0, function* () {
        const form = document.querySelector("#loginForm");
        const formData = new FormData(form);
        const password = formData.get("password");
        if (!password) {
            showError("password can't be empty");
            return;
        }
        if (password.length < 4 || password.length > 128) {
            showError("invalid password");
            return;
        }
        const user = {
            "username": formData.get("username"),
            "password": formData.get("password")
        };
        const request = new Request("http://localhost:3000/api/users/login", {
            method: "POST",
            headers: new Headers({ "Content-Type": "application/json" }),
            body: JSON.stringify(user),
        });
        console.log("sends");
        const response = yield fetch(request);
        console.log("responds");
        const json = yield response.json();
        if (response.ok) {
            document.querySelector("#error").textContent = json.message;
            userEmail = json.email;
            goToNextField("2fa");
        }
        else
            showError(json.error);
    });
}
function register() {
    return __awaiter(this, void 0, void 0, function* () {
        const form = document.querySelector("#loginForm");
        const formData = new FormData(form);
        const password = formData.get("password");
        if (!password) {
            showError("password can't be empty");
            return;
        }
        if (password.length < 8 || password.length > 128) {
            showError("invalid password");
            return;
        }
        const obj = {
            "username": formData.get("username"),
            "email": formData.get("email"),
            "password": formData.get("password")
        };
        const request = new Request("http://localhost:3000/api/users/register", {
            method: "POST",
            headers: new Headers({ "Content-Type": "application/json" }),
            body: JSON.stringify(obj),
        });
        const response = yield fetch(request);
        const json = yield response.json();
        if (response.ok) {
            document.querySelector("#error").textContent = json.message;
            goToNextField("2fa");
        }
        else
            showError(json.error);
    });
}
function verify() {
    return __awaiter(this, void 0, void 0, function* () {
        const form = document.querySelector("#loginForm");
        const formData = new FormData(form);
        const code = formData.get("code");
        if (!code) {
            showError("code can't be empty");
            return;
        }
        if (userEmail) {
            const obj = {
                "email": userEmail,
                "code": code,
                "rememberMe": rememberMe
            };
            const request = new Request("http://localhost:3000/api/users/verify-2fa", {
                method: "POST",
                headers: new Headers({ "Content-Type": "application/json" }),
                body: JSON.stringify(obj),
            });
            const response = yield fetch(request);
            const json = yield response.json();
            if (response.ok)
                navigateTo("profile");
            else
                showError("Login Fail");
        }
        else
            goToNextField("password");
    });
}
function enter() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        (_a = document.querySelector("#error")) === null || _a === void 0 ? void 0 : _a.textContent = "";
        switch (currentStep) {
            case "welcome":
                goToNextField("username");
                break;
            case "username":
                username();
                break;
            case "email":
                email();
                break;
            case "password":
                if (userRegistered) {
                    login();
                }
                else {
                    register();
                }
                break;
            case "2fa":
                verify();
                break;
        }
    });
}
function back() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        (_a = document.querySelector("#error")) === null || _a === void 0 ? void 0 : _a.textContent = "";
        switch (currentStep) {
            case "welcome":
                break;
            case "username":
                goToNextField("welcome");
                break;
            case "email":
                goToNextField("username");
                break;
            case "password":
                if (userRegistered)
                    goToNextField("username");
                else
                    goToNextField("email");
                break;
            case "2fa":
                goToNextField("password");
                break;
        }
    });
}
function move(e) {
    if (e.target.classList.contains("enter"))
        enter();
    else if (e.target.classList.contains("back"))
        back();
    else if (e.target.matches("#lang")) {
        I18n.nextLanguage();
    }
    else if (e.target.matches("#rme")) {
        rememberMe = !rememberMe;
        e.target.classList.toggle("active");
    }
}
function growInput(e) {
    e.target.style.width = (Math.max(e.target.value.length, 1) + 2) + "ch";
}
export default class extends AView {
    constructor() {
        super();
        this.setTitle("Login");
    }
    getHtml() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(`templates/login.html`);
            return yield response.text();
        });
    }
    setEventHandlers() {
        return __awaiter(this, void 0, void 0, function* () {
            currentStep = "welcome";
            document.addEventListener("click", move);
            document.addEventListener("input", growInput);
        });
    }
    unsetEventHandlers() {
        return __awaiter(this, void 0, void 0, function* () {
            document.removeEventListener("click", move);
            document.removeEventListener("input", growInput);
        });
    }
    setStylesheet() {
        return __awaiter(this, void 0, void 0, function* () {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = "styles/login.css";
            document.head.appendChild(link);
        });
    }
    unsetStylesheet() {
        return __awaiter(this, void 0, void 0, function* () {
            const link = document.querySelector("link[href='styles/login.css']");
            document.head.removeChild(link);
        });
    }
}
//# sourceMappingURL=Login.js.map