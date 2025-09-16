var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import AView from "./AView.js";
export default class extends AView {
    constructor() {
        super();
        this.setTitle("Friends");
    }
    getHtml() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch("templates/friends.html");
            return yield response.text();
        });
    }
    setDynamicContent() {
        return __awaiter(this, void 0, void 0, function* () {
            const fr = yield fetch("mockdata/friendslist.json");
            const friendlist = yield fr.json();
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
					<select class="friend-action" name="friend-action">
						<option selected disabled></option>
						<option value="play">Play</option>
						<option value="message">Message</option>
						<option value="unfriend">Unfriend</option>
					</select>
				</div>
			`;
                div.classList.add("friend");
                div.classList.add("online");
                const friends = document.querySelector(".friends");
                console.log(friends);
                friends.appendChild(div);
            }
        });
    }
    setEventHandlers() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    unsetEventHandlers() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    setStylesheet() {
        return __awaiter(this, void 0, void 0, function* () {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = "styles/friends.css";
            document.head.appendChild(link);
        });
    }
    unsetStylesheet() {
        return __awaiter(this, void 0, void 0, function* () {
            const link = document.querySelector("link[href='styles/friends.css']");
            document.head.removeChild(link);
        });
    }
}
//# sourceMappingURL=Friends.js.map