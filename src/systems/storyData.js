// src/systems/storyData.js

export function collectorGreetingNode(ngPlus){
  if (ngPlus <= 0) return 'collector_ng0';
  if (ngPlus === 1) return 'collector_ng1';
  if (ngPlus === 2) return 'collector_ng2';
  return 'collector_ng3';
}

export const STORY = {
  intro: {
    id: 'intro',
    setFlag: 'intro_done',
    lines: [
      'No coração de um reino esquecido, existe uma arena que jamais dorme.',
      'Cada golpe ecoa como uma promessa. Cada vitória cobra um preço.',
      'Marcado pelo Núcleo do Confronto, você foi lançado ao Círculo da Ascensão.',
      'Derrote seus inimigos. Recolha as Moedas de Sangraço. Torne-se mais forte.',
      'Mas lembre-se: aqui, todo campeão alimenta algo maior do que si mesmo.'
    ]
  },

  collector_ng0: {
    id: 'collector_ng0',
    setFlag: 'collector_greet_done',
    lines: [
      'O Colecionador: “Moedas de Sangraço… quentes, pesadas. Você vai aprender a amá-las.”',
      'O Colecionador: “Eu vendo poder. Você vende tempo… e sangue.”',
      'O Colecionador: “Volte vivo. Guerras longas valem mais do que vitórias rápidas.”'
    ]
  },

  collector_ng1: {
    id: 'collector_ng1',
    setFlag: 'collector_greet_done',
    lines: [
      'O Colecionador: “Você voltou.”',
      'O Colecionador: “O Círculo te reconhece. E eu também.”',
      'O Colecionador: “Desta vez, ele vai cobrar mais cedo.”'
    ]
  },

  collector_ng2: {
    id: 'collector_ng2',
    setFlag: 'collector_greet_done',
    lines: [
      'O Colecionador: “De novo?”',
      'O Colecionador: “Você tenta romper o ciclo… ou colecionar cicatrizes?”',
      'O Colecionador: “Compre bem. O Núcleo anda faminto.”'
    ]
  },

  collector_ng3: {
    id: 'collector_ng3',
    setFlag: 'collector_greet_done',
    lines: [
      'O Colecionador: “Eterno retorno.”',
      'O Colecionador: “Eu já vendi sua esperança antes. Ela sempre volta… mais cara.”',
      'O Colecionador: “Vamos ver até onde sua vontade aguenta.”'
    ]
  },

  first_fragment: {
    id: 'first_fragment',
    setFlag: 'got_first_fragment',
    lines: [
      'O boss cai. Algo sobe do corpo como fumaça viva.',
      'Um Fragmento do Núcleo pulsa na sua mão — como se reconhecesse seu nome.',
      'O Colecionador: “Então é verdade… o Núcleo te escolheu mesmo.”',
      'O Colecionador: “Pegue. Isso fortalece… e marca.”'
    ]
  },

  anchor_warning: {
    id: 'anchor_warning',
    setFlag: 'anchor_warning_done',
    lines: [
      'O Colecionador: “Âncora da Alma? Contrato bonito.”',
      'O Colecionador: “Você acha que comprou segurança.”',
      'O Colecionador: “Na verdade… comprou continuidade.”'
    ]
  },

  truth_reveal: {
    id: 'truth_reveal',
    setFlag: 'truth_known',
    lines: [
      'O Colecionador: “A arena não foi criada para coroar campeões.”',
      'O Colecionador: “Ela foi criada para alimentar uma entidade adormecida.”',
      'O Colecionador: “Cada luta… cada vitória… cada nível… é comida.”'
    ]
  },

  ending_choice: {
    id: 'ending_choice',
    setFlag: 'ending_unlocked',
    lines: [
      'O Núcleo responde — não como poder… como vontade.',
      'Três caminhos se abrem como feridas no ar:',
      '1) Destruir o ciclo para libertar o mundo.',
      '2) Dominar o Núcleo e se tornar o novo senhor da arena.',
      '3) Sucumbir e virar o próximo grande inimigo.'
    ]
  },

  end_destroy: {
    id: 'end_destroy',
    setFlag: 'end_destroy_seen',
    lines: [
      'Você crava sua vontade no Núcleo como uma lâmina.',
      'O Círculo treme. As paredes rangem como ossos antigos.',
      'O Colecionador: “Então… você escolheu a liberdade.”',
      'O mundo lá fora respira. O ciclo sangra… e racha.'
    ]
  },

  end_dominate: {
    id: 'end_dominate',
    setFlag: 'end_dominate_seen',
    lines: [
      'Você segura o Núcleo — e ele segura você de volta.',
      'O Círculo se curva. A arena aprende seu nome como um mandamento.',
      'O Colecionador: “Um novo senhor…”',
      'O poder é seu. O preço também.'
    ]
  },

  end_succumb: {
    id: 'end_succumb',
    setFlag: 'end_succumb_seen',
    lines: [
      'A vontade falha. O Núcleo sorri por dentro do seu peito.',
      'Você sente seu corpo virar lenda… e ameaça.',
      'O Colecionador: “Ah…”',
      '“Bem-vindo ao catálogo dos próximos inimigos.”'
    ]
  }
};
