import { SECTIONS } from '../config.js';
import { loadRealInvoicesTable } from './invoices.js';
import { loadRealDashboardData } from './dashboard.js';
import { loadChatHistory } from './chat.js';

const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebar-overlay');
const navItems = document.querySelectorAll('.nav-item');

export function toggleSidebar(forceClose = false) {
    if (forceClose) {
        sidebar?.classList.remove('translate-x-0');
        overlay?.classList.remove('block');
        overlay?.classList.add('hidden');
    } else {
        sidebar?.classList.toggle('translate-x-0');
        overlay?.classList.toggle('hidden');
    }
}

export function showSection(sectionId, updateHistory = true) {
    // 1. Mostrar/ocultar secciones
    SECTIONS.forEach(id => {
        const section = document.getElementById(`${id}-section`);
        if (section) {
            section.classList.toggle('hidden', id !== sectionId);
        }
    });

    // 2. Update active nav item
    navItems.forEach(item => {
        const isActive = item.getAttribute('data-section') === sectionId;
        item.classList.toggle('active', isActive);
    });

    // 3. Close sidebar on mobile after selection
    if (window.innerWidth < 1024) {
        toggleSidebar(true);
    }

    // 4. Update URL without page reload
    if (updateHistory) {
        const path = sectionId === 'dashboard' ? '/' : `/${sectionId}`;
        window.history.pushState({ sectionId }, '', path);
    }

    // 5. Cargar los datos reales
    if (sectionId === 'invoices') {
        loadRealInvoicesTable();
    } else if (sectionId === 'dashboard') {
        loadRealDashboardData();
    } else if (sectionId === 'assistant') {
        loadChatHistory();
    }
}

export function handleRouting() {
    const path = window.location.pathname.replace('/', '') || 'dashboard';
    const sectionId = SECTIONS.includes(path) ? path : 'dashboard';
    showSection(sectionId, false);
}

export function initSidebar() {
    const burgerBtn = document.getElementById('hamburger-menu');
    const closeSidebarBtn = document.getElementById('close-sidebar');
    const logoutBtn = document.getElementById('logout-btn');

    if (burgerBtn) burgerBtn.addEventListener('click', () => toggleSidebar());
    if (overlay) overlay.addEventListener('click', () => toggleSidebar(true));
    if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', () => toggleSidebar(true));

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation(); 
            if (typeof window.spLogout === 'function') {
                window.spLogout(); 
            }
        });
    }

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.getAttribute('data-section');
            showSection(section);
        });
    });

    window.addEventListener('popstate', (e) => {
        if (e.state && e.state.sectionId) {
            showSection(e.state.sectionId, false);
        } else {
            handleRouting();
        }
    });
}
