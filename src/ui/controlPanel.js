export function createControlPanel(cycle, onClose) {
  const panel = document.getElementById('panel');
  const backdrop = document.getElementById('panel-backdrop');
  const phaseList = document.getElementById('phase-list');
  const phaseName = document.getElementById('panel-phase-name');
  let openFlag = false;

  function open() {
    openFlag = true;
    panel.style.display = 'block';
    backdrop.style.display = 'block';
    if (document.pointerLockElement) document.exitPointerLock();
    render();
  }
  function close() {
    openFlag = false;
    panel.style.display = 'none';
    backdrop.style.display = 'none';
    if (onClose) onClose();
  }
  function isOpen() { return openFlag; }

  document.getElementById('panel-close').onclick = () => close();
  backdrop.onclick = () => close();

  document.getElementById('btn-start').onclick = () => { cycle.start(); close(); };

  // Пауза НЕ закрывает панель — видно, что процесс встал
  document.getElementById('btn-toggle').onclick = () => { cycle.pause(); render(); };

  document.getElementById('btn-next').onclick = () => { cycle.next(); render(); };
  document.getElementById('btn-reset').onclick = () => { cycle.reset(); render(); };

  function render() {
    const info = cycle.getPhase();
    phaseName.textContent = info.name;
    phaseList.innerHTML = '';
    info.list.forEach((name, i) => {
      const li = document.createElement('li');
      li.textContent = name;
      if (i === info.index) li.classList.add('active');
      phaseList.appendChild(li);
    });
    document.getElementById('btn-toggle').textContent =
      cycle.isPaused() ? '▶ Продолжить' : '⏸ Пауза';
  }
  setInterval(() => { if (openFlag) render(); }, 500);
  return { open, close, isOpen };
}