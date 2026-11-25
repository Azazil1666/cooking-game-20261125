import { INGREDIENTS, RECIPES } from './recipes.js';

export class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
    this.lastScore = 0;
    this.scorePulse = 0;
    this.comboFlash = 0;
    this.entranceFlash = 1.0;
    this.ambientParticles = [];
    this.initAmbientParticles();
  }

  initAmbientParticles() {
    for (let i = 0; i < 30; i++) {
      this.ambientParticles.push({
        x: Math.random() * 1280,
        y: 480 + Math.random() * 320,
        vx: (Math.random() - 0.5) * 0.02,
        vy: -0.01 - Math.random() * 0.02,
        size: 1 + Math.random() * 2,
        alpha: 0.1 + Math.random() * 0.15,
        color: ['#ffcc00', '#ffaa00', '#ff8800', '#ffffff'][Math.floor(Math.random() * 4)]
      });
    }
  }

  render(state) {
    const { ctx } = this;
    ctx.save();

    try {
      // Debug: show current screen
      ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
      ctx.font = '20px sans-serif';
      ctx.fillText('Screen: ' + state.screen, 20, 30);

      // Screen shake
      if (state.screenShake > 0) {
        const dx = (Math.random() - 0.5) * state.screenShake;
        const dy = (Math.random() - 0.5) * state.screenShake;
        ctx.translate(dx, dy);
      }

      // Entrance flash on state change
      if (this.entranceFlash > 0) {
        this.entranceFlash = Math.max(0, this.entranceFlash - 0.02);
      }

      // Score pulse animation
      if (state.score > this.lastScore) {
        this.scorePulse = 1.0;
      }
      this.lastScore = state.score;
      this.scorePulse = Math.max(0, this.scorePulse - 0.02);

      // Combo flash
      if (this.comboFlash > 0) {
        this.comboFlash = Math.max(0, this.comboFlash - 0.03);
      }

      // Clear background - Warm warung kitchen
      this.drawKitchenBackground(ctx);

      // Update and draw ambient particles (steam/smoke)
      this.updateAmbientParticles(ctx);

      if (state.screen === 'title') {
        this.renderTitle(state);
      } else if (state.screen === 'gameover') {
        this.renderGameOver(state);
      } else {
        this.renderPlaying(state);
      }

      // Entrance flash overlay
      if (this.entranceFlash > 0) {
        ctx.fillStyle = `rgba(255, 240, 200, ${this.entranceFlash * 0.3})`;
        ctx.fillRect(0, 0, 1280, 800);
      }
    } catch (e) {
      // Draw error on canvas for debugging
      ctx.fillStyle = '#ff0000';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('RENDER ERROR: ' + e.message, 640, 400);
      console.error('Render error:', e, e.stack);
    }

    ctx.restore();
  }

  drawKitchenBackground(ctx) {
    // Deep terracotta wall
    const grad = ctx.createLinearGradient(0, 0, 0, 480);
    grad.addColorStop(0, '#3d281e');
    grad.addColorStop(0.5, '#2c1e16');
    grad.addColorStop(1, '#1e1410');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1280, 480);

    // Wall texture - subtle brick pattern
    ctx.fillStyle = 'rgba(255, 204, 0, 0.02)';
    for (let x = 0; x < 1280; x += 40) {
      for (let y = 0; y < 480; y += 20) {
        const offset = (y / 20) % 2 === 0 ? 0 : 20;
        ctx.fillRect(x + offset, y, 38, 18);
      }
    }

    // Hanging lanterns
    this.drawLanterns(ctx);

    // Counter top - warm wood
    const counterGrad = ctx.createLinearGradient(0, 480, 0, 800);
    counterGrad.addColorStop(0, '#8b5a2b');
    counterGrad.addColorStop(0.5, '#6b4226');
    counterGrad.addColorStop(1, '#4a2c1a');
    ctx.fillStyle = counterGrad;
    ctx.fillRect(40, 480, 1200, 320);

    // Counter edge highlight
    ctx.fillStyle = 'rgba(255, 204, 0, 0.15)';
    ctx.fillRect(40, 480, 1200, 4);

    // Stove/wok area background
    ctx.fillStyle = '#1a100c';
    ctx.beginPath();
    ctx.roundRect(200, 200, 300, 250, 15);
    ctx.fill();
    ctx.strokeStyle = '#d4a574';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Chimney/vent
    ctx.fillStyle = '#2a1a15';
    ctx.fillRect(320, 120, 60, 80);
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.strokeRect(320, 120, 60, 80);
  }

  drawLanterns(ctx) {
    const lanternPositions = [100, 350, 600, 850, 1100];
    lanternPositions.forEach((x, i) => {
      const sway = Math.sin(Date.now() * 0.001 + i) * 3;
      // Lantern string
      ctx.strokeStyle = 'rgba(255,204,0,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + sway, 20);
      ctx.lineTo(x + sway, 60);
      ctx.stroke();

      // Lantern body
      const grad = ctx.createRadialGradient(x + sway, 75, 5, x + sway, 75, 25);
      grad.addColorStop(0, '#ff6600');
      grad.addColorStop(0.5, '#cc3300');
      grad.addColorStop(1, '#661100');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(x + sway, 75, 22, 28, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffcc00';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Lantern glow
      ctx.fillStyle = 'rgba(255, 102, 0, 0.15)';
      ctx.beginPath();
      ctx.ellipse(x + sway, 75, 40, 50, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  updateAmbientParticles(ctx) {
    this.ambientParticles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < 480 || p.x < 40 || p.x > 1240) {
        p.x = 60 + Math.random() * 1160;
        p.y = 750;
        p.vx = (Math.random() - 0.5) * 0.02;
        p.vy = -0.01 - Math.random() * 0.02;
      }
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;
  }

  renderTitle(state) {
    const { ctx } = this;
    // Dark overlay
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, 1280, 800);

    // Title with glow
    ctx.fillStyle = '#ffcc00';
    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur = 30;
    ctx.font = 'bold 88px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🔥 WOK RUSH 🔥', 640, 280);
    ctx.shadowBlur = 0;

    // Subtitle
    ctx.fillStyle = '#ffdd88';
    ctx.font = '32px sans-serif';
    ctx.fillText('Warung Street Food Assembly', 640, 340);

    // Instructions
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('Click or Press Any Key to Start', 640, 460);

    ctx.fillStyle = '#aaaaaa';
    ctx.font = '22px sans-serif';
    ctx.fillText('Tap ingredients in order • Serve with Enter/Space • R to Restart', 640, 520);

    // Show recipe guide
    ctx.fillStyle = '#888888';
    ctx.font = '18px sans-serif';
    let y = 580;
    RECIPES.forEach(r => {
      ctx.fillText(`${r.name}: ${r.ingredients.map(id => INGREDIENTS.find(i => i.id === id)?.icon || '•').join(' → ')}`, 640, y);
      y += 28;
    });

    // Press any key pulse
    const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.005);
    ctx.fillStyle = `rgba(0, 255, 136, ${pulse})`;
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('▼  PRESS TO BEGIN  ▼', 640, 700);
  }

  renderGameOver(state) {
    const { ctx } = this;
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, 1280, 800);

    // Game over text with shake
    ctx.fillStyle = '#ff3333';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 20;
    ctx.font = 'bold 72px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SHIFT OVER', 640, 260);
    ctx.shadowBlur = 0;

    // Score
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 48px sans-serif';
    ctx.fillText(`Final Score: ${state.score}`, 640, 350);

    ctx.fillStyle = '#ffffff';
    ctx.font = '28px sans-serif';
    ctx.fillText(`Dishes Served: ${state.dishesServed}`, 640, 410);
    ctx.fillText(`Max Combo: x${state.maxCombo || state.combo}`, 640, 460);

    // Restart prompt with pulse
    const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.005);
    ctx.fillStyle = `rgba(0, 255, 136, ${pulse})`;
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText('Press R or Click to Restart', 640, 560);

    // Warung sign-off
    ctx.fillStyle = '#888888';
    ctx.font = '20px sans-serif';
    ctx.fillText('Terima kasih! Come back tomorrow 🍚', 640, 640);
  }

  renderPlaying(state) {
    const { ctx } = this;

    // Debug: draw a marker to confirm renderPlaying is called
    ctx.fillStyle = 'rgba(255, 0, 255, 0.5)';
    ctx.fillRect(0, 0, 10, 10);

    // 1. Order Board (Top) - Warung style menu board
    this.renderOrderBoard(state);

    // 2. Kitchen Stats Header
    this.renderStatsHeader(state);

    // 3. Cooking Area - Wok & Assembly
    this.renderWokArea(state);

    // 4. Plate Ready to Serve
    this.renderPlateArea(state);

    // 5. Ingredients on Counter
    this.renderCounter(state);

    // 6. Floating particles & texts
    this.renderParticles(state);
    this.renderFloatingTexts(state);

    // 7. Combo milestone text
    if (this.comboFlash > 0) {
      this.renderComboMilestone(state);
    }
  }

  renderOrderBoard(state) {
    const { ctx } = this;
    // Board background
    const boardGrad = ctx.createLinearGradient(40, 20, 40, 170);
    boardGrad.addColorStop(0, '#1a1210');
    boardGrad.addColorStop(1, '#0d0806');
    ctx.fillStyle = boardGrad;
    ctx.fillRect(40, 20, 1200, 150);

    // Bamboo frame
    ctx.strokeStyle = '#8b6d4a';
    ctx.lineWidth = 6;
    ctx.strokeRect(40, 20, 1200, 150);

    // Inner frame
    ctx.strokeStyle = '#d4a574';
    ctx.lineWidth = 2;
    ctx.strokeRect(48, 28, 1184, 134);

    // Title
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('📋  ORDER BOARD  📋', 70, 55);

    // Draw active orders
    if (state.orders.length === 0) {
      ctx.fillStyle = '#666';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Waiting for orders...', 640, 105);
    } else {
      state.orders.forEach((ord, idx) => {
        const ox = 70 + idx * 235;
        const oy = 65;
        const ow = 220;
        const oh = 100;

        // Order card
        const isActive = idx === 0; // First order is the active one
        ctx.fillStyle = isActive ? '#2a1e18' : '#1e1614';
        ctx.fillRect(ox, oy, ow, oh);
        ctx.strokeStyle = isActive ? '#00ff88' : '#5a4a3a';
        ctx.lineWidth = isActive ? 3 : 2;
        ctx.strokeRect(ox, oy, ow, oh);

        // Order name
        ctx.fillStyle = isActive ? '#ffcc00' : '#ffffff';
        ctx.font = isActive ? 'bold 18px sans-serif' : '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(ord.name, ox + ow / 2, oy + 25);

        // Ingredients with progress
        ord.ingredients.forEach((ingId, i) => {
          const ingObj = INGREDIENTS.find(x => x.id === ingId);
          const icon = ingObj ? ingObj.icon : '•';
          const isDone = i < state.assembly.length && idx === 0;
          const isNext = i === state.assembly.length && idx === 0;

          const col = i % 2;
          const row = Math.floor(i / 2);
          const ix = ox + 15 + col * 100;
          const iy = oy + 45 + row * 25;

          // Checkbox
          ctx.strokeStyle = isDone ? '#00ff88' : (isNext ? '#ffcc00' : '#666');
          ctx.lineWidth = isNext ? 3 : 2;
          ctx.strokeRect(ix, iy - 16, 18, 18);

          if (isDone) {
            ctx.fillStyle = '#00ff88';
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('✓', ix + 9, iy);
          }

          // Icon + name
          ctx.fillStyle = isDone ? '#00ff88' : (isNext ? '#ffcc00' : '#cccccc');
          ctx.font = isNext ? 'bold 13px sans-serif' : '12px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`${icon} ${ingObj?.name || ingId}`, ix + 25, iy);
        });

        // Timer Bar - patience bar
        const timeRatio = Math.max(0, ord.timeLeft / ord.maxTime);
        const barY = oy + 90;
        ctx.fillStyle = '#33221a';
        ctx.fillRect(ox + 10, barY, ow - 20, 8);
        const barColor = timeRatio > 0.5 ? '#00ff88' : (timeRatio > 0.25 ? '#ffaa00' : '#ff3333');
        ctx.fillStyle = barColor;
        ctx.fillRect(ox + 10, barY, (ow - 20) * timeRatio, 8);

        // Timer glow when critical
        if (timeRatio < 0.3 && timeRatio > 0) {
          const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.01);
          ctx.fillStyle = `rgba(255, 51, 51, ${pulse * 0.5})`;
          ctx.fillRect(ox + 10, barY, (ow - 20) * timeRatio, 8);
        }
      });
    }
  }

  renderStatsHeader(state) {
    const { ctx } = this;
    ctx.textAlign = 'left';

    // Score with pulse
    const scoreScale = 1 + this.scorePulse * 0.15;
    ctx.save();
    ctx.translate(80, 200);
    ctx.scale(scoreScale, scoreScale);
    ctx.fillStyle = '#ffcc00';
    ctx.shadowColor = '#ffcc00';
    ctx.shadowBlur = this.scorePulse * 20;
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(`Score: ${state.score}`, 0, 0);
    ctx.restore();

    // Combo
    const comboColor = state.combo >= 10 ? '#ff00ff' : (state.combo >= 5 ? '#ff6600' : '#00ff88');
    ctx.fillStyle = comboColor;
    ctx.font = state.combo >= 5 ? 'bold 26px sans-serif' : 'bold 22px sans-serif';
    if (state.combo > 0) {
      ctx.shadowColor = comboColor;
      ctx.shadowBlur = 10;
    }
    ctx.fillText(`Combo: x${state.combo}`, 300, 210);
    ctx.shadowBlur = 0;

    // Strikes
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    let strikeText = '';
    for (let i = 0; i < state.maxStrikes; i++) {
      strikeText += i < state.strikes ? '❌ ' : '⭕ ';
    }
    ctx.fillText(`Strikes: ${strikeText}`, 520, 210);

    // Dishes served
    ctx.fillStyle = '#88ccff';
    ctx.font = '18px sans-serif';
    ctx.fillText(`Served: ${state.dishesServed}`, 900, 210);
  }

  renderWokArea(state) {
    const { ctx } = this;
    const wokX = 350;
    const wokY = 360;
    const wokR = 130;

    // Stove base
    ctx.fillStyle = '#1a100c';
    ctx.beginPath();
    ctx.roundRect(wokX - 150, wokY - 100, 300, 200, 15);
    ctx.fill();
    ctx.strokeStyle = '#d4a574';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Flame under wok (animated)
    const flameHeight = 40 + Math.sin(Date.now() * 0.01) * 10 + Math.random() * 5;
    const flameGrad = ctx.createLinearGradient(wokX, wokY + wokR, wokX, wokY + wokR + flameHeight);
    flameGrad.addColorStop(0, '#ff6600');
    flameGrad.addColorStop(0.5, '#ffaa00');
    flameGrad.addColorStop(1, 'rgba(255,204,0,0)');
    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.moveTo(wokX - 30, wokY + wokR);
    ctx.lineTo(wokX, wokY + wokR + flameHeight);
    ctx.lineTo(wokX + 30, wokY + wokR);
    ctx.closePath();
    ctx.fill();

    // Wok body - chunky rounded
    const wokGrad = ctx.createRadialGradient(wokX, wokY, 20, wokX, wokY, wokR);
    wokGrad.addColorStop(0, '#3a2a20');
    wokGrad.addColorStop(0.5, '#251c18');
    wokGrad.addColorStop(1, '#15100d');
    ctx.fillStyle = wokGrad;
    ctx.beginPath();
    ctx.arc(wokX, wokY, wokR, 0, Math.PI * 2);
    ctx.fill();

    // Wok rim
    ctx.strokeStyle = '#d4a574';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(wokX, wokY, wokR, 0, Math.PI * 2);
    ctx.stroke();

    // Wok handle
    ctx.strokeStyle = '#554433';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(wokX + wokR, wokY);
    ctx.quadraticCurveTo(wokX + wokR + 40, wokY - 20, wokX + wokR + 50, wokY);
    ctx.stroke();

    // Label
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🔥  HOT WOK  🔥', wokX, wokY - wokR - 20);

    // Assembly ingredients in wok
    if (state.assembly.length > 0) {
      state.assembly.forEach((ingId, i) => {
        const ingObj = INGREDIENTS.find(x => x.id === ingId);
        const angle = (i / Math.max(4, state.assembly.length)) * Math.PI * 2;
        const radius = 40 + (i % 2) * 20;
        const wx = wokX + Math.cos(angle + Date.now() * 0.001) * radius;
        const wy = wokY + Math.sin(angle + Date.now() * 0.001) * radius;

        // Ingredient with bounce
        const bounce = Math.sin(Date.now() * 0.008 + i) * 5;
        ctx.font = '36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(ingObj ? ingObj.icon : '🍳', wx, wy + bounce);

        // Number indicator
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(`${i + 1}`, wx + 18, wy - 18);
      });
    } else {
      ctx.fillStyle = 'rgba(255,204,0,0.4)';
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Tap ingredients below in sequence', wokX, wokY + 10);
    }

    // Next ingredient hint
    if (state.orders.length > 0 && state.assembly.length < state.orders[0].ingredients.length) {
      const nextIngId = state.orders[0].ingredients[state.assembly.length];
      const nextIng = INGREDIENTS.find(x => x.id === nextIngId);
      if (nextIng) {
        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(`Next: ${nextIng.icon} ${nextIng.name}`, wokX, wokY + wokR + 30);
      }
    }
  }

  renderPlateArea(state) {
    const { ctx } = this;
    const plateX = 930;
    const plateY = 360;
    const plateRx = 140;
    const plateRy = 90;

    // Plate shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(plateX, plateY + 5, plateRx, plateRy * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Plate body - ceramic white
    const plateGrad = ctx.createRadialGradient(plateX - 20, plateY - 20, 10, plateX, plateY, plateRx);
    plateGrad.addColorStop(0, '#fffef8');
    plateGrad.addColorStop(0.5, '#f5f5dc');
    plateGrad.addColorStop(1, '#dddcc8');
    ctx.fillStyle = plateGrad;
    ctx.beginPath();
    ctx.ellipse(plateX, plateY, plateRx, plateRy, 0, 0, Math.PI * 2);
    ctx.fill();

    // Plate rim
    ctx.strokeStyle = '#c0c0c0';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Inner plate detail
    ctx.strokeStyle = 'rgba(200,200,180,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(plateX, plateY, plateRx * 0.7, plateRy * 0.7, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Label
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🍽️  PLATE READY  🍽️', plateX, plateY - plateRy - 20);

    // Show completed dish or ready state
    if (state.orders.length > 0 && state.assembly.length === state.orders[0].ingredients.length) {
      // Ready to serve - pulsing dish
      const pulse = 1 + 0.1 * Math.sin(Date.now() * 0.008);
      ctx.save();
      ctx.translate(plateX, plateY);
      ctx.scale(pulse, pulse);
      ctx.font = '64px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.getDishEmoji(state.orders[0].name), 0, 20);
      ctx.restore();

      // Serve prompt
      const promptPulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.006);
      ctx.fillStyle = `rgba(0, 255, 136, ${promptPulse})`;
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('PRESS ENTER/SPACE TO SERVE!', plateX, plateY + plateRy + 40);
    } else if (state.assembly.length > 0) {
      // Partial assembly - show what's in wok
      ctx.font = '40px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.getDishEmoji(state.orders[0]?.name || 'Nasi Goreng'), plateX, plateY + 10);
      ctx.fillStyle = '#888';
      ctx.font = '14px sans-serif';
      ctx.fillText(`(${state.assembly.length}/${state.orders[0]?.ingredients.length || 0})`, plateX, plateY + 45);
    } else {
      // Empty plate
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🍽️', plateX, plateY + 15);
    }
  }

  getDishEmoji(name) {
    if (name.includes('Nasi')) return '🍛';
    if (name.includes('Mie')) return '🍜';
    if (name.includes('Sate')) return '🍢';
    return '🍽️';
  }

  renderCounter(state) {
    const { ctx } = this;
    // Counter panel
    const panelGrad = ctx.createLinearGradient(40, 515, 40, 775);
    panelGrad.addColorStop(0, '#1a1210');
    panelGrad.addColorStop(1, '#0d0806');
    ctx.fillStyle = panelGrad;
    ctx.fillRect(40, 515, 1200, 260);

    // Bamboo frame
    ctx.strokeStyle = '#8b6d4a';
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 515, 1200, 260);

    // Title
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🔪  COUNTER INGREDIENTS  (Click or Press Keys 1-9)', 60, 545);

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

      // Button background
      const btnGrad = ctx.createLinearGradient(bx, by, bx, by + btnH);
      btnGrad.addColorStop(0, '#4a3a2a');
      btnGrad.addColorStop(1, '#2a1e18');
      ctx.fillStyle = btnGrad;
      ctx.fillRect(bx, by, btnW, btnH);

      // Button border
      ctx.strokeStyle = '#d4a574';
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, by, btnW, btnH);

      // Key number badge
      ctx.fillStyle = '#ffcc00';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${idx + 1}`, bx + 18, by + 22);

      // Ingredient icon - large
      ctx.font = '40px sans-serif';
      ctx.fillText(ing.icon, bx + btnW / 2, by + 48);

      // Ingredient name
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(ing.name, bx + btnW / 2, by + 72);
    });
  }

  renderParticles(state) {
    const { ctx } = this;
    state.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.text, p.x, p.y);
    });
    ctx.globalAlpha = 1.0;
  }

  renderFloatingTexts(state) {
    const { ctx } = this;
    state.floatingTexts.forEach(t => {
      ctx.fillStyle = t.color || '#00ff88';
      ctx.globalAlpha = Math.max(0, t.life / 1000);
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(t.text, t.x, t.y);
    });
    ctx.globalAlpha = 1.0;
  }

  renderComboMilestone(state) {
    const { ctx } = this;
    const milestones = [5, 10, 15, 20];
    const lastMilestone = milestones.find(m => state.combo >= m && state.combo - 1 < m);
    if (!lastMilestone) return;

    const text = lastMilestone >= 10 ? '🔥 COMBO MASTER!' : '⚡ COMBO x5!';
    const color = lastMilestone >= 10 ? '#ff00ff' : '#ff6600';

    ctx.save();
    ctx.translate(640, 200);
    ctx.scale(1 + this.comboFlash * 0.5, 1 + this.comboFlash * 0.5);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 30 * this.comboFlash;
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  // Call this when combo reaches milestone
  triggerComboFlash(combo) {
    if (combo === 5 || combo === 10 || combo === 15 || combo === 20) {
      this.comboFlash = 1.0;
    }
  }

  // Call this when screen changes
  triggerEntranceFlash() {
    this.entranceFlash = 1.0;
  }
}