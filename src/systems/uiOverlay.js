// src/systems/uiOverlay.js
// HTML overlay: HUD + Achievements + Shop + Inventory + Skills + Fate + Pause.

const $ = (id) => document.getElementById(id);

export class UIOverlay {
  constructor({ achievements }){
    this.achievements = achievements;

    // Player HUD
    this.hpEl = $('hp');
    this.atkEl = $('atk');
    this.defEl = $('def');
    this.lvEl = $('lv');
    this.coinsEl = $('coins');

    // Boss HUD
    this.bossLvEl = $('bossLv');
    this.bossHpFill = $('bossHpFill');
    this.bossHpText = $('bossHpText');

    // Toast
    this.toastEl = $('toast');
    this.toastTitle = $('toastTitle');
    this.toastSub = $('toastSub');
    this.toastTimer = null;

    // Modals
    this.achModal = $('achModal');
    this.achGrid = $('achGrid');
    this.shopModal = $('shopModal');
    this.shopList = $('shopList');
    this.fateModal = $('fateModal');
    this.invModal = $('invModal');
    this.skillsModal = $('skillsModal');
    this.pauseModal = $('pauseModal');

    // Buttons
    this.btnFate = $('btnFate');
    this.btnInv = $('btnInv');
    this.btnSkills = $('btnSkills');
    this.btnPause = $('btnPause');

    // Fate / NG+
    this.ngpInfo = $('ngpInfo');
    this.ngpCoins = $('ngpCoins');
    this.btnStartNGP = $('btnStartNGP');
    this.lastChosenEnding = null;

    // Inventory elements
    this.invFragments = $('invFragments');
    this.invNgPlus = $('invNgPlus');
    this.invEquip = $('invEquip');
    this.invDrops = $('invDrops');
    this.invForgeInfo = $('invForgeInfo');
    this.invForgeCost = $('invForgeCost');
    this.invForgeReq = $('invForgeReq');
    this.btnUpgradeWeapon = $('btnUpgradeWeapon');
    this.btnSellAll = $('btnSellAll');
    this.invSellHint = $('invSellHint');

    // Skills elements
    this.skillsHeader = $('skillsHeader');
    this.skillCritLv = $('skillCritLv');
    this.skillCritReq = $('skillCritReq');
    this.btnUpCrit = $('btnUpCrit');

    this.skillLifeLv = $('skillLifeLv');
    this.skillLifeReq = $('skillLifeReq');
    this.btnUpLife = $('btnUpLife');

    this.skillDashLv = $('skillDashLv');
    this.skillDashReq = $('skillDashReq');
    this.btnUpDash = $('btnUpDash');

    // Pause elements
    this.pauseMsg = $('pauseMsg');
    this.btnResume = $('btnResume');
    this.btnSave = $('btnSave');
    this.btnSaveExit = $('btnSaveExit');
    this.btnPauseShop = $('btnPauseShop');
    this.btnPauseInv = $('btnPauseInv');
    this.btnPauseSkills = $('btnPauseSkills');

    // Local state cache (from Phaser registry)
    this.lastState = null;

    // Basic modal wiring
    $('btnAch').addEventListener('click', () => this.openAch());
    $('btnCloseAch').addEventListener('click', () => this.closeAch());

    $('btnShop').addEventListener('click', () => this.openShop());
    $('btnCloseShop').addEventListener('click', () => this.closeShop());

    $('btnCloseFate').addEventListener('click', () => this.closeFate());
    this.btnFate.addEventListener('click', () => this.openFate());

    this.btnInv.addEventListener('click', () => this.openInv());
    $('btnCloseInv').addEventListener('click', () => this.closeInv());

    this.btnSkills.addEventListener('click', () => this.openSkills());
    $('btnCloseSkills').addEventListener('click', () => this.closeSkills());

    this.btnPause.addEventListener('click', () => this.openPause());
    $('btnClosePause').addEventListener('click', () => this.closePause());

    // click outside closes (except pause, which is a menu)
    this.achModal.addEventListener('click', (e) => { if (e.target === this.achModal) this.closeAch(); });
    this.shopModal.addEventListener('click', (e) => { if (e.target === this.shopModal) this.closeShop(); });
    this.fateModal.addEventListener('click', (e) => { if (e.target === this.fateModal) this.closeFate(); });
    this.invModal.addEventListener('click', (e) => { if (e.target === this.invModal) this.closeInv(); });
    this.skillsModal.addEventListener('click', (e) => { if (e.target === this.skillsModal) this.closeSkills(); });
    this.pauseModal.addEventListener('click', (e) => { if (e.target === this.pauseModal) this.closePause(); });

    // Ending choice buttons
    this.fateModal.querySelectorAll('button[data-ending]').forEach(btn => {
      btn.addEventListener('click', () => {
        const ending = btn.getAttribute('data-ending');
        this.lastChosenEnding = ending;
        window.dispatchEvent(new CustomEvent('bf:ending:choose', { detail: { ending } }));
        window.dispatchEvent(new CustomEvent('bf:ngp:request'));
      });
    });

    // Start NG+
    this.btnStartNGP.addEventListener('click', () => {
      if (!this.lastChosenEnding) return;
      window.dispatchEvent(new CustomEvent('bf:ngplus:start', { detail: { ending: this.lastChosenEnding } }));
    });

    // Inventory actions
    this.btnUpgradeWeapon.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('bf:weapon:upgrade'));
    });

    this.btnSellAll.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('bf:inv:sell', { detail: { dropId: '__ALL__', qty: 999999 } }));
    });

    // Skills actions
    this.btnUpCrit.addEventListener('click', () => window.dispatchEvent(new CustomEvent('bf:skill:upgrade', { detail: { skill: 'crit' } })));
    this.btnUpLife.addEventListener('click', () => window.dispatchEvent(new CustomEvent('bf:skill:upgrade', { detail: { skill: 'lifesteal' } })));
    this.btnUpDash.addEventListener('click', () => window.dispatchEvent(new CustomEvent('bf:skill:upgrade', { detail: { skill: 'dashreset' } })));

    // Pause actions
    this.btnResume.addEventListener('click', () => this.closePause());
    this.btnSave.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('bf:save:now'));
      this.toast('Salvo', 'Seu progresso foi gravado.');
    });
    this.btnSaveExit.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('bf:save:exit'));
      this.pauseMsg.textContent = 'Jogo salvo. Você pode fechar a aba/app com segurança.';
    });

    this.btnPauseShop.addEventListener('click', () => this.openShop());
    this.btnPauseInv.addEventListener('click', () => this.openInv());
    this.btnPauseSkills.addEventListener('click', () => this.openSkills());

    // ESC toggles pause
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.pauseModal.classList.contains('is-open')) this.closePause();
        else this.openPause();
      }
    });

    // Game-driven events
    window.addEventListener('bf:fate:available', () => {
      this.btnFate.style.display = '';
      this.toast('Destino revelado', 'Abra “Destino” no topo para escolher um final.');
    });

    window.addEventListener('bf:ngp:quote', (ev) => {
      const { coins, unlockedCount, ngPlusNext } = ev.detail || {};
      if (!this.lastChosenEnding){
        this.ngpInfo.textContent = 'Escolha um final para ver o resgate de conquistas.';
        this.ngpCoins.textContent = '🪙 —';
        this.btnStartNGP.disabled = true;
        return;
      }
      this.ngpInfo.innerHTML = `Resgate: <b>${unlockedCount || 0}</b> conquistas → <b>${coins || 0}</b> Moedas de Sangraço (NG+ ${ngPlusNext}).`;
      this.ngpCoins.textContent = `🪙 ${coins || 0}`;
      this.btnStartNGP.disabled = false;
    });
  }

  setState(s){
    this.lastState = s;
    this.setStats(s);

    if (this.invModal.classList.contains('is-open')) this.renderInventory(s);
    if (this.skillsModal.classList.contains('is-open')) this.renderSkills(s);
  }

  setStats(s){
    this.hpEl.textContent = `${Math.max(0, Math.floor(s.hp))}/${Math.floor(s.maxHp)}`;
    this.atkEl.textContent = Math.floor(s.atk);
    this.defEl.textContent = Math.floor(s.def);
    this.lvEl.textContent = Math.floor(s.lv);
    this.coinsEl.textContent = Math.floor(s.coins);

    if (typeof s.bossLv === 'number') this.bossLvEl.textContent = Math.floor(s.bossLv);
    if (typeof s.bossHp === 'number' && typeof s.bossMaxHp === 'number' && s.bossMaxHp > 0){
      const pct = Math.max(0, Math.min(1, s.bossHp / s.bossMaxHp));
      this.bossHpFill.style.width = `${Math.round(pct * 100)}%`;
      this.bossHpText.textContent = `${Math.floor(s.bossHp)}/${Math.floor(s.bossMaxHp)}`;
    }
  }

  toast(title, sub){
    this.toastTitle.textContent = title;
    this.toastSub.textContent = sub;

    this.toastEl.classList.add('is-show');
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastEl.classList.remove('is-show'), 2400);
  }

  // Modals
  openAch(){ this.achModal.classList.add('is-open'); this.achModal.setAttribute('aria-hidden','false'); }
  closeAch(){ this.achModal.classList.remove('is-open'); this.achModal.setAttribute('aria-hidden','true'); }

  openShop(){
    this.shopModal.classList.add('is-open');
    this.shopModal.setAttribute('aria-hidden','false');
    window.dispatchEvent(new CustomEvent('bf:shop:open'));
  }
  closeShop(){ this.shopModal.classList.remove('is-open'); this.shopModal.setAttribute('aria-hidden','true'); }

  openFate(){ this.fateModal.classList.add('is-open'); this.fateModal.setAttribute('aria-hidden','false'); }
  closeFate(){ this.fateModal.classList.remove('is-open'); this.fateModal.setAttribute('aria-hidden','true'); }

  openInv(){
    this.invModal.classList.add('is-open');
    this.invModal.setAttribute('aria-hidden','false');
    if (this.lastState) this.renderInventory(this.lastState);
  }
  closeInv(){ this.invModal.classList.remove('is-open'); this.invModal.setAttribute('aria-hidden','true'); }

  openSkills(){
    this.skillsModal.classList.add('is-open');
    this.skillsModal.setAttribute('aria-hidden','false');
    if (this.lastState) this.renderSkills(this.lastState);
  }
  closeSkills(){ this.skillsModal.classList.remove('is-open'); this.skillsModal.setAttribute('aria-hidden','true'); }

  openPause(){
    this.pauseModal.classList.add('is-open');
    this.pauseModal.setAttribute('aria-hidden','false');
    this.pauseMsg.textContent = 'Boss congelado. Abra Loja/Inventário/Árvore e ajuste sua build.';
    window.dispatchEvent(new CustomEvent('bf:pause:open'));
  }
  closePause(){
    this.pauseModal.classList.remove('is-open');
    this.pauseModal.setAttribute('aria-hidden','true');
    window.dispatchEvent(new CustomEvent('bf:pause:resume'));
  }

  renderAchievements(list){
    this.achGrid.innerHTML = '';
    for (const a of list){
      const div = document.createElement('div');
      div.className = 'badge' + (a.unlocked ? '' : ' locked');
      div.innerHTML = `
        <div class="icon">${a.icon}</div>
        <p class="title">${escapeHtml(a.name)}</p>
        <p class="desc">${escapeHtml(a.unlocked ? a.desc : '??? Uma marca selada. Prove-se na arena.')}</p>
        <div class="meta">
          <span class="tag ${tierClass(a.tier)}">${escapeHtml(a.tier)}</span>
          <span class="tag">${a.unlocked ? 'Desbloqueada' : 'Bloqueada'}</span>
        </div>
      `;
      this.achGrid.appendChild(div);
    }
  }

  renderShop(){
    // same list as before (kept in code for demo)
    const items = [
      { id:'wp_rust', type:'weapon', name:'Lâmina Enferrujada', desc:'Barata, honesta, e um pouco trágica.', price: 120, atk: 14 },
      { id:'wp_moon', type:'weapon', name:'Espada da Lua Fria', desc:'Corta como uma promessa sussurrada.', price: 620, atk: 22 },
      { id:'wp_eclipse', type:'weapon', name:'Fio do Eclipse', desc:'Você não usa. Você é usado por ela.', price: 2200, atk: 50 },

      { id:'ar_leather', type:'armor', name:'Cota de Couro', desc:'Pouco brilho. Muita sobrevivência.', price: 160, def: 8, hp: 110 },
      { id:'ar_steel', type:'armor', name:'Armadura de Aço Sombrio', desc:'Cada placa é um “não” dito ao perigo.', price: 760, def: 14, hp: 140 },
      { id:'ar_colossus', type:'armor', name:'Casca do Colosso', desc:'A arena precisa de justificativa para te derrubar.', price: 2600, def: 22, hp: 200 },

      { id:'acc_rune', type:'accessory', name:'Anel Rúnico', desc:'Relíquia da arena. Não dá stats no protótipo (ainda).', price: 300 },

      { id:'pot_atk', type:'potion', stat:'atk', amount: 3, name:'Poção de Força', desc:'+3 ataque. Matemática engarrafada.', price: 220 },
      { id:'pot_def', type:'potion', stat:'def', amount: 3, name:'Poção de Vigor', desc:'+3 defesa. Cansa menos apanhar.', price: 220 },
      { id:'pot_hp', type:'potion', stat:'hp', amount: 20, name:'Poção de Vitalidade', desc:'+20 vida máxima (e cura total).', price: 320 },

      { id:'torch', type:'torch', name:'Tocha do Explorador', desc:'Nem tudo que te mata é um inimigo visível.', price: 180 },
      { id:'soul_anchor', type:'soulAnchor', name:'Âncora da Alma', desc:'Mantém inventário e moedas ao morrer. Um contrato bem assinado.', price: 1200 },
    ];

    this.shopList.innerHTML = '';
    for (const it of items){
      const card = document.createElement('div');
      card.className = 'item';
      card.innerHTML = `
        <h3>${escapeHtml(it.name)}</h3>
        <p>${escapeHtml(it.desc)}</p>
        <div class="row">
          <span class="price">🪙 ${it.price}</span>
          <button class="btn">Comprar</button>
        </div>
      `;
      card.querySelector('button').addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('bf:buy', { detail: it }));
      });
      this.shopList.appendChild(card);
    }
  }

  renderInventory(s){
    const inv = s.inventory || {};
    const frags = inv.nucleusFragments ?? 0;
    const drops = inv.drops || {};
    const ng = s.ngPlus ?? 0;

    this.invFragments.textContent = frags;
    this.invNgPlus.textContent = `NG+ ${ng}`;

    const weaponName = inv.weaponName || inv.weapon || '—';
    const armorName = inv.armorName || inv.armor || '—';
    const accName = inv.accessoryName || inv.accessory || '—';

    const wLv = inv.weaponUpgradeLevel ?? 0;

    this.invEquip.innerHTML = `
      <b>Arma:</b> ${escapeHtml(String(weaponName))} <span class="small">(forja +${wLv})</span><br/>
      <b>Armadura:</b> ${escapeHtml(String(armorName))}<br/>
      <b>Acessório:</b> ${escapeHtml(String(accName))}
    `;

    // Forge info
    if (!inv.weapon){
      this.invForgeInfo.textContent = 'Selecione uma arma comprando na loja.';
      this.invForgeCost.textContent = '🪙 —';
      this.invForgeReq.textContent = '—';
      this.btnUpgradeWeapon.disabled = true;
    } else {
      this.invForgeInfo.textContent = `Fortalecer aumenta o ataque da arma atual.`;
      const req = inv.nextUpgradeReq || null;
      if (!req){
        this.invForgeCost.textContent = '🪙 —';
        this.invForgeReq.textContent = '—';
        this.btnUpgradeWeapon.disabled = true;
      } else {
        this.invForgeCost.textContent = `🪙 ${req.coins}`;
        const mats = Object.entries(req.mats || {}).map(([k,v]) => `${k}: ${v}`).join(' • ');
        this.invForgeReq.textContent = `Req: Fragmentos ${req.fragments} • ${mats || '—'}`;
        this.btnUpgradeWeapon.disabled = !req.can;
      }
    }

    // Drops list
    const ids = Object.keys(drops);
    this.invDrops.innerHTML = '';
    if (ids.length === 0){
      const empty = document.createElement('div');
      empty.className = 'item';
      empty.innerHTML = `<p class="small">Nenhum drop ainda. Derrote bosses para coletar materiais.</p>`;
      this.invDrops.appendChild(empty);
      this.invSellHint.textContent = '—';
      return;
    }

    let totalValue = 0;
    for (const id of ids){
      const d = drops[id];
      if (!d || d.count <= 0) continue;
      totalValue += d.count * (d.sellValue || 0);

      const card = document.createElement('div');
      card.className = 'item';
      card.innerHTML = `
        <h3>${escapeHtml(d.name || id)} <span class="small">x${d.count}</span> <span class="small">[${escapeHtml(d.act || '—')}]</span></h3>
        <p>${escapeHtml(d.desc || 'Material da arena.')}</p>
        <div class="row">
          <span class="price">🪙 ${d.sellValue} (cada)</span>
          <div class="row">
            <button class="btn" data-sell="1">Vender 1</button>
            <button class="btn" data-sell="all">Vender tudo</button>
          </div>
        </div>
      `;
      card.querySelector('button[data-sell="1"]').addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('bf:inv:sell', { detail: { dropId: id, qty: 1 } }));
      });
      card.querySelector('button[data-sell="all"]').addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('bf:inv:sell', { detail: { dropId: id, qty: 999999 } }));
      });

      this.invDrops.appendChild(card);
    }

    this.invSellHint.textContent = `Valor total (se vender tudo): 🪙 ${totalValue}`;
  }

  renderSkills(s){
    const inv = s.inventory || {};
    const wid = inv.weapon;
    const weaponName = inv.weaponName || wid || null;
    const skills = inv.weaponSkills || {};
    const cur = wid ? (skills[wid] || {}) : null;

    if (!wid){
      this.skillsHeader.textContent = 'Selecione uma arma comprando na loja.';
      this.skillCritLv.textContent = 'Lv 0';
      this.skillLifeLv.textContent = 'Lv 0';
      this.skillDashLv.textContent = 'Lv 0';
      this.skillCritReq.textContent = '—';
      this.skillLifeReq.textContent = '—';
      this.skillDashReq.textContent = '—';
      this.btnUpCrit.disabled = true;
      this.btnUpLife.disabled = true;
      this.btnUpDash.disabled = true;
      return;
    }

    this.skillsHeader.innerHTML = `Arma atual: <b>${escapeHtml(String(weaponName))}</b> • Fragmentos: <b>${inv.nucleusFragments ?? 0}</b>`;

    const req = inv.nextSkillReq || {};
    const crit = req.crit || null;
    const life = req.lifesteal || null;
    const dash = req.dashreset || null;

    const critLv = cur?.crit ?? 0;
    const lifeLv = cur?.lifesteal ?? 0;
    const dashLv = cur?.dashreset ?? 0;

    this.skillCritLv.textContent = `Lv ${critLv}`;
    this.skillLifeLv.textContent = `Lv ${lifeLv}`;
    this.skillDashLv.textContent = `Lv ${dashLv}`;

    if (crit){
      this.skillCritReq.textContent = fmtReq(crit);
      this.btnUpCrit.disabled = !crit.can;
    } else {
      this.skillCritReq.textContent = '—';
      this.btnUpCrit.disabled = true;
    }

    if (life){
      this.skillLifeReq.textContent = fmtReq(life);
      this.btnUpLife.disabled = !life.can;
    } else {
      this.skillLifeReq.textContent = '—';
      this.btnUpLife.disabled = true;
    }

    if (dash){
      this.skillDashReq.textContent = fmtReq(dash);
      this.btnUpDash.disabled = !dash.can;
    } else {
      this.skillDashReq.textContent = '—';
      this.btnUpDash.disabled = true;
    }
  }
}

function fmtReq(r){
  const mats = Object.entries(r.mats || {}).map(([k,v]) => `${k}x${v}`).join(' • ');
  return `🪙 ${r.coins} • Fragmentos ${r.fragments} • ${mats || '—'}`;
}

function escapeHtml(str){
  return String(str)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#039;");
}

function tierClass(t){
  const x = String(t).toLowerCase();
  if (x.includes('mít') || x.includes('mit') || x.includes('lend') || x.includes('ouro')) return 'warn';
  if (x.includes('prata')) return 'good';
  return '';
}
