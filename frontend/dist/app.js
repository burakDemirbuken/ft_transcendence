"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const pageState = {
    current: "login", // default
};
const routes = {
    login: { template: "login", title: "Login" },
    "2fa": { template: "2fa", title: "2fa" },
    register: { template: "register", title: "Register" },
    profile: { template: "profile", title: "Profile" },
    home: { template: "home", title: "Home" },
};
function loadTemplate(templateName) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield fetch(`templates/${templateName}.html`);
        return yield response.text();
    });
}
let currentStep = "welcome";
let userRegistered;
function goToNextField(field) {
    let step = document.querySelector(`.field[data-step="${currentStep}"]`);
    step.classList.remove("active");
    currentStep = field;
    step = document.querySelector(`[data-step="${currentStep}"]`);
    step.classList.add("active");
}
function showError(message) {
    const form = document.querySelector("#loginForm");
    const error = document.querySelector("#error");
    error.textContent = message;
    form.classList.add('shake');
    setTimeout(() => {
        form.classList.remove('shake');
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
        const graphemeLength = [...username].length;
        if (graphemeLength < 1 || graphemeLength > 20) {
            showError("uname has to be 1-20 characters long");
            return;
        }
        if (!/^[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]+$/u.test(username)) {
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
        // send code to db for login
        navigate("profile");
    });
}
// Enter button handler
function enter() {
    return __awaiter(this, void 0, void 0, function* () {
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
;
function back() {
    return __awaiter(this, void 0, void 0, function* () {
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
;
function loadTranslations(lang) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield fetch(`locales/${lang}.json`);
        return yield response.json();
    });
}
function applyTranslations(lang) {
    return __awaiter(this, void 0, void 0, function* () {
        const translations = yield loadTranslations(lang);
        document.querySelector("[data-i18n='lang']").textContent = translations.login.lang;
        document.querySelector("[data-i18n='welcome.title']").textContent = translations.login.welcome.title;
        document.querySelector("[data-i18n='welcome.prompt']").textContent = translations.login.welcome.prompt;
        document.querySelector("[data-i18n='username']").textContent = translations.login.username;
        document.querySelector("[data-i18n='password']").textContent = translations.login.password;
        document.querySelector("[data-i18n='email']").textContent = translations.login.email;
        document.querySelector("[data-i18n='code']").textContent = translations.login.code;
        document.querySelector("[data-i18n='rme']").textContent = translations.login.rme;
    });
}
const choice = {
    eng: { next: "tur" },
    tur: { next: "deu" },
    deu: { next: "jpn" },
    jpn: { next: "eng" }
};
let currentLang = "eng";
function move(e) {
    var _a;
    if (e.type === "click") {
        if (e.target.classList.contains("enter"))
            enter();
        else if (e.target.classList.contains("back"))
            back();
    }
    else {
        if (e.key === "ArrowUp") {
            currentLang = choice[currentLang].next;
            applyTranslations(currentLang);
        }
        else if (e.key === "ArrowDown") {
            (_a = document.querySelector("#rme")) === null || _a === void 0 ? void 0 : _a.classList.toggle("active");
        }
        else if (e.key === "Enter") {
            enter();
        }
    }
}
function loadPage(page) {
    return __awaiter(this, void 0, void 0, function* () {
        const content = document.querySelector("#content");
        pageState.current = page;
        const route = routes[page];
        if (route) {
            content.innerHTML = yield loadTemplate(route.template);
            document.title = route.title;
        }
        else {
            content.innerHTML = "<h2>404</h2><p>Page not found.</p>";
        }
        currentStep = "welcome";
        document.addEventListener("keydown", move);
        document.addEventListener("click", move);
    });
}
function navigate(page) {
    history.pushState({ page }, "", `/${page}`);
    loadPage(page);
    console.log("navigate called");
}
// Handle browser back/forward
window.addEventListener("popstate", (event) => {
    const page = event.state.page || "login";
    loadPage(page);
});
// Initial load and page reloads
window.addEventListener("load", () => {
    const urlPage = window.location.pathname.slice(1);
    const initialPage = urlPage || history.state.page || "login";
    loadPage(initialPage);
    history.replaceState({ page: initialPage }, "", `/${initialPage}`);
});
//# sourceMappingURL=app.js.map