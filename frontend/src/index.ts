import Home from "../dist/Home.js";
import Profile from "../dist/Profile.js";
import { updateChartLanguage } from "./Profile.js";
import Play from "../dist/Play.js";
import Friends from "../dist/Friends.js";
import Settings from "../dist/Settings.js";
import Login from "../dist/Login.js";
import I18n from './I18n.js';

const pageState = {
	current: "login", // default
};

const routes = {
	login: { template: "login", view: Login },
	profile: { template: "profile", view: Profile },
	home: { template: "home", view: Home },
	settings: { template: "settings", view: Settings },
	play: { template: "play", view: Play },
	friends: { template: "friends", view: Friends }
}

let view = null;

const router = async function(page:string) {
	const content = document.querySelector("#content");

	if (view) {
		content?.innerHTML = "";
		view.unsetEventHandlers();
		view.unsetStylesheet();
		view = null;
	}
	pageState.current = page;

	const route = routes[page];
	if (route) {
		view = new route.view();
		view.setStylesheet();
		content.innerHTML = await view.getHtml();
		view.setDynamicContent();
		I18n.loadLanguage();
		view.setEventHandlers();
	} else {
		document.title = "Page Not Found";
		content.innerHTML = "<h2>404</h2><p>Page not found.</p>";
	}
}

export function navigateTo(page:string) {
	history.pushState({ page }, "", `/${page}`);
	router(page);
}

document.addEventListener("DOMContentLoaded", () => {
	const navbar = document.body.querySelectorAll(".sidebar-element");
	for (const element of navbar) {
		element.addEventListener("click", async (e) => {
			if (e.currentTarget.matches("[data-link]")) {
				console.log("PAGE")
				e.preventDefault();
				navigateTo(e.currentTarget.getAttribute("href").replace(/^\//, ''));
				document.querySelector(".selected")?.classList.toggle("selected");
				e.currentTarget.classList.toggle("selected");
				if (e.currentTarget.matches("[id='logout']"))
				{
					const request = new Request(`https://localhost:8080/api/auth/logout?lang=${localStorage.getItem("langPref")}`, {
						method: "POST"
					});
					try {
						const response = await fetch(request);
						const json = await response.json();

						if (response.ok)
						{
							document.querySelector("#navbar")?.classList.toggle("logout");
							console.log("LOGSOUT!");
						} else {
							alert(`${json.error}`);
						}
					} catch {
						alert(`System Error`);
					}
				}
			} else if (e.currentTarget.matches("[id='toggle']")) {
				console.log("TOGGLE");
				document.querySelector("#navbar")?.classList.toggle("collapse");
				document.querySelector(".selected")?.classList.toggle("selected");
				e.currentTarget.classList.toggle("selected");
			}
			else if (e.currentTarget.matches("[id='language']")) {
				console.log("LANGUAGE");
				e.preventDefault();
				I18n.nextLanguage();
				updateChartLanguage();
				document.querySelector(".selected")?.classList.toggle("selected");
				e.currentTarget.classList.toggle("selected");
			}
		});
	}
});

function toggleClassOnResize() {
	const element = document.querySelector("#navbar");
	const mediaQuery = window.matchMedia("(max-width: 1080px)");

	if (mediaQuery.matches)
		element.classList.add("collapse");
}

window.addEventListener('load', toggleClassOnResize);
window.addEventListener('resize', toggleClassOnResize);

// Handle browser back/forward
window.addEventListener("popstate", (event) => {
	const page = event.state.page || "login";
	router(page);
});

// Initial load and page reloads
window.addEventListener("load", () => {
	const urlPage = window.location.pathname.slice(1);
	const initialPage = urlPage || history.state.page || "login";

	if (!localStorage.getItem("langPref"))
		localStorage.setItem("langPref", "eng");

	I18n.loadLanguage();

	router(initialPage);
	history.replaceState({ page: initialPage }, "", `/${initialPage}`);
});