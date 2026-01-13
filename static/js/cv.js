// Custom JS for cv.html
AOS.init({
    duration: 800,
    easing: 'ease-in-out',
    once: true
});

// Initialize mobile menu functionality
document.addEventListener('DOMContentLoaded', function() {
    const menuBtn = document.getElementById('menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    let isMenuOpen = false;

    // Function to close mobile menu
    function closeMobileMenu() {
        mobileMenu.classList.add('hidden');
        menuBtn.innerHTML = feather.icons.menu.toSvg();
        isMenuOpen = false;
    }

    // Function to open mobile menu
    function openMobileMenu() {
        mobileMenu.classList.remove('hidden');
        menuBtn.innerHTML = feather.icons.x.toSvg();
        isMenuOpen = true;
    }

    // Toggle mobile menu
    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isMenuOpen) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (isMenuOpen && !mobileMenu.contains(e.target) && e.target !== menuBtn) {
            closeMobileMenu();
        }
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768) { // md breakpoint
            closeMobileMenu();
        }
    });

    // Handle escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isMenuOpen) {
            closeMobileMenu();
        }
    });
});
feather.replace();
