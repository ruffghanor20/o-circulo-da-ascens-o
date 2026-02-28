import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor(){ super('Boot'); }

  preload(){
    // Arena visuals
    this.load.image('arena', 'assets/sprites/arena_circulo_ascensao_1280x720.png');
    this.load.image('vignette', 'assets/sprites/arena_vignette_1280x720.png');

    // Premium: single atlas for entities + props + FX
    this.load.atlas('entities', 'assets/atlas/entities.png', 'assets/atlas/entities.json');

    // Audio
    this.load.audio('hit', 'assets/audio/sfx_hit.wav');
    this.load.audio('amb', 'assets/audio/ambience_arena_loop.wav');
    this.load.audio('victory', 'assets/audio/sfx_victory.wav');
  }

  create(){
    // Player animations
    this.anims.create({
      key: 'player_idle',
      frames: this.anims.generateFrameNames('entities', { prefix: 'player_idle_', start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: 'player_run',
      frames: this.anims.generateFrameNames('entities', { prefix: 'player_run_', start: 0, end: 3 }),
      frameRate: 14,
      repeat: -1
    });
    this.anims.create({
      key: 'player_attack',
      frames: this.anims.generateFrameNames('entities', { prefix: 'player_attack_', start: 0, end: 3 }),
      frameRate: 16,
      repeat: 0
    });

    // Boss animations (3 tiers)
    for (let tier = 0; tier < 3; tier++){
      this.anims.create({
        key: `boss_idle_t${tier}`,
        frames: this.anims.generateFrameNames('entities', { prefix: `boss_t${tier}_idle_`, start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1
      });
      this.anims.create({
        key: `boss_attack_t${tier}`,
        frames: this.anims.generateFrameNames('entities', { prefix: `boss_t${tier}_attack_`, start: 0, end: 3 }),
        frameRate: 12,
        repeat: 0
      });
      this.anims.create({
        key: `boss_death_t${tier}`,
        frames: this.anims.generateFrameNames('entities', { prefix: `boss_t${tier}_death_`, start: 0, end: 3 }),
        frameRate: 10,
        repeat: 0
      });
    }

    // Torch flicker (props)
    this.anims.create({
      key: 'torch_flicker',
      frames: [
        { key:'entities', frame:'prop_torch_0' },
        { key:'entities', frame:'prop_torch_1' },
      ],
      frameRate: 6,
      repeat: -1
    });

    this.scene.start('Game');
    this.scene.start('UI');
  }
}
