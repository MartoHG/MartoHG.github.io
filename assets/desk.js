const index = document.querySelector('[data-project-tabs]');
const stage = document.querySelector('[data-diorama]');
const tabs = Array.from(index.querySelectorAll('[data-project]'));
const panels = tabs.map(tab => document.getElementById('vista-' + tab.dataset.project));
let selection = 0;
let scene;

index.setAttribute('role', 'tablist');
index.setAttribute('aria-orientation', 'vertical');
panels[0].parentElement.dataset.enhanced = '';

tabs.forEach((tab, position) => {
  tab.id = 'carpeta-' + tab.dataset.project;
  tab.setAttribute('role', 'tab');
  tab.setAttribute('aria-controls', panels[position].id);
  panels[position].setAttribute('role', 'tabpanel');
  panels[position].setAttribute('aria-labelledby', tab.id);

  tab.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    selectProject(position, { remember: true });
  });

  tab.addEventListener('keydown', event => {
    let next;
    switch (event.key) {
      case 'ArrowUp': next = (position + tabs.length - 1) % tabs.length; break;
      case 'ArrowDown': next = (position + 1) % tabs.length; break;
      case 'Home': next = 0; break;
      case 'End': next = tabs.length - 1; break;
      case ' ': next = position; break;
      default: return;
    }
    event.preventDefault();
    selectProject(next, { remember: true });
    tabs[next].focus();
  });
});

function selectProject(position, { remember = false } = {}) {
  const changed = position !== selection;
  selection = position;
  const slug = tabs[position].dataset.project;
  stage.dataset.project = slug;

  tabs.forEach((tab, tabPosition) => {
    const active = tabPosition === position;
    tab.toggleAttribute('data-selected', active);
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    panels[tabPosition].hidden = !active;
    panels[tabPosition].inert = !active;
  });

  if (remember && changed) {
    const url = new URL(location.href);
    url.searchParams.set('proyecto', slug);
    history.replaceState(history.state, '', url);
  }

  if (changed || remember) scene?.select(position);
}

function restoreProject() {
  const slug = new URLSearchParams(location.search).get('proyecto');
  selectProject(Math.max(0, tabs.findIndex(tab => tab.dataset.project === slug)));
}

restoreProject();
window.addEventListener('popstate', restoreProject);

async function loadScene() {
  try {
    const { mountDesk } = await import('./desk-scene.js');
    const folderNames = tabs.map(tab => tab.dataset.folderLabel || tab.querySelector('strong').textContent);
    scene = mountDesk(stage, folderNames, selection);
  } catch {
    // The poster and all portfolio navigation are already present.
  }
}

const preloadObserver = new IntersectionObserver(entries => {
  if (!entries.some(entry => entry.isIntersecting)) return;
  preloadObserver.disconnect();
  // Give the initial HTML and poster a paint before compiling WebGL.
  requestAnimationFrame(() => setTimeout(loadScene, 0));
}, { rootMargin: '150px' });
preloadObserver.observe(stage);
