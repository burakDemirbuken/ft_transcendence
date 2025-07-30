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
    "2fa": { template: '2fa', title: '2fa' },
    register: { template: 'register', title: 'Register' },
    profile: { template: 'profile', title: 'Profile' },
    home: { template: 'home', title: 'Home' },
};
function loadTemplate(templateName) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield fetch(`templates/${templateName}.html`);
        return yield response.text();
    });
}
const content = document.querySelector('#content');
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
        const response = yield fetch(request);
        const obj = yield response.json();
        const test = document.createElement("p");
        if (response.ok)
            test.textContent = `Reply: ${obj.message}`;
        else if (obj.error)
            test.textContent = `Reply: ${obj.error}`;
        else
            test.textContent = `Reply not found`;
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
        const response = yield fetch(request);
        const obj = yield response.json();
        if (response.ok)
            navigate("2fa");
        else {
            const test = document.createElement("p");
            test.textContent = `Reply: ${obj.error}, ${user.email}, ${user.username}, ${user.password}`;
            content.appendChild(test);
        }
    });
}
function login2(event) {
    return __awaiter(this, void 0, void 0, function* () {
        event.preventDefault();
        // const form = new FormData(event.target);
        // const code = {
        // 	"code": form.get("code"),
        // };
        navigate("profile");
    });
}
let currentStep = 'welcome';
function goToNextField(field) {
    let step = document.querySelector(`.field[data-step="${currentStep}"]`);
    step.classList.remove("active");
    currentStep = field;
    step = document.querySelector(`[data-step="${currentStep}"]`);
    step.classList.add('active');
}
// const form = document.querySelector('#loginForm');
// Enter button handler
function enter() {
    return __awaiter(this, void 0, void 0, function* () {
        switch (currentStep) {
            case 'welcome':
                goToNextField("email");
                break;
            case 'email':
                goToNextField("username");
                break;
            case 'username':
                goToNextField('password');
                break;
            case 'password':
                navigate("2fa");
                break;
        }
    });
}
;
function retry() {
    return __awaiter(this, void 0, void 0, function* () {
        switch (currentStep) {
            case 'welcome':
                break;
            case 'email':
                goToNextField("welcome");
                break;
            case 'username':
                goToNextField('email');
                break;
            case 'password':
                goToNextField('username');
                break;
        }
    });
}
;
function loadPage(page) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
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
        currentStep = "welcome";
        (_a = document.querySelector("#enter")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", enter);
        (_b = document.querySelector("#retry")) === null || _b === void 0 ? void 0 : _b.addEventListener('click', retry);
        // content.querySelector('#loginForm')?.addEventListener("submit", login);
        (_c = content.querySelector('#registerForm')) === null || _c === void 0 ? void 0 : _c.addEventListener("submit", register);
        (_d = content.querySelector('#twofaForm')) === null || _d === void 0 ? void 0 : _d.addEventListener("submit", login2);
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