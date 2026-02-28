// src/systems/storyManager.js
const KEY = 'bf_story_v1';

export class StoryManager {
  constructor(){
    this.flags = new Set();
    this.load();
  }

  load(){
    try{
      const raw = localStorage.getItem(KEY);
      const data = raw ? JSON.parse(raw) : null;
      if (data?.flags && Array.isArray(data.flags)){
        for (const f of data.flags) this.flags.add(f);
      }
    } catch {}
  }

  save(){
    try{
      localStorage.setItem(KEY, JSON.stringify({ flags: [...this.flags] }));
    } catch {}
  }

  has(flag){ return this.flags.has(flag); }

  set(flag){
    if (!flag) return;
    this.flags.add(flag);
    this.save();
  }

  reset(){
    this.flags.clear();
    this.save();
  }

  static hardResetStorage(){
    try{ localStorage.removeItem(KEY); } catch {}
  }
}
