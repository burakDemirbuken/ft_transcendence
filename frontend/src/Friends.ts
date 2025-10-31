import AView from "./AView.js";
import Profile from "./Profile.js";
import { API_BASE_URL } from "./index.js";
import { showNotification } from "./notification.js";

let currentFrPage:string = "friends";

function handleOverlay(e) {
	if (e.target.classList.contains("prof")) {
		document.querySelector(".overlay")?.classList.remove("hide-away");
		// Add user profile to overlay
	}
	else if (e.currentTarget.id === "card-exit") {
		document.querySelector(".overlay")?.classList.add("hide-away");
		// Clear user profile information
	}
}

function subpageSwitch(e) {
	if (e.target.classList.contains("pg-switch")) {
		let fields = document.querySelectorAll(`.${currentFrPage}`);

		for (const field of fields) {
			field.classList.remove("pg-actv");
		}
		let section = document.querySelector(`#${currentFrPage}`);
		section?.setAttribute("inert", "");

		if (e.target.matches(".friends"))
			currentFrPage = "friends";
		else if (e.target.matches(".requests"))
			currentFrPage = "requests";
		else if (e.target.matches(".invites"))
			currentFrPage = "invites";

		fields = document.querySelectorAll(`.${currentFrPage}`);
		for (const field of fields) {
			field.classList.add("pg-actv");
		}
		document.querySelector(`#${currentFrPage}`)?.removeAttribute("inert");
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
		profileInstance.setEventHandlers();

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

class UserLists {
	private friendCont: HTMLElement;
	private requestCont: HTMLElement;
	private inviteCont: HTMLElement;
	private currentFriends: Map<string, HTMLElement> = new Map();
	private currentRequests: Map<string, HTMLElement> = new Map();
	private currentInvites: Map<string, HTMLElement> = new Map();
	private userName: string;

	constructor(userName: string) {
		this.userName = userName;
	}

	async init() {
		this.friendCont = document.getElementById("friends");
		this.requestCont = document.getElementById("requests").querySelector(".user-grid");
		this.inviteCont = document.getElementById("invites");
		document.getElementById("add-friend")?.addEventListener("click", this.request);
		try {
			const lists = await fetch(`${API_BASE_URL}/friend/list?userName=${this.userName}`, {
				// const lists = await fetch(`../../mockdata/friendslists.json`, {
					method: "GET",
					credentials: "include",
				});
			console.info("url:", lists.url);

			if (lists.ok) {
				const json = await lists.json();
				console.info("FRIENDS PAGE: FETCHED LISTS", json);
				this.update(json);
				this.update(json); // JUST TO SEE THE DOM / LISTS ACTUALLY FULL
			}
		} catch (error) {
			console.error("FRIEND LIST FETCH FAILED", error);
		}
	}

	async request(e) {
		e.preventDefault();
		console.log("SEND FRIEND REQUEST!!!");
		try {
			const res = await fetch(`${API_BASE_URL}/friend/send`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					"userName": "bkorkut",
					"peerName": "test0"
				})
			});

			if (res.ok) {
				// update request list
				showNotification("Friend rquest sent successfully!", "success");
			} else
				showNotification("Friend rquest failed", "error");
		} catch {
			showNotification("Friend rquest failed (system)", "error");
			console.log("Failed to send frequest");
		}
	}

	async unfriend(e) {
		console.info("UNFRIEND CLICKED");

		const uname = e.target.closest(".friend")?.querySelector(".uname").textContent.slice(1);

		try {
			const res = await fetch(`${API_BASE_URL}/friend/remove?userName=${this.userName}&peerName=${uname}`, {
				method: "POST",
				credentials: "include",
			});

			if (res.ok) {
				showNotification(`You have unfriended @${uname}.`);
			} else {
				showNotification(`Could not unfriend @${uname}. Please try again later.`);
			}
		} catch {
			showNotification("Friend rquest failed (system)", "error");
			console.log("Failed to send frequest");
		}
	}

	async undo(e) {
		console.info("UNDO CLICKED");
	}

	async accept(e) {
		console.info("ACCEPT CLICKED");

		const uname = e.target.closest(".friend")?.querySelector(".uname").textContent.slice(1);
		console.log("Accepting friend requesst from:", uname);

		try {
			const res = await fetch(`${API_BASE_URL}/friend/accept?userName=${this.userName}&peerName=${uname}`, {
				method: "POST",
				credentials: "include",
			});

			if (res.ok) {
				showNotification(`You have unfriended @${uname}.`);
			} else {
				showNotification(`Could not unfriend @${uname}. Please try again later.`);
			}
		} catch {
			showNotification("Friend rquest failed (system)", "error");
			console.log("Failed to send frequest");
		}
	}

	async decline(e) {
		console.info("DECLINE CLICKED");
	}

	private removeUsers(set:Set<string>, type: "friend" | "request" | "invite") {
		const config = {
			friend: { currentUsers: this.currentFriends },
			request: { currentUsers: this.currentRequests },
			invite: { currentUsers: this.currentInvites }
		};

		console.log("CURRENT USERS", type, config[type].currentUsers);
		config[type].currentUsers.forEach((element, username) => {
			if (!set.has(username)) {
				element.remove();
				config[type].currentUsers.delete(username);
			}
		});
	}

		private createUser(user: any, type: "friend" | "request" | "invite"): HTMLElement {
		const div = document.createElement("div");

		const config = {
			friend: { html: `<button class="option unfr">Unfriend</button>`,
				events: [{ selector: ".unfr", handler: this.unfriend }] },
			request: { html: `<button class="option undo">Undo</button>`,
				events: [{ selector: ".undo", handler: this.undo }] },
			invite: { html: `<button class="option accept">Accept</button>
						<button class="option decline">Decline</button>`,
				events: [{ selector: ".accept", handler: this.accept },
					{ selector: ".decline", handler: this.decline }] }
		};

		const opt = config[type].html;
		div.innerHTML = `
			<div class="user-profile">
				<div class="friend-user-avatar">
					<img src="${user?.avatarUrl ?? "../profile.svg"}" alt="">
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
		div.querySelector(".prof")?.addEventListener("click", handleOverlay);
		config[type].events.forEach(({ selector, handler }) => {
			div.querySelector(selector)?.addEventListener("click", handler);
		});

		return div;
	}

	private addUser(user: any, type: "friend" | "request" | "invite") {
		const config = {
			friend: { currentUsers: this.currentFriends, container: this.friendCont },
			request: { currentUsers: this.currentRequests, container: this.requestCont },
			invite: { currentUsers: this.currentInvites, container: this.inviteCont }
		};

		const { currentUsers, container } = config[type];
		const div = this.createUser(user, type);

		currentUsers.set(user.userName, div);
		container?.appendChild(div);
	}

	private updateUser(currentUser, newUser, type: "friend" | "request" | "invite") {
		console.log("USER", newUser.userName, "ALREADY EXISTS");
	}

	update(lists) {
		console.warn("LISTS LOOKS LIKE:", lists);
		const newFriends = new Set<string>(lists?.acceptedFriends.map(user => user.userName));
		const newRequests = new Set<string>(lists?.pendingFriends.outcoming.map(user => user.userName));
		const newInvites = new Set<string>(lists?.pendingFriends.incoming.map(user => user.userName));

		this.removeUsers(newFriends, "friend");
		this.removeUsers(newRequests, "request");
		this.removeUsers(newInvites, "invite");

		lists?.acceptedFriends.forEach(user => {
			if (this.currentFriends.has(user.userName))
				this.updateUser(this.currentFriends.get(user.userName), user, "friend");
			else
				this.addUser(user, "friend");
		});

		lists?.pendingFriends.outcoming.forEach(user => {
			if (this.currentRequests.has(user.userName))
				this.updateUser(this.currentRequests.get(user.userName), user, "request");
			else
				this.addUser(user, "request");
		});

		lists?.pendingFriends.incoming.forEach(user => {
			if (this.currentInvites.has(user.userName))
				this.updateUser(this.currentInvites.get(user.userName), user, "invite");
			else
				this.addUser(user, "invite");
		});
	}
}

export default class extends AView {
	private userManager = new UserLists("test0");

	constructor() {
		super();
		this.setTitle("Friends");
	}

	async getHtml(): Promise<string> {
		const response = await fetch("templates/friends.html");
		return await response.text();
	}

	async setDynamicContent() {
		this.userManager.init();
		createOverlay();
	}

	async setEventHandlers() {
		document.addEventListener("click", handleOverlay);
		document.querySelector("#card-exit")?.addEventListener("click", handleOverlay);
		document.addEventListener("keydown", esc);
		document.querySelector(".friend-nav")?.addEventListener("click", subpageSwitch);
	}

	async unsetEventHandlers() {
		document.removeEventListener("click", handleOverlay);
		document.querySelector("#card-exit")?.removeEventListener("click", handleOverlay);
		document.removeEventListener("keydown", esc);
		document.querySelector(".friend-nav")?.removeEventListener("click", subpageSwitch);
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
}
