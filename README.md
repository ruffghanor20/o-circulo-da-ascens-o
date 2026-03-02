# O circulo da ascenção (Phaser.js) —  Atlas (entities.png + entities.json)

# No coração de um reino esquecido, existe uma arena que jamais dorme.
   # cada golpe ecoa como uma promessa. Cada vitória cobra um preço.'
   # Marcado pelo Núcleo do Confronto, você foi lançado ao Círculo da Ascensão.
   # Derrote seus inimigos. Recolha as Moedas de Sangraço. Torne-se mais forte.
   # Mas lembre-se: aqui, todo campeão alimenta algo maior do que si mesmo.

# Jogo modo arena com : personagem, boss, props e FX em **um único atlas**.
  
## scremshot tela principal: 
# [tela de inicio](image.png)
# [tela de inventario](image-1.png)
# [loja](image-2.png)
# [habilidades](image-3.png)
# [sistema de conquistas](image-4.png)
# [Modo new game +](image-5.png)
# [app android] [o circulo da ascensão] :[1]
## Rodar
```bash
npm install
npm run dev
```

## Assets
### Atlas principal
```txt
public/assets/atlas/
  entities.png
  entities.json
```

### Arena e sons
```txt
public/assets/sprites/
  arena_circulo_ascensao_1280x720.png
  arena_vignette_1280x720.png

public/assets/audio/
  sfx_hit.wav
  ambience_arena_loop.wav
  sfx_victory.wav
```

## Nomes de frames usados
Veja `public/assets/README_ASSETS.txt`.

## Onde o atlas é carregado
- `src/scenes/BootScene.js` → `this.load.atlas('entities', ...)`

## Onde é usado
- `src/scenes/GameScene.js` cria player/boss/props/particles usando frames do atlas.

[1]: ./O%20circulo%20da%20Ascens%C3%A3o.apk

