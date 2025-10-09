import AView from "./AView.js";
import { navigateTo } from './index.js';
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
async function username() {
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
    const address = `https://localhost:8080/api/auth/check-username?username=${username}&lang=${localStorage.getItem("langPref")}`;
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
            showError(json.error);
        }
    }
    catch (_a) {
        showError("System error");
    }
}
async function email() {
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
}
async function login() {
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
    const user = {
        "login": formData.get("username"),
        "password": formData.get("password")
    };
    const request = new Request(`https://localhost:8080/api/auth/login?lang=${localStorage.getItem("langPref")}`, {
        method: "POST",
        headers: new Headers({ "Content-Type": "application/json" }),
        body: JSON.stringify(user),
    });
    try {
        const response = await fetch(request);
        const json = await response.json();
        if (response.ok) {
            document.querySelector("#error").textContent = json.message;
            userEmail = json.email;
            goToNextField("2fa");
        }
        else
            showError(json.error);
    }
    catch (_a) {
    }
}
async function register() {
    const form = document.querySelector("#loginForm");
    const formData = new FormData(form);
    const password = formData.get("password");
    console.log("deb4");
    if (!password) {
        showError("password can't be empty");
        return;
    }
    console.log("deb3");
    if (password.length < 8 || password.length > 128) {
        showError("invalid password");
        return;
    }
    console.log("deb2");
    const obj = {
        "username": formData.get("username"),
        "email": formData.get("email"),
        "password": formData.get("password")
    };
    console.log("deb1");
    const request = new Request(`https://localhost:8080/api/auth/register?lang=${localStorage.getItem("langPref")}`, {
        method: "POST",
        headers: new Headers({ "Content-Type": "application/json" }),
        body: JSON.stringify(obj),
    });
    console.log("deb5");
    const response = await fetch(request);
    console.log(response);
    const json = await response.json();
    if (response.ok) {
        document.querySelector("#error").textContent = json.message;
        goToNextField("welcome");
    }
    else
        showError(json.error);
}
async function verify() {
    const form = document.querySelector("#loginForm");
    const formData = new FormData(form);
    const code = formData.get("code");
    if (!code) {
        showError("code can't be empty");
        return;
    }
    if (userEmail) {
        const obj = {
            "login": userEmail,
            "code": code,
            "rememberMe": rememberMe
        };
        const request = new Request(`https://localhost:8080/api/auth/verify-2fa?lang=${localStorage.getItem("langPref")}`, {
            method: "POST",
            headers: new Headers({ "Content-Type": "application/json" }),
            body: JSON.stringify(obj),
        });
        const response = await fetch(request);
        const json = await response.json();
        if (response.ok)
            navigateTo("home");
        else
            showError("Login Fail");
    }
    else
        goToNextField("password");
}
async function enter() {
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
}
async function back() {
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