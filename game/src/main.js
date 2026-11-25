// WOK RUSH - Main Entry Point

import { GameState } from './state.js';
import { AudioManager } from './audio.js';
import { Renderer } from './render.js';
import { setupInput } from './input.js';
import { handleScreenshotStaging } from './shots.js';

// Global error handler
window.addEventListener('error', (e) => {
  console.error('Global error:', e.message, e.filename, e.lineno, e.colno, e.error);
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled rejection:', e.reason);
});

window.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded - starting WOK RUSH');
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // Debug: draw immediately to confirm canvas works
  ctx.fillStyle = '#00ffff';
  ctx.fillRect(0, 0, 20, 20);
  ctx.font = '14px sans-serif';
  ctx.fillText('INIT', 5, 15);

  const state = new GameState();
  const audio = new AudioManager();
  const renderer = new Renderer(ctx);

  console.log('Game objects created, screen:', state.screen);

  let prevCombo = 0;
  let prevScreen = state.screen;
  let hasInteracted = false;

  setupInput(canvas, state, audio);

  try {
    handleScreenshotStaging(state);
    console.log('After screenshot staging, screen:', state.screen);
  } catch (e) {
    console.error('Screenshot staging error:', e, e.stack);
    ctx.fillStyle = '#ff0000';
    ctx.font = '20px sans-serif';
    ctx.fillText('STAGING ERROR: ' + e.message, 10, 100);
  }

  // If screenshot mode, don't auto-start music
  const isScreenshotMode = window.location.search.includes('shot=');

  // Wrapper to track interactions for audio unlock
  const originalAddIngredient = state.addIngredient.bind(state);
  state.addIngredient = function(id, audioManager) {
    if (!hasInteracted) {
      hasInteracted = true;
      audioManager.init();
      if (!isScreenshotMode) audioManager.startMusic();
    }
    originalAddIngredient(id, audioManager);
  };

  const originalServeDish = state.serveDish.bind(state);
  state.serveDish = function(audioManager) {
    if (!hasInteracted) {
      hasInteracted = true;
      audioManager.init();
      if (!isScreenshotMode) audioManager.startMusic();
    }
    originalServeDish(audioManager);
  };

  const originalReset = state.reset.bind(state);
  state.reset = function() {
    originalReset();
    renderer.triggerEntranceFlash();
    if (!isScreenshotMode && hasInteracted) {
      audio.startMusic();
    }
  };

  let lastTime = performance.now();
  let frameCount = 0;

  function gameLoop(now) {
    try {
      const dt = Math.min(now - lastTime, 50); // Cap dt to avoid huge jumps
      lastTime = now;
      frameCount++;

      // Debug: draw frame counter at START of frame
      ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
      ctx.font = '16px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`Frame: ${frameCount} | Screen: ${state.screen} | Orders: ${state.orders.length}`, 10, 50);

      // Track combo milestones
      if (state.combo > prevCombo) {
        if (state.combo === 5 || state.combo === 10 || state.combo === 15 || state.combo === 20) {
          renderer.triggerComboFlash(state.combo);
          audio.playSfx('combo');
        }
      }
      prevCombo = state.combo;

      // Track screen changes for entrance flash
      if (state.screen !== prevScreen) {
        renderer.triggerEntranceFlash();
        prevScreen = state.screen;
      }

      state.update(dt, audio);
      renderer.render(state);

      if (frameCount === 1 || frameCount % 60 === 0) {
        console.log(`Frame ${frameCount}, screen: ${state.screen}, orders: ${state.orders.length}, assembly: ${state.assembly.length}`);
      }

      requestAnimationFrame(gameLoop);
    } catch (e) {
      console.error('Game loop error:', e, e.stack);
      // Draw error on canvas
      ctx.fillStyle = '#ff0000';
      ctx.font = '16px monospace';
      ctx.fillText(`ERROR: ${e.message}`, 10, 70);
      // Still continue the loop
      requestAnimationFrame(gameLoop);
    }
  }

  console.log('Starting game loop');
  // Debug: draw before loop starts
  ctx.fillStyle = '#ffff00';
  ctx.fillRect(30, 0, 20, 20);
  ctx.font = '14px sans-serif';
  ctx.fillText('LOOP', 35, 15);
  requestAnimationFrame(gameLoop);
});