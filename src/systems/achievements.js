// src/systems/achievements.js
const KEY = 'bf_ach_v1';

const TIER_VALUE = {
  'Bronze': 50,
  'Prata': 120,
  'Ouro': 260,
  'Lendário': 520,
  'Mítico': 1200
};

const ACH = [
  { id:'wake', icon:'🗡️', name:'Despertar no Campo de Batalha', desc:'Abrir os olhos já é metade da vitória. A outra metade é não morrer em seguida.', tier:'Bronze' },
  { id:'firstBoss', icon:'👑', name:'Primeira Coroa Quebrada', desc:'Derrote um boss pela primeira vez (qualquer dificuldade).', tier:'Bronze' },
  { id:'firstBuy', icon:'🧾', name:'Moedas Têm Voz', desc:'Compre seu primeiro item. O mercador sorri… e você sente o preço na alma.', tier:'Bronze' },
  { id:'lv10', icon:'✨', name:'Aprendiz do Abismo', desc:'Atingir nível 10. Seus passos começam a deixar marcas.', tier:'Bronze' },
  { id:'lv25', icon:'🔥', name:'Veterano das Sombras', desc:'Atingir nível 25. A arena reconhece seu nome.', tier:'Prata' },
  { id:'lv50', icon:'🌙', name:'Campeão da Lua Partida', desc:'Atingir nível 50. O céu fica em silêncio quando você entra.', tier:'Ouro' },
  { id:'lv100', icon:'☄️', name:'Lenda que Não Cabe no Mapa', desc:'Atingir nível 100. Alguns juram que você é bug… outros chamam de mito.', tier:'Lendário' },
  { id:'coins5k', icon:'🪙', name:'Tesouro de Bolso', desc:'Acumular 5.000 Moedas de Sangraço. O som do ouro vira música de guerra.', tier:'Prata' },
  { id:'coins10k', icon:'🏦', name:'Banco das Ruínas', desc:'Acumular 10.000 Moedas de Sangraço. O Colecionador te chama de “meu melhor amigo”.', tier:'Ouro' },

  { id:'firstWeapon', icon:'⚔️', name:'Aço que Fala', desc:'Compre sua primeira arma. Ela pede histórias.', tier:'Bronze' },
  { id:'firstAcc', icon:'💍', name:'Relíquia de Sorte Duvidosa', desc:'Compre seu primeiro acessório. Poder ou maldição? Sim.', tier:'Bronze' },
  { id:'firstArmor', icon:'🛡️', name:'Armadura, Promessa e Peso', desc:'Compre sua primeira armadura. O medo aprende novas regras.', tier:'Bronze' },

  { id:'str20', icon:'💪', name:'Força de Portão', desc:'Chegar a 20 de ataque. Você abre portas… e crânios.', tier:'Prata' },
  { id:'str50', icon:'🦬', name:'Força de Cataclismo', desc:'Chegar a 50 de ataque. É difícil chamar isso de “luta justa”.', tier:'Lendário' },
  { id:'vit20', icon:'❤️', name:'Vitalidade de Soldado', desc:'Aumentar a vida máxima para 120+. Você aguenta mais do que deveria.', tier:'Prata' },
  { id:'vit50', icon:'🩸', name:'Vitalidade de Colosso', desc:'Aumentar a vida máxima para 200+. A arena cansa antes de você.', tier:'Ouro' },

  { id:'pressAttack', icon:'🧨', name:'Decisão Instantânea', desc:'Aperte Ataque. O resto do mundo vira barulho.', tier:'Bronze' },
  { id:'pressDash', icon:'💨', name:'Fuga Elegante', desc:'Aperte Esquiva. Covardia? Não. Geometria aplicada.', tier:'Bronze' },
  { id:'dash', icon:'🌀', name:'Passo Impossível', desc:'Use a esquiva em movimento. Você foi e voltou antes do tempo notar.', tier:'Bronze' },
  { id:'firstHit', icon:'🎯', name:'Primeiro Sangue', desc:'Acerte o boss pela primeira vez. O eco acorda coisas antigas.', tier:'Bronze' },
  { id:'swingAir', icon:'🫥', name:'Golpe no Vazio', desc:'Ataque fora do alcance. A arena ri baixinho.', tier:'Bronze' },
  { id:'nearDeath', icon:'⚰️', name:'Beira do Fim', desc:'Chegue a 25 de vida ou menos. O coração aprende a negociar.', tier:'Prata' },
  { id:'firstDeath', icon:'💀', name:'A Primeira Queda', desc:'Morrer pela primeira vez. A derrota tem gosto.', tier:'Bronze' },
  { id:'noAnchor', icon:'🕳️', name:'Sem Amarras', desc:'Morrer sem Âncora da Alma. O chão cobra pedágio.', tier:'Bronze' },
  { id:'anchorBought', icon:'🧿', name:'Contrato com o Destino', desc:'Comprar a Âncora da Alma. A morte fica menos… burocrática.', tier:'Prata' },
  { id:'anchorSaved', icon:'🧷', name:'A Alma Presa ao Corpo', desc:'Morrer com Âncora ativa e manter seu progresso. Você trapaceou — com estilo.', tier:'Ouro' },

  { id:'slayer10', icon:'📜', name:'Caçador Reconhecido', desc:'Derrotar 10 bosses. A arena começa a registrar seu nome.', tier:'Prata' },
  { id:'slayer25', icon:'📚', name:'Crônica de Carnificina', desc:'Derrotar 25 bosses. Sua história vira capítulo obrigatório.', tier:'Ouro' },

  { id:'rotate', icon:'📱', name:'Ritual da Rotação', desc:'Mude a orientação (vertical ↔ horizontal). O HUD se rearranja sem reclamar.', tier:'Bronze' },
  { id:'enrageWitness', icon:'😡', name:'Quando o Boss Ferve', desc:'Testemunhe o estado de fúria do boss.', tier:'Prata' },

  { id:'firstPotion', icon:'🧪', name:'Gole de Poder', desc:'Comprar uma poção e sentir a matemática do caos.', tier:'Bronze' },
  { id:'torch', icon:'🕯️', name:'Luz Contra o Breu', desc:'Comprar uma tocha. Nem tudo é combate — às vezes é coragem.', tier:'Bronze' },
  { id:'collector', icon:'🎒', name:'Colecionador de Promessas', desc:'Fazer 5 compras. A mochila vira uma biografia.', tier:'Prata' },

  { id:'ending_destroy', icon:'🔨', name:'Quebra do Círculo', desc:'Escolher destruir o ciclo e libertar o mundo.', tier:'Lendário' },
  { id:'ending_dominate', icon:'👁️', name:'Senhor do Núcleo', desc:'Escolher dominar o Núcleo e tomar a arena para si.', tier:'Lendário' },
  { id:'ending_succumb', icon:'🕸️', name:'Próximo Grande Inimigo', desc:'Escolher sucumbir e virar a próxima ameaça do Círculo.', tier:'Lendário' },

  { id:'ngplus_many', icon:'♾️', name:'Eterno Retorno', desc:'Iniciar 3 New Game+ ou mais. O Círculo já sabe seu passo.', tier:'Mítico' },
];

export class Achievements {
  constructor(){
    this.map = new Map(ACH.map(a => [a.id, a]));
    this.unlocked = new Set();
    this.listeners = new Set();
    this.load();
  }

  load(){
    try{
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (Array.isArray(data?.unlocked)){
        data.unlocked.forEach(id => this.unlocked.add(id));
      }
    } catch {}
  }

  save(){
    try{
      localStorage.setItem(KEY, JSON.stringify({ unlocked: [...this.unlocked] }));
    } catch {}
  }

  reset(){
    this.unlocked.clear();
    this.save();
  }

  isUnlocked(id){ return this.unlocked.has(id); }

  unlock(id){
    if (!this.map.has(id)) return false;
    if (this.unlocked.has(id)) return false;
    this.unlocked.add(id);
    this.save();
    const ach = this.map.get(id);
    for (const fn of this.listeners) fn(ach);
    return true;
  }

  onUnlock(fn){
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  getAll(){
    return [...this.map.values()].map(a => ({ ...a, unlocked: this.unlocked.has(a.id) }));
  }

  getUnlockedList(){
    return [...this.unlocked].map(id => this.map.get(id)).filter(Boolean);
  }

  getCashoutPreview(){
    const list = this.getUnlockedList();
    const coins = list.reduce((sum, a) => sum + (TIER_VALUE[a.tier] || 0), 0);
    return { coins, unlockedCount: list.length };
  }

  cashoutAndReset(){
    const { coins } = this.getCashoutPreview();
    this.reset();
    return coins;
  }
}
