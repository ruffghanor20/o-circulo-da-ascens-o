import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { GameScene } from './scenes/GameScene.js';
import { UIScene } from './scenes/UIScene.js';
import { DialogueScene } from './scenes/DialogueScene.js';
import { Achievements } from './systems/achievements.js';
import { UIOverlay } from './systems/uiOverlay.js';
import { StoryManager } from './systems/storyManager.js';

const parent = document.getElementById('app');

const config = {
  type: Phaser.AUTO,
  parent,
  backgroundColor: '#070a12',
  physics: {
    default: 'arcade',
    arcade: { debug: false, gravity: { y: 0 } }
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: parent.clientWidth,
    height: parent.clientHeight
  },
  scene: [BootScene, GameScene, UIScene, DialogueScene]
};

const game = new Phaser.Game(config);

const achievements = new Achievements();
const overlay = new UIOverlay({ achievements });

let paused = false;

// Achievements bridge
game.events.on('ach:unlock', (payload) => {
  achievements.unlock(payload.id);
});

achievements.onUnlock((a) => {
  overlay.toast(a.name, a.desc);
  overlay.renderAchievements(achievements.getAll());
});

overlay.renderAchievements(achievements.getAll());
overlay.renderShop();

// HUD update
function tick(){
  const s = game.registry.get('playerState');
  if (s) overlay.setState(s);
  requestAnimationFrame(tick);
}
tick();

// Pause/resume hooks (from overlay)
// Pause freezes ONLY the Game scene (boss stops), HTML UI keeps working.
window.addEventListener('bf:pause:open', () => {
  if (paused) return;
  paused = true;
  try { game.scene.pause('Game'); } catch {}
});

window.addEventListener('bf:pause:resume', () => {
  if (!paused) return;
  paused = false;
  try { game.scene.resume('Game'); } catch {}
});

// Save now
window.addEventListener('bf:save:now', () => {
  game.events.emit('save:now');
});

// Save & "exit"
window.addEventListener('bf:save:exit', () => {
  game.events.emit('save:now');
  if (!paused){
    paused = true;
    try { game.scene.pause('Game'); } catch {}
  }
  setTimeout(() => {
    try { window.close(); } catch {}
  }, 80);
});

// Reset (full wipe)
document.getElementById('btnReset').addEventListener('click', () => {
  if (!confirm('Resetar progresso local (save, história, inventário e conquistas)?')) return;
  achievements.reset();
  localStorage.removeItem('bf_save_v1');
  StoryManager.hardResetStorage();
  overlay.renderAchievements(achievements.getAll());
  location.reload();
});

// Shop open -> let game greet
window.addEventListener('bf:shop:open', () => game.events.emit('shop:open'));

// Ending choice -> forward to game and then compute NG+ quote
window.addEventListener('bf:ending:choose', (ev) => {
  game.events.emit('ending:choose', ev.detail);
  setTimeout(sendNgpQuote, 60);
});
window.addEventListener('bf:ngp:request', () => sendNgpQuote());

// NG+ start: KEEP attributes + inventory + nucleus (roguelite style).
// Still: reseta conquistas (para "pagar" elas em moedas) e reinicia narrativa/loop do Círculo.
window.addEventListener('bf:ngplus:start', () => {
  const save = safeReadSave() || {};
  const oldNg = save.ngPlus ?? 0;

  // pay achievements into coins, then reset achievements
  const payout = achievements.cashoutAndReset();

  // keep current player power + inventory + nucleus
  const kept = {
    hp: save.hp ?? 100,
    maxHp: save.maxHp ?? 100,

    weaponAtk: save.weaponAtk ?? 10,
    atkGrowth: save.atkGrowth ?? 0,
    armorDef: save.armorDef ?? 5,
    defGrowth: save.defGrowth ?? 0,
    armorHp: save.armorHp ?? 100,
    hpGrowth: save.hpGrowth ?? 0,

    atk: save.atk ?? 10,
    def: save.def ?? 5,

    lv: save.lv ?? 1,
    xp: save.xp ?? 0,
    nextXp: save.nextXp ?? 60,

    coins: (save.coins ?? 0) + payout,

    // reset run counters, keep items
    kills: 0,
    deaths: 0,
    purchases: save.purchases ?? 0,

    inventory: save.inventory ?? {
      weapon: null,
      armor: null,
      accessory: null,
      soulAnchor: false,
      nucleusFragments: 0,
      drops: {},
      weaponUpgrades: {},
      weaponSkills: {}
    },

    ngPlus: oldNg + 1
  };

  // Reset story to replay and get new Collector greeting.
  StoryManager.hardResetStorage();
  localStorage.setItem('bf_save_v1', JSON.stringify(kept));

  location.reload();
});

function sendNgpQuote(){
  const preview = achievements.getCashoutPreview();
  const save = safeReadSave();
  const ngPlus = save?.ngPlus ?? 0;
  window.dispatchEvent(new CustomEvent('bf:ngp:quote', { detail: { ...preview, ngPlusNext: ngPlus + 1 } }));
}

function safeReadSave(){
  try{
    const raw = localStorage.getItem('bf_save_v1');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
