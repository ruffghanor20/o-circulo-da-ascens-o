import Phaser from 'phaser';

function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

export class UIScene extends Phaser.Scene {
  constructor(){
    super('UI');
    this.controls = { x:0, y:0, attack:false, dash:false };
  }

  create(){
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');

    this.joy = this.makeJoystick();
    this.btnAttack = this.makeButton('ATAQUE', '⚔️');
    this.btnDash = this.makeButton('ESQUIVA', '💨');

    this.bindJoystick();
    this.bindButtons();

    this.layout(this.scale.width, this.scale.height);
    this.scale.on('resize', (gameSize) => this.layout(gameSize.width, gameSize.height));

    this.events.on('update', () => {
      this.game.events.emit('controls:update', { ...this.controls });
      this.controls.attack = this.btnAttack.isDown;
      this.controls.dash = this.btnDash.isDown;
    });
  }

  makeJoystick(){
    const container = this.add.container(0,0);
    const base = this.add.graphics();
    const knob = this.add.graphics();
    container.add([base, knob]);

    return {
      container, base, knob,
      pointerId: null,
      origin: new Phaser.Math.Vector2(0,0),
      value: new Phaser.Math.Vector2(0,0),
      radius: 50,
      dead: 0.12,
      draw: (x,y,r) => {
        base.clear();
        base.fillStyle(0x0c1222, 0.62);
        base.lineStyle(2, 0x1c2a4d, 0.95);
        base.fillCircle(x, y, r);
        base.strokeCircle(x, y, r);

        base.lineStyle(2, 0x74e6ff, 0.18);
        base.strokeCircle(x, y, r*0.62);

        knob.clear();
        knob.fillStyle(0x111a33, 0.75);
        knob.lineStyle(2, 0xf2d36a, 0.55);
        knob.fillCircle(x, y, r*0.46);
        knob.strokeCircle(x, y, r*0.46);
      },
      setKnob: (x,y,r,dx,dy) => {
        knob.clear();
        knob.fillStyle(0x111a33, 0.78);
        knob.lineStyle(2, 0xf2d36a, 0.62);
        knob.fillCircle(x+dx, y+dy, r*0.46);
        knob.strokeCircle(x+dx, y+dy, r*0.46);
      }
    };
  }

  makeButton(label, icon){
    const container = this.add.container(0,0);
    const g = this.add.graphics();
    const t = this.add.text(0,0, `${icon}\n${label}`, {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
      fontSize: '12px',
      align: 'center',
      color: '#eaf1ff'
    }).setOrigin(0.5);

    container.add([g,t]);

    return {
      container, g, t,
      radius: 46,
      isDown: false,
      draw: (x,y,r,down=false) => {
        g.clear();
        g.fillStyle(down ? 0x0f1a33 : 0x0c1222, down ? 0.9 : 0.7);
        g.lineStyle(2, down ? 0x74e6ff : 0x1c2a4d, 0.95);
        g.fillRoundedRect(x-r, y-r, r*2, r*2, 16);
        g.strokeRoundedRect(x-r, y-r, r*2, r*2, 16);

        g.lineStyle(2, 0xf2d36a, down ? 0.45 : 0.2);
        g.strokeRoundedRect(x-r+2, y-r+2, r*2-4, r*2-4, 14);

        t.setPosition(x,y);
        t.setFontSize(Math.max(10, Math.round(r*0.22)));
      }
    };
  }

  bindJoystick(){
    const input = this.input;

    input.on('pointerdown', (p) => {
      if (this.joy.pointerId !== null) return;
      if (p.x < this.scale.width * 0.55){
        this.joy.pointerId = p.id;
        this.joy.origin.set(p.x, p.y);
      }
    });

    input.on('pointerup', (p) => {
      if (this.joy.pointerId === p.id){
        this.joy.pointerId = null;
        this.controls.x = 0; this.controls.y = 0;
      }
      this.btnAttack.isDown = false;
      this.btnDash.isDown = false;
    });

    input.on('pointermove', (p) => {
      if (this.joy.pointerId !== p.id) return;

      const dx = p.x - this.joy.origin.x;
      const dy = p.y - this.joy.origin.y;
      const r = this.joy.radius;

      const v = new Phaser.Math.Vector2(dx, dy);
      const len = v.length();
      if (len > r) v.scale(r / len);

      const out = new Phaser.Math.Vector2(dx, dy);
      const outLen = out.length();
      if (outLen > 0) out.normalize();

      if (outLen / r < this.joy.dead){
        this.controls.x = 0; this.controls.y = 0;
      } else {
        this.controls.x = out.x;
        this.controls.y = out.y;
      }

      this.joy.setKnob(this.joyPos.x, this.joyPos.y, r, v.x, v.y);
    });
  }

  bindButtons(){
    const setDown = (btn, down) => {
      btn.isDown = down;
      btn.draw(btn.pos.x, btn.pos.y, btn.radius, down);
      if (btn === this.btnAttack && down) this.game.events.emit('ach:unlock', { id: 'pressAttack' });
      if (btn === this.btnDash && down) this.game.events.emit('ach:unlock', { id: 'pressDash' });
    };

    this.input.on('pointerdown', (p) => {
      if (this.hitTestButton(p, this.btnAttack)) setDown(this.btnAttack, true);
      if (this.hitTestButton(p, this.btnDash)) setDown(this.btnDash, true);
    });

    this.input.on('pointerup', () => {
      setDown(this.btnAttack, false);
      setDown(this.btnDash, false);
    });

    this.input.on('pointermove', (p) => {
      if (this.btnAttack.isDown && !this.hitTestButton(p, this.btnAttack)) setDown(this.btnAttack, false);
      if (this.btnDash.isDown && !this.hitTestButton(p, this.btnDash)) setDown(this.btnDash, false);
    });
  }

  hitTestButton(p, btn){
    const x = btn.pos.x, y = btn.pos.y, r = btn.radius;
    return (p.x >= x-r && p.x <= x+r && p.y >= y-r && p.y <= y+r);
  }

  layout(w,h){
    const s = Math.min(w,h);

    const joyR = clamp(Math.round(s * 0.13), 44, 88);
    const btnR = clamp(Math.round(s * 0.11), 40, 78);
    const pad = clamp(Math.round(s * 0.06), 18, 34);

    const isLandscape = w > h;

    const joyX = pad + joyR + (isLandscape ? 4 : 0);
    const joyY = h - pad - joyR;

    const btnX = w - pad - btnR;
    const btnY1 = h - pad - btnR;
    const btnY2 = btnY1 - (btnR*2 + clamp(Math.round(btnR*0.35), 12, 26));

    this.joy.radius = joyR;
    this.joyPos = { x: joyX, y: joyY };

    this.btnAttack.radius = btnR;
    this.btnDash.radius = btnR;
    this.btnAttack.pos = { x: btnX, y: btnY2 };
    this.btnDash.pos = { x: btnX, y: btnY1 };

    this.joy.draw(joyX, joyY, joyR);
    this.joy.setKnob(joyX, joyY, joyR, 0, 0);

    this.btnAttack.draw(btnX, btnY2, btnR, this.btnAttack.isDown);
    this.btnDash.draw(btnX, btnY1, btnR, this.btnDash.isDown);

    if (!this._lastOri) this._lastOri = isLandscape ? 'L' : 'P';
    const nowOri = isLandscape ? 'L' : 'P';
    if (nowOri !== this._lastOri){
      this._lastOri = nowOri;
      this.game.events.emit('ach:unlock', { id: 'rotate' });
    }
  }
}
