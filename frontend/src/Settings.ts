import AView from "./AView.js";
import { getAuthHeaders } from './utils/auth.js';
import { API_BASE_URL, navigateTo } from './index.js';
import { showNotification } from "./utils/notification.js";


let currentUserName = null;
let pendingAction = null; // 'password', 'email' veya 'delete'
let pendingData = null; // İlgili data

async function hideSettingsOverlay() {
	document.querySelector(".overlay")?.classList.add("hide-away");
	document.querySelector(".settings-container")?.removeAttribute("inert");
	const input = document.querySelector(".card input") as HTMLInputElement;
	if (input)
		input.value = "";
	pendingAction = null;
	pendingData = null;
}

async function showSettingsOverlay() {
	document.querySelector(".overlay")?.classList.remove("hide-away");
	document.querySelector(".settings-container")?.setAttribute("inert", "");
}

async function confirm2FACode(e) {
	e.preventDefault();

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
		let method = 'POST';
		if (pendingAction === 'password') {
			endpoint = '/auth/confirm-password-change';
		} else if (pendingAction === 'email') {
			endpoint = '/auth/confirm-email-change';
		} else if (pendingAction === 'delete') {
			endpoint = '/auth/confirm-delete-account';
			method = 'DELETE';
		} else {
			showNotification("Invalid action", "error");
			submitBtn.disabled = false;
			submitBtn.style.opacity = '1';
			submitBtn.style.cursor = 'pointer';
			return;
		}
		showNotification("Sending verification code...");
		const response = await fetch(`${API_BASE_URL}${endpoint}`, {
			method: method,
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
				...getAuthHeaders()
			},
			body: JSON.stringify({ code })
		});
		const result = await response.json();

		if (response.ok) {
			showNotification(result.message ?? "Change successful!", "success");
			hideSettingsOverlay();

			if (pendingAction === 'password' && result.logout) {
				showNotification("Password changed! Logging out...", "success");
				// Logout
				await fetch(`${API_BASE_URL}/auth/logout`, {
					method: 'POST',
					credentials: 'include',
					headers: {
						'Content-Type': 'application/json',
						...getAuthHeaders()
					}
				});
				localStorage.removeItem('userName');
				document.querySelector("#navbar")?.classList.add("logout");
				setTimeout(() => {
					navigateTo('login');
				}, 1500);
			}
			else if (pendingAction === 'email' && result.logout) {
				showNotification(result.message || "Email başarıyla değiştirildi! Yeni email adresinizi doğrulamak için gelen emaildeki linke tıklayın. Oturumunuz kapatılıyor...", "success");
				// Logout
				await fetch(`${API_BASE_URL}/auth/logout`, {
					method: 'POST',
					credentials: 'include',
					headers: {
						'Content-Type': 'application/json',
						...getAuthHeaders()
					}
				});
				localStorage.removeItem('userName');
				document.querySelector("#navbar")?.classList.add("logout");
				setTimeout(() => {
					navigateTo('login');
				}, 3000);
			}
			else if (pendingAction === 'email') {
				setTimeout(() => {
					window.location.reload();
				}, 1500);
			}
			else if (pendingAction === 'delete') {
				showNotification("Account deletion successful, logging out...", "success");
				await fetch(`${API_BASE_URL}/auth/logout`, {
					method: 'POST',
					credentials: 'include',
					headers: {
						'Content-Type': 'application/json',
						...getAuthHeaders()
					}
				});
				localStorage.removeItem('userName');
				document.querySelector("#navbar")?.classList.add("logout");
				setTimeout(() => {
					navigateTo('login');
				}, 2000);
			}
		} else {
			showNotification(result.error ?? "Verification failed", "error");
			submitBtn.disabled = false;
			submitBtn.style.opacity = '1';
			submitBtn.style.cursor = 'pointer';
		}
	} catch (error) {
		showNotification(`System Error: ${error.message ?? "Failed to confirm 2FA code"}`, "error");
		submitBtn.disabled = false;
		submitBtn.style.opacity = '1';
		submitBtn.style.cursor = 'pointer';
	}

	form?.querySelectorAll('input').forEach((input: HTMLInputElement) => input.value = '');
}

async function deleteAccount(e) {
	e.preventDefault();

	const form = e.target.closest('form');
	const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
	const formData = new FormData(form);
	const password = formData.get('password') as string;

	if (!password) {
		showNotification("Please enter your password", "error");
		return;
	}

	try {
		showNotification("Sending deletion request...");
		const res = await fetch(`${API_BASE_URL}/auth/init-delete-account`, {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
				...getAuthHeaders()
			},
			body: JSON.stringify({ password })
		});
		const json = await res.json();
		if (res.ok) {
			pendingAction = 'delete';
			pendingData = { password };
			showNotification(json.message ?? "Verification code has been sent to your email", "success");
			showSettingsOverlay();
		} else {
			showNotification(json.error ?? "Account deletion failed", "error");
		}
	} catch (error) {
		showNotification(`System Error: ${error.message ?? "Failed to delete account"}`, "error");
	}
}

function changeAvatar() {
	document.getElementById('hidden-file-input')?.click();
}

async function sendAvatarChangeReq(e) {
	e.preventDefault();

	try {
		const formData = new FormData();
		formData.append('avatar', e.target.files[0]);

		showNotification("Sending avatar change request...");
		const res = await fetch(`${API_BASE_URL}/static/avatar`, {
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
			showNotification(`Failed to change avatar with status: ${res.statusText}`, "error");
		}
	} catch (error) {
		showNotification(`System Error: ${error.message ?? "Failed to change avatar"}`, "error");
	}
}

async function sendDNameChangeReq(e) {
	e.preventDefault();

	const form = e.target.closest('form');
	const formData = new FormData(form);
	const dname = formData.get('dname') as string;

	try {
		showNotification("Sending display name change request...");
		const getProfileDatas = await fetch(`${API_BASE_URL}/profile/displaynameupdate`, {
			method: "POST",
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
				...getAuthHeaders()
			},
			body: JSON.stringify({userName: currentUserName, dname})
		});
		if (getProfileDatas.ok) {
			showNotification("Display name updated successfully", "success");
		} else {
			showNotification(`Failed to update display name: ${getProfileDatas.statusText}`, "error");
		}
	} catch (error) {
		showNotification(`System Error: ${error.message ?? "Failed to update display name"}`, "error");
	}

	form.querySelectorAll('input').forEach((input: HTMLInputElement) => input.value = '');
}

async function sendEmailChangeReq(e) {
	e.preventDefault();

	const form = e.target.closest('form');
	const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
	const formData = new FormData(form);
	const newEmail = formData.get('new-email') as string;
	const password = formData.get('pass') as string;

	if (!newEmail) {
		showNotification("Please enter new email", "error");
		return;
	}

	if (!password) {
		showNotification("Please enter current password", "error");
		return;
	}

	// Butonu disable et
	submitBtn.disabled = true;
	submitBtn.style.opacity = '0.6';
	submitBtn.style.cursor = 'not-allowed';

	try {
		showNotification("Sending email change request...");
		const response = await fetch(`${API_BASE_URL}/auth/init-email-change`, {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
				...getAuthHeaders()
			},
			body: JSON.stringify({
				newEmail,
				password
			})
		});

		const result = await response.json();

		if (response.ok) {
			pendingAction = 'email';
			pendingData = { newEmail };
			showNotification(result.message ?? "Verification code has been sent to your email", "success");
			showSettingsOverlay();
		} else {
			showNotification(result.error ?? "Failed to initiate email change", "error");
		}
	} catch (error) {
		showNotification(`System Error: ${error.message ?? "Failed to initiate email change"}`, "error");
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

	// Butonu disable et
	submitBtn.disabled = true;
	submitBtn.style.opacity = '0.6';
	submitBtn.style.cursor = 'not-allowed';

	try {
		showNotification("Sending password change request...");
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
			showNotification(result.message ?? "2FA code has been sent to your email", "success");
			showSettingsOverlay();
		} else {
			showNotification(result.error ?? "Failed to initiate password change", "error");
		}
	} catch (error) {
		showNotification(`System Error: ${error.message ?? "Failed to initiate password change"}`, "error");
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
		document.getElementById("card-exit")?.addEventListener("keydown", (e) => { if (e.key === "Enter") { hideSettingsOverlay(); } });
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

	async unsetEventHandlers() {}

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

	async updateJsLanguage() {}
}

async function onLoad()
{
	try {
		const meReq = await fetch(`${API_BASE_URL}/auth/me`, {
			credentials: 'include',
			headers:
			{
				'Content-Type': 'application/json',
				...getAuthHeaders()
			}
		});

		if (meReq.ok) {
			const profileData = await meReq.json();
			const uname = document.querySelector(".settings-uname");
			if (uname && profileData?.user?.username)
				uname.textContent = "@" + profileData.user.username;
			document.querySelector('input[name="current-email"]')?.setAttribute('value', profileData?.user?.email ?? '');

			const profileReq = await fetch(`${API_BASE_URL}/profile/profile?userName=${profileData?.user?.username}`, {
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
				showNotification(`Failed to fetch profile data: ${profileReq.statusText ?? "Unknown error"}`, "error");
		} else {
			showNotification(`Failed to fetch user data with status: ${meReq.statusText ?? "Unknown error"}`, "error");
		}
	} catch (error) {
		showNotification(`System Error: ${error.message ?? "Failed to fetch user data"}`, "error");
	}
}
