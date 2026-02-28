// src/scenes/DialogueScene.js
import { STORY } from '../systems/storyData.js';

export class DialogueScene extends Phaser.Scene {
  constructor(){ super('Dialogue'); }

  init(data){
    this.nodeId = data.nodeId;
    this.story = data.story;
    this.onClose = data.onClose || null;
  }

  create(){
    const node = STORY[this.nodeId];
    if (!node){
      this.close();
      return;
    }

    this.lines = node.lines.slice();
    this.i = 0;

    const w = this.scale.width;
    const h = this.scale.height;

    this.add.rectangle(w/2, h/2, w, h, 0x000000, 0.58).setDepth(1000);

    const boxH = Math.max(170, Math.round(h * 0.30));
    this.add.rectangle(w/2, h - boxH/2 - 18, w - 36, boxH, 0x0c1222, 0.94)
      .setStrokeStyle(2, 0x1c2a4d, 1).setDepth(1001);

    this.title = this.add.text(28, h - boxH - 18, 'Círculo da Ascensão', {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial',
      fontSize: '12px',
      color: '#a9b7d6'
    }).setDepth(1002);

    this.text = this.add.text(28, h - boxH + 10, '', {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial',
      fontSize: '18px',
      color: '#eaf1ff',
      wordWrap: { width: w - 56 }
    }).setDepth(1002);

    this.add.text(w - 28, h - 28, 'toque para continuar', {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial',
      fontSize: '12px',
      color: '#a9b7d6'
    }).setOrigin(1, 1).setDepth(1002);

    this.showLine();

    this.input.on('pointerdown', () => {
      this.i++;
      if (this.i >= this.lines.length){
        if (node.setFlag && this.story) this.story.set(node.setFlag);
        this.close();
      } else {
        this.showLine();
      }
    });

    this.scale.on('resize', () => {
      this.scene.restart({ nodeId: this.nodeId, story: this.story, onClose: this.onClose });
    });
  }

  showLine(){
    const line = this.lines[this.i];
    const m = /^([^:]{2,24}):\s*(.*)$/.exec(line);
    if (m){
      this.title.setText(m[1]);
      this.text.setText(m[2]);
    } else {
      this.title.setText('Círculo da Ascensão');
      this.text.setText(line);
    }
  }

  close(){
    this.scene.stop();
    this.scene.resume('Game');
    if (typeof this.onClose === 'function') this.onClose();
  }
}
