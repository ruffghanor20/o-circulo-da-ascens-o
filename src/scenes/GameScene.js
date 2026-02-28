const SAVE_KEY = 'bf_save_v1';

import Phaser from 'phaser';
import { StoryManager } from '../systems/storyManager.js';
import { collectorGreetingNode } from '../systems/storyData.js';

function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

const WEAPONS = {
  wp_rust:    { id:'wp_rust',    name:'Lâmina Enferrujada', baseAtk:14, tier:'B', upgBonus:2 },
  wp_moon:    { id:'wp_moon',    name:'Espada da Lua Fria', baseAtk:22, tier:'A', upgBonus:3 },
  wp_eclipse: { id:'wp_eclipse', name:'Fio do Eclipse',     baseAtk:50, tier:'S', upgBonus:4 },
};

const ARMORS = {
  ar_leather:  { id:'ar_leather',  name:'Cota de Couro',           def:8,  hp:110 },
  ar_steel:    { id:'ar_steel',    name:'Armadura de Aço Sombrio', def:14, hp:140 },
  ar_colossus: { id:'ar_colossus', name:'Casca do Colosso',        def:22, hp:200 },
};

// Boss/Act tiers (drops evolve by "ato")
const ACTS = [
  { id:'Corrompido', fromKill: 0,  toKill: 4 },
  { id:'Campeão Caído', fromKill: 5, toKill: 9 },
  { id:'Besta', fromKill: 10, toKill: 999999 },
];

const DROP_DEFS = {
  // Act 1: Corrompido
  cor_shard: { id:'cor_shard', name:'Estilhaço Corrompido', sellValue: 45,  desc:'Ódio solidificado. Serve como liga e lembrança.', act:'Corrompido', weight: 46 },
  cor_iron:  { id:'cor_iron',  name:'Ferro Antigo',         sellValue: 70,  desc:'Metal que já foi lâmina. Hoje é matéria-prima.', act:'Corrompido', weight: 30 },
  cor_ichor: { id:'cor_ichor', name:'Ícor Sombrio',         sellValue: 105, desc:'Essência do Círculo em estado bruto.',            act:'Corrompido', weight: 18 },
  cor_rune:  { id:'cor_rune',  name:'Runa Fraturada',       sellValue: 150, desc:'Símbolo quebrado. Ainda dita regras antigas.',    act:'Corrompido', weight: 6  },

  // Act 2: Campeão Caído
  champ_sigil: { id:'champ_sigil', name:'Selo do Campeão Caído', sellValue: 140, desc:'Marca de glória perdida. Ótimo catalisador.', act:'Campeão Caído', weight: 40 },
  champ_chain: { id:'champ_chain', name:'Corrente de Arena',      sellValue: 190, desc:'Ferros que não prendem corpo — prendem destino.', act:'Campeão Caído', weight: 28 },
  champ_heart: { id:'champ_heart', name:'Coração de Guerra',      sellValue: 260, desc:'Uma vontade que se recusou a morrer.', act:'Campeão Caído', weight: 20 },
  champ_rune:  { id:'champ_rune',  name:'Runa de Juramento',      sellValue: 360, desc:'Promessa antiga. Corta como lei.', act:'Campeão Caído', weight: 12 },

  // Act 3: Besta
  beast_fang: { id:'beast_fang', name:'Presa da Besta',         sellValue: 220, desc:'Dente que rasgou aço. A forja gosta disso.', act:'Besta', weight: 38 },
  beast_hide: { id:'beast_hide', name:'Couro Abissal',          sellValue: 310, desc:'Pele que lembra noite sem estrelas.', act:'Besta', weight: 28 },
  beast_core: { id:'beast_core', name:'Núcleo Selvagem',        sellValue: 520, desc:'Energia viva que não aceita jaula.', act:'Besta', weight: 20 },
  beast_rune: { id:'beast_rune', name:'Runa Predatória',        sellValue: 780, desc:'Símbolo que caça quem o lê.', act:'Besta', weight: 14 },
};

const DROP_TABLES = {
  'Corrompido': ['cor_shard','cor_iron','cor_ichor','cor_rune'],
  'Campeão Caído': ['champ_sigil','champ_chain','champ_heart','champ_rune'],
  'Besta': ['beast_fang','beast_hide','beast_core','beast_rune']
};

function weightedPickByIds(ids){
  const arr = ids.map(id => DROP_DEFS[id]).filter(Boolean);
  const total = arr.reduce((s,x)=>s+(x.weight||1),0);
  let r = Math.random()*total;
  for (const x of arr){
    r -= (x.weight||1);
    if (r<=0) return x;
  }
  return arr[arr.length-1];
}

export class GameScene extends Phaser.Scene {
  constructor(){
    super('Game');
    this.controls = { x:0, y:0, attack:false, dash:false };
  }

  create(){
    const { width, height } = this.scale;
    this.arenaRect = new Phaser.Geom.Rectangle(0, 0, width, height);

    // Background arena + vignette overlay (store refs for resize)
    this.bg = this.add.image(width/2, height/2, 'arena').setScrollFactor(0).setDepth(-60);
    this.vign = this.add.image(width/2, height/2, 'vignette').setScrollFactor(0).setDepth(999).setAlpha(0.25);

    // Ambient particles (from atlas)
    this.particles = this.add.particles(0, 0, 'entities', {
      frame: ['fx_dust_0','fx_dust_1','fx_dust_2','fx_dust_3'],
      x: { min: 0, max: width },
      y: { min: 0, max: height },
      lifespan: { min: 1600, max: 2600 },
      speedY: { min: -8, max: -26 },
      speedX: { min: -8, max: 8 },
      quantity: 1,
      frequency: 140,
      scale: { start: 0.7, end: 0.0 },
      alpha: { start: 0.22, end: 0.0 }
    }).setDepth(-59);

    // Torches / props (animated)
    this.props = [];
    const m = 78;
    const torches = [
      { x: m, y: m },
      { x: width - m, y: m },
      { x: m, y: height - m },
      { x: width - m, y: height - m },
    ];
    for (const t of torches){
      const s = this.add.sprite(t.x, t.y, 'entities', 'prop_torch_0').setDepth(-58);
      s.play('torch_flicker');
      // small glow-ish pulse
      this.tweens.add({ targets: s, alpha: { from: 0.9, to: 1.0 }, duration: 600 + Phaser.Math.Between(0,300), yoyo: true, repeat: -1 });
      this.props.push(s);
    }
    // a couple of decorative props
    this.props.push(this.add.image(width*0.22, height*0.28, 'entities', 'prop_column').setDepth(-58).setAlpha(0.95));
    this.props.push(this.add.image(width*0.78, height*0.72, 'entities', 'prop_chain').setDepth(-58).setAlpha(0.85));

    // Audio
    this.sndHit = this.sound.add('hit', { volume: 0.55 });
    this.sndVictory = this.sound.add('victory', { volume: 0.7 });
    this.amb = this.sound.add('amb', { loop: true, volume: 0.22 });
    if (!this.amb.isPlaying) this.amb.play();

    const save = this.loadSave();
    this.ngPlus = save.ngPlus ?? 0;
    this.story = new StoryManager();

    // Boss visual tier changes with each boss death (within the same save)
    this.bossDeaths = save.bossDeaths ?? 0;
    this.bossTier = (this.bossDeaths % 3);

    // Inventory defaults
    const inv = save.inventory ?? {};
    inv.weapon = inv.weapon ?? null;
    inv.armor = inv.armor ?? null;
    inv.accessory = inv.accessory ?? null;
    inv.soulAnchor = inv.soulAnchor ?? false;
    inv.nucleusFragments = inv.nucleusFragments ?? 0;
    inv.drops = inv.drops ?? {};
    inv.weaponUpgrades = inv.weaponUpgrades ?? {};
    inv.weaponSkills = inv.weaponSkills ?? {};

    // Equipment base values
    const weaponId = inv.weapon;
    const armorId  = inv.armor;

    const weaponUpgLv = weaponId ? (inv.weaponUpgrades[weaponId] ?? 0) : 0;
    const weaponAtkDefault = weaponId
      ? (WEAPONS[weaponId]?.baseAtk ?? 10) + weaponUpgLv*(WEAPONS[weaponId]?.upgBonus ?? 0)
      : 10;

    const armorDefDefault = armorId ? (ARMORS[armorId]?.def ?? 5) : 5;
    const armorHpDefault  = armorId ? (ARMORS[armorId]?.hp ?? 100) : 100;

    const weaponAtk = save.weaponAtk ?? weaponAtkDefault;
    const atkGrowth = save.atkGrowth ?? Math.max(0, (save.atk ?? 10) - weaponAtk);

    const armorDef  = save.armorDef ?? armorDefDefault;
    const defGrowth = save.defGrowth ?? Math.max(0, (save.def ?? 5) - armorDef);

    const armorHp  = save.armorHp ?? armorHpDefault;
    const hpGrowth = save.hpGrowth ?? Math.max(0, (save.maxHp ?? 100) - armorHp);

    // State
    this.state = {
      hp: save.hp ?? (armorHp + hpGrowth),
      maxHp: armorHp + hpGrowth,
      atk: (weaponAtk + atkGrowth),
      def: (armorDef + defGrowth),

      weaponAtk,
      atkGrowth,
      armorDef,
      defGrowth,
      armorHp,
      hpGrowth,

      lv: save.lv ?? 1,
      xp: save.xp ?? 0,
      nextXp: save.nextXp ?? 60,

      coins: save.coins ?? 0,
      kills: save.kills ?? 0,
      deaths: save.deaths ?? 0,
      purchases: save.purchases ?? 0,

      inventory: inv,
      ngPlus: this.ngPlus
    };

    this.recomputeDerived(true);

    // Player sprite (atlas)
    this.player = this.physics.add.sprite(width*0.28, height*0.55, 'entities', 'player_idle_0');
    this.player.setDamping(true);
    this.player.setDrag(0.0025);
    this.player.setMaxVelocity(320);
    this.player.body.setSize(26, 34, true);
    this.player.body.setOffset(19, 22);
    this.player.play('player_idle');

    // Boss sprite (atlas)
    this.boss = this.physics.add.sprite(width*0.72, height*0.45, 'entities', `boss_t${this.bossTier}_idle_0`);
    this.boss.setImmovable(true);
    this.boss.body.setSize(44, 50, true);
    this.boss.body.setOffset(10, 12);
    this.boss.play(this.bossAnim('idle'), true);

    // FX spark (atlas)
    this.hitSpark = this.add.sprite(-999, -999, 'entities', 'fx_hit').setAlpha(0).setDepth(10);

    // Boss state (always lv = player + 2)
    this.bossState = {
      lv: this.calcBossLevel(),
      hp: 1,
      maxHp: 1,
      enraged: false,
      act: this.getCurrentAct(),
      alive: true
    };
    this.refreshBoss(true);

    this.lastAttack = 0;
    this.dashCooldown = 0;

    // Touch damage
    this.physics.add.overlap(this.player, this.boss, () => {
      if (!this.bossState.alive) return;
      this.damagePlayer(this.getBossTouchDamage());
    });

    // Controls update
    this.game.events.on('controls:update', (c) => { this.controls = c; });

    // External events
    window.addEventListener('bf:buy', (ev) => this.applyPurchase(ev.detail));
    window.addEventListener('bf:inv:sell', (ev) => this.sellDrops(ev.detail));
    window.addEventListener('bf:weapon:upgrade', () => this.upgradeWeapon());
    window.addEventListener('bf:skill:upgrade', (ev) => this.upgradeSkill(ev.detail?.skill));

    // Shop opened greeting
    this.game.events.on('shop:open', () => {
      if (!this.story.has('collector_greet_done')){
        this.openDialogue(collectorGreetingNode(this.ngPlus));
      }
    });

    // Ending choice
    this.game.events.on('ending:choose', (payload) => {
      const ending = payload?.ending;
      if (!ending) return;

      if (ending === 'destroy'){
        this.game.events.emit('ach:unlock', { id:'ending_destroy' });
        this.openDialogue('end_destroy');
      }
      if (ending === 'dominate'){
        this.game.events.emit('ach:unlock', { id:'ending_dominate' });
        this.openDialogue('end_dominate');
      }
      if (ending === 'succumb'){
        this.game.events.emit('ach:unlock', { id:'ending_succumb' });
        this.openDialogue('end_succumb');
      }
    });

    // Save now (pause menu)
    this.game.events.on('save:now', () => this.save());

    // Resize
    this.scale.on('resize', (gs) => this.onResize(gs.width, gs.height));

    // Initial HUD
    this.syncRegistry();

    // Intro
    if (!this.story.has('intro_done')){
      this.openDialogue('intro', () => this.game.events.emit('ach:unlock', { id:'wake' }));
    } else {
      this.game.events.emit('ach:unlock', { id:'wake' });
    }

    if (this.ngPlus >= 3) this.game.events.emit('ach:unlock', { id:'ngplus_many' });

    this.save();
  }

  update(time, dt){
    dt = dt / 1000;

    // Player movement
    const speed = this.controls.dash && this.dashCooldown <= 0 ? 500 : 260;
    this.player.setVelocity(this.controls.x * speed, this.controls.y * speed);

    const moving = Math.abs(this.player.body.velocity.x) + Math.abs(this.player.body.velocity.y) > 5;
    if (moving) this.player.play('player_run', true);
    else if (this.player.anims.currentAnim?.key !== 'player_attack') this.player.play('player_idle', true);

    if (this.controls.dash && this.dashCooldown <= 0){
      this.dashCooldown = 1.25;
      this.game.events.emit('ach:unlock', { id:'dash' });
    }
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);

    // Clamp
    const pad = 20;
    this.player.x = clamp(this.player.x, pad, this.arenaRect.width - pad);
    this.player.y = clamp(this.player.y, pad, this.arenaRect.height - pad);

    // Boss AI
    if (this.bossState.alive) this.bossAI(time);

    // Attack
    if (this.controls.attack && time - this.lastAttack > 280){
      this.lastAttack = time;
      this.doAttack();
    }

    if (this.state.hp <= 0) this.onPlayerDeath();

    this.syncRegistry();
  }

  // ========= Visual helpers =========

  bossAnim(kind){
    return `boss_${kind}_t${this.bossTier}`;
  }

  // ========= Act / Tiers =========

  getCurrentAct(){
    const k = this.state.kills ?? 0;
    const act = ACTS.find(a => k >= a.fromKill && k <= a.toKill) || ACTS[0];
    return act.id;
  }

  // ========= Derived stats =========

  recomputeDerived(forceHeal=false){
    this.state.atk = Math.max(1, Math.floor(this.state.weaponAtk + this.state.atkGrowth));
    this.state.def = Math.max(0, Math.floor(this.state.armorDef + this.state.defGrowth));
    this.state.maxHp = Math.max(1, Math.floor(this.state.armorHp + this.state.hpGrowth));
    if (forceHeal) this.state.hp = this.state.maxHp;
    this.state.hp = clamp(this.state.hp, 0, this.state.maxHp);
  }

  calcBossLevel(){
    return Math.max(1, Math.floor(this.state.lv + 2));
  }

  refreshBoss(fullHeal=true){
    this.bossState.lv = this.calcBossLevel();
    this.bossState.act = this.getCurrentAct();
    this.bossState.maxHp = this.calcBossHp(this.bossState.lv);
    this.bossState.hp = fullHeal ? this.bossState.maxHp : clamp(this.bossState.hp, 1, this.bossState.maxHp);
    this.bossState.enraged = false;
    this.bossState.alive = true;
    this.boss.play(this.bossAnim('idle'), true);
  }

  calcBossHp(bossLv){
    const base = Math.floor(220 + bossLv * 26 + Math.pow(bossLv, 1.35) * 16);
    const ngMul = 1 + (this.ngPlus * 0.22);
    const p = this.state;
    const power = (p.atk * 0.9) + (p.maxHp * 0.04) + (p.def * 0.6);
    const powerMul = clamp(0.95 + (power / 800), 0.95, 1.45);
    return Math.floor(base * ngMul * powerMul);
  }

  getBossTouchDamage(){
    const ngMul = 1 + (this.ngPlus * 0.18);
    const lvlPart = Math.floor(this.bossState.lv * 0.85);
    const dmg = Math.floor((4 + lvlPart) * ngMul);
    return clamp(dmg, 3, 160);
  }

  // ========= Dialogue =========

  openDialogue(nodeId, onClose){
    this.scene.pause('Game');
    this.scene.launch('Dialogue', { nodeId, story: this.story, onClose });
  }

  // ========= Combat =========

  bossAI(time){
    const b = this.boss;
    const p = this.player;

    const ngMul = 1 + (this.ngPlus * 0.12);
    const lvMul = 1 + (this.bossState.lv * 0.006);

    if (!this.bossState.enraged && this.bossState.hp / this.bossState.maxHp < 0.35){
      this.bossState.enraged = true;
      this.game.events.emit('ach:unlock', { id:'enrageWitness' });
    }

    const toP = new Phaser.Math.Vector2(p.x - b.x, p.y - b.y);
    const dist = toP.length();

    const side = new Phaser.Math.Vector2(-toP.y, toP.x).normalize();
    const drift = side.scale((this.bossState.enraged ? 110 : 85) * ngMul * lvMul);
    const seek = toP.normalize().scale((dist > 220 ? 70 : 30) * ngMul * lvMul);

    b.setVelocity(drift.x + seek.x, drift.y + seek.y);

    if ((time % 1700) < 30 && dist < 520){
      const lunge = toP.normalize().scale((this.bossState.enraged ? 330 : 250) * ngMul * lvMul);
      b.setVelocity(lunge.x, lunge.y);
      if (!b.anims.isPlaying || b.anims.currentAnim?.key !== this.bossAnim('attack')){
        b.play(this.bossAnim('attack'));
      }
    } else {
      b.play(this.bossAnim('idle'), true);
    }

    const pad = 30;
    b.x = clamp(b.x, pad, this.arenaRect.width - pad);
    b.y = clamp(b.y, pad, this.arenaRect.height - pad);
  }

  getWeaponSkills(weaponId){
    const ws = this.state.inventory.weaponSkills || {};
    const s = ws[weaponId] || {};
    return {
      crit: Math.max(0, Math.floor(s.crit ?? 0)),
      lifesteal: Math.max(0, Math.floor(s.lifesteal ?? 0)),
      dashreset: Math.max(0, Math.floor(s.dashreset ?? 0)),
    };
  }

  getCritChance(sk){ return clamp(0.04 * sk.crit, 0, 0.25); }
  getLifestealPct(sk){ return clamp(0.03 * sk.lifesteal, 0, 0.12); }
  getDashResetChance(sk){ return clamp(0.12 * sk.dashreset, 0, 0.40); }

  doAttack(){
    const p = this.player;
    const b = this.boss;
    const dist = Phaser.Math.Distance.Between(p.x, p.y, b.x, b.y);

    // play attack
    if (p.anims.currentAnim?.key !== 'player_attack') p.play('player_attack');

    if (dist < 78 && this.bossState.alive){
      const wid = this.state.inventory.weapon;
      const skills = wid ? this.getWeaponSkills(wid) : { crit:0, lifesteal:0, dashreset:0 };

      let dmg = Math.max(2, this.state.atk - 2);
      const isCrit = Math.random() < this.getCritChance(skills);
      if (isCrit) dmg = Math.floor(dmg * 2);

      this.damageBoss(dmg);

      this.sndHit.play();

      // lifesteal
      const ls = this.getLifestealPct(skills);
      if (ls > 0){
        const heal = Math.max(0, Math.floor(dmg * ls));
        if (heal > 0) this.state.hp = Math.min(this.state.maxHp, this.state.hp + heal);
      }

      // dash reset
      const dr = this.getDashResetChance(skills);
      if (dr > 0 && Math.random() < dr) this.dashCooldown = 0;

      // fx spark
      this.hitSpark.setPosition(b.x, b.y).setAlpha(1).setScale(1);
      this.tweens.add({ targets: this.hitSpark, alpha: 0, scale: 1.9, duration: 160, ease:'Quad.easeOut' });

      this.game.events.emit('ach:unlock', { id:'firstHit' });
    } else {
      this.game.events.emit('ach:unlock', { id:'swingAir' });
    }
  }

  damageBoss(amount){
    this.bossState.hp = Math.max(0, this.bossState.hp - amount);
    if (this.bossState.hp <= 0 && this.bossState.alive){
      this.onBossDefeated();
    }
  }

  damagePlayer(amount){
    if (!this._lastHurt) this._lastHurt = 0;
    const now = this.time.now;
    if (now - this._lastHurt < 350) return;
    this._lastHurt = now;

    const reduced = Math.max(1, amount - Math.floor(this.state.def / 4));
    this.state.hp = Math.max(0, this.state.hp - reduced);
    if (!this.sndHit.isPlaying) this.sndHit.play();
    if (this.state.hp <= 25) this.game.events.emit('ach:unlock', { id:'nearDeath' });
  }

  // ========= Rewards / Drops =========

  onBossDefeated(){
    this.bossState.alive = false;

    this.sndVictory.play();

    // play death and disable collisions temporarily
    this.boss.body.enable = false;
    this.boss.setVelocity(0,0);
    this.boss.play(this.bossAnim('death'));

    const bossLv = this.bossState.lv;

    const ngPenalty = 1 / (1 + this.ngPlus * 0.10);
    const coinsGained = Math.floor((90 + bossLv * 10) * ngPenalty);
    const xpGained = Math.floor((60 + bossLv * 12) * (1 / (1 + this.ngPlus * 0.08)));

    this.state.coins += coinsGained;
    this.state.xp += xpGained;
    this.state.kills += 1;

    const act = this.getCurrentAct();
    const fragBonus = act === 'Besta' ? 2 : (act === 'Campeão Caído' ? 1 : 0);
    this.state.inventory.nucleusFragments += (1 + fragBonus);

    // drops
    const table = DROP_TABLES[act] || DROP_TABLES['Corrompido'];
    this.addDrop(weightedPickByIds(table).id, 1);
    const extraChance = act === 'Besta' ? 0.50 : (act === 'Campeão Caído' ? 0.38 : 0.28);
    if (Math.random() < extraChance) this.addDrop(weightedPickByIds(table).id, 1);

    this.game.events.emit('ach:unlock', { id:'firstBoss' });

    // story beats
    if (this.state.kills === 1 && !this.story.has('got_first_fragment')) this.openDialogue('first_fragment');
    if (this.state.kills >= 6 && !this.story.has('truth_known')) this.openDialogue('truth_reveal');
    if (this.state.kills >= 10 && !this.story.has('ending_unlocked')){
      this.openDialogue('ending_choice', () => window.dispatchEvent(new CustomEvent('bf:fate:available')));
    }

    if (this.state.kills >= 10) this.game.events.emit('ach:unlock', { id:'slayer10' });
    if (this.state.kills >= 25) this.game.events.emit('ach:unlock', { id:'slayer25' });

    if (this.state.coins >= 5000) this.game.events.emit('ach:unlock', { id:'coins5k' });
    if (this.state.coins >= 10000) this.game.events.emit('ach:unlock', { id:'coins10k' });

    this.checkLevelUps();

    const heal = Math.floor(22 / (1 + this.ngPlus * 0.15));
    this.state.hp = Math.min(this.state.maxHp, this.state.hp + Math.max(10, heal));

    // evolve boss tier
    this.bossDeaths += 1;
    this.bossTier = (this.bossDeaths % 3);

    this.time.delayedCall(760, () => {
      this.boss.body.enable = true;
      const w = this.scale.width, h = this.scale.height;
      this.boss.setPosition(w*0.70 + Phaser.Math.Between(-40,40), h*0.45 + Phaser.Math.Between(-30,30));
      this.refreshBoss(true);
    });

    this.save();
  }

  addDrop(dropId, qty){
    const d = DROP_DEFS[dropId];
    if (!d) return;
    const drops = this.state.inventory.drops;
    drops[dropId] = (drops[dropId] ?? 0) + qty;
  }

  checkLevelUps(){
    let leveled = false;
    while (this.state.xp >= this.state.nextXp){
      this.state.xp -= this.state.nextXp;
      this.state.lv += 1;
      leveled = true;

      this.state.hpGrowth += 6;
      this.state.atkGrowth += 1;
      this.state.defGrowth += 1;

      const ngMul = 1 + (this.ngPlus * 0.10);
      this.state.nextXp = Math.floor((60 + this.state.lv * 18) * ngMul);

      this.recomputeDerived(true);
    }
    if (leveled){
      if (this.state.lv >= 10) this.game.events.emit('ach:unlock', { id:'lv10' });
      if (this.state.lv >= 25) this.game.events.emit('ach:unlock', { id:'lv25' });
      if (this.state.lv >= 50) this.game.events.emit('ach:unlock', { id:'lv50' });
      if (this.state.lv >= 100) this.game.events.emit('ach:unlock', { id:'lv100' });
    }
  }

  // ========= Inventory actions =========

  sellDrops(detail){
    const inv = this.state.inventory;
    const drops = inv.drops;
    const dropId = detail?.dropId;
    let qty = Math.max(1, Math.floor(detail?.qty ?? 1));
    if (!dropId) return;

    if (dropId === '__ALL__'){
      for (const [id, count] of Object.entries(drops)){
        const def = DROP_DEFS[id];
        if (!def) continue;
        this.state.coins += (count * def.sellValue);
        delete drops[id];
      }
      this.save();
      this.syncRegistry();
      return;
    }

    const have = drops[dropId] ?? 0;
    if (have <= 0) return;

    qty = Math.min(qty, have);
    const def = DROP_DEFS[dropId];
    if (!def) return;

    drops[dropId] = have - qty;
    if (drops[dropId] <= 0) delete drops[dropId];

    this.state.coins += qty * def.sellValue;
    this.save();
    this.syncRegistry();
  }

  // ========= Forge (base upgrades) =========

  getWeaponUpgradeLevel(weaponId){
    const wup = this.state.inventory.weaponUpgrades || {};
    return Math.max(0, Math.floor(wup[weaponId] ?? 0));
  }

  getWeaponUpgradeReq(weaponId, currentLevel){
    const w = WEAPONS[weaponId];
    if (!w) return null;

    const next = currentLevel + 1;
    let fragments = 1 + Math.floor(currentLevel / 2);
    let coins = 220 + (next * 160);

    let mats = {};
    if (weaponId === 'wp_rust'){
      mats = { cor_shard: 2 + currentLevel, cor_iron: 1 + Math.floor(currentLevel/2) };
    } else if (weaponId === 'wp_moon'){
      fragments += 1;
      coins += 260;
      mats = { cor_iron: 2 + currentLevel, cor_ichor: 1 + Math.floor(currentLevel/2), champ_sigil: Math.floor(currentLevel/2) };
    } else if (weaponId === 'wp_eclipse'){
      fragments += 2;
      coins += 520;
      mats = { champ_heart: 1 + Math.floor(currentLevel/2), beast_core: Math.max(0, Math.floor(currentLevel/3)) };
    }

    mats = Object.fromEntries(Object.entries(mats).filter(([_,v]) => v > 0));

    const inv = this.state.inventory;
    const haveFrags = (inv.nucleusFragments ?? 0) >= fragments;
    const haveCoins = this.state.coins >= coins;
    const haveMats = Object.entries(mats).every(([id, q]) => (inv.drops?.[id] ?? 0) >= q);

    return { coins, fragments, mats, can: haveFrags && haveCoins && haveMats };
  }

  upgradeWeapon(){
    const inv = this.state.inventory;
    const wid = inv.weapon;
    if (!wid) return;

    const cur = this.getWeaponUpgradeLevel(wid);
    const req = this.getWeaponUpgradeReq(wid, cur);
    if (!req || !req.can) return;

    this.state.coins -= req.coins;
    inv.nucleusFragments -= req.fragments;

    for (const [id, q] of Object.entries(req.mats)){
      const have = inv.drops?.[id] ?? 0;
      inv.drops[id] = have - q;
      if (inv.drops[id] <= 0) delete inv.drops[id];
    }

    inv.weaponUpgrades[wid] = cur + 1;
    this.state.weaponAtk += (WEAPONS[wid]?.upgBonus ?? 0);
    this.recomputeDerived(false);

    this.save();
    this.syncRegistry();
  }

  // ========= Skill tree (per weapon) =========

  getSkillLevel(weaponId, skill){
    const ws = this.state.inventory.weaponSkills || {};
    const s = ws[weaponId] || {};
    return Math.max(0, Math.floor(s[skill] ?? 0));
  }

  setSkillLevel(weaponId, skill, level){
    const ws = this.state.inventory.weaponSkills || {};
    ws[weaponId] = ws[weaponId] || { crit:0, lifesteal:0, dashreset:0 };
    ws[weaponId][skill] = level;
    this.state.inventory.weaponSkills = ws;
  }

  getSkillReq(weaponId, skill, curLevel){
    const next = curLevel + 1;
    const maxLv = skill === 'dashreset' ? 2 : 3;
    if (next > maxLv) return null;

    let fragments = 1 + Math.floor(curLevel / 2);
    let coins = 260 + next * 220;
    let mats = {};

    if (skill === 'crit'){
      mats = { cor_rune: 1 + curLevel, cor_shard: 2 + curLevel };
    } else if (skill === 'lifesteal'){
      fragments += 1;
      coins += 220;
      mats = { champ_heart: 1 + Math.floor(curLevel/1), champ_sigil: 1 + curLevel };
    } else if (skill === 'dashreset'){
      fragments += 2;
      coins += 520;
      mats = { beast_rune: 1, beast_core: Math.max(0, curLevel) };
    }

    const wt = WEAPONS[weaponId]?.tier || 'B';
    const tierMul = wt === 'S' ? 1.35 : (wt === 'A' ? 1.15 : 1.0);
    fragments = Math.ceil(fragments * tierMul);
    coins = Math.ceil(coins * tierMul);

    mats = Object.fromEntries(Object.entries(mats).filter(([_,v]) => v > 0));

    const inv = this.state.inventory;
    const haveFrags = (inv.nucleusFragments ?? 0) >= fragments;
    const haveCoins = this.state.coins >= coins;
    const haveMats = Object.entries(mats).every(([id, q]) => (inv.drops?.[id] ?? 0) >= q);

    return { coins, fragments, mats, can: haveFrags && haveCoins && haveMats };
  }

  upgradeSkill(skill){
    const inv = this.state.inventory;
    const wid = inv.weapon;
    if (!wid || !skill) return;

    const cur = this.getSkillLevel(wid, skill);
    const req = this.getSkillReq(wid, skill, cur);
    if (!req || !req.can) return;

    this.state.coins -= req.coins;
    inv.nucleusFragments -= req.fragments;

    for (const [id, q] of Object.entries(req.mats)){
      const have = inv.drops?.[id] ?? 0;
      inv.drops[id] = have - q;
      if (inv.drops[id] <= 0) delete inv.drops[id];
    }

    this.setSkillLevel(wid, skill, cur + 1);
    this.save();
    this.syncRegistry();
  }

  buildNextSkillReq(weaponId){
    if (!weaponId) return null;
    const critLv = this.getSkillLevel(weaponId, 'crit');
    const lifeLv = this.getSkillLevel(weaponId, 'lifesteal');
    const dashLv = this.getSkillLevel(weaponId, 'dashreset');
    return {
      crit: this.getSkillReq(weaponId, 'crit', critLv),
      lifesteal: this.getSkillReq(weaponId, 'lifesteal', lifeLv),
      dashreset: this.getSkillReq(weaponId, 'dashreset', dashLv),
    };
  }

  // ========= Purchases =========

  applyPurchase(item){
    if (!item || this.state.coins < item.price) return;

    this.state.coins -= item.price;
    this.state.purchases += 1;
    this.game.events.emit('ach:unlock', { id:'firstBuy' });

    const inv = this.state.inventory;

    if (item.type === 'weapon'){
      inv.weapon = item.id;
      const w = WEAPONS[item.id];
      inv.weaponUpgrades[item.id] = inv.weaponUpgrades[item.id] ?? 0;
      inv.weaponSkills[item.id] = inv.weaponSkills[item.id] ?? { crit:0, lifesteal:0, dashreset:0 };

      const lvl = this.getWeaponUpgradeLevel(item.id);
      this.state.weaponAtk = (w?.baseAtk ?? item.atk) + lvl*(w?.upgBonus ?? 0);

      this.recomputeDerived(false);
      this.game.events.emit('ach:unlock', { id:'firstWeapon' });
    }

    if (item.type === 'armor'){
      inv.armor = item.id;
      const a = ARMORS[item.id];
      this.state.armorDef = a?.def ?? item.def;
      this.state.armorHp = a?.hp ?? item.hp;

      const beforeMax = this.state.maxHp;
      this.recomputeDerived(false);
      if (this.state.maxHp > beforeMax) this.state.hp = Math.min(this.state.maxHp, this.state.hp + 10);

      this.game.events.emit('ach:unlock', { id:'firstArmor' });
    }

    if (item.type === 'accessory'){
      inv.accessory = item.id;
      this.game.events.emit('ach:unlock', { id:'firstAcc' });
    }

    if (item.type === 'potion'){
      if (item.stat === 'atk') this.state.atkGrowth += item.amount;
      if (item.stat === 'def') this.state.defGrowth += item.amount;
      if (item.stat === 'hp'){
        this.state.hpGrowth += item.amount;
        this.recomputeDerived(true);
      } else {
        this.recomputeDerived(false);
      }
      this.game.events.emit('ach:unlock', { id:'firstPotion' });
    }

    if (item.type === 'torch'){
      this.game.events.emit('ach:unlock', { id:'torch' });
    }

    if (item.type === 'soulAnchor'){
      inv.soulAnchor = true;
      this.game.events.emit('ach:unlock', { id:'anchorBought' });
      if (!this.story.has('anchor_warning_done')) this.openDialogue('anchor_warning');
    }

    if (this.state.atk >= 20) this.game.events.emit('ach:unlock', { id:'str20' });
    if (this.state.atk >= 50) this.game.events.emit('ach:unlock', { id:'str50' });

    if (this.state.maxHp >= 120) this.game.events.emit('ach:unlock', { id:'vit20' });
    if (this.state.maxHp >= 200) this.game.events.emit('ach:unlock', { id:'vit50' });

    if (this.state.purchases >= 5) this.game.events.emit('ach:unlock', { id:'collector' });

    this.checkLevelUps();
    this.save();
    this.syncRegistry();
  }

  // ========= Death =========

  onPlayerDeath(){
    this.state.deaths += 1;
    this.game.events.emit('ach:unlock', { id:'firstDeath' });

    const keep = this.state.inventory?.soulAnchor === true;

    if (!keep){
      this.state.coins = Math.floor(this.state.coins * 0.72);
      this.state.xp = Math.floor(this.state.xp * 0.60);
      this.recomputeDerived(true);
      this.game.events.emit('ach:unlock', { id:'noAnchor' });
    } else {
      this.recomputeDerived(true);
      this.game.events.emit('ach:unlock', { id:'anchorSaved' });
    }
    this.save();
  }

  // ========= HUD / Resize / Save =========

  syncRegistry(){
    const inv = this.state.inventory;

    const dropsRich = {};
    for (const [id, count] of Object.entries(inv.drops || {})){
      const def = DROP_DEFS[id];
      if (!def || count <= 0) continue;
      dropsRich[id] = { ...def, count };
    }

    const weaponId = inv.weapon;
    const armorId  = inv.armor;

    const weaponName = weaponId ? (WEAPONS[weaponId]?.name ?? weaponId) : '—';
    const armorName  = armorId ? (ARMORS[armorId]?.name ?? armorId) : '—';

    const weaponUpgradeLevel = weaponId ? this.getWeaponUpgradeLevel(weaponId) : 0;
    const nextUpgradeReq = weaponId ? this.getWeaponUpgradeReq(weaponId, weaponUpgradeLevel) : null;
    const nextSkillReq = weaponId ? this.buildNextSkillReq(weaponId) : null;

    this.registry.set('playerState', {
      hp: this.state.hp,
      maxHp: this.state.maxHp,
      atk: this.state.atk,
      def: this.state.def,
      lv: this.state.lv,
      coins: this.state.coins,
      xp: this.state.xp,
      nextXp: this.state.nextXp,
      kills: this.state.kills,
      deaths: this.state.deaths,
      ngPlus: this.ngPlus,

      bossLv: this.bossState.lv,
      bossHp: this.bossState.hp,
      bossMaxHp: this.bossState.maxHp,

      inventory: {
        weapon: weaponId,
        armor: armorId,
        accessory: inv.accessory,
        soulAnchor: inv.soulAnchor,

        nucleusFragments: inv.nucleusFragments,
        drops: dropsRich,
        weaponUpgrades: inv.weaponUpgrades,
        weaponSkills: inv.weaponSkills,

        weaponName,
        armorName,
        accessoryName: inv.accessory || '—',
        weaponUpgradeLevel,
        nextUpgradeReq,
        nextSkillReq
      }
    });
  }

  onResize(w, h){
    this.arenaRect.setSize(w, h);
    // center BG and vignette
    if (this.bg) this.bg.setPosition(w/2, h/2);
    if (this.vign) this.vign.setPosition(w/2, h/2);

    // update particle bounds a bit
    if (this.particles){
      // not strictly necessary; emitter uses absolute coords
    }

    // reposition props relative to screen corners
    const m = 78;
    const torchPos = [
      { x: m, y: m },
      { x: w - m, y: m },
      { x: m, y: h - m },
      { x: w - m, y: h - m },
    ];
    // first 4 are torches
    for (let i=0;i<4 && i<this.props.length;i++){
      this.props[i].setPosition(torchPos[i].x, torchPos[i].y);
    }

    this.player.x = clamp(this.player.x, 30, w - 30);
    this.player.y = clamp(this.player.y, 30, h - 30);
    this.boss.x = clamp(this.boss.x, 40, w - 40);
    this.boss.y = clamp(this.boss.y, 40, h - 40);
  }

  loadSave(){
    try{
      const raw = localStorage.getItem(SAVE_KEY);
      return raw ? (JSON.parse(raw) || {}) : {};
    } catch { return {}; }
  }

  save(){
    try{
      const data = {
        hp: this.state.hp,
        maxHp: this.state.maxHp,

        weaponAtk: this.state.weaponAtk,
        atkGrowth: this.state.atkGrowth,
        armorDef: this.state.armorDef,
        defGrowth: this.state.defGrowth,
        armorHp: this.state.armorHp,
        hpGrowth: this.state.hpGrowth,

        atk: this.state.atk,
        def: this.state.def,

        lv: this.state.lv,
        xp: this.state.xp,
        nextXp: this.state.nextXp,

        coins: this.state.coins,
        kills: this.state.kills,
        deaths: this.state.deaths,
        purchases: this.state.purchases,

        inventory: this.state.inventory,
        ngPlus: this.ngPlus,

        bossDeaths: this.bossDeaths
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch {}
  }
}
