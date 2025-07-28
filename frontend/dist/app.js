"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const pageState = {
    current: 'login', // default
};
const routes = {
    login: { template: 'login', title: 'Login' },
    register: { template: 'register', title: 'Register' },
    home: { template: 'home', title: 'Home' },
};
function loadTemplate(templateName) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield fetch(`templates/${templateName}.html`);
        return yield response.text();
    });
}
const content = document.querySelector('#content');
function req(request) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield fetch(request);
        const obj = yield response.json();
        return obj;
    });
}
function register(event) {
    return __awaiter(this, void 0, void 0, function* () {
        event.preventDefault(); // Prevent auto refresh
        const form = new FormData(event.target);
        const user = {
            "username": form.get("username"),
            "email": form.get("email"),
            "password": form.get("password")
        };
        const request = new Request("http://localhost:3000/api/users/register", {
            method: 'POST',
            headers: new Headers({
                'Content-Type': 'application/json',
            }),
            body: JSON.stringify(user),
        });
        // 'Authorization': 'Bearer token123' // HEADER
        // cache: 'no-store',
        // mode: 'cors' // CORS handling
        const obj = yield req(request);
        const test = document.createElement("p");
        test.textContent = `Reply: ${obj.error}`;
        content.appendChild(test);
    });
}
function login(event) {
    return __awaiter(this, void 0, void 0, function* () {
        event.preventDefault(); // Prevent auto refresh
        const form = new FormData(event.target);
        const user = {
            "username": form.get("username"),
            "email": form.get("email"),
            "password": form.get("password")
        };
        const request = new Request("http://localhost:3000/api/users/login", {
            method: 'POST',
            headers: new Headers({
                'Content-Type': 'application/json',
            }),
            body: JSON.stringify(user),
        });
        const obj = yield req(request);
        const test = document.createElement("p");
        test.textContent = `Reply: ${obj.token}`;
        content.appendChild(test);
    });
}
function loadPage(page) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const body = document.querySelector('body');
        pageState.current = page;
        const route = routes[page];
        if (route) {
            content.innerHTML = yield loadTemplate(route.template);
            document.title = route.title;
        }
        else {
            content.innerHTML = '<h2>404</h2><p>Page not found.</p>';
        }
        (_a = content.querySelector('#loginForm')) === null || _a === void 0 ? void 0 : _a.addEventListener("submit", login);
        (_b = content.querySelector('#registerForm')) === null || _b === void 0 ? void 0 : _b.addEventListener("submit", register);
    });
}
function navigate(page) {
    history.pushState({ page }, '', `/${page}`);
    loadPage(page);
    console.log("navigate called");
}
// Handle browser back/forward
window.addEventListener('popstate', (event) => {
    const page = event.state.page || 'login';
    loadPage(page);
});
// Initial load and page reloads
window.addEventListener('load', () => {
    const urlPage = window.location.pathname.slice(1);
    const initialPage = urlPage || history.state.page || 'login';
    loadPage(initialPage);
    history.replaceState({ page: initialPage }, '', `/${initialPage}`);
});
//# sourceMappingURL=app.js.map