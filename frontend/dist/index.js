import Login from "../dist/Login.js";
import Settings from "../dist/Settings.js";
import Profile from "../dist/Profile.js";
import Play from "../dist/Play.js";
import Friends from "../dist/Friends.js";
import I18n from './translations.js';
const pageState = {
    current: "login", // default
};
const routes = {
    login: { template: "login", view: Login },
    profile: { template: "profile", view: Profile },
    // home: { template: "home", view: Home },
    settings: { template: "settings", view: Settings },
    play: { template: "play", view: Play },
    friends: { template: "friends", view: Friends }
};
let view = null;
const router = async function (page) {
    const content = document.querySelector("#content");
    if (view) {
        content === null || content === void 0 ? void 0 : content.innerHTML = "";
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
        I18n.loadLanguage(page);
        view.setEventHandlers();
    }
    else {
        document.title = "Page Not Found";
        content.innerHTML = "<h2>404</h2><p>Page not found.</p>";
    }
};
export function navigateTo(page) {
    history.pushState({ page }, "", `/${page}`);
    router(page);
}
document.addEventListener("DOMContentLoaded", () => {
    const navbar = document.body.querySelectorAll(".sidebar-element");
    for (const element of navbar) {
        element.addEventListener("click", e => {
            var _a, _b, _c;
            if (e.currentTarget.matches("[data-link]")) {
                console.log("PAGE");
                e.preventDefault();
                navigateTo(e.currentTarget.getAttribute("href").replace(/^\//, ''));
                (_a = document.querySelector(".selected")) === null || _a === void 0 ? void 0 : _a.classList.toggle("selected");
                e.currentTarget.classList.toggle("selected");
            }
            else if (e.currentTarget.matches("[id='toggle']")) {
                console.log("TOGGLE");
                (_b = document.querySelector("#navbar")) === null || _b === void 0 ? void 0 : _b.classList.toggle("collapse");
                (_c = document.querySelector(".selected")) === null || _c === void 0 ? void 0 : _c.classList.toggle("selected");
                e.currentTarget.classList.toggle("selected");
            }
            else if (e.currentTarget.matches("[id='language']")) {
                console.log("LANGUAGE");
                e.preventDefault();
                I18n.nextLanguage("navbar");
                I18n.nextLanguage(pageState.current);
            }
        });
    }
});
function toggleClassOnResize() {
    const element = document.querySelector("#navbar");
    const mediaQuery = window.matchMedia("(max-width: 1080px)");
    if (mediaQuery.matches) {
        element.classList.add("collapse");
    }
    // Open for auto grow
    // else {
    // 	element.classList.remove("collapse");
    // }
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
    I18n.loadLanguage("navbar");
    router(initialPage);
    history.replaceState({ page: initialPage }, "", `/${initialPage}`);
});
//# sourceMappingURL=index.js.map