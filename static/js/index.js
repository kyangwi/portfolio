// Custom JS for index.html
// Initialize animations
AOS.init({
    duration: 800,
    easing: 'ease-in-out',
    once: true
});

// Initialize Vanta.js background
VANTA.GLOBE({
    el: "#vanta-bg",
    mouseControls: true,
    touchControls: true,
    gyroControls: false,
    minHeight: 200.00,
    minWidth: 200.00,
    scale: 1.00,
    scaleMobile: 1.00,
    color: 0x3b82f6,
    backgroundColor: 0xffffff,
    size: 0.8
});

// Mobile menu toggle
const menuBtn = document.getElementById('menu-btn');
if (menuBtn) {
    menuBtn.addEventListener('click', function() {
        const menu = document.getElementById('mobile-menu');
        menu.classList.toggle('hidden');
        this.innerHTML = menu.classList.contains('hidden') ? 
            feather.icons.menu.toSvg() : feather.icons.x.toSvg();
    });
}

// Replace all feather icons
feather.replace();
