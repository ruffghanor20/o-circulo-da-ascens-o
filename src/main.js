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

let resizeRaf = 0;
function syncViewportSize(){
  if (resizeRaf) cancelAnimationFrame(resizeRaf);
  resizeRaf = requestAnimationFrame(() => {
    const width = parent.clientWidth;
    const height = parent.clientHeight;
    if (width > 0 && height > 0){
      game.scale.resize(width, height);
    }
  });
}

window.addEventListener('resize', syncViewportSize, { passive: true });
window.addEventListener('orientationchange', () => setTimeout(syncViewportSize, 80), { passive: true });
if (window.visualViewport){
  window.visualViewport.addEventListener('resize', syncViewportSize, { passive: true });
}

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
