import Login from "./Login.js";
import Settings from "./Settings.js";
import Profile from "./Profile.js";
import Play from "./Play.js";
import Friends from "./Friends.js";

interface Route {
    template: string;
    view: any;
}

interface Routes {
    [key: string]: Route;
}

const pageState = {
    current: "login", // default
};

const routes: Routes = {
    login: { template: "login", view: Login },
    profile: { template: "profile", view: Profile },
    settings: { template: "settings", view: Settings },
    play: { template: "play", view: Play },
    friends: { template: "friends", view: Friends }
}

let view: any = null;

const router = async function(page: string) {
    const content = document.querySelector("#content");

    if (view) {
        if (content) content.innerHTML = "";
        view.unsetEventHandlers();
        view.unsetStylesheet();
        view = null;
    }
    pageState.current = page;

    const route = routes[page];
    if (route) {
        view = new route.view();
        view.setStylesheet();
        if (content) content.innerHTML = await view.getHtml();
        view.setEventHandlers();
    } else {
        document.title = "Page Not Found";
        if (content) content.innerHTML = "<h2>404</h2><p>Page not found.</p>";
    }
}

export function navigateTo(page: string) {
    history.pushState({ page }, "", `/${page}`);
    router(page);
}

document.addEventListener("DOMContentLoaded", () => {
    document.body.addEventListener("click", e => {
        const target = e.target as HTMLElement;
        if (target && target.matches("[data-link]")) {
            console.log("hey?")
            e.preventDefault();
            const href = target.getAttribute("href");
            if (href) {
                navigateTo(href.replace(/^\//, ''));
                const selectedElement = document.querySelector(".selected");
                selectedElement?.classList.toggle("selected");
                target.classList.toggle("selected");
            }
        } else if (target && target.matches("[id='toggle']")) {
            console.log("hey");
            document.querySelector("#navbar")?.classList.toggle("collapse");
            const selectedElement = document.querySelector(".selected");
            selectedElement?.classList.toggle("selected");
            target.classList.toggle("selected");
        }
    })
});

function toggleClassOnResize() {
    const element = document.querySelector("#navbar");
    const mediaQuery = window.matchMedia("(max-width: 1080px)");

    if (element && mediaQuery.matches) {
        element.classList.add("collapse");
    }
}

window.addEventListener('load', toggleClassOnResize);
window.addEventListener('resize', toggleClassOnResize);

window.addEventListener("popstate", (event) => {
    const page = event.state.page || "login";
    router(page);
});

window.addEventListener("load", () => {
    const urlPage = window.location.pathname.slice(1);
    const initialPage = urlPage || history.state?.page || "login";
    router(initialPage);
    history.replaceState({ page: initialPage }, "", `/${initialPage}`);
});