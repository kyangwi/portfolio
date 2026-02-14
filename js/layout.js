import { onAuthChange, logout } from './auth.js';

const THEME_STORAGE_KEY = 'site-theme';

const navbarHTML = `
<nav class="fixed top-0 left-0 w-full z-50 liquid-glass">
    <div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
            <div class="flex items-center">
                <a href="/" class="flex items-center">
                    <img src="/static/images/logo.png" class="rounded-md" width="60px" height="60px" alt="Bwenge Kyangwi">
                </a>
            </div>
            <div class="hidden md:flex items-center space-x-8">
                <a href="/" class="text-white hover:text-green-600 transition">Home</a>
                <a href="/#about" class="text-white hover:text-green-600 transition">About</a>
                <a href="/projects.html" class="text-white hover:text-green-600 transition">Projects</a>
                <a href="/#achievements" class="text-white hover:text-green-600 transition">Achievements</a>
                <a href="/#contact" class="text-white hover:text-green-600 transition">Contact</a>
                <a href="/blog.html" class="text-white hover:text-green-600 transition">Blog</a>
                <a href="/courses.html" class="text-white hover:text-green-600 transition">Courses</a>
                <button id="theme-toggle-desktop" class="theme-toggle-btn" type="button" aria-label="Switch theme">
                    <i data-feather="sun" class="w-4 h-4"></i>
                    <span id="theme-toggle-desktop-label">Light</span>
                </button>
                <div id="auth-desktop" class="flex items-center"></div>
            </div>

            <!-- Mobile Menu Button -->
            <div class="flex md:hidden items-center gap-2">
                <button id="theme-toggle-mobile" class="theme-toggle-btn theme-toggle-mobile-btn" type="button" aria-label="Switch theme">
                    <i data-feather="sun" class="w-4 h-4"></i>
                </button>
                <button id="menu-btn" class="text-white">
                    <i data-feather="menu"></i>
                </button>
            </div>
        </div>

        <!-- Mobile menu -->
        <div id="mobile-menu" class="hidden md:hidden absolute top-16 left-0 w-full bg-gray-900/95 backdrop-blur-md shadow-xl border-t border-gray-800 animate-fade-in-down">
            <div class="px-4 py-6 space-y-3">
                <a href="/" class="block px-4 py-3 rounded-lg text-base font-medium text-white hover:text-green-400 hover:bg-white/5 transition flex items-center">
                    <i data-feather="home" class="w-5 h-5 mr-3"></i> Home
                </a>
                <a href="/#about" class="block px-4 py-3 rounded-lg text-base font-medium text-white hover:text-green-400 hover:bg-white/5 transition flex items-center">
                    <i data-feather="user" class="w-5 h-5 mr-3"></i> About
                </a>
                <a href="/projects.html" class="block px-4 py-3 rounded-lg text-base font-medium text-white hover:text-green-400 hover:bg-white/5 transition flex items-center">
                    <i data-feather="code" class="w-5 h-5 mr-3"></i> Projects
                </a>
                <a href="/#achievements" class="block px-4 py-3 rounded-lg text-base font-medium text-white hover:text-green-400 hover:bg-white/5 transition flex items-center">
                    <i data-feather="award" class="w-5 h-5 mr-3"></i> Achievements
                </a>
                <a href="/#contact" class="block px-4 py-3 rounded-lg text-base font-medium text-white hover:text-green-400 hover:bg-white/5 transition flex items-center">
                    <i data-feather="mail" class="w-5 h-5 mr-3"></i> Contact
                </a>
                <a href="/cv.html" class="block px-4 py-3 rounded-lg text-base font-medium text-white hover:text-green-400 hover:bg-white/5 transition flex items-center">
                    <i data-feather="file-text" class="w-5 h-5 mr-3"></i> CV
                </a>
                <a href="/blog.html" class="block px-4 py-3 rounded-lg text-base font-medium text-white hover:text-green-400 hover:bg-white/5 transition flex items-center">
                    <i data-feather="edit-3" class="w-5 h-5 mr-3"></i> Blog
                </a>
                <a href="/courses.html" class="block px-4 py-3 rounded-lg text-base font-medium text-white hover:text-green-400 hover:bg-white/5 transition flex items-center">
                    <i data-feather="book-open" class="w-5 h-5 mr-3"></i> Courses
                </a>
                <div id="auth-mobile"></div>
            </div>
        </div>
    </div>
</nav>
`;

const footerHTML = `
<footer class="bg-gray-900 text-white py-12 px-4">
    <div class="max-w-screen-2xl mx-auto">
        <div class="md:flex md:justify-between">
            <div class="mb-8 md:mb-0">
                <h3 class="text-xl font-bold mb-4">Bwenge Kyangwi</h3>
                <p class="text-gray-400 max-w-xs">Data Scientist & AI Engineer passionate about transforming data into actionable intelligence.</p>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-8">
                <div>
                    <h4 class="text-sm font-semibold uppercase tracking-wider mb-4">Navigation</h4>
                    <ul class="space-y-2">
                        <li><a href="/" class="text-gray-400 hover:text-white transition">Home</a></li>
                        <li><a href="/#about" class="text-gray-400 hover:text-white transition">About</a></li>
                        <li><a href="/#projects" class="text-gray-400 hover:text-white transition">Projects</a></li>
                        <li><a href="/#contact" class="text-gray-400 hover:text-white transition">Contact</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="text-sm font-semibold uppercase tracking-wider mb-4">Legal</h4>
                    <ul class="space-y-2">
                        <li><a href="/privacy.html" class="text-gray-400 hover:text-white transition">Privacy Policy</a></li>
                        <li><a href="/terms.html" class="text-gray-400 hover:text-white transition">Terms of Service</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="text-sm font-semibold uppercase tracking-wider mb-4">Connect</h4>
                    <ul class="space-y-2">
                        <li><a href="https://github.com/kyangwi" target="_blank" class="text-gray-400 hover:text-white transition">GitHub</a></li>
                        <li><a href="https://zindi.africa/users/Bwenge840/competitions" target="_blank" class="text-gray-400 hover:text-white transition">Zindi</a></li>
                        <li><a href="/#contact" class="text-gray-400 hover:text-white transition">Contact</a></li>
                    </ul>
                </div>
            </div>
        </div>
        <div class="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
            <p class="text-gray-400 text-sm">© 2024 Bwenge Kyangwi. All rights reserved.</p>
            <div class="mt-4 md:mt-0 flex space-x-6">
                <a href="#" class="text-gray-400 hover:text-white transition" aria-label="Facebook"><i data-feather="facebook"></i></a>
                <a href="#" class="text-gray-400 hover:text-white transition" aria-label="Twitter"><i data-feather="twitter"></i></a>
                <a href="#" class="text-gray-400 hover:text-white transition" aria-label="LinkedIn"><i data-feather="linkedin"></i></a>
                <a href="#" class="text-gray-400 hover:text-white transition" aria-label="Instagram"><i data-feather="instagram"></i></a>
            </div>
        </div>
    </div>
</footer>
`;

export function injectLayout() {
    document.body.insertAdjacentHTML('afterbegin', navbarHTML);
    document.body.insertAdjacentHTML('beforeend', footerHTML);
    applyTheme(getInitialTheme());

    // Inject Custom Styles for Navbar (Liquid Glass Global)
    const style = document.createElement('style');
    style.innerHTML = `
        :root {
            --theme-bg: #05080f;
            --theme-surface: #0d1423;
            --theme-surface-soft: #121c2f;
            --theme-text: #e6edf7;
            --theme-muted: #9fb0c8;
            --theme-border: rgba(159, 176, 200, 0.25);
            --theme-accent: #59AC77;
        }

        body.theme-light {
            background: radial-gradient(circle at top, #f8fbff 0%, #eff3f9 38%, #e7edf5 100%);
            color: #111827;
        }

        body.theme-dark {
            background: radial-gradient(circle at top, #0c1424 0%, var(--theme-bg) 45%, #02050b 100%);
            color: var(--theme-text);
        }

        body.theme-light .bg-slate-950\\/40 {
            background-color: rgba(248, 250, 252, 0.88) !important;
        }

        body.theme-light .bg-slate-900\\/80 {
            background-color: #ffffff !important;
        }

        body.theme-light .bg-slate-800 {
            background-color: #eef2f7 !important;
        }

        body.theme-light .border-slate-700,
        body.theme-light .border-slate-700\\/30,
        body.theme-light .border-emerald-700\\/30,
        body.theme-light .border-blue-700\\/30,
        body.theme-light .border-orange-700\\/30,
        body.theme-light .border-emerald-500\\/30 {
            border-color: rgba(148, 163, 184, 0.4) !important;
        }

        body.theme-light .text-slate-100 {
            color: #111827 !important;
        }

        body.theme-light .text-slate-200,
        body.theme-light .text-slate-300 {
            color: #374151 !important;
        }

        body.theme-light .text-slate-400,
        body.theme-light .text-slate-500 {
            color: #6b7280 !important;
        }

        body.theme-light .bg-emerald-500\\/20 {
            background-color: #dcfce7 !important;
        }

        body.theme-light .text-emerald-300,
        body.theme-light .text-emerald-400 {
            color: #047857 !important;
        }

        body.theme-light [class*="from-emerald-900/50"],
        body.theme-light [class*="to-emerald-800/30"],
        body.theme-light [class*="from-sky-900/50"],
        body.theme-light [class*="to-blue-800/30"],
        body.theme-light [class*="from-amber-900/50"],
        body.theme-light [class*="to-orange-800/30"] {
            background-image: none !important;
            background-color: #ffffff !important;
        }

        body.theme-dark .bg-gray-50,
        body.theme-dark .bg-white {
            background-color: var(--theme-surface) !important;
        }

        body.theme-dark .border-gray-100,
        body.theme-dark .border-gray-200,
        body.theme-dark .border-gray-300,
        body.theme-dark .border-gray-700,
        body.theme-dark .border-gray-800 {
            border-color: var(--theme-border) !important;
        }

        body.theme-dark .text-gray-800,
        body.theme-dark .text-gray-700,
        body.theme-dark .text-gray-600 {
            color: var(--theme-text) !important;
        }

        body.theme-dark .text-gray-500,
        body.theme-dark .text-gray-400,
        body.theme-dark .text-gray-300 {
            color: var(--theme-muted) !important;
        }

        body.theme-dark input,
        body.theme-dark textarea,
        body.theme-dark select {
            background-color: #0f172a;
            color: var(--theme-text);
            border-color: var(--theme-border);
        }

        body.theme-dark input::placeholder,
        body.theme-dark textarea::placeholder {
            color: #8194b0;
        }

        body.theme-dark .shadow-sm,
        body.theme-dark .shadow-md,
        body.theme-dark .shadow-lg,
        body.theme-dark .shadow-2xl {
            box-shadow: 0 14px 30px rgba(2, 8, 23, 0.45) !important;
        }

        body.theme-dark .bg-green-100 {
            background-color: rgba(89, 172, 119, 0.18) !important;
        }

        body.theme-dark .text-green-800 {
            color: #8fe3ad !important;
        }

        body.theme-dark .bg-gray-100 {
            background-color: rgba(159, 176, 200, 0.12) !important;
        }

        .theme-toggle-btn {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            border: 1px solid rgba(255, 255, 255, 0.25);
            border-radius: 9999px;
            padding: 0.38rem 0.72rem;
            color: #ffffff;
            background: rgba(255, 255, 255, 0.08);
            font-size: 0.82rem;
            line-height: 1;
            transition: all 0.2s ease;
        }

        .theme-toggle-btn:hover {
            border-color: rgba(89, 172, 119, 0.55);
            color: #9df0bb;
        }

        .theme-toggle-mobile-btn {
            padding: 0.38rem;
        }

        /* Liquid Glass Navigation Bar (Global Injection) */
        nav.liquid-glass {
            background: rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(15px);
            -webkit-backdrop-filter: blur(15px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }

        nav.liquid-glass a {
            color: #ffffff;
            text-decoration: none;
            font-weight: 500;
            transition: all 0.3s ease;
            position: relative;
        }

        nav.liquid-glass a:hover {
            color: #59AC77;
            text-shadow: 0 0 10px rgba(89, 172, 119, 0.5);
        }

        nav.liquid-glass .text-green-600 { /* Logo Text */
            color: #59AC77;
        }

        body.theme-light nav.liquid-glass {
            background: rgba(255, 255, 255, 0.85);
            border-bottom: 1px solid rgba(148, 163, 184, 0.35);
            box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
        }

        body.theme-light nav.liquid-glass a,
        body.theme-light #menu-btn,
        body.theme-light .theme-toggle-btn {
            color: #0f172a;
        }

        body.theme-light .theme-toggle-btn {
            border-color: rgba(148, 163, 184, 0.45);
            background: rgba(241, 245, 249, 0.9);
        }
        
        /* Mobile Menu Override */
        #mobile-menu {
             background-color: rgba(17, 24, 39, 0.95); /* gray-900 */
        }

        /* Auth Fade-in Transition */
        #auth-desktop, #auth-mobile {
            opacity: 0;
            transition: opacity 0.4s ease-out;
            min-width: 80px; /* Slight reserve to reduce shifting */
            display: flex;
            justify-content: flex-end;
        }
        #auth-desktop.loaded, #auth-mobile.loaded {
            opacity: 1;
        }
    `;
    document.head.appendChild(style);

    // Initialize Layout Scripts
    setTimeout(() => {
        setupMobileMenu();
        setupThemeToggle();
        updateThemeToggleUI();
        if (typeof feather !== 'undefined') feather.replace();
        if (typeof AOS !== 'undefined') AOS.init();

        // Ensure liquid-glass class is always present
        const nav = document.querySelector('nav');
        if (nav && !nav.classList.contains('liquid-glass')) {
            nav.classList.add('liquid-glass');
        }
    }, 100);

    // Setup Auth Listener
    onAuthChange((user) => {
        updateAuthUI(user);
        // Re-apply feather icons after auth UI update
        setTimeout(() => { if (typeof feather !== 'undefined') feather.replace(); }, 50);
    });
}

function setupMobileMenu() {
    const menuBtn = document.getElementById('menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (!menuBtn || !mobileMenu) return;

    let isMenuOpen = false;

    function toggleMenu() {
        isMenuOpen = !isMenuOpen;
        mobileMenu.classList.toggle('hidden');

        if (isMenuOpen) {
            menuBtn.classList.add('text-green-400');
        } else {
            menuBtn.classList.remove('text-green-400');
        }
    }

    menuBtn.addEventListener('click', toggleMenu);

    mobileMenu.querySelectorAll('a, button').forEach(link => {
        link.addEventListener('click', () => {
            if (isMenuOpen) toggleMenu();
        });
    });
}

function getInitialTheme() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
    return 'dark';
}

function applyTheme(theme) {
    document.body.classList.remove('theme-dark', 'theme-light');
    document.body.classList.add(theme === 'light' ? 'theme-light' : 'theme-dark');
}

function updateThemeToggleUI() {
    const isDark = document.body.classList.contains('theme-dark');
    const desktopLabel = document.getElementById('theme-toggle-desktop-label');
    const desktopBtn = document.getElementById('theme-toggle-desktop');
    const mobileBtn = document.getElementById('theme-toggle-mobile');
    const nextThemeText = isDark ? 'Light' : 'Dark';
    const iconName = isDark ? 'sun' : 'moon';

    if (desktopLabel) desktopLabel.textContent = nextThemeText;
    if (desktopBtn) {
        desktopBtn.setAttribute('aria-label', `Switch to ${nextThemeText.toLowerCase()} theme`);
        desktopBtn.innerHTML = `<i data-feather="${iconName}" class="w-4 h-4"></i><span id="theme-toggle-desktop-label">${nextThemeText}</span>`;
    }
    if (mobileBtn) {
        mobileBtn.setAttribute('aria-label', `Switch to ${nextThemeText.toLowerCase()} theme`);
        mobileBtn.innerHTML = `<i data-feather="${iconName}" class="w-4 h-4"></i>`;
    }
}

function setupThemeToggle() {
    const desktopBtn = document.getElementById('theme-toggle-desktop');
    const mobileBtn = document.getElementById('theme-toggle-mobile');
    const toggleTheme = () => {
        const nextTheme = document.body.classList.contains('theme-dark') ? 'light' : 'dark';
        applyTheme(nextTheme);
        localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
        updateThemeToggleUI();
        if (typeof feather !== 'undefined') feather.replace();
    };

    desktopBtn?.addEventListener('click', toggleTheme);
    mobileBtn?.addEventListener('click', toggleTheme);
}

function updateAuthUI(user) {
    const desktopAuth = document.getElementById('auth-desktop');
    const mobileAuth = document.getElementById('auth-mobile');

    if (user) {
        // Logged In
        const logoutBtn = `<button id="logout-btn" class="ml-4 text-white hover:text-green-700 transition text-sm font-medium">Logout</button>
                           <a href="/admin.html" class="ml-4 inline-flex items-center bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-md hover:shadow-lg text-sm">Dashboard</a>`;

        if (desktopAuth) desktopAuth.innerHTML = logoutBtn;

        if (mobileAuth) {
            mobileAuth.innerHTML = `
                <button id="logout-btn-mobile" class="w-full text-left px-4 py-3 rounded-lg text-base font-medium text-red-400 hover:text-red-300 hover:bg-white/5 transition flex items-center">Logout</button>
                <a href="/admin.html" class="block px-4 py-3 rounded-lg text-base font-medium text-green-400 hover:text-green-300 hover:bg-white/5 transition flex items-center">Dashboard</a>`;
        }

        // Attach Logout Listeners
        document.getElementById('logout-btn')?.addEventListener('click', logout);
        document.getElementById('logout-btn-mobile')?.addEventListener('click', logout);

    } else {
        // Logged Out
        const loginBtns = `<a href="/login.html" class="ml-4 text-white hover:text-green-400 transition text-sm font-medium mr-4">Login</a>
                           <a href="/signup.html" class="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm">Sign Up</a>`;

        if (desktopAuth) desktopAuth.innerHTML = loginBtns;

        if (mobileAuth) {
            mobileAuth.innerHTML = `
                <div class="pt-4 border-t border-gray-700 grid grid-cols-2 gap-4">
                    <a href="/login.html" class="text-center px-4 py-3 rounded-lg text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 transition">Login</a>
                    <a href="/signup.html" class="text-center px-4 py-3 rounded-lg text-base font-medium text-white bg-green-600 hover:bg-green-700 transition shadow-lg">Sign Up</a>
                </div>`;
        }
    }

    // Trigger Fade In
    requestAnimationFrame(() => {
        if (desktopAuth) desktopAuth.classList.add('loaded');
        if (mobileAuth) mobileAuth.classList.add('loaded');
    });

    if (typeof feather !== 'undefined') feather.replace();
}
