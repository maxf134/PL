export function isTouchDevice() {
  return matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
}

export function setupTouchUI(touch) {
  const ui = document.getElementById('touch-ui');
  if (touch) ui.style.display = 'block';
  else ui.style.display = 'none';
}