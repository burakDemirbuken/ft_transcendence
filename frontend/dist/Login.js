import { getAuthToken } from './utils/auth.js';
import { getJsTranslations } from './I18n.js';
import { navigateTo, API_BASE_URL } from './index.js';
import { showNotification } from './notification.js';
import AView from "./AView.js";
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
async function username() {
    let trlt = await getJsTranslations(localStorage.getItem("langPref"));
    const form = document.querySelector("#loginForm");
    const formData = new FormData(form);
    const username = formData.get("username");
    if (!username)
        return showNotification(trlt.login.uname.empty, "error");
    if (username.length < 1 || username.length > 20)
        return showNotification(trlt.login.uname.length, "error");
    if (!/^[a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]+$/u.test(username))
        return showNotification(trlt.login.uname.invalid, "error");
    const address = `${API_BASE_URL}/auth/check-username?username=${username}&lang=${localStorage.getItem("langPref")}`;
    try {
        const response = await fetch(address);
        const json = await response.json();
        if (response.ok) {
            if (json.exists) {
                userRegistered = true;
                goToNextField("password");
            }
            else {
                userRegistered = false;
                goToNextField("email");
            }
        }
        else {
            showNotification(json.error, "error");
        }
    }
    catch (_a) {
        showNotification(trlt.system, "error");
    }
}
async function email() {
    let trlt = await getJsTranslations(localStorage.getItem("langPref"));
    const form = document.querySelector("#loginForm");
    const formData = new FormData(form);
    const email = formData.get("email");
    if (!email)
        return showNotification(trlt.login.email.empty, "error");
    if (email.length < 5 || email.length > 254)
        return showNotification(trlt.login.email.invalid, "error");
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/u.test(email))
        return showNotification(trlt.login.email.invalid, "error");
    goToNextField("password");
}
async function login() {
    let trlt = await getJsTranslations(localStorage.getItem("langPref"));
    const form = document.querySelector("#loginForm");
    const formData = new FormData(form);
    const password = formData.get("password");
    if (!password)
        return showNotification(trlt.login.password.empty, "error");
    if (password.length < 8 || password.length > 128)
        return showNotification(trlt.login.password.length, "error");
    const user = {
        "login": formData.get("username"),
        "password": formData.get("password")
    };
    const request = new Request(`${API_BASE_URL}/auth/login?lang=${localStorage.getItem("langPref")}`, {
        method: "POST",
        headers: new Headers({ "Content-Type": "application/json" }),
        body: JSON.stringify(user),
    });
    try {
        const response = await fetch(request);
        const json = await response.json();
        if (response.ok) {
            showNotification(json.message, "info");
            userEmail = json.email;
            goToNextField("2fa");
        }
        else
            showNotification(json.error, "error");
    }
    catch (_a) {
        showNotification(trlt.system, "error");
    }
}
async function register() {
    let trlt = await getJsTranslations(localStorage.getItem("langPref"));
    const form = document.querySelector("#loginForm");
    const formData = new FormData(form);
    const password = formData.get("password");
    if (!password)
        return showNotification(trlt.login.password.empty, "error");
    if (password.length < 8 || password.length > 128)
        return showNotification(trlt.login.password.length, "error");
    const obj = {
        "username": formData.get("username"),
        "email": formData.get("email"),
        "password": formData.get("password")
    };
    const request = new Request(`${API_BASE_URL}/auth/register?lang=${localStorage.getItem("langPref")}`, {
        method: "POST",
        headers: new Headers({ "Content-Type": "application/json" }),
        body: JSON.stringify(obj),
    });
    try {
        const response = await fetch(request);
        const json = await response.json();
        if (response.ok) {
            showNotification(json.message, "info");
            goToNextField("welcome");
        }
        else
            showNotification(json.error, "error");
    }
    catch (_a) {
        showNotification(trlt.system, "error");
    }
}
async function verify() {
    let trlt = await getJsTranslations(localStorage.getItem("langPref"));
    const form = document.querySelector("#loginForm");
    const formData = new FormData(form);
    const code = formData.get("code");
    if (!code)
        return showNotification(trlt.login.code.empty, "error");
    if (userEmail) {
        const obj = {
            "login": userEmail,
            "code": code,
            "rememberMe": rememberMe
        };
        const request = new Request(`${API_BASE_URL}/auth/verify-2fa?lang=${localStorage.getItem("langPref")}`, {
            method: "POST",
            headers: new Headers({ "Content-Type": "application/json" }),
            body: JSON.stringify(obj),
            credentials: "include",
        });
        try {
            const response = await fetch(request);
            const json = await response.json();
            if (response.ok) {
                console.log("🎉 2FA verification successful!");
                console.log("🍪 Cookies after login:", document.cookie);
                // Token'ı response'tan al ve localStorage'a kaydet
                if (json.accessToken) {
                    console.log("💾 Saving token to localStorage:", json.accessToken);
                    localStorage.setItem('authToken', json.accessToken);
                    console.log("🔑 Auth token after saving:", getAuthToken());
                }
                navigateTo("home");
            }
            else {
                showNotification(json.error, "error");
            }
        }
        catch (_a) {
            showNotification(trlt.system, "error");
        }
    }
    else
        goToNextField("password");
}
async function enter() {
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
}
async function back() {
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
}
function move(e) {
    if (e.target.classList.contains("enter"))
        enter();
    else if (e.target.classList.contains("back"))
        back();
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
    async getHtml() {
        const response = await fetch(`templates/login.html`);
        return await response.text();
    }
    async setEventHandlers() {
        currentStep = "welcome";
        document.addEventListener("click", move);
        document.addEventListener("input", growInput);
    }
    async unsetEventHandlers() {
        document.removeEventListener("click", move);
        document.removeEventListener("input", growInput);
    }
    async setStylesheet() {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "styles/login.css";
        document.head.appendChild(link);
    }
    async unsetStylesheet() {
        const link = document.querySelector("link[href='styles/login.css']");
        document.head.removeChild(link);
    }
}
//# sourceMappingURL=Login.js.map