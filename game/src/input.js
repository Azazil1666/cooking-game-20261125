import { INGREDIENTS } from './recipes.js';

export function setupInput(canvas, state, audio) {
  // Click handler
  canvas.addEventListener('click', (e) => {
    audio.init();
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (state.screen === 'title') {
      state.reset();
      return;
    }

    if (state.screen === 'gameover') {
      state.reset();
      return;
    }

    if (state.screen === 'playing') {
      // Check ingredient counter buttons (drawn in render.js at bottom)
      const startX = 60;
      const startY = 560;
      const btnW = 110;
      const btnH = 80;
      const gap = 15;

      INGREDIENTS.forEach((ing, idx) => {
        const col = idx % 5;
        const row = Math.floor(idx / 5);
        const bx = startX + col * (btnW + gap);
        const by = startY + row * (btnH + 10);

        if (x >= bx && x <= bx + btnW && y >= by && y <= by + btnH) {
          state.addIngredient(ing.id, audio);
        }
      });

      // Check serve area (plate area)
      const plateX = 930;
      const plateY = 360;
      const plateRadiusX = 140;
      const plateRadiusY = 90;
      const dx = (x - plateX) / plateRadiusX;
      const dy = (y - plateY) / plateRadiusY;
      if (dx * dx + dy * dy <= 1) {
        state.serveDish(audio);
      }
    }
  });

  // Keyboard handler
  window.addEventListener('keydown', (e) => {
    audio.init();
    if (e.key === 'r' || e.key === 'R') {
      state.reset();
      return;
    }

    if (state.screen === 'playing') {
      const num = parseInt(e.key);
      if (!isNaN(num) && num >= 1 && num <= INGREDIENTS.length) {
        const ing = INGREDIENTS[num - 1];
        if (ing) {
          state.addIngredient(ing.id, audio);
        }
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        state.serveDish(audio);
      }
    }
  });
}