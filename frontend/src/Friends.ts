import AView from "./AView.js";

export default class extends AView {
	constructor() {
		super();
		this.setTitle("Friends");
	}

	async getHtml(): Promise<string> {
		const response = await fetch("templates/friends.html");
		return await response.text();
	}

	async setDynamicContent() {
		const fr = await fetch("mockdata/friendslist.json");
		const friendlist = await fr.json();
		for (const friend of friendlist) {
			console.log(friend);
			const div = document.createElement("div");
			// <img src="${friend.avatar_url}" alt="${friend.username}'s avatar">
			div.innerHTML = `
				<div class="friend-profile">
					<div class="friend-avatar">
						${friend.avatar_url}
					</div>
					<div class="friend-info">
						<span class="uname">"${friend.username}"</span>
						<span class="level">[═══════----------------------]</span>
					</div>
				</div>
				<div class="friend-actions">
					<div class="friend-menu">
						<button class="menu-btn">⋮</button>
						<div class="menu-options">
							<button class="option">Play</button>
							<button class="option">Message</button>
							<button class="option">Unfriend</button>
						</div>
					</div>
				</div>
			`;
			div.classList.add("friend");
			div.classList.add("online");

			const friends = document.querySelector(".friends");
			console.log(friends);
			friends.appendChild(div);
		}
	}

	async setEventHandlers() {}
	async unsetEventHandlers() {}

	async setStylesheet() {
		const link = document.createElement("link");
		link.rel = "stylesheet";
		link.href = "styles/friends.css"
		document.head.appendChild(link);
	}

	async unsetStylesheet() {
		const link = document.querySelector("link[href='styles/friends.css']");
		document.head.removeChild(link);
	}
}
