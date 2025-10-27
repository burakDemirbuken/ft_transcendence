import AView from "./AView.js";
import { getAuthToken, getAuthHeaders } from './utils/auth.js';
import { API_BASE_URL, navigateTo } from './index.js';
import { showNotification } from "./notification.js";


async function settingsClick(e) {
	if (e.target.id === "delete-account")
	{
		e.preventDefault();
		const isConfirmed = confirm("Are you sure you want to delete your account? This action cannot be undone.");
		if (isConfirmed) {
			try {
				console.log("DELETE ACCOUNT! FETCH COMES HERE!");

				const res = await fetch(`${API_BASE_URL}/auth/profile`,
				{
					method: 'DELETE',
					credentials: 'include',

				});
				const json = await res.json();
				if (res.ok) {
					showNotification(json.message, "success");
					navigateTo("login");
				} else {
					showNotification(json.error, "error");
				}
			} catch (error) {
				showNotification(`System Error: ${error.message}`, "error");
			}
		}
	}
}

function changeAvatar(e) {
	console.log("CHANGE AVATAR");
	console.log(e);
	const inpt = document.getElementById('hidden-file-input');
	inpt.click();
	console.log(inpt);
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
		document.querySelector(".avatar").addEventListener("click", changeAvatar);
		document.getElementById('hidden-file-input').addEventListener('click', (e) => {
			e.stopPropagation();
		});
		document.getElementById("delete-account").addEventListener("click", settingsClick);
		onLoad(); // Profile yüklendiğinde onLoad fonksiyonunu çağır
	}

	async unsetEventHandlers() {
		document.removeEventListener("click", settingsClick);
		const buttons = document.querySelectorAll(".submit");
		buttons.forEach(button => button.removeEventListener("click", sendChangeReq));
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
	const hasToken = getAuthToken();
	if (!hasToken)
		return ( window.location.href = 'login' );

	try
	{
		const meReq = await fetch(`${API_BASE_URL}/auth/me`,
		{
			credentials: 'include',
			headers:
			{
				'Content-Type': 'application/json',
				...getAuthHeaders()
			}
		});

		if (meReq.ok) {
			const profileData = await meReq.json();
			console.log(profileData);
			document.querySelector('input[name="uname"]').setAttribute('value', profileData?.user?.username ?? '');
			document.querySelector('input[name="email"]').setAttribute('value', profileData?.user?.email ?? '');

			const profileReq = await fetch(`${API_BASE_URL}/profile/profile?userName=${profileData?.user?.username}`,
			{
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
					...getAuthHeaders()
				}
			});

			if (profileReq.ok) {
				const user = await profileReq.json();
				console.log(user);
				document.querySelector('input[name="dname"]').setAttribute('value', user.profile.displayName ?? '');
			} else
				console.error("❌ Failed to fetch profile data:", profileReq.statusText);
		} else {
			if (meReq.status === 401) {
				navigateTo("login");
			}
		}
	} catch (error) {
		navigateTo("login");
	}
}