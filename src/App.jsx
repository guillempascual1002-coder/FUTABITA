import React, { useState, useEffect, useRef, useCallback } from "react";

/* ============================================================
   MI CARRERA — Habit tracker estilo FIFA / Modo Carrera
   ============================================================ */

const STAT_KEYS = ["FIS", "FUE", "RES", "NUT", "REC", "MEN"];
const STAT_LABELS = { FIS: "Físico", FUE: "Fuerza", RES: "Resistencia", NUT: "Nutrición", REC: "Recuperación", MEN: "Mentalidad" };
const OVR_WEIGHTS = { FIS: 0.22, FUE: 0.2, RES: 0.15, NUT: 0.18, REC: 0.12, MEN: 0.13 };
const POSITIONS = ["DEL", "EXT", "MCO", "MC", "MCD", "LTD", "LTI", "DFC", "POR"];

const REGIONAL_POOL = [
  { name: "CD Guijuelo", c1: "#B3202C", c2: "#FFFFFF", city: "Guijuelo, Salamanca" },
  { name: "Unionistas CF", c1: "#1A1A1A", c2: "#FFFFFF", city: "Salamanca" },
  { name: "Arenas de Getxo", c1: "#C8102E", c2: "#111111", city: "Getxo, Bizkaia" },
  { name: "Real Avilés", c1: "#F5F5F5", c2: "#1D4E9E", city: "Avilés, Asturias" },
  { name: "CD Ebro", c1: "#1D4E9E", c2: "#FFFFFF", city: "Zaragoza" },
  { name: "Orihuela CF", c1: "#F2C500", c2: "#111111", city: "Orihuela, Alicante" },
  { name: "Bergantiños FC", c1: "#C8102E", c2: "#F2C500", city: "Carballo, A Coruña" },
  { name: "SD Tarazona", c1: "#1D4E9E", c2: "#C8102E", city: "Tarazona, Zaragoza" },
  { name: "Atlético Baleares", c1: "#1D6FB8", c2: "#FFFFFF", city: "Palma de Mallorca" },
  { name: "UD Alzira", c1: "#0E5FA8", c2: "#FFFFFF", city: "Alzira, Valencia" },
];

const TIERS = [
  { id: 0, league: "Tercera Federación · España", minOvr: 0, clubs: [] },
  { id: 1, league: "Segunda Federación · España", minOvr: 66, clubs: [
    { name: "Real Murcia", c1: "#8B0D32", c2: "#FFFFFF", country: "🇪🇸" },
    { name: "Hércules CF", c1: "#1D4E9E", c2: "#FFFFFF", country: "🇪🇸" },
    { name: "CE Sabadell", c1: "#1D6FB8", c2: "#FFFFFF", country: "🇪🇸" },
    { name: "Pontevedra CF", c1: "#7A1F3D", c2: "#FFFFFF", country: "🇪🇸" } ] },
  { id: 2, league: "Primera Federación", minOvr: 70, clubs: [
    { name: "Cultural Leonesa", c1: "#FFFFFF", c2: "#B3202C", country: "🇪🇸" },
    { name: "FC Andorra", c1: "#12355B", c2: "#F2C500", country: "🇦🇩" },
    { name: "AEK Larnaca", c1: "#0E6B3A", c2: "#F2C500", country: "🇨🇾" },
    { name: "Waalwijk RKC", c1: "#F2C500", c2: "#1D4E9E", country: "🇳🇱" } ] },
  { id: 3, league: "LaLiga Hypermotion / 2ª europea", minOvr: 74, clubs: [
    { name: "Real Zaragoza", c1: "#FFFFFF", c2: "#1D4E9E", country: "🇪🇸" },
    { name: "Sporting de Gijón", c1: "#C8102E", c2: "#FFFFFF", country: "🇪🇸" },
    { name: "Hamburgo SV", c1: "#1D4E9E", c2: "#111111", country: "🇩🇪" },
    { name: "Leeds United", c1: "#FFFFFF", c2: "#F2C500", country: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" } ] },
  { id: 4, league: "Primera división · media tabla", minOvr: 78, clubs: [
    { name: "Getafe CF", c1: "#1D6FB8", c2: "#FFFFFF", country: "🇪🇸" },
    { name: "RC Celta", c1: "#9CC3E5", c2: "#FFFFFF", country: "🇪🇸" },
    { name: "FC St. Pauli", c1: "#5A3A29", c2: "#C8102E", country: "🇩🇪" },
    { name: "RC Lens", c1: "#F2C500", c2: "#C8102E", country: "🇫🇷" },
    { name: "Torino FC", c1: "#7A1F3D", c2: "#FFFFFF", country: "🇮🇹" } ] },
  { id: 5, league: "Europa · puestos europeos", minOvr: 81, clubs: [
    { name: "Real Betis", c1: "#0E6B3A", c2: "#FFFFFF", country: "🇪🇸" },
    { name: "Olympique Marsella", c1: "#9CC3E5", c2: "#FFFFFF", country: "🇫🇷" },
    { name: "AS Roma", c1: "#7A1F3D", c2: "#F2A900", country: "🇮🇹" },
    { name: "Eintracht Frankfurt", c1: "#111111", c2: "#C8102E", country: "🇩🇪" },
    { name: "FC Porto", c1: "#1D4E9E", c2: "#FFFFFF", country: "🇵🇹" } ] },
  { id: 6, league: "Élite europea · Champions", minOvr: 85, clubs: [
    { name: "Atlético de Madrid", c1: "#C8102E", c2: "#FFFFFF", country: "🇪🇸" },
    { name: "AC Milan", c1: "#C8102E", c2: "#111111", country: "🇮🇹" },
    { name: "Borussia Dortmund", c1: "#F2C500", c2: "#111111", country: "🇩🇪" },
    { name: "Arsenal FC", c1: "#C8102E", c2: "#FFFFFF", country: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" } ] },
  { id: 7, league: "Leyenda mundial", minOvr: 89, clubs: [
    { name: "Real Madrid", c1: "#FFFFFF", c2: "#F2C500", country: "🇪🇸" },
    { name: "FC Barcelona", c1: "#12355B", c2: "#7A1F3D", country: "🇪🇸" },
    { name: "Bayern München", c1: "#C8102E", c2: "#FFFFFF", country: "🇩🇪" },
    { name: "Manchester City", c1: "#9CC3E5", c2: "#FFFFFF", country: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
    { name: "Liverpool FC", c1: "#C8102E", c2: "#FFFFFF", country: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" } ] },
];

const RIVALS_BY_TIER = [
  ["SD Cenicero", "CD Anguiano", "Racing Losar", "CD Alfaro", "UD Cintruénigo", "SD Peña Norte", "CF Ribera Alta", "CD San Adrián", "Atlético Vega"],
  ["CD Eldense", "Nàstic Tarragona", "SD Amorebieta", "Algeciras CF", "CF Talavera", "Recre Huelva", "CD Alcoyano", "Ourense CF", "Sestao River"],
  ["CD Castellón B", "Celta Fortuna", "Bilbao Athletic", "CD Lugo", "Real Unión", "Gimnàstic", "CF Intercity", "SD Ponferradina", "CD Numancia"],
  ["CD Mirandés", "SD Eibar", "Racing Santander", "Burgos CF", "Granada CF", "CD Tenerife", "Cádiz CF", "Levante UD", "Real Oviedo"],
  ["Rayo Vallecano", "CA Osasuna", "RCD Mallorca", "Deportivo Alavés", "Girona FC", "Valencia CF", "Sevilla FC", "Real Sociedad", "Athletic Club"],
  ["Villarreal CF", "SS Lazio", "OGC Niza", "SL Benfica", "PSV Eindhoven", "Aston Villa", "RB Leipzig", "Fiorentina", "Sporting CP"],
  ["Inter de Milán", "Juventus", "Chelsea FC", "Tottenham", "Newcastle", "Atalanta", "AS Mónaco", "Napoli", "Bayer Leverkusen"],
  ["Real Madrid", "FC Barcelona", "Man City", "Bayern", "Liverpool", "PSG", "Arsenal", "Inter", "Borussia Dortmund"],
];

const SEASON_LENGTH = 15; // jornadas (partido cada 2 días ≈ 1 mes)
const MID_WINDOW = 8;

const CAPTAINS = ["Iván Torres", "Rubén Salgado", "Marcos Peña", "Aitor Zubiaurre", "Dani Cortés", "Álex Herrera", "Chema Ríos"];
const PRESS = ["📰 La Grada Digital", "📰 Diario del Área", "📰 El Once Inicial", "📻 Radio Vestuario"];

function pressNote(g, dayForm) {
  const p = g.player, name = p.name, club = g.club.name;
  const ovr = calcOVR(p.stats);
  const next = TIERS.find((t) => t.id === g.tier.id + 1);
  const pool = [];
  if (dayForm === "alza") pool.push(
    `🔥 ${name} está intratable en los entrenamientos del ${club}. El cuerpo técnico no oculta su entusiasmo.`,
    `El staff del ${club} destaca la notable evolución física de ${name}. La grada ya tiene ídolo.`);
  if (dayForm === "buen") pool.push(
    `${name} sigue sumando buenos entrenamientos en el ${club}. La regularidad, su mejor virtud.`,
    `Ambiente tranquilo en la ciudad deportiva del ${club}: ${name} mantiene el ritmo y el míster sonríe.`);
  if (dayForm === "est") pool.push(
    `¿Le pesa la presión a ${name}? En el ${club} esperan un paso adelante de su joven promesa.`,
    `Semana discreta de ${name} en los entrenamientos. Nada grave, pero en el ${club} piden más.`);
  if (dayForm === "caida") pool.push(
    `❗ Se encienden las alarmas en el ${club}: ${name} acumula malas sensaciones. ¿Dónde está el jugador que ilusionó?`,
    `Preocupación en el ${club} por el evidente bajón de ${name} en las últimas sesiones.`);
  if ((p.streak || 0) >= 5) pool.push(
    `📈 ${p.streak} días seguidos de disciplina total: la constancia de ${name} ya es tema de conversación en ${club}.`);
  if (next && ovr >= next.minOvr - 2) pool.push(
    `👀 RUMOR | Ojeadores de ${next.league} habrían preguntado por ${name} (media ${ovr}). En el ${club} se hacen los sordos… de momento.`);
  return pool.length ? { from: pick(PRESS), text: pick(pool) } : null;
}

/* ---------------- helpers ---------------- */
const todayStr = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const dayDiff = (a, b) => Math.round((new Date(b + "T12:00") - new Date(a + "T12:00")) / 86400000);
const addDays = (s, n) => { const d = new Date(s + "T12:00"); d.setDate(d.getDate() + n); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pickN = (arr, n) => { const c = [...arr]; const out = []; while (out.length < n && c.length) out.push(c.splice(Math.floor(Math.random() * c.length), 1)[0]); return out; };
const nowTime = () => { const d = new Date(); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); };
const fmtEUR = (n) => n >= 1000000 ? (n / 1000000).toFixed(1).replace(".", ",") + " M€" : Math.round(n / 1000) + " mil €";

const calcOVR = (stats) => Math.round(STAT_KEYS.reduce((s, k) => s + stats[k] * OVR_WEIGHTS[k], 0));
const xpToNext = (v) => Math.round(40 + Math.max(0, v - 58) * 12);
const cardTier = (ovr) => (ovr >= 85 ? "special" : ovr >= 75 ? "gold" : ovr >= 65 ? "silver" : "bronze");
const marketValue = (ovr, kgGained) => Math.round((25000 * Math.pow(1.16, ovr - 60)) * (1 + Math.max(0, kgGained) * 0.06));

const FORM_META = {
  alza: { label: "AL ALZA", icon: "▲▲", color: "#3DDC84" },
  buen: { label: "BUEN RITMO", icon: "▲", color: "#9CC3E5" },
  est: { label: "ESTANCADO", icon: "—", color: "#C9A94E" },
  caida: { label: "EN CAÍDA", icon: "▼", color: "#E14B4B" },
};
const formFromPct = (p) => (p >= 110 ? "alza" : p >= 95 ? "buen" : p >= 70 ? "est" : "caida");

/* storage */
async function stGet(key) { try { const r = localStorage.getItem("futabita:" + key); return r ? JSON.parse(r) : null; } catch (e) { return null; } }
async function stSet(key, val) { try { localStorage.setItem("futabita:" + key, JSON.stringify(val)); } catch (e) { console.error("storage", e); } }

/* IA nutrición */
const toNum = (v) => { const n = parseFloat(String(v).replace(",", ".").replace(/[^\d.]/g, "")); return Number.isFinite(n) ? Math.round(n) : null; };
async function estimateNutrition(text) {
  const res = await fetch("/api/estimate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error("no-ia");
  const data = await res.json();
  const txt = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
  const clean = txt.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(clean.slice(clean.indexOf("{"), clean.lastIndexOf("}") + 1));
  if (parsed.error) throw new Error("no-food");
  const kcal = toNum(parsed.kcal), prot = toNum(parsed.proteina);
  if (kcal == null || prot == null) throw new Error("bad-numbers");
  return { name: String(parsed.nombre || text).slice(0, 40), kcal: Math.max(0, kcal), prot: Math.max(0, prot) };
}

/* saneo de datos: repara NaN/null heredados y recalcula totales */
const n0 = (v) => (Number.isFinite(v) ? v : 0);
function sanitizeGame(g) {
  if (!g) return g;
  const out = { ...g };
  if (out.logs) {
    out.logs = { ...out.logs };
    for (const k of Object.keys(out.logs)) {
      const l = { ...out.logs[k] };
      l.meals = (l.meals || []).filter((m) => m && Number.isFinite(m.kcal) && Number.isFinite(m.prot));
      l.kcal = l.meals.reduce((a, m) => a + n0(m.kcal), 0);
      l.prot = l.meals.reduce((a, m) => a + n0(m.prot), 0);
      out.logs[k] = l;
    }
  }
  if (out.savedMeals) out.savedMeals = out.savedMeals.filter((m) => m && Number.isFinite(m.kcal) && Number.isFinite(m.prot));
  return out;
}

/* evaluación del día -> % de cumplimiento */
function dayPct(log, player, dateStr) {
  const g = player.goals;
  const dow = new Date(dateStr + "T12:00").getDay(); // 0=Dom
  const isGymDay = g.gymDays.includes(dow);
  const kcalPct = Math.min((log.kcal || 0) / Math.max(1, g.kcal), 1.5);
  const protPct = Math.min((log.prot || 0) / Math.max(1, g.protein), 1.5);
  let weights = { nut: 0.4, gym: isGymDay ? 0.25 : 0, sleep: 0.15, hab: 0.2 };
  if (!isGymDay) { weights.nut = 0.5; weights.sleep = 0.22; weights.hab = 0.28; }
  const nHab = g.habits.length;
  const habPct = nHab ? (log.habitsDone || []).length / nHab : 1;
  const sleepPct = log.sleep == null ? 0 : Math.min(log.sleep / g.sleepGoal, 1.3);
  const gymPct = isGymDay ? (log.gym ? (log.gymProgress ? 1.3 : 1) : 0) : 0;
  const total = ((kcalPct + protPct) / 2) * weights.nut + gymPct * weights.gym + sleepPct * weights.sleep + habPct * weights.hab;
  return Math.round(total * 100);
}

/* XP al cerrar un día */
function applyDayClose(player, log, dateStr) {
  const pct = dayPct(log, player, dateStr);
  const form = formFromPct(pct);
  const mult = form === "alza" ? 1.5 : form === "buen" ? 1 : form === "est" ? 0.35 : 0;
  const g = player.goals;
  const dow = new Date(dateStr + "T12:00").getDay();
  const isGymDay = g.gymDays.includes(dow);
  const gains = { FIS: 0, FUE: 0, RES: 0, NUT: 0, REC: 0, MEN: 0 };
  if ((log.kcal || 0) >= g.kcal) gains.NUT += 10;
  if ((log.prot || 0) >= g.protein) gains.NUT += 10;
  if ((log.kcal || 0) >= g.kcal && (log.prot || 0) >= g.protein) gains.NUT += 5;
  if (log.gym) { gains.FIS += 14; if (log.gymProgress) gains.FUE += 12; }
  if (log.sleep != null && log.sleep >= g.sleepGoal) gains.REC += 10;
  gains.MEN += (log.habitsDone || []).length * 6;
  /* MEN pasiva: la constancia también es mentalidad */
  let flatMEN = 0;
  if ((log.meals || []).length > 0) flatMEN += 3; /* registrar comida: siempre suma, sin multiplicador */
  if (form === "alza" || form === "buen") gains.MEN += 4;
  let streak = player.streak || 0;
  if (form === "alza" || form === "buen") { streak += 1; gains.RES += 4; if (streak % 7 === 0) gains.RES += 20; }
  else if (form === "caida") streak = 0;
  const stats = { ...player.stats }, xp = { ...player.xp };
  const ups = [];
  STAT_KEYS.forEach((k) => {
    xp[k] = (xp[k] || 0) + Math.round(gains[k] * mult) + (k === "MEN" ? flatMEN : 0);
    while (stats[k] < 99 && xp[k] >= xpToNext(stats[k])) { xp[k] -= xpToNext(stats[k]); stats[k] += 1; ups.push(k); }
  });
  let badDays = form === "caida" ? (player.badDays || 0) + 1 : 0;
  let decayed = false;
  if (badDays >= 2) {
    const sorted = [...STAT_KEYS].sort((a, b) => stats[b] - stats[a]);
    stats[sorted[0]] = Math.max(50, stats[sorted[0]] - 1);
    stats[sorted[1]] = Math.max(50, stats[sorted[1]] - 1);
    badDays = 0; decayed = true;
  }
  return { player: { ...player, stats, xp, streak, badDays, form }, pct, form, ups, decayed };
}

/* simulación de partido */
function simulateMatch(player, rival, jornada) {
  const f = player.form || "est";
  const perf = { alza: 0.88, buen: 0.72, est: 0.5, caida: 0.28 }[f] + (calcOVR(player.stats) - 62) * 0.006 + rnd(-0.08, 0.08);
  const benched = f === "caida" && Math.random() < 0.5;
  const gf = Math.max(0, Math.round(rnd(0, 1.2) + perf * 2.6));
  const ga = Math.max(0, Math.round(rnd(0, 1.1) + (1 - perf) * 2.2));
  const atk = ["DEL", "EXT", "MCO"].includes(player.position);
  let myGoals = 0, myAssists = 0;
  if (!benched && gf > 0) {
    for (let i = 0; i < gf; i++) {
      if (atk && Math.random() < perf * 0.75) myGoals++;
      else if (Math.random() < perf * 0.45) myAssists++;
    }
  }
  let rating = benched ? 0 : Math.min(9.9, Math.max(4.8, 5.6 + perf * 3 + myGoals * 0.6 + myAssists * 0.35 + rnd(-0.3, 0.3)));
  const events = [];
  const mins = new Set();
  const uniqMin = () => { let m; do { m = Math.floor(rnd(4, 90)); } while (mins.has(m)); mins.add(m); return m; };
  for (let i = 0; i < gf; i++) {
    const mine = myGoals-- > 0;
    events.push({ min: uniqMin(), text: mine ? `⚽ ¡GOOOL de ${player.name}!` : `⚽ Gol de tu equipo${myAssists-- > 0 ? ` · asistencia de ${player.name}` : ""}` , good: true });
  }
  for (let i = 0; i < ga; i++) events.push({ min: uniqMin(), text: `🥅 Gol de ${rival}`, good: false });
  if (benched) events.push({ min: 1, text: `🪑 ${player.name} empieza en el banquillo (mala forma)`, good: false });
  else if (rating >= 8.5) events.push({ min: uniqMin(), text: `🔥 ${player.name} está intratable`, good: true });
  events.sort((a, b) => a.min - b.min);
  const res = gf > ga ? "V" : gf === ga ? "E" : "D";
  return { gf, ga, res, rating: benched ? null : Math.round(rating * 10) / 10, benched, events, jornada, rival,
    myGoals: events.filter((e) => e.text.includes("GOOOL")).length,
    myAssists: events.filter((e) => e.text.includes("asistencia")).length };
}

function coachMessage(m, player) {
  if (m.benched) return pick([
    `Hoy te he dejado en el banquillo. Llevas días grises en los entrenamientos y necesito verte al cien por cien. Demuéstrame que quieres jugar.`,
    `Sin buenas sensaciones no hay minutos, así de claro. Recupera el tono esta semana y volverás al once.`]);
  if (m.rating >= 8.5) return pick([
    `¡${m.rating} de nota! Espectacular. Si sigues con esta entrega, los grandes van a llamar a tu puerta.`,
    `Partidazo. ${m.myGoals ? `Ese gol tuyo` : `Tu despliegue`} marcó la diferencia. Sigue con esa mentalidad.`]);
  if (m.res === "V") return pick([
    `Buena victoria ${m.gf}-${m.ga}. Se nota el trabajo que estás metiendo entre semana. No aflojes.`,
    `Tres puntos más. Tu constancia en los entrenamientos se vio en el césped.`]);
  if (m.res === "E") return `Empate ${m.gf}-${m.ga}. Nos faltó chispa. En los pequeños detalles del día a día está la diferencia.`;
  return pick([
    `Derrota ${m.gf}-${m.ga}. Los partidos se ganan entre semana, en el trabajo diario. Espero más de ti.`,
    `Mal día (${m.gf}-${m.ga}). Analiza tu semana: el campo nunca miente.`]);
}

function makeOffer(club, tier, ovr) {
  const salary = marketValue(ovr, 0) * 0.4;
  return { club, league: tier.league, tierId: tier.id, salary,
    text: pick([
      `Hemos seguido tu progresión y tu media de ${ovr} nos ha convencido. ${club.name} quiere hacerte una oferta formal.`,
      `El director deportivo del ${club.name} te ha visto en las últimas jornadas. Quieren que des el salto a ${tier.league}.`,
      `${club.name} pone sobre la mesa un contrato. Creen que tu momento es ahora.`]) };
}

function buildTable(myClub, tierId) {
  const rivals = pickN(RIVALS_BY_TIER[Math.min(tierId, RIVALS_BY_TIER.length - 1)], 9);
  return [{ name: myClub, pts: 0, me: true }, ...rivals.map((r) => ({ name: r, pts: 0, me: false }))];
}

/* ============================================================
   FRASES ESPONTÁNEAS · el mundo del juego sigue vivo cada día
   ------------------------------------------------------------
   Reglas:
   - c (club): entrenador/capitán/agente → hablan DIRECTAMENTE al jugador (tú/te).
   - press/fan/social/club → hablan en TERCERA persona sobre {player}. Nunca "tú".
   - Jamás mencionan comida, calorías, proteínas ni "la app". Solo fútbol.
   Variables: {player} {club} {position} {league} {ovr} {season} {goals} {assists}
   Condición opcional `w`: solo aparece cuando tiene sentido (racha, suplente, etc.)
   ============================================================ */
const CAT_W = { press: 3, fan: 3, social: 3, club: 2, coach: 2.5, cap: 2.5, agent: 1.6 };
const COND = {
  good: (c) => c.good, hot: (c) => c.hot, bad: (c) => c.bad,
  starter: (c) => c.starter, benched: (c) => c.benched,
  hasGoals: (c) => c.hasGoals, scorer: (c) => c.scorer,
  seasonStart: (c) => c.seasonStart, seasonEnd: (c) => c.seasonEnd,
};
const FLAVOR = [
  /* ---- PRENSA (tercera persona) ---- */
  { c: "press", t: "El {position} del {club} sigue ganándose el respeto de la categoría a base de trabajo." },
  { c: "press", t: "Fuentes cercanas al {club} aseguran que {player} es de los primeros en llegar y de los últimos en marcharse." },
  { c: "press", t: "La progresión de {player} en {league} no está pasando desapercibida para los ojeadores." },
  { c: "press", t: "Análisis | Con una media de {ovr}, {player} empieza a marcar diferencias en {league}." },
  { c: "press", t: "El cuerpo técnico del {club} destaca en privado la mejora física de {player}.", w: "good" },
  { c: "press", t: "Rumor de mercado: preguntan por {player}, aunque en el {club} no quieren ni oír hablar del tema.", w: "good" },
  { c: "press", t: "Editorial | La paciencia del {club} con {player} está empezando a dar sus frutos." },
  { c: "press", t: "{player} encadena semanas de gran nivel y la prensa local ya habla de un fenómeno en el {club}.", w: "hot" },
  { c: "press", t: "Preocupación en el entorno del {club}: {player} atraviesa días de menos brillo.", w: "bad" },
  { c: "press", t: "Los números de {player} esta temporada ({goals} goles) invitan al optimismo en el {club}.", w: "hasGoals" },
  { c: "press", t: "Crónica | {player} firma otra actuación de nota alta con la camiseta del {club}.", w: "starter" },
  { c: "press", t: "El nombre de {player} empieza a sonar más allá de {league}.", w: "good" },
  { c: "press", t: "Reportaje | De promesa a realidad: el ascenso silencioso de {player} en el {club}." },
  { c: "press", t: "La afición rival ya teme la visita del {club} y, sobre todo, de su {position} {player}.", w: "good" },
  { c: "press", t: "Según los datos, {player} ({ovr}) es uno de los jugadores más en forma de {league}.", w: "good" },
  { c: "press", t: "En los mentideros del fútbol se pregunta hasta dónde puede llegar {player}." },
  { c: "press", t: "Un histórico exjugador del {club} elogió públicamente la actitud de {player}." },
  { c: "press", t: "Temporada {season}: {player} se ha convertido en un fijo de las quinielas de la jornada." },
  { c: "press", t: "Voces autorizadas piden calma con {player}: 'Hay que dejarle crecer sin presión'.", w: "bad" },
  { c: "press", t: "Se ha visto a {player} cenando con varios compañeros del {club} tras el último partido.", w: "starter" },
  { c: "press", t: "Los pronósticos empiezan a contar con {player} como factor decisivo del {club}.", w: "good" },
  { c: "press", t: "Arranca la temporada {season} y {player} figura entre los nombres a seguir en {league}.", w: "seasonStart" },
  { c: "press", t: "Balance de curso: {player} deja huella en {league} con {goals} goles y {assists} asistencias.", w: "seasonEnd" },
  /* ---- AFICIÓN (tercera persona) ---- */
  { c: "fan", t: "Parte de la grada del {club} cree que {player} merece galones cuanto antes." },
  { c: "fan", t: "En las peñas del {club} ya hay quien lleva el dorsal de {player} a la espalda." },
  { c: "fan", t: "Los aficionados del {club} se rinden al esfuerzo de su joven {position}.", w: "good" },
  { c: "fan", t: "Debate en la grada: '¿Es {player} el mejor {position} que ha pasado por el {club}?'", w: "hot" },
  { c: "fan", t: "Un sector de la afición del {club} pide más protagonismo para {player}.", w: "benched" },
  { c: "fan", t: "Cánticos para {player} en el último partido del {club}.", w: "starter" },
  { c: "fan", t: "Los más veteranos del {club} comparan a {player} con jugadores de otra época.", w: "good" },
  { c: "fan", t: "La afición del {club} respira tranquila: {player} vuelve a estar enchufado.", w: "good" },
  { c: "fan", t: "Murmullos en la grada del {club} tras el bajón de {player} en las últimas semanas.", w: "bad" },
  { c: "fan", t: "En los foros del {club} no se habla de otra cosa que de {player}.", w: "hot" },
  { c: "fan", t: "Aficionados del {club} madrugaron para ver entrenar a {player}." },
  { c: "fan", t: "La grada del {club} corea el nombre de {player} cada vez que toca el balón.", w: "scorer" },
  { c: "fan", t: "Niños del barrio esperan a {player} a la salida del entrenamiento para un autógrafo." },
  { c: "fan", t: "La afición confía en que {player} lidere al {club} hacia lo más alto de {league}." },
  { c: "fan", t: "En el bar de siempre, la peña del {club} brinda por {player}.", w: "good" },
  /* ---- REDES SOCIALES (tercera persona) ---- */
  { c: "social", t: "🔥 El clip de la última jugada de {player} arrasa en redes." },
  { c: "social", t: "Trending | El nombre de {player} se cuela entre lo más comentado del día." },
  { c: "social", t: "Una cuenta de estadísticas destaca a {player} como revelación de {league}.", w: "good" },
  { c: "social", t: "El {club} publica una foto de {player} entrenando y se llena de comentarios." },
  { c: "social", t: "Un vídeo de {player} preparándose en la ciudad deportiva suma miles de reproducciones.", w: "good" },
  { c: "social", t: "Los memes sobre la última actuación de {player} inundan el timeline.", w: "scorer" },
  { c: "social", t: "Aficionados piden en redes que {player} sea titular indiscutible.", w: "benched" },
  { c: "social", t: "'Acordaos del nombre: {player}', escribe un periodista en redes.", w: "good" },
  { c: "social", t: "Una vieja foto de {player} de sus inicios se vuelve viral." },
  { c: "social", t: "El hashtag con el apellido de {player} empieza a moverse en el mundillo de {league}.", w: "hot" },
  { c: "social", t: "Comentaristas debaten en directo el momento de forma de {player}." },
  { c: "social", t: "La cuenta oficial del {club} dedica una historia a {player}.", w: "starter" },
  { c: "social", t: "Un tuit pregunta cuánto valdría {player} en el mercado actual.", w: "good" },
  { c: "social", t: "Se filtra un vídeo del golazo de {player} en el entrenamiento.", w: "good" },
  /* ---- NOTICIAS DEL CLUB (tercera persona / oficial) ---- */
  { c: "club", t: "El {club} programa un acto con patrocinadores y {player} será uno de los rostros elegidos." },
  { c: "club", t: "El {club} renueva su tienda con una zona dedicada a sus jóvenes valores." },
  { c: "club", t: "El {club} confirma que {player} entrena con total normalidad de cara al próximo partido." },
  { c: "club", t: "El {club} agradece a su afición el apoyo en {league} esta temporada {season}." },
  { c: "club", t: "El {club} anuncia mejoras en la ciudad deportiva para reforzar la preparación del plantel." },
  { c: "club", t: "El {club} destaca en su web la evolución de {player} desde su llegada." },
  { c: "club", t: "El {club} organiza un día de puertas abiertas y {player} firmará autógrafos." },
  { c: "club", t: "El {club} recuerda que las entradas para el próximo partido vuelan." },
  { c: "club", t: "El {club} publica la lista de convocados y {player} vuelve a aparecer.", w: "starter" },
  { c: "club", t: "El {club} celebra estar peleando por sus objetivos en {league}." },
  /* ---- ENTRENADOR (directo: tú/te) ---- */
  { c: "coach", t: "Hoy te he visto especialmente enchufado en el entrenamiento. Sigue por ahí.", w: "good" },
  { c: "coach", t: "Quiero que lideres al equipo desde el ejemplo. Confío en ti.", w: "good" },
  { c: "coach", t: "Te he preparado un par de ejercicios extra. Sé que puedes con ellos." },
  { c: "coach", t: "Mañana trabajamos táctica. Quiero verte concentrado." },
  { c: "coach", t: "Estos días te noto algo espeso. Nada que no arregle una buena semana de trabajo.", w: "bad" },
  { c: "coach", t: "Me gusta tu actitud. Ojalá todos entrenaran con tu hambre.", w: "good" },
  { c: "coach", t: "Ven diez minutos antes mañana, quiero comentarte una idea para tu puesto de {position}." },
  { c: "coach", t: "El míster rival me ha preguntado por ti. Le he dicho que no estás en venta.", w: "good" },
  { c: "coach", t: "Sigue así y no voy a tener más remedio que ponerte fijo en el once.", w: "good" },
  { c: "coach", t: "Necesito tu mejor versión para el próximo partido. Cuento contigo." },
  { c: "coach", t: "Hoy descansa la cabeza. Mañana volvemos a la carga con todo." },
  { c: "coach", t: "He hablado de ti con la dirección deportiva. Están contentos con tu evolución.", w: "good" },
  { c: "coach", t: "No te confíes con los elogios. El que se relaja, pierde el sitio." },
  { c: "coach", t: "Bienvenido al grupo de los que se ganan los minutos. Ahora mantenlo.", w: "good" },
  /* ---- CAPITÁN (directo: tú/te) ---- */
  { c: "cap", t: "Mañana llegamos antes al estadio, te guardo sitio en el bus." },
  { c: "cap", t: "Te he visto currar de lo lindo esta semana, crack. Así se hace.", w: "good" },
  { c: "cap", t: "Si necesitas que te eche una mano con algo del vestuario, aquí estoy." },
  { c: "cap", t: "Después del entreno nos quedamos unos cuantos a tirar a puerta, ¿te vienes?" },
  { c: "cap", t: "El grupo está encantado contigo. Sigue siendo tú mismo.", w: "good" },
  { c: "cap", t: "Tranquilo con los malos días, a todos nos pasa. Mañana lo damos todo.", w: "bad" },
  { c: "cap", t: "Hoy invito yo al café del vestuario. Te lo has ganado.", w: "good" },
  { c: "cap", t: "Cuando quieras te cuento los trucos de este campo, que me lo conozco de memoria." },
  { c: "cap", t: "En el vestuario ya dicen que vas a ser importante. No les quites la razón.", w: "good" },
  { c: "cap", t: "Oye, gran detalle el de hoy en el entrenamiento. Se nota tu momento.", w: "good" },
  { c: "cap", t: "Mañana toca foto de equipo, no llegues tarde." },
  { c: "cap", t: "Me han preguntado por ti fuera. Les he dicho que eres de los nuestros.", w: "good" },
  { c: "cap", t: "Vamos a apretar juntos esta semana, que viene partido importante." },
  { c: "cap", t: "Si te ves con dudas, hablamos. El vestuario tira de ti.", w: "bad" },
  /* ---- AGENTE (directo: tú/te) ---- */
  { c: "agent", t: "He recibido una llamada interesante por ti. Nada firme aún, pero buena señal.", w: "good" },
  { c: "agent", t: "Sigo tu evolución de cerca. Si mantienes este nivel, se abrirán puertas.", w: "good" },
  { c: "agent", t: "Una marca deportiva ha preguntado por ti. Te mantengo informado.", w: "good" },
  { c: "agent", t: "Tranquilo, aún es pronto, pero el mercado empieza a fijarse en ti." },
  { c: "agent", t: "He estado revisando tus números de la temporada {season}. Vamos por buen camino." },
  { c: "agent", t: "Me piden referencias tuyas desde clubes de {league}. Eso es que lo estás haciendo bien.", w: "good" },
  { c: "agent", t: "Cuida los detalles: cuando llegue la oferta buena, quiero que llegues fino." },
  { c: "agent", t: "Nada nuevo por ahora, pero no dejo de mover tu nombre. Confía en mí." },
  { c: "agent", t: "Un ojeador me ha pedido tu agenda de partidos. Algo se cuece.", w: "good" },
  { c: "agent", t: "Con una media de {ovr}, empiezas a estar en el radar de gente importante.", w: "good" },
];

const fillTpl = (str, c) => str.replace(/\{(\w+)\}/g, (_, k) => (c[k] != null ? String(c[k]) : ""));

function flavorCtx(g) {
  const p = g.player, s = g.season;
  const ovr = calcOVR(p.stats);
  const hist = g.matchHistory || [];
  const last = hist[hist.length - 1];
  const played = s ? hist.slice(-Math.max(0, s.matchday)) : [];
  const goals = played.reduce((a, x) => a + (x.myGoals || 0), 0);
  const assists = played.reduce((a, x) => a + (x.myAssists || 0), 0);
  const form = p.form || "est";
  const c = { player: p.name, club: g.club.name, position: p.position,
    league: g.tier.league, ovr, season: s ? s.num : 1, goals, assists };
  c.good = (p.streak || 0) >= 3 || form === "alza";
  c.hot = (p.streak || 0) >= 6;
  c.bad = form === "caida" || (p.badDays || 0) >= 1;
  c.starter = last ? !last.benched : false;
  c.benched = last ? !!last.benched : false;
  c.hasGoals = goals >= 1;
  c.scorer = goals >= 3;
  c.seasonStart = s ? s.matchday === 0 : true;
  c.seasonEnd = s ? s.matchday >= SEASON_LENGTH : false;
  return c;
}

function senderFor(cat, g) {
  if (cat === "coach") return "Entrenador";
  if (cat === "cap") return (g.captain || "El capitán") + " · Capitán";
  if (cat === "agent") return "Tu agente";
  if (cat === "press") return pick(PRESS);
  if (cat === "fan") return "📣 La Grada";
  if (cat === "social") return pick(["📱 Redes", "🐦 Timeline", "📲 Peña digital"]);
  if (cat === "club") return "📢 " + g.club.name;
  return pick(PRESS);
}

/* elige n frases distintas y ponderadas que tengan sentido hoy */
function pickFlavor(g, n) {
  const c = flavorCtx(g);
  const pool = FLAVOR.filter((f) => !f.w || (COND[f.w] && COND[f.w](c)));
  const out = [];
  const used = new Set();
  let guard = 0;
  while (out.length < n && used.size < pool.length && guard < 80) {
    guard++;
    let total = 0;
    for (let i = 0; i < pool.length; i++) if (!used.has(i)) total += (CAT_W[pool[i].c] || 1);
    if (total <= 0) break;
    let r = Math.random() * total, idx = -1;
    for (let i = 0; i < pool.length; i++) {
      if (used.has(i)) continue;
      r -= (CAT_W[pool[i].c] || 1);
      if (r <= 0) { idx = i; break; }
    }
    if (idx < 0) break;
    used.add(idx);
    const f = pool[idx];
    out.push({ from: senderFor(f.c, g), text: fillTpl(f.t, c) });
  }
  return out;
}

const INTRO = [
  "Hay estadios que rugen con cien mil gargantas. El tuyo, de momento, es un gimnasio a media luz y una cocina donde se libran las batallas de verdad.",
  "No naciste con el físico de los elegidos. Naciste con algo mejor: hambre. Hambre de kilos, de fuerza, de minutos, de demostrar que el talento se fabrica a base de constancia.",
  "Cada comida es un entrenamiento. Cada serie en el gym, un partido. Cada noche de buen descanso, una pretemporada. Tu cuerpo es tu carrera — y hoy empieza.",
  "Tres clubes humildes han oído hablar de ti. Ninguno es glamuroso. Todos son una puerta.",
  "De los campos de tierra a la élite de Europa. Escribe tu historia.",
];

/* ============================================================ COMPONENTES */

function FormBadge({ form, size }) {
  const m = FORM_META[form] || FORM_META.est;
  return (
    <span style={{ color: m.color, fontFamily: "'Oswald',sans-serif", fontSize: size || 12, letterSpacing: 1 }}>
      {m.icon} {m.label}
    </span>
  );
}

const CREST_SIZES = [["Pequeño", 0.8], ["Normal", 1], ["Grande", 1.25]];

function Crest({ c1, c2, name, size = 40, img, imgScale = 1 }) {
  /* el escudo subido se escala sobre su hueco sin mover el layout: el contenedor
     mantiene el tamaño base y la imagen crece/mengua dentro */
  if (img) return (
    <div style={{ width: size, height: size * 1.15, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <img src={img} alt="" style={{ width: size * imgScale, height: size * 1.15 * imgScale,
        objectFit: "contain", background: "transparent" }} />
    </div>
  );
  const initials = name.split(" ").filter((w) => w.length > 2 || /^[A-Z]/.test(w)).slice(0, 2).map((w) => w[0]).join("");
  return (
    <div style={{ width: size, height: size * 1.15, background: `linear-gradient(135deg, ${c1} 50%, ${c2} 50%)`,
      clipPath: "polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%)", display: "flex", alignItems: "center", justifyContent: "center",
      border: "1px solid rgba(255,255,255,.25)" }}>
      <span style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: size * 0.34,
        color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,.8)" }}>{initials}</span>
    </div>
  );
}

function PlayerCard({ player, photo, club, small, crest, crestScale }) {
  const ovr = calcOVR(player.stats);
  const tier = cardTier(ovr);
  const grad = {
    bronze: "linear-gradient(160deg,#8a5a2b,#5c3a1a 55%,#7a4d24)",
    silver: "linear-gradient(160deg,#cfd6de,#8b95a3 55%,#b9c2cd)",
    gold: "linear-gradient(160deg,#f5d97a,#b8892e 55%,#e8c15a)",
    special: "linear-gradient(160deg,#2b2140,#6b2fb3 45%,#e8c15a 110%)",
  }[tier];
  const dark = tier === "special";
  const ink = dark ? "#F5E9C8" : "#2b1d07";
  const W = small ? 190 : 250;
  return (
    <div className="fut-card" style={{ width: W, height: W * 1.42, background: grad, color: ink }}>
      <div className="fut-shine" />
      <div style={{ display: "flex", padding: "14px 14px 0", gap: 6 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: W * 0.19, lineHeight: 1 }}>{ovr}</div>
          <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: W * 0.07, letterSpacing: 2 }}>{player.position}</div>
          <div style={{ marginTop: 6, display: "flex", justifyContent: "center" }}>
            {club ? <Crest c1={club.c1} c2={club.c2} name={club.name} size={W * 0.13} img={crest} imgScale={crestScale} /> : null}
          </div>
          <div style={{ fontSize: W * 0.075, marginTop: 4 }}>🇪🇸</div>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          {photo ? (
            <img src={photo} alt="" style={{ width: W * 0.55, height: W * 0.6, objectFit: "contain", objectPosition: "bottom",
              borderRadius: 4 }} />
          ) : (
            <div style={{ width: W * 0.55, height: W * 0.6, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: W * 0.3, opacity: 0.5 }}>👤</div>
          )}
        </div>
      </div>
      <div style={{ textAlign: "center", fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: W * 0.09,
        letterSpacing: 1.5, textTransform: "uppercase", borderTop: `1px solid ${ink}44`, borderBottom: `1px solid ${ink}44`,
        margin: "6px 14px 4px", padding: "3px 0" }}>{player.name}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", padding: "0 20px", rowGap: 2 }}>
        {STAT_KEYS.map((k) => (
          <div key={k} style={{ display: "flex", gap: 6, justifyContent: "center", fontFamily: "'Oswald',sans-serif" }}>
            <span style={{ fontWeight: 700, fontSize: W * 0.068, width: W * 0.1, textAlign: "right" }}>{player.stats[k]}</span>
            <span style={{ fontSize: W * 0.062, letterSpacing: 1, opacity: 0.85, width: W * 0.13 }}>{k}</span>
          </div>
        ))}
      </div>
      <div style={{ textAlign: "center", marginTop: 4 }}>
        <FormBadge form={player.form || "est"} size={W * 0.055} />
      </div>
    </div>
  );
}

/* ---------- INTRO ÉPICA ---------- */
function IntroScreen({ onDone, onRestore }) {
  const [showR, setShowR] = useState(false);
  const [txt, setTxt] = useState("");
  return (
    <div className="screen intro-bg" style={{ padding: "48px 26px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: 13, letterSpacing: 6, color: "#C9A94E", marginBottom: 18 }}
        className="fade-seq" >FUTABITA 3.1 · TEMPORADA 2026/27</div>
      <h1 style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: 44, lineHeight: 1.02, margin: "0 0 26px",
        color: "#F5EFDF", textTransform: "uppercase" }} className="fade-seq">
        Tu carrera<br />empieza<br /><span style={{ color: "#E8C15A" }}>hoy</span>
      </h1>
      {INTRO.map((p, i) => (
        <p key={i} className="fade-seq" style={{ animationDelay: 0.5 + i * 0.85 + "s", color: "#B9C2CD",
          fontSize: 14.5, lineHeight: 1.55, margin: "0 0 14px", maxWidth: 340 }}>{p}</p>
      ))}
      <button className="btn-gold fade-seq" style={{ animationDelay: 0.5 + INTRO.length * 0.85 + "s", marginTop: 14 }}
        onClick={onDone}>EMPIEZA TU HISTORIA</button>
      <button className="linky fade-seq" style={{ animationDelay: 0.7 + INTRO.length * 0.85 + "s", textAlign: "center" }}
        onClick={() => setShowR(!showR)}>¿Ya tenías una partida? Restaurar respaldo</button>
      {showR && (
        <div className="pop-in" style={{ marginTop: 10 }}>
          <textarea className="inp" rows={4} placeholder="Pega aquí el texto de tu copia de seguridad"
            value={txt} onChange={(e) => setTxt(e.target.value)} />
          <button className="btn-ghost" style={{ width: "100%" }} onClick={() => onRestore(txt)}>Restaurar mi carrera</button>
        </div>
      )}
    </div>
  );
}

/* ---------- ONBOARDING ---------- */
const DOW = [{ v: 1, l: "L" }, { v: 2, l: "M" }, { v: 3, l: "X" }, { v: 4, l: "J" }, { v: 5, l: "V" }, { v: 6, l: "S" }, { v: 0, l: "D" }];

function Onboarding({ onDone, onPhoto }) {
  const [f, setF] = useState({ name: "", position: "DEL", weight: "", kcal: "2800", protein: "140", sleepGoal: "7.5",
    gymDays: [1, 3, 5], habits: ["Leer 20 min"], newHabit: "" });
  const [photoPrev, setPhotoPrev] = useState(null);
  const fileRef = useRef();
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const toggleDay = (d) => set("gymDays", f.gymDays.includes(d) ? f.gymDays.filter((x) => x !== d) : [...f.gymDays, d]);
  const handleFile = (e) => {
    const file = e.target.files && e.target.files[0]; if (!file) return;
    const img = new Image();
    img.onload = () => {
      const cv = document.createElement("canvas"); const s = Math.min(1, 420 / img.width);
      cv.width = img.width * s; cv.height = img.height * s;
      cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
      const isPng = (file.type || "").includes("png");
      const url = isPng ? cv.toDataURL("image/png") : cv.toDataURL("image/jpeg", 0.82);
      setPhotoPrev(url); onPhoto(url);
    };
    const r = new FileReader(); r.onload = () => (img.src = r.result); r.readAsDataURL(file);
  };
  const ok = f.name.trim().length >= 2 && +f.weight > 30 && +f.kcal > 1000 && +f.protein > 40 && f.gymDays.length > 0;
  return (
    <div className="screen" style={{ padding: "34px 22px 60px" }}>
      <div className="eyebrow">FICHA DEL JUGADOR</div>
      <h2 className="h2">Crea tu perfil</h2>
      <label className="lbl">Nombre en la camiseta</label>
      <input className="inp" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Tu apellido o apodo" />
      <label className="lbl">Posición</label>
      <div className="chips">{POSITIONS.map((p) => (
        <button key={p} className={"chip" + (f.position === p ? " on" : "")} onClick={() => set("position", p)}>{p}</button>))}
      </div>
      <label className="lbl">Peso actual (kg) — tu punto de partida</label>
      <input className="inp" type="number" value={f.weight} onChange={(e) => set("weight", e.target.value)} placeholder="ej. 62" />
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <label className="lbl">Meta kcal/día</label>
          <input className="inp" type="number" value={f.kcal} onChange={(e) => set("kcal", e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <label className="lbl">Meta proteína (g)</label>
          <input className="inp" type="number" value={f.protein} onChange={(e) => set("protein", e.target.value)} />
        </div>
      </div>
      <label className="lbl">Días de gym</label>
      <div className="chips">{DOW.map((d) => (
        <button key={d.v} className={"chip" + (f.gymDays.includes(d.v) ? " on" : "")} onClick={() => toggleDay(d.v)}>{d.l}</button>))}
      </div>
      <label className="lbl">Horas de sueño objetivo</label>
      <input className="inp" type="number" step="0.5" value={f.sleepGoal} onChange={(e) => set("sleepGoal", e.target.value)} />
      <label className="lbl">Hábitos extra (suben MEN)</label>
      {f.habits.map((h, i) => (
        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
          <div className="inp" style={{ flex: 1, display: "flex", alignItems: "center" }}>{h}</div>
          <button className="btn-ghost" onClick={() => set("habits", f.habits.filter((_, j) => j !== i))}>✕</button>
        </div>))}
      <div style={{ display: "flex", gap: 8 }}>
        <input className="inp" style={{ flex: 1 }} value={f.newHabit} placeholder="ej. Meditar, estirar…"
          onChange={(e) => set("newHabit", e.target.value)} />
        <button className="btn-ghost" onClick={() => { if (f.newHabit.trim()) { set("habits", [...f.habits, f.newHabit.trim()]); set("newHabit", ""); } }}>Añadir</button>
      </div>
      <label className="lbl" style={{ marginTop: 14 }}>Foto para tu carta (opcional, puedes subirla luego)</label>
      <label className="btn-ghost filebtn">
        {photoPrev ? "✓ Foto cargada — cambiar" : "📷 Subir foto"}
        <input type="file" accept="image/*" className="fileinp" onChange={handleFile} />
      </label>
      {photoPrev && <img src={photoPrev} alt="" style={{ width: 90, borderRadius: 8, marginTop: 8 }} />}
      <button className="btn-gold" style={{ marginTop: 26, opacity: ok ? 1 : 0.4 }} disabled={!ok}
        onClick={() => onDone({ name: f.name.trim().toUpperCase(), position: f.position, weight: +f.weight,
          goals: { kcal: +f.kcal, protein: +f.protein, sleepGoal: +f.sleepGoal, gymDays: f.gymDays, habits: f.habits } })}>
        CONTINUAR → EL MERCADO TE ESPERA
      </button>
    </div>
  );
}

/* ---------- ELECCIÓN INICIAL: 3 OFERTAS ---------- */
function ChoiceScreen({ offers, playerName, onSign }) {
  return (
    <div className="screen" style={{ padding: "34px 20px 60px" }}>
      <div className="eyebrow">MERCADO DE FICHAJES · VENTANA ABIERTA</div>
      <h2 className="h2">Tres puertas, un destino</h2>
      <div className="bubble agent" style={{ marginBottom: 18 }}>
        <div className="bfrom">Tu agente</div>
        {playerName}, buenas noticias. Tres clubes regionales han preguntado por ti. Ninguno te hará rico… todavía.
        Pero uno de ellos será el primer capítulo de tu historia. Elige con el corazón. ⚽
      </div>
      {offers.map((o, i) => (
        <div key={i} className="offer-card" style={{ borderColor: o.club.c1 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Crest c1={o.club.c1} c2={o.club.c2} name={o.club.name} size={46} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: 17, letterSpacing: 0.5 }}>{o.club.name}</div>
              <div style={{ fontSize: 11.5, color: "#8b95a3" }}>{o.club.city} · Tercera Federación</div>
            </div>
          </div>
          <p style={{ fontSize: 13, color: "#B9C2CD", margin: "10px 0 12px", lineHeight: 1.45 }}>{o.pitch}</p>
          <button className="btn-gold sm" onClick={() => onSign(o.club)}>✍️ FIRMAR CON {o.club.name.toUpperCase()}</button>
        </div>
      ))}
    </div>
  );
}

/* ---------- ANIMACIÓN DE FICHAJE ---------- */
function SigningOverlay({ club, player, photo, crest, crestScale, onDone }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 900);
    const t2 = setTimeout(() => setStep(2), 2100);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  return (
    <div className="overlay" style={{ background: step >= 1 ? `radial-gradient(circle at 50% 30%, ${club.c1}55, #05070d 70%)` : "#05070d" }}>
      {step === 0 && <div className="official-flash">OFICIAL</div>}
      {step >= 1 && (
        <div style={{ textAlign: "center" }} className="pop-in">
          <div style={{ fontFamily: "'Oswald',sans-serif", letterSpacing: 5, fontSize: 12, color: "#C9A94E" }}>FICHAJE CONFIRMADO</div>
          <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: 34, color: "#F5EFDF", margin: "6px 0 16px", textTransform: "uppercase" }}>
            {club.name}</div>
          <div style={{ display: "flex", justifyContent: "center" }} className={step >= 2 ? "card-drop" : ""}
            children={step >= 2 ? <PlayerCard player={player} photo={photo} club={club} crest={crest} crestScale={crestScale} />
              : <Crest c1={club.c1} c2={club.c2} name={club.name} size={80} img={crest} imgScale={crestScale} />} />
          {step >= 2 && (
            <button className="btn-gold" style={{ marginTop: 26 }} onClick={onDone}>COMENZAR LA AVENTURA</button>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- SIMULACIÓN DE PARTIDO EN VIVO ---------- */
function MatchModal({ match, club, onFinish, crest, crestScale }) {
  const [minute, setMinute] = useState(0);
  const [shown, setShown] = useState([]);
  const [ended, setEnded] = useState(false);
  useEffect(() => {
    const int = setInterval(() => {
      setMinute((m) => {
        const nm = m + 3;
        if (nm >= 92) { clearInterval(int); setEnded(true); return 90; }
        return nm;
      });
    }, 220);
    return () => clearInterval(int);
  }, []);
  useEffect(() => { setShown(match.events.filter((e) => e.min <= minute)); }, [minute, match]);
  const gf = shown.filter((e) => e.good && e.text.includes("⚽")).length;
  const ga = shown.filter((e) => !e.good && e.text.includes("🥅")).length;
  return (
    <div className="overlay" style={{ background: "radial-gradient(ellipse at 50% 0%, #0E3320, #05070d 75%)", justifyContent: "flex-start", paddingTop: 60 }}>
      <div className="eyebrow" style={{ textAlign: "center" }}>JORNADA {match.jornada} · EN VIVO</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, margin: "14px 0" }}>
        <Crest c1={club.c1} c2={club.c2} name={club.name} size={44} img={crest} imgScale={crestScale} />
        <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: 44, color: "#F5EFDF" }}>
          {ended ? match.gf : gf} - {ended ? match.ga : ga}</div>
        <div style={{ width: 44, textAlign: "center", fontSize: 11, color: "#8b95a3" }}>{match.rival}</div>
      </div>
      <div style={{ fontFamily: "'Oswald',sans-serif", color: "#3DDC84", textAlign: "center", fontSize: 18 }}>
        {ended ? "FINAL" : minute + "'"}</div>
      <div style={{ maxWidth: 340, margin: "18px auto 0", width: "100%", flex: 1, overflowY: "auto" }}>
        {shown.map((e, i) => (
          <div key={i} className="event-in" style={{ padding: "8px 12px", marginBottom: 6, borderLeft: `3px solid ${e.good ? "#3DDC84" : "#E14B4B"}`,
            background: "rgba(255,255,255,.04)", fontSize: 13.5, color: "#DDE3EA" }}>
            <b style={{ fontFamily: "'Oswald',sans-serif", marginRight: 8 }}>{e.min}'</b>{e.text}
          </div>))}
        {shown.length === 0 && <div style={{ textAlign: "center", color: "#5b6470", fontSize: 13, marginTop: 30 }}>El balón ya rueda…</div>}
      </div>
      {ended && (
        <div className="pop-in" style={{ textAlign: "center", padding: "14px 0 40px" }}>
          <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: 22, color: match.res === "V" ? "#3DDC84" : match.res === "E" ? "#C9A94E" : "#E14B4B" }}>
            {match.res === "V" ? "¡VICTORIA!" : match.res === "E" ? "EMPATE" : "DERROTA"}</div>
          {match.rating != null
            ? <div style={{ color: "#B9C2CD", fontSize: 14, margin: "6px 0 14px" }}>Tu nota: <b style={{ color: "#E8C15A", fontSize: 18 }}>{match.rating}</b>
                {match.myGoals ? ` · ${match.myGoals}⚽` : ""}{match.myAssists ? ` · ${match.myAssists}🅰️` : ""}</div>
            : <div style={{ color: "#8b95a3", fontSize: 13, margin: "6px 0 14px" }}>No jugaste: el míster te dejó fuera por tu mala forma.</div>}
          <button className="btn-gold" onClick={onFinish}>CONTINUAR</button>
        </div>
      )}
    </div>
  );
}

/* ---------- CHAT / BUZÓN ---------- */
function ChatTab({ messages, onOfferAction }) {
  const endRef = useRef();
  useEffect(() => { if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  return (
    <div style={{ padding: "16px 14px 90px" }}>
      <div className="eyebrow">MENSAJES</div>
      {messages.length === 0 && <div style={{ color: "#5b6470", fontSize: 13, marginTop: 20 }}>Aún no hay mensajes. Juega partidos y progresa: el vestuario hablará de ti.</div>}
      {messages.map((m) => (
        <div key={m.id} style={{ marginBottom: 14 }}>
          <div className={"bubble " + (m.kind === "offer" ? "offer" : m.from === "Entrenador" ? "coach" : m.from.includes("Capitán") ? "cap" : m.from === "Tu agente" ? "agent" : "press")}>
            <div className="bfrom">{m.from} <span style={{ float: "right", opacity: 0.5, fontWeight: 400 }}>{m.time}</span></div>
            {m.kind === "offer" && m.offer && (
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                <Crest c1={m.offer.club.c1} c2={m.offer.club.c2} name={m.offer.club.name} size={36} />
                <div>
                  <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: 15 }}>{m.offer.club.name} {m.offer.club.country || ""}</div>
                  <div style={{ fontSize: 11, color: "#8b95a3" }}>{m.offer.league} · Ficha: {fmtEUR(m.offer.salary)}/año</div>
                </div>
              </div>)}
            <div style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>
            {m.kind === "offer" && m.status === "pending" && (
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button className="btn-gold sm" style={{ flex: 1 }} onClick={() => onOfferAction(m.id, true)}>ACEPTAR ✍️</button>
                <button className="btn-ghost sm" style={{ flex: 1 }} onClick={() => onOfferAction(m.id, false)}>Rechazar</button>
              </div>)}
            {m.kind === "offer" && m.status === "accepted" && <div style={{ marginTop: 8, color: "#3DDC84", fontSize: 12 }}>✓ Oferta aceptada</div>}
            {m.kind === "offer" && m.status === "rejected" && <div style={{ marginTop: 8, color: "#8b95a3", fontSize: 12 }}>✕ Oferta rechazada — lealtad al club</div>}
          </div>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}

/* ---------- REGISTRO DIARIO ---------- */
/* Calendario mensual: verde=al alza/buen ritmo, amarillo=estancado, rojo=caída, gris=sin datos */
function MonthCal({ game, logDate, onPick }) {
  const today = todayStr(), yesterday = addDays(today, -1);
  const [y, m] = today.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const startDow = (first.getDay() + 6) % 7; /* lunes=0 */
  const nDays = new Date(y, m, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= nDays; d++) cells.push(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  const colorOf = (ds) => {
    const l = game.logs[ds];
    if (!l) return "transparent";
    if (!l.closed) return ds <= today ? "rgba(232,193,90,.25)" : "transparent";
    return l.form === "alza" || l.form === "buen" ? "rgba(61,220,132,.4)" : l.form === "est" ? "rgba(232,193,90,.4)" : "rgba(255,90,90,.4)";
  };
  return (
    <div className="panel" style={{ marginTop: 10 }}>
      <div className="ptitle">📅 {["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"][m - 1]} {y}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, fontSize: 10, color: "#5b6470", textAlign: "center", marginBottom: 4 }}>
        {["L","M","X","J","V","S","D"].map((d, i) => <div key={i}>{d}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
        {cells.map((ds, i) => ds === null ? <div key={i} /> : (
          <div key={i} onClick={() => onPick(ds)} style={{
            aspectRatio: "1", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontFamily: "'Oswald',sans-serif", background: colorOf(ds),
            color: ds > today ? "#3a424e" : "#DDE3EA",
            border: ds === logDate ? "1.5px solid #E8C15A" : ds === today ? "1px solid rgba(255,255,255,.25)" : "1px solid transparent",
            cursor: (ds === today || (ds === yesterday && game.logs[yesterday] && !game.logs[yesterday].closed)) ? "pointer" : "default",
            opacity: ds > today ? 0.4 : 1 }}>
            {+ds.slice(8)}
          </div>))}
      </div>
      <div style={{ fontSize: 10.5, color: "#5b6470", marginTop: 8, lineHeight: 1.6 }}>
        🟢 Buen día · 🟡 Estancado · 🔴 En caída · Solo hoy y ayer (si está abierto) son editables
      </div>
    </div>);
}

function LogTab({ game, log, onLog, logDate, onDate, onCloseDay, savedMeals, onSaveMeal }) {
  const [meal, setMeal] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [manual, setManual] = useState(false);
  const [showCal, setShowCal] = useState(false);
  const [mk, setMk] = useState(""); const [mp, setMp] = useState(""); const [mn, setMn] = useState("");
  const g = game.player.goals;
  const today = todayStr(), yesterday = addDays(today, -1);
  const yLog = game.logs[yesterday];
  const yPending = yLog && !yLog.closed;
  const isToday = logDate === today;
  const addAI = async () => {
    if (!meal.trim() || loading) return;
    setLoading(true); setErr(null);
    try {
      const r = await estimateNutrition(meal.trim());
      onLog({ ...log, meals: [...log.meals, r], kcal: log.kcal + r.kcal, prot: log.prot + r.prot });
      setMeal("");
    } catch (e) {
      if (e.message === "no-ia") { setErr("La estimación por IA no está activada. Usa 'Entrada manual' para apuntar kcal y proteína."); setManual(true); }
      else setErr("No pude estimar esa comida. Prueba a describirla mejor o usa entrada manual.");
    }
    setLoading(false);
  };
  const addManual = () => {
    if (!mn.trim() || !+mk) return;
    const r = { name: mn.trim(), kcal: Math.round(+mk), prot: Math.round(+mp || 0) };
    onLog({ ...log, meals: [...log.meals, r], kcal: log.kcal + r.kcal, prot: log.prot + r.prot });
    setMn(""); setMk(""); setMp(""); setManual(false);
  };
  const addSaved = (m) => onLog({ ...log, meals: [...log.meals, m], kcal: log.kcal + m.kcal, prot: log.prot + m.prot });
  const removeMeal = (i) => { const m = log.meals[i];
    onLog({ ...log, meals: log.meals.filter((_, j) => j !== i), kcal: log.kcal - m.kcal, prot: log.prot - m.prot }); };
  const dow = new Date().getDay();
  const isGymDay = g.gymDays.includes(dow);
  const pct = dayPct(log, game.player, logDate);
  const form = formFromPct(pct);
  const Bar = ({ val, goal, color, label, unit }) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
        <span style={{ color: "#B9C2CD" }}>{label}</span>
        <span style={{ fontFamily: "'Oswald',sans-serif", color: val >= goal ? "#3DDC84" : "#DDE3EA" }}>{Math.round(val)} / {goal} {unit}</span>
      </div>
      <div className="track"><div className="fill" style={{ width: Math.min(100, (val / goal) * 100) + "%", background: color }} /></div>
    </div>);
  return (
    <div style={{ padding: "16px 16px 96px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div className="eyebrow" style={{ flex: 1 }}>{isToday ? "ENTRENAMIENTO DE HOY" : "COMPLETANDO AYER"}</div>
        <button className="chip" onClick={() => setShowCal(!showCal)}>📅</button>
      </div>
      {yPending && isToday && (
        <div className="pendbar" onClick={() => onDate(yesterday)}>
          ⏳ Ayer sigue abierto — toca para completarlo antes de que se cierre
        </div>)}
      {!isToday && (
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button className="btn-ghost sm" style={{ flex: 1 }} onClick={() => onDate(today)}>← Volver a hoy</button>
          <button className="btn-gold sm" style={{ flex: 1 }} onClick={() => { onCloseDay(logDate); onDate(today); }}>✔ Cerrar este día</button>
        </div>)}
      {showCal && <MonthCal game={game} logDate={logDate} onPick={(d) => {
        if (d === today || (d === yesterday && yPending)) { onDate(d); setShowCal(false); }
      }} />}
      <div className="panel" style={{ marginTop: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontFamily: "'Oswald',sans-serif", fontSize: 15 }}>Progreso del día · {pct}%</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 10, color: "#5b6470", textTransform: "uppercase", letterSpacing: .5 }}>proyección</span>
            <FormBadge form={form} />
          </span>
        </div>
        <Bar val={log.kcal} goal={g.kcal} color="#E8C15A" label="Calorías" unit="kcal" />
        <Bar val={log.prot} goal={g.protein} color="#3DDC84" label="Proteína" unit="g" />
      </div>

      <div className="panel">
        <div className="ptitle">🍽️ Añadir comida</div>
        {savedMeals.length > 0 && (
          <div className="chips" style={{ marginBottom: 10 }}>
            {savedMeals.map((m, i) => (
              <button key={i} className="chip" onClick={() => addSaved(m)}>{m.name} · {m.kcal}kcal</button>))}
          </div>)}
        <div style={{ display: "flex", gap: 6 }}>
          <input className="inp" style={{ flex: 1, marginBottom: 0 }} value={meal} placeholder='ej. "2 huevos, arroz y un batido"'
            onChange={(e) => setMeal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addAI()} />
          <button className="btn-gold sm" style={{ minWidth: 56 }} onClick={addAI} disabled={loading}>
            {loading ? "…" : "✨ IA"}</button>
          <button className="btn-ghost sm" style={{ minWidth: 74, whiteSpace: "nowrap",
            ...(manual ? { borderColor: "#E8C15A", color: "#E8C15A" } : {}) }}
            onClick={() => setManual(!manual)}>✏️ Manual</button>
        </div>
        {err && <div style={{ color: "#E14B4B", fontSize: 12, marginTop: 6 }}>{err}</div>}
        {manual && (
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <input className="inp" style={{ flex: 2, marginBottom: 0 }} placeholder="Nombre" value={mn} onChange={(e) => setMn(e.target.value)} />
            <input className="inp" style={{ flex: 1, marginBottom: 0 }} placeholder="kcal" type="number" value={mk} onChange={(e) => setMk(e.target.value)} />
            <input className="inp" style={{ flex: 1, marginBottom: 0 }} placeholder="prot" type="number" value={mp} onChange={(e) => setMp(e.target.value)} />
            <button className="btn-ghost sm" onClick={addManual}>+</button>
          </div>)}
        {log.meals.length > 0 && (
          <div style={{ marginTop: 12 }}>
            {log.meals.map((m, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, padding: "6px 0", borderTop: "1px solid rgba(255,255,255,.06)" }}>
                <span style={{ flex: 1, color: "#DDE3EA" }}>{m.name}</span>
                <span style={{ color: "#8b95a3" }}>{m.kcal} kcal · {m.prot}g</span>
                <button className="linky" style={{ margin: 0 }} onClick={() => onSaveMeal(m)}>💾</button>
                <button className="linky" style={{ margin: 0, color: "#E14B4B" }} onClick={() => removeMeal(i)}>✕</button>
              </div>))}
          </div>)}
      </div>

      <div className="panel">
        <div className="ptitle">🏋️ Gym {isGymDay ? "· hoy toca" : "· día de descanso"}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className={"chip big" + (log.gym ? " on" : "")} onClick={() => onLog({ ...log, gym: !log.gym, gymProgress: log.gym ? false : log.gymProgress })}>
            {log.gym ? "✓ Gym completado" : "Marcar gym hecho"}</button>
          {log.gym && (
            <button className={"chip big" + (log.gymProgress ? " on" : "")} onClick={() => onLog({ ...log, gymProgress: !log.gymProgress })}>
              {log.gymProgress ? "✓ Subí peso/reps 💪" : "¿Progresaste hoy?"}</button>)}
        </div>
      </div>

      <div className="panel">
        <div className="ptitle">😴 Sueño de anoche</div>
        <div className="chips">
          {[5, 6, 6.5, 7, 7.5, 8, 8.5, 9].map((h) => (
            <button key={h} className={"chip" + (log.sleep === h ? " on" : "")} onClick={() => onLog({ ...log, sleep: h })}>{h}h</button>))}
        </div>
      </div>

      {g.habits.length > 0 && (
        <div className="panel">
          <div className="ptitle">🧠 Hábitos de mentalidad</div>
          <div className="chips">
            {g.habits.map((h) => {
              const on = (log.habitsDone || []).includes(h);
              return <button key={h} className={"chip big" + (on ? " on" : "")}
                onClick={() => onLog({ ...log, habitsDone: on ? log.habitsDone.filter((x) => x !== h) : [...(log.habitsDone || []), h] })}>
                {on ? "✓ " : ""}{h}</button>;
            })}
          </div>
        </div>)}
    </div>
  );
}

/* ---------- LIGA ---------- */
function LeagueTab({ game, onPlayMatch, crest, crestScale }) {
  const s = game.season;
  const matchDue = s.matchday < SEASON_LENGTH && dayDiff(s.startDate, todayStr()) >= (s.matchday + 1) * 2 - 1;
  const nextRival = s.rivals[s.matchday % s.rivals.length];
  const table = [...s.table].sort((a, b) => b.pts - a.pts);
  const myPos = table.findIndex((t) => t.me) + 1;
  return (
    <div style={{ padding: "16px 16px 96px" }}>
      <div className="eyebrow">TEMPORADA {s.num} · {game.tier.league}</div>
      <div className="panel" style={{ marginTop: 10, textAlign: "center" }}>
        <div style={{ fontSize: 12, color: "#8b95a3" }}>JORNADA {Math.min(s.matchday + 1, SEASON_LENGTH)} / {SEASON_LENGTH}</div>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, margin: "10px 0" }}>
          <Crest c1={game.club.c1} c2={game.club.c2} name={game.club.name} size={40} img={crest} imgScale={crestScale} />
          <span style={{ fontFamily: "'Oswald',sans-serif", fontSize: 18, color: "#F5EFDF" }}>VS</span>
          <div style={{ width: 60, fontSize: 12, color: "#B9C2CD" }}>{s.matchday < SEASON_LENGTH ? nextRival : "—"}</div>
        </div>
        {s.matchday >= SEASON_LENGTH ? (
          <div style={{ color: "#C9A94E", fontSize: 13 }}>Temporada finalizada. Revisa tus mensajes 📬</div>
        ) : matchDue ? (
          <button className="btn-gold" onClick={onPlayMatch}>⚽ JUGAR PARTIDO</button>
        ) : (
          <div style={{ color: "#8b95a3", fontSize: 13 }}>
            Próximo partido: {addDays(s.startDate, (s.matchday + 1) * 2 - 1)}<br />
            <span style={{ fontSize: 12 }}>Trabaja fuerte esta semana: llegarás al partido con mejor forma.</span></div>
        )}
      </div>
      <div className="panel">
        <div className="ptitle">📊 Clasificación · vas {myPos}º</div>
        {table.map((t, i) => (
          <div key={t.name} style={{ display: "flex", padding: "6px 4px", fontSize: 13, background: t.me ? "rgba(232,193,90,.1)" : "transparent",
            borderRadius: 6, color: t.me ? "#E8C15A" : "#DDE3EA", fontWeight: t.me ? 600 : 400 }}>
            <span style={{ width: 24, color: "#8b95a3" }}>{i + 1}</span>
            <span style={{ flex: 1 }}>{t.name}</span>
            <span style={{ fontFamily: "'Oswald',sans-serif" }}>{t.pts} pts</span>
          </div>))}
      </div>
      {game.matchHistory.length > 0 && (
        <div className="panel">
          <div className="ptitle">📼 Últimos partidos</div>
          {game.matchHistory.slice(-5).reverse().map((m, i) => (
            <div key={i} style={{ display: "flex", gap: 8, fontSize: 12.5, padding: "5px 0", color: "#B9C2CD" }}>
              <span style={{ color: m.res === "V" ? "#3DDC84" : m.res === "E" ? "#C9A94E" : "#E14B4B", fontFamily: "'Oswald',sans-serif", width: 14 }}>{m.res}</span>
              <span style={{ flex: 1 }}>J{m.jornada} vs {m.rival}</span>
              <span>{m.gf}-{m.ga}</span>
              <span style={{ color: "#E8C15A" }}>{m.rating != null ? m.rating : "🪑"}</span>
            </div>))}
        </div>)}
    </div>
  );
}

/* ---------- INICIO ---------- */
function HomeTab({ game, photo, log, crest, crestScale }) {
  const p = game.player;
  const ovr = calcOVR(p.stats);
  const kg0 = p.weight0;
  const kgNow = p.weightLog.length ? p.weightLog[p.weightLog.length - 1].kg : kg0;
  const mv = marketValue(ovr, kgNow - kg0);
  const pct = dayPct(log, p, todayStr());
  return (
    <div style={{ padding: "18px 16px 96px" }}>
      <div style={{ display: "flex", justifyContent: "center", marginTop: 6 }}>
        <PlayerCard player={p} photo={photo} club={game.club} crest={crest} crestScale={crestScale} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 18 }}>
        <div className="stat-box"><div className="sb-num">{fmtEUR(mv)}</div><div className="sb-lbl">Valor de mercado</div></div>
        <div className="stat-box"><div className="sb-num">{kgNow} kg</div><div className="sb-lbl">{kgNow > kg0 ? `+${(kgNow - kg0).toFixed(1)} desde el inicio` : "Peso actual"}</div></div>
        <div className="stat-box"><div className="sb-num">{p.streak || 0}🔥</div><div className="sb-lbl">Racha de días</div></div>
      </div>
      <div className="panel" style={{ marginTop: 14 }}>
        <div className="ptitle">Hoy · {pct}% del día</div>
        <div className="track"><div className="fill" style={{ width: Math.min(100, pct) + "%",
          background: FORM_META[formFromPct(pct)].color }} /></div>
        <div style={{ marginTop: 8, textAlign: "center" }}><FormBadge form={formFromPct(pct)} size={13} /></div>
        <div style={{ fontSize: 11.5, color: "#8b95a3", textAlign: "center", marginTop: 4 }}>
          Al cerrar el día, tu forma decide cuánta XP ganas y si juegas el próximo partido.</div>
      </div>
      <div className="panel">
        <div className="ptitle">Progreso hacia el siguiente punto</div>
        {STAT_KEYS.map((k) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontFamily: "'Oswald',sans-serif", width: 34, fontSize: 13 }}>{k}</span>
            <span style={{ fontFamily: "'Oswald',sans-serif", width: 24, fontSize: 14, color: "#E8C15A" }}>{p.stats[k]}</span>
            <div className="track" style={{ flex: 1 }}>
              <div className="fill" style={{ width: Math.min(100, ((p.xp[k] || 0) / xpToNext(p.stats[k])) * 100) + "%", background: "#3DDC84" }} />
            </div>
            <span style={{ fontSize: 10, color: "#5b6470", width: 56, textAlign: "right" }}>{p.xp[k] || 0}/{xpToNext(p.stats[k])} XP</span>
          </div>))}
      </div>
    </div>
  );
}

/* ---------- COPIA DE SEGURIDAD ---------- */
function BackupPanel({ getBackup, onRestore }) {
  const [show, setShow] = useState(false);
  const [txt, setTxt] = useState("");
  const [copied, setCopied] = useState(false);
  const [manual, setManual] = useState(null);
  const copy = async () => {
    const t = getBackup();
    try { await navigator.clipboard.writeText(t); setCopied(true); setManual(null); setTimeout(() => setCopied(false), 2500); }
    catch (e) { setManual(t); }
  };
  return (
    <div className="panel" style={{ borderColor: "rgba(232,193,90,.3)" }}>
      <div className="ptitle">💾 Copia de seguridad</div>
      <div style={{ fontSize: 12, color: "#8b95a3", marginBottom: 10, lineHeight: 1.5 }}>
        Copia tu partida como texto y guárdala donde quieras (notas, un chat contigo…). Si la app se resetea,
        pégala en "Restaurar" (o en la pantalla inicial) y recuperas todo: stats, temporada, mensajes y foto.
        Hazlo al final de cada día por seguridad.</div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn-gold sm" style={{ flex: 1 }} onClick={copy}>{copied ? "✓ ¡Copiado!" : "Copiar respaldo"}</button>
        <button className="btn-ghost sm" style={{ flex: 1 }} onClick={() => setShow(!show)}>Restaurar</button>
      </div>
      {manual && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 11.5, color: "#C9A94E", marginBottom: 4 }}>Copia manualmente este texto (mantén pulsado → seleccionar todo):</div>
          <textarea className="inp" rows={4} readOnly value={manual} onFocus={(e) => e.target.select()} />
        </div>)}
      {show && (
        <div style={{ marginTop: 8 }}>
          <textarea className="inp" rows={4} placeholder="Pega aquí tu respaldo" value={txt} onChange={(e) => setTxt(e.target.value)} />
          <button className="btn-ghost" style={{ width: "100%" }} onClick={() => onRestore(txt)}>Restaurar partida</button>
        </div>)}
    </div>
  );
}

/* ---------- PERFIL / OBJETIVOS ---------- */
function ProfileTab({ game, photo, onWeight, onPhoto, onRemovePhoto, crest, onCrest, onRemoveCrest,
  crestScale, onCrestScale, onGoals, getBackup, onRestore }) {
  const p = game.player;
  const [kg, setKg] = useState("");
  const [edit, setEdit] = useState(false);
  const [newHabit, setNewHabit] = useState("");
  const [g, setG] = useState({ ...p.goals, gymDays: [...p.goals.gymDays] });
  /* redimensiona una imagen subida y devuelve un dataURL, para foto o escudo.
     forcePng: el escudo se guarda siempre en PNG para conservar la transparencia (el JPEG la rellenaría de blanco) */
  const processImg = (e, cb, max = 420, forcePng = false) => {
    const file = e.target.files && e.target.files[0]; if (!file) return;
    const img = new Image();
    img.onload = () => {
      const cv = document.createElement("canvas"); const s = Math.min(1, max / img.width);
      cv.width = img.width * s; cv.height = img.height * s;
      cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
      const png = forcePng || (file.type || "").includes("png");
      cb(png ? cv.toDataURL("image/png") : cv.toDataURL("image/jpeg", 0.82));
    };
    const r = new FileReader(); r.onload = () => (img.src = r.result); r.readAsDataURL(file);
    e.target.value = "";
  };
  const handleFile = (e) => processImg(e, onPhoto);
  const handleCrest = (e) => processImg(e, onCrest, 240, true);
  const wl = p.weightLog;
  return (
    <div style={{ padding: "16px 16px 96px" }}>
      <div className="eyebrow">MI CARRERA</div>
      <BackupPanel getBackup={getBackup} onRestore={onRestore} />
      <div className="panel" style={{ marginTop: 10 }}>
        <div className="ptitle">⚖️ Pesaje semanal (tu valor de mercado)</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input className="inp" style={{ flex: 1, marginBottom: 0 }} type="number" step="0.1" placeholder={`Peso hoy (inicio: ${p.weight0} kg)`}
            value={kg} onChange={(e) => setKg(e.target.value)} />
          <button className="btn-gold sm" onClick={() => { if (+kg > 30) { onWeight(+kg); setKg(""); } }}>Registrar</button>
        </div>
        {wl.length > 0 && (
          <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 60, marginTop: 12 }}>
            {wl.slice(-10).map((w, i) => {
              const min = Math.min(...wl.map((x) => x.kg)) - 1, max = Math.max(...wl.map((x) => x.kg)) + 1;
              return <div key={i} title={w.kg} style={{ flex: 1, background: "#3DDC84", opacity: 0.5 + 0.5 * (i / 10), borderRadius: 3,
                height: Math.max(8, ((w.kg - min) / (max - min)) * 56) }} />;
            })}
          </div>)}
        {wl.length > 0 && <div style={{ fontSize: 11.5, color: "#8b95a3", marginTop: 6 }}>
          Último: {wl[wl.length - 1].kg} kg ({wl[wl.length - 1].d}) · {(wl[wl.length - 1].kg - p.weight0) >= 0 ? "+" : ""}{(wl[wl.length - 1].kg - p.weight0).toFixed(1)} kg totales</div>}
      </div>
      <div className="panel">
        <div className="ptitle">📷 Foto de la carta</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label className="btn-ghost filebtn">{photo ? "Cambiar foto" : "Subir foto"}
            <input type="file" accept="image/*" className="fileinp" onChange={handleFile} />
          </label>
          {photo && <button className="btn-ghost sm" style={{ color: "#E14B4B" }} onClick={onRemovePhoto}>Quitar foto</button>}
        </div>
        {photo && <img src={photo} alt="" style={{ width: 70, borderRadius: 8, marginTop: 10 }} />}
      </div>
      <div className="panel">
        <div className="ptitle">🛡️ Escudo del club</div>
        <div style={{ fontSize: 12, color: "#8b95a3", marginBottom: 10, lineHeight: 1.5 }}>
          Sube el escudo real del {game.club.name} para verlo en tu carta, en la cabecera y en los partidos.</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label className="btn-ghost filebtn">{crest ? "Cambiar escudo" : "Subir escudo"}
            <input type="file" accept="image/*" className="fileinp" onChange={handleCrest} />
          </label>
          {crest && <button className="btn-ghost sm" style={{ color: "#E14B4B" }} onClick={onRemoveCrest}>Quitar escudo</button>}
        </div>
        {crest && (
          <div style={{ marginTop: 12 }}>
            <div className="inplbl">Tamaño del escudo</div>
            <div className="chips">
              {CREST_SIZES.map(([lbl, v]) => (
                <button key={lbl} className={"chip" + (Math.abs((crestScale || 1) - v) < 0.01 ? " on" : "")}
                  onClick={() => onCrestScale(v)}>{lbl} · {Math.round(v * 100)}%</button>))}
            </div>
            <div style={{ fontSize: 11.5, color: "#5b6470" }}>
              Ajústalo si tu PNG se ve pequeño o se sale de su hueco. No afecta al resto de la carta.</div>
          </div>)}
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
          <Crest c1={game.club.c1} c2={game.club.c2} name={game.club.name} size={48} img={crest} imgScale={crestScale} />
          <span style={{ fontSize: 11.5, color: "#5b6470" }}>Vista previa</span>
        </div>
      </div>
      <div className="panel">
        <div className="ptitle">🎯 Objetivos {edit ? "" : <button className="linky" style={{ margin: 0, float: "right" }} onClick={() => setEdit(true)}>Editar</button>}</div>
        {!edit ? (
          <div style={{ fontSize: 13, color: "#B9C2CD", lineHeight: 1.7 }}>
            {p.goals.kcal} kcal · {p.goals.protein}g proteína · {p.goals.sleepGoal}h sueño<br />
            Gym: {DOW.filter((d) => p.goals.gymDays.includes(d.v)).map((d) => d.l).join(" ")}<br />
            Hábitos: {p.goals.habits.join(", ") || "—"}
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}><div className="inplbl">Kcal</div>
                <input className="inp" type="number" value={g.kcal} onChange={(e) => setG({ ...g, kcal: +e.target.value })} /></div>
              <div style={{ flex: 1 }}><div className="inplbl">Proteína (g)</div>
                <input className="inp" type="number" value={g.protein} onChange={(e) => setG({ ...g, protein: +e.target.value })} /></div>
              <div style={{ flex: 1 }}><div className="inplbl">Sueño (h)</div>
                <input className="inp" type="number" step="0.5" value={g.sleepGoal} onChange={(e) => setG({ ...g, sleepGoal: +e.target.value })} /></div>
            </div>
            <div className="inplbl" style={{ marginTop: 10 }}>Días de gym</div>
            <div className="chips">{DOW.map((d) => (
              <button key={d.v} className={"chip" + (g.gymDays.includes(d.v) ? " on" : "")}
                onClick={() => setG({ ...g, gymDays: g.gymDays.includes(d.v) ? g.gymDays.filter((x) => x !== d.v) : [...g.gymDays, d.v] })}>{d.l}</button>))}
            </div>
            <div className="inplbl" style={{ marginTop: 10 }}>Hábitos extra (opcionales, +6 XP MEN c/u)</div>
            {g.habits.map((h, i) => (
              <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 5 }}>
                <div style={{ flex: 1, fontSize: 13, color: "#B9C2CD", background: "#141a22", borderRadius: 8, padding: "8px 10px" }}>{h}</div>
                <button className="chip" onClick={() => setG({ ...g, habits: g.habits.filter((_, j) => j !== i) })}>✕</button>
              </div>))}
            <div style={{ display: "flex", gap: 6 }}>
              <input className="inp" style={{ flex: 1 }} placeholder="Ej: leer 10 min, estirar…" value={newHabit}
                onChange={(e) => setNewHabit(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && newHabit.trim()) { setG({ ...g, habits: [...g.habits, newHabit.trim()] }); setNewHabit(""); } }} />
              <button className="btn-ghost sm" onClick={() => { if (newHabit.trim()) { setG({ ...g, habits: [...g.habits, newHabit.trim()] }); setNewHabit(""); } }}>＋</button>
            </div>
            <button className="btn-gold sm" style={{ marginTop: 10 }} onClick={() => { onGoals(g); setEdit(false); }}>Guardar</button>
          </div>)}
      </div>
      <div className="panel">
        <div className="ptitle">🏆 Trayectoria</div>
        {game.careerLog.map((c, i) => (
          <div key={i} style={{ fontSize: 13, color: "#B9C2CD", padding: "5px 0" }}>
            <span style={{ color: "#E8C15A", fontFamily: "'Oswald',sans-serif", marginRight: 8 }}>T{c.season}</span>{c.text}
          </div>))}
      </div>
    </div>
  );
}

/* ============================================================ APP */
const EMPTY_LOG = () => ({ meals: [], kcal: 0, prot: 0, gym: false, gymProgress: false, sleep: null, habitsDone: [] });

export default function App() {
  const [game, setGame] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [crest, setCrest] = useState(null);
  const [crestScale, setCrestScale] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const [signing, setSigning] = useState(null); // club en animación de fichaje
  const [liveMatch, setLiveMatch] = useState(null);
  const [tab, setTab] = useState("home");
  const [toast, setToast] = useState(null);
  const saveTimer = useRef();

  const pushToast = (t) => { setToast(t); setTimeout(() => setToast(null), 3200); };

  const addMsg = (g, from, text, extra = {}) => ({
    ...g, unread: (g.unread || 0) + 1,
    messages: [...g.messages, { id: Date.now() + Math.random(), from, text, time: nowTime(), ...extra }] });

  /* carga inicial */
  useEffect(() => {
    (async () => {
      const g = await stGet("game");
      const ph = await stGet("photo");
      const cr = await stGet("crest");
      const cs = await stGet("crestScale");
      if (ph) setPhoto(ph);
      if (cr) setCrest(cr);
      if (cs) setCrestScale(cs);
      if (g) setGame(processNewDays(sanitizeGame(g)));
      else setGame({ phase: "intro" });
      setLoaded(true);
    })();
  }, []);

  /* persistencia con debounce */
  useEffect(() => {
    if (!loaded || !game) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => stSet("game", game), 400);
  }, [game, loaded]);

  const savePhoto = (url) => { setPhoto(url); stSet("photo", url); };
  const removePhoto = () => { setPhoto(null); try { localStorage.removeItem("futabita:photo"); } catch (e) {} };
  const saveCrest = (url) => { setCrest(url); stSet("crest", url); };
  const removeCrest = () => { setCrest(null); try { localStorage.removeItem("futabita:crest"); } catch (e) {} };
  const saveCrestScale = (v) => { setCrestScale(v); stSet("crestScale", v); };

  /* cierre de días pasados */
  function processNewDays(g) {
    if (g.phase !== "main") return g;
    let out = { ...g, logs: { ...g.logs } };
    let d = g.lastDay;
    const today = todayStr();
    const yesterday = addDays(today, -1);
    let anyUp = [];
    let pressCount = 0;
    /* ventana de gracia: ayer queda pendiente y editable */
    while (d < yesterday) {
      const log = out.logs[d] || EMPTY_LOG();
      if (!log.closed) {
        const r = applyDayClose(out.player, log, d);
        out.player = r.player;
        out.logs[d] = { ...log, closed: true, pct: r.pct, form: r.form };
        anyUp = anyUp.concat(r.ups);
        if (r.decayed) out = addMsg(out, "Entrenador", "Te veo apagado en los entrenamientos. Dos días flojos seguidos y tu físico lo nota: has perdido puntos. Reacciona. 📉");
        if (pressCount < 3 && Math.random() < 0.65) {
          const pn = pressNote(out, r.form);
          if (pn) { out = addMsg(out, pn.from, pn.text); pressCount++; }
        }
      }
      d = addDays(d, 1);
    }
    out.lastDay = today;
    if (yesterday >= g.lastDay && !out.logs[yesterday]) out.logs[yesterday] = EMPTY_LOG();
    if (!out.logs[today]) out.logs[today] = EMPTY_LOG();
    if (anyUp.length) {
      const counts = {};
      anyUp.forEach((k) => (counts[k] = (counts[k] || 0) + 1));
      const txt = Object.entries(counts).map(([k, n]) => `${STAT_LABELS[k]} +${n}`).join(", ");
      out = addMsg(out, "Entrenador", `Informe de entrenamiento: ${txt}. El staff está impresionado con tu trabajo. 💪`);
    }
    /* frase espontánea diaria: el mundo del juego sigue vivo aunque no haya partido */
    if (out.lastFlavor !== today) {
      const s2 = out.season;
      const matchDueToday = s2 && s2.matchday < SEASON_LENGTH && dayDiff(s2.startDate, today) >= (s2.matchday + 1) * 2 - 1;
      const n = matchDueToday ? 1 : (Math.random() < 0.5 ? 2 : 1);
      pickFlavor(out, n).forEach((fv) => { out = addMsg(out, fv.from, fv.text); });
      out.lastFlavor = today;
    }
    return out;
  }

  /* onboarding terminado -> generar 3 ofertas regionales */
  const finishOnboarding = (data) => {
    const stats = {}; STAT_KEYS.forEach((k) => (stats[k] = 58 + Math.floor(Math.random() * 5)));
    const player = { ...data, stats, xp: {}, streak: 0, badDays: 0, form: "est",
      weight0: data.weight, weightLog: [{ d: todayStr(), kg: data.weight }] };
    const clubs = pickN(REGIONAL_POOL, 3);
    const pitches = [
      "Somos un club de cantera y sacrificio. Aquí nadie te regala nada, pero si trabajas, jugarás.",
      "Nuestro campo es humilde y nuestra afición, de las que aprietan. Buscamos hambre, y nos han dicho que te sobra.",
      "Proyecto serio en categoría regional. Queremos jugadores que entiendan que el fútbol se gana entre semana.",
    ];
    setGame({ phase: "choice", player, offersChoice: clubs.map((c, i) => ({ club: c, pitch: pitches[i] })) });
  };

  /* firmar con un club (inicial o traspaso) */
  const signClub = (club, tierId = 0, viaTransfer = false) => {
    setSigning({ club, tierId, viaTransfer });
  };

  const confirmSigning = () => {
    const { club, tierId, viaTransfer } = signing;
    setGame((g) => {
      const tier = tierId === 0 ? { id: 0, league: "Tercera Federación · España" } : TIERS[tierId];
      let out = {
        ...g, phase: "main", club, tier, offersChoice: null,
        lastDay: g.lastDay || todayStr(),
        logs: g.logs || { [todayStr()]: EMPTY_LOG() },
        messages: g.messages || [], unread: 0,
        matchHistory: g.matchHistory || [],
        careerLog: [...(g.careerLog || []), { season: (g.season && g.season.num) || 1, text: `Fichaje por ${club.name} (${tier.league})` }],
        season: { num: (g.season && viaTransfer ? g.season.num : (g.season ? g.season.num : 1)),
          startDate: todayStr(), matchday: 0, table: buildTable(club.name, tier.id),
          rivals: pickN(RIVALS_BY_TIER[Math.min(tier.id, RIVALS_BY_TIER.length - 1)], SEASON_LENGTH),
          midOfferDone: false },
        midSeasonKeepPts: false,
      };
      out = addMsg(out, "Entrenador",
        `Bienvenido al ${club.name}, ${g.player.name}. Aquí las cosas son simples: el que trabaja y se deja la piel como un profesional, juega. Partido cada 2 días. Demuéstramelo. ⚽`);
      const captain = pick(CAPTAINS);
      out.captain = captain;
      out = addMsg(out, `${captain} · Capitán`, pick([
        `¡Bienvenido al vestuario, crack! 🙌 Soy ${captain}, el capi. Aquí somos pocos pero somos familia. Un consejo: al míster gánatelo entre semana, no los domingos. Cualquier cosa que necesites, me escribes.`,
        `¡Eh, el nuevo! 😄 Soy ${captain}, capitán de este equipo. Ya me han hablado de tu hambre. Aquí el que se lo curra, juega — así de fácil. Bienvenido a casa, hermano.`,
        `Bienvenido, ${g.player.name} 🤝 Soy ${captain}. Te lo digo el primero: esta camiseta pesa más de lo que parece. Déjate la piel entre semana y el vestuario te llevará en volandas.`]));
      out = addMsg(out, pick(PRESS),
        `OFICIAL ✍️ | El ${club.name} anuncia el fichaje de ${g.player.name} (${g.player.position}). ${viaTransfer ? "Movimiento sonado en el mercado que ilusiona a la afición." : "El club apuesta por una joven promesa con hambre de fútbol."}`);
      return out;
    });
    setSigning(null);
    setTab("home");
  };

  /* jugar partido */
  const playMatch = () => {
    const s = game.season;
    const rival = s.rivals[s.matchday % s.rivals.length];
    const m = simulateMatch(game.player, rival, s.matchday + 1);
    setLiveMatch(m);
  };

  const finishMatch = () => {
    const m = liveMatch;
    setGame((g) => {
      const s = { ...g.season };
      s.matchday += 1;
      s.table = s.table.map((t) => {
        if (t.me) return { ...t, pts: t.pts + (m.res === "V" ? 3 : m.res === "E" ? 1 : 0) };
        const r = Math.random(); return { ...t, pts: t.pts + (r < 0.42 ? 3 : r < 0.7 ? 1 : 0) };
      });
      let out = { ...g, season: s, matchHistory: [...g.matchHistory, m] };
      out = addMsg(out, "Entrenador", coachMessage(m, g.player));
      const cap = (g.captain || "Capitán") + " · Capitán";
      if (!m.benched && m.rating >= 8.5 && Math.random() < 0.6) {
        out = addMsg(out, cap, pick([
          `¡QUÉ PARTIDO TE HAS MARCADO! 🔥🔥 El vestuario entero hablando de ti. Sigue así y esto se te queda pequeño, crack.`,
          `Hermano, hoy has sido OTRO NIVEL 🙌 Se nota lo que curras fuera del campo. Orgulloso de jugar contigo.`]));
      } else if (m.res === "V" && !m.benched && Math.random() < 0.3) {
        out = addMsg(out, cap, pick([
          `¡VICTORIAAA! 🎉 Buen curro hoy, equipo. A descansar bien que en 2 días hay otra guerra.`,
          `3 puntitos más 😎 A descansar bien, que la liga no espera.`]));
      } else if (m.benched && Math.random() < 0.5) {
        out = addMsg(out, cap, `Te he visto jodido en el banquillo... 😕 Escucha: a todos nos ha pasado. Esta semana cúrratelo al máximo y el míster no tendrá excusas. Cuento contigo.`);
      }
      const ovr = calcOVR(g.player.stats);
      /* ventana de mitad de temporada */
      if (s.matchday === MID_WINDOW && !s.midOfferDone) {
        s.midOfferDone = true;
        const next = TIERS.find((t) => t.id === g.tier.id + 1);
        if (next && ovr >= next.minOvr - 1 && Math.random() < 0.8) {
          const club = pick(next.clubs);
          const o = makeOffer(club, next, ovr);
          out = addMsg(out, "Tu agente", `📞 Mercado de invierno abierto. ${o.text}\n\n¿Aceptas el traspaso a mitad de temporada?`,
            { kind: "offer", offer: o, status: "pending" });
        } else {
          out = addMsg(out, "Tu agente", "Mercado de invierno abierto. He sondeado a varios clubes pero tu media aún no convence a nadie de categoría superior. Sigue creciendo: en verano habrá noticias.");
        }
      }
      /* fin de temporada */
      if (s.matchday >= SEASON_LENGTH) {
        const table = [...s.table].sort((a, b) => b.pts - a.pts);
        const pos = table.findIndex((t) => t.me) + 1;
        const played = out.matchHistory.filter((x) => true);
        const seasonMatches = played.slice(-SEASON_LENGTH);
        const goals = seasonMatches.reduce((a, x) => a + (x.myGoals || 0), 0);
        const ratings = seasonMatches.filter((x) => x.rating != null);
        const avgR = ratings.length ? (ratings.reduce((a, x) => a + x.rating, 0) / ratings.length).toFixed(1) : "—";
        out = addMsg(out, "Entrenador",
          `🏁 FIN DE TEMPORADA ${s.num}.\nPosición final: ${pos}º de 10.\nTus goles: ${goals} · Nota media: ${avgR}.\n${pos <= 3 ? "Temporada histórica. Eres el nombre del vestuario." : pos <= 6 ? "Temporada digna. El año que viene, más." : "Temporada dura. Que sirva de gasolina."}`);
        out.careerLog = [...out.careerLog, { season: s.num, text: `${pos}º con ${g.club.name} · ${goals} goles · media ${avgR}` }];
        /* ofertas de verano */
        const next = TIERS.find((t) => t.id === g.tier.id + 1);
        let offered = false;
        if (next && ovr >= next.minOvr) {
          pickN(next.clubs, Math.min(2, next.clubs.length)).forEach((club) => {
            const o = makeOffer(club, next, ovr);
            out = addMsg(out, "Tu agente", `☀️ Mercado de verano. ${o.text}`, { kind: "offer", offer: o, status: "pending" });
            offered = true;
          });
        }
        if (!offered) out = addMsg(out, "Tu agente",
          next ? `Verano tranquilo. Para dar el salto a ${next.league} necesitas media ${next.minOvr} (tienes ${ovr}). El gym y la cocina son tu mercado.` :
          "Estás en la cima del fútbol mundial. Ya solo compites contra tu propia leyenda. 👑");
        /* nueva temporada en el club actual (si no acepta oferta) */
        out.season = { num: s.num + 1, startDate: todayStr(), matchday: 0,
          table: buildTable(g.club.name, g.tier.id),
          rivals: pickN(RIVALS_BY_TIER[Math.min(g.tier.id, RIVALS_BY_TIER.length - 1)], SEASON_LENGTH), midOfferDone: false };
        out = addMsg(out, "Entrenador", `La temporada ${s.num + 1} arranca ya. Pretemporada corta: partido en 2 días. 🏃`);
      }
      return out;
    });
    setLiveMatch(null);
  };

  /* aceptar / rechazar oferta */
  const offerAction = (msgId, accept) => {
    const msg = game.messages.find((m) => m.id === msgId);
    if (!msg) return;
    setGame((g) => ({ ...g, messages: g.messages.map((m) => m.id === msgId ? { ...m, status: accept ? "accepted" : "rejected" } : m) }));
    if (accept) {
      signClub(msg.offer.club, msg.offer.tierId, true);
    } else {
      setTimeout(() => setGame((g) => addMsg(g, "Entrenador",
        `Me han contado que rechazaste al ${msg.offer.club.name}. Esa lealtad no se olvida. La afición te va a hacer un cántico. ❤️`)), 600);
    }
  };

  /* registro del día */
  const [logDate, setLogDate] = useState(todayStr());
  /* si el día seleccionado dejó de ser editable (se cerró o pasó la ventana), volver a hoy */
  useEffect(() => {
    if (!game) return;
    const t = todayStr();
    if (logDate !== t) {
      const l = game.logs && game.logs[logDate];
      if (logDate !== addDays(t, -1) || !l || l.closed) setLogDate(t);
    }
  }, [game, logDate]);
  const activeLog = game && game.logs ? game.logs[logDate] || EMPTY_LOG() : EMPTY_LOG();
  /* la forma del jugador (carta/partidos) SOLO cambia al cerrar un día;
     lo que llevas de hoy se muestra como proyección en Registro pero no te penaliza */
  const setActiveLog = (log) => setGame((g) => ({ ...g, logs: { ...g.logs, [logDate]: log } }));
  const saveMeal = (m) => { setGame((g) => {
    const sm = g.savedMeals || [];
    if (sm.some((x) => x.name === m.name)) return g;
    return { ...g, savedMeals: [...sm, m].slice(-8) };
  }); pushToast("💾 Guardada en comidas frecuentes"); };
  const addWeight = (kg) => { setGame((g) => {
    const p = g.player;
    const stats = { ...p.stats }, xp = { ...p.xp };
    xp.MEN = (xp.MEN || 0) + 8;
    let upped = false;
    while (stats.MEN < 99 && xp.MEN >= xpToNext(stats.MEN)) { xp.MEN -= xpToNext(stats.MEN); stats.MEN += 1; upped = true; }
    if (upped) setTimeout(() => pushToast("🧠 ¡MEN sube a " + stats.MEN + "! Cabeza fría, crack"), 600);
    return { ...g, player: { ...p, stats, xp,
      weightLog: [...p.weightLog, { d: todayStr(), kg }] } };
  }); pushToast("⚖️ Peso registrado — tu valor de mercado se actualiza · +8 XP MEN"); };
  const setGoals = (goals) => setGame((g) => ({ ...g, player: { ...g.player, goals } }));

  /* cerrar manualmente un día pendiente (normalmente ayer) */
  const closePendingDay = (dateStr) => setGame((g) => {
    const log = g.logs[dateStr];
    if (!log || log.closed) return g;
    const r = applyDayClose(g.player, log, dateStr);
    let out = { ...g, player: r.player, logs: { ...g.logs, [dateStr]: { ...log, closed: true, pct: r.pct, form: r.form } } };
    if (r.decayed) out = addMsg(out, "Entrenador", "Te veo apagado en los entrenamientos. Dos días flojos seguidos y tu físico lo nota: has perdido puntos. Reacciona. 📉");
    if (r.ups.length) {
      const counts = {};
      r.ups.forEach((k) => (counts[k] = (counts[k] || 0) + 1));
      const txt = Object.entries(counts).map(([k, n]) => `${STAT_LABELS[k]} +${n}`).join(", ");
      out = addMsg(out, "Entrenador", `Informe de entrenamiento: ${txt}. El staff está impresionado con tu trabajo. 💪`);
    }
    setTimeout(() => pushToast(`📋 Día ${dateStr.slice(8)}/${dateStr.slice(5, 7)} cerrado · ${r.pct}%`), 100);
    return out;
  });

  /* respaldo manual (independiente del almacenamiento automático) */
  const getBackup = () => JSON.stringify({ v: 1, game, photo, crest, crestScale });
  const restoreBackup = (txt) => {
    try {
      const b = JSON.parse(txt.trim());
      if (!b.game || !b.game.player) throw new Error("bad");
      const g = processNewDays(sanitizeGame(b.game));
      setGame(g); stSet("game", g);
      if (b.photo) savePhoto(b.photo);
      if (b.crest) saveCrest(b.crest);
      if (b.crestScale) saveCrestScale(b.crestScale);
      setTab("home");
      pushToast("✓ Carrera restaurada. ¡Bienvenido de vuelta!");
    } catch (e) { pushToast("✗ Ese texto no es un respaldo válido"); }
  };

  if (!loaded || !game) return (
    <div className="screen" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
      <div className="ball-wrap">
        <div className="ball">⚽</div>
        <div className="ball-shadow" />
      </div>
      <div style={{ color: "#C9A94E", fontFamily: "'Oswald',sans-serif", letterSpacing: 4, fontSize: 15 }}>FUTABITA 3.1</div>
    </div>);

  return (
    <div className="app-root">
      <StyleTag />
      {game.phase === "intro" && <IntroScreen onDone={() => setGame({ ...game, phase: "onboard" })} onRestore={restoreBackup} />}
      {game.phase === "onboard" && <Onboarding onPhoto={savePhoto} onDone={finishOnboarding} />}
      {game.phase === "choice" && <ChoiceScreen offers={game.offersChoice} playerName={game.player.name}
        onSign={(c) => signClub(c, 0, false)} />}
      {game.phase === "main" && (
        <>
          <header style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px 8px" }}>
            <Crest c1={game.club.c1} c2={game.club.c2} name={game.club.name} size={30} img={crest} imgScale={crestScale} />
            <div>
              <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: 14, letterSpacing: 0.5 }}>{game.club.name}</div>
              <div style={{ fontSize: 10.5, color: "#8b95a3" }}>{game.tier.league} · Temporada {game.season.num}</div>
            </div>
            <div style={{ marginLeft: "auto" }}><FormBadge form={game.player.form} /></div>
          </header>
          {tab === "home" && <HomeTab game={game} photo={photo} crest={crest} crestScale={crestScale}
            log={(game.logs && game.logs[todayStr()]) || EMPTY_LOG()} />}
          {tab === "log" && <LogTab game={game} log={activeLog} onLog={setActiveLog} logDate={logDate} onDate={setLogDate}
            onCloseDay={closePendingDay} savedMeals={game.savedMeals || []} onSaveMeal={saveMeal} />}
          {tab === "league" && <LeagueTab game={game} onPlayMatch={playMatch} crest={crest} crestScale={crestScale} />}
          {tab === "chat" && <ChatTab messages={game.messages} onOfferAction={offerAction} />}
          {tab === "me" && <ProfileTab game={game} photo={photo} onWeight={addWeight} onPhoto={savePhoto} onRemovePhoto={removePhoto}
            crest={crest} onCrest={saveCrest} onRemoveCrest={removeCrest} crestScale={crestScale} onCrestScale={saveCrestScale}
            onGoals={setGoals} getBackup={getBackup} onRestore={restoreBackup} />}
          <nav className="tabbar">
            {[["home", "🏠", "Inicio"], ["log", "📝", "Registro"], ["league", "🏆", "Liga"], ["chat", "💬", "Chat"], ["me", "👤", "Yo"]].map(([id, ic, lb]) => (
              <button key={id} className={"tabbtn" + (tab === id ? " on" : "")}
                onClick={() => { setTab(id); if (id === "chat") setGame((g) => ({ ...g, unread: 0 })); }}>
                <span style={{ fontSize: 18, position: "relative" }}>{ic}
                  {id === "chat" && game.unread > 0 && <span className="dot">{game.unread}</span>}</span>
                <span style={{ fontSize: 10 }}>{lb}</span>
              </button>))}
          </nav>
        </>
      )}
      {signing && <SigningOverlay club={signing.club} player={game.player} photo={photo} crest={crest} crestScale={crestScale} onDone={confirmSigning} />}
      {liveMatch && <MatchModal match={liveMatch} club={game.club} onFinish={finishMatch} crest={crest} crestScale={crestScale} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

/* ---------- ESTILOS ---------- */
function StyleTag() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;700&family=Barlow:wght@400;500;600&display=swap');
      .app-root { min-height: 100vh; background: #070A12; color: #DDE3EA; font-family: 'Barlow', system-ui, sans-serif;
        max-width: 480px; margin: 0 auto; position: relative; }
      .screen { min-height: 100vh; }
      .intro-bg { background:
        radial-gradient(ellipse 90% 50% at 50% -10%, rgba(232,193,90,.14), transparent),
        radial-gradient(ellipse 70% 40% at 80% 110%, rgba(14,107,58,.25), transparent), #070A12; }
      .eyebrow { font-family:'Oswald',sans-serif; font-size:11px; letter-spacing:4px; color:#C9A94E; }
      .h2 { font-family:'Oswald',sans-serif; font-size:28px; color:#F5EFDF; margin:6px 0 18px; text-transform:uppercase; }
      .lbl { display:block; font-size:12px; color:#8b95a3; margin:12px 0 5px; }
      .inp { width:100%; box-sizing:border-box; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.12);
        color:#F5EFDF; border-radius:8px; padding:11px 12px; font-size:14px; margin-bottom:6px; font-family:'Barlow',sans-serif; }
      .inplbl { font-size:10.5px; color:#8b95a3; text-transform:uppercase; letter-spacing:.8px; margin-bottom:4px; font-family:'Oswald',sans-serif; }
      .pendbar { margin-top:10px; background:rgba(232,193,90,.12); border:1px solid rgba(232,193,90,.35); color:#E8C15A;
        border-radius:10px; padding:10px 12px; font-size:12.5px; cursor:pointer; }
      .inp:focus { outline:2px solid #E8C15A; outline-offset:1px; }
      .chips { display:flex; flex-wrap:wrap; gap:7px; margin:4px 0 8px; }
      .chip { background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.14); color:#B9C2CD;
        border-radius:20px; padding:7px 13px; font-size:12.5px; font-family:'Barlow',sans-serif; cursor:pointer; }
      .chip.big { padding:10px 15px; font-size:13.5px; }
      .chip.on { background:rgba(232,193,90,.16); border-color:#E8C15A; color:#E8C15A; font-weight:600; }
      .btn-gold { display:block; width:100%; background:linear-gradient(135deg,#E8C15A,#B8892E); color:#1c1204;
        border:none; border-radius:10px; padding:14px; font-family:'Oswald',sans-serif; font-size:15px; letter-spacing:2px;
        cursor:pointer; box-shadow:0 4px 18px rgba(232,193,90,.25); }
      .btn-gold.sm { padding:10px; font-size:13px; letter-spacing:1px; width:auto; }
      .btn-gold:focus, .btn-ghost:focus, .chip:focus, .tabbtn:focus { outline:2px solid #E8C15A; outline-offset:2px; }
      .btn-ghost { background:transparent; border:1px solid rgba(255,255,255,.2); color:#B9C2CD; border-radius:10px;
        padding:11px 14px; font-size:13px; cursor:pointer; font-family:'Barlow',sans-serif; }
      .btn-ghost.sm { padding:9px; }
      .filebtn { display:inline-block; position:relative; overflow:hidden; cursor:pointer; }
      .fileinp { position:absolute; inset:0; width:100%; height:100%; opacity:0; cursor:pointer; font-size:0; }
      .linky { background:none; border:none; color:#9CC3E5; font-size:12px; cursor:pointer; padding:0; margin-top:8px; display:inline-block; }
      .panel { background:rgba(255,255,255,.035); border:1px solid rgba(255,255,255,.07); border-radius:14px;
        padding:14px; margin-top:12px; }
      .ptitle { font-family:'Oswald',sans-serif; font-size:14px; letter-spacing:.5px; color:#F5EFDF; margin-bottom:10px; }
      .track { height:8px; background:rgba(255,255,255,.08); border-radius:6px; overflow:hidden; }
      .fill { height:100%; border-radius:6px; transition:width .5s ease; }
      .stat-box { background:rgba(255,255,255,.035); border:1px solid rgba(255,255,255,.07); border-radius:12px;
        padding:10px 6px; text-align:center; }
      .sb-num { font-family:'Oswald',sans-serif; font-size:16px; color:#E8C15A; }
      .sb-lbl { font-size:9.5px; color:#8b95a3; margin-top:2px; }
      .bubble { background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); border-radius:4px 14px 14px 14px;
        padding:11px 13px; font-size:13.5px; line-height:1.5; color:#DDE3EA; }
      .bubble.coach { border-left:3px solid #3DDC84; }
      .bubble.agent { border-left:3px solid #9CC3E5; }
      .bubble.cap { border-left:3px solid #E8825A; }
      .bubble.press { border-left:3px solid #C9A94E; background:rgba(201,169,78,.06); font-style:italic; }
      .bubble.press .bfrom { font-style:normal; }
      .bubble.offer { border-left:3px solid #E8C15A; background:rgba(232,193,90,.07); }
      .bfrom { font-family:'Oswald',sans-serif; font-size:11px; letter-spacing:1px; color:#C9A94E; margin-bottom:5px; text-transform:uppercase; }
      .offer-card { border:1px solid; border-radius:14px; padding:14px; margin-bottom:14px; background:rgba(255,255,255,.03); }
      .tabbar { position:fixed; bottom:0; left:50%; transform:translateX(-50%); width:100%; max-width:480px;
        display:flex; background:rgba(7,10,18,.96); border-top:1px solid rgba(255,255,255,.08); backdrop-filter:blur(8px); z-index:40; }
      .tabbtn { flex:1; background:none; border:none; color:#5b6470; padding:9px 0 11px; display:flex; flex-direction:column;
        align-items:center; gap:2px; cursor:pointer; font-family:'Barlow',sans-serif; }
      .tabbtn.on { color:#E8C15A; }
      .dot { position:absolute; top:-4px; right:-10px; background:#E14B4B; color:#fff; font-size:9px; border-radius:8px;
        padding:1px 5px; font-weight:700; }
      .fut-card { position:relative; border-radius:16px; overflow:hidden; box-shadow:0 10px 40px rgba(0,0,0,.55);
        border:1px solid rgba(255,255,255,.25); }
      /* el barrido va SIEMPRE por encima del contenido de la carta (foto incluida):
         ojo, un filter/transform en la foto crearía stacking context y la colaría por encima */
      .fut-shine { position:absolute; inset:0; background:linear-gradient(105deg, transparent 42%, rgba(255,255,255,.38) 50%, transparent 58%);
        background-size:300% 100%; animation:shine 3.2s linear infinite; pointer-events:none; z-index:3; }
      @keyframes shine { from { background-position:250% 0; } to { background-position:-150% 0; } }
      .ball-wrap { position:relative; height:90px; width:70px; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; }
      .ball { font-size:44px; line-height:1; animation: bounce .65s cubic-bezier(.5,.05,.5,.95) infinite alternate; position:relative; z-index:2; }
      .ball-shadow { width:44px; height:9px; border-radius:50%; background:rgba(0,0,0,.45); margin-top:6px; animation: shadowp .65s cubic-bezier(.5,.05,.5,.95) infinite alternate; }
      @keyframes bounce { from { transform: translateY(-46px) rotate(-12deg); } to { transform: translateY(0) rotate(12deg); } }
      @keyframes shadowp { from { transform: scaleX(.55); opacity:.35; } to { transform: scaleX(1); opacity:.7; } }
      .overlay { position:fixed; inset:0; z-index:60; display:flex; flex-direction:column; align-items:center;
        justify-content:center; padding:20px; transition:background .8s ease; }
      .official-flash { font-family:'Oswald',sans-serif; font-size:52px; letter-spacing:14px; color:#F5EFDF;
        animation:flash .9s ease forwards; }
      @keyframes flash { 0% { opacity:0; transform:scale(2.4); filter:blur(8px);} 55% { opacity:1; transform:scale(1); filter:blur(0);} 100% { opacity:.9; } }
      .pop-in { animation:pop .55s cubic-bezier(.2,1.4,.4,1) both; }
      @keyframes pop { from { opacity:0; transform:scale(.8) translateY(20px);} to { opacity:1; transform:none; } }
      .card-drop { animation:drop .7s cubic-bezier(.2,1.3,.4,1) both; }
      @keyframes drop { from { opacity:0; transform:translateY(-60px) rotateY(60deg) scale(.7);} to { opacity:1; transform:none; } }
      .event-in { animation:evin .35s ease both; }
      @keyframes evin { from { opacity:0; transform:translateX(-14px);} to { opacity:1; transform:none; } }
      .fade-seq { opacity:0; animation:fadeup .9s ease forwards; }
      @keyframes fadeup { from { opacity:0; transform:translateY(14px);} to { opacity:1; transform:none; } }
      .toast { position:fixed; bottom:74px; left:50%; transform:translateX(-50%); background:#12182a; color:#F5EFDF;
        border:1px solid rgba(232,193,90,.4); border-radius:10px; padding:10px 16px; font-size:13px; z-index:80;
        animation:pop .3s ease both; max-width:90%; text-align:center; }
      @media (prefers-reduced-motion: reduce) { .fut-shine, .fade-seq, .official-flash, .card-drop, .pop-in, .event-in { animation:none !important; opacity:1 !important; } }
    `}</style>
  );
}
