export function updateHUD(cycle) {
  const el = document.getElementById('hud');
  const info = cycle.getPhase();
  let extra = '';
  if (cycle.isPaused()) extra = ' · <b style="color:#ffb347">ПАУЗА</b>';
  else if (cycle.isFinished()) extra = ' · <b style="color:#4ea3ff">цикл завершён</b>';
  el.innerHTML = `<b>Цикл:</b> ${info.name}${extra}<br>
    WASD — ходьба · мышь — обзор · Shift — бег · <b>F</b> — действие · Esc — отмена`;
}