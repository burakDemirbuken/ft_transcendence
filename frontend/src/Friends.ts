import AView from "./AView.js";
import Profile from "./Profile.js";
import { onUserProfile } from "./Profile.js";
import { showNotification } from "./utils/notification.js";
import { getJsTranslations } from "./utils/I18n.js";
import { API_BASE_URL } from "./index.js";

let friendSocket = null;

function safeSend(msg:string)
{
	try {
		if (friendSocket && friendSocket.readyState === WebSocket.OPEN) {
			console.log("friendSocket sent message");
			return friendSocket.send(msg);
		} else if (friendSocket && friendSocket.readyState === WebSocket.CONNECTING) {
			console.log("friend socket is connecting");
			friendSocket.addEventListener('open', () => friendSocket.send(msg), { once: true });
		}
	} catch (e) {
		console.error("safeSend failed:", e);
	}
}

export function connectFriendsWebSocket() {
	if (friendSocket !== null)
		return;
	friendSocket = new WebSocket(`wss://${window.location.hostname}:3030/ws-friend/friends`);

	friendSocket.onmessage = (event) => {
		const data = JSON.parse(event.data);
		const { type, payload } = data;
		switch (type)
		{
			case "list":
				console.warn("LIST RESPONSE: ", payload);

				try {
					document.dispatchEvent(new CustomEvent('friends:list', { detail: payload }));
				} catch (e) {
					console.error("Failed to dispatch friends:list event", e);
				}
				break;
			default:
				break;
		}
	};
}

export function disconnectFriendsWebSocket() {
	if (friendSocket !== null) {
		friendSocket.close();
		friendSocket = null;
	}
}

let currentFrPage:string = "friends";

async function handleOverlay(e) {
	if (e.target.classList.contains("prof")) {
		const userName = e.target.closest(".friend")?.querySelector(".uname").textContent.slice(1) ?? "";
		if (userName) {
			if (await onUserProfile(userName))
				document.querySelector(".overlay")?.classList.remove("hide-away");
		}
	}
	else if (e.currentTarget.id === "card-exit") {
		document.querySelector(".overlay")?.classList.add("hide-away");
		// Clear user profile information
	}
}

function subpageSwitch(e) {
	if (e.target.value) {
		const fields = document.querySelector(`.friends-container`);
		if (!fields)
			return showNotification("Failed to find friends container");
		fields?.classList.remove(`${currentFrPage}`);
		currentFrPage = e.target.value;
		fields?.classList.add(`${currentFrPage}`);
	}
}

function esc(e: KeyboardEvent) {
	const ol = document.querySelector(".overlay");
	if (e.key === "Escape" && !ol?.classList.contains("hide-away"))
		ol?.classList.add("hide-away");
}

async function createOverlay() {
	const card = document.querySelector(".card");
	try {
		let response = await fetch(`templates/profile.html`);
		card.innerHTML += await response.text();

		const link = document.createElement("link");
		link.rel = "stylesheet";
		link.href = "styles/profile.css";
		document.head.appendChild(link);

		const profileInstance = new Profile();
		profileInstance.setFriendsEventHandlers();

		let rows = document.querySelectorAll(".tournament-row");
		for (const row of rows)
				row.setAttribute("inert", "");
		rows = document.querySelectorAll(".match-row");
		for (const row of rows)
				row.setAttribute("inert", "");
	} catch {
		showNotification("System error, Please try again later.");
	}
}

// -----------------------------------------------------------------------------
// **************************** CLASS FUNCTIONS ********************************
// -----------------------------------------------------------------------------

async function request(e) {
	e.preventDefault();

	const formData = new FormData(e.currentTarget as HTMLFormElement);
	console.log("REQUEST CLICKED, SENDING TO:", formData.get("req-user"));
	try {
		safeSend(JSON.stringify({ type: "send", payload: { peerName: formData.get("req-user") } }));
		console.log("Friend request sent to:", formData.get("req-user"));
	} catch (error) {
		showNotification("System error, please try again later.", "error");
		console.log("Failed to send friend request", error);
	}
}

async function unfriend(e) {
	console.info("UNFRIEND CLICKED");

	const uname = e.target.closest(".friend")?.querySelector(".uname").textContent.slice(1);
	try {
		safeSend(JSON.stringify({ type: "remove", payload: { peerName: uname } }));
		console.log("Unfriend request sent to:", uname);
	} catch {
		showNotification("System error, please try again later.", "error");
		console.log("Failed to send unfriend request");
	}
}

async function undo(e) {
	console.info("UNDO CLICKED");

	const uname = e.target.closest(".friend")?.querySelector(".uname").textContent.slice(1);
	try {
		safeSend(JSON.stringify({ type: "reject", payload: { peerName: uname } }));
		console.log("Reject request sent to:", uname);
	} catch {
		showNotification("System error, please try again later.", "error");
		console.log("Failed to send reject request");
	}
}

async function accept(e) {
	console.info("ACCEPT CLICKED");

	const uname = e.target.closest(".friend")?.querySelector(".uname").textContent.slice(1);
	try {
		safeSend(JSON.stringify({ type: "accept", payload: { peerName: uname } }));
		console.log("Accept request sent to:", uname);
	} catch {
		showNotification("System error, please try again later.", "error");
		console.log("Failed to send accept request");
	}
}

async function decline(e) {
	console.info("DECLINE CLICKED");

	const uname = e.target.closest(".friend")?.querySelector(".uname").textContent.slice(1);
	try {
		safeSend(JSON.stringify({ type: "reject", payload: { peerName: uname } }));
		console.log("Decline request sent to:", uname);
	} catch {
		showNotification("System error, please try again later.", "error");
		console.log("Failed to send decline request");
	}
}

function removeUsers(set:Set<string>, domContainer:HTMLElement) {
	console.log("CURRENT USERS", domContainer);
	console.log("NEW USERS", set);
	domContainer.querySelectorAll(".friend").forEach((element: HTMLElement) => {
		const username = (element?.dataset && element?.dataset?.username) ?? "";
		if (!set.has(username)) {
			element.remove();
		}
	});
}

function createUser(user: any, type: "friend" | "request" | "invite"): HTMLElement {
	const div = document.createElement("div");

	const config = {
		friend: { html: `<button class="option unfr">Unfriend</button>`,
			events: [{ selector: ".unfr", handler: unfriend }] },
		request: { html: `<button class="option undo">Undo</button>`,
			events: [{ selector: ".undo", handler: undo }] },
		invite: { html: `<button class="option accept">Accept</button>
					<button class="option decline">Decline</button>`,
			events: [{ selector: ".accept", handler: accept },
				{ selector: ".decline", handler: decline }] }
	};

	const opt = config[type].html;
	let newAvatarSrc = "../profile.svg";
	if(user?.avatarUrl)
		newAvatarSrc = `${API_BASE_URL}/static/${user?.avatarUrl}`;
	div.innerHTML = `
		<div class="user-profile">
			<div class="friend-user-avatar">
				<img src="${newAvatarSrc}" alt="">
			</div>
			<div class="friends-user-info">
				<span class="dname">${user?.displayName ?? user?.userName}</span>
				<span class="uname">@${user?.userName}</span>
			</div>
		</div>
		<div class="user-actions">
			<div class="user-menu">
				<button class="menu-btn">⋮</button>
				<div class="menu-options">
					<button class="option prof">Profile</button>
					${opt}
				</div>
			</div>
		</div>
	`;
	div.classList.add("friend");
	if (user?.isOnline)
		div.classList.add("online")

	// store username on the root element for reliable lookups later
	// use `data-username` (accessed as `dataset.username`) to keep the attribute simple
	div.dataset.username = user?.userName ?? "";
	div.querySelector(".prof")?.addEventListener("click", handleOverlay);
	config[type].events.forEach(({ selector, handler }) => {
		div.querySelector(selector)?.addEventListener("click", handler);
	});

	return div;
}

function addUser(user: any, domContainer: HTMLElement, type: "friend" | "request" | "invite") {
	if (!domContainer || !user)
		return console.warn("No domContainer or user to add", type);
	const div = createUser(user, type);
	domContainer.appendChild(div);
}

function updateUser(currentUser, newUser) {
	console.log("USER", newUser.userName, "ALREADY EXISTS");
	if (!currentUser || !newUser)
		return console.warn("No currentUser or newUser to update");

	if (currentUser.classList.contains("online") && !newUser.isOnline)
		currentUser.classList.remove("online");
	else if (!currentUser.classList.contains("online") && newUser.isOnline)
		currentUser.classList.add("online");

	const avatarElem = currentUser.querySelector(".friend-user-avatar img");
	let newAvatarSrc = "../profile.svg";
	if(newUser?.avatarUrl)
		newAvatarSrc = `${API_BASE_URL}/static/${newUser?.avatarUrl}`;
	if (avatarElem && avatarElem.getAttribute("src") !== newAvatarSrc) {
		avatarElem.setAttribute("src", newAvatarSrc);
	}

	const displayNameElem = currentUser.querySelector(".dname");
	if (displayNameElem && displayNameElem.textContent !== (newUser?.displayName ?? newUser?.userName)) {
		displayNameElem.textContent = newUser?.displayName ?? newUser?.userName;
	}
}

async function updateUserList(list, domContainer, type: "friend" | "request" | "invite") {
	if (!domContainer || !list)
		return console.warn("No domContainer or list to update user list", type);

	console.info("RECIEVED USER LIST: ", list)
	const newUserList = new Set<string>(list.map(user => user.userName));
	removeUsers(newUserList, domContainer);

	if (list.length === 0) {
		const translations = await getJsTranslations(localStorage.getItem("langPref"));
		const emptyCard = document.createElement('div');
		emptyCard.className = 'friend list-empty';
		const emptyListText = translations?.friends?.emptyList?.[type] ?? `You have no ${type}s for now...`;
		emptyCard.innerHTML = `<span data-i18n="friends.emptyList.${type}">${emptyListText}</span>`;
		domContainer.appendChild(emptyCard);
		return;
	}


	list?.forEach(listUser => {
		// select the root `.friend` element that has the data-username attribute
		const domUser = domContainer.querySelector(`.friend[data-username="${CSS.escape(listUser.userName)}"]`);
		if (domUser) {
			console.log("USER", listUser.userName, "FOUND IN DOM, UPDATING");
			updateUser(domUser, listUser);
		} else {
			console.log("USER", listUser.userName, "NOT FOUND IN DOM, ADDING");
			addUser(listUser, domContainer, type);
		}
	});
}

function update(lists) {
	console.warn("LISTS LOOKS LIKE:", lists);
	updateUserList(lists?.friendlist?.acceptedFriends ?? [], document.getElementById("friends"), "friend");
	updateUserList(lists?.friendlist?.pendingFriends?.outgoing ?? [], document.querySelector("#requests > .user-grid"), "request");
	updateUserList(lists?.friendlist?.pendingFriends?.incoming ?? [], document.getElementById("invites"), "invite");
}

export default class extends AView {
	_onFriendsList: (ev: Event) => void;
	_onFriendsResponse: (ev: Event) => void;

	constructor() {
		super();
		this.setTitle("Friends");

		this._onFriendsList = (ev: Event) => {
			try {
				const detail = (ev as CustomEvent).detail;
				update(detail);
			} catch (e) {
				console.error('friends:list handler failed', e);
			}
		};
	}

	async getHtml(): Promise<string> {
		const response = await fetch("templates/friends.html");
		return await response.text();
	}

	async setDynamicContent() {
		createOverlay();
	}

	async setEventHandlers() {
		document.addEventListener("click", handleOverlay);
		document.querySelector("#card-exit")?.addEventListener("click", handleOverlay);
		document.addEventListener("keydown", esc);
		document.querySelector(".friend-nav")?.addEventListener("click", subpageSwitch);
		document.querySelector(".friend-nav select")?.addEventListener("change", subpageSwitch);
		document.addEventListener('friends:list', this._onFriendsList as EventListener);
		document.querySelector(".search-bar form")?.addEventListener("submit", request);
		safeSend(JSON.stringify({ type: "list", payload: {} }));
	}

	async unsetEventHandlers() {
		document.removeEventListener("click", handleOverlay);
		document.querySelector("#card-exit")?.removeEventListener("click", handleOverlay);
		document.removeEventListener("keydown", esc);
		document.querySelector(".friend-nav")?.removeEventListener("click", subpageSwitch);
		document.removeEventListener('friends:list', this._onFriendsList as EventListener);
		document.querySelector(".search-bar form")?.removeEventListener("submit", request);
	}

	async setStylesheet() {
		const link = document.createElement("link");
		link.rel = "stylesheet";
		link.href = "styles/friends.css"
		document.head.appendChild(link);
	}

	async unsetStylesheet() {
		let link = document.querySelector("link[href='styles/friends.css']");
		document.head.removeChild(link);
		link = document.querySelector("link[href='styles/profile.css']");
		document.head.removeChild(link);
	}

	async updateJsLanguage() {
	}
}
