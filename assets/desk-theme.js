(() => {
  const storageKey = 'marto-theme';
  const root = document.documentElement;
  const pageColor = document.querySelector('meta[name="theme-color"]');
  let toggle;
  let requestedTheme;
  let requestId = 0;

  function readTheme() {
    try {
      return localStorage.getItem(storageKey) === 'dark' ? 'dark' : 'light';
    } catch {
      return root.dataset.theme || 'light';
    }
  }

  function applyTheme(theme) {
    const changed = root.dataset.theme !== theme;
    const dark = theme === 'dark';
    root.dataset.theme = theme;
    if (pageColor) pageColor.content = dark ? '#17141f' : '#faf8fc';
    toggle?.setAttribute('aria-pressed', String(dark));
    if (changed) document.dispatchEvent(new CustomEvent('desk:theme-change', { detail: { dark } }));
  }

  function restoreTheme() {
    requestedTheme = readTheme();
    requestId++;
    applyTheme(requestedTheme);
  }

  restoreTheme();
  addEventListener('storage', event => {
    if (event.key === storageKey || event.key === null) restoreTheme();
  });
  addEventListener('pageshow', event => {
    if (event.persisted) restoreTheme();
  });

  document.addEventListener('DOMContentLoaded', () => {
    toggle = document.querySelector('[data-theme-toggle]');
    if (!toggle) return;
    toggle.setAttribute('aria-pressed', String(root.dataset.theme === 'dark'));
    toggle.addEventListener('click', () => {
      const theme = requestedTheme === 'dark' ? 'light' : 'dark';
      requestedTheme = theme;
      const id = ++requestId;
      function commit() {
        if (id !== requestId) return;
        requestId++;
        applyTheme(theme);
        try {
          localStorage.setItem(storageKey, theme);
        } catch {
          // The current page can still change theme when storage is unavailable.
        }
      }

      const request = new CustomEvent('desk:theme-request', {
        cancelable: true,
        detail: { dark: theme === 'dark', commit },
      });
      if (document.dispatchEvent(request)) commit();
    });
  });
})();
