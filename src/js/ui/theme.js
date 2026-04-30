import { initChat } from './chat.js';

export function initTheme() {
    const themeBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const isDark = document.documentElement.classList.toggle('dark');
            const newTheme = isDark ? 'dark' : 'light';
            
            localStorage.setItem('portal_theme', newTheme);
            
            if (themeIcon) themeIcon.textContent = isDark ? 'light_mode' : 'dark_mode';
            if (themeText) themeText.textContent = isDark ? 'Modo Claro' : 'Modo Oscuro';
            
            initChat(newTheme);
        });
    }
}
