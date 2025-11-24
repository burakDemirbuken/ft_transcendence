import AView from "./AView.js";
import { getAuthToken, getAuthHeaders } from './utils/auth.js';
import { API_BASE_URL, navigateTo } from './index.js';
import { showNotification } from "./notification.js";
import tokenManager from './tokenManager.js';

let currentUserName = null;
let pendingAction = null; // 'password' veya 'email'
let pendingData = null; // İlgili data

async function hideSettingsOverlay() {
	console.log("HIDE SETTINGS OVERLAY");
	document.querySelector(".overlay")?.classList.add("hide-away");
	const input = document.querySelector(".card input") as HTMLInputElement;
	if (input)
		input.value = "";
	pendingAction = null;
	pendingData = null;
}

async function showSettingsOverlay() {
	console.log("SHOW SETTINGS OVERLAY");
	document.querySelector(".overlay")?.classList.remove("hide-away");
}

async function confirm2FACode(e) {
	e.preventDefault();
	console.log("CONFIRM 2FA CODE");

	const form = e.target.closest('form');
	const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
	const formData = new FormData(form);
	const code = formData.get('code') as string;

	if (!code || code.length !== 6) {
		showNotification("Please enter 6-digit code", "error");
		return;
	}

	// Butonu disable et
	submitBtn.disabled = true;
	submitBtn.style.opacity = '0.6';
	submitBtn.style.cursor = 'not-allowed';

	try {
		let endpoint = '';
		if (pendingAction === 'password') {
			endpoint = '/auth/confirm-password-change';
		} else if (pendingAction === 'email') {
			endpoint = '/auth/confirm-email-change';
		} else {
			showNotification("Invalid action", "error");
			submitBtn.disabled = false;
			submitBtn.style.opacity = '1';
			submitBtn.style.cursor = 'pointer';
			return;
		}

		const response = await fetch(`${API_BASE_URL}${endpoint}`, {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
				...getAuthHeaders()
			},
			body: JSON.stringify({ code })
		});

		const result = await response.json();

		if (response.ok) {
			showNotification(result.message || "Change successful!", "success");
			hideSettingsOverlay();

			// Şifre değiştiyse ve logout gerekliyse
			if (pendingAction === 'password' && result.logout) {
				showNotification("Password changed! Logging out...", "success");
				// TokenManager ile logout yap (cookie'leri temizler)
				await tokenManager.logout();
				setTimeout(() => {
					navigateTo('login');
				}, 1500);
			}
			// Email değiştiyse sayfayı yenile
			else if (pendingAction === 'email') {
				setTimeout(() => {
					window.location.reload();
				}, 1500);
			}
		} else {
			showNotification(result.error || "Verification failed", "error");
			// Hata durumunda butonu tekrar aktif et
			submitBtn.disabled = false;
			submitBtn.style.opacity = '1';
			submitBtn.style.cursor = 'pointer';
		}
	} catch (error) {
		console.error("❌ Error during 2FA confirmation:", error);
		showNotification(`System Error: ${error.message}`, "error");
		// Hata durumunda butonu tekrar aktif et
		submitBtn.disabled = false;
		submitBtn.style.opacity = '1';
		submitBtn.style.cursor = 'pointer';
	}

	form.querySelectorAll('input').forEach((input: HTMLInputElement) => input.value = '');
}

async function deleteAccount(e) {
	e.preventDefault();
	const isConfirmed = confirm("Are you sure you want to delete your account? This action cannot be undone");
	if (isConfirmed) {
		try {
			const res = await doubleFetch(`${API_BASE_URL}/auth/profile`, {
				method: 'DELETE',
				credentials: 'include',
			});
			const json = await res.json();
			if (res.ok) {
				showNotification(json.message, "success");
				showSettingsOverlay();
				// navigateTo("login");
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

		const res = await doubleFetch(`${API_BASE_URL}/static/avatar`, {
			method: 'POST',
			credentials: 'include',
			body: formData
		});
		if (res.ok) {
			const json = await res.json();
			let src = "../profile.svg";
			if (json?.newAvatarUrl)
				src = `${API_BASE_URL}/static/${json.newAvatarUrl}`;
			document.getElementById('settings-avatar')?.setAttribute('src', src);
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
	const dname = formData.get('dname') as string;

	try {
		const getProfileDatas = await doubleFetch(`${API_BASE_URL}/profile/displaynameupdate`, {
			method: "POST",
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
				...getAuthHeaders()
			},
			body: JSON.stringify({userName: currentUserName, dname})
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

	form.querySelectorAll('input').forEach((input: HTMLInputElement) => input.value = '');
}

async function sendEmailChangeReq(e) {
	e.preventDefault();
	console.log("INIT EMAIL CHANGE");

	const form = e.target.closest('form');
	const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
	const formData = new FormData(form);
	const newEmail = formData.get('new-email') as string;

	if (!newEmail) {
		showNotification("Please enter new email", "error");
		return;
	}

	// Butonu disable et
	submitBtn.disabled = true;
	submitBtn.style.opacity = '0.6';
	submitBtn.style.cursor = 'not-allowed';

	try {
		const response = await fetch(`${API_BASE_URL}/auth/init-email-change`, {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
				...getAuthHeaders()
			},
			body: JSON.stringify({ newEmail })
		});

		const result = await response.json();

		if (response.ok) {
			pendingAction = 'email';
			pendingData = { newEmail };
			showNotification(result.message || "2FA code sent to your email", "success");
			showSettingsOverlay();
		} else {
			showNotification(result.error || "Failed to initiate email change", "error");
		}
	} catch (error) {
		console.error("❌ Error during email change init:", error);
		showNotification(`System Error: ${error.message}`, "error");
	} finally {
		// Butonu tekrar aktif et
		submitBtn.disabled = false;
		submitBtn.style.opacity = '1';
		submitBtn.style.cursor = 'pointer';
	}

	form.querySelectorAll('input').forEach((input: HTMLInputElement) => input.value = '');
}

async function sendPassChangeReq(e) {
	e.preventDefault();
	console.log("INIT PASSWORD CHANGE");

	const form = e.target.closest('form');
	const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
	const formData = new FormData(form);
	const currentPassword = formData.get('current-password') as string;
	const newPassword = formData.get('new-password') as string;
	const confirmPassword = formData.get('confirm-password') as string;

	if (!currentPassword || !newPassword || !confirmPassword) {
		showNotification("All fields are required", "error");
		return;
	}

	if (newPassword !== confirmPassword) {
		showNotification("New passwords do not match", "error");
		return;
	}

	if (newPassword.length < 6) {
		showNotification("Password must be at least 6 characters", "error");
		return;
	}

	// Butonu disable et
	submitBtn.disabled = true;
	submitBtn.style.opacity = '0.6';
	submitBtn.style.cursor = 'not-allowed';

	try {
		const response = await fetch(`${API_BASE_URL}/auth/init-password-change`, {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
				...getAuthHeaders()
			},
			body: JSON.stringify({ currentPassword, newPassword })
		});

		const result = await response.json();

		if (response.ok) {
			pendingAction = 'password';
			pendingData = { currentPassword, newPassword };
			showNotification(result.message || "2FA code sent to your email", "success");
			showSettingsOverlay();
		} else {
			showNotification(result.error || "Failed to initiate password change", "error");
		}
	} catch (error) {
		console.error("❌ Error during password change init:", error);
		showNotification(`System Error: ${error.message}`, "error");
	} finally {
		// Butonu tekrar aktif et
		submitBtn.disabled = false;
		submitBtn.style.opacity = '1';
		submitBtn.style.cursor = 'pointer';
	}

	form.querySelectorAll('input').forEach((input: HTMLInputElement) => input.value = '');
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
		document.querySelector(".validation-form")?.addEventListener("submit", confirm2FACode);
		document.getElementById("card-exit")?.addEventListener("click", hideSettingsOverlay);
		document.querySelectorAll(".part-expand").forEach((btn) => {
			btn.addEventListener("click", function (e) {
				const clicked = e.currentTarget as HTMLElement;
				const partHeader = clicked.closest('.part-header');
				const part = partHeader?.parentElement;
				const formContainer = part?.querySelector('.form-container') as HTMLElement | null;
				if (!formContainer)
					return;
				formContainer.hidden = !formContainer.hidden;
				btn.classList.toggle('rotated', !formContainer.hidden);
			});
		});
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
		return navigateTo('login');

	try {
		const meReq = await doubleFetch(`${API_BASE_URL}/auth/me`, {
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
			const uname = document.querySelector(".settings-uname");
			if (uname && profileData?.user?.username)
				uname.textContent = "@" + profileData.user.username;
			document.querySelector('input[name="current-email"]')?.setAttribute('value', profileData?.user?.email ?? '');

			const profileReq = await doubleFetch(`${API_BASE_URL}/profile/profile?userName=${profileData?.user?.username}`, {
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
					...getAuthHeaders()
				}
			});

			if (profileReq.ok) {
				const user = await profileReq.json();
				document.querySelector('input[name="dname"]')?.setAttribute('value', user.profile.displayName ?? '');
				if (user?.profile?.avatarUrl)
					document.getElementById('settings-avatar')?.setAttribute('src', `${API_BASE_URL}/static/${user.profile.avatarUrl}`);
			} else
				console.error("❌ Failed to fetch profile data:", profileReq.statusText);
		} else {
			if (meReq.status === 401) {
				console.log("REQUSET NOT OK");
				navigateTo("login");
			}
		}
	} catch (error) {
		console.error(error);
		navigateTo("login");
	}
}
