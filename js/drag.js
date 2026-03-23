// js/drag.js — Touch drag-to-reorder for the prayer list

let _dragState = null;

function enableDrag(handle, card, container) {
  handle.addEventListener('touchstart', e => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = card.getBoundingClientRect();

    const ph = document.createElement('div');
    ph.style.cssText = [
      'height:' + rect.height + 'px',
      'border-radius:14px',
      'background:var(--cream-dark)',
      'margin-bottom:10px',
      'flex-shrink:0',
      'border:2px dashed var(--parchment)',
    ].join(';');
    container.insertBefore(ph, card.nextSibling);

    card.classList.add('dragging');
    card.style.cssText = [
      'position:fixed',
      'width:' + rect.width + 'px',
      'left:' + rect.left + 'px',
      'top:' + (touch.clientY - (touch.clientY - rect.top)) + 'px',
      'z-index:500',
    ].join(';');

    _dragState = { card, container, ph, offsetY: touch.clientY - rect.top };
  }, { passive: false });

  handle.addEventListener('touchmove', e => {
    if (!_dragState) return;
    e.preventDefault();
    const touch = e.touches[0];
    _dragState.card.style.top = (touch.clientY - _dragState.offsetY) + 'px';

    const siblings = [..._dragState.container.querySelectorAll('.prayer-card:not(.dragging)')];
    let before = null;
    for (const s of siblings) {
      const r = s.getBoundingClientRect();
      if (touch.clientY < r.top + r.height / 2) { before = s; break; }
    }
    if (before) _dragState.container.insertBefore(_dragState.ph, before);
    else _dragState.container.appendChild(_dragState.ph);
  }, { passive: false });

  handle.addEventListener('touchend', () => {
    if (!_dragState) return;
    const { card, container, ph } = _dragState;
    card.classList.remove('dragging');
    card.style.cssText = '';
    container.insertBefore(card, ph);
    ph.remove();
    savePrayerList([...container.querySelectorAll('.prayer-card')].map(c => c.dataset.id));
    _dragState = null;
    renderPrayer();
  });
}
