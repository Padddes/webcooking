// Runs before first paint (loaded as a blocking script in <head>).
// Marks JS as available and restores the desktop sidebar state to avoid a layout jump.
(function boot(): void {
  const root = document.documentElement;
  root.classList.remove('no-js');
  root.classList.add('js');
  try {
    if (window.localStorage.getItem('paddes:sidebar') === 'collapsed') {
      root.classList.add('sidebar-collapsed');
    }
  } catch {
    // Storage can be unavailable (privacy modes); the sidebar simply starts expanded.
  }
})();
