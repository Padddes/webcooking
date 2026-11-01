// Sidebar behaviour: desktop collapse toggle and the mobile navigation drawer.

const root = document.documentElement;
const sidebar = document.getElementById('sidebar');
const openButton = document.querySelector<HTMLButtonElement>('[data-drawer-open]');
const collapseButton = document.querySelector<HTMLButtonElement>('[data-sidebar-toggle]');
const backdrop = document.querySelector<HTMLElement>('.drawer-backdrop');
const outside = Array.from(document.querySelectorAll<HTMLElement>('.main-col, .topbar, .skip-link'));
const mobile = window.matchMedia('(max-width: 899.98px)');

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

// ── Desktop collapse ─────────────────────────────────────────────────────
function setCollapsed(collapsed: boolean, persist: boolean): void {
  root.classList.toggle('sidebar-collapsed', collapsed);
  if (collapseButton) {
    collapseButton.setAttribute('aria-pressed', String(collapsed));
    const label = collapseButton.querySelector('.nav-label');
    if (label) label.textContent = collapsed ? 'Expand sidebar' : 'Collapse sidebar';
    collapseButton.setAttribute('aria-label', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
  }
  if (persist) {
    try {
      window.localStorage.setItem('paddes:sidebar', collapsed ? 'collapsed' : 'expanded');
    } catch {
      // Not persisted when storage is unavailable; the toggle still works for this page.
    }
  }
}

setCollapsed(root.classList.contains('sidebar-collapsed'), false);
collapseButton?.addEventListener('click', () => {
  setCollapsed(!root.classList.contains('sidebar-collapsed'), true);
});

// ── Mobile drawer ────────────────────────────────────────────────────────
function isOpen(): boolean {
  return root.classList.contains('drawer-open');
}

function openDrawer(): void {
  if (!sidebar || !openButton) return;
  root.classList.add('drawer-open');
  openButton.setAttribute('aria-expanded', 'true');
  sidebar.setAttribute('role', 'dialog');
  sidebar.setAttribute('aria-modal', 'true');
  if (backdrop) backdrop.hidden = false;
  outside.forEach((el) => el.setAttribute('inert', ''));
  const current = sidebar.querySelector<HTMLElement>('[aria-current="page"]');
  (current ?? sidebar.querySelector<HTMLElement>(FOCUSABLE))?.focus();
}

function closeDrawer(returnFocus = true): void {
  if (!sidebar || !openButton) return;
  root.classList.remove('drawer-open');
  openButton.setAttribute('aria-expanded', 'false');
  sidebar.removeAttribute('role');
  sidebar.removeAttribute('aria-modal');
  if (backdrop) backdrop.hidden = true;
  outside.forEach((el) => el.removeAttribute('inert'));
  if (returnFocus) openButton.focus();
}

openButton?.addEventListener('click', () => (isOpen() ? closeDrawer() : openDrawer()));
document.querySelectorAll<HTMLElement>('[data-drawer-close]').forEach((el) =>
  el.addEventListener('click', () => closeDrawer()),
);

document.addEventListener('keydown', (event: KeyboardEvent) => {
  if (!isOpen() || !sidebar) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    closeDrawer();
    return;
  }
  if (event.key === 'Tab') {
    // Keep keyboard focus inside the open drawer.
    const items = Array.from(sidebar.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0]!;
    const last = items[items.length - 1]!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

// Leaving the mobile layout (rotate / resize) closes the drawer cleanly.
mobile.addEventListener('change', (e: MediaQueryListEvent) => {
  if (!e.matches && isOpen()) closeDrawer(false);
});
