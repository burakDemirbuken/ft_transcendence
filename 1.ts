import AView from "./AView.js";
import { navigateTo } from './index.js';
import I18n from './translations.js';

let currentStep: string = "welcome";
let userRegistered: boolean;
let rememberMe: boolean = false;
let userEmail: string;

function goToNextField(field: string) {
    let step = document.querySelector(`.field[data-step="${currentStep}"]`);
    step?.classList.remove("active");
    step?.setAttribute("inert", "");
    currentStep = field;
    step = document.querySelector(`[data-step="${currentStep}"]`);
    step?.classList.add("active");
    step?.removeAttribute("inert");
}

function showError(message: string) {
    const form = document.querySelector("#loginForm");
    const error = document.querySelector("#error");
    if (error) error.textContent = message;
    if (form) {
        form.classList.add('shake');
        setTimeout(() => {
            form.classList.remove('shake');
        }, 500);
    }
}

async function username() {
    const form = document.querySelector("#loginForm") as HTMLFormElement;
    if (!form) return;
    
    const formData = new FormData(form);
    const username = formData.get("username") as string;

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
        showError("uname has to be valid characters")
        return;
    }

    const address = `http://localhost:3000/api/users/checkUsername?username=${username}`;
    const response = await fetch(address);
    const json = await response.json();
    if (json.exists) {
        userRegistered = true;
        goToNextField("password");
    } else {
        userRegistered = false;
        goToNextField("email");
    }
}

async function email() {
    const form = document.querySelector("#loginForm") as HTMLFormElement;
    if (!form) return;
    
    const formData = new FormData(form);
    const email = formData.get("email") as string;

    if (!email) {
        showError("email can't be empty");
        return;
    }

    if (email.length < 5 || email.length > 254) {
        showError("invalid email");
        return;
    }

    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/u.test(email)) {
        showError("invalid email")
        return;
    }

    goToNextField("password");
}

async function login() {
    const form = document.querySelector("#loginForm") as HTMLFormElement;
    if (!form) return;
    
    const formData = new FormData(form);
    const password = formData.get("password") as string;

    if (!password) {
        showError("password can't be empty");
        return;
    }

    if (password.length < 4 || password.length > 128) {
        showError("invalid password");
        return;
    }

    const user: Object = {
        "username": formData.get("username"),
        "password": formData.get("password")
    };

    const request = new Request("http://localhost:3000/api/users/login", {
        method: "POST",
        headers: new Headers({ "Content-Type": "application/json" }),
        body: JSON.stringify(user),
    });

    const response = await fetch(request);
    const json = await response.json();
    if (response.ok) {
        const errorElement = document.querySelector("#error");
        if (errorElement) errorElement.textContent = json.message;
        userEmail = json.email;
        goToNextField("2fa")
    }
    else
        showError(json.error);
}

async function register() {
    const form = document.querySelector("#loginForm") as HTMLFormElement;
    if (!form) return;
    
    const formData = new FormData(form);
    const password = formData.get("password") as string;

    if (!password) {
        showError("password can't be empty");
        return;
    }

    if (password.length < 8 || password.length > 128) {
        showError("invalid password");
        return;
    }

    const obj: Object = {
        "username": formData.get("username"),
        "email": formData.get("email"),
        "password": formData.get("password")
    };

    const request = new Request("http://localhost:3000/api/users/register", {
        method: "POST",
        headers: new Headers({ "Content-Type": "application/json" }),
        body: JSON.stringify(obj),
    });
    const response = await fetch(request);
    const json = await response.json();
    if (response.ok) {
        const errorElement = document.querySelector("#error");
        if (errorElement) errorElement.textContent = json.message;
        goToNextField("2fa");
    }
    else
        showError(json.error);
}

async function verify() {
    const form = document.querySelector("#loginForm") as HTMLFormElement;
    if (!form) return;
    
    const formData = new FormData(form);
    const code = formData.get("code") as string;

    if (!code) {
        showError("code can't be empty");
        return;
    }

    if (userEmail) {
        const obj: Object = {
            "email": userEmail,
            "code": code,
            "rememberMe": rememberMe
        };

        const request = new Request("http://localhost:3000/api/users/verify-2fa", {
            method: "POST",
            headers: new Headers({ "Content-Type": "application/json" }),
            body: JSON.stringify(obj),
        });
        const response = await fetch(request);
        const json = await response.json();
        if (response.ok)
            navigateTo("profile");
        else
            showError("Login Fail");
    }
    else
        goToNextField("password");
}

async function enter() {
    const errorElement = document.querySelector("#error");
    if (errorElement) errorElement.textContent = "";
    
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
            } else {
                register();
            }
            break;
        case "2fa":
            verify();
            break;
    }
}

async function back() {
    const errorElement = document.querySelector("#error");
    if (errorElement) errorElement.textContent = "";
    
    switch (currentStep) {
        case "welcome":
            break;
        case "username":
            goToNextField("welcome");
            break;
        case "email":
            goToNextField("username")
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

async function applyTranslations() {
    const translations = await I18n.nextLanguage();
    const langElement = document.querySelector("[data-i18n='lang']");
    const welcomeTitleElement = document.querySelector("[data-i18n='welcome.title']");
    const welcomePromptElement = document.querySelector("[data-i18n='welcome.prompt']");
    const usernameElement = document.querySelector("[data-i18n='username']");
    const passwordElement = document.querySelector("[data-i18n='password']");
    const emailElement = document.querySelector("[data-i18n='email']");
    const codeElement = document.querySelector("[data-i18n='code']");
    const rmeElement = document.querySelector("[data-i18n='rme']");

    if (langElement) langElement.textContent = translations.login.lang;
    if (welcomeTitleElement) welcomeTitleElement.textContent = translations.login.welcome.title;
    if (welcomePromptElement) welcomePromptElement.textContent = translations.login.welcome.prompt;
    if (usernameElement) usernameElement.textContent = translations.login.username;
    if (passwordElement) passwordElement.textContent = translations.login.password;
    if (emailElement) emailElement.textContent = translations.login.email;
    if (codeElement) codeElement.textContent = translations.login.code;
    if (rmeElement) rmeElement.textContent = translations.login.rme;
}

function move(e: Event) {
    const target = e.target as HTMLElement;
    if (target.classList.contains("enter"))
        enter();
    else if (target.classList.contains("back"))
        back();
    else if (target.matches("#lang")) {
        applyTranslations();
    }
    else if (target.matches("#rme")) {
        rememberMe = !rememberMe;
        target.classList.toggle("active");
    }
}

function growInput(e: Event) {
    const target = e.target as HTMLInputElement;
    target.style.width = (Math.max(target.value.length, 1) + 2) + "ch";
}

export default class extends AView {
    constructor() {
        super();
        this.setTitle("Login");
    }

    async getHtml(): Promise<string> {
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
        link.href = "styles/login.css"
        document.head.appendChild(link);
    }

    async unsetStylesheet() {
        const link = document.querySelector("link[href='styles/login.css']");
        if (link) document.head.removeChild(link);
    }
}