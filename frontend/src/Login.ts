import AView from "./AView.js";
import { navigateTo } from './index.js';
import I18n from './translations.js';

let currentStep:string = "welcome";
let userRegistered:boolean;
let rememberMe:boolean = false;
let userEmail:string;

function goToNextField(field)
{
	let step = document.querySelector(`.field[data-step="${currentStep}"]`);
	step.classList.remove("active");
	step?.setAttribute("inert", "");
	currentStep = field;
	step = document.querySelector(`[data-step="${currentStep}"]`);
	step.classList.add("active");
	step?.removeAttribute("inert");
}

function showError(message:string)
{
	const activeField = document.querySelector(".active");
	const error = document.querySelector("#error");
	error.textContent = message;
	activeField.classList.add('shake')
	setTimeout(() => {
		activeField.classList.remove('shake');
	}, 500);
}

async function username() {
	const form = document.querySelector("#loginForm");
	const formData = new FormData(form);
	const username:string = formData.get("username");

	if (!username) {
		showError("uname cant be empty");
		return ;
	}

	if (username.length < 1 || username.length > 20) {
		showError("uname has to be 1-20 characters long");
		return ;
	}

	if (!/^[a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]+$/u.test(username)) {
		showError("uname has to be valid characters")
		return ;
	}

	const address = `http://localhost:3000/api/users/checkUsername?username=${username}`;
	const response = await fetch(address);
	const json = await response.json();
	if(json.exists) {
		userRegistered = true;
		goToNextField("password");
	} else {
		userRegistered = false;
		goToNextField("email");
	}
}

async function email()
{
	const form = document.querySelector("#loginForm");
	const formData = new FormData(form);
	const email:string = formData.get("email");

	if (!email) {
		showError("email can't be empty");
		return ;
	}

	if (email.length < 5 || email.length > 254) {
		showError("invalid email");
		return ;
	}

	if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/u.test(email)) {
		showError("invalid email")
		return ;
	}

	goToNextField("password");
}

async function login() {
	const form = document.querySelector("#loginForm");
	const formData = new FormData(form);
	const password:string = formData.get("password");

	if (!password) {
		showError("password can't be empty");
		return ;
	}

	if (password.length < 4 || password.length > 128) {
		showError("invalid password");
		return ;
	}

	const user:Object = {
		"username": formData.get("username"),
		"password": formData.get("password")
	};

	const request = new Request("http://localhost:3000/api/users/login", {
		method: "POST",
		headers: new Headers({ "Content-Type": "application/json" }),
		body: JSON.stringify(user),
	});

	console.log("sends");
	const response = await fetch(request);
	console.log("responds");
	const json = await response.json();
	if (response.ok) {
		document.querySelector("#error").textContent = json.message;
		userEmail = json.email;
		goToNextField("2fa")
	}
	else
		showError(json.error);
}

async function register() {
	const form = document.querySelector("#loginForm");
	const formData = new FormData(form);
	const password:string = formData.get("password");

	if (!password) {
		showError("password can't be empty");
		return ;
	}

	if (password.length < 8 || password.length > 128) {
		showError("invalid password");
		return ;
	}

	const obj:Object = {
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
		document.querySelector("#error").textContent = json.message;
		goToNextField("2fa");
	}
	else
		showError(json.error);
}

async function verify()
{
	const form = document.querySelector("#loginForm");
	const formData = new FormData(form);
	const code:string = formData.get("code");

	if (!code) {
		showError("code can't be empty");
		return ;
	}

	if (userEmail)
	{
		const obj:Object = {
			"email": userEmail,
			"code":  code,
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
	document.querySelector("#error")?.textContent = "";
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
	document.querySelector("#error")?.textContent = "";
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

	const content = document.querySelector("#content");
	const dataFields = content.querySelectorAll("[data-i18n]");
	dataFields.forEach(datai18n => {
		const nestedKeys = datai18n.getAttribute("data-i18n");
		const keys = nestedKeys.split('.');

		console.log(`The keys: ${keys}`);
		let translation = translations.login;
		for (const key of keys)
		{
			console.log(`Current key: ${key}`);
			console.log(`Current object: ${JSON.stringify(translation, null, 2)}`);
			translation = translation[key];
			console.log(`Object after child: ${translation}`);
 			if (translation === undefined)
				break;
		}

		if (translation !== undefined)
			datai18n.textContent = translation;
	});
}

function move(e) {
	if (e.target.classList.contains("enter"))
		enter();
	else if (e.target.classList.contains("back"))
		back();
	else if (e.target.matches("#lang")) {
		applyTranslations();
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
		document.head.removeChild(link);
	}
}
