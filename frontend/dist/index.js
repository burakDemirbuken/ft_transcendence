var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Login from "../dist/Login.js";
import Settings from "../dist/Settings.js";
import Profile from "../dist/Profile.js";
// let currentLang = "eng";
// const lang = {
// 	eng: { next: "tur" },
// 	tur: { next: "deu" },
// 	deu: { next: "jpn" },
// 	jpn: { next: "eng" }
// }
// async function loadTranslations(lang) {
// 	const response = await fetch(`locales/${lang}.json`);
// 	return await response.json();
// }
// async function applyTranslations(lang) {
// 	const translations = await loadTranslations(lang);
// 	document.querySelector("[data-i18n='lang']").textContent = translations.login.lang;
// 	document.querySelector("[data-i18n='welcome.title']").textContent = translations.login.welcome.title;
// 	document.querySelector("[data-i18n='welcome.prompt']").textContent = translations.login.welcome.prompt;
// 	document.querySelector("[data-i18n='username']").textContent = translations.login.username;
// 	document.querySelector("[data-i18n='password']").textContent = translations.login.password;
// 	document.querySelector("[data-i18n='email']").textContent = translations.login.email;
// 	document.querySelector("[data-i18n='code']").textContent = translations.login.code;
// 	document.querySelector("[data-i18n='rme']").textContent = translations.login.rme;
// }
const pageState = {
    current: "login", // default
};
const routes = {
    login: { template: "login", view: Login },
    profile: { template: "profile", view: Profile },
    // home: { template: "home", view: Home },
    settings: { template: "settings", view: Settings }
};
let view = null;
const router = function (page) {
    return __awaiter(this, void 0, void 0, function* () {
        const content = document.querySelector("#content");
        if (view) {
            view.unsetEventHandlers();
            view.unsetStylesheet();
            view = null;
        }
        pageState.current = page;
        const route = routes[page];
        if (route) {
            view = new route.view();
            view.setStylesheet();
            content.innerHTML = yield view.getHtml();
            view.setEventHandlers();
        }
        else {
            document.title = "Page Not Found";
            content.innerHTML = "<h2>404</h2><p>Page not found.</p>";
        }
    });
};
function navigateTo(page) {
    history.pushState({ page }, "", `/${page}`);
    router(page);
}
document.addEventListener("DOMContentLoaded", () => {
    document.body.addEventListener("click", e => {
        if (e.target.matches("[data-link]")) {
            e.preventDefault();
            navigateTo(e.target.getAttribute("href").replace(/^\//, ''));
        }
    });
});
// Handle browser back/forward
window.addEventListener("popstate", (event) => {
    const page = event.state.page || "login";
    router(page);
});
// Initial load and page reloads
window.addEventListener("load", () => {
    const urlPage = window.location.pathname.slice(1);
    const initialPage = urlPage || history.state.page || "login";
    router(initialPage);
    history.replaceState({ page: initialPage }, "", `/${initialPage}`);
});
//# sourceMappingURL=index.js.map