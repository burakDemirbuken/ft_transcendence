import AView from "./AView.js";
import { getAuthToken, getAuthHeaders } from './utils/auth.js';
import { API_BASE_URL, navigateTo } from './index.js';
import { showNotification } from "./notification.js";

let currentUserName = null;

async function deleteAccount(e) {
	e.preventDefault();
	const isConfirmed = confirm("Are you sure you want to delete your account? This action cannot be undone");
	if (isConfirmed) {
		try {
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

function changeAvatar() {
	document.getElementById('hidden-file-input')?.click();
}

async function sendAvatarChangeReq(e) {
	e.preventDefault();
	console.log("SEND AVATAR CHANGE REQ");

	try {
		const formData = new FormData();
		formData.append('avatar', e.target.files[0]);

		const res = await fetch(`${API_BASE_URL}/static/avatar?userName=${currentUserName}`,
		{
			method: 'POST',
			credentials: 'include',
			body: formData
		});
		if (res.ok) {
			console.log("success");
			showNotification("Avatar changed successfully", "success");
		}
		else {
			console.log(res.statusText);
			showNotification("Failed to change avatar", "error");
		}
	} catch (error) {
		console.error("❌ Error during avatar change request:", error);
		showNotification(`System Error: ${error.message}`, "error");
	}
}

async function sendDNameChangeReq(e) {
	e.preventDefault();
	console.log("SEND DNAME CHANGE REQ");

	const form = e.target.closest('form');
	const formData = new FormData(form);
	const inputs = Object.fromEntries(formData);

	try {
		const getProfileDatas = await fetch(`${API_BASE_URL}/profile/displaynameupdate`,
		{
			method: "POST",
			credentials: 'include',
			headers:
			{
				'Content-Type': 'application/json',
				...getAuthHeaders()
			},
			body: JSON.stringify({userName: currentUserName, ...inputs})
		});
		if (getProfileDatas.ok) {
			console.log(await getProfileDatas.json());
			showNotification("Display name updated successfully", "success");
		} else {
			console.log(getProfileDatas.statusText);
			showNotification("Failed to update display name", "error");
		}
	} catch (error) {
		console.error("❌ Error during profile update:", error);
		showNotification(`System Error: ${error.message}`, "error");
	}
}

async function sendEmailChangeReq(e) {
	e.preventDefault();
	console.log("SEND EMAIL CHANGE REQ");
	console.log(e);

	try {

		const getProfileDatas = await fetch(`${API_BASE_URL}/auth/request-email-change`,
		{
			method: 'POST',
			credentials: 'include',
		});
		if (getProfileDatas.ok) {
			console.log("success");
			showNotification("Email change link sent to your email", "success");
		}
		else {
			console.log(getProfileDatas.statusText);
			showNotification("Failed to send email change link", "error");
		}
	} catch (error) {
		console.error("❌ Error during email change request:", error);
		showNotification(`System Error: ${error.message}`, "error");
	}
}

async function sendPassChangeReq(e) {
	e.preventDefault();
	console.log("SEND PASS CHANGE REQ");
	console.log(e);

	try {
		const getProfileDatas = await fetch(`${API_BASE_URL}/auth/request-password-change`,
		{
			method: 'POST',
			credentials: 'include',
		});
		if (getProfileDatas.ok) {
			console.log("success");
			showNotification("Password change link sent to your email", "success");
		}
		else {
			console.log(getProfileDatas.statusText);
			showNotification("Failed to send password change link", "error");
		}
	} catch (error) {
		console.error("❌ Error during password change request:", error);
		showNotification(`System Error: ${error.message}`, "error");
	}
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
		document.querySelector(".avatar")?.addEventListener("click", changeAvatar);
		document.getElementById('hidden-file-input')?.addEventListener('click', (e) => {
			e.stopPropagation();
		});
		document.getElementById('hidden-file-input')?.addEventListener('change', sendAvatarChangeReq);
		document.getElementById("delete-account")?.addEventListener("click", deleteAccount);
		document.querySelector(".email")?.addEventListener("click", sendEmailChangeReq);
		document.querySelector(".dname")?.addEventListener("click", sendDNameChangeReq);
		document.querySelector(".pass")?.addEventListener("click", sendPassChangeReq);
		onLoad();
	}

	async unsetEventHandlers() {
		document.querySelector(".avatar")?.removeEventListener("click", changeAvatar);
		document.getElementById('hidden-file-input')?.removeEventListener('click', (e) => {
			e.stopPropagation();
		});
		document.getElementById('hidden-file-input')?.removeEventListener('change', sendAvatarChangeReq);
		document.getElementById("delete-account")?.removeEventListener("click", deleteAccount);
		document.querySelector(".email")?.removeEventListener("click", sendEmailChangeReq);
		document.querySelector(".dname")?.removeEventListener("click", sendDNameChangeReq);
		document.querySelector(".pass")?.removeEventListener("click", sendPassChangeReq);
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
			currentUserName = profileData?.user?.username;
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
				document.querySelector('input[name="dname"]').setAttribute('value', user.profile.displayName ?? '');
				if (user?.profile?.avatarUrl)
					document.getElementById('settings-avatar').setAttribute('src', user.profile.avatarUrl);
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
