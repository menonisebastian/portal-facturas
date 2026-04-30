import { initChat } from './chat.js';
import { EventBus } from '../utils.js';

const THEME_STORAGE_KEY = 'portal_theme';

/**
 * Determines the initial theme based on:
 * 1. Saved preference in localStorage (highest priority)
 * 2. System preference via prefers-color-scheme
 * 3. Defaults to 'light'
 */
function getInitialTheme() {
    // 1. Check localStorage
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;

    // 2. Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }

    // 3. Default
    return 'light';
}

/**
 * Applies a theme to the document and updates UI controls.
 * @param {'dark'|'light'} theme
 */
function applyTheme(theme) {
    const isDark = theme === 'dark';

    document.documentElement.classList.toggle('dark', isDark);

    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');

    if (themeIcon) themeIcon.textContent = isDark ? 'light_mode' : 'dark_mode';
    if (themeText) themeText.textContent = isDark ? 'Modo Claro' : 'Modo Oscuro';
}

export function initTheme() {
    // ── Apply initial theme ──
    const initialTheme = getInitialTheme();
    applyTheme(initialTheme);

    // ── Listen for system theme changes (real-time) ──
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
        // Only auto-switch if user hasn't manually chosen a theme
        const saved = localStorage.getItem(THEME_STORAGE_KEY);
        if (!saved) {
            const systemTheme = e.matches ? 'dark' : 'light';
            applyTheme(systemTheme);
            EventBus.emit('theme:changed', { theme: systemTheme });

            // Reinit chat with new theme
            initChat(systemTheme).catch(err => {
                console.warn('⚠️ No se pudo reiniciar el chat con el nuevo tema:', err);
            });
        }
    });

    // ── Toggle button ──
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const isDark = document.documentElement.classList.toggle('dark');
            const newTheme = isDark ? 'dark' : 'light';

            // Save explicit user preference
            localStorage.setItem(THEME_STORAGE_KEY, newTheme);
            applyTheme(newTheme);
            EventBus.emit('theme:changed', { theme: newTheme });

            // Reiniciar el chat con el nuevo tema (async, no bloquea)
            initChat(newTheme).catch(err => {
                console.warn('⚠️ No se pudo reiniciar el chat con el nuevo tema:', err);
            });
        });
    }
}
