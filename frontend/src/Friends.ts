import AView from "./AView.js";
import Profile from "./Profile.js";
import { showNotification } from "./notification.js";

let currentFrPage:string = "friends";

function handle_clicks(e) {

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
		document.querySelector(`#${currentFrPage}`).removeAttribute("inert");
	}
	else if (e.target.classList.contains("prof")) {
		// Add overlay
		// Add profile to overlay
		document.querySelector(".overlay").classList.remove("hide-away");
	}
	else if (e.currentTarget.id === "card-exit") {
		// clear friend information?
		document.querySelector(".overlay").classList.add("hide-away");
	}
}

function esc(e: KeyboardEvent) {
	const ol = document.querySelector(".overlay");
	if (e.key === "Escape" && !ol.classList.contains("hide-away"))
		ol.classList.add("hide-away");
}


async function createFriends() {
	const usr = await fetch("mockdata/friendslist.json");
	const userList = await usr.json();
	for (const user of userList) {
		const div = document.createElement("div");
		// <img src="${friend.avatar_url}" alt="${friend.username}'s avatar">
		div.innerHTML = `
			<div class="user-profile">
				<div class="friend-user-avatar">
					${user.avatar_url}
				</div>
				<div class="friends-user-info">
					<span class="dname">${user.dname}</span>
					<span class="uname">${user.uname}</span>
				</div>
			</div>
			<div class="user-actions">
				<div class="user-menu">
					<button class="menu-btn">⋮</button>
					<div class="menu-options">
						<button class="option prof">Profile</button>
						<button class="option unfr">Unfriend</button>
					</div>
				</div>
			</div>
		`;
		div.classList.add("friend");
		div.classList.add("online");

		const friends = document.querySelector("#friends");
		friends.appendChild(div);
	}
}

async function createInvites() {
	const usr = await fetch("mockdata/invitelist.json");
	const userList = await usr.json();
	for (const user of userList) {
		const div = document.createElement("div");
		// <img src="${friend.avatar_url}" alt="${friend.username}'s avatar">
		div.innerHTML = `
			<div class="user-profile">
				<div class="friend-user-avatar">
					${user.avatar_url}
				</div>
				<div class="friends-user-info">
					<span class="dname">${user.dname}</span>
					<span class="uname">${user.uname}</span>
				</div>
			</div>
			<div class="user-actions">
				<div class="user-menu">
					<button class="menu-btn">⋮</button>
					<div class="menu-options">
						<button class="option prof">Profile</button>
						<button class="option undo">Undo</button>
					</div>
				</div>
			</div>
		`;
		div.classList.add("friend");
		div.classList.add("online");

		const friends = document.querySelector("#invites");
		friends.appendChild(div);
	}
}

async function createRequests() {
	const usr = await fetch("mockdata/requestlist.json");
	const userList = await usr.json();
	for (const user of userList) {
		const div = document.createElement("div");
		// <img src="${friend.avatar_url}" alt="${friend.username}'s avatar">
		div.innerHTML = `
			<div class="user-profile">
				<div class="friend-user-avatar">
					${user.avatar_url}
				</div>
				<div class="friends-user-info">
					<span class="dname">${user.dname}</span>
					<span class="uname">${user.uname}</span>
				</div>
			</div>
			<div class="user-actions">
				<div class="user-menu">
					<button class="menu-btn">⋮</button>
					<div class="menu-options">
						<button class="option prof">Profile</button>
						<button class="option accept">Accept</button>
						<button class="option decline">Decline</button>
					</div>
				</div>
			</div>
		`;
		div.classList.add("friend");
		div.classList.add("online");

		const req = document.querySelector("#requests");
		const ugrid = req?.querySelector(".user-grid");
		ugrid.appendChild(div);
	}
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

export default class extends AView {
	constructor() {
		super();
		this.setTitle("Friends");
	}

	async getHtml(): Promise<string> {
		const response = await fetch(`templates/friends.html`);
		return await response.text();
	}

	async setDynamicContent() {
		createFriends();
		createInvites();
		createRequests();
		createOverlay();
	}

	async setEventHandlers() {
		document.addEventListener("click", handle_clicks);
		document.querySelector("#card-exit").addEventListener("click", handle_clicks);
		document.addEventListener("keydown", esc);
	}

	async unsetEventHandlers() {
		console.log("Unsetting Friends Event Handlers");
		document.removeEventListener("click", handle_clicks);
		document.removeEventListener("keydown", esc);
	}

	async setStylesheet() {
		const link = document.createElement("link");
		link.rel = "stylesheet";
		link.href = "styles/friends.css"
		document.head.appendChild(link);
	}

	async unsetStylesheet() {
		console.log("Unsetting Friends Style Sheets");
		let link = document.querySelector("link[href='styles/friends.css']");
		document.head.removeChild(link);
		link = document.querySelector("link[href='styles/profile.css']");
		document.head.removeChild(link);
	}
}
