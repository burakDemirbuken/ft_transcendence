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
import Play from "../dist/Play.js";
import Friends from "../dist/Friends.js";
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
const router = function (page) {
    return __awaiter(this, void 0, void 0, function* () {
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
            content.innerHTML = yield view.getHtml();
            view.setEventHandlers();
        }
        else {
            document.title = "Page Not Found";
            content.innerHTML = "<h2>404</h2><p>Page not found.</p>";
        }
    });
};
export function navigateTo(page) {
    history.pushState({ page }, "", `/${page}`);
    router(page);
}
document.addEventListener("DOMContentLoaded", () => {
    document.body.addEventListener("click", e => {
        var _a, _b, _c;
        if (e.target.matches("[data-link]")) {
            console.log("hey?");
            e.preventDefault();
            navigateTo(e.target.getAttribute("href").replace(/^\//, ''));
            (_a = document.querySelector(".selected")) === null || _a === void 0 ? void 0 : _a.classList.toggle("selected");
            e.target.classList.toggle("selected");
        }
        else if (e.target.matches("[id='toggle']")) {
            console.log("hey");
            (_b = document.querySelector("#navbar")) === null || _b === void 0 ? void 0 : _b.classList.toggle("collapse");
            (_c = document.querySelector(".selected")) === null || _c === void 0 ? void 0 : _c.classList.toggle("selected");
            e.target.classList.toggle("selected");
        }
    });
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
    router(initialPage);
    history.replaceState({ page: initialPage }, "", `/${initialPage}`);
});
//# sourceMappingURL=index.js.map