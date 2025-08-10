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
const pageState = {
    current: "login", // default
};
const routes = {
    login: { template: "login", view: Login },
    profile: { template: "profile", view: Profile },
    // home: { template: "home", view: Home },
    settings: { template: "settings", view: Settings }
};
const router = function (page) {
    return __awaiter(this, void 0, void 0, function* () {
        const content = document.querySelector("#content");
        pageState.current = page;
        const route = routes[page];
        if (route) {
            const view = new route.view();
            content.innerHTML = yield view.getHtml();
        }
        else {
            document.title = "Page Not Found";
            content.innerHTML = "<h2>404</h2><p>Page not found.</p>";
        }
        // currentStep = "welcome";
        // document.addEventListener("keydown", move);
        // document.addEventListener("click", move);
        // document.addEventListener("input", (e) => {
        // 	e.target.style.width = (Math.max(e.target.value.length, 1) + 2) + "ch";
        // })
    });
};
function navigateTo(page) {
    history.pushState({ page }, "", `/${page}`);
    router(page);
}
document.addEventListener("DOMContentLoaded", () => {
    document.body.addEventListener("click", e => {
        console.log("HEEEEEEEY!");
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