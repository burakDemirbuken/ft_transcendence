import AView from "./AView.js";
import { getAuthToken, getAuthHeaders } from './utils/auth.js';
import { API_BASE_URL } from './index.js';


function settingsClick(e) {
	if (e.target.id === "delete-account")
	{
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

async function sendChangeReq(e) {
	e.preventDefault();
	console.log("SEND CHANGE REQ");
	console.log(e);

	const form = e.target.closest('form');
	const formData = new FormData(form);
	const inputs = Object.fromEntries(formData);
	const getProfileDatas = await fetch(form.action,
	{
		method: form.method.toUpperCase(),
		credentials: 'include',
		headers:
		{
			'Content-Type': 'application/json',
			...getAuthHeaders()
		},
		body: JSON.stringify({userName: "bkorkut", ...inputs})
	});
	if (getProfileDatas.ok)
		console.log(await getProfileDatas.json());
}

export default class extends AView {
	constructor() {
		super();
		this.setTitle("Settings");
	}

	async getHtml(): Promise<string> {
		const response = await fetch(`templates/settings.html`);
		return await response.text();
	}

	async setEventHandlers() {
		const buttons = document.querySelectorAll(".submit");
		buttons.forEach(button => button.addEventListener("click", sendChangeReq));
		document.addEventListener("click", settingsClick);
		document.addEventListener("input", settingsInput);
		onLoad(); // Profile yüklendiğinde onLoad fonksiyonunu çağır
	}

	async unsetEventHandlers() {
		document.removeEventListener("click", settingsClick);
		document.removeEventListener("input", settingsInput);
	}

	async setStylesheet() {
		const link = document.createElement("link");
		link.rel = "stylesheet";
		link.href = "styles/settings.css"
		document.head.appendChild(link);
	}

	async unsetStylesheet() {
		const link = document.querySelector("link[href='styles/settings.css']");
		document.head.removeChild(link);
	}
}

async function onLoad()
{
	const hasToken = getAuthToken() || document.cookie.includes('accessToken') || document.cookie.includes('authStatus');

	if (!hasToken)
		return ( window.location.href = '#login' );

	try
	{
		const getProfileDatas = await fetch(`${API_BASE_URL}/auth/me`,
		{
			credentials: 'include',
			headers:
			{
				'Content-Type': 'application/json',
				...getAuthHeaders()
			}
		});
		console.log(await getProfileDatas.json());
	} catch (error)
	{
		window.location.href = '#login';
	}
}