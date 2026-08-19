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

const SEASON_LENGTH = 15; // jornadas (una por día ≈ 2 semanas de temporada)
const MID_WINDOW = 8;     // jornada del mercado de invierno (mitad de temporada)

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

/* calendario de liga: una jornada por día. La jornada 1 se juega al día siguiente
   del inicio de temporada (el día del fichaje/arranque es de presentación).
   Si el usuario no abre la app varios días, los partidos pendientes se acumulan
   y puede jugarlos seguidos: el calendario nunca se salta jornadas. */
const matchDateFor = (season, matchday) => addDays(season.startDate, matchday + 1);
const isMatchDue = (season, dateStr) =>
  !!season && season.matchday < SEASON_LENGTH && dayDiff(season.startDate, dateStr) >= season.matchday + 1;

const calcOVR = (stats) => Math.round(STAT_KEYS.reduce((s, k) => s + stats[k] * OVR_WEIGHTS[k], 0));
const xpToNext = (v) => Math.round(36 + Math.max(0, v - 58) * 10);
/* multiplicador de XP por racha: +2% por día de racha, techo +20% (racha 10+).
   Tolera streak undefined (partidas antiguas) tratándolo como 0. */
const streakMultOf = (s) => 1 + Math.min(s || 0, 25) * 0.02;

/* haptics: vibración sutil en hitos. Activada por defecto, interruptor en Yo.
   El flag lo sincroniza App con la preferencia guardada. */
let HAPTICS = true;
const buzz = (p) => { if (!HAPTICS) return; try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} };

/* derbi narrativo: una jornada por temporada, derivada de forma determinista
   (sin estado nuevo) — solo texto/presentación, cero cambios de balance */
const derbiJornadaOf = (s) => 1 + ((s.num * 5 + 3) % SEASON_LENGTH);

/* mini-rachas informativas por hábito (no tocan XP ni multiplicadores):
   días consecutivos cerrados cumpliendo un predicado, contando desde ayer */
function catStreak(game, pred) {
  let n = 0, d = addDays(todayStr(), -1);
  for (let i = 0; i < 30; i++) {
    const l = game.logs && game.logs[d];
    if (!l || !l.closed || !pred(l, d)) break;
    n++; d = addDays(d, -1);
  }
  return n;
}
/* ============================================================
   GYM · catálogo, rutinas, sesiones y récords
   Tipos de ejercicio: "w" peso+reps · "bw" peso corporal (reps, lastre opcional) · "t" tiempo
   ============================================================ */
const MUSCLES = [
  { id: "pecho", label: "Pecho", emoji: "🫀" },
  { id: "espalda", label: "Espalda", emoji: "🦾" },
  { id: "pierna", label: "Pierna", emoji: "🦵" },
  { id: "hombro", label: "Hombro", emoji: "🏔️" },
  { id: "brazo", label: "Brazo", emoji: "💪" },
  { id: "core", label: "Core", emoji: "🎯" },
  { id: "cardio", label: "Cardio", emoji: "🏃" },
];
const EX_CATALOG = [
  ["press-banca", "Press banca", "pecho", "w"], ["press-inclinado", "Press inclinado mancuernas", "pecho", "w"],
  ["press-banca-manc", "Press banca mancuernas", "pecho", "w"], ["aperturas-polea", "Aperturas en polea", "pecho", "w"],
  ["fondos-paralelas", "Fondos en paralelas", "pecho", "bw"], ["press-declinado", "Press declinado", "pecho", "w"],
  ["pec-deck", "Contractor de pecho", "pecho", "w"],
  ["dominadas", "Dominadas", "espalda", "bw"], ["remo-barra", "Remo con barra", "espalda", "w"],
  ["jalon-pecho", "Jalón al pecho", "espalda", "w"], ["remo-polea", "Remo en polea baja", "espalda", "w"],
  ["remo-mancuerna", "Remo con mancuerna", "espalda", "w"], ["pullover", "Pull-over", "espalda", "w"],
  ["peso-muerto", "Peso muerto", "espalda", "w"], ["encogimientos", "Encogimientos de trapecio", "espalda", "w"],
  ["sentadilla", "Sentadilla", "pierna", "w"], ["prensa", "Prensa de piernas", "pierna", "w"],
  ["zancadas", "Zancadas", "pierna", "w"], ["peso-muerto-rumano", "Peso muerto rumano", "pierna", "w"],
  ["curl-femoral", "Curl femoral", "pierna", "w"], ["extension-cuadriceps", "Extensión de cuádriceps", "pierna", "w"],
  ["hip-thrust", "Hip thrust", "pierna", "w"], ["gemelos", "Gemelos de pie", "pierna", "w"],
  ["sentadilla-bulgara", "Sentadilla búlgara", "pierna", "w"], ["abductores", "Abductores", "pierna", "w"],
  ["press-militar", "Press militar", "hombro", "w"], ["elevaciones-laterales", "Elevaciones laterales", "hombro", "w"],
  ["elevaciones-frontales", "Elevaciones frontales", "hombro", "w"], ["pajaro", "Pájaro (deltoide posterior)", "hombro", "w"],
  ["press-arnold", "Press Arnold", "hombro", "w"], ["face-pull", "Face pull", "hombro", "w"],
  ["curl-barra", "Curl con barra", "brazo", "w"], ["curl-mancuernas", "Curl con mancuernas", "brazo", "w"],
  ["curl-martillo", "Curl martillo", "brazo", "w"], ["curl-predicador", "Curl predicador", "brazo", "w"],
  ["triceps-polea", "Extensión de tríceps en polea", "brazo", "w"], ["press-frances", "Press francés", "brazo", "w"],
  ["fondos-banco", "Fondos en banco", "brazo", "bw"], ["curl-concentrado", "Curl concentrado", "brazo", "w"],
  ["plancha", "Plancha", "core", "t"], ["crunch", "Crunch abdominal", "core", "bw"],
  ["elevacion-piernas", "Elevación de piernas", "core", "bw"], ["rueda-abdominal", "Rueda abdominal", "core", "bw"],
  ["russian-twist", "Russian twist", "core", "w"], ["plancha-lateral", "Plancha lateral", "core", "t"],
  ["cinta", "Cinta de correr", "cardio", "t"], ["bici", "Bici estática", "cardio", "t"],
  ["eliptica", "Elíptica", "cardio", "t"], ["remo-ergometro", "Remo ergómetro", "cardio", "t"],
  ["comba", "Comba", "cardio", "t"],
].map(([id, name, muscle, type]) => ({ id, name, muscle, type }));

const DEFAULT_ROUTINES = [
  { id: "r-pecho", name: "Pecho y tríceps", emoji: "🫀", ex: ["press-banca", "press-inclinado", "aperturas-polea", "triceps-polea", "press-frances"] },
  { id: "r-espalda", name: "Espalda y bíceps", emoji: "🦾", ex: ["dominadas", "remo-barra", "jalon-pecho", "curl-barra", "curl-martillo"] },
  { id: "r-pierna", name: "Pierna", emoji: "🦵", ex: ["sentadilla", "prensa", "curl-femoral", "extension-cuadriceps", "gemelos"] },
  { id: "r-torso", name: "Torso completo", emoji: "🏔️", ex: ["press-militar", "elevaciones-laterales", "remo-polea", "press-banca-manc", "plancha"] },
];
const emptyGym = () => ({ routines: DEFAULT_ROUTINES.map((r) => ({ ...r })), custom: [], sessions: [], prs: {}, active: null, restDefault: 90 });
const allExercises = (gym) => [...EX_CATALOG, ...((gym && gym.custom) || [])];
const exById = (gym, id) => allExercises(gym).find((e) => e.id === id) || { id, name: id, muscle: "pecho", type: "w" };
/* 1RM estimado (Epley) para comparar progresión entre pesos y repeticiones distintas */
const e1rm = (w, reps) => (!w || !reps ? 0 : Math.round(w * (1 + reps / 30) * 10) / 10);
const setVolume = (s) => (s.type === "t" ? 0 : (s.w || 0) * (s.reps || 0));
const sessionVolume = (sets) => (sets || []).filter((s) => s.done).reduce((a, s) => a + setVolume(s), 0);
const fmtDur = (sec) => {
  const m = Math.floor(sec / 60), r = sec % 60;
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}min` : m > 0 ? `${m}:${String(r).padStart(2, "0")}` : `${r}s`;
};
/* el respaldo se copia a mano: el detalle de series solo se guarda ~120 días,
   lo más antiguo se compacta a resumen (fecha, rutina, volumen, duración, PRs) */
function pruneGym(gym) {
  if (!gym || !gym.sessions) return gym;
  const limit = addDays(todayStr(), -120);
  return { ...gym, sessions: gym.sessions.map((s) =>
    s.d < limit && s.sets ? { id: s.id, d: s.d, name: s.name, durSec: s.durSec, volume: s.volume,
      nSets: s.sets.filter((x) => x.done).length, groups: s.groups, prs: s.prs, compact: true } : s) };
}

/* racha de gym: solo cuentan (y solo rompen) los días que tocaba gym */
function gymStreakOf(game, gymDays) {
  let n = 0, d = addDays(todayStr(), -1);
  for (let i = 0; i < 30; i++) {
    const l = game.logs && game.logs[d];
    const dow = new Date(d + "T12:00").getDay();
    if (gymDays.includes(dow)) {
      if (!l || !l.closed || !l.gym) break;
      n++;
    }
    d = addDays(d, -1);
  }
  return n;
}
const cardTier = (ovr) => (ovr >= 85 ? "special" : ovr >= 75 ? "gold" : ovr >= 65 ? "silver" : "bronze");
const marketValue = (ovr, kgGained) => Math.round((25000 * Math.pow(1.16, ovr - 60)) * (1 + Math.max(0, kgGained) * 0.06));

const FORM_META = {
  alza: { label: "AL ALZA", icon: "▲▲", color: "#2E9E44" },
  buen: { label: "BUEN RITMO", icon: "▲", color: "#2E6ED6" },
  est: { label: "ESTANCADO", icon: "—", color: "#B08900" },
  caida: { label: "EN CAÍDA", icon: "▼", color: "#D9483B" },
};
const formFromPct = (p) => (p >= 110 ? "alza" : p >= 95 ? "buen" : p >= 70 ? "est" : "caida");

/* storage */
async function stGet(key) { try { const r = localStorage.getItem("futabita:" + key); return r ? JSON.parse(r) : null; } catch (e) { return null; } }
async function stSet(key, val) { try { localStorage.setItem("futabita:" + key, JSON.stringify(val)); } catch (e) { console.error("storage", e); } }

/* IA nutrición */
const toNum = (v) => { const n = parseFloat(String(v).replace(",", ".").replace(/[^\d.]/g, "")); return Number.isFinite(n) ? Math.round(n) : null; };
/* /api/estimate ya devuelve el resultado limpio: aquí solo se valida.
   501 = sin clave configurada -> la UI ofrece entrada manual. */
async function estimateNutrition(text) {
  const res = await fetch("/api/estimate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: text.slice(0, 200) }),
  });
  if (res.status === 501) throw new Error("no-ia");
  const d = await res.json().catch(() => ({}));
  if (!res.ok || d.error) throw new Error(d.error === "no-food" ? "no-food" : "bad-numbers");
  const kcal = toNum(d.kcal), prot = toNum(d.prot);
  if (kcal == null || prot == null) throw new Error("bad-numbers");
  return { name: String(d.name || text).slice(0, 40), kcal: Math.max(0, kcal), prot: Math.max(0, prot) };
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
  /* gym: crear estructura en partidas anteriores al módulo y compactar sesiones antiguas */
  out.gym = pruneGym({ ...emptyGym(), ...(out.gym || {}) });
  /* migración al sistema de personajes: la primera vez se crea la cola de diálogos
     y las ofertas que quedaran pendientes en el chat antiguo pasan a Elisa */
  if (out.phase === "main" && out.player) {
    if (!out.squad || !out.squad.length) out.squad = makeSquad();
    if (!out.npcQueue) {
      out.npcQueue = [];
      out.captain = "López";
      (out.messages || []).forEach((m) => {
        if (m && m.kind === "offer" && m.status === "pending" && m.offer)
          out.npcQueue.push({ id: m.id, npc: "elisa", mood: "idle", text: m.text, kind: "offer", offer: m.offer });
      });
    }
  }
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
  if (log.gym) {
    gains.FIS += 22; gains.FUE += 6; if (log.gymProgress) gains.FUE += 18;
    /* bonus por la sesión registrada en el módulo de gym (techo ~+13 XP).
       Los días marcados a mano o de versiones antiguas no traen estos campos y no puntúan extra. */
    const gr = log.gymGroups || [];
    if (gr.some((x) => ["pierna", "espalda"].includes(x))) gains.FIS += 4;
    if (gr.some((x) => ["pecho", "hombro", "brazo"].includes(x))) gains.FUE += 4;
    if (gr.some((x) => ["core", "cardio"].includes(x))) gains.RES += 4;
    if ((log.gymMin || 0) >= 40) gains.RES += 4;
    if (log.gymPR) gains.MEN += 5;
  }
  /* día de descanso bien cumplido: trabajo ligero, FIS no se congela entre gimnasios */
  if ((form === "alza" || form === "buen") && !isGymDay) gains.FIS += 5;
  if (log.sleep != null && log.sleep >= g.sleepGoal) gains.REC += 10;
  gains.MEN += (log.habitsDone || []).length * 6;
  /* MEN pasiva: la constancia también es mentalidad */
  let flatMEN = 0;
  if ((log.meals || []).length > 0) flatMEN += 3; /* registrar comida: siempre suma, sin multiplicador */
  if (form === "alza" || form === "buen") gains.MEN += 4;
  /* multiplicador por racha: se calcula con la racha ENTRANTE (los días previos ya
     acumulados), ANTES de recalcularla para hoy — así el día que continúa la racha
     disfruta del bonus que generaron los anteriores, y romperla hoy no borra
     retroactivamente el bonus del día que estás cerrando. Es el mismo valor que
     muestra la UI en el momento de registrar. */
  const sMult = streakMultOf(player.streak);
  let streak = player.streak || 0;
  if (form === "alza" || form === "buen") { streak += 1; gains.RES += 7; if (streak % 7 === 0) gains.RES += 25; }
  else if (form === "caida") streak = 0;
  const stats = { ...player.stats }, xp = { ...player.xp };
  const ups = [];
  STAT_KEYS.forEach((k) => {
    /* forma y racha multiplican juntas; la XP pasiva de MEN (flatMEN) queda fuera de
       AMBOS multiplicadores a propósito: es la recompensa fija por constancia de uso
       y no queremos tocar ese equilibrio */
    xp[k] = (xp[k] || 0) + Math.round(gains[k] * mult * sMult) + (k === "MEN" ? flatMEN : 0);
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
/* pesos de categoría: "squad" ≈ prensa+afición+club para que el vestuario suene tanto como los medios */
const CAT_W = { press: 2.2, fan: 2.2, social: 2, club: 1.6, coach: 1.4, cap: 1.4, agent: 1, squad: 6 };

/* compañeros de vestuario: 4 fijos por club, con personalidad. Cambian al fichar por otro equipo. */
const SQUAD_POOL = [
  { name: "Chino Vega", tag: "el gracioso", bio: "Capaz de sacar un meme de cualquier derrota. El vestuario se ríe hasta cuando no toca." },
  { name: "Rafa Ortiz", tag: "el veterano", bio: "15 temporadas en las piernas. Habla poco, pero cuando habla, todos callan." },
  { name: "Andresito", tag: "el canterano", bio: "Subió del filial con 18 años y todavía pide permiso para sentarse en el bus." },
  { name: "Piru Gómez", tag: "el portero", bio: "Dice que los porteros están locos y lo demuestra a diario. Manos de piedra, corazón de oro." },
  { name: "Kiko Ferrer", tag: "el segundo capitán", bio: "El que organiza las cenas, los regalos y las multas. Sin él, esto sería un caos." },
  { name: "Samu Vidal", tag: "el silencioso", bio: "Dos frases por semana, pero corre por tres. El míster lo pondría hasta lesionado." },
  { name: "Toni Roca", tag: "el cocinillas", bio: "Lleva táperes al vestuario y jura que su arroz cambia partidos. Nadie lo discute ya." },
  { name: "Lucho Ibarra", tag: "el filósofo", bio: "Cita a entrenadores muertos y a su abuelo a partes iguales. Acierta más que el VAR." },
];
const makeSquad = () => pickN(SQUAD_POOL, 4);
const COND = {
  good: (c) => c.good, hot: (c) => c.hot, bad: (c) => c.bad,
  starter: (c) => c.starter, benched: (c) => c.benched,
  hasGoals: (c) => c.hasGoals, scorer: (c) => c.scorer,
  seasonStart: (c) => c.seasonStart, seasonEnd: (c) => c.seasonEnd,
  win: (c) => c.win, loss: (c) => c.loss, kgUp: (c) => c.kgUp, derbiSoon: (c) => c.derbiSoon,
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
  { c: "press", t: "Recta final de la temporada {season}: {player} suma {goals} goles y {assists} asistencias en {league}.", w: "seasonEnd" },
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
  { c: "agent", t: "He rechazado una entrevista por ti. Era una encerrona para hablar mal del vestuario. Confía en mí." },
  { c: "agent", t: "Mi mujer ya te reconoce cuando sales por la tele. Cuando eso pasa, buena señal. Nunca falla.", w: "good" },
  { c: "agent", t: "Recuerda: los contratos se firman con la cabeza fría y los partidos se juegan con la sangre caliente." },
  /* ---- VESTUARIO (compañeros: hablan directamente, tono de grupo de amigos) ---- */
  { c: "squad", t: "Cuidado mañana en el rondo, que el míster está contando los toques. Avisado quedas 😂" },
  { c: "squad", t: "Pásame los apuntes de la charla táctica, me quedé dormido con los ojos abiertos 💀" },
  { c: "squad", t: "El míster ha sonreído hoy. Repito: EL MÍSTER HA SONREÍDO. Estado de alerta máxima." },
  { c: "squad", t: "Bus a las 9 en punto mañana. El último en llegar paga los cafés, y llevo tres semanas pagando yo." },
  { c: "squad", t: "¿Entrenamos suave mañana? — pregunta que hago ya sabiendo la respuesta 🥲" },
  { c: "squad", t: "Se rumorea que si ganamos el próximo, el presi paga paella para todos. Yo juego la final de mi vida por una paella." },
  { c: "squad", t: "El utillero ha bautizado a la lavadora del club como 'La Bestia'. Día raro hoy en la ciudad deportiva." },
  { c: "squad", t: "Alguien ha vuelto a dejar sus espinilleras en mi taquilla. No doy nombres pero empieza por {player} 😒" },
  { c: "squad", t: "El fisio dice que tienes los isquios de piedra. Eso es bueno, ¿no? Yo por si acaso le he dicho que enhorabuena." },
  { c: "squad", t: "Hoy en el gimnasio has dejado el listón altísimo. Mañana me toca sufrir a mí por tu culpa.", w: "good" },
  { c: "squad", t: "Se te ve cada semana más fino, {player}. Sigue así y nos subes el nivel a todos.", w: "good" },
  { c: "squad", t: "El nuevo del filial te tiene de ídolo. Le he dicho que tienes los pies planos, para bajarle el hype.", w: "good" },
  { c: "squad", t: "Mi madre te vio en el último partido y dice que eres su nuevo favorito. Traición en mi propia casa.", w: "starter" },
  { c: "squad", t: "Partidazo el tuyo, crack. Esto se celebra: invitas tú, ¿no? 🙃", w: "starter" },
  { c: "squad", t: "GUARDAD EL VÍDEO DEL GOL. Lo quiero de fondo de pantalla ya 😂", w: "scorer" },
  { c: "squad", t: "Ánimo con la semana, {player}. Los baches se pasan pedaleando. Lo dice mi abuelo, y mi abuelo nunca falla.", w: "bad" },
  { c: "squad", t: "Te he visto en el banquillo con cara de pocos amigos. Tranquilo, de ahí también se vuelve. Palabra.", w: "benched" },
  { c: "squad", t: "Primera jornada de la temporada {season}. Nervios, olor a césped nuevo y el míster con libreta nueva. Empezamos.", w: "seasonStart" },
  /* ---- PRENSA (nuevas, más color) ---- */
  { c: "press", t: "Un exárbitro analiza en televisión el estilo de {player}: 'Es de los que no protestan. Rara avis'." },
  { c: "press", t: "El programa de radio nocturno dedica veinte minutos a debatir si {player} debería llevar el 10." },
  { c: "press", t: "Estadística curiosa: el {club} no pierde cuando {player} sonríe en el calentamiento, según un aficionado con demasiado tiempo libre." },
  { c: "press", t: "Un periodista asegura haber visto a {player} firmando autógrafos bajo la lluvia durante media hora." },
  { c: "press", t: "El quiosco frente al estadio agota los cromos de {player}. 'Primera vez en la historia', jura el dueño.", w: "good" },
  { c: "press", t: "Un medio nacional incluye a {player} en su lista de 'nombres que van a sonar'.", w: "hot" },
  { c: "press", t: "Polémica suave del día: ¿fue asistencia o centro-chut lo de {player}? El debate sigue abierto.", w: "hasGoals" },
  { c: "press", t: "La rueda de prensa del míster del {club} duró cuatro minutos. Récord histórico. 'Todo va bien', dijo. Y se fue.", w: "good" },
  /* ---- AFICIÓN (nuevas) ---- */
  { c: "fan", t: "Un abonado del {club} de 82 años asegura que {player} le recuerda 'a los de antes, a los que se manchaban'." },
  { c: "fan", t: "La peña 'Los Irreductibles' del {club} ha colgado una pancarta con el nombre de {player}.", w: "good" },
  { c: "fan", t: "Un aficionado llevó al último partido un cartel que decía: 'Mi perro se llama {player}'. Historia del club.", w: "starter" },
  { c: "fan", t: "En la grada se debate qué fue mejor: el gol o la carrera de {player} para celebrarlo.", w: "scorer" },
  { c: "fan", t: "Los bares cercanos al estadio del {club} lo confirman: los días de partido se llenan más desde que juega {player}.", w: "good" },
  { c: "fan", t: "Una peña del {club} promete una empanada gigante si el equipo acaba arriba. La moral está por las nubes." },
  /* ---- REDES (nuevas) ---- */
  { c: "social", t: "Un hilo viral analiza frame a frame el control orientado de {player}. 47 tuits. Nadie lo pidió. Todos lo leyeron.", w: "good" },
  { c: "social", t: "La cuenta parodia del {club} publica: 'Confirmamos el fichaje de {player} por el Real Madrid de la vida'. 2.000 me gusta." },
  { c: "social", t: "Un streamer famoso menciona a {player} en directo y el chat se vuelve absolutamente loco.", w: "hot" },
  { c: "social", t: "Se viraliza un audio del vestuario cantando tras la victoria. Se escucha a {player} desafinar. Internet no perdona.", w: "starter" },
  { c: "social", t: "Alguien ha creado un filtro con la celebración de {player}. Lo usan hasta aficionados del club rival.", w: "scorer" },
  { c: "social", t: "El community del {club} sube un meme del entrenamiento y etiqueta a {player}. Ese becario merece un aumento." },
  /* ---- CLUB (nuevas) ---- */
  { c: "club", t: "El {club} anuncia homenaje a las peñas en el próximo partido. Se espera un ambientazo." },
  { c: "club", t: "El {club} presenta su nueva ropa de entrenamiento. Las tallas vuelan en la tienda oficial." },
  { c: "club", t: "El {club} informa: el césped ha sido resembrado. El jardinero pide 'que lo pisen con cariño'." },
  { c: "club", t: "El {club} lanza descuentos de abono para menores de 14 años. La cantera también se hace en la grada." },
  /* ---- ENTRENADOR (nuevas) ---- */
  { c: "coach", t: "Hoy he puesto tres jugadas tuyas en la sesión de vídeo. De las buenas, ¿eh? No te acostumbres.", w: "good" },
  { c: "coach", t: "Me ha llamado tu antiguo entrenador para preguntar por ti. Le he dicho la verdad: que estás creciendo." },
  { c: "coach", t: "Mañana rondo de los serios. Si me quitas el balón, te dejo elegir la música del vestuario una semana." },
  { c: "coach", t: "Descansa la mente hoy. Un jugador fresco piensa dos jugadas por delante del resto." },
  { c: "coach", t: "No me gusta repetir elogios, así que léelo dos veces: bien. Muy bien.", w: "hot" },
  /* ---- CAPITÁN (nuevas) ---- */
  { c: "cap", t: "Medio equipo apuntado al pádel del jueves. Tú juegas conmigo, no acepto un no por respuesta." },
  { c: "cap", t: "Hoy doblo sesión de vídeo. Si quieres te paso mis notas, aunque te aviso: mi letra es de médico." },
  { c: "cap", t: "Cuando era joven me habría venido bien un espejo como tú. Sigue currando así.", w: "hot" },
  { c: "cap", t: "El de seguridad de la puerta 3 siempre me pregunta por ti. Le caes mejor que yo y no lo entiendo 😂", w: "good" },
  { c: "cap", t: "Semana dura, ¿eh? Mañana te reto a la diana en el entreno. Si me ganas, café pagado.", w: "bad" },
  /* ---- VESTUARIO INTERACTIVO: preguntas con respuestas a elegir ---- */
  { c: "squad", t: "¿Pádel el jueves después del entreno? Faltan dos.", replies: [
    { t: "Claro, cuenta conmigo", r: ["¡GRANDE! Te espero con la pala buena 🎾", "Eso es. Luego no llores cuando te gane 😏"] },
    { t: "Va, pero pago yo la última", r: ["Apuntado queda, invita el crack 😎", "Con compañeros así da gusto, oye"] }] },
  { c: "squad", t: "¿Quién trae el desayuno post-entreno mañana?", replies: [
    { t: "Yo me encargo", r: ["Un señor. El vestuario no lo olvida 🫡", "Así se lidera, sí señor"] },
    { t: "Que le toque al nuevo", r: ["JAJAJA clásico. Aprobado por unanimidad 😂", "El nuevo aún no sabe dónde se ha metido"] }] },
  { c: "squad", t: "El míster pregunta quién quiere tirar los penaltis esta temporada. ¿Te apuntas?", replies: [
    { t: "Yo los tiro", r: ["Valiente. Me gusta 🔥 Se lo digo al míster", "Anotado. Presión máxima, crack"] },
    { t: "Mejor que los tire el capi", r: ["Prudente. El capi lo agradece 🫡", "Ok, pero el día que falle uno te lo recuerdo 😂"] }] },
  { c: "squad", t: "Estamos montando la playlist del vestuario. ¿Qué mandas?", replies: [
    { t: "Algo para motivar", r: ["Eso es, caña para salir a morder 🤘", "Aprobado por el DJ oficial (o sea, yo)"] },
    { t: "Reggaeton clásico", r: ["JAJA el vestuario entero perreando en el calentamiento 😂", "Clásico nunca falla. Dentro."] }] },
  { c: "squad", t: "¿Cine el domingo con el grupo? Vamos a ver la de acción.", replies: [
    { t: "Me apunto", r: ["Palomitas a medias entonces 🍿", "Este equipo también hace piña fuera. Me gusta."] },
    { t: "Descanso en casa", r: ["Descansa, máquina. El lunes te quiero fresco", "Ok abuelo 😂 te contamos el final"] }] },
  { c: "squad", t: "Piques de FIFA esta noche en casa del capi. ¿Vienes?", replies: [
    { t: "Voy y os gano a todos", r: ["JAJAJA la confianza del killer 😎 te espero", "Anotado. Si pierdes, mañana corres el doble"] },
    { t: "Paso, mañana hay que rendir", r: ["Profesional total. Por eso juegas tú y yo chupo banquillo 😂", "Respeto. El míster estaría orgulloso"] }] },
  /* ---- MEMORIA NARRATIVA: referencias a tu historial real ---- */
  { c: "press", t: "La estadística del día: {streak} días seguidos al máximo nivel. La regularidad de {player} ya es marca de la casa.", w: "hot" },
  { c: "cap", t: "{streak} días seguidos currando como un animal. Ni yo en mis mejores tiempos, chaval.", w: "hot" },
  { c: "cap", t: "Todavía me dura la sonrisa del partido contra el {lastRival}. Así se compite 😄", w: "win" },
  { c: "coach", t: "Lo del {lastRival} ya está analizado y enterrado. Hoy toca levantar la cabeza y currar.", w: "loss" },
  { c: "squad", t: "He vuelto a ver los highlights contra el {lastRival}. Salgo espectacular de fondo 😂", w: "win", who: "el gracioso" },
  { c: "press", t: "La transformación física de {player} es un hecho: +{kg} kg desde su llegada. El gimnasio del {club} tiene inquilino fijo.", w: "kgUp" },
  { c: "squad", t: "Tras lo del {lastRival}, mi consejo: los partidos se olvidan en 24 horas, los buenos y los malos. Mañana, a lo nuestro.", w: "loss", who: "el veterano" },
  /* ---- DERBI: anticipación del partidazo ---- */
  { c: "press", t: "🔥 Semana de PARTIDAZO: el {club} se mide al {derbiRival} y la ciudad no habla de otra cosa.", w: "derbiSoon" },
  { c: "fan", t: "La grada del {club} prepara un recibimiento especial para el duelo contra el {derbiRival}. Se palpa el ambiente.", w: "derbiSoon" },
  { c: "squad", t: "Esta semana toca el {derbiRival}... En estos partidos es cuando se hace uno grande. Dormid bien todos.", w: "derbiSoon", who: "el veterano" },
];

const fillTpl = (str, c) => str.replace(/\{(\w+)\}/g, (_, k) => (c[k] != null ? String(c[k]) : ""));

function flavorCtx(g) {
  const p = g.player, s = g.season;
  const ovr = calcOVR(p.stats);
  const hist = g.matchHistory || [];
  const last = hist[hist.length - 1];
  /* ojo: slice(-0) devolvería el historial entero, así que en jornada 0 la temporada va vacía */
  const played = s && s.matchday > 0 ? hist.slice(-s.matchday) : [];
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
  /* al acabar la última jornada la temporada se reinicia al instante, así que "fin de temporada"
     se refiere a la recta final (aún jugable), no a un estado que casi nunca existiría */
  c.seasonStart = s ? s.matchday <= 1 : true;
  c.seasonEnd = s ? s.matchday >= SEASON_LENGTH - 2 : false;
  /* memoria narrativa: hechos reales del historial disponibles como variables */
  const wl = p.weightLog || [];
  const gained = wl.length ? wl[wl.length - 1].kg - p.weight0 : 0;
  c.kg = gained.toFixed(1);
  c.streak = p.streak || 0;
  c.lastRival = last ? last.rival : "el último rival";
  c.win = last ? last.res === "V" : false;
  c.loss = last ? last.res === "D" : false;
  c.kgUp = gained >= 1;
  c.derbiSoon = !!s && s.matchday < SEASON_LENGTH && s.matchday + 1 === derbiJornadaOf(s);
  c.derbiRival = s ? s.rivals[s.matchday % s.rivals.length] : "";
  return c;
}

function senderFor(cat, g) {
  if (cat === "coach") return "Elisa"; /* Elisa hace también de entrenadora */
  if (cat === "cap") return (g.captain || "El capitán") + " · Capitán";
  if (cat === "agent") return "Tu agente";
  if (cat === "squad") return pick(g.squad && g.squad.length ? g.squad : SQUAD_POOL).name + " · Vestuario";
  if (cat === "press") return pick(PRESS);
  if (cat === "fan") return "📣 La Grada";
  if (cat === "social") return pick(["📱 Redes", "🐦 Timeline", "📲 Peña digital"]);
  if (cat === "club") return "📢 " + g.club.name;
  return pick(PRESS);
}

/* elige n frases distintas y ponderadas que tengan sentido hoy.
   - no repite templates usados recientemente (g.recentTpl)
   - amortigua la categoría ya elegida en esta tanda para que salga variado */
function pickFlavor(g, n, cats) {
  const c = flavorCtx(g);
  const recent = g.recentTpl || [];
  const pool = FLAVOR.filter((f) => (!cats || cats.includes(f.c)) &&
    (!f.w || (COND[f.w] && COND[f.w](c))) && !recent.includes(f.t));
  const out = [];
  const used = new Set();
  const catN = {};
  const wOf = (f) => (CAT_W[f.c] || 1) * Math.pow(0.25, catN[f.c] || 0);
  let guard = 0;
  while (out.length < n && used.size < pool.length && guard < 120) {
    guard++;
    let total = 0;
    for (let i = 0; i < pool.length; i++) if (!used.has(i)) total += wOf(pool[i]);
    if (total <= 0) break;
    let r = Math.random() * total, idx = -1;
    for (let i = 0; i < pool.length; i++) {
      if (used.has(i)) continue;
      r -= wOf(pool[i]);
      if (r <= 0) { idx = i; break; }
    }
    if (idx < 0) break;
    used.add(idx);
    const f = pool[idx];
    catN[f.c] = (catN[f.c] || 0) + 1;
    /* frases con "who": las dice el compañero cuyo tag encaja (el gracioso bromea, el veterano aconseja) */
    const from = f.c === "squad" && f.who && g.squad && g.squad.length
      ? (g.squad.find((s) => s.tag === f.who) || pick(g.squad)).name + " · Vestuario"
      : senderFor(f.c, g);
    out.push({ from, text: fillTpl(f.t, c), t: f.t, replies: f.replies });
  }
  return out;
}

/* eventos espontáneos: pequeñas situaciones de un día contadas en 2 mensajes
   coordinados desde chats distintos. Solo narrativa — cero mecánicas, cero XP. */
const EVENTS = [
  { msgs: [
    { c: "club", t: "El {club} convoca mañana la sesión de fotos oficial de la plantilla. Se ruega puntualidad y peinado razonable." },
    { c: "squad", t: "Llevo toda la noche eligiendo peinado para la foto oficial. Tú hazme el favor de no salir mejor que yo 😤" }] },
  { msgs: [
    { c: "squad", t: "El utillero ha encontrado unas botas sin dueño al fondo del vestuario. Dice que huelen a 2019." },
    { c: "cap", t: "Si las botas del misterio son tuyas, reclámalas antes de que el utillero las jubile con honores." }] },
  { msgs: [
    { c: "cap", t: "Cena de equipo el viernes. Sitio de confianza, menú cerrado y móviles en el centro de la mesa: el primero que lo mire, paga." },
    { c: "squad", t: "A la cena del viernes voy con hambre de tres semanas. Avisad al restaurante, que se preparen." }] },
  { msgs: [
    { c: "press", t: "El {club} confirma que {player} atenderá a los medios esta semana. Expectación por escuchar a su jugador más discreto." },
    { c: "coach", t: "Mañana hablas con la prensa. Sé tú mismo: humilde y claro. Y si te preguntan por mí, di que soy un genio incomprendido." }] },
  { msgs: [
    { c: "fan", t: "Un niño esperó dos horas tras el entrenamiento del {club} para regalarle un dibujo a {player}. El dibujo ya es leyenda en la peña." },
    { c: "coach", t: "He visto lo del chaval del dibujo. Eso también es este oficio. Me ha gustado cómo lo trataste." }] },
  { msgs: [
    { c: "squad", t: "OFICIAL: multa de vestuario para el que ha llegado tarde hoy. No diré nombres, pero su nombre empieza por 'el portero'." },
    { c: "cap", t: "Recordatorio del capi: la caja de multas paga la cena de fin de temporada. Casi que seguid llegando tarde, no sé." }] },
  { msgs: [
    { c: "club", t: "El presidente del {club} visitó hoy el entrenamiento y saludó uno a uno a todos los jugadores." },
    { c: "squad", t: "El presi me ha dado la mano tan fuerte que todavía la siento. Menudo carisma. Dan ganas de ganarle una liga." }] },
  { msgs: [
    { c: "club", t: "Los benjamines del {club} visitaron hoy la ciudad deportiva y entrenaron junto al primer equipo." },
    { c: "squad", t: "Un benjamín me ha hecho un caño. Estoy pensando en retirarme. No es broma. (Es broma. Pero me ha dolido.)" }] },
  { msgs: [
    { c: "social", t: "Una productora propone un mini-documental sobre el vestuario del {club}. El club lo está estudiando." },
    { c: "squad", t: "Si hacen el documental, pido salir en cámara de mi mejor perfil. Que es el izquierdo. Obviamente." }] },
  { msgs: [
    { c: "club", t: "Por la lluvia, el {club} traslada el entrenamiento de mañana al campo cubierto." },
    { c: "squad", t: "Entreno bajo techo mañana = balón parado y risas garantizadas. Confirmad asistencia al show." }] },
  { w: "good", msgs: [
    { c: "press", t: "El técnico del {club}, sobre {player}: 'Cada semana me pide más vídeo. Ojalá tener veinte como él'." },
    { c: "squad", t: "El míster hablando bien de ti en rueda de prensa… ¿qué le has dado? Dime el truco 😂" }] },
  { w: "bad", msgs: [
    { c: "squad", t: "Hoy el vestuario estaba muy callado. Mañana lo arreglamos entre todos, ¿vale? Aquí no se hunde nadie solo." },
    { c: "cap", t: "He pedido al míster empezar mañana con un rondo de risas. Cabeza fría y a remar juntos." }] },
];

function pickEvent(g) {
  const c = flavorCtx(g);
  const pool = EVENTS.filter((e) => !e.w || (COND[e.w] && COND[e.w](c)));
  if (!pool.length) return null;
  const ev = pick(pool);
  return ev.msgs.map((m) => ({ from: senderFor(m.c, g), text: fillTpl(m.t, c), t: m.t }));
}

/* ============================================================
   PERSONAJES (NPC) · retratos, voces y enrutado de mensajes
   Los mensajes en 2ª persona (entrenador, vestuario, mánager, Yuna) se
   convierten en diálogos con retrato y voz; los de 3ª persona (prensa,
   afición, redes, club) pasan a ser artículos del periódico diario.
   ============================================================ */
/* Elisa absorbe al antiguo Entrenador: es mánager Y entrenadora a la vez.
   Ya no existe un personaje "coach" aparte. */
const NPCS = {
  lopez: { name: "López", color: "#D65A2E", voice: "/audio/vozchico02.mp3",
    arts: { idle: "/images/Lopez_idle.webp", happy: "/images/Lopez_happy.webp" }, def: "idle" },
  /* en Yuna, "angry" es en realidad SONROJADA: es su cara de tsundere pillada en falta */
  yuna: { name: "Yuna", color: "#D4537E", voice: "/audio/vozchica01.mp3",
    arts: { idle: "/images/Yuna_Idle.webp", happy: "/images/Yuna_happy.webp", angry: "/images/Yuna_angry.webp" }, def: "idle" },
  /* en Elisa, "angry" es su cara de decepción contenida: para semanas flojas o cuando habla de entrenadora estricta */
  elisa: { name: "Elisa", color: "#2E6ED6", voice: "/audio/vozchica02.mp3",
    arts: { idle: "/images/Elisa_idle.webp", happy: "/images/Elisa_happy.webp", angry: "/images/Elisa_angry.webp" }, def: "idle" },
};
const senderToNpc = (from) => {
  if (from === "Entrenador" || from === "Tu agente" || from === "Elisa") return "elisa";
  if (from === "Yuna") return "yuna";
  if (from === "López" || from.includes("Capitán") || from.includes("· Vestuario")) return "lopez";
  return null; /* prensa/afición/redes/club -> periódico */
};
const paperSec = (from) =>
  from === "📣 La Grada" ? "LA GRADA"
  : from === "📱 Redes" || from === "🐦 Timeline" || from === "📲 Peña digital" ? "REDES"
  : from.startsWith("📢") ? "EL CLUB" : "ACTUALIDAD";
/* estado de ánimo del retrato cuando la plantilla no lo trae explícito */
const moodOf = (npc, text) => {
  if (/😂|😄|🙌|🎉|😎|JAJA|jaja|❤️/.test(text)) return "happy";
  return "idle";
};

/* --- voces: se trocea el clip del personaje en sílabas al azar mientras escribe --- */
let VOICES_ON = true;
const AUDIO = { ctx: null, buf: {}, live: new Set(), last: 0 };
async function loadVoice(url) {
  if (url in AUDIO.buf) return;
  AUDIO.buf[url] = null;
  try {
    if (!AUDIO.ctx) AUDIO.ctx = new (window.AudioContext || window.webkitAudioContext)();
    const r = await fetch(url);
    AUDIO.buf[url] = await AUDIO.ctx.decodeAudioData(await r.arrayBuffer());
  } catch (e) { /* sin audio no pasa nada: el diálogo funciona en silencio */ }
}
/* Un "blip" de voz. Tres cuidados para que no petardee:
   - throttle: como mucho uno cada 110 ms, aunque se escriban más letras
   - envolvente de volumen: cortar la onda en seco produce chasquidos
   - se registran las fuentes vivas para poder callarlas al cerrar el diálogo */
function babble(url) {
  const b = AUDIO.buf[url];
  if (!VOICES_ON || !AUDIO.ctx || !b) return;
  if (performance.now() - AUDIO.last < 110) return;
  AUDIO.last = performance.now();
  try {
    if (AUDIO.ctx.state === "suspended") AUDIO.ctx.resume();
    const t = AUDIO.ctx.currentTime, dur = 0.08;
    const s = AUDIO.ctx.createBufferSource();
    s.buffer = b;
    s.playbackRate.value = 0.96 + Math.random() * 0.12;
    const g = AUDIO.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.5, t + 0.014);
    g.gain.setValueAtTime(0.5, t + dur - 0.03);
    g.gain.linearRampToValueAtTime(0, t + dur);
    s.connect(g); g.connect(AUDIO.ctx.destination);
    s.start(t, Math.random() * Math.max(0, b.duration - dur - 0.05), dur);
    s.stop(t + dur);
    AUDIO.live.add(s);
    s.onended = () => AUDIO.live.delete(s);
  } catch (e) {}
}
/* Crujido de papel al desplegar el periódico. Sintetizado (ruido blanco pasado por
   filtros y con dos golpes de crujido), así no hay que cargar ningún archivo. */
function paperRustle() {
  if (!VOICES_ON) return;
  try {
    if (!AUDIO.ctx) AUDIO.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (AUDIO.ctx.state === "suspended") AUDIO.ctx.resume();
    const ctx = AUDIO.ctx, t = ctx.currentTime, dur = 0.46;
    const n = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 2800; bp.Q.value = 0.6;
    const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 1100;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.17, t + 0.035);   /* primer tirón */
    g.gain.exponentialRampToValueAtTime(0.045, t + 0.15);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.22);    /* segundo crujido */
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp); bp.connect(hp); hp.connect(g); g.connect(ctx.destination);
    src.start(t); src.stop(t + dur);
    AUDIO.live.add(src);
    src.onended = () => AUDIO.live.delete(src);
  } catch (e) {}
}

/* corta cualquier voz en curso: al cerrar el diálogo no debe seguir sonando nada */
function hushVoices() {
  AUDIO.live.forEach((s) => { try { s.stop(); } catch (e) {} });
  AUDIO.live.clear();
}

/* --- YUNA · fan tsundere del Barça; conoce tus números "por sus fuentes" --- */
/* escena de dos frases: se presenta tranquila y luego se le escapa el sonrojo */
const YUNA_INTRO_BEATS = [
  { m: "idle", t: "¿Tú eres el nuevo del {club}, no? ...Yo pasaba por aquí. Soy Yuna. Fan del Barça, para que lo sepas: MI equipo juega en el Camp Nou. El tuyo es... aceptable." },
  { m: "angry", t: "P-pero habéis ganado, así que... bien. Supongo. ¡No pienses que he venido a verte a TI! Solo pasaba. Por aquí. Casualmente." },
];
const YUNA_POOL = [
  /* --- sonrojada (angry): pillada en falta, cumplidos que se le escapan --- */
  { w: "win", beats: [
    { m: "idle", t: "Vi el partido entero. Ayer, cuando jugasteis." },
    { m: "angry", t: "Y grité. En mi habitación. Sola. ...¡No te hagas ilusiones! Grité por el ESPECTÁCULO. El deporte rey. Eso es todo." }] },
  { w: "benched", beats: [
    { m: "idle", t: "Me he enterado de que te dejaron en el banquillo el otro día." },
    { m: "angry", t: "¡¿BANQUILLO?! ¿Tu míster está ciego o qué le pasa?! ...N-no es que fuera a verte a TI. Fui a ver el partido. El fútbol. ¡EL DEPORTE!" }] },
  { w: "scorer", beats: [
    { m: "idle", t: "He estado revisando las estadísticas de la jornada. Por curiosidad periodística, nada más." },
    { m: "angry", t: "{goals} goles. Los tengo apuntados. Con la fecha. Y el minuto. ¡P-porque soy periodista amateur! Es documentación. DOCUMENTACIÓN." }] },
  { w: "kgUp", beats: [
    { m: "idle", t: "Te he visto entrenar esta semana desde la grada." },
    { m: "angry", t: "Estás más... fuerte. FÍSICAMENTE, digo. Para el fútbol. Es un análisis técnico totalmente objetivo. ¿P-por qué me miras así?" }] },
  { w: "hot", beats: [
    { m: "idle", t: "Llevo la cuenta de tus entrenamientos. Para mi análisis de fan seria, que conste." },
    { m: "angry", t: "{streak} días seguidos cuidándote como un profesional... N-no es que te vigile, ¿eh? Tengo mis fuentes. Una fan seria hace su trabajo y punto." }] },
  { beats: [
    { m: "idle", t: "Oye. Esto es tuyo. Y no me mires así, que es solo lana sobrante." },
    { m: "angry", t: "Es una bufanda del {club}. Sobraba lana del Barça, ¿vale? No la hice pensando en ti. ...Es tu talla, por cierto." }] },
  { beats: [
    { m: "idle", t: "Alguien del insti dijo hoy que 'te sigo demasiado' y le contesté que soy analista deportiva." },
    { m: "angry", t: "Luego me pasé la tarde roja. ¡Por el enfado! Solo por eso. No por otra cosa." }] },
  { beats: [
    { m: "idle", t: "Oye, una pregunta hipotética sobre tu futuro, para ir asentando bases." },
    { m: "angry", t: "S-si algún día fichas por el Barça y te olvidas de mí, te juro que voy al Camp Nou solo para abuchearte. ...No lo haría. Pero podría. Tenlo presente." }] },
  /* --- feliz --- */
  { w: "good", beats: [
    { m: "idle", t: "He estado mirando cifras de fichajes del Barça. Simple curiosidad de aficionada." },
    { m: "happy", t: "Media de {ovr}... el Barça ficha gente de 89 para arriba, ¿sabes? Te queda camino. Pero llegarás. Lo sé desde... d-desde un punto de vista puramente estadístico." }] },
  { beats: [
    { m: "idle", t: "Oye, tengo una petición a futuro. Quede constancia desde ya, por si acaso." },
    { m: "happy", t: "Cuando juegues en el Camp Nou —que pasará— más te vale conseguirme una entrada. Primera fila. Es lo MÍNIMO después de todo mi apoyo incondicional. Digo... ocasional." }] },
  { w: "win", beats: [
    { m: "idle", t: "Vengo a decirte algo y solo lo voy a decir una vez, así que escucha bien." },
    { m: "happy", t: "Has jugado bien. Muy bien. ...Ya está. No lo repito. Disfrútalo, que no pasa a menudo." }] },
  /* --- normal --- */
  { w: "loss", beats: [
    { m: "idle", t: "Perdisteis ayer. Ya lo sé, no hace falta que me lo repitas." },
    { m: "happy", t: "El Barça también pierde a veces y yo sigo aquí, así que no te voy a soltar ningún discurso. Mañana entrenas más fuerte y ya está. Confío en ti." }] },
  { w: "good", beats: [
    { m: "idle", t: "Pasé por la ciudad deportiva el otro día. Por casualidad. Vivo a cuarenta minutos, pero fue casualidad." },
    { m: "angry", t: "Entrenas más fuerte que antes. Se nota. Y no, no he ido a verte específicamente. ...Bueno, un poco sí. Ya está, lo he dicho." }] },
  { beats: [
    { m: "idle", t: "Mi abuela dice que hablo mucho de 'ese chico del {club}' en casa." },
    { m: "angry", t: "¡Hablo de FÚTBOL! Del deporte. En general. ...Cállate. No es lo que parece." }] },
  { beats: [
    { m: "idle", t: "El Barça empató ayer y estoy oficialmente de luto." },
    { m: "angry", t: "Así que hoy no tengo energía para fingir que tu equipo no me interesa. Mañana volvemos a la normalidad, no te acostumbres." }] },
  /* --- conversaciones más largas, con respuestas --- */
  { m: "idle", t: "Oye... tengo una duda. PURAMENTE táctica, para mi análisis, nada personal. ¿Prefieres jugar en casa, con tu gente, o fuera, sin presión?", replies: [
    { t: "En casa, con mi gente", r: ["Ah. Lógico. La grada empuja distinto cuando es la tuya... aunque la del Barça sigue siendo mejor, que conste.",
      "Buena respuesta. Anotado en mi cuaderno de... análisis táctico. Nada más que eso."] },
    { t: "Fuera, sin presión", r: ["Interesante. Poca gente admite eso en voz alta. ...Me gusta que no finjas ser quien no eres.",
      "Mentalidad fría, ¿eh? El Barça también rinde mejor fuera a veces. No es que os compare. Es un dato objetivo."] }] },
  { m: "angry", t: "M-mi amiga me vio el móvil con tu perfil abierto otra vez y ahora cree que 'somos algo'. ¡No somos NADA! Hago seguimiento profesional, como una periodista deportiva seria. ¿Tú qué le dirías a alguien que piensa eso?", replies: [
    { t: "Que tiene razón", m: "angry", r: ["¡¿QUÉ?! ...¡c-cállate! Eso no ha sido gracioso. Nada gracioso. Me voy. ME VOY YA.",
      "N-no digas eso ni en broma, mi corazón no está preparado para tus bromas a estas horas."] },
    { t: "Que solo somos amigos", m: "angry", r: ["...Sí. Eso. Amigos. Claro que sí. *silencio raro durante tres segundos* Bueno, me voy, que tengo cosas de fan. De fan del Barça. Adiós."] }] },
  { m: "idle", t: "Hoy en clase de historia hablamos de grandes rivalidades y, sin que nadie preguntara, me puse a explicar el Clásico durante diez minutos seguidos. El profesor ha tenido que pararme. No me arrepiento. La cultura es importante." },
  { m: "happy", w: "good", t: "He estado pensando... si algún día llegas de verdad a lo más alto, ¿te acordarás de la fan pesada que te seguía desde una grada de provincias? Es una pregunta hipotética. Totalmente hipotética, que conste.", replies: [
    { t: "Siempre me acordaré de ti", m: "angry", r: ["...n-no digas eso así, tan tranquilo. Casi me haces creer que lo dices en serio. Idiota."] },
    { t: "Depende de si dejas de ser pesada", m: "angry", r: ["¡OYE! ...vale, me lo merecía un poco. Pero solo un poco, ¿eh? Que quede claro."] }] },
  { w: "loss", beats: [
    { m: "idle", t: "El otro día perdisteis y vi a un grupo en el bus hablando mal de ti." },
    { m: "angry", t: "Les dije, cito textualmente, 'no tenéis ni idea de fútbol'. Y me bajé dos paradas antes de la mía porque no quería seguir la conversación. No fue por vergüenza. Fue por principios." }] },
  { m: "angry", t: "Te he traído esto. Es una bufanda del {club}. ¡No pongas esa cara de sorpresa! Sobraba lana de una del Barça, ¿vale? No la hice pensando en ti especialmente. ...Es tu talla, por si te lo preguntas.", replies: [
    { t: "Gracias, Yuna, de verdad", m: "angry", r: ["N-no hace falta que lo digas así de sincero, quedamos en que era un favor sin importancia. Pero... de nada.",
      "¡No te acostumbres! Fue un acto puntual de generosidad excepcional. Único e irrepetible."] },
    { t: "¿Seguro que no la hiciste para mí?", m: "angry", r: ["¡P-por supuesto que no! Yo... e-en fin, da igual. Úsala o no la uses, allá tú. Grosero."] }] },
];

/* --- ELISA · tu mánager: ánimo, despachos y fichajes.
   "angry" = decepción contenida, para cuando aflojas --- */
const ELISA_POOL = [
  { beats: [
    { m: "idle", t: "¡Buenas! No es nada urgente." },
    { m: "happy", t: "Solo decirte que se habla bien de ti en los despachos. Tú a lo tuyo, que de mover los hilos me encargo yo. 💼" }] },
  { w: "good", beats: [
    { m: "idle", t: "Esta semana he estado moviendo hilos por ahí, como siempre." },
    { m: "happy", t: "He colado tu nombre en dos conversaciones. En ninguna eras el protagonista... todavía. Sigue así y la tercera será la buena." }] },
  { w: "hot", beats: [
    { m: "idle", t: "Llevo revisando tu ficha toda la mañana, no sé si te lo había dicho." },
    { m: "happy", t: "¡{streak} días de racha! ¿Sabes lo fácil que es vender a un jugador constante? Me estás haciendo el trabajo regalado y no me voy a quejar." }] },
  { w: "scorer", beats: [
    { m: "idle", t: "Un apunte de mánager, con la calculadora en la mano." },
    { m: "happy", t: "{goals} goles esta temporada. Cada uno de esos vale dinero en la mesa de negociación, que lo sepas. Sigue firmando así." }] },
  { beats: [
    { m: "idle", t: "Recordatorio de mánager, apúntatelo si hace falta:" },
    { m: "idle", t: "los contratos se firman con la cabeza fría y los partidos se juegan con la sangre caliente. No mezclar, que te conozco." }] },
  { beats: [
    { m: "idle", t: "Hoy sin novedades del mercado." },
    { m: "idle", t: "A veces no pasa nada, y eso también es buena señal: significa que nadie duda de dónde tienes que estar ahora mismo." }] },
  { w: "bad", beats: [
    { m: "idle", t: "Necesito hablar contigo un momento, y no va a ser una charla cómoda." },
    { m: "angry", t: "Vamos a hablar claro, que para eso estoy. Esta semana no has estado. Yo puedo abrirte puertas, pero cruzarlas es cosa tuya... y hoy no las has cruzado." }] },
  { w: "benched", beats: [
    { m: "idle", t: "Hoy me han llamado un par de veces preguntando por ti." },
    { m: "angry", t: "Preguntando por qué no jugaste. ¿Y sabes qué? No tenía respuesta. No me gusta no tener respuesta. Arréglalo en el campo." }] },
  { w: "loss", beats: [
    { m: "idle", t: "He visto el partido de ayer con calma, sin prisas." },
    { m: "angry", t: "No por el resultado, esas cosas pasan... pero te he visto conformarte. Y eso no te lo había visto nunca. No me acostumbres." }] },
  /* --- conversaciones más largas, con respuestas: entrenadora + mánager en una sola persona --- */
  { m: "idle", t: "Vamos a hacer un repaso serio, estilo entrenadora-mánager: ¿cómo te sientes físicamente esta semana? Lo necesito para planificar tanto tu carga de entrenamiento como tu futuro fuera del campo.", replies: [
    { t: "Al cien por cien", r: ["Eso quiero oír. Entonces esta semana subimos el nivel de exigencia, que para eso estoy yo aquí.",
      "Perfecto. Apunto 'listo para todo' en tu ficha. Literal, lo escribo ahora mismo."] },
    { t: "Un poco cansado, la verdad", r: ["Gracias por decírmelo con sinceridad, eso también es profesionalidad. Ajustamos la carga y seguimos, sin dramas.",
      "Ok, anotado. El cuerpo manda, no el orgullo. Descansa lo que necesites, que luego te lo reclamo con intereses."] }] },
  { m: "happy", t: "Tengo una pregunta con segundas intenciones, de mánager: si mañana te llamara un grande de {league} con una oferta seria sobre la mesa, ¿qué me dirías?", replies: [
    { t: "Que lo estudiamos juntas", r: ["Esa es la respuesta que quería oír. Trabajo en equipo, así se llega lejos y sin sustos.",
      "Me gusta esa cabeza fría. Así es exactamente como se negocian los buenos contratos."] },
    { t: "Que dijeras que sí sin dudarlo", r: ["JAJA directo al grano, me gusta la ambición. Pero deja que negocie yo, que para eso cobro comisión.",
      "Con esas ganas vamos a hacer carrera los dos, ya lo verás, crack."] }] },
  { m: "angry", w: "bad", t: "Necesito preguntarte algo y quiero una respuesta honesta, no la que crees que quiero oír: ¿estás dando el máximo esta semana, o solo lo suficiente para que yo no te diga nada?", replies: [
    { t: "Lo máximo, te lo prometo", m: "idle", r: ["Te tomo la palabra. Pero las palabras se demuestran en el campo, no aquí conmigo. Vamos a verlo.",
      "Bien. Porque el potencial sin esfuerzo no le interesa a nadie, ni siquiera a mí."] },
    { t: "La verdad, no del todo", m: "idle", r: ["Al menos eres sincero, y eso lo respeto más que una excusa bonita. Mañana empezamos de cero. Pero de cero de verdad.",
      "Gracias por no mentirme. Ahora la pregunta importante es qué vas a hacer al respecto."] }] },
  { beats: [
    { m: "idle", t: "Sabes qué me gusta de ti como jugador? Que no necesito motivarte cada día. La mayoría de mi cartera sí, y créeme que lo intento con paciencia de santa." },
    { m: "happy", t: "Tú simplemente vienes y curras. Eso no se enseña, eso se trae de casa. Y no sabes lo poco frecuente que es eso en este oficio." }] },
  { w: "hot", beats: [
    { m: "idle", t: "Llevo {streak} días seguidos viéndote entrenar como si cada sesión fuera una final." },
    { m: "happy", t: "Como entrenadora te exijo esto siempre; como mánager, te digo que eso vale más que cualquier golazo suelto: es lo que hace que un contrato dure años y no meses." }] },
  { beats: [
    { m: "idle", t: "A veces me preguntan cómo puedo ser entrenadora y mánager a la vez sin volverme loca." },
    { m: "happy", t: "Fácil: en el campo exijo, fuera del campo negocio, y en los dos sitios cuido de los míos. Tú entras en esa categoría, para que lo sepas." }] },
];

/* --- LÓPEZ · capitán y colega de siempre; animado, gracioso, anécdotas de vestuario.
   Solo tiene idle/happy, nunca angry: no es su papel en el grupo. --- */
const LOPEZ_POOL = [
  { m: "idle", t: "Oye, pregunta seria de vestuario: ¿tú antes de un partido prefieres música a tope o silencio total? Llevamos meses discutiéndolo y necesito un voto de calidad.", replies: [
    { t: "Música a tope", r: ["¡ESO ES! Por fin alguien con criterio. Se lo digo al Chino, que lleva semanas votando silencio como un monje.",
      "Sabía que podía contar contigo. Nos vemos con los cascos puestos antes del próximo partido."] },
    { t: "Silencio, para concentrarme", r: ["Jo, tío, otro del bando del silencio. Bueno, respeto tu proceso, aunque no lo entienda 😂",
      "Vale, vale. Cada uno con su ritual. El mío es cantar mal, por si te lo preguntabas."] }] },
  { m: "happy", t: "Te cuento una del vestuario de ayer: el utillero juraba que había visto un fantasma en la sala de masajes. Resultó ser el segundo entrenador dormido con la manta puesta encima. Casi le da un infarto al pobre hombre. Oye, ¿tú has visto algo raro alguna vez en la ciudad deportiva?", replies: [
    { t: "Una vez sí, fue rarísimo", r: ["¡LO SABÍA! Cuéntamelo todo mañana en el vestuario, necesito los detalles para la próxima leyenda urbana del club 😂"] },
    { t: "Nunca, soy muy racional", r: ["Aburrido. Pero respetable. Yo en cambio me creo cualquier cosa, por eso vivo mejor 😄"] }] },
  { beats: [
    { m: "idle", t: "Hoy el nuevo del filial ha preguntado si el míster también entrena físico con nosotros." },
    { m: "happy", t: "Le hemos dejado creer que sí durante media hora. La cara que se le ha quedado cuando lo ha descubierto no tiene precio. Bienvenido al vestuario, chaval." }] },
  { w: "loss", beats: [
    { m: "idle", t: "Sé que hoy no salió como queríamos." },
    { m: "happy", t: "Pero te voy a decir una cosa que me dijo un veterano cuando yo era el novato del equipo: un mal partido no te define, lo que haces al día siguiente sí. Y tú siempre vuelves más fuerte, lo llevo viendo desde que llegaste." }] },
  { m: "happy", w: "good", t: "Llevas una racha que ya empieza a dar que hablar en el vestuario, ¿eh? Hasta el más callado del grupo ha comentado algo esta semana, y eso aquí es historia. ¿Tienes algún ritual o truco que te esté funcionando?", replies: [
    { t: "Solo trabajo y constancia", r: ["Respuesta de veterano en cuerpo de joven. Me gusta. Sigue así y te vamos a tener que subir el sueldo del respeto en el vestuario.",
      "Ojalá se me hubiera pegado algo de esa disciplina a mí a tu edad 😂"] },
    { t: "Un poco de suerte también", r: ["JAJA la suerte hay que currársela, pero vale, te la concedo. Sigue así de todas formas.",
      "Modesto encima. Este vestuario no te merece, en serio."] }] },
  { beats: [
    { m: "idle", t: "Confesión de capitán: cuando llegué a este club tenía más miedo que tú el primer día. Me escondía en el baño para no hablar en las charlas tácticas." },
    { m: "happy", t: "Ahora mírame, no me calla ni el míster. Todo se aprende, hasta lo de abrir la boca 😄" }] },
  { beats: [
    { m: "idle", t: "El presi ha vuelto a confundir mi nombre con el del utillero delante de un patrocinador. Tercera vez este mes." },
    { m: "happy", t: "Ya ni me molesto en corregirle, directamente respondo a los dos nombres como si fuera normal 😂" }] },
  { w: "benched", beats: [
    { m: "idle", t: "Te vi en el banquillo con esa cara que ponemos todos alguna vez." },
    { m: "happy", t: "Yo pasé dos meses ahí mi segunda temporada aquí y pensé que se acababa el mundo. No se acaba. Se entrena, se espera, y un día vuelves con más hambre que nunca." }] },
];

/* --- EL PERIÓDICO · plantillas con titular y cuerpo, por secciones --- */
const NEWS = [
  { sec: "PORTADA", w: "hot", h: "{player}, el nombre de la temporada", b: "Con {streak} días de trabajo impecable a sus espaldas, el {position} del {club} atraviesa el mejor momento de su joven carrera. En la ciudad deportiva ya no se habla de otra cosa: la pregunta no es si dará el salto, sino cuándo." },
  { sec: "PORTADA", w: "good", h: "El {club} se encomienda a su {position}", b: "La media de {ovr} de {player} empieza a pesar en cada alineación. El cuerpo técnico lo sabe, el vestuario lo sabe y la grada lo corea: el futuro pasa por sus botas." },
  { sec: "PORTADA", w: "derbiSoon", h: "Semana de PARTIDAZO en {league}", b: "El {club} se mide al {derbiRival} y la ciudad ya huele a día grande. Entradas volando, peñas organizando la previa y un {player} que llega afinado al partido que nadie quiere perderse." },
  { sec: "PORTADA", w: "seasonStart", h: "Arranca la temporada {season}", b: "Nueva campaña en {league} y las quinielas ya circulan. En el {club} evitan hablar de objetivos, pero la plantilla llega con hambre y {player} apunta a pieza clave." },
  { sec: "PORTADA", w: "bad", h: "¿Qué le pasa a {player}?", b: "El bajón de las últimas sesiones no ha pasado desapercibido. En el club piden calma y recuerdan que las temporadas son largas, pero la afición contiene la respiración." },
  { sec: "PORTADA", h: "La regularidad, la otra estrella del {club}", b: "Sin hacer ruido, el {club} ha construido su temporada sobre el trabajo diario de jugadores como {player}. La prensa nacional empieza a fijarse en el fenómeno." },
  { sec: "RUMORES", w: "good", h: "Ojeadores en la grada", b: "Al menos dos clubes de categoría superior habrían pedido informes sobre {player} en las últimas jornadas. En el {club} se hacen los sordos, pero el mercado nunca duerme." },
  { sec: "RUMORES", w: "hot", h: "¿Cláusula al alza?", b: "El entorno de {player} guarda silencio, pero su valor no: la progresión del {position} obligaría al {club} a replantearse su ficha antes de lo previsto." },
  { sec: "RUMORES", h: "La paella de la directiva 'va muy en serio'", b: "Fuentes del vestuario aseguran que la paella prometida si el equipo acaba arriba está garantizada. El utillero ya habría preguntado por el tamaño del recipiente." },
  { sec: "RUMORES", h: "Un grande de {league} estudia el modelo del {club}", b: "El trabajo silencioso de la preparación física del {club} empieza a tener imitadores. 'Que copien, nosotros seguimos', responden desde el club." },
  { sec: "VESTUARIO", w: "win", h: "La playlist de la victoria", b: "Tras el último triunfo, el vestuario del {club} sonó a reggaeton clásico durante cuarenta minutos. Los vecinos no han presentado quejas: 'se les oía felices'." },
  { sec: "VESTUARIO", w: "loss", h: "Silencio y doble sesión", b: "Tras la última derrota, el vestuario del {club} eligió la vía clásica: poca palabra y trabajo extra. 'Aquí no se esconde nadie', se escuchó desde dentro." },
  { sec: "VESTUARIO", h: "La lavadora 'La Bestia' cumple años", b: "El electrodoméstico más querido de la ciudad deportiva suma otro año de servicio. El utillero prepara una celebración 'íntima, solo para ropa de confianza'." },
  { sec: "VESTUARIO", h: "El arroz de los martes, patrimonio del club", b: "El táper más famoso del vestuario ya tiene fama en toda la categoría. Rivales han llegado a pedir la receta tras los partidos. La respuesta: 'secreto de vestuario'." },
  { sec: "LA LIGA", w: "hasGoals", h: "{player}, en la pelea por el pichichi", b: "Con {goals} tantos, el {position} del {club} se cuela entre los nombres propios de la categoría. Los defensas rivales ya le dedican marcajes especiales." },
  { sec: "LA LIGA", h: "El calendario no da tregua", b: "Jornada tras jornada, {league} sigue apretando la tabla. Los técnicos coinciden: 'esto lo decidirán los detalles y las plantillas que mejor se cuiden'." },
  { sec: "LA LIGA", h: "Los porteros piden piedad", b: "Tres goleadas en la última jornada han reabierto el debate: ¿es {league} la liga más ofensiva del país? Los guardametas reclaman 'un poco de compasión' para el fin de semana." },
  { sec: "HUMOR", h: "El VAR del bar", b: "El videoarbitraje oficial del Bar Manolo dictaminó ayer que 'aquello era penalti en 1997 y lo sigue siendo hoy'. La sentencia es inapelable y va acompañada de bravas." },
  { sec: "HUMOR", h: "Horóscopo deportivo", b: "Los astros predicen para hoy: entrenamiento fuerte, alguna agujeta traicionera y un rondo en el que alguien hará el ridículo. Los astros nunca fallan." },
  { sec: "HUMOR", h: "Se busca", b: "Balón visto por última vez en la grada norte tras un despeje del central rival. Responde al nombre de 'Pelota'. Se ruega devolución: es el bueno, el de los partidos." },
  { sec: "HUMOR", h: "Encuesta exprés", b: "El 94% de los aficionados encuestados asegura que 'este año sí'. El 6% restante es del equipo rival y también dice que este año sí. Alguien se equivoca." },
  { sec: "HUMOR", h: "Meteorología aplicada", b: "Previsión para el fin de semana: lluvia de ocasiones, rachas de contraataque y un 90% de probabilidad de que el míster diga 'partido trampa'." },
];

/* Monta la edición del día (portada, secciones y contra) sobre el estado dado.
   Se usa al abrir la app y también justo al fichar, para que el primer día
   no te encuentres un periódico en blanco. */
function buildPaper(out) {
  const today = todayStr();
  if (!out.paper || out.paper.d !== today)
    out.paper = { d: today, num: dayDiff(out.signedAt || today, today) + 1, articles: [], built: false };
  if (out.paper.built) return out;
  const c = flavorCtx(out);
  const ok = NEWS.filter((n) => !n.w || (COND[n.w] && COND[n.w](c)));
  const arts = [];
  const grab = (sec) => {
    const p = ok.filter((n) => n.sec === sec && arts.indexOf(n) < 0);
    const e = p[Math.floor(Math.random() * p.length)];
    if (e) arts.push(e);
  };
  grab("PORTADA"); grab(pick(["RUMORES", "VESTUARIO"])); grab("LA LIGA"); grab("HUMOR");
  out.paper = { ...out.paper, built: true, articles: [
    ...arts.map((n) => ({ id: Math.random(), sec: n.sec, h: fillTpl(n.h, c), b: fillTpl(n.b, c) })),
    ...out.paper.articles] };
  return out;
}

/* crónica del partido recién jugado: abre la edición del día siguiente */
function cronicaDe(g, m) {
  const c = g.club.name;
  const h = m.res === "V"
    ? pick([`El ${c} se lleva el partido (${m.gf}-${m.ga})`, `Victoria de peso ante ${m.rival}`, `${m.gf}-${m.ga}: el ${c} sigue a lo suyo`])
    : m.res === "E"
    ? pick([`Reparto de puntos ante ${m.rival} (${m.gf}-${m.ga})`, `Empate con sabor a poco (${m.gf}-${m.ga})`])
    : pick([`Tropiezo del ${c} ante ${m.rival} (${m.gf}-${m.ga})`, `Día para olvidar: ${m.gf}-${m.ga}`]);
  const tuyo = m.benched ? `${g.player.name} lo vio todo desde el banquillo.`
    : m.rating >= 8.5 ? `${g.player.name} firmó una actuación de ${m.rating} que la grada tardará en olvidar${m.myGoals ? `, con ${m.myGoals} gol${m.myGoals > 1 ? "es" : ""} incluido${m.myGoals > 1 ? "s" : ""}` : ""}.`
    : m.rating >= 7 ? `${g.player.name} cumplió con nota (${m.rating}).`
    : `A ${g.player.name} le tocó remar (${m.rating}).`;
  const b = (m.res === "V" ? `Buen golpe del ${c} en la jornada ${m.jornada}. `
    : m.res === "E" ? `Partido espeso en la jornada ${m.jornada}. `
    : `La jornada ${m.jornada} se torció pronto. `) + tuyo;
  return { h, b };
}

const dayLabel = (d) => {
  const t = todayStr();
  if (d === t) return "Hoy";
  if (d === addDays(t, -1)) return "Ayer";
  return d.slice(8) + "/" + d.slice(5, 7);
};

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

const CREST_SIZES = [["Pequeño", 0.8], ["Normal", 1], ["Grande", 1.25], ["Muy grande", 1.5]];

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
      <div className="fade-seq" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <div style={{ height: 22, width: 70, background: "repeating-linear-gradient(90deg,#16190F 0 3px,transparent 3px 6px,#16190F 6px 11px,transparent 11px 13px)" }} />
        <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: 13, letterSpacing: 6, color: "#16190F" }}>FUTABITA 3.1</div>
      </div>
      <h1 style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: 46, lineHeight: 1.04, margin: "0 0 26px",
        color: "#16190F", textTransform: "uppercase" }} className="fade-seq">
        Tu carrera<br />empieza<br /><span style={{ background: "#16190F", color: "#CDF546", padding: "0 14px", borderRadius: 14, display: "inline-block" }}>hoy</span>
      </h1>
      {INTRO.map((p, i) => (
        <p key={i} className="fade-seq" style={{ animationDelay: 0.5 + i * 0.85 + "s", color: "#2A2E1C",
          fontSize: 14.5, lineHeight: 1.55, margin: "0 0 14px", maxWidth: 340, fontWeight: 500 }}>{p}</p>
      ))}
      <button className="btn-gold fade-seq" style={{ animationDelay: 0.5 + INTRO.length * 0.85 + "s", marginTop: 14,
        background: "#16190F", color: "#CDF546", boxShadow: "0 4px 0 rgba(20,23,14,.35)" }}
        onClick={onDone}>EMPIEZA TU HISTORIA →</button>
      <button className="linky fade-seq" style={{ animationDelay: 0.7 + INTRO.length * 0.85 + "s", textAlign: "center", color: "#16190F", textDecoration: "underline" }}
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
              <div style={{ fontSize: 11.5, color: "#6F7563" }}>{o.club.city} · Tercera Federación</div>
            </div>
          </div>
          <p style={{ fontSize: 13, color: "#4A4E3F", margin: "10px 0 12px", lineHeight: 1.45 }}>{o.pitch}</p>
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
          <div style={{ fontFamily: "'Oswald',sans-serif", letterSpacing: 5, fontSize: 12, color: "#CDF546" }}>FICHAJE CONFIRMADO</div>
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
/* ============================================================
   MOTOR 2D DEL PARTIDO
   Coreografía sobre el resultado que YA decidió simulateMatch: los 22 puntos se
   mueven y se pasan el balón, y las jugadas de gol se disparan en el minuto que
   marca el guion de eventos. No altera marcador, nota ni XP.
   El bucle escribe transforms directamente sobre refs: React no re-renderiza por fotograma.
   ============================================================ */
const FORM_US = [[50, 93], [18, 77], [39, 80], [61, 80], [82, 77],
  [16, 58], [38, 61], [62, 61], [84, 58], [41, 38], [59, 38]];
const ROLES = ["portero", "lateral", "central", "central", "lateral",
  "extremo", "mediocentro", "mediocentro", "extremo", "delantero", "delantero"];
const MY_SLOT = 6; /* tu punto dentro de la formación */
const SQUAD22 = [
  ...FORM_US.map((p, i) => ({ bx: p[0], by: p[1], team: 0, idx: i })),
  ...FORM_US.map((p, i) => ({ bx: 100 - p[0], by: 100 - p[1], team: 1, idx: i })),
];
const TRAIL = 6;

const esGol = (e) => e.text.includes("⚽") || e.text.includes("🥅");

function PitchEngine({ match, minute, ended, onGoal, onSeq }) {
  const boxRef = useRef(null), ballRef = useRef(null), flashRef = useRef(null), lineRef = useRef(null);
  const dots = useRef([]), trail = useRef([]);
  const minRef = useRef(0), finRef = useRef(false), cbRef = useRef({});
  useEffect(() => { minRef.current = minute; }, [minute]);
  useEffect(() => { finRef.current = ended; }, [ended]);
  cbRef.current = { onGoal, onSeq };

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const quieto = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = 0, H = 0;
    const medir = () => { const r = box.getBoundingClientRect(); W = r.width; H = r.height; };
    medir();
    window.addEventListener("resize", medir);

    const pl = SQUAD22.map((p) => ({ ...p, x: p.bx, y: p.by, ph: Math.random() * 6.28, sp: 0.45 + Math.random() * 0.5 }));
    const pinta = (p, i) => {
      const el = dots.current[i];
      if (el) el.style.transform = `translate3d(${p.x / 100 * W - 6.5}px,${p.y / 100 * H - 6.5}px,0)`;
    };
    pl.forEach(pinta);

    if (quieto) { window.removeEventListener("resize", medir); return; }

    /* guion: solo los eventos de gol mueven el balón a portería */
    const guion = (match.events || []).filter(esGol)
      .map((e) => ({ ev: e, min: e.min, team: e.good ? 0 : 1, hecho: false }));

    const ball = { x: 50, y: 50, fx: 50, fy: 50, tx: 50, ty: 50, t: 1, dur: 1 };
    let poss = 0, holder = pl[MY_SLOT], acc = 0, seq = null, raf = 0;
    const tr = [];

    const compis = (t) => pl.filter((p) => p.team === t && p.idx > 0);
    /* seleccionar por línea (no por índice del array) evita salirse del rango */
    const linea = (t, lo, hi) => pl.filter((p) => p.team === t && p.idx >= lo && p.idx <= hi);
    const alAzar = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const pase = (dest, dur) => {
      if (!dest) return;
      ball.fx = ball.x; ball.fy = ball.y; ball.tx = dest.x; ball.ty = dest.y; ball.t = 0; ball.dur = dur;
      const l = lineRef.current;
      if (l) {
        l.setAttribute("x1", ball.fx / 100 * W); l.setAttribute("y1", ball.fy / 100 * H);
        l.setAttribute("x2", dest.x / 100 * W); l.setAttribute("y2", dest.y / 100 * H);
        l.setAttribute("stroke", poss === 0 ? "#CDF546" : "#D85A30");
        l.style.opacity = ".65";
      }
      holder = dest;
    };
    const siguiente = () => {
      const m = compis(poss);
      const adel = m.filter((p) => (poss === 0 ? p.y < holder.y - 4 : p.y > holder.y + 4));
      const pool = adel.length && Math.random() < 0.65 ? adel : m;
      const c = pool.filter((p) => p !== holder);
      return c[Math.floor(Math.random() * c.length)] || m[0];
    };
    const saque = (t) => {
      poss = t; holder = alAzar(linea(t, 5, 8)) || compis(t)[0];
      ball.x = 50; ball.y = 50; ball.fx = 50; ball.fy = 50; ball.tx = 50; ball.ty = 50; ball.t = 1;
    };

    let last = performance.now(), tAcc = 0, finT = 0;
    const loop = (now) => {
      /* el paso se acota por arriba (volver de segundo plano) y por abajo: nunca negativo */
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now; tAcc += dt;

      /* disparar la jugada de gol cuando el reloj alcanza su minuto.
         Mientras dura, el modal congela el reloj (onSeq) para que no se coma minutos. */
      if (!seq && !finRef.current) {
        const g = guion.find((x) => !x.hecho && minRef.current >= x.min);
        if (g) {
          g.hecho = true; seq = { g: g, fase: 0, t: 0 }; poss = g.team;
          if (cbRef.current.onSeq) cbRef.current.onSeq(true);
          pase(alAzar(linea(g.team, 5, 8)), 0.22); /* la jugada arranca en el centro del campo */
        }
      }
      if (seq) {
        const eq = seq.g.team;
        seq.t += dt;
        if (seq.fase === 0 && seq.t > 0.24) {
          seq.fase = 1; pase(alAzar(linea(eq, 9, 10)), 0.22); /* y busca a un delantero */
        } else if (seq.fase === 1 && seq.t > 0.48) {
          seq.fase = 2; holder = null;
          ball.fx = ball.x; ball.fy = ball.y; ball.tx = 50; ball.ty = eq === 0 ? 3 : 97; ball.t = 0; ball.dur = 0.2;
          if (lineRef.current) lineRef.current.style.opacity = "0";
        } else if (seq.fase === 2 && seq.t > 0.7) {
          /* el balón entra: AHORA se canta el gol, se suma al marcador y sale la tarjeta */
          seq.fase = 3;
          const f = flashRef.current;
          if (f) {
            f.textContent = eq === 0 ? "GOL" : "GOL RIVAL";
            f.style.color = eq === 0 ? "#CDF546" : "#D85A30";
            f.style.opacity = "1";
          }
          if (cbRef.current.onGoal) cbRef.current.onGoal(seq.g.ev);
        } else if (seq.fase === 3 && seq.t > 1.35) {
          if (flashRef.current) flashRef.current.style.opacity = "0";
          saque(1 - eq); seq = null;
          if (cbRef.current.onSeq) cbRef.current.onSeq(false);
        }
      }

      /* circulación normal del balón (se detiene al pitar el final) */
      if (!seq && !finRef.current) {
        acc += dt;
        if (acc > 0.5 && ball.t >= 1) {
          acc = 0;
          if (Math.random() < 0.13) { poss = 1 - poss; const s = compis(poss); pase(s[Math.floor(Math.random() * s.length)], 0.3); }
          else pase(siguiente(), 0.32 + Math.random() * 0.24);
        }
      }
      if (ball.t < 1) {
        ball.t = Math.min(1, ball.t + dt / ball.dur);
        const e = 1 - Math.pow(1 - ball.t, 3);
        ball.x = ball.fx + (ball.tx - ball.fx) * e;
        ball.y = ball.fy + (ball.ty - ball.fy) * e;
      } else if (holder) { ball.x += (holder.x - ball.x) * 0.16; ball.y += (holder.y - ball.y) * 0.16; }
      if (lineRef.current) {
        const o = parseFloat(lineRef.current.style.opacity || 0);
        if (o > 0) lineRef.current.style.opacity = Math.max(0, o - dt * 1.6);
      }

      /* al acabar: el balón vuelve al centro y el equipo se deshace del bloque */
      if (finRef.current) {
        holder = null;
        ball.x += (50 - ball.x) * 0.05; ball.y += (50 - ball.y) * 0.05;
        finT += dt;
      }

      /* bloque táctico: adelantar/retrasar líneas y bascular hacia el balón */
      for (let i = 0; i < pl.length; i++) {
        const p = pl[i];
        const atacando = !finRef.current && p.team === poss;
        const empuje = p.idx === 0 ? 1 : p.idx < 5 ? 5 : p.idx < 9 ? 9 : 12;
        const dir = p.team === 0 ? -1 : 1;
        const lento = p.idx === 0;
        let ty = p.by + (atacando ? empuje * dir : -empuje * dir * 0.5);
        let tx = p.bx + (ball.x - 50) * (lento ? 0.05 : 0.18);
        tx += Math.sin(tAcc * p.sp + p.ph) * 1.1;
        ty += Math.cos(tAcc * p.sp * 0.8 + p.ph) * 1.1;
        p.x += (tx - p.x) * (lento ? 0.022 : 0.036);
        p.y += (ty - p.y) * (lento ? 0.022 : 0.036);
        pinta(p, i);
      }

      /* estela del balón */
      tr.unshift([ball.x, ball.y]);
      if (tr.length > TRAIL) tr.pop();
      for (let i = 0; i < TRAIL; i++) {
        const el = trail.current[i], q = tr[i];
        if (el && q) {
          el.style.transform = `translate3d(${q[0] / 100 * W - 2.5}px,${q[1] / 100 * H - 2.5}px,0)`;
          el.style.opacity = String(0.3 * (1 - i / TRAIL));
        }
      }
      if (ballRef.current) ballRef.current.style.transform =
        `translate3d(${ball.x / 100 * W - 4}px,${ball.y / 100 * H - 4}px,0)`;

      /* tras asentarse el final, el bucle se apaga: nada sigue jugando de fondo */
      if (finT > 1.6) return;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", medir); };
  }, [match]);

  return (
    <div style={{ width: "100%", maxWidth: 360, margin: "0 auto" }}>
      <div className="pitch" ref={boxRef}>
        <div className="pl-line" style={{ left: 0, right: 0, top: "50%", height: 1 }} />
        <div className="pl-ring" />
        <div className="pl-box" style={{ top: 0, borderTop: "none" }} />
        <div className="pl-box" style={{ bottom: 0, borderBottom: "none" }} />
        <svg className="pl-svg"><line ref={lineRef} strokeWidth="1" style={{ opacity: 0 }} /></svg>
        {[...Array(TRAIL)].map((_, i) => (
          <div key={"t" + i} className="pl-trail" ref={(el) => (trail.current[i] = el)} />))}
        {SQUAD22.map((p, i) => {
          const yo = p.team === 0 && p.idx === MY_SLOT && !match.benched;
          return (
            <div key={i} ref={(el) => (dots.current[i] = el)}
              className={"pl-dot" + (yo ? " yo" : "")}
              style={{ background: p.team === 0 ? (yo ? "#CDF546" : "#EFEEE3") : "#D85A30" }}
              title={(p.team === 0 ? (yo ? "Tú" : "Tu equipo") : "Rival") + " · " + ROLES[p.idx]} />);
        })}
        <div className="pl-ball" ref={ballRef} />
        <div className="pl-flash" ref={flashRef}>GOL</div>
      </div>
    </div>);
}

function MatchModal({ match, club, onFinish, crest, crestScale }) {
  const [minute, setMinute] = useState(0);
  const [shown, setShown] = useState([]);
  const [gf, setGf] = useState(0), [ga, setGa] = useState(0);
  const [ended, setEnded] = useState(false);
  const holdRef = useRef(false);

  useEffect(() => {
    /* 3 min de juego por tick: el partido dura ~8 s de reloj más lo que sumen
       las jugadas de gol. El reloj se congela mientras el motor juega una de ellas,
       así el marcador nunca se adelanta a lo que se ve en el campo. */
    const int = setInterval(() => {
      if (holdRef.current) return;
      setMinute((m) => {
        const nm = m + 3;
        if (nm >= 93) { clearInterval(int); setEnded(true); return 90; }
        return nm;
      });
    }, 280);
    return () => clearInterval(int);
  }, []);

  /* los eventos que no son gol se revelan por minuto; los goles los canta el motor */
  useEffect(() => {
    setShown((f) => {
      const nuevos = match.events.filter((e) => !esGol(e) && e.min <= minute && f.indexOf(e) < 0);
      return nuevos.length ? [...f, ...nuevos] : f;
    });
  }, [minute, match]);

  const cantarGol = useCallback((ev) => {
    setShown((f) => (f.indexOf(ev) < 0 ? [...f, ev] : f));
    if (ev.good) { setGf((g) => g + 1); buzz(ev.text.includes("GOOOL") ? [30, 40, 30] : 20); }
    else setGa((g) => g + 1);
  }, []);
  const congelarReloj = useCallback((activo) => { holdRef.current = activo; }, []);

  return (
    <div className="overlay match-ov">
      <div className="eyebrow" style={{ textAlign: "center", color: "#CDF546" }}>
        {match.derbi ? "🔥 PARTIDAZO · " : ""}JORNADA {match.jornada} · EN VIVO</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, margin: "10px 0 6px" }}>
        <Crest c1={club.c1} c2={club.c2} name={club.name} size={38} img={crest} imgScale={crestScale} />
        <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: 40, color: "#F5EFDF", lineHeight: 1 }}>
          {ended ? match.gf : gf} - {ended ? match.ga : ga}</div>
        <div style={{ width: 44, textAlign: "center", fontSize: 11, color: "#8b95a3", lineHeight: 1.2 }}>{match.rival}</div>
      </div>
      <div style={{ fontFamily: "'Oswald',sans-serif", color: "#CDF546", textAlign: "center", fontSize: 18, marginBottom: 10 }}>
        {ended ? "FINAL" : minute + "'"}</div>

      <PitchEngine match={match} minute={minute} ended={ended} onGoal={cantarGol} onSeq={congelarReloj} />

      {match.benched && (
        <div style={{ textAlign: "center", fontSize: 11.5, color: "#8A8E7C", marginTop: 6 }}>
          🪑 Sigues el partido desde el banquillo</div>)}

      <div className="m-tick">
        {shown.slice(-3).map((e, i, arr) => (
          <div key={e.min + e.text} className={"event-in" + (i === arr.length - 1 && !ended ? " event-new" : "")}
            style={{ padding: "7px 11px", marginBottom: 5, borderLeft: `3px solid ${e.good ? "#3DDC84" : "#E14B4B"}`,
            background: "rgba(255,255,255,.04)", fontSize: 13, color: "#DDE3EA" }}>
            <b style={{ fontFamily: "'Oswald',sans-serif", marginRight: 8 }}>{e.min}'</b>{e.text}
          </div>))}
        {shown.length === 0 && <div style={{ textAlign: "center", color: "#8A8E7C", fontSize: 12.5, paddingTop: 12 }}>El balón ya rueda…</div>}
      </div>
      {ended && (
        <div className="pop-in" style={{ textAlign: "center", padding: "10px 0 8px" }}>
          <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: 22, color: match.res === "V" ? "#3DDC84" : match.res === "E" ? "#CDF546" : "#E14B4B" }}>
            {match.res === "V" ? "¡VICTORIA!" : match.res === "E" ? "EMPATE" : "DERROTA"}</div>
          {match.rating != null
            ? <div style={{ color: "#B9C2CD", fontSize: 14, margin: "6px 0 14px" }}>Tu nota: <b style={{ color: "#CDF546", fontSize: 18 }}>{match.rating}</b>
                {match.myGoals ? ` · ${match.myGoals}⚽` : ""}{match.myAssists ? ` · ${match.myAssists}🅰️` : ""}</div>
            : <div style={{ color: "#8b95a3", fontSize: 13, margin: "6px 0 14px" }}>No jugaste: el míster te dejó fuera por tu mala forma.</div>}
          <button className="btn-gold" onClick={onFinish}>CONTINUAR</button>
        </div>
      )}
    </div>
  );
}

/* ---------- DIÁLOGO NPC · estilo visual novel ---------- */
function NpcDialogue({ entry, queueLeft, onAdvance, onChoice, onOffer }) {
  const npc = NPCS[entry.npc] || NPCS.coach;
  const [n, setN] = useState(0);
  const nRef = useRef(0);
  const done = n >= entry.text.length;
  useEffect(() => {
    setN(0); nRef.current = 0;
    loadVoice(npc.voice);
    /* máquina de escribir. El sonido va AQUÍ, en el cuerpo del intervalo:
       meterlo en el actualizador de setN lo convertía en impuro y React lo
       ejecutaba dos veces en desarrollo, duplicando cada blip. */
    const int = setInterval(() => {
      if (nRef.current >= entry.text.length) { clearInterval(int); return; }
      nRef.current += 1;
      const ch = entry.text[nRef.current - 1];
      if (ch && /\S/.test(ch)) babble(npc.voice); /* nada de sonido en los espacios */
      setN(nRef.current);
    }, 28);
    return () => { clearInterval(int); hushVoices(); };
  }, [entry.id]);
  const art = npc.arts[entry.mood] || npc.arts[npc.def];
  const tap = () => {
    if (AUDIO.ctx && AUDIO.ctx.state === "suspended") AUDIO.ctx.resume();
    /* primer toque: texto completo al instante y voz cortada */
    if (!done) { nRef.current = entry.text.length; setN(entry.text.length); hushVoices(); return; }
    if (entry.kind === "offer" || entry.replies) return; /* estos se cierran con sus botones */
    onAdvance(entry.id);
  };
  return (
    <div className="npc-ov" onClick={tap}>
      {queueLeft > 1 && <div className="npc-count">+{queueLeft - 1} en espera</div>}
      {art
        ? <img key={entry.id + entry.mood} src={art} alt={npc.name} className="npc-art" />
        : <div key={entry.id} className="npc-art npc-fallback" style={{ background: npc.color }}>{npc.name[0]}</div>}
      <div className="npc-panel">
        <div className="npc-name" style={{ background: npc.color }}>{npc.name}</div>
        <div className="npc-box">
          <span>{entry.text.slice(0, n)}</span>
          {done && !entry.kind && !entry.replies && <span className="npc-caret">▼</span>}
          {done && entry.kind === "offer" && entry.offer && (
            <div onClick={(e) => e.stopPropagation()} style={{ marginTop: 12 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                <Crest c1={entry.offer.club.c1} c2={entry.offer.club.c2} name={entry.offer.club.name} size={34} />
                <div>
                  <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: 15, color: "#EFEEE3" }}>
                    {entry.offer.club.name} {entry.offer.club.country || ""}</div>
                  <div style={{ fontSize: 11, color: "#9a9e8e" }}>
                    {entry.offer.league} · Ficha: {fmtEUR(entry.offer.salary)}/año</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-gold sm" style={{ flex: 1 }} onClick={() => onOffer(entry.id, true)}>ACEPTAR ✍️</button>
                <button className="btn-ghost sm npc-ghost" style={{ flex: 1 }} onClick={() => onOffer(entry.id, false)}>Rechazar</button>
              </div>
            </div>)}
          {done && entry.replies && (
            <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
              {entry.replies.map((o, i) => (
                <button key={i} className="btn-ghost sm npc-ghost" style={{ textAlign: "left" }}
                  onClick={() => onChoice(entry.id, i)}>💬 {o.t}</button>))}
            </div>)}
        </div>
        <div className="npc-hint">{done ? (entry.kind || entry.replies ? "elige una opción" : "toca para continuar") : "toca para saltar"}</div>
      </div>
    </div>);
}

/* ---------- EL PERIÓDICO ---------- */
function Newspaper({ game, onRead }) {
  const today = todayStr();
  const paper = game.paper;
  /* siempre cerrado al entrar: al salir de la pestaña el componente se desmonta
     y hay que volver a abrirlo. paperRead solo sirve ya para el aviso de la pestaña. */
  const [open, setOpen] = useState(false);
  const [anim, setAnim] = useState(false);
  if (!paper) return (
    <div className="empty" style={{ marginTop: 80 }}><span className="em-ico">🗞️</span>
      La rotativa está en marcha.<br />Vuelve en un momento.</div>);
  const fecha = new Date(paper.d + "T12:00").toLocaleDateString("es-ES",
    { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  if (!open) return (
    <div style={{ padding: "48px 24px" }}>
      <div className={"np-cover" + (anim ? " np-opening" : "")}
        onClick={() => { if (anim) return; setAnim(true); buzz(15); paperRustle();
          /* el cambio ocurre justo antes de que la portada acabe de girar: se solapan */
          setTimeout(() => { setOpen(true); onRead(); }, 380); }}>
        <div className="np-mast">LA JORNADA</div>
        <div className="np-rule" />
        <div className="np-date">{fecha}</div>
        <div className="np-date">Edición Nº {paper.num} · 0,50 € (invita el club)</div>
        <div className="np-fold">🗞️</div>
        <div className="np-tap">TOCA PARA LEER LA EDICIÓN DE HOY</div>
      </div>
    </div>);

  const arts = paper.articles;
  const main = [...arts].reverse().find((a) => a.main) || arts.find((a) => a.sec === "PORTADA") || arts.find((a) => a.h);
  const rest = arts.filter((a) => a !== main && a.h && a.sec !== "HUMOR");
  const briefs = arts.filter((a) => !a.h);
  const humor = arts.find((a) => a.sec === "HUMOR" && a !== main);
  const tabla = [...game.season.table].sort((x, y) => y.pts - x.pts);
  const yoFuera = !tabla.slice(0, 4).some((t) => t.me);
  const miPos = tabla.findIndex((t) => t.me);
  return (
    <div className="np-page np-open2">
      <div className="np-mast" style={{ fontSize: 30 }}>LA JORNADA</div>
      <div className="np-rule" />
      <div className="np-date">{fecha} · Nº {paper.num} · {game.tier.league}</div>
      <div className="np-rule np-rule2" />
      {main && (
        <div className="np-main">
          <span className="np-kicker">{main.sec || "PORTADA"}</span>
          <h2 className="np-h1">{main.h || main.b}</h2>
          {main.h && <p className="np-body np-drop">{main.b}</p>}
        </div>)}
      {rest.slice(0, 4).map((a) => (
        <div key={a.id} className="np-art">
          <span className="np-kicker">{a.sec}</span>
          <h3 className="np-h2">{a.h}</h3>
          <p className="np-body">{a.b}</p>
        </div>))}
      <div className="np-cols">
        <div className="np-box">
          <div className="np-boxtitle">CLASIFICACIÓN</div>
          {tabla.slice(0, 4).map((t, i) => (
            <div key={t.name} className="np-row" style={t.me ? { fontWeight: 700 } : {}}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i + 1}. {t.name}</span>
              <span>{t.pts}</span>
            </div>))}
          {yoFuera && miPos >= 0 && (
            <div className="np-row" style={{ fontWeight: 700, borderTop: "1px dotted rgba(20,23,14,.4)", marginTop: 3, paddingTop: 3 }}>
              <span>{miPos + 1}. {game.club.name}</span><span>{tabla[miPos].pts}</span>
            </div>)}
        </div>
        {briefs.length > 0 && (
          <div className="np-box">
            <div className="np-boxtitle">BREVES</div>
            {briefs.slice(-4).map((a) => <p key={a.id} className="np-brief">▪ {a.b}</p>)}
          </div>)}
      </div>
      {humor && (
        <div className="np-humor">
          <span className="np-kicker">LA CONTRA</span>
          <h3 className="np-h2">{humor.h}</h3>
          <p className="np-body" style={{ fontStyle: "italic" }}>{humor.b}</p>
        </div>)}
      <div className="np-rule" style={{ marginTop: 14 }} />
      <div className="np-date" style={{ paddingBottom: 4 }}>LA JORNADA · se imprime donde se gana</div>
    </div>);
}

/* Nota: el diálogo NO se dibuja aquí dentro. Va al nivel de App, junto al resto de
   overlays, porque el contenedor de pestañas anima un transform y eso lo convierte
   en bloque contenedor de los hijos position:fixed (los dejaría con altura 0). */

/* ---------- CALENDARIO ---------- */
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DIAS_LARGO = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const NOTE_EMOJIS = ["📌", "🏥", "💊", "✈️", "🚗", "🎂", "🎉", "🍽️", "☕", "💼", "📚", "📝",
  "⚽", "🏋️", "🏃", "😴", "❤️", "👨‍👩‍👧", "🎬", "🎸", "🛒", "💰", "⚠️", "⭐"];
const notesOf = (game, d) => ((game.notes || {})[d] || []);

/* Calendario mensual: fondo = cómo fue el día, emoji = lo que anotaste.
   Las notas son una capa aparte: no afectan al %, ni a la forma, ni a la XP. */
function CalendarView({ game, photo, onClose, onAddNote, onDelNote, onEditDay }) {
  const today = todayStr(), yesterday = addDays(today, -1);
  const [offset, setOffset] = useState(0);
  const [sel, setSel] = useState(today);
  const [txt, setTxt] = useState("");
  const [emo, setEmo] = useState("📌");

  const base = new Date();
  const shown = new Date(base.getFullYear(), base.getMonth() + offset, 1);
  const y = shown.getFullYear(), m = shown.getMonth() + 1;
  const startDow = (shown.getDay() + 6) % 7; /* lunes = 0 */
  const nDays = new Date(y, m, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= nDays; d++) cells.push(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);

  const colorOf = (ds) => {
    const l = game.logs[ds];
    if (!l) return "transparent";
    if (!l.closed) return ds <= today ? "rgba(205,245,70,.6)" : "transparent";
    return l.form === "alza" || l.form === "buen" ? "rgba(46,158,68,.35)"
      : l.form === "est" ? "rgba(176,137,0,.3)" : "rgba(217,72,59,.35)";
  };

  /* --- datos del día abierto (todo de solo lectura salvo las notas) --- */
  const log = game.logs[sel];
  const notas = notesOf(game, sel);
  const g = game.player.goals;
  const sesiones = ((game.gym && game.gym.sessions) || []).filter((s) => s.d === sel);
  const pesaje = (game.player.weightLog || []).find((w) => w.d === sel);
  const partido = (game.matchHistory || []).find((x) => x.d === sel);
  const futuro = sel > today;
  const editable = sel === today || (sel === yesterday && log && !log.closed);
  const dow = new Date(sel + "T12:00").getDay();

  const Fila = ({ k, v }) => (
    <div style={{ display: "flex", gap: 8, fontSize: 12.5, padding: "4px 0", color: "#4A4E3F" }}>
      <span style={{ flex: 1 }}>{k}</span>
      <span style={{ color: "#16190F", fontFamily: "'Oswald',sans-serif" }}>{v}</span>
    </div>);

  return (
    <div style={{ paddingBottom: 96 }}>
      <div className="chat-head">
        <button className="chat-back" onClick={onClose}>←</button>
        <div style={{ flex: 1 }}>
          <div className="chat-name">Calendario</div>
          <div className="chat-sub">Tu temporada, día a día</div>
        </div>
      </div>

      <div style={{ padding: "14px 14px 0" }}>
        <div className="panel" style={{ marginTop: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            {/* forma funcional: dos toques seguidos avanzan dos meses, no uno */}
            <button className="chip" onClick={() => setOffset((o) => o - 1)}>←</button>
            <div className="ptitle" style={{ flex: 1, textAlign: "center", margin: 0 }}>{MESES[m - 1]} {y}</div>
            <button className="chip" onClick={() => setOffset((o) => o + 1)}>→</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, fontSize: 10,
            color: "#9a9e8e", textAlign: "center", marginBottom: 4 }}>
            {["L", "M", "X", "J", "V", "S", "D"].map((d, i) => <div key={i}>{d}</div>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
            {cells.map((ds, i) => {
              if (ds === null) return <div key={i} />;
              const n = notesOf(game, ds);
              return (
                <div key={i} className="cal-cell" onClick={() => setSel(ds)} style={{
                  background: colorOf(ds),
                  border: ds === sel ? "2px solid #16190F" : ds === today ? "1.5px solid rgba(20,23,14,.4)" : "1px solid transparent",
                  opacity: ds > today && n.length === 0 ? 0.45 : 1 }}>
                  <span className={"cal-num" + (n.length ? " esq" : "")}>{+ds.slice(8)}</span>
                  {n.length > 0 && <span className="cal-emo">{n[0].emoji}</span>}
                  {n.length > 1 && <span className="cal-dot" />}
                </div>);
            })}
          </div>
          <div style={{ fontSize: 10.5, color: "#6F7563", marginTop: 8, lineHeight: 1.6 }}>
            🟢 Buen día · 🟡 Estancado · 🔴 En caída · Toca cualquier día para ver o anotar
          </div>
        </div>

        {/* --- día seleccionado --- */}
        <div className="panel">
          <div className="ptitle">
            {DIAS_LARGO[dow]} {+sel.slice(8)} de {MESES[m - 1].toLowerCase()}
            {sel === today && <span style={{ color: "#5C7010" }}> · hoy</span>}
          </div>

          {notas.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              {notas.map((n) => (
                <div key={n.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0",
                  borderTop: "1px solid rgba(20,23,14,.07)" }}>
                  <span style={{ fontSize: 17 }}>{n.emoji}</span>
                  <span style={{ flex: 1, fontSize: 13, color: "#26291D" }}>{n.texto}</span>
                  <button className="linky" style={{ margin: 0, color: "#C0463A" }}
                    onClick={() => onDelNote(sel, n.id)}>✕</button>
                </div>))}
            </div>)}

          <div className="chips" style={{ marginBottom: 6 }}>
            {NOTE_EMOJIS.map((e) => (
              <button key={e} className={"chip" + (emo === e ? " on" : "")} style={{ padding: "5px 8px", fontSize: 15 }}
                onClick={() => setEmo(e)}>{e}</button>))}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <input className="inp" style={{ flex: 1, marginBottom: 0 }} value={txt} placeholder="Anota algo para este día…"
              onChange={(e) => setTxt(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && txt.trim()) { onAddNote(sel, emo, txt.trim()); setTxt(""); } }} />
            <button className="btn-gold sm" onClick={() => { if (txt.trim()) { onAddNote(sel, emo, txt.trim()); setTxt(""); } }}>＋</button>
          </div>
        </div>

        {/* --- resumen: solo días pasados o de hoy --- */}
        {!futuro && (
          <div className="panel">
            <div className="ptitle">📊 Ese día</div>
            {!log ? (
              <div className="empty" style={{ padding: 16 }}>Sin registro de este día.</div>
            ) : (
              <>
                {log.closed
                  ? <Fila k="Resultado" v={<FormBadge form={log.form} size={12} />} />
                  : <div style={{ fontSize: 11.5, color: "#5C7010", fontWeight: 600, paddingBottom: 4 }}>Día aún sin cerrar</div>}
                {log.closed && <Fila k="Cumplimiento" v={log.pct + "%"} />}
                <Fila k="Calorías" v={`${Math.round(log.kcal || 0)} / ${g.kcal}`} />
                <Fila k="Proteína" v={`${Math.round(log.prot || 0)} / ${g.protein} g`} />
                <Fila k="Sueño" v={log.sleep != null ? log.sleep + " h" : "—"} />
                <Fila k="Gym" v={log.gym ? (log.gymProgress ? "✓ con progreso" : "✓") : "—"} />
                {g.habits.length > 0 && (
                  <Fila k="Hábitos" v={`${(log.habitsDone || []).length} / ${g.habits.length}`} />)}
                {(log.habitsDone || []).length > 0 && (
                  <div style={{ fontSize: 11.5, color: "#6F7563", paddingBottom: 4 }}>
                    {log.habitsDone.join(" · ")}</div>)}
                {(log.meals || []).length > 0 && (
                  <div style={{ marginTop: 6, borderTop: "1px solid rgba(20,23,14,.08)", paddingTop: 6 }}>
                    {log.meals.map((mm, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, fontSize: 12, color: "#4A4E3F", padding: "2px 0" }}>
                        <span style={{ flex: 1 }}>🍽️ {mm.name}</span>
                        <span>{mm.kcal} kcal · {mm.prot}g</span>
                      </div>))}
                  </div>)}
              </>)}
            {sesiones.map((s) => (
              <div key={s.id} style={{ marginTop: 8, borderTop: "1px solid rgba(20,23,14,.08)", paddingTop: 6 }}>
                <Fila k={`🏋️ ${s.name}`} v={`${fmtDur(s.durSec)} · ${Math.round(s.volume)} kg`} />
                {s.prs && s.prs.length > 0 && (
                  <div style={{ fontSize: 11.5, color: "#2E9E44", fontWeight: 600 }}>{s.prs.length} récord(s) 🌟</div>)}
              </div>))}
            {pesaje && <Fila k="⚖️ Pesaje" v={pesaje.kg + " kg"} />}
            {partido && (
              <Fila k={`⚽ J${partido.jornada} vs ${partido.rival}`}
                v={`${partido.gf}-${partido.ga}${partido.rating != null ? " · " + partido.rating : ""}`} />)}
            {editable && (
              <button className="btn-ghost sm" style={{ width: "100%", marginTop: 10 }}
                onClick={() => onEditDay(sel)}>✏️ Editar este día</button>)}
          </div>)}
      </div>
    </div>);
}

/* ---------- REGISTRO DIARIO ---------- */

function LogTab({ game, log, onLog, logDate, onDate, onCloseDay, savedMeals, onSaveMeal, onUseSaved,
  notify, onGoGym, onAddNote, onDelNote }) {
  const sesionesHoy = ((game.gym && game.gym.sessions) || []).filter((s) => s.d === logDate);
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
  /* feedback inmediato: al cruzar un objetivo con esta comida, toast + vibración al momento */
  const addMealLog = (r) => {
    const nk = log.kcal + r.kcal, np = log.prot + r.prot;
    if (log.prot < g.protein && np >= g.protein) { notify("💪 ¡Proteína en verde!"); buzz(25); }
    else if (log.kcal < g.kcal && nk >= g.kcal) { notify("🔥 Calorías al objetivo"); buzz(25); }
    onLog({ ...log, meals: [...log.meals, r], kcal: nk, prot: np });
  };
  const addAI = async () => {
    if (!meal.trim() || loading) return;
    setLoading(true); setErr(null);
    try {
      const r = await estimateNutrition(meal.trim());
      addMealLog(r);
      setMeal("");
    } catch (e) {
      if (e.message === "no-ia") { setErr("La estimación por IA no está activada. Usa 'Entrada manual' para apuntar kcal y proteína."); setManual(true); }
      else setErr("No pude estimar esa comida. Prueba a describirla mejor o usa entrada manual.");
    }
    setLoading(false);
  };
  const addManual = () => {
    if (!mn.trim() || !+mk) return;
    addMealLog({ name: mn.trim(), kcal: Math.round(+mk), prot: Math.round(+mp || 0) });
    setMn(""); setMk(""); setMp(""); setManual(false);
  };
  const addSaved = (m) => { addMealLog({ name: m.name, kcal: m.kcal, prot: m.prot }); onUseSaved(m.name); };
  const removeMeal = (i) => { const m = log.meals[i];
    onLog({ ...log, meals: log.meals.filter((_, j) => j !== i), kcal: log.kcal - m.kcal, prot: log.prot - m.prot }); };
  const dow = new Date().getDay();
  const isGymDay = g.gymDays.includes(dow);
  const pct = dayPct(log, game.player, logDate);
  const form = formFromPct(pct);
  const Bar = ({ val, goal, color, label, unit, mini }) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
        <span style={{ color: "#4A4E3F", fontWeight: 500 }}>{label}
          {mini >= 2 && <span style={{ fontSize: 10.5, color: "#2E9E44", fontWeight: 700 }}> · {mini}d🔥</span>}</span>
        <span style={{ fontFamily: "'Oswald',sans-serif", color: val >= goal ? "#3F8F2B" : "#16190F" }}>{Math.round(val)} / {goal} {unit}</span>
      </div>
      {/* el relleno se pone verde al alcanzar el objetivo: feedback visual inmediato */}
      <div className="track"><div className="fill" style={{ width: Math.min(100, (val / goal) * 100) + "%",
        background: val >= goal ? "#2E9E44" : color }} /></div>
    </div>);
  /* mini-rachas informativas por hábito */
  const stProt = catStreak(game, (l) => (l.prot || 0) >= g.protein);
  const stKcal = catStreak(game, (l) => (l.kcal || 0) >= g.kcal);
  const stSleep = catStreak(game, (l) => l.sleep != null && l.sleep >= g.sleepGoal);
  const stGym = gymStreakOf(game, g.gymDays);
  /* comidas frecuentes: ordenadas por uso real; ⭐ a la más probable a esta hora */
  const smSorted = [...savedMeals].sort((a, b) => (b.uses || 0) - (a.uses || 0));
  const nowH = new Date().getHours();
  const avgH = (m) => (m.hours && m.hours.length ? m.hours.reduce((a, b) => a + b, 0) / m.hours.length : null);
  const starCand = smSorted.filter((m) => avgH(m) != null)
    .sort((a, b) => Math.abs(avgH(a) - nowH) - Math.abs(avgH(b) - nowH))[0];
  const starName = starCand && Math.abs(avgH(starCand) - nowH) <= 2 ? starCand.name : null;
  /* vista semanal: % de los últimos 7 días (cerrados con su pct; hoy en proyección) */
  const week = [];
  for (let i = 6; i >= 0; i--) {
    const d = addDays(today, -i);
    const l = game.logs[d];
    const p = l ? (l.closed ? l.pct : (d === today ? dayPct(l, game.player, d) : null)) : null;
    week.push({ d, p, hoy: d === today });
  }

  /* el calendario ocupa toda la pantalla: se abre con 📅 y vuelve con ← */
  if (showCal) return (
    <CalendarView game={game} onClose={() => setShowCal(false)}
      onAddNote={onAddNote} onDelNote={onDelNote}
      onEditDay={(d) => { onDate(d); setShowCal(false); }} />);

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
      <div className="panel" style={{ marginTop: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontFamily: "'Oswald',sans-serif", fontSize: 15 }}>Progreso del día · {pct}%</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 10, color: "#9a9e8e", textTransform: "uppercase", letterSpacing: .5 }}>proyección</span>
            <FormBadge form={form} />
          </span>
        </div>
        <Bar val={log.kcal} goal={g.kcal} color="#CDF546" label="Calorías" unit="kcal" mini={stKcal} />
        <Bar val={log.prot} goal={g.protein} color="#16190F" label="Proteína" unit="g" mini={stProt} />
      </div>

      <div className="panel">
        <div className="ptitle">📈 Tu semana</div>
        <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 58 }}>
          {week.map((w) => (
            <div key={w.d} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <div style={{ width: "100%", borderRadius: 6, background: w.p == null ? "#E4E3D5" : FORM_META[formFromPct(w.p)].color,
                opacity: w.hoy ? 0.55 : 1, height: w.p == null ? 6 : Math.max(8, Math.min(48, w.p * 0.4)) }} />
              <span style={{ fontSize: 9, color: w.hoy ? "#16190F" : "#9a9e8e", fontWeight: w.hoy ? 700 : 400 }}>
                {["D", "L", "M", "X", "J", "V", "S"][new Date(w.d + "T12:00").getDay()]}</span>
            </div>))}
        </div>
      </div>

      <div className="panel">
        <div className="ptitle">🍽️ Añadir comida</div>
        {smSorted.length > 0 && (
          <div className="chips" style={{ marginBottom: 10 }}>
            {smSorted.map((m, i) => (
              <button key={i} className="chip" onClick={() => addSaved(m)}>
                {m.name === starName ? "⭐ " : ""}{m.name} · {m.kcal}kcal</button>))}
          </div>)}
        <div style={{ display: "flex", gap: 6 }}>
          <input className="inp" style={{ flex: 1, marginBottom: 0 }} value={meal} placeholder='ej. "2 huevos, arroz y un batido"'
            onChange={(e) => setMeal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addAI()} />
          <button className="btn-gold sm" style={{ minWidth: 56 }} onClick={addAI} disabled={loading}>
            {loading ? "…" : "✨ IA"}</button>
          <button className="btn-ghost sm" style={{ minWidth: 74, whiteSpace: "nowrap",
            ...(manual ? { background: "#16190F", color: "#CDF546", borderColor: "#16190F" } : {}) }}
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
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, padding: "6px 0", borderTop: "1px solid rgba(20,23,14,.08)" }}>
                <span style={{ flex: 1, color: "#26291D" }}>{m.name}</span>
                <span style={{ color: "#6F7563" }}>{m.kcal} kcal · {m.prot}g</span>
                <button className="linky" style={{ margin: 0 }} onClick={() => onSaveMeal(m)}>💾</button>
                <button className="linky" style={{ margin: 0, color: "#E14B4B" }} onClick={() => removeMeal(i)}>✕</button>
              </div>))}
          </div>)}
      </div>

      <div className="panel">
        <div className="ptitle">🏋️ Gym {isGymDay ? "· hoy toca" : "· día de descanso"}
          {stGym >= 2 && <span style={{ fontSize: 10.5, color: "#2E9E44", fontWeight: 700 }}> · {stGym} seguidos🔥</span>}</div>
        {/* sesiones registradas hoy en el módulo de gym */}
        {sesionesHoy.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            {sesionesHoy.map((s) => (
              <div key={s.id} style={{ display: "flex", gap: 8, fontSize: 12.5, color: "#4A4E3F", padding: "3px 0" }}>
                <span style={{ flex: 1 }}>✓ {s.name}</span>
                <span>{fmtDur(s.durSec)} · {Math.round(s.volume)} kg{s.prs && s.prs.length ? " · PR 🌟" : ""}</span>
              </div>))}
          </div>)}
        <div style={{ display: "flex", gap: 8 }}>
          {isToday && <button className="btn-gold sm" style={{ flex: 1 }} onClick={onGoGym}>
            {game.gym && game.gym.active ? "⏳ Continuar entreno" : "🏋️ Abrir gimnasio"}</button>}
          <button className={"chip big" + (log.gym ? " on" : "")} onClick={() => { if (!log.gym) buzz(15);
            onLog({ ...log, gym: !log.gym, gymProgress: log.gym ? false : log.gymProgress }); }}>
            {log.gym ? "✓ Gym completado" : "Marcar a mano"}</button>
        </div>
        {log.gym && (
          <button className={"chip big" + (log.gymProgress ? " on" : "")} style={{ marginTop: 8 }}
            onClick={() => onLog({ ...log, gymProgress: !log.gymProgress })}>
            {log.gymProgress ? "✓ Subí peso/reps 💪" : "¿Progresaste hoy?"}</button>)}
      </div>

      <div className="panel">
        <div className="ptitle">😴 Sueño de anoche
          {stSleep >= 2 && <span style={{ fontSize: 10.5, color: "#2E9E44", fontWeight: 700 }}> · {stSleep}d🔥</span>}</div>
        <div className="chips">
          {[5, 6, 6.5, 7, 7.5, 8, 8.5, 9].map((h) => (
            <button key={h} className={"chip" + (log.sleep === h ? " on" : "")}
              onClick={() => { if (log.sleep !== h && h >= g.sleepGoal) buzz(12); onLog({ ...log, sleep: h }); }}>{h}h</button>))}
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

/* ============================================================ GYM · UI */
function ExercisePicker({ gym, onPick, onClose, onCreate }) {
  const [mus, setMus] = useState("pecho");
  const [q, setQ] = useState("");
  const [nuevo, setNuevo] = useState("");
  const list = allExercises(gym).filter((e) => (q ? e.name.toLowerCase().includes(q.toLowerCase()) : e.muscle === mus));
  return (
    <div className="overlay" style={{ background: "rgba(20,23,14,.55)", justifyContent: "flex-end", padding: 0 }} onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div className="ptitle" style={{ flex: 1, margin: 0 }}>Añadir ejercicio</div>
          <button className="chat-back" onClick={onClose}>✕</button>
        </div>
        <input className="inp" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
        {!q && (
          <div className="chips">
            {MUSCLES.map((m) => (
              <button key={m.id} className={"chip" + (mus === m.id ? " on" : "")} onClick={() => setMus(m.id)}>{m.emoji} {m.label}</button>))}
          </div>)}
        <div style={{ maxHeight: "42vh", overflowY: "auto", margin: "4px -4px" }}>
          {list.map((e) => (
            <div key={e.id} className="ex-row" onClick={() => onPick(e.id)}>
              <span style={{ flex: 1 }}>{e.name}</span>
              <span style={{ fontSize: 10.5, color: "#9a9e8e" }}>{e.type === "t" ? "tiempo" : e.type === "bw" ? "peso corporal" : "kg × reps"}</span>
            </div>))}
          {list.length === 0 && <div className="empty"><span className="em-ico">🔍</span>Ningún ejercicio con ese nombre.</div>}
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <input className="inp" style={{ flex: 1, marginBottom: 0 }} placeholder="Crear ejercicio propio…" value={nuevo}
            onChange={(e) => setNuevo(e.target.value)} />
          <button className="btn-ghost sm" onClick={() => { if (nuevo.trim()) { onCreate(nuevo.trim(), q ? "pecho" : mus); setNuevo(""); } }}>＋</button>
        </div>
      </div>
    </div>);
}

function GymTab({ game, api, notify }) {
  const gym = game.gym || emptyGym();
  const [view, setView] = useState(gym.active ? "session" : "home");
  const [picker, setPicker] = useState(null); /* "session" | routineId */
  const [editR, setEditR] = useState(null);
  const [detail, setDetail] = useState(null); /* sesión abierta */
  const [exStat, setExStat] = useState(null); /* progresión de un ejercicio */
  const [now, setNow] = useState(Date.now());
  const act = gym.active;
  /* un solo tick por segundo mientras hay sesión: mueve cronómetro y descanso */
  useEffect(() => {
    if (!act) return;
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, [!!act]);
  /* aviso al acabar el descanso */
  const restLeft = act && act.restUntil ? Math.max(0, Math.ceil((act.restUntil - now) / 1000)) : 0;
  const firedRef = useRef(0);
  useEffect(() => {
    if (act && act.restUntil && restLeft === 0 && firedRef.current !== act.restUntil) {
      firedRef.current = act.restUntil;
      buzz([40, 60, 40]); notify("⏱️ Descanso terminado · ¡a por la siguiente!");
      api.updateActive((a) => ({ ...a, restUntil: null }));
    }
  }, [restLeft, act && act.restUntil]);

  const weekSessions = gym.sessions.filter((s) => s.d > addDays(todayStr(), -7));
  const prList = Object.entries(gym.prs || {}).map(([id, p]) => ({ id, ...p })).sort((a, b) => (a.d < b.d ? 1 : -1)).slice(0, 4);

  /* ---------- SESIÓN EN MARCHA ---------- */
  if (view === "session" && act) {
    const groups = [];
    act.sets.forEach((s, i) => {
      let g = groups.find((x) => x.exId === s.exId);
      if (!g) { g = { exId: s.exId, idx: [] }; groups.push(g); }
      g.idx.push(i);
    });
    const dur = Math.floor((now - act.startedAt) / 1000);
    const doneN = act.sets.filter((s) => s.done).length;
    return (
      <div style={{ padding: "16px 14px 96px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div className="eyebrow">EN MARCHA</div>
            <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: 22, color: "#16190F" }}>{act.name}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: 22, color: "#16190F" }}>{fmtDur(dur)}</div>
            <div style={{ fontSize: 10.5, color: "#7A7F62" }}>{doneN} series · {Math.round(sessionVolume(act.sets))} kg</div>
          </div>
        </div>

        {restLeft > 0 && (
          <div className="rest-bar">
            <div className="rest-fill" style={{ width: (restLeft / (act.restLen || 90)) * 100 + "%" }} />
            <div className="rest-txt">⏱️ Descanso {fmtDur(restLeft)}
              <span>
                <button className="chip" style={{ padding: "3px 9px" }} onClick={() => api.updateActive((a) => ({ ...a, restUntil: a.restUntil + 30000 }))}>+30s</button>
                <button className="chip" style={{ padding: "3px 9px", marginLeft: 5 }} onClick={() => api.updateActive((a) => ({ ...a, restUntil: null }))}>Saltar</button>
              </span>
            </div>
          </div>)}

        {groups.map((g) => {
          const ex = exById(gym, g.exId);
          const pr = (gym.prs || {})[g.exId];
          return (
            <div className="panel" key={g.exId}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
                <div className="ptitle" style={{ margin: 0, flex: 1 }}>{ex.name}</div>
                {pr && <span style={{ fontSize: 10.5, color: "#7A7F62" }}>PR {ex.type === "t" ? fmtDur(pr.reps) : `${pr.w}kg × ${pr.reps}`}</span>}
              </div>
              {g.idx.map((i, n) => {
                const s = act.sets[i];
                return (
                  <div key={i} className="set-row">
                    <span className="set-n">{n + 1}</span>
                    {ex.type === "t" ? (
                      <><input className="setinp" type="number" inputMode="numeric" placeholder="seg" value={s.reps || ""}
                        onChange={(e) => api.setField(i, "reps", e.target.value)} /><span className="set-u">seg</span></>
                    ) : (
                      <>
                        {ex.type === "w" && <>
                          <input className="setinp" type="number" inputMode="decimal" placeholder="kg" value={s.w || ""}
                            onChange={(e) => api.setField(i, "w", e.target.value)} /><span className="set-u">kg</span></>}
                        <input className="setinp" type="number" inputMode="numeric" placeholder="reps" value={s.reps || ""}
                          onChange={(e) => api.setField(i, "reps", e.target.value)} /><span className="set-u">reps</span>
                      </>)}
                    <button className={"set-ok" + (s.done ? " on" : "")} onClick={() => api.toggleSet(i)}>{s.done ? "✓" : ""}</button>
                    <button className="linky" style={{ margin: 0, color: "#C0463A" }} onClick={() => api.delSet(i)}>✕</button>
                  </div>);
              })}
              <button className="linky" onClick={() => api.addSet(g.exId)}>＋ Añadir serie</button>
            </div>);
        })}

        {groups.length === 0 && <div className="empty"><span className="em-ico">🏋️</span>Entreno libre.<br />Añade el primer ejercicio para empezar.</div>}

        <button className="btn-ghost" style={{ width: "100%", marginTop: 12 }} onClick={() => setPicker("session")}>＋ Añadir ejercicio</button>
        <button className="btn-gold" style={{ marginTop: 10 }} onClick={() => { api.finish(); setView("home"); }}>✅ TERMINAR ENTRENO</button>
        <button className="linky" style={{ display: "block", margin: "10px auto 0", color: "#C0463A" }}
          onClick={() => { if (window.confirm("¿Descartar esta sesión? No se guardará nada.")) { api.cancel(); setView("home"); } }}>Descartar sesión</button>

        {picker && <ExercisePicker gym={gym} onClose={() => setPicker(null)}
          onPick={(id) => { api.addSet(id, true); setPicker(null); }}
          onCreate={(name, muscle) => { const id = api.createEx(name, muscle); api.addSet(id, true); setPicker(null); }} />}
      </div>);
  }

  /* ---------- EDITOR DE RUTINA ---------- */
  if (view === "routines" && editR) {
    const r = editR;
    return (
      <div style={{ padding: "16px 14px 96px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="chat-back" onClick={() => setEditR(null)}>←</button>
          <div className="ptitle" style={{ margin: 0, flex: 1 }}>Editar rutina</div>
        </div>
        <div className="panel">
          <div className="inplbl">Nombre</div>
          <input className="inp" value={r.name} onChange={(e) => setEditR({ ...r, name: e.target.value })} />
          <div className="inplbl">Icono</div>
          <div className="chips">
            {["🫀", "🦾", "🦵", "🏔️", "💪", "🎯", "🏃", "🔥"].map((em) => (
              <button key={em} className={"chip" + (r.emoji === em ? " on" : "")} onClick={() => setEditR({ ...r, emoji: em })}>{em}</button>))}
          </div>
        </div>
        <div className="panel">
          <div className="ptitle">Ejercicios ({r.ex.length})</div>
          {r.ex.map((id, i) => (
            <div key={i} className="set-row">
              <span style={{ flex: 1, fontSize: 13 }}>{exById(gym, id).name}</span>
              <button className="chip" style={{ padding: "3px 8px" }} disabled={i === 0}
                onClick={() => { const e2 = [...r.ex]; [e2[i - 1], e2[i]] = [e2[i], e2[i - 1]]; setEditR({ ...r, ex: e2 }); }}>↑</button>
              <button className="chip" style={{ padding: "3px 8px" }} disabled={i === r.ex.length - 1}
                onClick={() => { const e2 = [...r.ex]; [e2[i + 1], e2[i]] = [e2[i], e2[i + 1]]; setEditR({ ...r, ex: e2 }); }}>↓</button>
              <button className="linky" style={{ margin: 0, color: "#C0463A" }}
                onClick={() => setEditR({ ...r, ex: r.ex.filter((_, j) => j !== i) })}>✕</button>
            </div>))}
          {r.ex.length === 0 && <div className="empty" style={{ padding: 14 }}>Sin ejercicios todavía.</div>}
          <button className="linky" onClick={() => setPicker(r.id)}>＋ Añadir ejercicio</button>
        </div>
        <button className="btn-gold" style={{ marginTop: 12 }}
          onClick={() => { api.saveRoutine(r); setEditR(null); notify("💾 Rutina guardada"); }}>GUARDAR RUTINA</button>
        <button className="linky" style={{ display: "block", margin: "10px auto 0", color: "#C0463A" }}
          onClick={() => { if (window.confirm("¿Eliminar esta rutina?")) { api.delRoutine(r.id); setEditR(null); } }}>Eliminar rutina</button>
        {picker && <ExercisePicker gym={gym} onClose={() => setPicker(null)}
          onPick={(id) => { setEditR({ ...r, ex: [...r.ex, id] }); setPicker(null); }}
          onCreate={(name, muscle) => { const id = api.createEx(name, muscle); setEditR({ ...r, ex: [...r.ex, id] }); setPicker(null); }} />}
      </div>);
  }

  /* ---------- LISTA DE RUTINAS ---------- */
  if (view === "routines") {
    return (
      <div style={{ padding: "16px 14px 96px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="chat-back" onClick={() => setView("home")}>←</button>
          <div className="ptitle" style={{ margin: 0, flex: 1 }}>Mis rutinas</div>
        </div>
        {gym.routines.map((r) => (
          <div key={r.id} className="chat-row" onClick={() => setEditR({ ...r, ex: [...r.ex] })}>
            <div className="chat-ava" style={{ width: 42, height: 42, fontSize: 19, background: "#CDF54633", border: "1.5px solid #16190F33" }}>{r.emoji}</div>
            <div style={{ flex: 1 }}>
              <div className="chat-name">{r.name}</div>
              <div className="chat-prev">{r.ex.length} ejercicios · {[...new Set(r.ex.map((e) => exById(gym, e).muscle))].join(", ")}</div>
            </div>
            <span style={{ color: "#9a9e8e" }}>›</span>
          </div>))}
        <button className="btn-ghost" style={{ width: "100%", marginTop: 10 }}
          onClick={() => setEditR({ id: "r-" + Date.now(), name: "Nueva rutina", emoji: "🔥", ex: [] })}>＋ Crear rutina</button>
      </div>);
  }

  /* ---------- PROGRESIÓN DE UN EJERCICIO ---------- */
  if (view === "history" && exStat) {
    const ex = exById(gym, exStat);
    const pts = gym.sessions.filter((s) => s.sets).map((s) => {
      const ss = s.sets.filter((x) => x.done && x.exId === exStat);
      if (!ss.length) return null;
      return { d: s.d, best: Math.max(...ss.map((x) => (ex.type === "t" ? x.reps : e1rm(x.w, x.reps)))) };
    }).filter(Boolean).slice(-12);
    const max = pts.length ? Math.max(...pts.map((p) => p.best)) : 1;
    return (
      <div style={{ padding: "16px 14px 96px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="chat-back" onClick={() => setExStat(null)}>←</button>
          <div className="ptitle" style={{ margin: 0, flex: 1 }}>{ex.name}</div>
        </div>
        <div className="panel">
          <div className="ptitle">{ex.type === "t" ? "Mejor tiempo por sesión" : "1RM estimado por sesión"}</div>
          {pts.length < 2 ? <div className="empty"><span className="em-ico">📈</span>Necesitas al menos dos sesiones con este ejercicio para ver la progresión.</div> : (
            <>
              <div style={{ display: "flex", gap: 5, alignItems: "flex-end", height: 90 }}>
                {pts.map((p, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                    <span style={{ fontSize: 9, color: "#7A7F62" }}>{Math.round(p.best)}</span>
                    <div style={{ width: "100%", background: i === pts.length - 1 ? "#16190F" : "#CDF546", borderRadius: 6,
                      border: "1.5px solid #16190F", boxSizing: "border-box", height: Math.max(8, (p.best / max) * 62) }} />
                  </div>))}
              </div>
              <div style={{ fontSize: 11, color: "#7A7F62", marginTop: 8 }}>
                De {Math.round(pts[0].best)} a {Math.round(pts[pts.length - 1].best)}{ex.type === "t" ? " seg" : " kg"} en {pts.length} sesiones
                {pts[pts.length - 1].best > pts[0].best && <b style={{ color: "#2E9E44" }}> · +{Math.round(pts[pts.length - 1].best - pts[0].best)}</b>}
              </div>
            </>)}
        </div>
      </div>);
  }

  /* ---------- HISTORIAL ---------- */
  if (view === "history") {
    const usedEx = [...new Set(gym.sessions.filter((s) => s.sets).flatMap((s) => s.sets.filter((x) => x.done).map((x) => x.exId)))];
    return (
      <div style={{ padding: "16px 14px 96px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="chat-back" onClick={() => setView("home")}>←</button>
          <div className="ptitle" style={{ margin: 0, flex: 1 }}>Historial</div>
        </div>
        {usedEx.length > 0 && (
          <div className="panel">
            <div className="ptitle">📈 Progresión por ejercicio</div>
            <div className="chips">
              {usedEx.slice(0, 12).map((id) => (
                <button key={id} className="chip" onClick={() => setExStat(id)}>{exById(gym, id).name}</button>))}
            </div>
          </div>)}
        {gym.sessions.length === 0 ? <div className="empty"><span className="em-ico">📋</span>Todavía no has registrado ningún entreno.</div> :
          [...gym.sessions].reverse().map((s) => (
            <div key={s.id} className="panel" style={{ marginTop: 10 }} onClick={() => setDetail(detail === s.id ? null : s.id)}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <div className="ptitle" style={{ margin: 0, flex: 1 }}>{s.name}</div>
                <span style={{ fontSize: 10.5, color: "#9a9e8e" }}>{dayLabel(s.d)}</span>
              </div>
              <div style={{ fontSize: 12, color: "#4A4E3F", marginTop: 4 }}>
                {fmtDur(s.durSec)} · {Math.round(s.volume)} kg de volumen · {s.compact ? s.nSets : s.sets.filter((x) => x.done).length} series
                {s.prs && s.prs.length > 0 && <b style={{ color: "#2E9E44" }}> · {s.prs.length} PR 🌟</b>}
              </div>
              {detail === s.id && s.sets && (
                <div style={{ marginTop: 8, borderTop: "1px solid rgba(20,23,14,.1)", paddingTop: 6 }}>
                  {[...new Set(s.sets.filter((x) => x.done).map((x) => x.exId))].map((id) => {
                    const ex = exById(gym, id), ss = s.sets.filter((x) => x.done && x.exId === id);
                    return (
                      <div key={id} style={{ display: "flex", gap: 8, fontSize: 12, padding: "3px 0", color: "#4A4E3F" }}>
                        <span style={{ flex: 1 }}>{ex.name}</span>
                        <span style={{ color: "#16190F" }}>{ss.map((x) => ex.type === "t" ? `${x.reps}s` : ex.type === "bw" ? `${x.reps}` : `${x.w}×${x.reps}`).join(" · ")}</span>
                      </div>);
                  })}
                </div>)}
            </div>))}
      </div>);
  }

  /* ---------- INICIO DEL GYM ---------- */
  const week = [];
  for (let i = 6; i >= 0; i--) {
    const d = addDays(todayStr(), -i);
    week.push({ d, vol: gym.sessions.filter((s) => s.d === d).reduce((a, s) => a + s.volume, 0) });
  }
  const maxVol = Math.max(1, ...week.map((w) => w.vol));
  const todaySession = gym.sessions.find((s) => s.d === todayStr());
  return (
    <div style={{ padding: "16px 14px 96px" }}>
      <div className="eyebrow">GIMNASIO</div>
      <h2 className="h2" style={{ fontSize: 24, margin: "4px 0 12px" }}>Tu entrenamiento</h2>

      {act ? (
        <div className="panel" style={{ background: "#CDF546", borderColor: "#16190F", borderWidth: 2 }}>
          <div className="ptitle">⏳ Sesión en marcha · {act.name}</div>
          <div style={{ fontSize: 12.5, color: "#3A3E30", marginBottom: 10 }}>
            Llevas {fmtDur(Math.floor((now - act.startedAt) / 1000))} y {act.sets.filter((s) => s.done).length} series completadas.</div>
          <button className="btn-gold" style={{ background: "#16190F", color: "#CDF546" }} onClick={() => setView("session")}>CONTINUAR ENTRENO →</button>
        </div>
      ) : (
        <div className="panel">
          <div className="ptitle">🏋️ Empezar entreno</div>
          {todaySession && <div style={{ fontSize: 12, color: "#2E9E44", fontWeight: 600, marginBottom: 8 }}>
            ✓ Hoy ya entrenaste ({todaySession.name}). Puedes hacer otra sesión si quieres.</div>}
          <div className="chips">
            {gym.routines.map((r) => (
              <button key={r.id} className="chip big" onClick={() => { api.start(r.id); setView("session"); buzz(20); }}>
                {r.emoji} {r.name}</button>))}
          </div>
          <button className="btn-ghost sm" style={{ width: "100%", marginTop: 4 }}
            onClick={() => { api.start(null); setView("session"); }}>Entreno libre (sin rutina)</button>
        </div>)}

      <div className="panel">
        <div className="ptitle">📊 Volumen de la semana</div>
        <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 62 }}>
          {week.map((w) => (
            <div key={w.d} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <div style={{ width: "100%", borderRadius: 6, background: w.vol > 0 ? "#CDF546" : "#E4E3D5",
                border: w.vol > 0 ? "1.5px solid #16190F" : "none", boxSizing: "border-box",
                height: w.vol > 0 ? Math.max(10, (w.vol / maxVol) * 48) : 6 }} />
              <span style={{ fontSize: 9, color: w.d === todayStr() ? "#16190F" : "#9a9e8e", fontWeight: w.d === todayStr() ? 700 : 400 }}>
                {["D", "L", "M", "X", "J", "V", "S"][new Date(w.d + "T12:00").getDay()]}</span>
            </div>))}
        </div>
        <div style={{ fontSize: 11.5, color: "#7A7F62", marginTop: 8 }}>
          {weekSessions.length} sesiones · {Math.round(week.reduce((a, w) => a + w.vol, 0)).toLocaleString("es-ES")} kg movidos</div>
      </div>

      {prList.length > 0 && (
        <div className="panel">
          <div className="ptitle">🌟 Tus récords</div>
          {prList.map((p) => {
            const ex = exById(gym, p.id);
            return (
              <div key={p.id} style={{ display: "flex", gap: 8, fontSize: 12.5, padding: "4px 0", color: "#4A4E3F" }}>
                <span style={{ flex: 1 }}>{ex.name}</span>
                <span style={{ fontFamily: "'Oswald',sans-serif", color: "#16190F" }}>
                  {ex.type === "t" ? fmtDur(p.reps) : ex.type === "bw" ? `${p.reps} reps` : `${p.w} kg × ${p.reps}`}</span>
              </div>);
          })}
        </div>)}

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setView("routines")}>📋 Rutinas</button>
        <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setView("history")}>📈 Historial</button>
      </div>
    </div>);
}

/* ---------- LIGA ---------- */
function LeagueTab({ game, onPlayMatch, crest, crestScale }) {
  const s = game.season;
  const matchDue = isMatchDue(s, todayStr());
  const nextRival = s.rivals[s.matchday % s.rivals.length];
  const table = [...s.table].sort((a, b) => b.pts - a.pts);
  const myPos = table.findIndex((t) => t.me) + 1;
  return (
    <div style={{ padding: "16px 16px 96px" }}>
      <div className="eyebrow">TEMPORADA {s.num} · {game.tier.league}</div>
      <div className="panel" style={{ marginTop: 10, textAlign: "center" }}>
        <div style={{ fontSize: 12, color: "#6F7563" }}>JORNADA {Math.min(s.matchday + 1, SEASON_LENGTH)} / {SEASON_LENGTH}
          {s.matchday < SEASON_LENGTH && s.matchday + 1 === derbiJornadaOf(s) && (
            <span style={{ marginLeft: 8, background: "#16190F", color: "#CDF546", borderRadius: 8, padding: "2px 8px",
              fontSize: 10, fontFamily: "'Oswald',sans-serif", letterSpacing: 1 }}>🔥 PARTIDAZO</span>)}</div>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, margin: "10px 0" }}>
          <Crest c1={game.club.c1} c2={game.club.c2} name={game.club.name} size={40} img={crest} imgScale={crestScale} />
          <span style={{ fontFamily: "'Oswald',sans-serif", fontSize: 18, color: "#16190F" }}>VS</span>
          <div style={{ width: 60, fontSize: 12, color: "#4A4E3F" }}>{s.matchday < SEASON_LENGTH ? nextRival : "—"}</div>
        </div>
        {s.matchday >= SEASON_LENGTH ? (
          <div style={{ color: "#5C7010", fontSize: 13, fontWeight: 600 }}>Temporada finalizada. Revisa tus mensajes 📬</div>
        ) : matchDue ? (
          <button className="btn-gold" onClick={onPlayMatch}>⚽ JUGAR PARTIDO</button>
        ) : (
          <div style={{ color: "#6F7563", fontSize: 13 }}>
            Próximo partido: {matchDateFor(s, s.matchday)}<br />
            <span style={{ fontSize: 12 }}>Trabaja fuerte hoy: llegarás al partido con mejor forma.</span></div>
        )}
      </div>
      <div className="panel">
        <div className="ptitle">📊 Clasificación · vas {myPos}º</div>
        {table.map((t, i) => (
          <div key={t.name} style={{ display: "flex", padding: "7px 8px", fontSize: 13, background: t.me ? "#CDF546" : "transparent",
            borderRadius: 10, color: t.me ? "#16190F" : "#33362B", fontWeight: t.me ? 700 : 400 }}>
            <span style={{ width: 24, color: t.me ? "#16190F" : "#9a9e8e" }}>{i + 1}</span>
            <span style={{ flex: 1 }}>{t.name}</span>
            <span style={{ fontFamily: "'Oswald',sans-serif" }}>{t.pts} pts</span>
          </div>))}
      </div>
      {game.matchHistory.filter((m) => m.rating != null).length > 0 && (
        <div className="panel">
          <div className="ptitle">⭐ Mejores actuaciones</div>
          {[...game.matchHistory].filter((m) => m.rating != null).sort((a, b) => b.rating - a.rating).slice(0, 3).map((m, i) => (
            <div key={i} style={{ display: "flex", gap: 8, fontSize: 12.5, padding: "5px 0", color: "#4A4E3F", alignItems: "center" }}>
              <span style={{ fontFamily: "'Oswald',sans-serif", width: 18, color: "#9a9e8e" }}>{i + 1}º</span>
              <span style={{ flex: 1 }}>vs {m.rival}{m.myGoals ? ` · ${m.myGoals}⚽` : ""}{m.myAssists ? ` · ${m.myAssists}🅰️` : ""}</span>
              <span style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, background: (game.bestRating || 0) === m.rating ? "#CDF546" : "transparent",
                borderRadius: 7, padding: "1px 7px" }}>{m.rating}</span>
            </div>))}
        </div>)}
      {game.matchHistory.length > 0 && (
        <div className="panel">
          <div className="ptitle">📼 Últimos partidos</div>
          {game.matchHistory.slice(-5).reverse().map((m, i) => (
            <div key={i} style={{ display: "flex", gap: 8, fontSize: 12.5, padding: "5px 0", color: "#4A4E3F" }}>
              <span style={{ color: m.res === "V" ? "#2E9E44" : m.res === "E" ? "#B08900" : "#D9483B", fontFamily: "'Oswald',sans-serif", width: 14 }}>{m.res}</span>
              <span style={{ flex: 1 }}>J{m.jornada} vs {m.rival}</span>
              <span>{m.gf}-{m.ga}</span>
              <span style={{ color: "#16190F", fontWeight: 700 }}>{m.rating != null ? m.rating : "🪑"}</span>
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
  const notasHoy = notesOf(game, todayStr());
  const notasManana = notesOf(game, addDays(todayStr(), 1));
  return (
    <div style={{ padding: "18px 16px 96px" }}>
      <div style={{ display: "flex", justifyContent: "center", marginTop: 6 }}>
        <PlayerCard player={p} photo={photo} club={game.club} crest={crest} crestScale={crestScale} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 18 }}>
        <div className="stat-box"><div className="sb-num">{fmtEUR(mv)}</div><div className="sb-lbl">Valor de mercado</div></div>
        <div className="stat-box"><div className="sb-num">{kgNow} kg</div><div className="sb-lbl">{kgNow > kg0 ? `+${(kgNow - kg0).toFixed(1)} desde el inicio` : "Peso actual"}</div></div>
        <div className="stat-box"><div className="sb-num">{p.streak || 0}🔥</div>
          {(p.streak || 0) >= 1 && (
            <div style={{ fontSize: 9.5, fontWeight: 700, color: (p.streak || 0) >= 10 ? "#1F8A3B" : "#2E9E44", marginTop: 1 }}>
              +{Math.round((streakMultOf(p.streak) - 1) * 100)}% XP{(p.streak || 0) >= 25 ? " · MAX" : ""}</div>)}
          <div className="sb-lbl">Racha de días</div></div>
      </div>
      <div className="panel" style={{ marginTop: 14 }}>
        <div className="ptitle">Hoy · {pct}% del día</div>
        <div className="track"><div className="fill" style={{ width: Math.min(100, pct) + "%",
          background: FORM_META[formFromPct(pct)].color }} /></div>
        <div style={{ marginTop: 8, textAlign: "center" }}><FormBadge form={formFromPct(pct)} size={13} /></div>
        <div style={{ fontSize: 11.5, color: "#6F7563", textAlign: "center", marginTop: 4 }}>
          Al cerrar el día, tu forma decide cuánta XP ganas y si juegas el próximo partido.</div>
      </div>
      {(notasHoy.length > 0 || notasManana.length > 0) && (
        <div className="panel">
          <div className="ptitle">📅 En tu calendario</div>
          {notasHoy.map((n) => (
            <div key={n.id} style={{ display: "flex", gap: 8, fontSize: 13, padding: "3px 0", color: "#26291D" }}>
              <span>{n.emoji}</span><span style={{ flex: 1 }}>{n.texto}</span>
              <span style={{ fontSize: 10, color: "#5C7010", fontWeight: 700, letterSpacing: .5 }}>HOY</span>
            </div>))}
          {notasManana.map((n) => (
            <div key={n.id} style={{ display: "flex", gap: 8, fontSize: 13, padding: "3px 0", color: "#4A4E3F" }}>
              <span>{n.emoji}</span><span style={{ flex: 1 }}>{n.texto}</span>
              <span style={{ fontSize: 10, color: "#9a9e8e" }}>mañana</span>
            </div>))}
        </div>)}
      <div className="panel">
        <div className="ptitle">Progreso hacia el siguiente punto</div>
        {STAT_KEYS.map((k) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontFamily: "'Oswald',sans-serif", width: 34, fontSize: 13 }}>{k}</span>
            <span style={{ fontFamily: "'Oswald',sans-serif", width: 24, fontSize: 14, color: "#16190F", fontWeight: 700 }}>{p.stats[k]}</span>
            <div className="track" style={{ flex: 1 }}>
              <div className="fill" style={{ width: Math.min(100, ((p.xp[k] || 0) / xpToNext(p.stats[k])) * 100) + "%", background: "#CDF546" }} />
            </div>
            <span style={{ fontSize: 10, color: "#9a9e8e", width: 56, textAlign: "right" }}>{p.xp[k] || 0}/{xpToNext(p.stats[k])} XP</span>
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
    <div className="panel" style={{ borderColor: "#B8E02E", borderWidth: 2 }}>
      <div className="ptitle">💾 Copia de seguridad</div>
      <div style={{ fontSize: 12, color: "#6F7563", marginBottom: 10, lineHeight: 1.5 }}>
        Copia tu partida como texto y guárdala donde quieras (notas, un chat contigo…). Si la app se resetea,
        pégala en "Restaurar" (o en la pantalla inicial) y recuperas todo: stats, temporada, mensajes y foto.
        Hazlo al final de cada día por seguridad.</div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn-gold sm" style={{ flex: 1 }} onClick={copy}>{copied ? "✓ ¡Copiado!" : "Copiar respaldo"}</button>
        <button className="btn-ghost sm" style={{ flex: 1 }} onClick={() => setShow(!show)}>Restaurar</button>
      </div>
      {manual && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 11.5, color: "#5C7010", marginBottom: 4 }}>Copia manualmente este texto (mantén pulsado → seleccionar todo):</div>
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
  crestScale, onCrestScale, onGoals, getBackup, onRestore, haptics, onHaptics, voices, onVoices }) {
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
              return <div key={i} title={w.kg} style={{ flex: 1, background: "#CDF546", border: "1px solid #16190F",
                opacity: 0.55 + 0.45 * (i / 10), borderRadius: 5, boxSizing: "border-box",
                height: Math.max(8, ((w.kg - min) / (max - min)) * 56) }} />;
            })}
          </div>)}
        {wl.length > 0 && <div style={{ fontSize: 11.5, color: "#6F7563", marginTop: 6 }}>
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
        <div style={{ fontSize: 12, color: "#6F7563", marginBottom: 10, lineHeight: 1.5 }}>
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
            <div style={{ fontSize: 11.5, color: "#9a9e8e" }}>
              Ajústalo si tu PNG se ve pequeño o se sale de su hueco. No afecta al resto de la carta.</div>
          </div>)}
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
          <Crest c1={game.club.c1} c2={game.club.c2} name={game.club.name} size={48} img={crest} imgScale={crestScale} />
          <span style={{ fontSize: 11.5, color: "#9a9e8e" }}>Vista previa</span>
        </div>
      </div>
      <div className="panel">
        <div className="ptitle">🎯 Objetivos {edit ? "" : <button className="linky" style={{ margin: 0, float: "right" }} onClick={() => setEdit(true)}>Editar</button>}</div>
        {!edit ? (
          <div style={{ fontSize: 13, color: "#4A4E3F", lineHeight: 1.7 }}>
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
                <div style={{ flex: 1, fontSize: 13, color: "#33362B", background: "#F0EFE5", borderRadius: 10, padding: "8px 10px" }}>{h}</div>
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
        {game.careerLog.length === 0 ? (
          <div className="empty"><span className="em-ico">📖</span>Tu historia se empieza a escribir.<br />Cada temporada dejará aquí su huella.</div>
        ) : (
          <div style={{ borderLeft: "2.5px solid #16190F", marginLeft: 7, paddingLeft: 16 }}>
            {game.careerLog.map((c, i) => (
              <div key={i} style={{ position: "relative", paddingBottom: i === game.careerLog.length - 1 ? 2 : 14 }}>
                <div style={{ position: "absolute", left: -23, top: 3, width: 11, height: 11, borderRadius: "50%",
                  background: "#CDF546", border: "2px solid #16190F" }} />
                <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: 11, letterSpacing: 1, color: "#5C7010" }}>TEMPORADA {c.season}</div>
                <div style={{ fontSize: 13, color: "#4A4E3F" }}>{c.text}</div>
              </div>))}
          </div>)}
      </div>
      <div className="panel">
        <div className="ptitle">🎯 Metas de carrera</div>
        {(() => {
          const ovr = calcOVR(p.stats), played = (game.matchHistory || []).length;
          return [
            { t: "Llegar a Segunda Federación", pr: game.tier.id >= 1 ? 1 : Math.min(1, ovr / 66), n: game.tier.id >= 1 ? "✓" : ovr + "/66" },
            { t: "Llegar a Primera Federación", pr: game.tier.id >= 2 ? 1 : Math.min(1, ovr / 70), n: game.tier.id >= 2 ? "✓" : ovr + "/70" },
            { t: "Carta de oro (media 75)", pr: Math.min(1, ovr / 75), n: ovr >= 75 ? "✓" : ovr + "/75" },
            { t: "Jugar 100 partidos", pr: Math.min(1, played / 100), n: played >= 100 ? "✓" : played + "/100" },
            { t: "Un partido de 9+", pr: Math.min(1, (game.bestRating || 0) / 9), n: (game.bestRating || 0) >= 9 ? "✓" : (game.bestRating || "—") + "/9" },
          ].map((m, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
              <span style={{ flex: 1, fontSize: 12.5, color: m.pr >= 1 ? "#3F8F2B" : "#4A4E3F", fontWeight: m.pr >= 1 ? 700 : 400 }}>{m.t}</span>
              <div className="track" style={{ width: 74, height: 10, padding: 2 }}>
                <div className="fill" style={{ width: (m.pr * 100) + "%", background: m.pr >= 1 ? "#2E9E44" : "#CDF546" }} /></div>
              <span style={{ fontSize: 10.5, color: "#9a9e8e", width: 44, textAlign: "right", fontFamily: "'Oswald',sans-serif" }}>{m.n}</span>
            </div>));
        })()}
      </div>
      <div className="panel">
        <div className="ptitle">⚙️ Ajustes</div>
        <button className={"chip big" + (haptics ? " on" : "")} onClick={() => onHaptics(!haptics)}>
          📳 Vibración en hitos {haptics ? "· activada" : "· desactivada"}</button>
        <button className={"chip big" + (voices ? " on" : "")} style={{ marginTop: 8 }} onClick={() => onVoices(!voices)}>
          🔊 Sonido {voices ? "· activado" : "· desactivado"}</button>
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
  const [haptics, setHaptics] = useState(true);
  const [voicesOn, setVoicesOn] = useState(true);
  const setVoicesPref = (v) => { setVoicesOn(v); VOICES_ON = v; stSet("voices", v); };
  const [tierUp, setTierUp] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const setHapticsPref = (v) => { setHaptics(v); HAPTICS = v; stSet("haptics", v); };
  const useSavedMeal = (name) => setGame((g) => ({ ...g, savedMeals: (g.savedMeals || []).map((m) =>
    m.name === name ? { ...m, uses: (m.uses || 0) + 1, hours: [...(m.hours || []), new Date().getHours()].slice(-6) } : m) }));

  /* Notas del calendario: capa de anotación pura. No dan XP, no tocan el %, la forma
     ni el cierre del día, así que se pueden escribir en cualquier fecha sin recalcular nada. */
  const addNote = (d, emoji, texto) => setGame((g) => ({ ...g,
    notes: { ...(g.notes || {}), [d]: [...((g.notes || {})[d] || []),
      { id: Date.now() + Math.random(), emoji, texto }] } }));
  const delNote = (d, id) => setGame((g) => {
    const lista = ((g.notes || {})[d] || []).filter((n) => n.id !== id);
    const notes = { ...(g.notes || {}) };
    if (lista.length) notes[d] = lista; else delete notes[d]; /* sin notas, fuera la fecha */
    return { ...g, notes };
  });
  const [signing, setSigning] = useState(null); // club en animación de fichaje
  const [liveMatch, setLiveMatch] = useState(null);
  const [tab, setTab] = useState("home");
  const [toast, setToast] = useState(null);
  const saveTimer = useRef();

  const pushToast = (t) => { setToast(t); setTimeout(() => setToast(null), 3200); };

  /* mensajes en 2ª persona -> cola de diálogos NPC; 3ª persona -> artículo del periódico.
     Mantiene la firma histórica: los ~20 puntos que llaman addMsg no cambian. */
  const addMsg = (g, from, text, extra = {}) => {
    const npc = senderToNpc(from);
    if (npc) {
      const q = [...(g.npcQueue || [])];
      /* tope de cola: si el jugador estuvo días sin abrir, no se apilan 10 diálogos.
         Las ofertas nunca se descartan. */
      if (q.length >= 6) { const i = q.findIndex((e) => e.kind !== "offer"); if (i >= 0) q.splice(i, 1); }
      q.push({ id: Date.now() + Math.random(), npc, mood: extra.mood || moodOf(npc, text), text,
        kind: extra.kind, offer: extra.offer, replies: extra.replies });
      return { ...g, npcQueue: q };
    }
    const today = todayStr();
    const paper = g.paper && g.paper.d === today ? g.paper
      : { d: today, num: dayDiff(g.signedAt || today, today) + 1, articles: [], built: false };
    return { ...g, paper: { ...paper, articles: [...paper.articles,
      { id: Date.now() + Math.random(), sec: extra.sec || paperSec(from), src: from, h: extra.h, b: text, main: extra.main }] } };
  };

  /* "escena": varias frases seguidas del mismo personaje, cada una con su propia expresión.
     Se apilan en la cola de diálogos (ya soporta varias entradas con el contador "+N en espera"),
     así que al tocar para avanzar el retrato cambia de idle a happy/angry entre frase y frase.
     Solo la ÚLTIMA frase lleva los extras (replies, kind, offer...). */
  const addScene = (g, from, beats, extra = {}) => {
    let out = g;
    beats.forEach((b, i) => {
      out = addMsg(out, from, b.t, i === beats.length - 1 ? { mood: b.m, ...extra } : { mood: b.m });
    });
    return out;
  };
  /* toma una entrada de pool (formato clásico {m,t} o de escena {beats:[{m,t},...]}),
     rellena sus variables de contexto y la encola respetando ambos formatos */
  const playPoolEntry = (g, from, entry, ctx, extra = {}) => {
    if (!entry) return g;
    if (entry.beats) return addScene(g, from, entry.beats.map((b) => ({ m: b.m, t: fillTpl(b.t, ctx) })), { replies: entry.replies, ...extra });
    return addMsg(g, from, fillTpl(entry.t, ctx), { mood: entry.m, replies: entry.replies, ...extra });
  };

  /* cola de diálogos: avanzar, elegir respuesta, resolver oferta */
  const advanceNpc = (id) => setGame((g) => ({ ...g, npcQueue: (g.npcQueue || []).filter((e) => e.id !== id) }));
  const answerChoice = (id, idx) => setGame((g) => {
    const q = g.npcQueue || [];
    const e = q.find((x) => x.id === id);
    if (!e || !e.replies || !e.replies[idx]) return g;
    /* la réplica del personaje entra al frente de la cola: responde al momento,
       con su propia expresión (por defecto "happy" si la opción no especifica otra) */
    const resp = { id: Date.now() + Math.random(), npc: e.npc, mood: e.replies[idx].m || "happy", text: pick(e.replies[idx].r) };
    return { ...g, npcQueue: [resp, ...q.filter((x) => x.id !== id)] };
  });
  const answerOffer = (id, accept) => {
    const e = (game.npcQueue || []).find((x) => x.id === id);
    if (!e || !e.offer) return;
    setGame((g) => ({ ...g, npcQueue: (g.npcQueue || []).filter((x) => x.id !== id) }));
    if (accept) signClub(e.offer.club, e.offer.tierId, true);
    else setTimeout(() => setGame((g) => addMsg(g, "Elisa",
      `Me han contado que rechazaste al ${e.offer.club.name}. Esa lealtad no se olvida. La afición te va a hacer un cántico. ❤️`, { mood: "happy" })), 400);
  };
  const markPaperRead = () => setGame((g) => ({ ...g, paperRead: todayStr() }));

  /* carga inicial */
  useEffect(() => {
    (async () => {
      const g = await stGet("game");
      const ph = await stGet("photo");
      const cr = await stGet("crest");
      const cs = await stGet("crestScale");
      const hp = await stGet("haptics");
      const vo = await stGet("voices");
      if (vo === false) { setVoicesOn(false); VOICES_ON = false; }
      if (ph) setPhoto(ph);
      if (cr) setCrest(cr);
      if (cs) setCrestScale(cs);
      if (hp === false) { setHaptics(false); HAPTICS = false; }
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

  /* celebración de nueva carta: se dispara solo al CAMBIAR de tier respecto al último visto
     (cardTierSeen), nunca en cada render. Partidas antiguas: se registra el tier actual
     en silencio la primera vez, sin celebrar. */
  useEffect(() => {
    if (!loaded || !game || game.phase !== "main") return;
    const order = ["bronze", "silver", "gold", "special"];
    const t = cardTier(calcOVR(game.player.stats));
    if (!game.cardTierSeen) { setGame((g) => ({ ...g, cardTierSeen: t })); return; }
    if (order.indexOf(t) > order.indexOf(game.cardTierSeen)) {
      setTierUp(t); buzz([30, 40, 60]);
      setGame((g) => ({ ...g, cardTierSeen: t }));
    }
  }, [loaded, game && game.phase === "main" ? calcOVR(game.player.stats) : -1]);

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
        if (r.decayed) out = addMsg(out, "Elisa", "Te veo apagado en los entrenamientos. Dos días flojos seguidos y tu físico lo nota: has perdido puntos. Reacciona. 📉", { mood: "angry" });
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
      out = addMsg(out, "Elisa", `Informe de entrenamiento: ${txt}. El staff está impresionado con tu trabajo. 💪`, { mood: "happy" });
    }
    /* partidas antiguas sin vestuario: se genera uno al vuelo */
    if (!out.squad || !out.squad.length) out.squad = makeSquad();
    /* aniversarios de carrera: 30/60/100 días desde el fichaje (una sola vez cada uno).
       Partidas antiguas sin signedAt: empieza a contar desde hoy. */
    if (!out.signedAt) out.signedAt = today;
    else {
      const dd = dayDiff(out.signedAt, today);
      const ms = [...(out.milestonesSeen || [])];
      [[30, "Elisa", "Hoy hace 30 días que llegaste. Un mes de trabajo serio — el vestuario ya no se imagina esto sin ti. 💪"],
       [60, null, "¡60 días juntos ya, crack! 🤝 De 'el nuevo' a uno más de la familia. Lo que hemos crecido, ¿eh?"],
       [100, "📰 La Grada Digital", "Se cumplen 100 días desde la llegada del fichaje que cambió el vestuario: de apuesta a realidad."]]
        .forEach(([n, from, txt]) => {
          if (dd >= n && !ms.includes(n)) {
            out = addMsg(out, from || (out.captain || "Capitán") + " · Capitán", txt);
            ms.push(n);
          }
        });
      out.milestonesSeen = ms;
    }
    /* edición diaria del periódico: se monta UNA vez por fecha */
    const yaEstaba = out.paper && out.paper.d === today && out.paper.built;
    out = buildPaper(out);
    if (!yaEstaba) {
      const c = flavorCtx(out);
      /* breves del día: 2-3 líneas cortas de prensa/afición/redes/club */
      const brevs = pickFlavor(out, 2 + Math.round(Math.random()), ["press", "fan", "social", "club"]);
      brevs.forEach((fv) => { out = addMsg(out, fv.from, fv.text); });
      out.recentTpl = [...(out.recentTpl || []), ...brevs.map((m) => m.t).filter(Boolean)].slice(-12);
      /* y a veces, un personaje se pasa a verte al abrir la pestaña */
      if (Math.random() < 0.6) {
        const roll = Math.random();
        if (roll < 0.3) {
          const p = LOPEZ_POOL.filter((y) => !y.w || (COND[y.w] && COND[y.w](c)));
          out = playPoolEntry(out, "López", p[Math.floor(Math.random() * p.length)], c);
        } else if (roll < 0.4) {
          const fv = pickFlavor(out, 1, ["squad", "cap", "coach", "agent"])[0];
          if (fv) out = addMsg(out, fv.from, fv.text, { replies: fv.replies });
        } else if (roll < 0.7) {
          if (out.yunaMet) {
            const p = YUNA_POOL.filter((y) => !y.w || (COND[y.w] && COND[y.w](c)));
            out = playPoolEntry(out, "Yuna", p[Math.floor(Math.random() * p.length)], c);
          }
        } else {
          const p = ELISA_POOL.filter((y) => !y.w || (COND[y.w] && COND[y.w](c)));
          out = playPoolEntry(out, "Elisa", p[Math.floor(Math.random() * p.length)], c);
        }
      }
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
      out = addMsg(out, "Elisa",
        `Bienvenido al ${club.name}, ${g.player.name}. Soy Elisa, tu entrenadora y mánager a la vez, así que vas a verme mucho por aquí. Aquí las cosas son simples: el que trabaja y se deja la piel como un profesional, juega. Cada día. Demuéstramelo. ⚽`, { mood: "happy" });
      out.captain = "López";
      out = addMsg(out, "López · Capitán", pick([
        `¡Bienvenido al vestuario, crack! 🙌 Soy López, el capi. Aquí somos pocos pero somos familia. Un consejo: a Elisa gánatela entre semana, no los domingos. Cualquier cosa que necesites, aquí me tienes.`,
        `¡Eh, el nuevo! 😄 Soy López, capitán de este equipo. Ya me han hablado de tu hambre. Aquí el que se lo curra, juega — así de fácil. Bienvenido a casa, hermano.`,
        `Bienvenido, ${g.player.name} 🤝 Soy López. Te lo digo el primero: esta camiseta pesa más de lo que parece. Déjate la piel entre semana y el vestuario te llevará en volandas.`]), { mood: "happy" });
      out = addMsg(out, pick(PRESS),
        `OFICIAL ✍️ | El ${club.name} anuncia el fichaje de ${g.player.name} (${g.player.position}). ${viaTransfer ? "Movimiento sonado en el mercado que ilusiona a la afición." : "El club apuesta por una joven promesa con hambre de fútbol."}`);
      /* club nuevo, vestuario nuevo (López viaja contigo: es tu colega de siempre) */
      out.squad = makeSquad();
      /* fecha de inicio de carrera (para aniversarios) y primer ascenso de categoría */
      out.signedAt = out.signedAt || todayStr();
      out = buildPaper(out); /* el día del fichaje ya tiene su edición, no un periódico vacío */
      if (viaTransfer && tierId > g.tier.id) buzz([30, 40, 60]);
      if (viaTransfer && tierId > g.tier.id && !g.firstRiseDone) {
        out.firstRiseDone = true;
        out = addMsg(out, "Tu agente",
          "Tu primer salto de categoría. 📈 El primero de muchos. Firmé contigo por días como hoy — disfrútalo.");
      }
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
    m.derbi = s.matchday + 1 === derbiJornadaOf(s);
    m.d = todayStr(); /* fecha, para poder situarlo en el calendario */
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
      /* récord personal de nota: hito la primera vez que superas tu mejor partido */
      if (m.rating != null && m.rating > (g.bestRating || 0)) {
        out.bestRating = m.rating;
        if (g.bestRating) { setTimeout(() => pushToast("🌟 ¡Nuevo mejor partido de tu carrera! " + m.rating), 700); buzz([20, 30, 20]); }
      }
      /* primer gol de la carrera */
      if ((m.myGoals || 0) > 0 && !g.firstGoalDone) {
        out.firstGoalDone = true;
        out = addMsg(out, (g.captain || "Capitán") + " · Capitán",
          "¡TU PRIMER GOL! ⚽ Guarda ese balón donde puedas verlo. El primero no se olvida nunca, crack.");
      }
      out = addMsg(out, "Elisa", coachMessage(m, g.player),
        { mood: m.benched || m.res === "D" ? "angry" : m.res === "V" || (m.rating != null && m.rating >= 7.5) ? "happy" : "idle" });
      /* la crónica abre el periódico del día */
      const cr = cronicaDe(g, m);
      out = addMsg(out, pick(PRESS), cr.b, { h: cr.h, main: true, sec: "CRÓNICA" });
      /* Yuna: aparece por primera vez tras tu primera victoria; después reacciona a veces */
      if (!g.yunaMet && m.res === "V" && !m.benched) {
        out.yunaMet = true;
        out = addScene(out, "Yuna", YUNA_INTRO_BEATS.map((b) => ({ m: b.m, t: fillTpl(b.t, flavorCtx(out)) })));
      } else if (g.yunaMet && Math.random() < 0.45) {
        const cy = flavorCtx(out);
        const p = YUNA_POOL.filter((y) => ["win", "loss", "benched"].includes(y.w) && COND[y.w](cy));
        out = playPoolEntry(out, "Yuna", p[Math.floor(Math.random() * p.length)], cy);
      }
      const cap = (g.captain || "Capitán") + " · Capitán";
      if (!m.benched && m.rating >= 8.5 && Math.random() < 0.6) {
        out = addMsg(out, cap, pick([
          `¡QUÉ PARTIDO TE HAS MARCADO! 🔥🔥 El vestuario entero hablando de ti. Sigue así y esto se te queda pequeño, crack.`,
          `Hermano, hoy has sido OTRO NIVEL 🙌 Se nota lo que curras fuera del campo. Orgulloso de jugar contigo.`]));
      } else if (m.res === "V" && !m.benched && Math.random() < 0.3) {
        out = addMsg(out, cap, pick([
          `¡VICTORIAAA! 🎉 Buen curro hoy, equipo. A descansar bien que mañana hay otra guerra.`,
          `3 puntitos más 😎 A descansar bien, que la liga no espera.`]));
      } else if (m.benched && Math.random() < 0.5) {
        out = addMsg(out, cap, `Te he visto jodido en el banquillo... 😕 Escucha: a todos nos ha pasado. Esta semana cúrratelo al máximo y el míster no tendrá excusas. Cuento contigo.`);
      }
      const ovr = calcOVR(g.player.stats);
      /* ventana de mitad de temporada */
      if (s.matchday >= MID_WINDOW && !s.midOfferDone) {
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
        out = addMsg(out, "Elisa",
          `🏁 FIN DE TEMPORADA ${s.num}.\nPosición final: ${pos}º de 10.\nTus goles: ${goals} · Nota media: ${avgR}.\n${pos <= 3 ? "Temporada histórica. Eres el nombre del vestuario." : pos <= 6 ? "Temporada digna. El año que viene, más." : "Temporada dura. Que sirva de gasolina."}`,
          { mood: pos <= 3 ? "happy" : pos <= 6 ? "idle" : "angry" });
        out.careerLog = [...out.careerLog, { season: s.num, text: `${pos}º con ${g.club.name} · ${goals} goles · media ${avgR}` }];
        /* memoria del año: resumen sobre datos ya guardados (partidos, logs, pesos) */
        const assists = seasonMatches.reduce((a, x) => a + (x.myAssists || 0), 0);
        const bestR = ratings.length ? Math.max(...ratings.map((x) => x.rating)) : null;
        const seasonLogs = Object.entries(g.logs || {}).filter(([d]) => d >= s.startDate);
        const gymCount = seasonLogs.filter(([, l]) => l.gym).length;
        const wlSeason = (g.player.weightLog || []).filter((w) => w.d >= s.startDate);
        const kgDelta = wlSeason.length >= 2 ? (wlSeason[wlSeason.length - 1].kg - wlSeason[0].kg) : null;
        let topMeal = null;
        seasonLogs.forEach(([, l]) => (l.meals || []).forEach((mm) => { if (!topMeal || mm.prot > topMeal.prot) topMeal = mm; }));
        out.pendingSummary = { season: s.num, club: g.club.name, pos, goals, assists, avgR, bestR, gymCount, kgDelta,
          topMeal: topMeal ? { name: topMeal.name, prot: topMeal.prot } : null };
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
        out = addMsg(out, "Elisa", `La temporada ${s.num + 1} arranca ya. Pretemporada exprés: mañana se juega. 🏃`);
      }
      return out;
    });
    setLiveMatch(null);
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
  /* el vestuario "se entera" cuando ajustas tus objetivos de kcal/proteína */
  /* ---------- acciones del gym ---------- */
  const setGym = (fn) => setGame((g) => ({ ...g, gym: fn(g.gym || emptyGym()) }));
  /* al añadir series se precargan peso y reps de la última vez que hiciste ese ejercicio */
  const lastSetOf = (gy, exId) => {
    for (let i = gy.sessions.length - 1; i >= 0; i--) {
      const s = gy.sessions[i];
      if (!s.sets) continue;
      const hit = s.sets.filter((x) => x.done && x.exId === exId).pop();
      if (hit) return hit;
    }
    return null;
  };
  const bestOf = (s, type) => (type === "t" || type === "bw" ? (s.reps || 0) : e1rm(s.w, s.reps));
  const gymApi = {
    start: (routineId) => setGym((gy) => {
      const r = routineId ? gy.routines.find((x) => x.id === routineId) : null;
      const sets = [];
      (r ? r.ex : []).forEach((exId) => {
        const last = lastSetOf(gy, exId);
        for (let i = 0; i < 3; i++) sets.push({ exId, w: last ? last.w : "", reps: last ? last.reps : "", done: false });
      });
      return { ...gy, active: { routineId, name: r ? r.name : "Entreno libre", startedAt: Date.now(),
        sets, restUntil: null, restLen: gy.restDefault || 90 } };
    }),
    updateActive: (fn) => setGym((gy) => (gy.active ? { ...gy, active: fn(gy.active) } : gy)),
    setField: (i, k, v) => setGym((gy) => ({ ...gy, active: { ...gy.active,
      sets: gy.active.sets.map((s, j) => (j === i ? { ...s, [k]: v === "" ? "" : Number(v) } : s)) } })),
    addSet: (exId, nuevo) => setGym((gy) => {
      const last = lastSetOf(gy, exId);
      const prev = [...gy.active.sets].reverse().find((s) => s.exId === exId);
      const base = prev || last;
      return { ...gy, active: { ...gy.active,
        sets: [...gy.active.sets, { exId, w: base ? base.w : "", reps: base ? base.reps : "", done: false }] } };
    }),
    delSet: (i) => setGym((gy) => ({ ...gy, active: { ...gy.active, sets: gy.active.sets.filter((_, j) => j !== i) } })),
    toggleSet: (i) => {
      /* el récord se decide DENTRO del updater, sobre el estado fresco: si marcas varias
         series seguidas del mismo ejercicio, gana la mejor y no la última */
      let aviso = null, marco = false;
      setGym((g2) => {
        const a = g2.active, s = a.sets[i], ex = exById(g2, s.exId);
        const marcando = !s.done;
        marco = marcando;
        const prs = { ...(g2.prs || {}) };
        if (marcando && s.reps) {
          const pr = prs[s.exId];
          if (!pr || bestOf(s, ex.type) > bestOf(pr, ex.type)) {
            prs[s.exId] = { w: s.w || 0, reps: s.reps, e1rm: e1rm(s.w, s.reps), d: todayStr() };
            aviso = ex.name;
          }
        }
        const sets = a.sets.map((x, j) => (j === i ? { ...x, done: marcando } : x));
        return { ...g2, prs, active: { ...a, sets,
          restUntil: marcando ? Date.now() + (a.restLen || 90) * 1000 : a.restUntil } };
      });
      setTimeout(() => {
        if (marco) buzz(15);
        if (aviso) { buzz([30, 40, 30]); pushToast(`🌟 ¡RÉCORD en ${aviso}!`); }
      }, 0);
    },
    finish: () => {
      let res = null;
      setGame((g) => {
        const gy = g.gym, a = gy.active;
        if (!a) return g;
        const done = a.sets.filter((s) => s.done && s.reps);
        if (done.length === 0) { res = { vacio: true }; return { ...g, gym: { ...gy, active: null } }; }
        const t = todayStr();
        const durSec = Math.floor((Date.now() - a.startedAt) / 1000);
        const volume = sessionVolume(a.sets);
        const groups = [...new Set(done.map((s) => exById(gy, s.exId).muscle))];
        /* PRs de esta sesión: los récords fijados hoy en ejercicios que acabas de entrenar */
        const prs = [...new Set(done.filter((s) => { const p = (gy.prs || {})[s.exId]; return p && p.d === t; }).map((s) => s.exId))];
        const prevSame = [...gy.sessions].reverse().find((s) => s.routineId && s.routineId === a.routineId);
        const gymProgress = prs.length > 0 || (prevSame ? volume > prevSame.volume : false);
        const sesion = { id: Date.now(), d: t, routineId: a.routineId, name: a.name, durSec, volume,
          sets: done.map((s) => ({ exId: s.exId, w: s.w || 0, reps: s.reps, done: true })), groups, prs };
        const log = { ...(g.logs[t] || EMPTY_LOG()) };
        /* la sesión marca el día como entrenado; la forma sigue calculándose solo al cerrar el día */
        log.gym = true;
        log.gymProgress = log.gymProgress || gymProgress;
        log.gymGroups = [...new Set([...(log.gymGroups || []), ...groups])];
        log.gymMin = (log.gymMin || 0) + Math.round(durSec / 60);
        log.gymPR = log.gymPR || prs.length > 0;
        res = { durSec, n: done.length, volume, nPR: prs.length };
        return { ...g, logs: { ...g.logs, [t]: log },
          gym: { ...gy, active: null, sessions: [...gy.sessions, sesion] } };
      });
      setTimeout(() => {
        if (!res) return;
        if (res.vacio) { pushToast("Sesión descartada: no marcaste ninguna serie"); return; }
        buzz([30, 50, 30]);
        pushToast(`💪 ${fmtDur(res.durSec)} · ${res.n} series · ${Math.round(res.volume)} kg` + (res.nPR ? ` · ${res.nPR} PR 🌟` : ""));
      }, 0);
    },
    cancel: () => setGym((gy) => ({ ...gy, active: null })),
    saveRoutine: (r) => setGym((gy) => ({ ...gy,
      routines: gy.routines.some((x) => x.id === r.id) ? gy.routines.map((x) => (x.id === r.id ? r : x)) : [...gy.routines, r] })),
    delRoutine: (id) => setGym((gy) => ({ ...gy, routines: gy.routines.filter((x) => x.id !== id) })),
    createEx: (name, muscle) => {
      const id = "c-" + Date.now();
      setGym((gy) => ({ ...gy, custom: [...(gy.custom || []), { id, name, muscle, type: "w", custom: true }] }));
      return id;
    },
  };

  const setGoals = (goals) => setGame((g) => {
    const old = g.player.goals;
    let out = { ...g, player: { ...g.player, goals } };
    if (goals.kcal !== old.kcal || goals.protein !== old.protein) {
      const up = goals.kcal > old.kcal || goals.protein > old.protein;
      out = addMsg(out, pick(["Elisa", (g.captain || "Capitán") + " · Capitán"]),
        up ? pick(["Me ha llegado que has subido el listón de tu preparación. Esa ambición es justo lo que quiero ver. 💪",
                   "¿Apretando más todavía? Así se hace. El techo lo pones tú."])
           : pick(["He visto que has ajustado tu plan. Escuchar al cuerpo también es de profesionales.",
                   "Plan nuevo, ¿eh? Lo importante no es el número, es no fallar un día. Sigue."]),
        { mood: up ? "happy" : "idle" });
    }
    return out;
  });

  /* cerrar manualmente un día pendiente (normalmente ayer) */
  const closePendingDay = (dateStr) => setGame((g) => {
    const log = g.logs[dateStr];
    if (!log || log.closed) return g;
    const r = applyDayClose(g.player, log, dateStr);
    let out = { ...g, player: r.player, logs: { ...g.logs, [dateStr]: { ...log, closed: true, pct: r.pct, form: r.form } } };
    if (r.decayed) out = addMsg(out, "Elisa", "Te veo apagado en los entrenamientos. Dos días flojos seguidos y tu físico lo nota: has perdido puntos. Reacciona. 📉", { mood: "angry" });
    if (r.ups.length) {
      const counts = {};
      r.ups.forEach((k) => (counts[k] = (counts[k] || 0) + 1));
      const txt = Object.entries(counts).map(([k, n]) => `${STAT_LABELS[k]} +${n}`).join(", ");
      out = addMsg(out, "Elisa", `Informe de entrenamiento: ${txt}. El staff está impresionado con tu trabajo. 💪`, { mood: "happy" });
    }
    if (r.form === "alza") buzz([20, 30, 20]);
    if (r.ups.length) buzz(30);
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
      <div style={{ color: "#16190F", fontFamily: "'Oswald',sans-serif", letterSpacing: 4, fontSize: 15 }}>FUTABITA 3.1</div>
    </div>);

  /* aviso en la pestaña Diario: diálogos en cola + la edición de hoy sin leer */
  const unreadTotal = (game.npcQueue || []).length +
    (game.phase === "main" && game.paper && game.paperRead !== todayStr() ? 1 : 0);

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
              <div style={{ fontSize: 10.5, color: "#6F7563" }}>{game.tier.league} · Temporada {game.season.num}</div>
            </div>
            <div style={{ marginLeft: "auto" }}><FormBadge form={game.player.form} /></div>
          </header>
          <div key={tab} className="tab-in">
            {tab === "home" && <HomeTab game={game} photo={photo} crest={crest} crestScale={crestScale}
              log={(game.logs && game.logs[todayStr()]) || EMPTY_LOG()} />}
            {tab === "log" && <LogTab game={game} log={activeLog} onLog={setActiveLog} logDate={logDate} onDate={setLogDate}
              onCloseDay={closePendingDay} savedMeals={game.savedMeals || []} onSaveMeal={saveMeal} onUseSaved={useSavedMeal}
              notify={pushToast} onGoGym={() => setTab("gym")} onAddNote={addNote} onDelNote={delNote} />}
            {tab === "gym" && <GymTab game={game} api={gymApi} notify={pushToast} />}
            {tab === "league" && <LeagueTab game={game} onPlayMatch={playMatch} crest={crest} crestScale={crestScale} />}
            {tab === "chat" && <Newspaper game={game} onRead={markPaperRead} />}
            {tab === "me" && <ProfileTab game={game} photo={photo} onWeight={addWeight} onPhoto={savePhoto} onRemovePhoto={removePhoto}
              crest={crest} onCrest={saveCrest} onRemoveCrest={removeCrest} crestScale={crestScale} onCrestScale={saveCrestScale}
              onGoals={setGoals} getBackup={getBackup} onRestore={restoreBackup} haptics={haptics} onHaptics={setHapticsPref}
              voices={voicesOn} onVoices={setVoicesPref} />}
          </div>
          <nav className="tabbar">
            {[["home", "🏠", "Inicio"], ["log", "📝", "Registro"], ["gym", "🏋️", "Gym"], ["league", "🏆", "Liga"], ["chat", "🗞️", "Diario"], ["me", "👤", "Yo"]].map(([id, ic, lb]) => (
              <button key={id} className={"tabbtn" + (tab === id ? " on" : "")}
                onClick={() => setTab(id)}>
                <span style={{ fontSize: 17, position: "relative" }}>{ic}
                  {id === "chat" && unreadTotal > 0 && <span className="dot">{unreadTotal}</span>}
                  {id === "gym" && game.gym && game.gym.active && <span className="dot" style={{ background: "#CDF546", padding: "3px 4px" }} />}</span>
                <span style={{ fontSize: 9 }}>{lb}</span>
              </button>))}
          </nav>
        </>
      )}
      {/* diálogo de personaje: overlay a nivel de App (fuera de .tab-in), visible en el Diario */}
      {tab === "chat" && (game.npcQueue || []).length > 0 && (
        <NpcDialogue entry={game.npcQueue[0]} queueLeft={game.npcQueue.length}
          onAdvance={advanceNpc} onChoice={answerChoice} onOffer={answerOffer} />)}
      {game.pendingSummary && !liveMatch && (
        <div className="overlay" style={{ background: "radial-gradient(ellipse at 50% 0%, #0E3320, #05070d 75%)", overflowY: "auto" }}>
          <div className="pop-in" style={{ width: "100%", maxWidth: 340, padding: "30px 0" }}>
            <div style={{ textAlign: "center", fontFamily: "'Oswald',sans-serif", letterSpacing: 5, fontSize: 12, color: "#CDF546" }}>MEMORIA DEL AÑO</div>
            <div style={{ textAlign: "center", fontFamily: "'Oswald',sans-serif", fontSize: 28, color: "#F5EFDF", margin: "4px 0 16px", textTransform: "uppercase" }}>
              Temporada {game.pendingSummary.season}</div>
            {[["🏆 Posición final", game.pendingSummary.pos + "º con " + game.pendingSummary.club],
              ["⚽ Goles · Asistencias", game.pendingSummary.goals + " · " + game.pendingSummary.assists],
              ["📊 Nota media", game.pendingSummary.avgR],
              ["🌟 Mejor partido", game.pendingSummary.bestR != null ? game.pendingSummary.bestR : "—"],
              ["🏋️ Sesiones de gym", game.pendingSummary.gymCount],
              ["⚖️ Peso en la temporada", game.pendingSummary.kgDelta != null ? (game.pendingSummary.kgDelta >= 0 ? "+" : "") + game.pendingSummary.kgDelta.toFixed(1) + " kg" : "—"],
              ["🍽️ Plato top (proteína)", game.pendingSummary.topMeal ? `${game.pendingSummary.topMeal.name} (${game.pendingSummary.topMeal.prot}g)` : "—"]]
              .map(([k, v], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 4px", fontSize: 13.5,
                  borderBottom: "1px solid rgba(255,255,255,.1)", color: "#B9C2CD" }}>
                  <span>{k}</span><span style={{ color: "#F5EFDF", fontFamily: "'Oswald',sans-serif" }}>{v}</span>
                </div>))}
            <button className="btn-gold" style={{ marginTop: 22 }}
              onClick={() => { buzz(20); setGame((g) => { const o = { ...g }; delete o.pendingSummary; return o; }); }}>
              EMPEZAR LA TEMPORADA {game.pendingSummary.season + 1} →</button>
          </div>
        </div>)}
      {tierUp && (
        <div className="overlay" style={{ background: "radial-gradient(circle at 50% 30%, rgba(205,245,70,.28), #05070d 72%)" }}>
          <div className="pop-in" style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Oswald',sans-serif", letterSpacing: 5, fontSize: 12, color: "#CDF546" }}>¡NUEVA CARTA!</div>
            <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: 32, color: "#F5EFDF", margin: "6px 0 16px", textTransform: "uppercase" }}>
              {{ bronze: "Bronce", silver: "Plata 🥈", gold: "Oro 🥇", special: "Especial 💎" }[tierUp]}</div>
            <div className="card-drop" style={{ display: "flex", justifyContent: "center" }}>
              <PlayerCard player={game.player} photo={photo} club={game.club} crest={crest} crestScale={crestScale} />
            </div>
            <button className="btn-gold" style={{ marginTop: 26 }} onClick={() => setTierUp(null)}>SEGUIR MI CARRERA</button>
          </div>
        </div>)}
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
      .app-root { min-height: 100vh; background: #EFEEE3; color: #16190F; font-family: 'Barlow', system-ui, sans-serif;
        max-width: 480px; margin: 0 auto; position: relative; }
      .screen { min-height: 100vh; }
      .intro-bg { background:
        radial-gradient(ellipse 80% 45% at 15% -5%, rgba(255,255,255,.35), transparent),
        radial-gradient(ellipse 70% 40% at 90% 110%, rgba(20,23,14,.16), transparent), #CDF546; }
      .eyebrow { font-family:'Oswald',sans-serif; font-size:11px; letter-spacing:4px; color:#7A7F62; }
      .h2 { font-family:'Oswald',sans-serif; font-size:28px; color:#16190F; margin:6px 0 18px; text-transform:uppercase; }
      .lbl { display:block; font-size:12px; color:#6F7563; margin:12px 0 5px; }
      .inp { width:100%; box-sizing:border-box; background:#FFFFFF; border:1.5px solid rgba(20,23,14,.14);
        color:#16190F; border-radius:12px; padding:11px 12px; font-size:14px; margin-bottom:6px; font-family:'Barlow',sans-serif; }
      .inplbl { font-size:10.5px; color:#7A7F62; text-transform:uppercase; letter-spacing:.8px; margin-bottom:4px; font-family:'Oswald',sans-serif; }
      .pendbar { margin-top:10px; background:#CDF546; border:1.5px solid #16190F; color:#16190F;
        border-radius:14px; padding:10px 12px; font-size:12.5px; font-weight:600; cursor:pointer; }
      .inp:focus { outline:2px solid #16190F; outline-offset:1px; }
      .chips { display:flex; flex-wrap:wrap; gap:7px; margin:4px 0 8px; }
      .chip { background:#FFFFFF; border:1.5px solid rgba(20,23,14,.16); color:#3A3E30;
        border-radius:20px; padding:7px 13px; font-size:12.5px; font-family:'Barlow',sans-serif; cursor:pointer; }
      .chip.big { padding:10px 15px; font-size:13.5px; }
      .chip.on { background:#16190F; border-color:#16190F; color:#CDF546; font-weight:600; }
      .btn-gold { display:block; width:100%; background:#CDF546; color:#16190F;
        border:1.5px solid #16190F; border-radius:16px; padding:14px; font-family:'Oswald',sans-serif; font-size:15px; letter-spacing:2px;
        font-weight:600; cursor:pointer; box-shadow:0 4px 0 #16190F; }
      .btn-gold:active { transform:translateY(2px); box-shadow:0 2px 0 #16190F; }
      .btn-gold.sm { padding:10px; font-size:13px; letter-spacing:1px; width:auto; box-shadow:0 3px 0 #16190F; }
      .btn-gold:focus, .btn-ghost:focus, .chip:focus, .tabbtn:focus { outline:2px solid #16190F; outline-offset:2px; }
      .btn-ghost { background:#FFFFFF; border:1.5px solid rgba(20,23,14,.25); color:#16190F; border-radius:14px;
        padding:11px 14px; font-size:13px; cursor:pointer; font-family:'Barlow',sans-serif; font-weight:500; }
      .btn-ghost.sm { padding:9px; }
      .filebtn { display:inline-block; position:relative; overflow:hidden; cursor:pointer; }
      .fileinp { position:absolute; inset:0; width:100%; height:100%; opacity:0; cursor:pointer; font-size:0; }
      .linky { background:none; border:none; color:#5C7010; font-size:12px; font-weight:600; cursor:pointer; padding:0; margin-top:8px; display:inline-block; }
      .panel { background:#FDFDF8; border:1.5px solid rgba(20,23,14,.1); border-radius:20px;
        padding:14px; margin-top:12px; }
      .ptitle { font-family:'Oswald',sans-serif; font-size:14px; letter-spacing:.5px; color:#16190F; margin-bottom:10px; }
      .track { height:14px; background:#E4E3D5; border-radius:999px; overflow:hidden; padding:3px; box-sizing:border-box; }
      .fill { height:100%; border-radius:999px; transition:width .5s ease; }
      .stat-box { background:#FDFDF8; border:1.5px solid rgba(20,23,14,.1); border-radius:16px;
        padding:12px 6px; text-align:center; }
      .sb-num { font-family:'Oswald',sans-serif; font-size:17px; color:#16190F; }
      .sb-lbl { font-size:9.5px; color:#7A7F62; margin-top:3px; }
      .bubble { background:#FFFFFF; border:1.5px solid rgba(20,23,14,.12); border-radius:4px 16px 16px 16px;
        padding:11px 13px; font-size:13.5px; line-height:1.5; color:#26291D; }
      .bubble.coach { border-left:3px solid #1F8A3B; }
      .bubble.agent { border-left:3px solid #2E6ED6; }
      .bubble.cap { border-left:3px solid #D65A2E; }
      .bubble.press { border-left:3px solid #A87900; background:#FBF9EE; font-style:italic; }
      .bubble.press .bfrom { font-style:normal; }
      .bubble.offer { border-left:3px solid #9DBF17; background:#F7FBE4; }
      .bfrom { font-family:'Oswald',sans-serif; font-size:11px; letter-spacing:1px; color:#7A7F62; margin-bottom:5px; text-transform:uppercase; }
      .offer-card { border:1.5px solid; border-radius:20px; padding:14px; margin-bottom:14px; background:#FDFDF8; }
      /* --- chat estilo mensajería --- */
      .chat-row { display:flex; gap:12px; align-items:center; padding:12px 10px; margin-bottom:8px;
        cursor:pointer; border-radius:18px; background:#FDFDF8; border:1.5px solid rgba(20,23,14,.1); }
      .chat-row:active { background:#F3F3E8; }
      .chat-ava { border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
      .chat-name { font-family:'Oswald',sans-serif; font-size:14.5px; letter-spacing:.4px; color:#16190F;
        white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .chat-time { font-size:10.5px; color:#9a9e8e; flex-shrink:0; margin-left:8px; }
      .chat-prev { flex:1; min-width:0; font-size:12.5px; color:#7A7F62; white-space:nowrap; overflow:hidden;
        text-overflow:ellipsis; margin-top:2px; }
      .chat-badge { background:#CDF546; color:#16190F; font-size:10.5px; font-weight:700; border-radius:10px;
        border:1px solid #16190F; padding:1px 7px; flex-shrink:0; }
      .chat-head { position:sticky; top:0; z-index:30; display:flex; gap:10px; align-items:center;
        padding:10px 12px; background:rgba(239,238,227,.96); backdrop-filter:blur(8px); border-bottom:1.5px solid rgba(20,23,14,.1); }
      .chat-back { background:#FFFFFF; border:1.5px solid rgba(20,23,14,.2); border-radius:50%; width:34px; height:34px;
        color:#16190F; font-size:17px; cursor:pointer; line-height:1; flex-shrink:0; }
      .chat-sub { font-size:10.5px; color:#7A7F62; }
      .wbubble { position:relative; background:#FFFFFF; border:1.5px solid rgba(20,23,14,.12);
        border-radius:4px 16px 16px 16px; padding:9px 12px 18px; font-size:13.5px; line-height:1.5; color:#26291D;
        margin-bottom:10px; max-width:88%; }
      .wbubble.mine { margin-left:auto; background:#CDF546; border:1.5px solid #16190F; border-radius:16px 4px 16px 16px; }
      .wfrom { font-family:'Oswald',sans-serif; font-size:11px; letter-spacing:.8px; margin-bottom:3px; text-transform:uppercase; }
      .wtime { position:absolute; right:10px; bottom:4px; font-size:9.5px; color:#9a9e8e; }
      .day-sep { display:flex; justify-content:center; margin:14px 0 10px; }
      .day-sep span { background:#16190F; color:#EFEEE3; font-size:10.5px; border-radius:10px;
        padding:3px 12px; font-family:'Oswald',sans-serif; letter-spacing:1px; }
      .tabbar { position:fixed; bottom:10px; left:50%; transform:translateX(-50%); width:calc(100% - 20px); max-width:460px;
        display:flex; background:#16190F; border-radius:22px; padding:5px 6px; z-index:40;
        box-shadow:0 8px 24px rgba(20,23,14,.35); }
      .tabbtn { flex:1; min-width:0; background:none; border:none; color:#8d9279; padding:8px 0 9px; display:flex; flex-direction:column;
        align-items:center; gap:2px; cursor:pointer; font-family:'Barlow',sans-serif; border-radius:16px; }
      /* --- periódico --- */
      .np-cover { background:#F7F4E9; border:1.5px solid #16190F; border-radius:6px; padding:26px 18px 20px;
        text-align:center; cursor:pointer; box-shadow:6px 6px 0 rgba(20,23,14,.18); transform-style:preserve-3d; }
      /* Sin fotograma intermedio: CSS suaviza ENTRE cada par de fotogramas, así que
         uno en medio frenaba casi del todo y volvía a arrancar. Curva de entrada
         (acelera al salir) y bisagra en el lomo izquierdo, como un periódico real. */
      .np-opening { animation:npopen .42s cubic-bezier(.55,0,.85,.4) both;
        transform-origin:left center; will-change:transform, opacity; }
      @keyframes npopen {
        from { transform:perspective(1100px) rotateY(0deg); opacity:1; }
        to { transform:perspective(1100px) rotateY(-86deg); opacity:0; } }
      /* la página entra girando desde el mismo lomo: una sola secuencia continua */
      .np-open2 { animation:nppage .34s cubic-bezier(.2,.8,.3,1) both; transform-origin:left center; }
      @keyframes nppage {
        from { opacity:0; transform:perspective(1100px) rotateY(26deg); }
        to { opacity:1; transform:none; } }
      .np-page { background:#F7F4E9; border:1.5px solid rgba(20,23,14,.25); border-radius:6px;
        margin:10px 10px 96px; padding:16px 14px 8px; }
      .np-mast { font-family:'Oswald',sans-serif; font-weight:700; font-size:34px; letter-spacing:6px;
        text-align:center; color:#16190F; }
      .np-rule { height:3px; background:#16190F; margin:6px 0 4px; }
      .np-rule2 { height:1px; margin-top:2px; }
      .np-date { font-size:10px; color:#5c5f52; text-transform:uppercase; letter-spacing:1px; text-align:center; }
      .np-fold { font-size:44px; margin:18px 0 4px; }
      .np-tap { font-family:'Oswald',sans-serif; font-size:11px; letter-spacing:2px; color:#16190F;
        margin-top:10px; animation:nppulse 1.6s ease-in-out infinite; }
      @keyframes nppulse { 0%,100% { opacity:.4; } 50% { opacity:1; } }
      .np-kicker { display:inline-block; background:#16190F; color:#F7F4E9; font-family:'Oswald',sans-serif;
        font-size:9.5px; letter-spacing:2px; padding:2px 8px; margin-bottom:6px; }
      .np-h1 { font-family:'Oswald',sans-serif; font-size:23px; line-height:1.12; color:#16190F;
        margin:2px 0 8px; text-transform:uppercase; }
      .np-h2 { font-family:'Oswald',sans-serif; font-size:16px; line-height:1.2; color:#16190F; margin:2px 0 5px; }
      .np-body { font-size:12.8px; line-height:1.55; color:#33362B; margin:0; }
      .np-drop::first-letter { font-family:'Oswald',sans-serif; font-size:34px; float:left; line-height:.85;
        padding:3px 6px 0 0; color:#16190F; }
      .np-main { margin:12px 0 4px; padding-bottom:10px; border-bottom:1px solid rgba(20,23,14,.3); }
      .np-art { margin:10px 0; padding-bottom:10px; border-bottom:1px dotted rgba(20,23,14,.35); }
      .np-cols { display:flex; gap:10px; margin:12px 0 4px; }
      .np-box { flex:1; border:1.5px solid #16190F; padding:8px; min-width:0; }
      .np-boxtitle { font-family:'Oswald',sans-serif; font-size:10.5px; letter-spacing:2px;
        border-bottom:2px solid #16190F; padding-bottom:4px; margin-bottom:6px; color:#16190F; }
      .np-row { display:flex; justify-content:space-between; gap:6px; font-size:11px; padding:2px 0; color:#33362B; }
      .np-brief { font-size:10.8px; line-height:1.45; color:#33362B; margin:0 0 6px; }
      .np-humor { background:#EFEADA; border:1px solid rgba(20,23,14,.3); padding:10px 12px; margin-top:8px; }
      /* --- diálogo NPC --- */
      .npc-ov { position:fixed; inset:0; z-index:30; display:flex; flex-direction:column; justify-content:flex-end;
        background:linear-gradient(to top, rgba(5,7,13,.97) 30%, rgba(5,7,13,.55)); cursor:pointer; }
      .npc-count { position:absolute; top:14px; right:14px; background:#CDF546; color:#16190F;
        font-family:'Oswald',sans-serif; font-size:11px; letter-spacing:1px; padding:3px 10px; border-radius:10px; }
      .npc-art { position:absolute; left:50%; bottom:190px; transform:translateX(-50%); max-height:54vh;
        max-width:92vw; object-fit:contain; animation:npcin .3s cubic-bezier(.2,1.2,.4,1) both;
        pointer-events:none; filter:drop-shadow(0 12px 28px rgba(0,0,0,.55)); }
      @keyframes npcin { from { opacity:0; transform:translateX(-50%) translateY(24px) scale(.96); }
        to { opacity:1; transform:translateX(-50%) translateY(0) scale(1); } }
      .npc-fallback { width:150px; height:150px; border-radius:50%; display:flex; align-items:center;
        justify-content:center; font-family:'Oswald',sans-serif; font-size:64px; color:#fff; }
      .npc-panel { position:relative; z-index:2; padding:0 12px 92px; }
      .npc-name { display:inline-block; color:#fff; font-family:'Oswald',sans-serif; font-size:13px;
        letter-spacing:2px; padding:4px 14px; border-radius:8px 8px 0 0; text-transform:uppercase; }
      .npc-box { background:#101208; border:1.5px solid #CDF546; border-radius:0 12px 12px 12px;
        padding:14px; min-height:92px; color:#EFEEE3; font-size:15px; line-height:1.55; }
      .npc-caret { display:inline-block; margin-left:6px; color:#CDF546; animation:npccaret 1s ease-in-out infinite; }
      @keyframes npccaret { 0%,100% { transform:translateY(0); } 50% { transform:translateY(4px); } }
      .npc-hint { font-size:10px; color:#8A8E7C; text-align:right; margin-top:5px; letter-spacing:.5px; }
      .npc-ghost { background:rgba(255,255,255,.07); color:#EFEEE3; border-color:rgba(239,238,227,.35); }
      /* --- motor 2D del partido --- */
      .match-ov { background:radial-gradient(ellipse at 50% -10%, #14300F, #05070d 72%);
        justify-content:flex-start; padding:26px 14px 16px; overflow-y:auto; }
      .pitch { position:relative; width:100%; height:min(40vh,320px); background:#0E1109;
        border-radius:10px; overflow:hidden; border:1px solid rgba(205,245,70,.14); }
      .pl-line, .pl-ring, .pl-box { position:absolute; }
      .pl-line { background:rgba(205,245,70,.15); }
      .pl-ring { left:50%; top:50%; width:62px; height:62px; border-radius:50%;
        border:1px solid rgba(205,245,70,.15); transform:translate(-50%,-50%); }
      .pl-box { left:24%; right:24%; height:9%; border:1px solid rgba(205,245,70,.15); }
      .pl-svg { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; z-index:3; }
      .pl-dot { position:absolute; left:0; top:0; width:13px; height:13px; border-radius:50%;
        z-index:4; will-change:transform; }
      .pl-dot.yo { width:17px; height:17px; box-shadow:0 0 0 2px #16190F; z-index:5; }
      .pl-trail { position:absolute; left:0; top:0; width:5px; height:5px; border-radius:50%;
        background:#fff; opacity:0; z-index:5; }
      #ball, .pl-ball { position:absolute; left:0; top:0; width:8px; height:8px; border-radius:50%;
        background:#fff; z-index:6; will-change:transform; }
      .pl-flash { position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
        font-family:'Oswald',sans-serif; font-size:34px; letter-spacing:5px; color:#CDF546;
        opacity:0; transition:opacity .25s ease; pointer-events:none; z-index:7; }
      .m-tick { width:100%; max-width:360px; margin:10px auto 0; }
      /* --- calendario --- */
      .cal-cell { position:relative; aspect-ratio:1; border-radius:8px; box-sizing:border-box;
        display:flex; align-items:center; justify-content:center; cursor:pointer; }
      .cal-num { font-family:'Oswald',sans-serif; font-size:12px; color:#16190F; }
      /* con nota, el número se aparta a la esquina y manda el emoji */
      .cal-num.esq { position:absolute; top:1px; left:4px; font-size:9px; opacity:.7; }
      .cal-emo { font-size:15px; line-height:1; }
      .cal-dot { position:absolute; bottom:3px; right:3px; width:4px; height:4px;
        border-radius:50%; background:#16190F; opacity:.55; }
      /* --- gym --- */
      .sheet { width:100%; max-width:480px; background:#EFEEE3; border-radius:22px 22px 0 0; padding:16px 14px 22px;
        box-sizing:border-box; box-shadow:0 -8px 30px rgba(20,23,14,.35); animation:sheetup .28s cubic-bezier(.2,1,.3,1) both; }
      @keyframes sheetup { from { transform:translateY(60px); opacity:0; } to { transform:none; opacity:1; } }
      .ex-row { display:flex; align-items:center; gap:8px; padding:11px 10px; border-radius:12px; cursor:pointer;
        font-size:13.5px; color:#26291D; border-bottom:1px solid rgba(20,23,14,.07); }
      .ex-row:active { background:#E4E3D5; }
      .set-row { display:flex; align-items:center; gap:6px; padding:5px 0; }
      .set-n { width:18px; font-family:'Oswald',sans-serif; font-size:12px; color:#9a9e8e; flex-shrink:0; }
      .setinp { width:100%; min-width:0; flex:1; box-sizing:border-box; background:#FFFFFF; border:1.5px solid rgba(20,23,14,.14);
        color:#16190F; border-radius:10px; padding:8px 6px; font-size:14px; text-align:center; font-family:'Oswald',sans-serif; }
      .setinp:focus { outline:2px solid #16190F; outline-offset:1px; }
      .set-u { font-size:10px; color:#9a9e8e; flex-shrink:0; margin-right:2px; }
      .set-ok { width:34px; height:34px; flex-shrink:0; border-radius:11px; border:1.5px solid rgba(20,23,14,.25);
        background:#FFFFFF; color:#16190F; font-size:15px; cursor:pointer; font-weight:700; }
      .set-ok.on { background:#CDF546; border-color:#16190F; animation:chippop .25s cubic-bezier(.2,1.4,.4,1); }
      .rest-bar { position:sticky; top:6px; z-index:25; margin:12px 0; background:#16190F; border-radius:14px;
        overflow:hidden; padding:10px 12px; color:#EFEEE3; }
      .rest-fill { position:absolute; inset:0; background:rgba(205,245,70,.22); transition:width 1s linear; }
      .rest-txt { position:relative; display:flex; align-items:center; justify-content:space-between; gap:8px;
        font-family:'Oswald',sans-serif; font-size:14px; letter-spacing:.5px; }
      .rest-txt .chip { background:transparent; border-color:rgba(239,238,227,.4); color:#EFEEE3; font-size:11px; }
      .tabbtn.on { color:#16190F; background:#CDF546; font-weight:600; }
      .dot { position:absolute; top:-4px; right:-10px; background:#CDF546; color:#16190F; font-size:9px; border-radius:8px;
        border:1px solid #16190F; padding:1px 5px; font-weight:700; }
      .fut-card { position:relative; border-radius:18px; overflow:hidden; box-shadow:0 12px 32px rgba(20,23,14,.35);
        border:1.5px solid rgba(20,23,14,.4); }
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
      /* lenguaje de animación común: micro .22-.25s ease, celebraciones .5s+ */
      .tab-in { animation:tabin .22s ease both; }
      @keyframes tabin { from { opacity:0; transform:translateY(8px);} to { opacity:1; transform:none; } }
      .chip.on { animation:chippop .25s cubic-bezier(.2,1.4,.4,1); }
      @keyframes chippop { 0% { transform:scale(.92);} 60% { transform:scale(1.06);} 100% { transform:none; } }
      .event-new { animation:evflash .8s ease both; }
      @keyframes evflash { 0% { background:rgba(205,245,70,.45);} 100% { background:rgba(255,255,255,.04);} }
      .empty { text-align:center; color:#8A8E7C; font-size:13px; padding:26px 12px; line-height:1.6; }
      .empty .em-ico { font-size:30px; display:block; margin-bottom:6px; }
      .fade-seq { opacity:0; animation:fadeup .9s ease forwards; }
      @keyframes fadeup { from { opacity:0; transform:translateY(14px);} to { opacity:1; transform:none; } }
      .toast { position:fixed; bottom:84px; left:50%; transform:translateX(-50%); background:#16190F; color:#EFEEE3;
        border:1.5px solid #CDF546; border-radius:14px; padding:10px 16px; font-size:13px; z-index:80;
        animation:pop .3s ease both; max-width:90%; text-align:center; }
      @media (prefers-reduced-motion: reduce) { .fut-shine, .fade-seq, .official-flash, .card-drop, .pop-in, .event-in { animation:none !important; opacity:1 !important; } }
    `}</style>
  );
}
