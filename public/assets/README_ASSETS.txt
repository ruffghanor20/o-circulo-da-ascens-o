O jogo carrega tudo (personagem, boss, props e FX) a partir de UM atlas:

public/assets/atlas/
  entities.png
  entities.json

E mantém arena/sons separados:

public/assets/sprites/
  arena_circulo_ascensao_1280x720.png
  arena_vignette_1280x720.png

public/assets/audio/
  sfx_hit.wav
  ambience_arena_loop.wav
  sfx_victory.wav

---

SE VOCÊ FOR TROCAR ASSETS:

1) Recrie/atualize seu atlas e substitua:
   - public/assets/atlas/entities.png
   - public/assets/atlas/entities.json

2) Mantenha (ou atualize) os nomes dos frames usados no código (padrão atual):
   Player:
     player_idle_0..3
     player_run_0..3
     player_attack_0..3

   Boss (3 tiers):
     boss_t0_idle_0..3 / boss_t0_attack_0..3 / boss_t0_death_0..3
     boss_t1_idle_0..3 / boss_t1_attack_0..3 / boss_t1_death_0..3
     boss_t2_idle_0..3 / boss_t2_attack_0..3 / boss_t2_death_0..3

   Props/FX:
     prop_torch_0, prop_torch_1
     prop_column
     prop_chain
     fx_hit
     fx_dust_0..3

3) Se mudar tamanhos dos frames (ex.: 48x48), ajuste:
   - src/scenes/BootScene.js (animações)
   - src/scenes/GameScene.js (hitboxes: setSize / setOffset)

---

Obs:
A pasta public/assets/spritesheets/ foi mantida só como referência/backup do pipeline.
