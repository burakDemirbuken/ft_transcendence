import AView from "./AView.js";

// ----------------------
// PARTICLE FUNCTIONS
// ----------------------
function addNewParticle(): void {
    const container = document.querySelector('.global-particles') as HTMLElement | null;
    if (!container) return;

    const particle = document.createElement('div');
    particle.classList.add('particle');

    const size = (Math.random() * 4 + 2) + 'px';
    particle.style.width = size;
    particle.style.height = size;
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDelay = '0s';
    particle.style.animationDuration = (Math.random() * 10 + 10) + 's';

    container.appendChild(particle);
    setTimeout(() => particle.remove(), 25000);
}

function initParticles(): void {
    for (let i = 0; i < 30; i++) setTimeout(addNewParticle, i * 100);

    setInterval(() => {
        const container = document.querySelector('.global-particles') as HTMLElement | null;
        if (!container) return;
        if (container.children.length < 80) addNewParticle();
    }, 1500);
}

// ----------------------
// TEAM MEMBER FUNCTIONS
// ----------------------
function toggleTeamMember(this: HTMLElement, e: MouseEvent): void {
    e.stopPropagation();
    const allMembers = document.querySelectorAll('.team-member') as NodeListOf<HTMLElement>;
    allMembers.forEach(other => {
        if (other !== this) other.classList.remove('expanded');
    });
    this.classList.toggle('expanded');
}

function closeMembersOnClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!target.closest('.team-member')) {
        const allMembers = document.querySelectorAll('.team-member') as NodeListOf<HTMLElement>;
        allMembers.forEach(m => m.classList.remove('expanded'));
    }
}

// ----------------------
// TRANSITION FUNCTIONS (HOMEPAGE ONLY)
// ----------------------
function createRipple(x: number, y: number): void {
    const overlay = document.getElementById('rippleOverlay') as HTMLElement | null;
    if (!overlay) return;

    const ripple = document.createElement('div');
    ripple.classList.add('ripple');
    const size = 100;
    ripple.style.width = size + 'px';
    ripple.style.height = size + 'px';
    ripple.style.left = `${x - size / 2}px`;
    ripple.style.top = `${y - size / 2}px`;

    overlay.appendChild(ripple);
    setTimeout(() => ripple.remove(), 1500);
}

function mainClickTransition(e: MouseEvent): void {
    const mainContainer = document.getElementById('mainContainer') as HTMLElement | null;
    const rippleOverlay = document.getElementById('rippleOverlay') as HTMLElement | null;
    const teamContent = document.getElementById('teamContent') as HTMLElement | null;
    const groupName = document.getElementById('groupName') as HTMLElement | null;

    if (!mainContainer || !rippleOverlay || !teamContent || !groupName) return;

    // Sidebar veya dar ekranlarda devre dışı
    const sidebar = document.querySelector('.sidebar') as HTMLElement | null;
    if (sidebar?.classList.contains('active')) return;

    if (mainContainer.dataset.transitioned === "true") return;
    mainContainer.dataset.transitioned = "true";

    const { clientX: x, clientY: y } = e;
    rippleOverlay.classList.add('active');
    createRipple(x, y);

    mainContainer.classList.add('transitioning');
    setTimeout(() => {
        groupName.classList.add('hidden');
        teamContent.classList.add('active');
    }, 500);
    setTimeout(() => rippleOverlay.classList.remove('active'), 1500);
}

function teamContentClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (target.closest('.team-member') || target.closest('.thanks-person') || target.closest('.social-link')) return;

    const mainContainer = document.getElementById('mainContainer') as HTMLElement | null;
    const rippleOverlay = document.getElementById('rippleOverlay') as HTMLElement | null;
    const teamContent = document.getElementById('teamContent') as HTMLElement | null;
    const groupName = document.getElementById('groupName') as HTMLElement | null;

    if (!mainContainer || !rippleOverlay || !teamContent || !groupName) return;

    if (mainContainer.dataset.transitioned !== "true") return;
    mainContainer.dataset.transitioned = "false";

    const { clientX: x, clientY: y } = e;
    rippleOverlay.classList.add('active');
    createRipple(x, y);

    teamContent.classList.remove('active');
    setTimeout(() => {
        groupName.classList.remove('hidden');
        mainContainer.classList.remove('transitioning');
    }, 500);
    setTimeout(() => rippleOverlay.classList.remove('active'), 1500);
}

// ----------------------
// SOCIAL LINKS FUNCTION
// ----------------------
function socialClick(this: HTMLElement, e: MouseEvent): void {
    this.classList.add('clicked');

    const rect = this.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const miniRipple = document.createElement('div');
    miniRipple.style.position = 'fixed';
    miniRipple.style.left = `${x}px`;
    miniRipple.style.top = `${y}px`;
    miniRipple.style.width = '4px';
    miniRipple.style.height = '4px';
    miniRipple.style.background = 'rgba(255,255,255,0.8)';
    miniRipple.style.borderRadius = '50%';
    miniRipple.style.transform = 'scale(0)';
    miniRipple.style.animation = 'miniRippleExpand 0.4s ease-out forwards';
    miniRipple.style.pointerEvents = 'none';
    miniRipple.style.zIndex = '1000';

    document.body.appendChild(miniRipple);
    setTimeout(() => miniRipple.remove(), 400);
    setTimeout(() => this.classList.remove('clicked'), 600);
}

// ----------------------
// CURSOR INDICATOR FUNCTION
// ----------------------
function cursorIndicatorSetup(): void {
    if ('ontouchstart' in window) return;
    const cursorIndicator = document.getElementById('cursorIndicator');
    if (!cursorIndicator) return;

    const body = document.body;
    let isActive = false;
    let hideTimeout: ReturnType<typeof setTimeout>;
    let ticking = false;

    const navbar = document.getElementById('navbar'); // navbar referansı

    function updateCursor(e: MouseEvent) {
        if (!ticking) {
            requestAnimationFrame(() => {
                cursorIndicator.style.left = e.clientX + 'px';
                cursorIndicator.style.top = e.clientY + 'px';
                ticking = false;
            });
            ticking = true;
        }
    }

    function showCursor() {
        if (!isActive) {
            isActive = true;
            cursorIndicator.classList.add('active');
            body.classList.add('cursor-active');
        }
        clearTimeout(hideTimeout);
        hideTimeout = setTimeout(hideCursor, 2000);
    }

    function hideCursor() {
        isActive = false;
        cursorIndicator.classList.remove('active');
        body.classList.remove('cursor-active');
    }

    function checkInteractiveElement(e: MouseEvent) {
        const el = (e.target as HTMLElement).closest('.team-member, .social-link, .thanks-person');

        // Navbar üzerindeyse devredışı bırak
        if (navbar && navbar.contains(e.target as Node)) {
            hideCursor();
            return;
        }

        if (el) hideCursor();
        else showCursor();
    }

    function mouseMove(e) {
        updateCursor(e);
        checkInteractiveElement(e);
    }

    function mouseOver(e) {
        if ((e.target as HTMLElement).closest('.team-member, .social-link, .thanks-person'))
            hideCursor();
    }

    function mouseOut(e) {
        const related = e.relatedTarget as HTMLElement | null;
        if (!related || !related.closest('.team-member, .social-link, .thanks-person'))
            showCursor();
    }

    document.querySelector('.homepage-container')?.addEventListener('mousemove', mouseMove);
    document.querySelector('.homepage-container')?.addEventListener('mouseenter', showCursor);
    document.querySelector('.homepage-container')?.addEventListener('mouseleave', hideCursor);
    document.querySelector('.homepage-container')?.addEventListener('mouseover', mouseOver);
    document.querySelector('.homepage-container')?.addEventListener('mouseout', mouseOut);
}

// ----------------------
// HOME VIEW CLASS
// ----------------------
export default class extends AView {
    constructor() {
        super();
        this.setTitle("Home");
    }

    async getHtml(): Promise<string> {
        const response = await fetch(`templates/home.html`);
        return await response.text();
    }

    async setEventHandlers(): Promise<void> {
        // Team members
        const teamMembers = document.querySelectorAll('.team-member') as NodeListOf<HTMLElement>;
        teamMembers.forEach(member => member.addEventListener('click', toggleTeamMember));

        document.addEventListener('click', closeMembersOnClick);

        // Click only on home main container
        const mainContainer = document.getElementById('mainContainer');
        if (mainContainer) mainContainer.addEventListener('click', mainClickTransition);

        const teamContent = document.getElementById('teamContent');
        if (teamContent) teamContent.addEventListener('click', teamContentClick);

        // Particles
        initParticles();

        // Social links
        const socialLinks = document.querySelectorAll('.social-link') as NodeListOf<HTMLElement>;
        socialLinks.forEach(link => link.addEventListener('click', socialClick));

        // Cursor
        cursorIndicatorSetup();
    }

    async unsetEventHandlers(): Promise<void> {
        const teamMembers = document.querySelectorAll('.team-member') as NodeListOf<HTMLElement>;
        teamMembers.forEach(member => member.removeEventListener('click', toggleTeamMember));

        document.removeEventListener('click', closeMembersOnClick);

        const mainContainer = document.getElementById('mainContainer');
        if (mainContainer) mainContainer.removeEventListener('click', mainClickTransition);

        const teamContent = document.getElementById('teamContent');
        if (teamContent) teamContent.removeEventListener('click', teamContentClick);

        const socialLinks = document.querySelectorAll('.social-link') as NodeListOf<HTMLElement>;
        socialLinks.forEach(link => link.removeEventListener('click', socialClick));
    }

    async setStylesheet(): Promise<void> {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "styles/home.css";
        document.head.appendChild(link);
    }

    async unsetStylesheet(): Promise<void> {
        const link = document.querySelector("link[href='styles/home.css']");
        if (link) link.remove();
    }

	async updateJsLanguage() {}
}
