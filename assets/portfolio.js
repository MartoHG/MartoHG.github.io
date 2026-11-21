const galleryLinks = Array.from(document.querySelectorAll('[data-gallery-image]'));

if (galleryLinks.length && typeof document.createElement('dialog').showModal === 'function') {
  const viewer = document.createElement('dialog');
  viewer.className = 'viewer';
  viewer.setAttribute('aria-label', 'Visor de capturas');
  viewer.innerHTML = `
    <div class="viewer-tools">
      <button type="button" data-step="-1">Anterior</button>
      <button type="button" data-step="1">Siguiente</button>
      <button type="button" class="viewer-close" autofocus>Cerrar</button>
    </div>
    <figure class="viewer-figure">
      <img alt="">
      <figcaption aria-live="polite"></figcaption>
    </figure>
  `;
  document.body.append(viewer);

  const image = viewer.querySelector('img');
  const caption = viewer.querySelector('figcaption');
  const closeButton = viewer.querySelector('.viewer-close');
  let currentIndex = 0;
  let opener;

  function showImage(index) {
    currentIndex = (index + galleryLinks.length) % galleryLinks.length;

    const link = galleryLinks[currentIndex];
    image.alt = link.querySelector('img').alt;
    image.src = link.href;
    caption.textContent = `${currentIndex + 1} de ${galleryLinks.length} · ${link.closest('figure').querySelector('figcaption').textContent.trim()}`;
  }

  galleryLinks.forEach((link, index) => {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;

      event.preventDefault();
      opener = link;
      showImage(index);
      viewer.showModal();
    });
  });

  for (const button of viewer.querySelectorAll('[data-step]')) {
    button.addEventListener('click', () => showImage(currentIndex + Number(button.dataset.step)));
  }

  viewer.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

    event.preventDefault();
    showImage(currentIndex + (event.key === 'ArrowLeft' ? -1 : 1));
  });

  viewer.addEventListener('click', event => {
    if (event.target !== viewer) return;

    const { left, right, top, bottom } = viewer.getBoundingClientRect();
    if (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom) {
      viewer.close();
    }
  });

  closeButton.addEventListener('click', () => viewer.close());
  viewer.addEventListener('close', () => opener?.focus());
}
