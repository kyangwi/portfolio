// Custom JS for projects.html
AOS.init({
    duration: 800,
    easing: 'ease-in-out',
    once: true
});

const menuBtn = document.getElementById('menu-btn');
if (menuBtn) {
    menuBtn.addEventListener('click', function() {
        const menu = document.getElementById('mobile-menu');
        menu.classList.toggle('hidden');
        this.innerHTML = menu.classList.contains('hidden') ? 
            feather.icons.menu.toSvg() : feather.icons.x.toSvg();
    });
}
feather.replace();
