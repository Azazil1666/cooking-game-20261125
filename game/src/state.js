import { RECIPES } from './recipes.js';

export class GameState {
  constructor() {
    this.screen = 'title';
    this.score = 0;
    this.combo = 0;
    this.strikes = 0;
    this.maxStrikes = 3;
    this.orders = [];
    this.assembly = [];
    this.nextOrderTime = 0;
    this.orderInterval = 3000;
    this.startTime = 0;
    this.elapsed = 0;
    this.screenShake = 0;
    this.particles = [];
    this.floatingTexts = [];
    this.dishesServed = 0;
    this.selectedTargetOrderIndex = 0;
  }

  reset() {
    this.screen = 'playing';
    this.score = 0;
    this.combo = 0;
    this.strikes = 0;
    this.orders = [];
    this.assembly = [];
    this.nextOrderTime = 0;
    this.orderInterval = 3000;
    this.startTime = Date.now();
    this.elapsed = 0;
    this.screenShake = 0;
    this.particles = [];
    this.floatingTexts = [];
    this.dishesServed = 0;
    this.selectedTargetOrderIndex = 0;

    this.spawnOrder();
    this.spawnOrder();
  }

  setScreen(screen) {
    this.screen = screen;
  }

  spawnOrder(forcedRecipeId = null) {
    if (this.orders.length >= 5) return;

    let recipe;
    if (forcedRecipeId) {
      recipe = RECIPES.find(r => r.id === forcedRecipeId);
    } else {
      recipe = RECIPES[Math.floor(Math.random() * RECIPES.length)];
    }

    const order = {
      id: Math.random().toString(36).substr(2, 9),
      name: recipe.name,
      ingredients: [...recipe.ingredients],
      startTime: Date.now(),
      maxTime: 15000 - Math.min(10000, this.score * 10),
      timeLeft: 15000 - Math.min(10000, this.score * 10),
      reward: 100
    };
    this.orders.push(order);
    this.nextOrderTime = Date.now() + this.orderInterval;
  }

  update(dt, audio) {
    if (this.screen !== 'playing') return;

    this.elapsed += dt;
    this.screenShake = Math.max(0, this.screenShake - dt * 0.01);

    // Update orders
    for (let i = this.orders.length - 1; i >= 0; i--) {
      const order = this.orders[i];
      const elapsed = Date.now() - order.startTime;
      order.timeLeft = Math.max(0, order.maxTime - elapsed);

      if (order.timeLeft <= 0) {
        this.orders.splice(i, 1);
        this.strikes++;
        this.combo = 0;
        this.screenShake = 10;
        audio.playSfx('strike');
        if (this.strikes >= this.maxStrikes) {
          this.screen = 'gameover';
        }
      }
    }

    // Add new orders
    if (Date.now() > this.nextOrderTime && this.orders.length < 5) {
      this.spawnOrder();
      this.orderInterval = Math.max(1000, 3000 - (this.score / 100) * 100);
    }

    // Update particles
    this.particles = this.particles.filter(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.alpha = Math.max(0, p.life / p.maxLife);
      return p.life > 0;
    });

    // Update floating texts
    this.floatingTexts = this.floatingTexts.filter(t => {
      t.y -= 0.05 * dt;
      t.life -= dt;
      return t.life > 0;
    });
  }

  addIngredient(id, audio) {
    if (this.screen !== 'playing') return;

    this.assembly.push(id);
    audio.playSfx('click');

    // Check if mistake
    const currentOrder = this.orders[0];
    if (currentOrder) {
      const expected = currentOrder.ingredients[this.assembly.length - 1];
      if (id !== expected) {
        this.screenShake = 10;
        this.assembly = [];
        this.combo = 0;
        audio.playSfx('mistake');
      }
    }
  }

  serveDish(audio) {
    if (this.screen !== 'playing') return;
    if (this.assembly.length === 0) return;

    const currentOrder = this.orders[0];
    if (currentOrder && this.assembly.length === currentOrder.ingredients.length) {
      // Success!
      const bonus = Math.floor((1 - (currentOrder.maxTime - currentOrder.timeLeft) / currentOrder.maxTime) * 100);
      const points = 100 + bonus + (this.combo * 10);
      this.score += points;
      this.combo++;
      this.dishesServed++;
      this.orders.shift();
      this.assembly = [];

      this.spawnParticles(640, 600);
      this.spawnFloatingText(`+${points}`, 640, 550, '#00ff88');
      audio.playSfx('serve');
    } else {
      // Not ready or wrong
      this.screenShake = 5;
      audio.playSfx('mistake');
    }
  }

  spawnParticles(x, y) {
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        life: 500 + Math.random() * 500,
        maxLife: 500 + Math.random() * 500,
        color: '#fff',
        alpha: 1.0,
        text: ['✨', '⭐', '💫', '✦'][Math.floor(Math.random() * 4)]
      });
    }
  }

  spawnFloatingText(text, x, y, color = '#00ff88') {
    this.floatingTexts.push({
      text, x, y,
      life: 1000,
      color
    });
  }
}