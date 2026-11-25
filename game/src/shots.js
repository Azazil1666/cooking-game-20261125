import { RECIPES, INGREDIENTS } from './recipes.js';

export function handleScreenshotStaging(state) {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');

  if (!shot) return;

  if (shot === 'title') {
    state.screen = 'title';
  } else if (shot === 'playing') {
    state.screen = 'playing';
    state.orders = [
      {
        id: 'ord1',
        name: RECIPES[0].name,
        ingredients: [...RECIPES[0].ingredients],
        maxTime: 12000,
        timeLeft: 9000,
        reward: 100,
        startTime: Date.now() - 3000
      },
      {
        id: 'ord2',
        name: RECIPES[1].name,
        ingredients: [...RECIPES[1].ingredients],
        maxTime: 11000,
        timeLeft: 7500,
        reward: 120,
        startTime: Date.now() - 3500
      },
      {
        id: 'ord3',
        name: RECIPES[2].name,
        ingredients: [...RECIPES[2].ingredients],
        maxTime: 10000,
        timeLeft: 5000,
        reward: 150,
        startTime: Date.now() - 5000
      }
    ];
    state.assembly = ['rice', 'kecap']; // One dish mid-assembly (2 of 4 ingredients)
    state.score = 340;
    state.combo = 2;
    state.strikes = 1;
    state.dishesServed = 3;
    state.maxCombo = 2;
    state.screenShake = 0;

    // Add some particles for visual appeal
    state.particles = [];
    for (let i = 0; i < 15; i++) {
      state.particles.push({
        x: 640 + (Math.random() - 0.5) * 200,
        y: 600 + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -0.1 - Math.random() * 0.3,
        life: 500 + Math.random() * 500,
        maxLife: 1000,
        color: '#fff',
        alpha: 0.5 + Math.random() * 0.5,
        text: ['✨', '⭐', '💫', '✦'][Math.floor(Math.random() * 4)]
      });
    }
    state.floatingTexts = [];
  } else if (shot === 'serving') {
    state.screen = 'playing';
    state.orders = [
      {
        id: 'ord4',
        name: RECIPES[2].name,
        ingredients: [...RECIPES[2].ingredients],
        maxTime: 10000,
        timeLeft: 8000,
        reward: 150,
        startTime: Date.now() - 2000
      }
    ];
    state.assembly = [...RECIPES[2].ingredients]; // Complete dish ready to serve
    state.score = 560;
    state.combo = 3;
    state.strikes = 0;
    state.dishesServed = 5;
    state.maxCombo = 3;
    state.screenShake = 0;

    // Serve moment particles
    state.particles = [];
    for (let i = 0; i < 30; i++) {
      state.particles.push({
        x: 930 + (Math.random() - 0.5) * 100,
        y: 360 + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -0.2 - Math.random() * 0.5,
        life: 800 + Math.random() * 400,
        maxLife: 1200,
        color: '#00ff88',
        alpha: 0.7 + Math.random() * 0.3,
        text: ['✨', '⭐', '💫', '✦', '💚'][Math.floor(Math.random() * 5)]
      });
    }
    state.floatingTexts = [
      { text: '+180 SERVED!', x: 930, y: 280, life: 1000, color: '#00ff88' },
      { text: 'COMBO x3!', x: 300, y: 180, life: 1500, color: '#ff6600' }
    ];
  } else if (shot === 'gameover') {
    state.screen = 'gameover';
    state.score = 820;
    state.dishesServed = 7;
    state.maxCombo = 4;
    state.combo = 0;
    state.strikes = 3;
    state.orders = [];
    state.assembly = [];
    state.particles = [];
    state.floatingTexts = [];
  }
}