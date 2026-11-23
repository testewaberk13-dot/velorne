'use strict';
// ===================== Marché entre joueurs — module DORMANT =====================
// Décision de l'utilisateur (21/11) : le marché peut exister, mais il n'est utilisable QUE si un mode multijoueur
// est activé un jour. Vélorne V2 reste solo : drapeau désactivé, aucun onglet visible, aucun faux marché hors ligne.
// Les marchands PNJ fonctionnent normalement. Règles chiffrées (frais, durées, limites) : PROPOSITIONS.
const MARKET_CFG = {
  enabled: false,          // passe à true uniquement avec un vrai serveur multijoueur
  feePct: 0.05,            // frais de mise en vente prélevés au vendeur
  durationsH: [12, 24, 48],
  maxListings: 10,
  minBidStep: 0.05,        // surenchère minimale : +5 %
  priceMin: 1, priceMax: 9999999
};
// Contrat que devra remplir le serveur : list(), create(listing), buy(id, buyer), bid(id, buyer, amount), cancel(id, seller), history(player)
let MARKET_BACKEND = null;
const Market = {
  active() { return MARKET_CFG.enabled && !!MARKET_BACKEND; },
  off() { return { err: 'Le marché entre joueurs n\'existe qu\'en mode multijoueur (désactivé dans cette version solo).' }; },
  // objets interdits : liés, uniques, équipés, verrouillés, objets de quête
  canList(P, inst) {
    const d = REG[inst.id]; if (!d) return 'Objet inconnu.';
    if (d.tradeRules === 'bound' || d.unique || d.kind === 'quest') return 'Objet lié : impossible à vendre aux joueurs.';
    if (inst.locked) return 'Objet verrouillé.';
    if (Object.values(P.equip || {}).includes(inst.uid)) return 'Retire d\'abord l\'objet.';
    return null;
  },
  async create(P, inst, qty, price, kind, hours) {
    if (!this.active()) return this.off();
    const why = this.canList(P, inst); if (why) return { err: why };
    price = Math.round(price); if (!(price >= MARKET_CFG.priceMin && price <= MARKET_CFG.priceMax)) return { err: 'Prix invalide.' };
    if (!MARKET_CFG.durationsH.includes(hours)) return { err: 'Durée invalide.' };
    const mine = (await MARKET_BACKEND.list()).filter(l => l.seller === P.name && l.open);
    if (mine.length >= MARKET_CFG.maxListings) return { err: 'Limite de ' + MARKET_CFG.maxListings + ' annonces atteinte.' };
    const fee = Math.max(1, Math.round(price * MARKET_CFG.feePct)); if (P.gold < fee) return { err: 'Frais de mise en vente : ' + fee + ' or.' };
    const r = await MARKET_BACKEND.create({ seller: P.name, item: { id: inst.id, lvl: inst.lvl || 0, ench: inst.ench || [], n: qty }, price, kind: kind === 'enchere' ? 'enchere' : 'fixe', ends: Date.now() + hours * 3600e3 });
    if (r && !r.err) { P.gold -= fee; removeUid(P, inst.uid); }
    return r;
  },
  async buy(P, id) { if (!this.active()) return this.off(); return MARKET_BACKEND.buy(id, P.name); },
  async bid(P, id, amount) {
    if (!this.active()) return this.off();
    const l = (await MARKET_BACKEND.list()).find(x => x.id === id); if (!l || !l.open || l.kind !== 'enchere') return { err: 'Enchère introuvable.' };
    const min = Math.ceil((l.bid || l.price) * (l.bid ? 1 + MARKET_CFG.minBidStep : 1)); if (amount < min) return { err: 'Offre minimale : ' + min + ' or.' };
    if (P.gold < amount) return { err: 'Or insuffisant.' };
    return MARKET_BACKEND.bid(id, P.name, amount);
  },
  async cancel(P, id) { if (!this.active()) return this.off(); return MARKET_BACKEND.cancel(id, P.name); },
  async history(P) { if (!this.active()) return this.off(); return MARKET_BACKEND.history(P.name); }
};
// Serveur de démonstration EN MÉMOIRE, réservé aux tests du code (jamais branché dans le jeu solo).
function marketMemoryBackend() {
  const L = [], H = []; let seq = 0;
  return {
    async list() { return L; },
    async create(o) { const l = Object.assign({ id: 'L' + (++seq), open: true, bid: 0, bidder: null }, o); L.push(l); return l; },
    async buy(id, buyer) { const l = L.find(x => x.id === id); if (!l || !l.open || l.kind !== 'fixe') return { err: 'Annonce indisponible.' }; if (l.seller === buyer) return { err: 'C\'est ton annonce.' }; l.open = false; H.push({ id, buyer, seller: l.seller, price: l.price, t: Date.now() }); return { ok: 1, item: l.item }; },
    async bid(id, buyer, amount) { const l = L.find(x => x.id === id); if (l.seller === buyer) return { err: 'C\'est ton annonce.' }; l.bid = amount; l.bidder = buyer; return { ok: 1 }; },
    async cancel(id, seller) { const l = L.find(x => x.id === id); if (!l || l.seller !== seller || (l.kind === 'enchere' && l.bid)) return { err: 'Annulation impossible.' }; l.open = false; return { ok: 1 }; },
    async history(p) { return H.filter(h => h.buyer === p || h.seller === p); }
  };
}
