import React, { useState, useEffect, useRef, useCallback } from "react";

/* ============================================================
   MI CARRERA — Habit tracker estilo FIFA / Modo Carrera
   ============================================================ */

const STAT_KEYS = ["FIS", "FUE", "RES", "NUT", "REC", "MEN"];
const STAT_LABELS = { FIS: "Físico", FUE: "Fuerza", RES: "Resistencia", NUT: "Nutrición", REC: "Recuperación", MEN: "Mentalidad" };
const OVR_WEIGHTS = { FIS: 0.22, FUE: 0.2, RES: 0.15, NUT: 0.18, REC: 0.12, MEN: 0.13 };
const POSITIONS = ["DEL", "EXT", "MCO", "MC", "MCD", "LTD", "LTI", "DFC", "POR"];
/* probabilidad de gol/asistencia por posición: nadie se queda a 0 goles de por vida,
   pero un central no remata tanto como un delantero. Multiplican a "perf" (0-1 aprox). */
const GOAL_RATE = { DEL: 0.75, EXT: 0.75, MCO: 0.75, MC: 0.30, MCD: 0.22, LTD: 0.16, LTI: 0.16, DFC: 0.14, POR: 0.015 };
const ASSIST_RATE = { DEL: 0.45, EXT: 0.45, MCO: 0.45, MC: 0.55, MCD: 0.45, LTD: 0.35, LTI: 0.35, DFC: 0.25, POR: 0.05 };

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
const streakMultOf = (s) => 1 + Math.min(s || 0, 25) * 0.03;

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
const emptyGym = () => ({ routines: DEFAULT_ROUTINES.map((r) => ({ ...r })), custom: [], sessions: [], prs: {}, active: null, restDefault: 150 });
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
  /* partidas de antes de que la ruleta tuviera "kind" (o con un item ya no existente
     en ITEMS) podían dejar un casinoLastSpin que rompía CUALQUIER pantalla de zona,
     no solo el Casino: se descarta si no tiene una forma reconocible */
  if (out.casinoLastSpin) {
    const ls = out.casinoLastSpin;
    const valid = ls.kind === "xp" || ls.kind === "fichas" || (ls.kind === "item" && ITEMS[ls.itemId]);
    if (!valid) delete out.casinoLastSpin;
  }
  /* Coco v2 (ver refreshCocoVisit): antes rotaba por Parque/Barrio cada 5 días. Una partida
     guardada a mitad de aquel ciclo podía dejarla plantada en una zona que ya no le
     corresponde, o con una "próxima visita" hasta 5 días por delante — ambas cosas
     incompatibles con el puesto fijo y el ciclo de días alternos. Se descartan las dos:
     refreshCocoVisit generará una visita nueva y correcta en el Centro Comercial. */
  if (out.cocoVisit && out.cocoVisit.zone !== "tienda") { delete out.cocoVisit; delete out.cocoNextVisitDay; }
  /* gym: crear estructura en partidas anteriores al módulo y compactar sesiones antiguas.
     restDefault nunca ha sido configurable por el jugador (no existe UI para cambiarlo), así
     que cualquier partida guardada con el antiguo valor de 90s (1:30) se migra al nuevo
     default de 150s (2:30) en vez de quedarse con el objeto viejo por el spread. */
  const gymIn = { ...(out.gym || {}) };
  if (gymIn.restDefault === 90) gymIn.restDefault = 150;
  out.gym = pruneGym({ ...emptyGym(), ...gymIn });
  /* Karlos, Mabel, Dino, Yuni, Lili, Cubarsí, Yamal, Irina, Punky y Fortuna se han
     quitado del juego (roster recortado a menos personajes, mejor desarrollados):
     limpia rastros de partidas guardadas antes de cada recorte para que no se quede
     un aviso de "pendiente" imposible de abrir ni una misión colgada sin poder avanzar.
     Además, con el rework del sistema narrativo, las variantes por zona dejaron de ser
     npc-keys aparte (elisa_playa, lopez_car, etc.) y pasaron a ser un mood más del
     personaje base (ver NPCS): cualquier rastro de esos npc-keys en una partida antigua
     se remapea al personaje base + zona en vez de perderse. */
  const REMOVED_NPCS = ["mabel", "karlos", "dino", "yuni", "lili", "cubarsi", "yamal", "irina", "punky", "fortuna"];
  /* npc-key antiguo de variante -> [personaje base, mood equivalente si tenía arte propio, zona] */
  const VARIANT_MIGRATION = {
    elisa_casual: ["elisa", "casual", "parque"], elisa_playa: ["elisa", "playa", "playa"],
    elisa_gala: ["elisa", "gala", "casino"], elisa_estadio: ["elisa", null, "estadio"],
    karla_casual: ["lisa", "casual", "parque"], karla_playa: ["lisa", "playa", "playa"],
    karla_car: ["lisa", null, "car"],
    milly_playa: ["milly", "playa", "playa"], milly_prensa: ["milly", null, "prensa"],
    lopez_playa: ["lopez", "playa", "playa"], lopez_car: ["lopez", null, "car"],
    lopez_cantera: ["lopez", null, "cantera"], lopez_tienda: ["lopez", null, "tienda"],
    lopez_estadio: ["lopez", null, "estadio"],
    yuna_tienda: ["yuna", null, "tienda"], yuna_estadio: ["yuna", null, "estadio"],
  };
  if (out.npcQueue) {
    out.npcQueue = out.npcQueue
      .filter((e) => !REMOVED_NPCS.includes(e.npc))
      .map((e) => {
        const vm = VARIANT_MIGRATION[e.npc];
        if (!vm) return e;
        const [base, mood, zone] = vm;
        return { ...e, npc: base, mood: mood || e.mood, zone: e.zone || zone };
      });
  }
  if (out.introQueued) {
    const rest = { ...out.introQueued };
    delete rest.metMabel; delete rest.metKarlos; delete rest.metDino; delete rest.metYuni;
    delete rest.metLili; delete rest.metCubarsi; delete rest.metYamal; delete rest.metIrina;
    delete rest.metPunky; delete rest.metFortuna;
    out.introQueued = rest;
  }
  if (out.inventory) {
    const inv = { ...out.inventory };
    delete inv.pulsera_vieja_escuela; delete inv.camara_vintage; delete inv.edicion_especial;
    out.inventory = inv;
  }
  if (out.seenMoods) {
    const rest = {};
    Object.entries(out.seenMoods).forEach(([npcKey, moods]) => {
      if (REMOVED_NPCS.includes(npcKey)) return;
      const vm = VARIANT_MIGRATION[npcKey];
      if (!vm) { rest[npcKey] = { ...(rest[npcKey] || {}), ...moods }; return; }
      const [base, mood] = vm;
      if (!mood) return; /* variante sin pose propia (reutilizaba arte del personaje base): nada que migrar */
      rest[base] = { ...(rest[base] || {}), [mood]: !!moods.idle || Object.values(moods).some(Boolean) };
    });
    out.seenMoods = rest;
  }
  /* migración de game.quests/questPending (forma plana, sin capítulos) a
     game.stories/storyPending (ver STORIES): se envuelve el mismo progreso en
     capítulo 0 sin perder nada de lo avanzado */
  if (out.quests && !out.stories) {
    const stories = {};
    Object.entries(out.quests).forEach(([key, qs]) => { stories[key] = { chapter: 0, ...qs }; });
    out.stories = stories;
    delete out.quests;
  }
  if (out.questPending && !out.storyPending) { out.storyPending = out.questPending; delete out.questPending; }
  if (out.stories) { const rest = { ...out.stories }; REMOVED_NPCS.forEach((k) => delete rest[k]); out.stories = rest; }
  if (out.storyPending) { const rest = { ...out.storyPending }; REMOVED_NPCS.forEach((k) => delete rest[k]); out.storyPending = rest; }
  /* pendingAppearances de antes del rework guardaban el nombre de display de una variante
     ("López Playa") en vez de la clave de personaje ("lopez"): esas entradas ya no se
     pueden resolver (la variante no existe como pool aparte), así que se descartan sin más
     — es solo una línea ambiental provisional pendiente, no progreso real que se pierda */
  if (out.pendingAppearances) out.pendingAppearances = out.pendingAppearances.filter((p) => p && p.npc);
  /* reset del sistema de desbloqueo de zonas: antes se abrían automáticamente por
     estadísticas (OVR, goles, temporada...), ahora solo por eventos narrativos
     (unlockZone). Cualquier partida que no tenga ya este campo (todas las
     anteriores a este cambio, incluidas las que tuvieran zonas "desbloqueadas"
     por el sistema antiguo) arranca de cero con solo Casa + Barrio disponibles. */
  if (!out.unlockedZones) out.unlockedZones = [...DEFAULT_UNLOCKED_ZONES];
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
  /* si la historia de un personaje ya empezó (stories[key] existe) pero el flag de
     "ya lo conoces" que usan CARDS/AMBIENT_BY_CHAR nunca llegó a fijarse — p.ej. una
     partida arrastrada de antes de que el prólogo actual lo marcara — se rellena aquí
     para que la carta no se quede bloqueada eternamente aunque la conversación real
     ya haya pasado */
  const MET_FLAG_BY_STORY = { milly: "metMilly", lisa: "metLisa", igor: "metIgor", yuna: "yunaMet" };
  if (out.stories) {
    Object.entries(MET_FLAG_BY_STORY).forEach(([key, flag]) => {
      if (out.stories[key] && !out[flag]) out[flag] = true;
    });
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

/* XP al cerrar un día. boost (ver game.activeBoost/ITEMS kind:"cassette"): { stat, mult } o
   null — "ALL" en boost.stat multiplica los seis stats a la vez (cassette ALL IN). Fórmula
   del documento de Alexia: XP final = XP base × bonus de racha × bonus de cassette; son
   sistemas independientes, ninguno sustituye al otro. */
function applyDayClose(player, log, dateStr, boost) {
  const boostMultOf = (k) => (boost && (boost.stat === k || boost.stat === "ALL")) ? boost.mult : 1;
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
    xp[k] = (xp[k] || 0) + Math.round(gains[k] * mult * sMult * boostMultOf(k)) + (k === "MEN" ? flatMEN : 0);
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
/* consume un día del cassette activo (ver game.activeBoost/activateCassette): devuelve el
   boost que debe aplicar ESTE cierre de día (o null si no hay ninguno) y el activeBoost que
   debe quedar guardado después — un día por cada cierre real, tanto si el jugador cierra
   manualmente como si la ventana de gracia cierra varios días atrasados de golpe. */
function consumeBoostDay(activeBoost) {
  if (!activeBoost || activeBoost.daysLeft <= 0) return { boost: null, next: null };
  const boost = { stat: activeBoost.stat, mult: activeBoost.mult };
  const daysLeft = activeBoost.daysLeft - 1;
  return { boost, next: daysLeft > 0 ? { ...activeBoost, daysLeft } : null };
}

/* simulación de partido */
function simulateMatch(player, rival, jornada) {
  const f = player.form || "est";
  const perf = { alza: 0.88, buen: 0.72, est: 0.5, caida: 0.28 }[f] + (calcOVR(player.stats) - 62) * 0.006 + rnd(-0.08, 0.08);
  const benched = f === "caida" && Math.random() < 0.5;
  const gf = Math.max(0, Math.round(rnd(0, 1.2) + perf * 2.6));
  const ga = Math.max(0, Math.round(rnd(0, 1.1) + (1 - perf) * 2.2));
  const goalRate = GOAL_RATE[player.position] ?? 0.3;
  const assistRate = ASSIST_RATE[player.position] ?? 0.35;
  let myGoals = 0, myAssists = 0;
  if (!benched && gf > 0) {
    for (let i = 0; i < gf; i++) {
      if (Math.random() < perf * goalRate) myGoals++;
      else if (Math.random() < perf * assistRate) myAssists++;
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
  /* memoria cruzada entre personajes y callbacks de decisiones */
  metLisa: (c) => c.metLisa, metMilly: (c) => c.metMilly,
  metYuna: (c) => c.metYuna, metIgor: (c) => c.metIgor,
  lisaTilin: (c) => c.lisaTilin, millySecret: (c) => c.millySecret,
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
  /* memoria cruzada: a quién conoces ya, para que los personajes se mencionen entre ellos
     y para pequeños "callbacks" a decisiones concretas que tomaste en otras conversaciones */
  c.metLisa = !!g.metLisa; c.metMilly = !!g.metMilly;
  c.metYuna = !!g.yunaMet; c.metIgor = !!g.metIgor;
  c.lisaTilin = !!g.lisaTilin; c.millySecret = !!g.millySecret;
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
/* ============================================================
   PERSONAJES · una única identidad por persona (sin npc-keys de
   variante por zona: la zona es contexto de la escena, no una
   entidad de personaje distinta — ver STORIES más abajo y el
   campo "zone" en las escenas). Cada uno tiene un set de "arts"
   (moods/poses); algunas poses vienen de las antiguas variantes
   fuera-de-servicio, ahora fundidas aquí como un mood más. --- */
const NPCS = {
  lopez: { name: "López", color: "#D65A2E", voice: "/audio/vozchico02.mp3", icon: "/images/lopez/lopez_icon.webp",
    /* capitan: liderazgo, reservado para escenas clave. playa: outfit único, no se mezcla
       con moods de uniforme dentro de una misma escena. */
    arts: { idle: "/images/lopez/Lopez_idle.webp", happy: "/images/lopez/Lopez_happy.webp",
      playa: "/images/lopez/lopez_playa.webp", serio: "/images/lopez/lopez_serio.webp",
      preocupado: "/images/lopez/lopez_preocupado.webp", agotado: "/images/lopez/lopez_agotado.webp",
      capitan: "/images/lopez/lopez_capitan.webp", orgulloso: "/images/lopez/lopez_orgulloso.webp",
      celebracion: "/images/lopez/lopez_celebracion.webp" }, def: "idle" },
  /* en Yuna, "angry" es en realidad SONROJADA: es su cara de tsundere pillada en falta.
     "preocupada" es su preocupación genuina, sin la careta puesta, antes de taparla con el
     sonrojo/enfado. "barcelona" es su lado fan sin disimulo, para cuando habla del Barça en sí.
     "playa" reservada, sin usar todavía en ninguna escena. */
  yuna: { name: "Yuna", color: "#D4537E", voice: "/audio/vozchica01.mp3", icon: "/images/yuna/yuna_icon.webp",
    /* playa/playablush: mismo arte de outfit (no hay pose "playa" neutra por separado
       todavía) — se mantienen como moods distintos en los diálogos para cuando exista una
       imagen propia de cada una, pero hoy comparten archivo en vez de mezclar con un
       mood de uniforme, que rompería la regla de outfits del documento de Yuna. */
    arts: { idle: "/images/yuna/Yuna_idle.webp", happy: "/images/yuna/Yuna_happy.webp", angry: "/images/yuna/Yuna_angry.webp",
      preocupada: "/images/yuna/yuna_preocupada.webp", barcelona: "/images/yuna/yuna_barcelona.webp",
      blush: "/images/yuna/Yuna_blush.webp", celosa: "/images/yuna/yuna_celosa.webp", enamorada: "/images/yuna/yuna_enamorada.webp",
      playa: "/images/yuna/yuna_playablush.webp", playablush: "/images/yuna/yuna_playablush.webp" }, def: "idle" },
  /* en Elisa, "angry" es su cara de decepción contenida: para semanas flojas o cuando habla de
     entrenadora estricta. "casual"/"playa"/"gala" son sus tres facetas fuera de servicio. */
  elisa: { name: "Elisa", color: "#2E6ED6", voice: "/audio/vozchica02.mp3", icon: "/images/elisa/elisa_icon.webp",
    /* a partir de ahora los assets de Elisa viven en su propia carpeta (public/images/elisa/);
       el resto de personajes se irá moviendo igual más adelante, personaje a personaje.
       angry = decepción contenida, nunca enfado explosivo (ver ELISA_STORY). gala/playa son
       outfits: solo se usan en sus propias escenas, nunca se mezclan con otro mood. */
    arts: { idle: "/images/elisa/Elisa_idle.webp", happy: "/images/elisa/Elisa_happy.webp", angry: "/images/elisa/Elisa_angry.webp",
      casual: "/images/elisa/elisa_casual.webp", playa: "/images/elisa/elisa_playa.webp", gala: "/images/elisa/elisa_gala.webp",
      agotada: "/images/elisa/elisa_agotada.webp", celebracion: "/images/elisa/elisa_celebracion.webp",
      decidida: "/images/elisa/elisa_decidida.webp", orgullosa: "/images/elisa/elisa_orgullosa.webp",
      preocupada: "/images/elisa/elisa_preocupada.webp", sorprendida: "/images/elisa/elisa_sorprendida.webp",
      suave: "/images/elisa/elisa_suave.webp" }, def: "idle" },
  /* Karla: futbolista pro, gestiona patrocinios. Su "angry" es en realidad ENGREÍDA/chulería,
     no enfado real. "casual"/"playa" son sus dos facetas fuera de servicio. */
  /* set de moods reconstruido para KARLA_STORY (los archivos idle/happy/angry/casual
     antiguos ya no existen, sustituidos por este set más rico organizado por outfit):
     gala_* (Casino/eventos VIP), negociadora/profesional/molesta/orgullosa (profesional,
     Patrocinadores/Prensa), personal_orgullosa/preocupada/vulnerable (Ático/Casa, íntimo),
     playa (outfit único). No hay "idle" ni "happy" sueltos: def cae en "profesional". Dos
     sustituciones documentadas donde el guion pide un mood sin asset propio fuera de gala:
     [ego] en zona no-gala → "negociadora" (asertiva/confiada, más cercano a la chulería
     de ego sin mezclar el outfit de gala); [happy]/[serio] sueltos → "profesional". */
  lisa: { name: "Karla", color: "#9C6BD6", voice: "/audio/vozchica02.mp3", icon: "/images/karla/karla_icon.webp",
    arts: { gala_idle: "/images/karla/karla_gala_idle.webp", gala_ego: "/images/karla/karla_gala_ego.webp",
      gala_happy: "/images/karla/karla_gala_happy.webp", gala_vulnerable: "/images/karla/karla_gala_vulnerable.webp",
      negociadora: "/images/karla/karla_negociadora.webp", profesional: "/images/karla/karla_profesional.webp",
      molesta: "/images/karla/karla_molesta.webp", orgullosa: "/images/karla/karla_orgullosa.webp",
      personal_orgullosa: "/images/karla/karla_personal_orgullosa.webp", preocupada: "/images/karla/karla_preocupada.webp",
      vulnerable: "/images/karla/karla_vulnerable.webp", playa: "/images/karla/karla_playa.webp" }, def: "profesional" },
  /* Milly: la del Kiosco, te trae el periódico en persona cada día; también hace de periodista
     en la Sala de Prensa. Alegre, cotilla, algo dramática. Sin angry.
     "periodico" es su pose sujetando el periódico, para el instante exacto de la entrega.
     "playa" es su faceta fuera de servicio. */
  milly: { name: "Milly", color: "#C97A2E", voice: "/audio/vozchica01.mp3", icon: "/images/milly/milly_icon.webp",
    /* periodico: SOLO para la entrega física del periódico diario (kiosco), no como mood
       genérico. playa: outfit completo, no se mezcla con otros moods dentro de una escena. */
    arts: { idle: "/images/milly/milly_idle.webp", happy: "/images/milly/milly_happy.webp",
      periodico: "/images/milly/milly_periodico.webp", playa: "/images/milly/milly_playa.webp",
      curiosa: "/images/milly/milly_curiosa.webp", sorprendida: "/images/milly/milly_sorprendida.webp",
      preocupada: "/images/milly/milly_preocupada.webp", decidida: "/images/milly/milly_decidida.webp",
      orgullosa: "/images/milly/milly_orgullosa.webp" }, def: "idle" },
  /* Igor: chef estrella del Restaurante (Metrópolis). Grande, carismático, trata la nutrición
     como táctica de fútbol. Sin angry: solo idle y happy. */
  /* chef: pose de máxima identidad profesional (presenta/prepara un plato), reservada
     para escenas clave. playa: outfit independiente, no se mezcla con otros moods. */
  igor: { name: "Igor", color: "#B5651D", voice: "/audio/vozchico01.mp3", icon: "/images/igor/igor_icon.webp",
    arts: { idle: "/images/igor/igor_idle.webp", happy: "/images/igor/igor_happy.webp",
      serio: "/images/igor/igor_serio.webp", preocupado: "/images/igor/igor_preocupado.webp",
      orgulloso: "/images/igor/igor_orgulloso.webp", chef: "/images/igor/igor_chef.webp",
      cansado: "/images/igor/igor_cansado.webp", celebracion: "/images/igor/igor_celebracion.webp",
      playa: "/images/igor/igor_playa.webp" }, def: "idle" },
  /* Beka: futbolista rival de otro club, competitiva y macarra. "angry" es pique
     competitivo/chulería, nunca enfado real (igual que en Karla/Yuna). disco_happy/
     disco_seria son su faceta nocturna en la Discoteca (donde trabaja); playa es su
     outfit fuera de servicio. Sin "happy" suelto: def cae en "idle". */
  beka: { name: "Beka", color: "#C81E3A", voice: "/audio/vozchica01.mp3", icon: "/images/beka/beka_icon.webp",
    arts: { idle: "/images/beka/beka_idle.webp", angry: "/images/beka/beka_angry.webp",
      celebracion: "/images/beka/beka_celebracion.webp", agotada: "/images/beka/beka_agotada.webp",
      disco_happy: "/images/beka/beka_disco_happy.webp", disco_seria: "/images/beka/beka_disco_seria.webp",
      playa: "/images/beka/beka_playa.webp" }, def: "idle" },
  /* Nina: la pescadora de la Playa. Sin outfits nuevos (el documento pide reutilizar solo
     estos 5 moods + "lanzandocaña", la pose exclusiva que usa la secuencia de pesca —
     ver FishingSequence — mientras lanza/espera/nota el picotazo, antes de revelar la
     captura). Sin "idle": def cae en "seria", su registro más neutro. */
  nina: { name: "Nina", color: "#2E9EC9", voice: "/audio/vozchica02.mp3", icon: "/images/nina/nina_icon.webp",
    arts: { happy: "/images/nina/nina_happy.webp", orgullosa: "/images/nina/nina_orgullosa.webp",
      seria: "/images/nina/nina_seria.webp", sorprendida: "/images/nina/nina_sorprendida.webp",
      "lanzandocaña": "/images/nina/nina_lanzandocaña.webp" }, def: "seria" },
  /* Coco: la tendera pija del Centro Comercial (ver COCO_STORY y game.cocoVisit/
     refreshCocoVisit — puesto fijo, presente un día sí y otro no). El documento solo
     define idle/blush/sorprendida (y pide explícitamente "no hacen falta poses nuevas por
     ahora"), pero su guion sí usa [seria] y [happy] sin asset propio: se dejan tal cual y
     caen automáticamente a "idle" (npc.def) por el fallback ya existente del motor
     (npc.arts[mood] || npc.arts[npc.def]), sin inventar assets nuevos. */
  coco: { name: "Coco", color: "#2EA88A", voice: "/audio/vozchica01.mp3", icon: "/images/coco/coco_icon.webp",
    arts: { idle: "/images/coco/coco_idle.webp", blush: "/images/coco/coco_blush.webp",
      sorprendida: "/images/coco/coco_sorprendida.webp" }, def: "idle" },
  /* Vera: artista observadora (ver VERA_STORY). El documento no define un asset para el
     mood [suave] que su guion usa varias veces — igual que con Coco, se deja el mood tal
     cual y cae automáticamente a "idle" (npc.def) mediante el fallback ya existente
     (npc.arts[entry.mood] || npc.arts[npc.def]), sin inventar un asset nuevo. */
  vera: { name: "Vera", color: "#8A6FD6", voice: "/audio/vozchica02.mp3", icon: "/images/vera/vera_icon.webp",
    arts: { idle: "/images/vera/vera_idle.webp", happy: "/images/vera/vera_happy.webp",
      seria: "/images/vera/vera_seria.webp", preocupada: "/images/vera/vera_preocupada.webp",
      pintora: "/images/vera/vera_pintora.webp", pintora_pensando: "/images/vera/vera_pintora_pensando.webp",
      playa: "/images/vera/vera_playa.webp", playa_regalo: "/images/vera/vera_playa_regalo.webp" }, def: "idle" },
  /* Alexia: introduce los cassettes (ver ALEXIA_STORY/ITEMS kind:"cassette"). El documento
     todavía no trae todos sus assets — solo idle, icon y music están listos por ahora; el
     resto de moods que usa su guion (happy, blush, y seria — este último ni siquiera está
     en la lista de assets del documento) caen al fallback ya existente del motor
     (npc.arts[mood] || npc.arts[npc.def]) hasta que lleguen las ilustraciones reales, igual
     que se ha hecho con Coco/Vera para moods sin imagen propia. */
  alexia: { name: "Alexia", color: "#F2542D", voice: "/audio/vozchica01.mp3", icon: "/images/alexia/alexia_icon.webp",
    arts: { idle: "/images/alexia/alexia_idle.webp", music: "/images/alexia/alexia_music.webp" }, def: "idle" },
  /* Milo: criatura que se esconde tras una roca en el Parque (ver MILO_STORY). Su campaña
     narra el arco visual completo del documento (escondido -> shy -> idle -> happy) con
     los 4 assets ya listos, uno por etapa de confianza. def:"idle" (no "escondido") porque
     es el mood más neutro para cualquier beat futuro sin mood explícito, no el punto de
     partida de la historia — cada etapa ya especifica su propio mood real. */
  milo: { name: "Milo", color: "#4E8B57", voice: "/audio/vozchico01.mp3", icon: "/images/milo/milo_icon.webp",
    arts: { escondido: "/images/milo/milo_escondido.webp", shy: "/images/milo/milo_shy.webp",
      idle: "/images/milo/milo_idle.webp", happy: "/images/milo/milo_happy.webp" }, def: "idle" },
};
/* el sender siempre es el nombre real del personaje ahora (la zona ya no crea una
   identidad de sender distinta: es contexto de la escena, ver campo "zone" en addMsg/addScene) */
const senderToNpc = (from) => {
  if (from === "Entrenador" || from === "Tu agente" || from === "Elisa") return "elisa";
  if (from === "Yuna") return "yuna";
  if (from === "Karla") return "lisa";
  if (from === "Milly") return "milly";
  if (from === "Igor") return "igor";
  if (from === "López" || from.includes("Capitán") || from.includes("· Vestuario")) return "lopez";
  if (from === "Beka") return "beka";
  if (from === "Nina") return "nina";
  if (from === "Coco") return "coco";
  if (from === "Vera") return "vera";
  if (from === "Alexia") return "alexia";
  if (from === "Milo") return "milo";
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

/* Sonido del sobre al tocarlo para abrirlo (ver SobreReveal): mismo ruido blanco filtrado
   que paperRustle pero más corto y agudo, imitando el crujido rápido del papel. Sintetizado
   igual que el resto de sonidos del juego, sin cargar ningún archivo nuevo. */
function envelopeShake() {
  if (!VOICES_ON) return;
  try {
    if (!AUDIO.ctx) AUDIO.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (AUDIO.ctx.state === "suspended") AUDIO.ctx.resume();
    const ctx = AUDIO.ctx, t = ctx.currentTime, dur = 0.22;
    const n = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 3600; bp.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.14, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp); bp.connect(g); g.connect(ctx.destination);
    src.start(t); src.stop(t + dur);
    AUDIO.live.add(src);
    src.onended = () => AUDIO.live.delete(src);
  } catch (e) {}
}
/* Sonido de revelación del sobre/cuadro: arpegio ascendente de 3 notas (osciladores puros),
   el mismo "shimmer" de recompensa reutilizado tanto por SobreReveal como por CuadroReveal
   para que las pantallas de recompensa grande del juego suenen coherentes entre sí. */
function rewardShimmer() {
  if (!VOICES_ON) return;
  try {
    if (!AUDIO.ctx) AUDIO.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (AUDIO.ctx.state === "suspended") AUDIO.ctx.resume();
    const ctx = AUDIO.ctx, t = ctx.currentTime;
    [0, 0.07, 0.14].forEach((delay, i) => {
      const osc = ctx.createOscillator(); osc.type = "sine";
      const freq = 520 + i * 220;
      osc.frequency.setValueAtTime(freq, t + delay);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.6, t + delay + 0.16);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t + delay);
      g.gain.exponentialRampToValueAtTime(0.1, t + delay + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.28);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(t + delay); osc.stop(t + delay + 0.3);
      AUDIO.live.add(osc);
      osc.onended = () => AUDIO.live.delete(osc);
    });
  } catch (e) {}
}

/* corta cualquier voz en curso: al cerrar el diálogo no debe seguir sonando nada */
function hushVoices() {
  AUDIO.live.forEach((s) => { try { s.stop(); } catch (e) {} });
  AUDIO.live.clear();
}

/* --- YUNA · fan tsundere del Barça; conoce tus números "por sus fuentes" --- */
/* escena de dos frases: se presenta tranquila y luego se le escapa el sonrojo.
   Aparece tras tu primer gol de la carrera, no tras tu primera victoria. */
/* ============================================================
   HISTORIAS · escenas de origen y contenido ambiental temporal.
   ------------------------------------------------------------
   Este bloque sustituye al antiguo sistema de "pools de frases
   casuales elegidas al azar" (ver STORIES más abajo para la
   infraestructura de capítulos/misiones). De aquella arquitectura
   se conserva:
     - las escenas de PRIMER ENCUENTRO de cada personaje (siguen
       siendo el inicio real de su historia, ahora "capítulo 0");
     - un puñado de líneas AMBIENTE por personaje (2-4 cada uno,
       reutilizadas tal cual del pool anterior), que la rotación
       diaria usa como placeholder de presencia mientras ese
       personaje no tiene contenido de capítulo pendiente. Esto es
       contenido PROVISIONAL a sustituir cuando se escriba la
       historia real de cada uno — no es narrativo, es solo para
       que la ciudad no se quede muda entre capítulos.
   Todo el pool completo anterior (incluidas las variantes por
   zona: Elisa/Karla/Milly/López/Yuna "fuera de servicio") sigue
   disponible en el historial de git de la rama `main`, sin perder
   ni una línea, por si sirve de referencia de tono al diseñar las
   historias definitivas.
   ============================================================ */
/* la escena de primer encuentro de Yuna ya no vive aquí suelta: es el prólogo de
   YUNA_STORY (chapter.trigger espera careerGoals(g) > 0), su "capítulo 0" real. */
/* relleno genérico entre capítulos de su historia real (ver YUNA_STORY): sin referencias
   a objetos/momentos concretos de la campaña (bufanda, foto, playa...), que ya tienen su
   propia escena dedicada — esto es solo para que no desaparezca semanas entre capítulo y
   capítulo mientras el jugador cumple el objetivo de turno. */
const AMBIENT_YUNA = [
  { beats: [
    { m: "idle", t: "He mirado el calendario de {league}. Por curiosidad estadística, que conste." },
    { m: "angry", t: "¡No es que esté pendiente de cuándo jugáis! Solo llevo la cuenta de los resultados." }] },
  { beats: [
    { m: "idle", t: "Alguien del insti dijo hoy que 'te sigo demasiado' y le contesté que soy analista deportiva." },
    { m: "angry", t: "Luego me pasé la tarde roja. ¡Por el enfado! Solo por eso. No por otra cosa." }] },
];

/* ELISA no tiene escena de primer encuentro: se conoce desde el minuto uno (mánager del club) */
/* AMBIENTE PLACEHOLDER — sustituir cuando se escriba la historia real de Elisa */
const AMBIENT_ELISA = [
  { beats: [
    { m: "idle", t: "¡Buenas! No es nada urgente." },
    { m: "happy", t: "Solo decirte que se habla bien de ti en los despachos. Tú a lo tuyo, que de mover los hilos me encargo yo. 💼" }] },
  { beats: [
    { m: "idle", t: "Recordatorio de mánager, apúntatelo si hace falta:" },
    { m: "idle", t: "los contratos se firman con la cabeza fría y los partidos se juegan con la sangre caliente. No mezclar, que te conozco." }] },
];

/* la escena de primer encuentro de López ya vive en LOPEZ_STORY (su prólogo, "El nuevo"):
   esto es solo relleno genérico entre capítulos de su historia real, sin referencias a
   objetos/momentos concretos de la campaña (llave, taquilla, foto, brazalete). */
const AMBIENT_LOPEZ = [
  { beats: [
    { m: "idle", t: "Confesión de capitán: cuando llegué a este club tenía más miedo que tú el primer día. Me escondía en el baño para no hablar en las charlas tácticas." },
    { m: "happy", t: "Ahora mírame, no me calla ni el míster. Todo se aprende, hasta lo de abrir la boca 😄" }] },
  { beats: [
    { m: "idle", t: "El presi ha vuelto a confundir mi nombre con el del utillero delante de un patrocinador. Tercera vez este mes." },
    { m: "happy", t: "Ya ni me molesto en corregirle, directamente respondo a los dos nombres como si fuera normal 😂" }] },
];

/* la escena de primer encuentro de Karla ya vive en KARLA_STORY (su prólogo, "Tu primera
   marca"): esto es solo relleno genérico entre capítulos de su historia real, sin
   referencias a objetos/momentos concretos de la campaña (contrato, tarjeta VIP, pulsera). */
/* moods ajustados al set nuevo de KARLA_STORY (ver NPCS.lisa.arts): ya no existen assets
   sueltos "idle"/"angry" para ella, así que el relleno usa negociadora/profesional. */
const AMBIENT_KARLA = [
  { m: "negociadora", t: "¿Sabes cuántos patrocinadores me llaman a mí directamente sin que yo mueva un dedo? Bastantes. A ti todavía no. Pero para eso estoy yo aquí, haciendo de niñera de tu carrera." },
  { beats: [
    { m: "profesional", t: "En mis tiempos de jugadora en activo tenía una rutina previa al partido que jamás le he contado a nadie de prensa." },
    { m: "negociadora", t: "A ti tampoco te la voy a contar. Solo quería que supieras que existía. Un poco de misterio no le viene mal a nadie." }] },
];

const MILLY_INTRO_BEATS = [
  { m: "idle", t: "¡Ay, tú debes de ser el fichaje nuevo! Me lo han contado ya tres personas distintas esta mañana, así que imagínate cómo está la cosa por aquí." },
  { m: "periodico", t: "Soy Milly, del Kiosco. A partir de hoy te traigo yo misma el periódico cada mañana, en persona, como hago con mis clientes favoritos. ¡Bienvenido a la familia! Toma, el de hoy." },
];
/* la entrega diaria del periódico es un sistema aparte (ligado al Kiosco/NEWS), no la
   rotación ambiental de arriba: sigue pasando SIEMPRE, una vez al día, tenga o no Milly
   contenido de capítulo pendiente. AMBIENTE PLACEHOLDER, igual que el resto. */
const MILLY_PAPER_LINES = [
  { t: "¡Buenos días! Aquí tienes tu periódico, calentito de la rotativa. Bueno, calentito no, pero recién salido, que es lo que cuenta." },
  { beats: [
    { m: "idle", t: "No te lo vas a creer, pero esta mañana han pasado TRES personas a preguntarme por ti antes de las nueve." },
    { m: "periodico", t: "Les he dicho que no sé nada, por supuesto. Aunque, entre tú y yo, sí que sé algo. Pero eso ya te lo cuento otro día. Toma, tu periódico." }] },
  { w: "win", beats: [
    { m: "happy", t: "¡Ay, qué alegría lo de ayer! Se ha notado en el kiosco, ¿eh? Todo el mundo entraba sonriendo a comprar el periódico." },
    { m: "periodico", t: "He vendido el doble que un lunes cualquiera. Toma el tuyo, que este te lo guardo yo aparte, con cariño." }] },
  { t: "Tengo un frasco de perfume carísimo que me regalaron y no uso nunca, se me queda grande para el kiosco. ¿Se lo doy a alguien que le pegue más?", replies: [
    { t: "A Karla le encajaría perfecto", m: "happy", giveItem: "perfume_lujo", r: ["¡Genial elección! Toma, dáselo tú de mi parte. Y de paso, toma tu periódico de hoy, que casi se me olvida."] },
    { t: "Mejor guárdalo tú", m: "periodico", r: ["Ya, tienes razón, a saber cuándo lo voy a usar. Toma tu periódico, anda, que se hace tarde."] }] },
];

/* la escena de primer encuentro de Igor ya vive en IGOR_STORY (su prólogo, "La cocina del
   delantero"): esto es solo relleno genérico entre capítulos de su historia real, sin
   referencias a objetos/momentos concretos de la campaña (receta, plato, delantal). */
const AMBIENT_IGOR = [
  { beats: [
    { m: "idle", t: "Dato de vestuario que casi nadie aprovecha: el plátano no es solo azúcar rápido, lleva potasio de verdad." },
    { m: "idle", t: "Y el potasio es justo lo que se te va con el sudor. Menos calambres en el 90, más piernas frescas. Cómetelo con cabeza, no de postre porque sí." }] },
  { beats: [
    { m: "idle", t: "Dato curioso de hoy: la quinoa es de las pocas plantas con proteína completa, con los nueve aminoácidos esenciales." },
    { m: "idle", t: "La mayoría de cereales se quedan cortos en alguno. Por eso en Perú y Bolivia llevan siglos usándola como base, no es ninguna moda reciente de gimnasio." }] },
];

/* nombre de personaje -> pool ambiental, para la rotación diaria (ver processNewDays) */
const AMBIENT_BY_CHAR = {
  yuna: AMBIENT_YUNA, elisa: AMBIENT_ELISA, lopez: AMBIENT_LOPEZ, lisa: AMBIENT_KARLA, igor: AMBIENT_IGOR,
};

/* goles a lo largo de TODA la carrera (todas las temporadas), para el hito del Centro de Alto Rendimiento */
const careerGoals = (g) => (g.matchHistory || []).reduce((a, m) => a + (m.myGoals || 0), 0);
/* asistencias de toda la carrera, mismo criterio que careerGoals (para objetivos de historia) */
const careerAssists = (g) => (g.matchHistory || []).reduce((a, m) => a + (m.myAssists || 0), 0);
/* días "cumplidos" desde una fecha (inclusive): el día se cerró con al menos un 70% de
   cumplimiento. Para objetivos de historia tipo "completa N días de objetivos" sin tener
   que repetir en cada misión los mismos tres campos (gym/comida/sueño) a mano. */
const daysGoalsCompletedSince = (g, sinceDay) =>
  Object.entries(g.logs || {}).filter(([d, l]) => d >= sinceDay && l.closed && (l.pct || 0) >= 70).length;
/* mismo conteo que daysGoalsCompletedSince pero exigiendo solo el objetivo de proteína (o
   proteína+sueño), para las misiones que piden eso específicamente en vez del % general
   del día — así su barra de progreso (ver stageProgress) también puede mostrar avance
   parcial en vez de quedarse a 0% hasta el último día. */
const proteinDaysSince = (g, sinceDay) =>
  Object.entries(g.logs || {}).filter(([d, l]) =>
    d >= sinceDay && l.closed && (l.prot || 0) >= g.player.goals.protein).length;
const proteinSleepDaysSince = (g, sinceDay) =>
  Object.entries(g.logs || {}).filter(([d, l]) => d >= sinceDay && l.closed &&
    (l.prot || 0) >= g.player.goals.protein && l.sleep != null && l.sleep >= g.player.goals.sleepGoal).length;
/* ¿ha visitado esta zona desde una fecha? (ver g.zoneVisits, que registra la última vez que
   se abrió cada zona — infraestructura mínima añadida para objetivos tipo "visita X",
   que hasta ahora ningún capítulo necesitaba: ver BEKA_STORY) */
const zoneVisitedSince = (g, zoneId, sinceDay) => !!(g.zoneVisits && g.zoneVisits[zoneId] >= sinceDay);
/* hitos de constancia para desbloquear las zonas de La Metrópolis, contados sobre TODO el historial de logs */
const gymDaysCount = (g) => Object.values(g.logs || {}).filter((l) => l.gym).length;
const habitDaysCount = (g) => Object.values(g.logs || {}).filter((l) => (l.habitsDone || []).length > 0).length;
const kcalGoalHits = (g) => Object.values(g.logs || {}).filter((l) => (l.kcal || 0) >= (g.player.goals.kcal || Infinity)).length;
const proteinGoalHits = (g) => Object.values(g.logs || {}).filter((l) => (l.prot || 0) >= (g.player.goals.protein || Infinity)).length;
const mealsLoggedCount = (g) => Object.values(g.logs || {}).reduce((a, l) => a + (l.meals || []).length, 0);

/* ============================================================
   LA CIUDAD · zonas del mapa, con su requisito de desbloqueo.
   x/y son porcentajes sobre un lienzo vertical largo (con scroll).
   ============================================================ */
/* mapa dibujado a mano por el usuario en Illustrator (public/images/city-map.svg).
   viewBox recortado al contenido real (el original tenía mucho margen vacío a los lados,
   lo que hacía que el mapa saliera diminuto y descentrado): 220.14 -8.23 437.96 760.68.
   x/y de cada zona son el centro de su forma en ese mismo sistema, convertido a %
   para posicionar la burbuja encima del dibujo. "pts" son los puntos del polígono
   de esa zona (coordenadas absolutas, sin tocar), para pintarla de gris con su
   silueta exacta cuando está bloqueada. Los nombres ya están dibujados en el propio
   SVG, así que aquí NO se repite ninguna etiqueta de texto. */
/* mapa único: La Metrópolis se fusionó dentro de La Ciudad (mismo SVG, mismo lienzo
   480x822.74), así que el viewBox recortado ahora cubre las 18 zonas de golpe en vez
   de repartirlas en dos mapas independientes. */
const CITY_MAP_VB = { x: 15, y: 60, w: 438, h: 720.3 };
/* ============================================================
   DESBLOQUEO DE ZONAS · ya NO depende de estadísticas ni progreso del
   jugador (OVR, goles, temporada, hábitos, comidas...). Esas estadísticas
   siguen existiendo y funcionando igual para el resto del juego, solo
   dejan de tener relación con qué zonas se pueden visitar.
   El desbloqueo pasa a ser un evento narrativo: cuando una historia lo
   decida, llamará a unlockZone(g, id). Por ahora nada llama a eso
   todavía (no se ha diseñado qué historia abre qué zona), así que solo
   Casa y Barrio están disponibles desde el principio y el resto se queda
   bloqueado hasta que el sistema de historias las abra más adelante. */
const DEFAULT_UNLOCKED_ZONES = ["casa", "barrio"];
const isZoneUnlocked = (g, zoneId) => (g.unlockedZones || DEFAULT_UNLOCKED_ZONES).includes(zoneId);
const unlockZone = (g, zoneId) => {
  const cur = g.unlockedZones || DEFAULT_UNLOCKED_ZONES;
  if (cur.includes(zoneId)) return g;
  return { ...g, unlockedZones: [...cur, zoneId] };
};
const ZONE_LOCKED_MSG = "Esta zona todavía no está disponible.";
/* mapa único (ver comentario junto a CITY_MAP_VB): las 11 zonas que ya vivían en La
   Ciudad conservan sus coordenadas (el SVG fusionado no las movió), y las 6 zonas que
   antes eran de La Metrópolis (parque/casino/enfermeria/playa/atico/restaurante) se
   añaden aquí con sus posiciones nuevas dentro del mismo lienzo — mismos id que ya
   usaban las STORIES como stage.zone/alsoUnlock, así que ningún capítulo necesita
   tocarse. "discoteca" es zona nueva del SVG sin personaje ni historia asignada todavía
   (ver DEFAULT_UNLOCKED_ZONES): se deja visible y vacía a la espera de contenido. */
const ZONES = [
  { id: "oficina", kind: "npc", npc: "elisa", label: "Oficina", icon: "🏢", x: 26.11, y: 6.63,
    pts: "52.25 87.74 55.66 137.44 204.76 129.61 204.76 76.16 52.25 87.74",
    unlocked: (g) => isZoneUnlocked(g, "oficina") },
  { id: "ciudad-dep", kind: "npc", npc: ["lopez", "elisa", "milly", "beka", "milo"], label: "Ciudad Deportiva", icon: "🏟️", x: 68.40, y: 31.75,
    pts: "226.89 245.01 214.21 284.33 257.1 333.35 437.36 333.35 437.36 247.57 226.89 245.01",
    unlocked: (g) => isZoneUnlocked(g, "ciudad-dep") },
  { id: "kiosco", kind: "paper", npc: "milly", label: "Kiosco", icon: "📰", x: 71.79, y: 44.20,
    pts: "303.06 345.61 367.91 345.61 356.68 410.46 320.59 406.89 298.97 383.4 303.06 345.61",
    unlocked: (g) => isZoneUnlocked(g, "kiosco") },
  /* Tu Casa: sin personaje, es la pantalla de trofeos y estadísticas de tu carrera. Siempre disponible. */
  /* npc: "yuna" — casa sigue siendo la pantalla de trofeos (HouseRoom) por defecto, pero
     ahora también admite una escena de personaje encima (ver ZoneScreen: isHome no excluye
     ya pendingNpc), para las escenas de intimidad emocional de su campaña en Casa del jugador */
  { id: "casa", kind: "home", npc: ["yuna", "lopez", "igor", "lisa", "beka"], label: "Tu Casa", icon: "🏠", x: 24.20, y: 45.68,
    pts: "91.14 348.16 163.66 373.18 152.42 429.35 76.85 405.35 91.14 348.16",
    unlocked: (g) => isZoneUnlocked(g, "casa") },
  /* varios personajes comparten esta zona de calle: la burbuja muestra a quien tenga
     algo pendiente ahora mismo (ver EXTRA_NPCS y CityMap); en reposo, el puntito de siempre */
  { id: "barrio", kind: "npc", npc: ["yuna", "elisa", "milly", "lopez", "igor", "beka"], label: "El Barrio", icon: "🌆", x: 57.78, y: 58.78,
    pts: "217.78 461.01 217.78 507.48 318.38 500 318.38 465.1 217.78 461.01",
    unlocked: (g) => isZoneUnlocked(g, "barrio") },
  { id: "car", kind: "npc", npc: ["lopez", "lisa", "elisa", "igor", "beka"], label: "Centro de Alto Rendimiento", icon: "🏋️", x: 66.84, y: 18.18,
    pts: "229.95 164.5 229.95 222.03 387.91 223.74 383.14 153.52 229.95 164.5",
    unlocked: (g) => isZoneUnlocked(g, "car") },
  { id: "prensa", kind: "npc", npc: ["milly", "lisa", "beka"], label: "Sala de Prensa", icon: "🎙️", x: 27.50, y: 33.16,
    pts: "131.91 245.01 187.66 293.52 168.25 358.89 91.14 337.44 98.29 259.31 131.91 245.01",
    unlocked: (g) => isZoneUnlocked(g, "prensa") },
  /* la presentación de Karla ya no depende de metFlag/intro (eso duplicaba el prólogo real
     de KARLA_STORY en cuanto se desbloqueara la zona, igual que le pasaba a Igor/restaurante
     y le pasó de verdad a Milly antes de detectarlo): su propia historia ya se encarga */
  { id: "patro", kind: "npc", npc: ["lisa", "elisa", "milly"], label: "Zona de Patrocinadores", icon: "🏙️", x: 36.27, y: 83.07,
    pts: "131.25 570.8 86.31 660.67 163.35 715.53 190.77 690.44 214.21 702.11 245.34 669.43 185.86 599.69 131.25 570.8",
    unlocked: (g) => isZoneUnlocked(g, "patro") },
  { id: "cantera", kind: "npc", npc: "lopez", label: "Cantera", icon: "🎓", x: 88.18, y: 46.28,
    pts: "377.1 345.61 437.36 343.57 426.63 442.12 363.83 442.12 377.1 345.61",
    unlocked: (g) => isZoneUnlocked(g, "cantera") },
  { id: "tienda", kind: "npc", npc: ["coco", "yuna", "lopez"], label: "Centro Comercial", icon: "🛍️", x: 84.10, y: 65.63,
    pts: "342.38 511.57 346.97 559.57 424.08 552.42 420 507.48 342.38 511.57",
    unlocked: (g) => isZoneUnlocked(g, "tienda") },
  { id: "estadio", kind: "npc", npc: ["lopez", "yuna", "elisa", "milly", "igor", "beka"], label: "Gran Estadio", icon: "🏆", x: 74.47, y: 89.16,
    pts: "384.07 634.12 295.02 657.52 262.89 677.69 290.06 764.25 384.07 764.25 431.07 715.53 384.07 634.12",
    unlocked: (g) => isZoneUnlocked(g, "estadio"), big: true },
  /* "milo" va ANTES que "vera" en esta lista a propósito: zoneActiveNpc (ver más abajo)
     muestra la burbuja del primer npc de la lista con algo pendiente, y como Vera tiene
     líneas en TODAS las escenas de MILO_STORY (es la intérprete, ver addScene/b.from),
     con el orden alfabético original la burbuja del Parque mostraba siempre a Vera durante
     toda la campaña de Milo en vez de a él. No afecta a Vera cuando tiene una escena propia
     sin Milo: milo solo "gana" cuando de verdad hay algo suyo pendiente. */
  { id: "parque", kind: "npc", npc: ["elisa", "lisa", "milly", "yuna", "lopez", "beka", "milo", "vera"], label: "Parque", icon: "🌳", x: 47.99, y: 42.84,
    pts: "204.76 310.38 181.53 393.1 289.27 402.29 204.76 310.38",
    unlocked: (g) => isZoneUnlocked(g, "parque") },
  { id: "casino", kind: "npc", npc: ["elisa", "lisa"], label: "Casino", icon: "🎰", x: 63.79, y: 72.25,
    pts: "262.21 525.86 321.95 522.8 333.44 636.16 297.83 644.33 256.59 572.84 262.21 525.86",
    unlocked: (g) => isZoneUnlocked(g, "casino") },
  { id: "enfermeria", kind: "npc", npc: ["elisa", "milly", "beka"], label: "Enfermería", icon: "🏥", x: 70.56, y: 8.09,
    pts: "269.53 96.59 375.7 85.45 379.45 140.6 271.57 150.46 269.53 96.59",
    unlocked: (g) => isZoneUnlocked(g, "enfermeria") },
  { id: "playa", kind: "npc", npc: ["elisa", "milly", "lopez", "lisa", "yuna", "igor", "nina", "vera"], label: "Playa", icon: "🏖️", x: 18.88, y: 62.76,
    pts: "76.85 417.61 148.34 442.12 135.57 514.12 96.25 602.97 31.4 583.57 76.85 417.61",
    unlocked: (g) => isZoneUnlocked(g, "playa") },
  { id: "atico", kind: "npc", npc: ["elisa", "lisa", "alexia"], label: "Ático de Lujo", icon: "🌇", x: 34.48, y: 19.29,
    pts: "55.66 150.46 206.12 142.03 208.17 229.52 194.21 273.78 55.66 150.46",
    unlocked: (g) => isZoneUnlocked(g, "atico") },
  /* la presentación de Igor ya no depende de metFlag/intro (eso duplicaba el prólogo real
     de IGOR_STORY en cuanto se desbloqueara la zona): su propia historia ya se encarga */
  { id: "restaurante", kind: "npc", npc: ["igor", "elisa"], label: "Restaurante", icon: "🍽️", x: 51.41, y: 50.53,
    pts: "295.06 414.55 314.29 442.12 171.83 437.01 179.49 402.29 295.06 414.55",
    unlocked: (g) => isZoneUnlocked(g, "restaurante") },
  /* ya no está en DEFAULT_UNLOCKED_ZONES: cuando se añadió no tenía ningún personaje ni
     historia asignada, así que se dejaba siempre visible a propósito. Ahora la desbloquea
     BEKA_STORY (capítulo 3, "La otra vida") como cualquier otra zona narrativa — partidas
     ya guardadas que la tuvieran desbloqueada de antes no se ven afectadas (sanitizeGame
     solo aplica el default cuando no existe unlockedZones en absoluto). */
  { id: "discoteca", kind: "npc", npc: ["beka"], label: "Discoteca", icon: "🪩", x: 83.21, y: 57.68,
    pts: "335.1 454.89 340.21 497.27 418.46 497.27 424.08 452.33 335.1 454.89",
    unlocked: (g) => isZoneUnlocked(g, "discoteca") },
];
/* home zone de cada personaje: dónde "vive" por defecto si una escena no especifica zona
   explícita (varios personajes están asignados a más de una zona ahora que la zona es
   contexto de escena y no una identidad de npc distinta, ver NPCS más arriba) */
const HOME_ZONE = { elisa: "oficina", lopez: "ciudad-dep", milly: "kiosco", yuna: "barrio", lisa: "patro", igor: "restaurante", beka: "barrio", nina: "playa", vera: "parque", coco: "tienda", alexia: "atico", milo: "parque" };
/* una zona puede tener uno o varios personajes asignados (p.ej. El Barrio) */
const zoneNpcList = (z) => (Array.isArray(z.npc) ? z.npc : z.npc ? [z.npc] : []);
/* una entrada de npcQueue cuenta para una zona si su "zone" explícito coincide, o si no
   lleva zone y esta es la home zone del personaje (compat con escenas sin contexto de zona) */
const entryMatchesZone = (e, zoneId) => e.zone ? e.zone === zoneId : HOME_ZONE[e.npc] === zoneId;
/* quién de esa zona tiene algo pendiente que contar AHORA MISMO (null si nadie).
   Coco tiene puesto fijo en el Centro Comercial pero solo está un día sí y otro no (ver
   game.cocoVisit/refreshCocoVisit): los días que está, aparece como "activa" aquí igual
   que cualquier personaje con una escena pendiente, tenga o no diálogo de historia en la
   cola ahora mismo — así su tienda se ve en el mapa durante todo el día activo, no solo
   el rato en que hay una frase nueva que leer. */
const zoneActiveNpc = (z, npcQueue, game) => {
  if (game && game.cocoVisit && game.cocoVisit.zone === z.id) return "coco";
  return zoneNpcList(z).find((n) => npcQueue.some((e) => e.npc === n && entryMatchesZone(e, z.id))) || null;
};
const zonePending = (z, game) => {
  const npcQueue = game.npcQueue || [];
  if (game.cocoVisit && game.cocoVisit.zone === z.id) return true;
  if (z.kind === "paper") return (!!game.paper && game.paperRead !== todayStr()) || (z.npc && npcQueue.some((e) => e.npc === z.npc && entryMatchesZone(e, z.id)));
  return zoneNpcList(z).some((n) => npcQueue.some((e) => e.npc === n && entryMatchesZone(e, z.id)));
};

/* Personajes que comparten burbuja con una zona ya existente en vez de tener la suya propia
   (de momento, El Barrio). Mismo mecanismo que ZONES.metFlag/intro, pero sin polígono ni
   posición: solo se presentan la primera vez que se cumple su condición. */
const EXTRA_NPCS = [];

/* ============================================================
   MISIONES · vacías a propósito (ver comentario más abajo).
   Las 4 misiones de 4 etapas que había aquí antes (Elisa, López, Yuna,
   Karla, Milly) se han retirado por completo: eran contenido narrativo
   provisional, y la idea es escribir las historias reales desde cero
   más adelante, sin que este texto interfiera. El motor que las movía
   (STORIES, toStories, checkStories, QuestPanel) sigue intacto y listo
   para recibir el contenido nuevo con la misma forma.
   ============================================================ */
const QUESTS = {};

/* ============================================================
   STORIES · infraestructura del nuevo sistema narrativo por capítulos.
   ------------------------------------------------------------
   PERSONAJE → HISTORIA → CAPÍTULOS → (cada capítulo con sus propias
   etapas/objetivos/escenas) → CAPÍTULO SIGUIENTE.

   Por ahora cada personaje tiene exactamente UN capítulo (el que antes
   era su "misión de 4 etapas" en QUESTS) — se conserva
   sin reescribir ni una línea, solo envuelto en la forma de capítulo,
   para que el motor de aquí abajo (checkStories) ya funcione sobre la
   estructura definitiva y las futuras historias completas (varios
   capítulos, escenas crossover entre personajes, viajes de zona) se
   puedan añadir sin tocar el motor otra vez.

   Forma de una historia:
     STORIES[npcKey] = {
       npc: "clave del personaje en NPCS",
       chapters: [
         { id: "cap1", title: "...",
           trigger: (g) => boolean,      // cuándo puede EMPEZAR este capítulo
           stages: [                     // igual que las misiones de antes:
             { title, objective, intro: [beats], snap(g), check(g,snap),
               deadlineDays?, final?, introFail?, reward?(g) },
             ...
           ] },
         // futuros capítulos 2, 3... aquí, cuando se diseñen
       ],
     }

   Estado de partida (ver sanitizeGame para la migración desde el
   antiguo game.quests): game.stories[npcKey] = {
     chapter: 0,                 // índice del capítulo actual
     stage: 0,                   // índice de la etapa actual DENTRO del capítulo
     snap, startDay, done, failed,
   }
   Con esto ya se puede representar: personaje no conocido (no hay
   entrada), historia iniciada (existe entrada), capítulo actual,
   etapa/objetivo actual, capítulo completado (chapter avanza),
   historia completada (chapter llega al final de chapters.length).
   ============================================================ */
const toStories = (registry) => {
  const out = {};
  Object.entries(registry).forEach(([key, def]) => {
    out[key] = { npc: def.npc, chapters: [{ id: "cap1", title: def.label, trigger: def.trigger, stages: def.stages }] };
  });
  return out;
};

/* ============================================================
   ELISA · primera campaña narrativa completa del motor de historias.
   Prólogo + 12 capítulos + Final + Epílogo, todos como ETAPAS de un
   único capítulo (chapters[0]) — encajan directamente en la forma que
   ya soporta checkStories, sin necesitar capítulos adicionales.

   Cada etapa puede llevar:
     zone         — dónde aparece su escena (se autodesbloquea al
                    encolarse: ver enterStage en checkStories).
     alsoUnlock   — zonas extra que se abren de cara a un crossover
                    futuro con otro personaje, no la propia zona de
                    la escena (solo capítulos 8 y 11 la usan).
     setFlags     — flags de game.flags-equivalentes (campos sueltos
                    en game) que otros personajes podrán consultar
                    más adelante.
   ============================================================ */
/* helper: camino elegido en el capítulo 11 ("cima" | "equilibrio" | "abierto" | null si aún
   no se ha llegado a esa decisión), usado por los introBuild de C12/FINAL/EPÍLOGO para
   sustituir una línea concreta según el camino — ver "8 · Variantes por decisión del
   capítulo 11" en FUTABITA_Elisa_Rework_3.0.docx. */
const elisaPathOf = (g) => g.elisaPath_cima ? "cima" : g.elisaPath_equilibrio ? "equilibrio" : g.elisaPath_abierto ? "abierto" : null;

/* línea "Hay gente que dice..." del capítulo 12 — es la que sustituye introBuild según
   el camino del 11 (ver sección 8 del documento); el texto de aquí es el "por defecto"
   (sin camino elegido), idéntico al original. La línea siguiente ("Lo que no saben…")
   no forma parte de la sustitución: se queda igual en las cuatro variantes. */
const ELISA_C12_PATH_LINE = { m: "decidida", t: "Hay gente que dice que has llegado en el momento adecuado. Y tienen razón: has llegado en el momento adecuado." };
const ELISA_C12_PATH_LINES = {
  cima: { m: "decidida", t: "Dijiste que lo querías todo. Pues esto es «todo» visto de cerca. Sigue sin ser suficiente y ya lo sabías cuando lo dijiste." },
  equilibrio: { m: "suave", t: "Dijiste que querías llegar sin dejar de ser tú. Y te he mirado mucho este año, más de lo que parece. Sigues siendo tú." },
  abierto: { m: "idle", t: "Aquel día dejaste la página en blanco. No te voy a preguntar si ya sabes qué poner. Sólo te digo que la libreta la sigues llevando encima." },
};
/* última línea del bloque B del FINAL — mismo patrón, "por defecto" == "equilibrio". */
const ELISA_FINAL_PATH_LINE = { m: "suave", t: "Con Nico aprendí a construir un jugador. Contigo he aprendido a acompañar a uno. Que resulta que es un oficio distinto." };
const ELISA_FINAL_PATH_LINES = {
  cima: { m: "suave", t: "Con Nico aprendí a construir un jugador. Contigo he aprendido que se puede empujar a alguien hasta arriba sin romperlo. No sabía que se podía." },
  equilibrio: ELISA_FINAL_PATH_LINE,
  abierto: { m: "suave", t: "Con Nico aprendí a construir un jugador. Contigo he aprendido a esperar. Y mira que se me daba mal." },
};
/* línea extra del epílogo, insertada justo antes del cierre solo si se eligió un camino
   en el capítulo 11 — por defecto no hay línea añadida (ver doc, sección 8). El marcador
   se filtra del array por defecto y solo se sustituye por una línea real si hay camino. */
const ELISA_EPILOGO_PATH_MARKER = { m: "happy", t: "" };
const ELISA_EPILOGO_PATH_LINES = {
  cima: { m: "happy", t: "Y sigo teniendo por escrito que si algún día quieres bajarte, frenamos. Página uno. Sigue ahí." },
  equilibrio: { m: "happy", t: "Y sigues siendo tú. Te lo he recordado unas cuantas veces, sí. Para eso me pagan." },
  abierto: { m: "happy", t: "Por cierto, la página uno. Ya no está en blanco. No la he leído, tranquilo. Sólo he visto que hay letra." },
};

const ELISA_C12_INTRO = [
  { m: "orgullosa", t: "Europa." },
  { m: "idle", t: "Y lo has hecho manteniendo la rutina, que es exactamente la parte que no va a mirar nadie." },
  { m: "happy", t: "Y por eso el ascensor de este edificio tiene espejo, música y un señor que te saluda por tu apellido." },
  { m: "idle", t: "¿Te acuerdas de la primera vez que hablamos? Yo había venido en autobús." },
  { m: "happy", t: "Traía una carpeta con dos páginas y media dentro. Y media era la portada." },
  { m: "idle", t: "Esta mañana he impreso la carpeta actual por curiosidad." },
  { m: "sorprendida", t: "No me entra en el bolso. He tenido que traerla en una bolsa." },
  { m: "orgullosa", t: "Y sigo viendo al mismo jugador, por si te lo estabas preguntando." },
  { m: "suave", t: "Solo que ahora sabes de lo que eres capaz, que es lo único que ha cambiado de verdad." },
  { m: "idle", t: "Este ático es tuyo. Esa vista es tuya. Ese sofá absurdo también, y espero que no lo hayas elegido tú." },
  { m: "decidida", t: "Y nada de esto empezó con un fichaje ni con una oferta." },
  { m: "idle", t: "Empezó un martes cualquiera, cuando cerraste un día entero solo porque una desconocida en zapatillas te lo pidió en la calle." },
  { m: "suave", t: "Entrenar. Comer. Dormir. Volver a intentarlo." },
  { m: "orgullosa", t: "Todo lo demás vino detrás, y vino solo." },
  { m: "decidida", t: "Falta una cosa, y ya sabes cuál." },
  ELISA_C12_PATH_LINE,
  { m: "decidida", t: "Lo que no saben es que el momento lo construiste tú, día a día, cuando todavía no era momento de nada." },
  { m: "idle", t: "Quiero verte en Champions. Ganando el partido que toque, con la racha entera y con la mejor media de toda tu carrera." },
  { m: "happy", t: "Y después te dejo descansar." },
  { m: "happy", t: "Un poco." },
];
const ELISA_FINAL_INTRO = [
  { m: "orgullosa", t: "Champions. Con la racha entera y con tu mejor media." },
  { m: "happy", t: "Ya no queda ninguna categoría por encima que tenga nombre de competición." },
  { m: "idle", t: "La siguiente no es una competición. Es la palabra que la gente usa cuando ya ha dejado de discutir contigo." },
  { m: "idle", t: "Baja conmigo al césped. Está vacío. Me gusta mucho más así y nunca se lo he dicho a nadie." },
  { m: "orgullosa", t: "Cuando te conocí estabas convencido de que tenías que demostrar algo en cada minuto de cada partido." },
  { m: "idle", t: "Yo solo quería darte una oportunidad y ver qué pasaba. Nada más. No tenía ningún plan." },
  { m: "orgullosa", t: "Luego me obligaste a darte otra. Y otra. Y otra más." },
  { m: "happy", t: "Hubo semanas en las que trabajé el triple de lo que cobraba, y te juro que lo pensé en voz alta más de una vez." },
  { m: "suave", t: "Pero en algún momento pasó algo con lo que yo no contaba." },
  { m: "suave", t: "Dejé de mirar hasta dónde podías llegar." },
  { m: "orgullosa", t: "Y empecé a disfrutar de estar aquí para verlo." },
  { m: "idle", t: "He visto tus primeras victorias. Tus días malos. Las semanas en las que no me cogías el teléfono." },
  { m: "idle", t: "Y todas las veces que volviste al gimnasio sin que te viera nadie." },
  ELISA_FINAL_PATH_LINE,
  { m: "decidida", t: "Falta lo último. Y esto no te lo pido yo: te lo pide el sitio en el que ya estás." },
  { m: "idle", t: "Quiero que llegues al último escalón. El que ya no es una categoría." },
  { m: "idle", t: "El que es directamente una palabra." },
  { m: "suave", t: "Y cuando lo hagas, quiero estar en la fila alta, lado izquierdo. Como siempre." },
];
const ELISA_EPILOGO_INTRO = [
  { m: "idle", t: "Ocho en punto." },
  { m: "suave", t: "Leyenda. Lo pone ahí, en el informe, con esa palabra tan ridícula y tan enorme." },
  { m: "happy", t: "Y tú sigues llegando a la hora." },
  { m: "happy", t: "Menos mal. Ya empezaba a pensar que había hecho un mal trabajo." },
  { m: "idle", t: "Siéntate. Tu taza sigue ahí, la fea del borde saltado. No he dejado que la use nadie más." },
  { m: "suave", t: "¿Sabes qué es lo raro de todo esto?" },
  { m: "idle", t: "Durante meses pensé que el día que llegaras arriba dejaríamos de tener motivos para vernos aquí." },
  { m: "happy", t: "Y resulta que no." },
  { m: "idle", t: "Mira la pared. ¿Ves el hueco que llevaba años vacío?" },
  { m: "orgullosa", t: "Ahí está tu contrato. He tardado veinte minutos en decidir la altura y sigo pensando que está torcido." },
  { m: "suave", t: "Una última cosa y te dejo ir, que tienes entrenamiento." },
  { m: "idle", t: "A todos los que han pasado por esta oficina les di uno de estos al terminar. Es un pin. Es pequeño y no vale nada." },
  { m: "happy", t: "Nico lo lleva colgado en la mochila de la tienda de bicicletas. Me mandó una foto y todavía no se lo he perdonado." },
  { m: "suave", t: "No significa que hayas ganado nada. Significa que estuviste aquí cuando aquí no había nada." },
  { m: "orgullosa", t: "Has llegado muy lejos, {player}." },
  { m: "suave", t: "Y sí. Estoy orgullosa de ti." },
  { m: "suave", t: "Solo lo voy a decir una vez en toda mi vida, así que dalo por dicho para siempre." },
  { m: "idle", t: "Ahora vete. Tienes entrenamiento y yo tengo tres llamadas que llevan veinte minutos esperando." },
  { m: "suave", t: "Y esto no es un final, que te veo la cara. La carrera sigue." },
  { m: "idle", t: "Lo único que ha cambiado es que ya no tengo que enseñarte a empezar." },
  { m: "suave", t: "Solo tengo que seguir aquí para ver qué haces después." },
  ELISA_EPILOGO_PATH_MARKER,
  { m: "happy", t: "Ocho en punto, {player}. Como siempre." },
];

const ELISA_STORY = {
  npc: "elisa",
  chapters: [{
    id: "cap1",
    title: "La carrera de Elisa",
    trigger: () => true, /* es el primer NPC del juego: arranca en cuanto el motor puede evaluarla */
    stages: [
      /* PRÓLOGO — Ocho menos diez (rework 3.0, ver FUTABITA_Elisa_Rework_3.0.docx).
         Nota de continuidad narrativa: el motor lee la intro de una etapa DE GOLPE al
         arrancarla (justo cuando el check() de la etapa ANTERIOR se cumple); no hay forma
         de que una etapa "reaccione" a su propio objetivo una vez completado, porque para
         entonces ya se ha avanzado a la siguiente. Por eso el bloque A (reacción) de cada
         etapa vive al PRINCIPIO de la etapa siguiente, nunca al final de la suya. */
      { title: "Ocho menos diez", zone: "barrio",
        objective: "Cierra un día completo: entrena, cumple tu objetivo de comida y duerme lo que toca.",
        intro: [
          { m: "idle", t: "No, no te levantes. Ya me siento yo." },
          { m: "idle", t: "Elisa. He venido en autobús, así que perdona el pelo." },
          { m: "idle", t: "¿Tú eres {player}?" },
          { m: "happy", t: "Ya. Lo sé. Te lo pregunto igual porque me gusta oír cómo lo dice la gente." },
          { m: "happy", t: "Y tú lo has dicho como si no estuvieras seguro del todo." },
          { m: "idle", t: "Llevo tres semanas viniendo a verte. Cuatro partidos. Dos bajo la lluvia, que es cuando de verdad se ve quién quiere el balón." },
          { m: "idle", t: "No he venido a decirte que eres especial. No lo eres. Todavía." },
          { m: "decidida", t: "He venido porque en el minuto sesenta y ocho del partido del sábado ibais perdiendo por dos y tú seguías pidiendo la pelota." },
          { m: "idle", t: "Eso no lo entrena nadie. Todo lo demás sí." },
          { m: "idle", t: "Estás en Tercera Federación, {player}. Aquí no hay nutricionista, no hay fisio, y no hay nadie que te llame para saber si has dormido." },
          { m: "happy", t: "A partir de hoy hay una persona que te va a llamar." },
          { m: "idle", t: "Soy insoportable con los horarios y peor con las excusas. Es justo que lo sepas antes y no después." },
          { m: "decidida", t: "Yo consigo puertas. Tú tienes que llegar entero para cruzarlas. Ese es el reparto y no se negocia." },
          { m: "idle", t: "Mira esto un momento." },
          { m: "idle", t: "Esta carpeta es todo lo que un club de arriba sabe hoy de ti." },
          { m: "sorprendida", t: "…Sí. Está casi vacía. Dos páginas y media, y media es la portada." },
          { m: "decidida", t: "Mi trabajo durante el próximo año es que esa carpeta pese." },
          { m: "idle", t: "Y para eso vas a necesitar esto. Toma." },
          { m: "idle", t: "Es una libreta. Está usada, tiene las esquinas dobladas y no es bonita." },
          { m: "idle", t: "A partir de hoy apuntas ahí lo que haces. Lo que comes, lo que duermes, lo que te duele y lo que no te atreves a decirme en voz alta." },
          { m: "decidida", t: "Yo no puedo fiarme de tu memoria. Puedo fiarme de tu letra." },
          { m: "idle", t: "Y ahora escúchame, porque no vamos a empezar por un fichaje. Vamos a empezar por mañana." },
          { m: "idle", t: "Quiero un día. Uno. Entero." },
          { m: "idle", t: "Te levantas, entrenas de verdad, comes lo que tienes que comer y duermes las horas que tienes que dormir." },
          { m: "happy", t: "Un día no demuestra nada. Ya lo sé. Por eso empiezo por ahí." },
          { m: "decidida", t: "Porque si no eres capaz de hacerlo una vez, no tiene sentido que hablemos de hacerlo doscientas." },
          { m: "idle", t: "Cuando lo cierres, me lo apuntas en la libreta y vienes a la oficina. Calle Nueve, portal azul, segunda planta." },
          { m: "decidida", t: "Ocho en punto. No ocho y cinco." },
        ],
        replies: [
          { t: "Faltan las primeras páginas.", m: "idle",
            r: [{ m: "sorprendida", t: "…" }, { m: "idle", t: "Sí. Faltan siete." },
              { m: "decidida", t: "Era mía. Ahora es tuya. Es lo único que necesitas saber hoy." }] },
          { t: "Aquí dentro hay un nombre tachado.", m: "idle",
            r: [{ m: "sorprendida", t: "…Vaya. Sí que miras bien." },
              { m: "preocupada", t: "Ese nombre es una conversación larga y hoy no tenemos tiempo." },
              { m: "idle", t: "Te prometo que algún día te la cuento. Y cumplo las promesas, aunque tarde." }] },
          { t: "Gracias.", m: "happy",
            r: [{ m: "happy", t: "No me des las gracias por una libreta de tres euros." },
              { m: "idle", t: "Dámelas dentro de un año, si es que llegamos." }] },
        ],
        setFlags: ["elisaMet"],
        grantItem: "elisa_libreta", reveal: "elisa_libreta",
        snap: () => ({ since: todayStr() }),
        subs: [
          (g, s) => daysGoalsCompletedSince(g, s.since) >= 1,
          (g, s) => Object.entries(g.logs || {}).some(([d, l]) => d >= s.since && l.closed && l.gym),
        ],
        check: (g, s) => daysGoalsCompletedSince(g, s.since) >= 1 &&
          Object.entries(g.logs || {}).some(([d, l]) => d >= s.since && l.closed && l.gym) },
      /* CAPÍTULO 1 — Ocho en punto */
      { title: "Ocho en punto", zone: "oficina",
        objective: "Cierra 3 días de objetivos y consigue una victoria.",
        intro: [
          { m: "idle", t: "Ocho en punto. Bien." },
          { m: "idle", t: "He mirado tu día de ayer antes de que llegaras. Entrenaste, comiste lo que habíamos hablado y dormiste." },
          { m: "happy", t: "Un día. Ya está. No te voy a aplaudir." },
          { m: "idle", t: "Pero anteayer yo no sabía si eras capaz y hoy sí lo sé. Y eso, aunque no lo parezca, ya vale dinero." },
          { m: "idle", t: "Esta es la oficina. Cabe una mesa, dos sillas, un archivador y poco más." },
          { m: "idle", t: "Esa pared de ahí es la única decoración que me permito. Son contratos enmarcados. Todos firmados por gente que en algún momento estuvo sentada exactamente donde estás tú." },
          { m: "happy", t: "No, el tuyo no está. Deja de mirarla." },
          { m: "idle", t: "Hay un hueco, eso sí. Lo dejé hace tiempo y no lo he vuelto a llenar." },
          { m: "idle", t: "Toma. Antes de que se me olvide." },
          { m: "idle", t: "Es fea, tiene el borde saltado y sale mal en las fotos. Es tuya." },
          { m: "decidida", t: "Y se queda aquí. No te la llevas." },
          { m: "happy", t: "A partir de hoy, cuando vengas, hay una taza en esta oficina esperándote." },
          { m: "suave", t: "Es lo más parecido a un contrato que te puedo ofrecer esta semana." },
          { m: "idle", t: "Ahora la parte que no le gusta a nadie." },
          { m: "decidida", t: "Un día bueno lo tiene cualquiera. Un día bueno es suerte con otro nombre." },
          { m: "decidida", t: "Tres días seguidos ya no es suerte. Tres días seguidos es una decisión." },
          { m: "idle", t: "Y los clubes no fichan decisiones sueltas. Fichan costumbres." },
          { m: "idle", t: "El sábado tenéis partido. No te voy a pedir nada heroico." },
          { m: "decidida", t: "Te voy a pedir que llegues a ese partido con tres días bien cerrados detrás. Y que lo ganéis." },
          { m: "idle", t: "Si ganáis jugando mal, me vale. No soy romántica los primeros meses." },
          { m: "happy", t: "Lo del fútbol bonito lo hablamos cuando tengas un fisio pagado." },
        ],
        replies: [
          { t: "¿Y si perdemos el sábado?", m: "idle",
            r: [{ m: "idle", t: "Entonces cerramos tres días más y lo volvemos a intentar." },
              { m: "decidida", t: "No hay plan B. Hay plan A repetido hasta que funcione." }] },
          { t: "¿Por qué yo?", m: "idle",
            r: [{ m: "idle", t: "Porque tenía dos carpetas encima de la mesa y la tuya era la más fina." },
              { m: "happy", t: "Me gustan los sitios donde todavía cabe algo." }] },
          { t: "Ocho en punto entonces.", m: "happy",
            r: [{ m: "happy", t: "Ocho en punto." }, { m: "idle", t: "Y trae la libreta. Siempre." }] },
        ],
        setFlags: ["elisaOficina"],
        grantItem: "elisa_taza", reveal: "elisa_taza",
        snap: (g) => ({ since: todayStr(), matchCount: (g.matchHistory || []).length }),
        subs: [
          { count: (g, s) => daysGoalsCompletedSince(g, s.since), goal: 3 },
          (g, s) => (g.matchHistory || []).slice(s.matchCount).some((m) => m.res === "V"),
        ],
        check: (g, s) => daysGoalsCompletedSince(g, s.since) >= 3 &&
          (g.matchHistory || []).slice(s.matchCount).some((m) => m.res === "V") },
      /* CAPÍTULO 2 — Ganarse el sitio (zona: se mantiene "ciudad-dep", la zona actual, en
         vez de "cantera" que propone el documento — decisión del usuario) */
      { title: "Ganarse el sitio", zone: "ciudad-dep",
        objective: "Marca 1 gol, consigue una victoria y llega a una racha de 3 días.",
        intro: [
          { m: "happy", t: "Tres días y una victoria." },
          { m: "idle", t: "Los tres días me interesan más que la victoria, por cierto." },
          { m: "idle", t: "Ya sé que eso suena a frase de mánager. No lo es." },
          { m: "decidida", t: "La victoria la firmasteis once. Los tres días los firmaste tú solo, un martes, sin público y sin que nadie te lo agradeciera." },
          { m: "idle", t: "¿Sabes por qué te he citado aquí a las siete y media y no en la oficina?" },
          { m: "idle", t: "Porque quería que vieras este campo vacío." },
          { m: "idle", t: "Sin gente. Sin ruido. Sin el entrenador mirando." },
          { m: "decidida", t: "Este es el sitio donde de verdad se decide quién juega el domingo. El domingo solo se firma lo que ya está decidido aquí." },
          { m: "idle", t: "Y ahora te voy a decir algo que no te va a gustar." },
          { m: "idle", t: "No tienes derecho a ser titular." },
          { m: "angry", t: "Y no es una opinión sobre ti. Es una opinión sobre el fútbol." },
          { m: "idle", t: "El martes hablé con tu entrenador. Cuarenta minutos. ¿Sabes qué me dijo de ti?" },
          { m: "idle", t: "Nada. No me dijo nada." },
          { m: "angry", t: "Tardó cuatro segundos en acordarse de tu nombre. Cuatro. Los conté." },
          { m: "decidida", t: "Y ese, {player}, es exactamente el problema. No estás fuera porque no valgas." },
          { m: "decidida", t: "Estás fuera porque todavía le resulta cómodo dejarte fuera." },
          { m: "decidida", t: "Así que vamos a quitarle la comodidad." },
          { m: "idle", t: "Marca. Aunque sea un gol feo, de rodilla, de rebote, con la cara. Me da exactamente igual." },
          { m: "idle", t: "Gana. Y llega a ese partido con tres días encadenados detrás, no con uno bueno y dos improvisados." },
          { m: "happy", t: "Porque cuando un entrenador tiene que explicar por qué no pone a alguien, ya ha perdido la discusión." },
          { m: "decidida", t: "Y yo quiero que tenga que explicarlo." },
        ],
        replies: [
          { t: "¿Y si no me sacan?", m: "idle",
            r: [{ m: "angry", t: "Entonces sales a falta de diez minutos." },
              { m: "decidida", t: "Y haces que esos diez minutos sean insoportables para el rival." },
              { m: "idle", t: "Diez minutos insoportables se recuerdan más que setenta correctos." }] },
          { t: "¿Le has hablado de mí?", m: "idle",
            r: [{ m: "idle", t: "Le he hablado de ti a todo el mundo. El problema no es ese." },
              { m: "idle", t: "El problema es que todavía no tengo mucho que contar." },
              { m: "decidida", t: "Dame material." }] },
          { t: "Entendido.", m: "decidida",
            r: [{ m: "sorprendida", t: "…" }, { m: "happy", t: "Buena respuesta." },
              { m: "idle", t: "Traía preparadas tres réplicas para tus quejas y me las voy a tener que quedar." }] },
        ],
        snap: (g) => ({ goals: careerGoals(g), matchCount: (g.matchHistory || []).length }),
        subs: [
          (g, s) => careerGoals(g) > s.goals,
          (g, s) => (g.matchHistory || []).slice(s.matchCount).some((m) => m.res === "V"),
          { count: (g) => g.player.streak || 0, goal: 3 },
        ],
        check: (g, s) => careerGoals(g) > s.goals &&
          (g.matchHistory || []).slice(s.matchCount).some((m) => m.res === "V") && (g.player.streak || 0) >= 3 },
      /* CAPÍTULO 3 — El precio del progreso */
      { title: "El precio del progreso", zone: "oficina",
        objective: "Cumple tu objetivo de proteína 4 días (3 de ellos también sueño) y consigue una victoria.",
        intro: [
          { m: "agotada", t: "Pasa. Y no me mires así." },
          { m: "agotada", t: "Sí, he visto el gol. Lo he visto seis veces. Dos de ellas en un semáforo, lo cual es ilegal y no lo pienso repetir." },
          { m: "happy", t: "Feo. Precioso. Exactamente lo que te pedí." },
          { m: "idle", t: "Y la racha aguantó toda la semana. Eso es lo que me ha hecho coger el teléfono tres veces desde el lunes." },
          { m: "agotada", t: "Llevo aquí desde las seis con informes. Dos cafés que ya no cuentan como café." },
          { m: "sorprendida", t: "No. No estoy bien." },
          { m: "agotada", t: "Estoy funcionando, que no es lo mismo, y lo sé perfectamente." },
          { m: "preocupada", t: "Y precisamente por eso quiero hablar contigo hoy y no la semana que viene." },
          { m: "idle", t: "Desde que empezaste a responder, todo va más rápido. Más llamadas. Más gente que te mira. Más gente que te para por la calle." },
          { m: "preocupada", t: "Y sé exactamente lo que le pasa a un jugador cuando nota que las cosas empiezan a salir bien." },
          { m: "idle", t: "Quiere más. Entrenar más. Jugar más. Dormir menos. Aprovecharlo todo por si acaso se acaba." },
          { m: "preocupada", t: "Yo conozco muy bien esa película. Me la sé de memoria y me sé el final." },
          { m: "idle", t: "…Otro día te la cuento." },
          { m: "decidida", t: "Hoy lo único que necesito es que no la protagonices tú." },
          { m: "decidida", t: "Así que esta vez la misión no va de fútbol." },
          { m: "idle", t: "Va de la parte que nadie te va a agradecer nunca y que no sale en ningún resumen." },
          { m: "idle", t: "Cuatro días comiendo lo que tienes que comer. Y en tres de esos cuatro, durmiendo lo que tienes que dormir." },
          { m: "idle", t: "Y una victoria por el medio, para que no me acuses de estar convirtiéndote en un monje." },
          { m: "preocupada", t: "No quiero que llegues arriba rápido, {player}." },
          { m: "preocupada", t: "Quiero que llegues y te puedas quedar." },
        ],
        replies: [
          { t: "¿Y tú? ¿Duermes?", m: "preocupada",
            r: [{ m: "sorprendida", t: "…" }, { m: "agotada", t: "Eso ha sido un golpe bajo." },
              { m: "suave", t: "Y tienes razón. No te acostumbres a tenerla." }] },
          { t: "Puedo entrenar más.", m: "decidida",
            r: [{ m: "angry", t: "Ya. Todos podéis." },
              { m: "preocupada", t: "Y por eso hay tantos de vosotros con veintiséis años y una rodilla de cuarenta." },
              { m: "decidida", t: "No. Hoy no." }] },
          { t: "Vale. Lo que digas.", m: "idle",
            r: [{ m: "sorprendida", t: "¿Sin discutir?" }, { m: "suave", t: "Qué descanso, de verdad." }] },
        ],
        snap: (g) => ({ since: todayStr(), matchCount: (g.matchHistory || []).length }),
        subs: [
          (g, s) => proteinDaysSince(g, s.since) >= 4,
          (g, s) => proteinSleepDaysSince(g, s.since) >= 3,
          (g, s) => (g.matchHistory || []).slice(s.matchCount).some((m) => m.res === "V"),
        ],
        check: (g, s) => proteinDaysSince(g, s.since) >= 4 && proteinSleepDaysSince(g, s.since) >= 3 &&
          (g.matchHistory || []).slice(s.matchCount).some((m) => m.res === "V") },
      /* CAPÍTULO 4 — Un sitio más grande */
      { title: "Un sitio más grande", zone: "ciudad-dep",
        objective: "Cierra 5 días de objetivos y sube tu media (OVR) por encima de la que tenías al empezar.",
        intro: [
          { m: "happy", t: "Cuatro días de comida, tres de sueño y una victoria. Y sin discutir ni una vez." },
          { m: "idle", t: "¿Sabes qué he hecho con esa hoja? La he escaneado y la he mandado." },
          { m: "sorprendida", t: "Sí. Se manda. Los clubes de arriba hace años que no piden solo vídeos bonitos." },
          { m: "happy", t: "Y por eso hoy estamos aquí y no en mi oficina de dos sillas." },
          { m: "idle", t: "Mira alrededor sin disimular. Está permitido, todo el mundo lo hace el primer día." },
          { m: "idle", t: "Esas máquinas cuestan más que el presupuesto anual entero de tu club." },
          { m: "idle", t: "Y ese de allí, el que está haciendo el ejercicio más aburrido de toda la sala, juega en Primera." },
          { m: "decidida", t: "Fíjate bien en que no está haciendo absolutamente nada espectacular." },
          { m: "idle", t: "Llevas meses pensando que lo que te separa de esa gente es el talento." },
          { m: "decidida", t: "No. Lo que te separa es que ellos llevan seis años haciendo lo aburrido con alguien supervisándolo." },
          { m: "orgullosa", t: "Y tú llevas semanas haciéndolo tú solo, sin supervisión y sin cobrar por ello." },
          { m: "idle", t: "Que conste en acta. No lo voy a repetir." },
          { m: "idle", t: "Hasta ahora te he pedido que no te cayeras. A partir de hoy te voy a pedir que subas." },
          { m: "decidida", t: "Cinco días. Cerrados. Y quiero ver el número." },
          { m: "idle", t: "Tu media. La que sale arriba del todo en el informe." },
          { m: "idle", t: "Hoy vale lo que vale. Dentro de unos días tiene que valer más." },
          { m: "happy", t: "No mucho más. No necesito un milagro." },
          { m: "decidida", t: "Necesito una flecha hacia arriba, porque una flecha hacia arriba es lo único que hace que alguien coja el teléfono a la primera." },
        ],
        replies: [
          { t: "Aquí no encajo.", m: "idle",
            r: [{ m: "idle", t: "Todavía no." }, { m: "orgullosa", t: "Encajar es lo último que pasa, nunca lo primero." },
              { m: "decidida", t: "Primero se entra por la puerta molestando un poco." }] },
          { t: "¿Ellos empezaron así?", m: "idle",
            r: [{ m: "happy", t: "Peor. Ese de ahí empezó en un campo de tierra con dos porterías de tubo." },
              { m: "idle", t: "Lo que pasa es que ya nadie se acuerda." },
              { m: "suave", t: "Es lo bueno de subir: te reescriben el principio." }] },
          { t: "¿Cuánto tengo que mejorar?", m: "idle",
            r: [{ m: "idle", t: "Un punto. Uno." },
              { m: "decidida", t: "Los milagros los vendemos más adelante, cuando ya no hagan falta." }] },
        ],
        snap: (g) => ({ since: todayStr(), ovr: calcOVR(g.player.stats) }),
        subs: [
          { count: (g, s) => daysGoalsCompletedSince(g, s.since), goal: 5 },
          (g, s) => calcOVR(g.player.stats) > s.ovr,
        ],
        check: (g, s) => daysGoalsCompletedSince(g, s.since) >= 5 && calcOVR(g.player.stats) > s.ovr },
      /* CAPÍTULO 5 — Tu nombre empieza a pesar. check es un OR de tres vías (umbral de
         categoría siguiente, cambio de tier ya confirmado, o cambio de club); subs solo
         lleva la vía principal para que la barra de progreso no exija las tres a la vez,
         tal y como pide el documento cuando el motor no admite condiciones alternativas. */
      { title: "Tu nombre empieza a pesar", zone: "patro",
        objective: "Alcanza la media mínima de la siguiente categoría (o completa un cambio de club).",
        intro: [
          { m: "happy", t: "Cinco días y la flecha hacia arriba." },
          { m: "idle", t: "Te dije que un punto bastaba para que alguien cogiera el teléfono." },
          { m: "sorprendida", t: "Lo han cogido tres." },
          { m: "idle", t: "Y por eso hoy estás en un sitio con sofás caros, agua con gas y gente que sonríe demasiado rápido." },
          { m: "idle", t: "Antes de entrar, dos cosas. Solo dos." },
          { m: "idle", t: "Una: toda la gente que hay ahí dentro es encantadora. De verdad. No es una trampa y no son villanos." },
          { m: "decidida", t: "Dos: ninguno de ellos trabaja para ti." },
          { m: "idle", t: "Hasta hoy, lo que se compraba de ti era lo que hacías. A partir de hoy empiezan a comprar lo que eres." },
          { m: "idle", t: "Tu cara. Tu nombre. Tu tiempo. Tres fines de semana al año que ya no vas a elegir tú." },
          { m: "preocupada", t: "Y lo peor es que la primera vez no lo notas, porque la primera vez es emocionante y hay cámaras." },
          { m: "decidida", t: "Yo no voy a firmar por ti. No es mi vida y no me corresponde." },
          { m: "idle", t: "Pero voy a leerte cada cláusula en voz alta hasta que te aburras y me pidas que pare." },
          { m: "decidida", t: "Ese es el trato y es innegociable." },
          { m: "idle", t: "Y ahora la parte incómoda: hoy no vamos a firmar nada." },
          { m: "sorprendida", t: "No pongas esa cara." },
          { m: "decidida", t: "Una oferta que llega demasiado pronto no es una oportunidad. Es un descuento." },
          { m: "idle", t: "Quiero que tu media alcance el umbral de la categoría siguiente antes de que nos sentemos a negociar nada." },
          { m: "idle", t: "El mismo contrato, con ese número delante, vale el triple. Literalmente el triple." },
          { m: "happy", t: "Así que hoy paseamos, sonreímos, damos la mano y nos vamos a casa." },
          { m: "decidida", t: "Y volvemos cuando tu nombre pese lo que tiene que pesar." },
        ],
        replies: [
          { t: "¿Cuánto ofrecen?", m: "idle",
            r: [{ m: "happy", t: "Lo suficiente para que te parezca muchísimo." },
              { m: "idle", t: "Y eso es exactamente el problema." },
              { m: "decidida", t: "El primer contrato grande nunca es grande. Solo lo parece desde abajo." }] },
          { t: "¿Y si no vuelven?", m: "idle",
            r: [{ m: "decidida", t: "Volverán." },
              { m: "idle", t: "Y si no vuelven estos, vendrán otros peores pagando más." },
              { m: "idle", t: "Así funciona. No es justo, pero es predecible, que a veces es mejor." }] },
          { t: "Confío en ti.", m: "happy",
            r: [{ m: "sorprendida", t: "…" }, { m: "suave", t: "No lo digas tan rápido." },
              { m: "suave", t: "Guárdatelo para cuando me equivoque. Ese día te va a hacer más falta." }] },
        ],
        setFlags: ["elisaPatroIntro"],
        snap: (g) => ({ since: todayStr(), tierId: g.tier.id, clubName: g.club && g.club.name }),
        subs: [
          (g, s) => calcOVR(g.player.stats) >= ((TIERS[s.tierId + 1] || {}).minOvr ?? Infinity),
        ],
        check: (g, s) => calcOVR(g.player.stats) >= ((TIERS[s.tierId + 1] || {}).minOvr ?? Infinity) ||
          g.tier.id > s.tierId || (g.club && g.club.name) !== s.clubName },
      /* CAPÍTULO 6 — La persona detrás del jugador (respiro deliberado antes del derbi;
         único capítulo con pose "casual") */
      { title: "La persona detrás del jugador", zone: "parque",
        objective: "Cierra un día completo de rutina y gana el siguiente partido.",
        intro: [
          { m: "happy", t: "Umbral alcanzado. Ya está." },
          { m: "idle", t: "Ayer volví a la zona de patrocinadores con tu número nuevo. Misma gente, mismos sofás, misma agua con gas." },
          { m: "happy", t: "Y una cifra distinta encima de la mesa." },
          { m: "idle", t: "Tres semanas de espera y el contrato se ha multiplicado solo. Es la parte del trabajo que más me gusta y la que menos se ve." },
          { m: "casual", t: "Pero hoy no he venido a hablar de eso." },
          { m: "sorprendida", t: "Sí, voy en zapatillas. También tengo pies, resulta." },
          { m: "casual", t: "He hecho una cuenta esta mañana mientras venía andando. No tenía nada mejor que hacer en veinte minutos de paseo." },
          { m: "casual", t: "Llevamos meses hablando. Ciento y pico conversaciones, tirando por lo bajo." },
          { m: "casual", t: "Y las he repasado todas mentalmente. Todas empiezan igual: con un número." },
          { m: "casual", t: "Media. Racha. Proteína. Minutos. Ofertas. Umbral." },
          { m: "suave", t: "Y me he dado cuenta de que no sabría contarle a nadie cómo eres tú." },
          { m: "casual", t: "Sé a qué hora te acuestas. Sé lo que pesas. Sé lo que comes los martes." },
          { m: "suave", t: "No sé qué haces los días que no te llamo." },
          { m: "casual", t: "Así que hoy no hay informe, no hay libreta y no hay objetivos." },
          { m: "casual", t: "Hoy paseamos y me lo cuentas tú. O no me lo cuentas y paseamos igual, que también es una respuesta." },
          { m: "casual", t: "Mañana, por desgracia, vuelve el mundo." },
          { m: "idle", t: "Vosotros tenéis partido y yo tengo dos reuniones que no me apetecen nada." },
          { m: "suave", t: "Así que hazme un favor un poco raro." },
          { m: "decidida", t: "Prepara ese partido como si no dependiera nada de él. Duerme, come, entrena. Y gánalo." },
          { m: "suave", t: "No para demostrarme nada. Eso ya no hace falta." },
          { m: "happy", t: "Simplemente porque hoy ha sido un buen día y me apetece que mañana también lo sea." },
        ],
        replies: [
          { t: "Nada especial. Veo partidos.", m: "idle",
            r: [{ m: "happy", t: "Menuda sorpresa. Un futbolista que ve fútbol." },
              { m: "suave", t: "Está bien. Al menos es tuyo y no te lo he puesto yo en una hoja." }] },
          { t: "Echo de menos mi barrio.", m: "suave",
            r: [{ m: "suave", t: "Ya." }, { m: "idle", t: "Eso no se arregla subiendo de categoría." },
              { m: "casual", t: "De hecho empeora. Cuanto más arriba, más lejos queda todo lo que era normal." },
              { m: "suave", t: "Vuelve de vez en cuando. En serio. Es la única receta que tengo." }] },
          { t: "¿Y tú qué haces?", m: "idle",
            r: [{ m: "sorprendida", t: "¿Yo?" }, { m: "casual", t: "Nada interesante. Leo contratos en la cama." },
              { m: "suave", t: "…Vale, eso ha sonado bastante peor de lo que es." },
              { m: "happy", t: "Y los domingos por la tarde no cojo el teléfono. Eso no lo sabe nadie, así que ya me estás guardando el secreto." }] },
        ],
        setFlags: ["elisaPersonal"],
        snap: (g) => ({ since: todayStr(), matchCount: (g.matchHistory || []).length }),
        subs: [
          (g, s) => daysGoalsCompletedSince(g, s.since) >= 1,
          (g, s) => (g.matchHistory || []).slice(s.matchCount).some((m) => m.res === "V"),
        ],
        check: (g, s) => daysGoalsCompletedSince(g, s.since) >= 1 &&
          (g.matchHistory || []).slice(s.matchCount).some((m) => m.res === "V") },
      /* CAPÍTULO 7 — El partido que importa (sin deadlineDays: decisión del usuario) */
      { title: "El partido que importa", zone: "estadio",
        objective: "Gana el derbi con nota alta (7.5+), participa en un gol y llega con una racha de 6 días.",
        intro: [
          { m: "happy", t: "Ganado. Y con el día cerrado el día antes, que es la parte que de verdad me interesa." },
          { m: "idle", t: "¿Te has fijado en una cosa? Ya no te pregunto si has dormido." },
          { m: "idle", t: "Doy por hecho que sí. Simplemente doy por hecho que sí." },
          { m: "suave", t: "Eso ha tardado meses en pasar. Y no ha pasado de golpe." },
          { m: "preocupada", t: "¿Nervioso?" },
          { m: "idle", t: "No contestes. Llevas doce minutos mirando el mismo trozo de césped." },
          { m: "preocupada", t: "Es normal. Un derbi no se juega. Un derbi se sobrevive." },
          { m: "idle", t: "Mañana esto va a estar lleno de gente que lleva toda la semana hablando de este partido en el trabajo." },
          { m: "idle", t: "Y ninguna de esas personas te conoce." },
          { m: "decidida", t: "Lo que van a ver de ti son noventa minutos. Nada más." },
          { m: "idle", t: "No van a ver los tres días encadenados. Ni la libreta. Ni las seis y media de la mañana de febrero." },
          { m: "preocupada", t: "Y por eso este es exactamente el partido en el que más gente se rompe." },
          { m: "preocupada", t: "No por el rival. Por intentar meter un año entero dentro de noventa minutos." },
          { m: "preocupada", t: "Toma. Antes de que se me olvide y me lo lleve a casa otra vez." },
          { m: "idle", t: "Es una moneda. No vale nada, ni siquiera es de curso legal ya." },
          { m: "sorprendida", t: "Y no, no creo en la suerte. Que quede clarísimo, no quiero malentendidos." },
          { m: "suave", t: "La llevo encima desde mi primera firma. Cada vez que he tenido un día imposible me la he pasado entre los dedos hasta que se me pasaba." },
          { m: "idle", t: "No hace nada. No te va a ayudar a marcar y no va a parar un balón." },
          { m: "suave", t: "Solo sirve para darle algo que hacer a las manos mientras la cabeza se calma. Que es bastante más de lo que parece." },
          { m: "decidida", t: "Y ahora escúchame bien, porque esto sí importa." },
          { m: "decidida", t: "No intentes jugar el partido de tu vida. Los partidos de tu vida no se juegan: se descubren después, cuando alguien te los recuerda." },
          { m: "idle", t: "Juega el partido que ya sabes jugar. El mismo que llevas meses jugando cuando no había nadie mirando." },
          { m: "preocupada", t: "Quiero que lo ganéis, y quiero que aparezcas en el resumen. Con un gol o con una asistencia, me da exactamente igual cuál de las dos." },
          { m: "decidida", t: "Y quiero que llegues a mañana con seis días seguidos cuidándote." },
          { m: "preocupada", t: "Porque un cuerpo cansado toma decisiones cobardes. Y tú mañana no te puedes permitir ni una." },
        ],
        replies: [
          { t: "¿Y si fallo?", m: "preocupada",
            r: [{ m: "preocupada", t: "Fallarás. Varias veces. Y delante de mucha gente." },
              { m: "decidida", t: "Lo único que me importa es qué haces con el balón siguiente." },
              { m: "idle", t: "El resumen del lunes se monta con lo que hiciste después de fallar. Siempre." }] },
          { t: "¿Vas a estar ahí?", m: "idle",
            r: [{ m: "suave", t: "Fila alta, lado izquierdo. Siempre en el mismo sitio." },
              { m: "happy", t: "No mires. Me pone nerviosa que mires." }] },
          { t: "Gracias por la moneda.", m: "happy",
            r: [{ m: "sorprendida", t: "No me des las gracias por un trozo de metal sin valor." },
              { m: "suave", t: "…De nada." }] },
        ],
        grantItem: "elisa_amuleto", reveal: "elisa_amuleto",
        snap: (g) => ({ since: todayStr(), matchCount: (g.matchHistory || []).length }),
        subs: [
          (g, s) => (g.matchHistory || []).slice(s.matchCount).some((m) => m.res === "V" && (m.rating || 0) >= 7.5),
          (g, s) => (g.matchHistory || []).slice(s.matchCount).reduce((a, m) => a + (m.myGoals || 0) + (m.myAssists || 0), 0) >= 1,
          { count: (g) => g.player.streak || 0, goal: 6 },
        ],
        check: (g, s) => (g.matchHistory || []).slice(s.matchCount).some((m) => m.res === "V" && (m.rating || 0) >= 7.5) &&
          (g.matchHistory || []).slice(s.matchCount).reduce((a, m) => a + (m.myGoals || 0) + (m.myAssists || 0), 0) >= 1 &&
          (g.player.streak || 0) >= 6 },
      /* CAPÍTULO 8 — Ya no eres el mismo. Simplificación consciente (ver nota del
         documento): matchHistory no guarda el tier de cada partido, así que la condición
         pide ascenso/cambio de club + al menos un partido jugado dentro del capítulo. */
      { title: "Ya no eres el mismo", zone: "prensa",
        objective: "Sube de categoría (o cambia de club) y juega al menos un partido ya con tu nuevo estado.",
        intro: [
          { m: "orgullosa", t: "Ganado. Con participación tuya en el gol y con una nota de las que se recortan y se guardan." },
          { m: "happy", t: "He tenido que quitarle el sonido al móvil. Cuarenta y un mensajes desde el pitido final." },
          { m: "idle", t: "Y ninguno de ellos me pregunta cómo estás." },
          { m: "idle", t: "Todos preguntan cuánto vales." },
          { m: "idle", t: "Ven. ¿Ves esa sala? Mesa larga, micrófonos, un foco que calienta más de lo que alumbra." },
          { m: "idle", t: "A partir de ahora vas a pasar por ahí cada dos semanas." },
          { m: "decidida", t: "Y esa es la primera habitación de tu carrera en la que yo no puedo entrar contigo." },
          { m: "idle", t: "Puedo filtrar ofertas. Puedo discutir con un director deportivo hasta que se rinda. Puedo apagarte el teléfono." },
          { m: "suave", t: "No puedo contestar por ti cuando alguien te pregunte por qué fallaste ese pase en el minuto ochenta." },
          { m: "idle", t: "Cuando empezamos, yo te decía exactamente qué hacer y funcionaba, porque no sabías nada y te venía bien que alguien decidiera." },
          { m: "suave", t: "Ahora ya sabes." },
          { m: "decidida", t: "Y si te sigo diciendo qué hacer, dejo de ser tu mánager y me convierto en tu excusa." },
          { m: "decidida", t: "Y eso no te lo voy a hacer. A ti no." },
          { m: "idle", t: "Así que este capítulo lo vas a llevar tú." },
          { m: "decidida", t: "Quiero verte en la categoría siguiente. Subiendo de nivel o cambiando de club, me da igual el camino que elijas." },
          { m: "idle", t: "Y después quiero verte jugar siendo ya ese jugador. No el que acaba de llegar y va con cuidado." },
          { m: "idle", t: "El que está." },
          { m: "happy", t: "Tranquilo, voy a seguir dándote mi opinión aunque no me la pidas. Eso no ha cambiado ni va a cambiar." },
          { m: "decidida", t: "Pero a partir de hoy vas a tener que aprender a distinguir mi opinión de tu decisión." },
        ],
        replies: [
          { t: "¿Y si me equivoco?", m: "idle",
            r: [{ m: "suave", t: "Te equivocarás." },
              { m: "decidida", t: "Prefiero un error tuyo que un acierto mío." },
              { m: "idle", t: "El segundo no te enseña absolutamente nada y encima te acostumbra." }] },
          { t: "¿Qué digo ahí dentro?", m: "idle",
            r: [{ m: "idle", t: "La verdad, y corta." },
              { m: "happy", t: "Y si no sabes qué decir, di que el equipo ha competido muy bien." },
              { m: "happy", t: "Nadie ha perdido nunca una carrera por decir que el equipo ha competido muy bien." }] },
          { t: "Prefiero que decidas tú.", m: "idle",
            r: [{ m: "angry", t: "No." }, { m: "preocupada", t: "Ya cometí ese error una vez y todavía lo estoy pagando." },
              { m: "idle", t: "…Sigamos." }] },
        ],
        setFlags: ["elisaPrensa"],
        snap: (g) => ({ since: todayStr(), tierId: g.tier.id, clubName: g.club && g.club.name, matchCount: (g.matchHistory || []).length }),
        subs: [
          (g, s) => g.tier.id > s.tierId || (g.club && g.club.name) !== s.clubName,
          (g, s) => (g.matchHistory || []).slice(s.matchCount).length >= 1,
        ],
        check: (g, s) => (g.tier.id > s.tierId || (g.club && g.club.name) !== s.clubName) &&
          (g.matchHistory || []).slice(s.matchCount).length >= 1 },
      /* CAPÍTULO 9 — La caída. Decisión de diseño (ver nota del documento): la "caída" es
         de Elisa, no del jugador — el detonante es una revisión menor en la enfermería
         (evento de escena, no una estadística), nunca se narra un fallo del jugador como
         hecho. Sin deadlineDays: decisión del usuario. */
      { title: "La caída", zone: "enfermeria",
        objective: "Recupera una forma de 'buen' o 'alza', cierra 3 días de objetivos y consigue una victoria.",
        intro: [
          { m: "preocupada", t: "Categoría nueva. Partido jugado. Exactamente todo lo que te pedí, y encima rápido." },
          { m: "preocupada", t: "Y llego aquí a felicitarte y te encuentro en una camilla." },
          { m: "angry", t: "No. No me digas que no es nada." },
          { m: "angry", t: "Ya me lo ha dicho el fisio, ya me lo ha dicho dos veces, y ahora mismo me da exactamente igual lo que diga el fisio." },
          { m: "angry", t: "¿Sabes cuánto tardas tú en decirme que algo te duele? Nunca. Esa es la respuesta exacta. Nunca." },
          { m: "angry", t: "Llevo tres semanas viéndote entrenar por encima de lo que te pedí y no he dicho nada." },
          { m: "angry", t: "Y eso también es culpa mía, así que no pongas esa cara de reproche." },
          { m: "preocupada", t: "Perdona. Perdóname. No es contigo." },
          { m: "preocupada", t: "Siéntate. Anda, siéntate." },
          { m: "preocupada", t: "Voy a contarte de una vez la película que te dije que te contaría otro día." },
          { m: "idle", t: "Se llamaba Nico. Fue el primer jugador que llevé. Tenía diecinueve años y jugaba en Tercera. Como tú." },
          { m: "idle", t: "En dieciocho meses lo subí dos categorías. Fue, sin discusión, el mejor año de mi vida profesional." },
          { m: "preocupada", t: "Cada vez que él me decía «puedo más», yo le decía «pues más». Cada vez. Sin excepción." },
          { m: "preocupada", t: "Llegó a Primera con veintitrés años. Lo consiguió. Consiguió absolutamente todo lo que yo había planificado, punto por punto." },
          { m: "suave", t: "Y a los veintiséis lo dejó." },
          { m: "suave", t: "Sin lesión. Sin escándalo. Se levantó un martes y dijo que no quería volver a entrar en un vestuario nunca más." },
          { m: "preocupada", t: "¿Y sabes de qué me di cuenta ese día?" },
          { m: "preocupada", t: "De que en cinco años no le había preguntado ni una sola vez si aquello le gustaba." },
          { m: "preocupada", t: "Yo no lo rompí empujándolo, {player}. Lo rompí llevándolo a un sitio que él nunca eligió." },
          { m: "suave", t: "Esto lo llevo en el bolso desde el primer día que fui a verte jugar bajo la lluvia." },
          { m: "idle", t: "Vendas, hielo instantáneo y dos cosas más. Nunca lo he abierto." },
          { m: "preocupada", t: "Lo llevaba encima «por si acaso», que es la forma educada de decir «por miedo»." },
          { m: "decidida", t: "Ahora es tuyo." },
          { m: "suave", t: "Prefiero que lo tengas tú y me llames antes de que haga falta, y no al revés." },
          { m: "decidida", t: "Y ahora vamos a hacer exactamente lo que llevo un año predicando y no siempre cumpliendo." },
          { m: "idle", t: "No vamos a apretar. Vamos a reconstruir, que es más lento y menos vistoso." },
          { m: "idle", t: "Tres días cerrados. Bien cerrados, sin trampas y sin días a medias." },
          { m: "idle", t: "Y quiero verte otra vez en una forma decente antes de que hablemos de nada más." },
          { m: "preocupada", t: "Y una victoria, sí. Porque el fútbol no espera a que estemos emocionalmente disponibles." },
          { m: "suave", t: "Pero esta vez no la quiero para el informe." },
          { m: "suave", t: "La quiero para que los dos nos quedemos tranquilos." },
        ],
        replies: [
          { t: "¿Dónde está Nico ahora?", m: "idle",
            r: [{ m: "suave", t: "Bien. Está bien, de verdad." }, { m: "idle", t: "Tiene una tienda de bicicletas y dos críos." },
              { m: "suave", t: "Nos escribimos por su cumpleaños. Es la persona más tranquila que conozco." },
              { m: "preocupada", t: "A veces me da rabia. Y casi siempre me da envidia." }] },
          { t: "No soy él.", m: "decidida",
            r: [{ m: "sorprendida", t: "…" }, { m: "preocupada", t: "Ya lo sé. Lo sé perfectamente." },
              { m: "suave", t: "El problema es que yo sigo siendo yo." }] },
          { t: "Perdona por no habértelo dicho.", m: "idle",
            r: [{ m: "preocupada", t: "No. Perdóname tú a mí." },
              { m: "decidida", t: "Yo te enseñé a no quejarte nunca." },
              { m: "idle", t: "Y luego me sorprendo de que no te quejes. Es de un ridículo impresionante." }] },
        ],
        setFlags: ["elisaNicoRevelado"],
        grantItem: "elisa_botiquin", reveal: "elisa_botiquin",
        snap: (g) => ({ since: todayStr(), matchCount: (g.matchHistory || []).length }),
        subs: [
          (g, s) => Object.entries(g.logs || {}).some(([d, l]) => d >= s.since && l.closed && (l.form === "buen" || l.form === "alza")),
          { count: (g, s) => daysGoalsCompletedSince(g, s.since), goal: 3 },
          (g, s) => (g.matchHistory || []).slice(s.matchCount).some((m) => m.res === "V"),
        ],
        check: (g, s) => Object.entries(g.logs || {}).some(([d, l]) => d >= s.since && l.closed && (l.form === "buen" || l.form === "alza")) &&
          daysGoalsCompletedSince(g, s.since) >= 3 && (g.matchHistory || []).slice(s.matchCount).some((m) => m.res === "V") },
      /* CAPÍTULO 10 — Una noche distinta. Único capítulo con pose "gala". bestRating se
         fotografía en el snap para no comparar contra un valor que cambia en cuanto se
         supera. */
      { title: "Una noche distinta", zone: "casino",
        objective: "Supera tu mejor nota de carrera en un partido y mantén una racha de 5 días.",
        intro: [
          { m: "happy", t: "Recuperado. Forma decente, tres días limpios y un partido ganado sin forzar absolutamente nada." },
          { m: "idle", t: "Y lo hiciste llamándome dos veces por el camino, que es la parte que me he apuntado yo en mi libreta." },
          { m: "gala", t: "Y por eso esta noche estamos aquí y no en una camilla." },
          { m: "gala", t: "No te acostumbres a verme así. Este vestido tiene ocho años y sale una vez cada dos temporadas." },
          { m: "gala", t: "Esta noche no soy tu mánager." },
          { m: "gala", t: "Bueno… técnicamente lo soy, y de hecho hay cuatro personas en esta sala que van a intentar hablar conmigo de ti antes del postre. Las tengo localizadas." },
          { m: "happy", t: "Pero durante un par de horas vamos a fingir que ninguno de los dos tiene una temporada que sacar adelante." },
          { m: "gala", t: "Reglas de la noche. Tres. Como siempre." },
          { m: "gala", t: "Una: si alguien te pregunta por tu media, cambias de tema. Sonríe y habla del catering." },
          { m: "gala", t: "Dos: no apuestas. Ni por diversión. He visto cómo empieza eso y siempre empieza por diversión." },
          { m: "suave", t: "Tres: si en algún momento te agobias, me lo dices y nos vamos. Sin explicaciones y sin quedar mal con nadie." },
          { m: "happy", t: "Esa tercera es nueva. Antes no la tenía." },
          { m: "suave", t: "Digamos que últimamente estoy revisando el manual entero." },
          { m: "gala", t: "Ah, y una última cosa, que soy incapaz de no ser yo ni una noche." },
          { m: "happy", t: "Mañana sigue habiendo temporada." },
          { m: "decidida", t: "Y quiero tu mejor partido. No un buen partido: el mejor que hayas hecho nunca en tu vida." },
          { m: "idle", t: "Tienes una nota máxima en tu historial. Quiero que la borres." },
          { m: "decidida", t: "Y quiero que llegues ahí con cinco días seguidos detrás, no con una semana de fiesta y un día de arrepentimiento." },
          { m: "gala", t: "Y ahora deja de mirarme con esa cara y ve a saludar al señor de la corbata horrible, que es el dueño de media liga." },
        ],
        replies: [
          { t: "Estás guapa.", m: "happy",
            r: [{ m: "sorprendida", t: "…" }, { m: "gala", t: "Y tú te estás saltando la regla número uno por un camino que no había previsto." },
              { m: "happy", t: "Gracias." }] },
          { t: "¿Quién es toda esta gente?", m: "idle",
            r: [{ m: "gala", t: "Dinero. Todo esto es dinero con zapatos caros." },
              { m: "idle", t: "Apréndete las caras, no los nombres. Los nombres cambian." },
              { m: "decidida", t: "Algún día te van a hacer falta y no vas a tener tiempo de preguntar." }] },
          { t: "¿Nos podemos ir ya?", m: "idle",
            r: [{ m: "suave", t: "Sí." }, { m: "happy", t: "Has aguantado cuarenta minutos. Yo la primera vez aguanté veinte y me escondí en un baño." }] },
        ],
        snap: (g) => ({ since: todayStr(), matchCount: (g.matchHistory || []).length, bestRating: g.bestRating || 0 }),
        subs: [
          (g, s) => (g.matchHistory || []).slice(s.matchCount).some((m) => (m.rating || 0) > s.bestRating),
          { count: (g) => g.player.streak || 0, goal: 5 },
        ],
        check: (g, s) => (g.matchHistory || []).slice(s.matchCount).some((m) => (m.rating || 0) > s.bestRating) &&
          (g.player.streak || 0) >= 5 },
      /* CAPÍTULO 11 — Lo que elegimos. Decisión mayor: marca flag permanente
         (elisaPath_cima / elisaPath_equilibrio / elisaPath_abierto) que cambia una línea
         en C12, FINAL y EPÍLOGO (ver introBuild de esas etapas más abajo). Es también el
         pago de las siete páginas arrancadas de la libreta sembradas en el prólogo. */
      { title: "Lo que elegimos", zone: "playa",
        objective: "Alcanza la categoría Europa manteniendo 5 días de objetivos.",
        intro: [
          { m: "orgullosa", t: "Tu mejor nota. La mejor de toda tu carrera. Y con la racha entera." },
          { m: "idle", t: "Lo he mirado tres veces por si el sistema se había equivocado." },
          { m: "suave", t: "No se había equivocado." },
          { m: "idle", t: "Te he traído aquí porque en la oficina no me salía decirte esto. Lo he intentado dos veces esta semana." },
          { m: "idle", t: "Llevo un año diciéndote lo que tienes que hacer. Qué entrenar. Cuándo apretar. Qué firmar y qué no." },
          { m: "idle", t: "Y he acertado bastante, la verdad. Eso hace que sea todavía más difícil lo que voy a hacer ahora." },
          { m: "decidida", t: "Voy a callarme y preguntarte a ti." },
          { m: "preocupada", t: "Y no le hago esta pregunta a nadie desde hace cinco años, así que ten paciencia si me sale mal." },
          { m: "idle", t: "Se puede llegar arriba de muchas formas, {player}. Y no todas terminan en el mismo sitio." },
          { m: "idle", t: "Puedo llevarte al máximo posible. Sé cómo se hace, lo he hecho antes y funciona. Cuesta caro, y no siempre en dinero." },
          { m: "idle", t: "O puedo llevarte lo más alto que se pueda llegar sin que dejes de reconocerte cuando te mires." },
          { m: "suave", t: "Y no pienso decirte cuál elegiría yo. Ya elegí una vez por otra persona." },
          { m: "idle", t: "¿Te acuerdas de las siete páginas que faltan al principio de la libreta?" },
          { m: "suave", t: "Las arranqué yo. Eran el plan de otro." },
          { m: "decidida", t: "Llevo un año esperando a que tuvieras algo tuyo que poner ahí." },
          { m: "decidida", t: "Sea lo que sea lo que has puesto en esa página, se demuestra igual." },
          { m: "idle", t: "Quiero verte en Europa. En la categoría en la que se juega entre semana y la gente se sabe tu nombre en otro idioma." },
          { m: "decidida", t: "Y quiero que llegues con la rutina intacta. No a base de un mes espectacular y tres semanas escondiéndote." },
          { m: "suave", t: "Porque a estas alturas ya no me importa tanto el sitio al que llegues." },
          { m: "suave", t: "Me importa cómo llegues." },
        ],
        replies: [
          { t: "Quiero llegar lo más alto posible. Todo.", m: "decidida", setFlag: "elisaPath_cima",
            r: [{ m: "sorprendida", t: "…" }, { m: "decidida", t: "Vale. Entonces lo vamos a hacer bien, que no es lo mismo que hacerlo rápido." },
              { m: "idle", t: "Te voy a exigir más que a nadie y te vas a hartar de mí." },
              { m: "suave", t: "Y si algún día quieres bajarte, me lo dices y frenamos. Eso también lo escribo, en la misma página y con la misma letra." }] },
          { t: "Quiero llegar alto sin dejar de ser yo.", m: "idle", setFlag: "elisaPath_equilibrio",
            r: [{ m: "suave", t: "…" }, { m: "happy", t: "Esa es la respuesta difícil, ¿sabes?" },
              { m: "idle", t: "Todo el mundo se cree que la ambiciosa es la otra." },
              { m: "decidida", t: "Anotado. Y te aviso: te la voy a recordar los días que se te olvide." }] },
          { t: "Todavía no lo sé.", m: "idle", setFlag: "elisaPath_abierto",
            r: [{ m: "sorprendida", t: "…" }, { m: "suave", t: "¿Sabes qué? Es la primera respuesta honesta que me han dado nunca a esta pregunta." },
              { m: "idle", t: "Dejamos la página en blanco. No pasa nada, hay tiempo." },
              { m: "decidida", t: "Pero la libreta la llevas tú. Eso no es negociable." }] },
        ],
        setFlags: ["elisaEleccion"],
        snap: (g) => ({ since: todayStr() }),
        subs: [
          (g) => g.tier.id >= 5,
          { count: (g, s) => daysGoalsCompletedSince(g, s.since), goal: 5 },
        ],
        check: (g, s) => g.tier.id >= 5 && daysGoalsCompletedSince(g, s.since) >= 5 },
      /* CAPÍTULO 12 — Hasta arriba. La línea "Hay gente que dice…" cambia según el camino
         elegido en el capítulo 11 (introBuild, ver elisaPathOf arriba). */
      { title: "Hasta arriba", zone: "atico",
        objective: "Alcanza la categoría Champions, gana un partido, mantén una racha de 6 días y supera tu mejor media.",
        intro: ELISA_C12_INTRO,
        introBuild: (g) => {
          const path = elisaPathOf(g);
          if (!path) return null;
          return ELISA_C12_INTRO.map((b) => b === ELISA_C12_PATH_LINE ? ELISA_C12_PATH_LINES[path] : b);
        },
        replies: [
          { t: "Todavía no me lo creo.", m: "happy",
            r: [{ m: "happy", t: "Normal. Yo tampoco." },
              { m: "idle", t: "Tardarás como un año en creértelo. A mí me pasó igual con mi primera oficina." },
              { m: "suave", t: "Y cuando te lo creas, echarás de menos no creértelo. Avisado quedas." }] },
          { t: "Deberías llevarte una comisión mayor.", m: "idle",
            r: [{ m: "sorprendida", t: "Ya me la he llevado." }, { m: "happy", t: "¿Con quién crees que estás hablando exactamente?" }] },
          { t: "¿Y si aquel día no te hubiera hecho caso?", m: "idle",
            r: [{ m: "idle", t: "Nada. Habría cogido otro autobús al domingo siguiente." },
              { m: "suave", t: "Y ahora estaría en una oficina de dos sillas preguntándome qué habrías hecho tú." }] },
        ],
        snap: (g) => ({ since: todayStr(), matchCount: (g.matchHistory || []).length, ovr: calcOVR(g.player.stats) }),
        subs: [
          (g) => g.tier.id >= 6,
          (g, s) => (g.matchHistory || []).slice(s.matchCount).some((m) => m.res === "V"),
          { count: (g) => g.player.streak || 0, goal: 6 },
          (g, s) => calcOVR(g.player.stats) > s.ovr,
        ],
        check: (g, s) => g.tier.id >= 6 && (g.matchHistory || []).slice(s.matchCount).some((m) => m.res === "V") &&
          (g.player.streak || 0) >= 6 && calcOVR(g.player.stats) > s.ovr },
      /* FINAL — El jugador que conocí. La última línea del bloque B cambia según el
         camino elegido en el capítulo 11 (introBuild). NO lleva final:true: la última
         etapa del capítulo es el EPÍLOGO. */
      { title: "El jugador que conocí", zone: "estadio",
        objective: "Alcanza el último escalón de tu carrera: la categoría Leyenda.",
        intro: ELISA_FINAL_INTRO,
        introBuild: (g) => {
          const path = elisaPathOf(g);
          if (!path || path === "equilibrio") return null;
          return ELISA_FINAL_INTRO.map((b) => b === ELISA_FINAL_PATH_LINE ? ELISA_FINAL_PATH_LINES[path] : b);
        },
        replies: [
          { t: "No lo habría hecho sin ti.", m: "happy",
            r: [{ m: "sorprendida", t: "…" }, { m: "decidida", t: "Sí. Sí lo habrías hecho." },
              { m: "suave", t: "Más tarde, peor y más solo. Pero lo habrías hecho." },
              { m: "happy", t: "Aun así, gracias por decirlo." }] },
          { t: "¿Y ahora qué?", m: "idle",
            r: [{ m: "idle", t: "Ahora falta el último escalón y luego empieza otra cosa." },
              { m: "suave", t: "No te preocupes por eso hoy." }] },
          { t: "Fila alta, lado izquierdo.", m: "happy",
            r: [{ m: "sorprendida", t: "…" }, { m: "suave", t: "Te has fijado." }, { m: "happy", t: "Sigo sin querer que mires." }] },
        ],
        snap: () => ({ since: todayStr() }),
        subs: [(g) => g.tier.id >= 7],
        check: (g) => g.tier.id >= 7,
        reward: (g) => {
          const stats = { ...g.player.stats };
          stats.MEN = Math.min(99, stats.MEN + 1);
          return { ...g, player: { ...g.player, stats } };
        } },
      /* EPÍLOGO — Ocho en punto (última etapa: final:true, sin objetivo propio; entrega
         el pin al leer la escena). Una línea extra se añade justo antes del cierre según
         el camino elegido en el capítulo 11 (introBuild). */
      { title: "Ocho en punto", zone: "oficina", final: true,
        intro: ELISA_EPILOGO_INTRO.filter((b) => b !== ELISA_EPILOGO_PATH_MARKER),
        introBuild: (g) => {
          const path = elisaPathOf(g);
          if (!path) return null;
          return ELISA_EPILOGO_INTRO.map((b) => b === ELISA_EPILOGO_PATH_MARKER ? ELISA_EPILOGO_PATH_LINES[path] : b);
        },
        replies: [
          { t: "Ocho en punto mañana.", m: "happy",
            r: [{ m: "happy", t: "Ocho en punto." }, { m: "suave", t: "Y trae la libreta. Todavía quedan páginas." }] },
          { t: "Gracias, Elisa.", m: "happy",
            r: [{ m: "sorprendida", t: "…" }, { m: "suave", t: "De nada." },
              { m: "happy", t: "Vete ya, anda, que me estás poniendo sentimental y tengo tres llamadas." }] },
        ],
        setFlags: ["elisaStoryComplete", "elisaPinEarned"],
        objective: null,
        check: () => true,
        grantItem: "elisa_pin", reveal: "elisa_pin" },
    ],
  }],
};

/* ============================================================
   MILLY · segunda campaña narrativa completa. Prólogo + 13 capítulos +
   final + epílogo, misma forma que ELISA_STORY (una sola etapa de
   chapters[0] por cada escena). Milly representa la ciudad alrededor
   de la carrera del jugador: sus zonas se reparten entre Kiosco/Barrio/
   Ciudad Deportiva/Sala de Prensa/Patrocinadores (Ciudad) y Parque/
   Enfermería/Gran Estadio (mezcla de ambos mapas, ver más abajo).

   Nota de asset: el documento de esta campaña usa el mood "suave" en 3
   frases (capítulos 11, final y epílogo) pero no lo declara entre sus
   assets ni existe /images/milly/milly_suave.webp — a diferencia de
   Elisa, que sí tiene ese mood. Sustituidas por el mood más cercano
   (idle/happy) en vez de dejar una imagen rota o inventar un asset. */
const MILLY_STORY = {
  npc: "milly",
  chapters: [{
    id: "cap1",
    title: "La historia de Milly",
    trigger: () => true,
    stages: [
      /* PRÓLOGO — El periódico de hoy (rework de diálogos, ver
         FUTABITA_Milly_Rework_Narrativo_para_Code.docx — no toca objetivos ni
         comportamiento, solo sustituye el texto de las escenas). Mismo fix de
         contradicción temporal que ELISA_STORY/NINA_STORY: los bloques de
         reacción "cuando el jugador vuelve tras cumplir el objetivo" se han
         movido al PRINCIPIO de la etapa siguiente. El documento usa el mood
         [suave], que Milly no tiene (sin asset ni entrada en NPCS.milly.arts,
         a diferencia de Elisa/Nina) — sustituido por "idle" en sus 12 frases. */
      { title: "El periódico de hoy", zone: "kiosco",
        objective: "Recoge el primer periódico y completa un día de juego.",
        intro: [
          { m: "periodico", t: "¡Buenos días! Bueno, dependiendo de la hora. Si acabas de levantarte, para ti es una noticia de última hora." },
          { m: "happy", t: "Soy Milly. Dueña del kiosco, repartidora oficial y persona que sabe demasiadas cosas de demasiada gente." },
          { m: "idle", t: "Tú eres {player}, ¿verdad? El nuevo de {club}." },
          { m: "curiosa", t: "¿Primeros días y ya estás llamando la atención? Qué peligro." },
          { m: "happy", t: "Tranquilo, no todo lo que sé sobre la gente acaba en el periódico." },
          { m: "curiosa", t: "Algunas cosas solo las guardo porque soy curiosa. Que es completamente distinto." },
          { m: "periodico", t: "Toma. El periódico." },
          { m: "happy", t: "No lo he leído entero, solo las partes importantes. Y por partes importantes me refiero a las que me interesan a mí." },
          { m: "idle", t: "Aquí en el barrio siempre pasa algo. Un partido, alguien que cambia de club, una bronca, una historia absurda..." },
          { m: "curiosa", t: "La gente cree que las noticias importantes son las grandes. Yo creo que muchas veces las buenas historias empiezan siendo pequeñas." },
          { m: "periodico", t: "Y antes de que preguntes: sí, te lo voy a traer todos los días." },
          { m: "happy", t: "Si algún día sales en él, intentaré que no sea por algo vergonzoso." },
        ],
        setFlags: ["millyMet", "metMilly"], /* metMilly: nombre que sigue usando CardDetail/CARDS para desbloquear su carta */
        snap: () => ({ since: todayStr() }),
        subs: [
          (g, snap) => !!g.paperRead && g.paperRead >= snap.since,
          (g, snap) => Object.entries(g.logs || {}).some(([d, l]) => d >= snap.since && l.closed),
        ],
        check: (g, snap) => !!g.paperRead && g.paperRead >= snap.since &&
          Object.entries(g.logs || {}).some(([d, l]) => d >= snap.since && l.closed) },
      /* CAPÍTULO 1 — Una noticia pequeña */
      { title: "Una noticia pequeña", zone: "kiosco",
        objective: "Juega un partido y consigue un resultado registrado.",
        intro: [
          { m: "happy", t: "¿Ves? Has sobrevivido a tu primer día." },
          { m: "periodico", t: "Mañana te traigo otro." },
          { m: "curiosa", t: "Y quién sabe. Igual dentro de poco tengo algo más interesante que contarte sobre ti." },
          { m: "curiosa", t: "Vale, necesito una cosa." },
          { m: "idle", t: "No pongas esa cara. No es ilegal." },
          { m: "curiosa", t: "Bueno... técnicamente tampoco estoy segura de que sea periodismo." },
          { m: "happy", t: "Quiero escribir una mini noticia sobre tu primer partido." },
          { m: "idle", t: "No hace falta que seas una estrella. Las historias pequeñas son las que llenan el periódico." },
          { m: "curiosa", t: "Y además, si algún día llegas muy arriba, podré decir que yo ya estaba aquí cuando nadie sabía quién eras." },
          { m: "happy", t: "Eso es periodismo de investigación histórica. Más o menos." },
          { m: "idle", t: "Solo necesito saber cómo te va en el campo." },
          { m: "curiosa", t: "Juega tu partido y déjame algo que contar. Un resultado, una buena jugada, cualquier cosa que merezca una línea." },
        ],
        setFlags: ["millyStoryStarted"],
        snap: (g) => ({ matchCount: (g.matchHistory || []).length }),
        check: (g, snap) => (g.matchHistory || []).length > snap.matchCount },
      /* CAPÍTULO 2 — La libreta */
      { title: "La libreta", zone: "kiosco",
        objective: "Consigue una victoria y completa 3 días de objetivos.",
        intro: [
          { m: "happy", t: "¡Lo sabía!" },
          { m: "curiosa", t: "Bueno, no sabía exactamente qué iba a pasar. Pero sabía que algo iba a pasar." },
          { m: "periodico", t: "He metido una pequeña referencia en el periódico de mañana." },
          { m: "happy", t: "No te emociones. De momento eres una noticia pequeñita." },
          { m: "curiosa", t: "Pero alguien tiene que empezar por algún sitio." },
          { m: "curiosa", t: "Tengo algo nuevo." },
          { m: "happy", t: "Una libreta." },
          { m: "curiosa", t: "Bueno, ya tenía una. Pero esta es la seria." },
          { m: "idle", t: "Apunto nombres, fechas, cosas raras que escucho y preguntas que todavía no sé responder." },
          { m: "curiosa", t: "Porque la noticia del otro día me dejó pensando." },
          { m: "idle", t: "Puedo escribir que ganaste un partido. Eso es fácil." },
          { m: "curiosa", t: "Lo difícil es entender qué hace que alguien gane después de haber trabajado toda la semana." },
          { m: "happy", t: "Y sí, eso significa que voy a empezar a hacer preguntas." },
          { m: "idle", t: "No significa que vaya detrás de ti." },
          { m: "curiosa", t: "Significa que, si casualmente apareces en mis notas, será por motivos periodísticos." },
          { m: "happy", t: "Completamente profesionales. Palabra." },
          { m: "idle", t: "Quiero ver si esa primera victoria fue una casualidad o si estás empezando a construir algo." },
        ],
        setFlags: ["millyNotes"],
        snap: (g) => ({ since: todayStr(), matchCount: (g.matchHistory || []).length }),
        subs: [
          { count: (g, snap) => daysGoalsCompletedSince(g, snap.since), goal: 3 },
          (g, snap) => (g.matchHistory || []).slice(snap.matchCount).some((m) => m.res === "V"),
        ],
        check: (g, snap) => daysGoalsCompletedSince(g, snap.since) >= 3 &&
          (g.matchHistory || []).slice(snap.matchCount).some((m) => m.res === "V") },
      /* CAPÍTULO 3 — La cámara (antes copiaba el check de "La libreta" — víctima y racha de
         3 días otra vez, cuando su objetivo real y mucho más ligero es solo "un
         entrenamiento y una victoria"; corregido para que la barra de progreso no dé 25%
         en vez de 50% con un solo requisito cumplido) */
      { title: "La cámara", zone: "barrio",
        objective: "Completa un entrenamiento y consigue una victoria.",
        intro: [
          { m: "orgullosa", t: "Vale. Esto ya empieza a parecerse a una historia." },
          { m: "curiosa", t: "Tres días cumpliendo objetivos y otra victoria." },
          { m: "idle", t: "Ya no tengo que escribir solamente sobre el resultado. Puedo empezar a contar el camino." },
          { m: "happy", t: "Y eso es bastante más interesante." },
          { m: "happy", t: "¡Tengo cámara!" },
          { m: "sorprendida", t: "Sí, ya sé que parece pequeña. Pero las cosas importantes también pueden caber en una cámara pequeña." },
          { m: "curiosa", t: "La libreta me sirve para recordar lo que pasa." },
          { m: "idle", t: "Pero una fotografía puede enseñarte algo que una frase no sabe explicar." },
          { m: "happy", t: "Quiero hacer una foto tuya entrenando." },
          { m: "idle", t: "No para el periódico de mañana. Para mi archivo." },
          { m: "curiosa", t: "Quiero comparar cómo eras al principio con cómo vas a ser dentro de unos meses." },
          { m: "decidida", t: "Si quiero ser periodista de verdad, necesito aprender a mirar antes de escribir." },
          { m: "curiosa", t: "Y para eso necesito dejar de mirar solo los resultados." },
          { m: "idle", t: "Quiero ver el trabajo que hay detrás." },
        ],
        snap: (g) => ({ since: todayStr(), matchCount: (g.matchHistory || []).length }),
        subs: [
          (g, snap) => Object.entries(g.logs || {}).some(([d, l]) => d >= snap.since && l.closed && l.gym),
          (g, snap) => (g.matchHistory || []).slice(snap.matchCount).some((m) => m.res === "V"),
        ],
        check: (g, snap) => Object.entries(g.logs || {}).some(([d, l]) => d >= snap.since && l.closed && l.gym) &&
          (g.matchHistory || []).slice(snap.matchCount).some((m) => m.res === "V") },
      /* CAPÍTULO 4 — La historia detrás del marcador */
      { title: "La historia detrás del marcador", zone: "prensa",
        objective: "Marca un gol y suma una asistencia u otra contribución.",
        intro: [
          { m: "orgullosa", t: "Perfecto." },
          { m: "happy", t: "Ya tengo la foto." },
          { m: "curiosa", t: "Y ahora entiendo algo que no se veía en la primera noticia." },
          { m: "decidida", t: "El partido es solo el momento que todo el mundo ve." },
          { m: "idle", t: "Lo interesante es todo lo que ocurre antes." },
          { m: "happy", t: "Creo que esto de ser periodista me va a gustar." },
          { m: "sorprendida", t: "¿Sabes qué? La gente aquí pregunta cosas muy serias." },
          { m: "happy", t: "Yo también sé hacer preguntas serias." },
          { m: "curiosa", t: "Bueno... algunas veces." },
          { m: "idle", t: "Hasta ahora yo escribía lo que veía: ganaste, perdiste, marcaste, jugaste bien." },
          { m: "decidida", t: "Pero después de seguirte un poco me he dado cuenta de que un marcador no cuenta una historia completa." },
          { m: "curiosa", t: "Tu gol está bien." },
          { m: "idle", t: "Pero quiero saber qué pasó antes de que llegaras a marcarlo." },
          { m: "decidida", t: "Quiero saber qué hiciste durante la semana. Qué cambió. Qué salió mal. Qué salió bien." },
          { m: "happy", t: "Y si algún día preguntas a un periodista por qué hace tantas preguntas, puedes decir que fue culpa mía." },
          { m: "curiosa", t: "Necesito una historia de verdad." },
        ],
        snap: (g) => ({ goals: careerGoals(g), assists: careerAssists(g) }),
        subs: [
          (g, snap) => careerGoals(g) - snap.goals >= 1,
          (g, snap) => careerAssists(g) - snap.assists >= 1 || careerGoals(g) - snap.goals >= 2,
        ],
        check: (g, snap) => {
          const dg = careerGoals(g) - snap.goals, da = careerAssists(g) - snap.assists;
          return dg >= 1 && (da >= 1 || dg >= 2);
        } },
      /* CAPÍTULO 5 — No todo se publica */
      { title: "No todo se publica", zone: "prensa",
        objective: "Completa 4 días de objetivos y consigue una victoria.",
        intro: [
          { m: "orgullosa", t: "Ahora sí tengo material." },
          { m: "decidida", t: "Ya no quiero limitarme a copiar un resultado." },
          { m: "happy", t: "Quiero contar qué hay detrás." },
          { m: "idle", t: "Y creo que acabo de dar un paso bastante grande." },
          { m: "curiosa", t: "He descubierto una cosa." },
          { m: "preocupada", t: "Y por primera vez no sé si debería contártela." },
          { m: "idle", t: "Hasta ahora pensaba que encontrar información era la parte difícil." },
          { m: "preocupada", t: "Pero resulta que la parte difícil es decidir qué haces con ella." },
          { m: "idle", t: "Una noticia puede ser verdad y aun así hacer daño." },
          { m: "decidida", t: "Y si quiero ser periodista de verdad, no puedo publicar algo solo porque pueda." },
          { m: "happy", t: "Aunque me cueste horrores no cotillear." },
          { m: "preocupada", t: "Hay cosas que pertenecen a la persona que las vive, no a quien las descubre." },
          { m: "decidida", t: "Así que esta vez voy a hacer las cosas bien." },
          { m: "idle", t: "Y mientras tanto quiero seguir viendo cómo va tu carrera." },
          { m: "curiosa", t: "Porque si voy a contar historias, necesito aprender también cuándo una historia merece ser contada." },
        ],
        setFlags: ["millyEthics"],
        snap: (g) => ({ since: todayStr(), matchCount: (g.matchHistory || []).length }),
        subs: [
          { count: (g, snap) => daysGoalsCompletedSince(g, snap.since), goal: 4 },
          (g, snap) => (g.matchHistory || []).slice(snap.matchCount).some((m) => m.res === "V"),
        ],
        check: (g, snap) => daysGoalsCompletedSince(g, snap.since) >= 4 &&
          (g.matchHistory || []).slice(snap.matchCount).some((m) => m.res === "V") },
      /* CAPÍTULO 6 — El kiosco */
      { title: "El kiosco", zone: "kiosco",
        objective: "Consigue una racha de 6 días y mejora tu OVR.",
        intro: [
          { m: "idle", t: "Bien." },
          { m: "decidida", t: "He tomado una decisión." },
          { m: "idle", t: "No voy a publicar aquello que descubrí." },
          { m: "orgullosa", t: "Y, sinceramente, creo que es la primera vez que me siento periodista sin necesidad de imprimir nada." },
          { m: "happy", t: "Aunque mañana volveré a cotillear. Una cosa no quita la otra." },
          { m: "preocupada", t: "Hoy no traigo una noticia divertida." },
          { m: "preocupada", t: "Cada vez vendo menos periódicos." },
          { m: "happy", t: "¡No pongas esa cara! Todavía no voy a cerrar." },
          { m: "idle", t: "Pero sí me preocupa." },
          { m: "orgullosa", t: "Este kiosco es mi sitio. Aquí he conocido a medio barrio." },
          { m: "idle", t: "Sé quién compra el periódico los lunes, quién solo lo quiere los domingos y quién viene a hablar conmigo y finge que viene por las revistas." },
          { m: "happy", t: "Y no voy a decir nombres." },
          { m: "idle", t: "La cosa es que cada vez hay menos gente que quiere llevarse las noticias en papel." },
          { m: "decidida", t: "Pero eso no significa que el kiosco haya dejado de importar." },
          { m: "orgullosa", t: "Así que voy a encontrar una forma de que vuelva a importar." },
          { m: "curiosa", t: "Y quizá tu carrera pueda ayudarme a demostrar que todavía hay historias que merece la pena guardar." },
          { m: "idle", t: "No quiero convertir el kiosco en otra cosa." },
          { m: "decidida", t: "Quiero que siga siendo este sitio." },
        ],
        setFlags: ["millyKioskCrisis"],
        snap: (g) => ({ ovr: calcOVR(g.player.stats) }),
        subs: [
          { count: (g) => g.player.streak || 0, goal: 6 },
          (g, snap) => calcOVR(g.player.stats) > snap.ovr,
        ],
        check: (g, snap) => (g.player.streak || 0) >= 6 && calcOVR(g.player.stats) > snap.ovr },
      /* CAPÍTULO 7 — Tu nombre en portada */
      { title: "Tu nombre en portada", zone: "kiosco",
        objective: "Alcanza un nuevo nivel o una mejora notable de OVR.",
        intro: [
          { m: "happy", t: "Mira eso." },
          { m: "orgullosa", t: "La gente vuelve a hablar de ti." },
          { m: "idle", t: "Y cuando la gente viene a preguntar por una historia, acaba entrando por aquí." },
          { m: "happy", t: "Quizá todavía tengamos futuro." },
          { m: "orgullosa", t: "Este kiosco no se va a rendir." },
          { m: "sorprendida", t: "¡Estás en portada!" },
          { m: "happy", t: "Bueno, en una esquina. Pero una esquina importante." },
          { m: "curiosa", t: "Podría haber puesto una foto enorme." },
          { m: "idle", t: "Pero no quiero convertirte en un cartel publicitario." },
          { m: "orgullosa", t: "Quiero que cuando alguien lea tu nombre sepa por qué está ahí." },
          { m: "idle", t: "Hemos pasado de una pequeña referencia de partido a tener una historia que la gente quiere leer." },
          { m: "happy", t: "Y eso cambia cómo tengo que escribirla." },
          { m: "curiosa", t: "Porque ahora ya no eres solo el chico nuevo del club." },
          { m: "decidida", t: "Hay gente mirando lo que haces." },
          { m: "idle", t: "Y yo tengo que decidir qué merece ocupar espacio." },
          { m: "orgullosa", t: "No quiero que tu nombre aparezca porque sí." },
          { m: "curiosa", t: "Quiero que aparezca porque hay algo que contar." },
        ],
        snap: (g) => ({ tierId: g.tier.id, ovr: calcOVR(g.player.stats) }),
        check: (g, snap) => g.tier.id !== snap.tierId || calcOVR(g.player.stats) >= snap.ovr + 3 },
      /* CAPÍTULO 8 — Lo que nadie pregunta */
      { title: "Lo que nadie pregunta", zone: "patro",
        objective: "Cambia de club o de nivel, y juega un partido después.",
        intro: [
          { m: "orgullosa", t: "Lo has conseguido." },
          { m: "happy", t: "Y sí, la portada ha merecido la pena." },
          { m: "idle", t: "Creo que por fin estoy empezando a entender qué clase de periodista quiero ser." },
          { m: "curiosa", t: "He venido a hacer una pregunta." },
          { m: "decidida", t: "No a ti. A ellos." },
          { m: "idle", t: "¿Cuánto de lo que cuentan sobre un jugador es realmente suyo?" },
          { m: "curiosa", t: "Porque ahora que tu nombre empieza a tener valor, todo el mundo parece tener una versión de lo que deberías ser." },
          { m: "preocupada", t: "El club tiene una. Los patrocinadores tienen otra. Los aficionados tienen otra." },
          { m: "idle", t: "Y yo me pregunto dónde queda la tuya." },
          { m: "decidida", t: "No quiero convertir esto en una guerra contra nadie." },
          { m: "curiosa", t: "Pero sí quiero saber quién decide qué historia se cuenta." },
          { m: "preocupada", t: "Porque si todo el mundo empieza a hablar por ti, puede que un día nadie escuche lo que tú dices." },
          { m: "decidida", t: "Y eso sí que sería una noticia." },
          { m: "happy", t: "Además, he aprendido que las preguntas incómodas son bastante más interesantes que las respuestas preparadas." },
        ],
        snap: (g) => ({ tierId: g.tier.id, clubName: g.club.name, matchCount: (g.matchHistory || []).length }),
        subs: [
          (g, snap) => g.tier.id !== snap.tierId || g.club.name !== snap.clubName,
          (g, snap) => (g.matchHistory || []).length > snap.matchCount,
        ],
        check: (g, snap) => (g.tier.id !== snap.tierId || g.club.name !== snap.clubName) &&
          (g.matchHistory || []).length > snap.matchCount },
      /* CAPÍTULO 9 — Una mala noticia */
      { title: "Una mala noticia", zone: "enfermeria",
        objective: "Completa 3 días de objetivos y gana un partido.",
        intro: [
          { m: "decidida", t: "Bien." },
          { m: "idle", t: "Has cambiado de escenario y aun así sigues siendo tú." },
          { m: "preocupada", t: "Eso es lo que quiero recordar." },
          { m: "curiosa", t: "Y ahora tengo todavía más preguntas." },
          { m: "preocupada", t: "Hoy no tengo ninguna broma." },
          { m: "preocupada", t: "Me han contado algo que podría llenar media portada." },
          { m: "idle", t: "Y precisamente por eso no voy a publicarlo." },
          { m: "decidida", t: "Antes habría pensado que encontrar algo así era mi gran oportunidad." },
          { m: "preocupada", t: "Ahora solo pienso en la persona que tendría que vivir las consecuencias." },
          { m: "idle", t: "Supongo que aprender a ser periodista también significa aprender cuándo una historia no es tuya." },
          { m: "decidida", t: "No quiero ser la persona que llega primero." },
          { m: "idle", t: "Quiero ser la persona que sabe qué hacer cuando llega." },
          { m: "preocupada", t: "Y eso significa tener criterio incluso cuando nadie te obliga." },
          { m: "idle", t: "Así que hoy no quiero hablar de lo que he descubierto." },
          { m: "curiosa", t: "Quiero hablar de lo que pasa después." },
          { m: "idle", t: "Porque las personas siguen teniendo que levantarse al día siguiente, aunque no salga nada en el periódico." },
        ],
        snap: (g) => ({ since: todayStr(), matchCount: (g.matchHistory || []).length }),
        subs: [
          { count: (g, snap) => daysGoalsCompletedSince(g, snap.since), goal: 3 },
          (g, snap) => (g.matchHistory || []).slice(snap.matchCount).some((m) => m.res === "V"),
        ],
        check: (g, snap) => daysGoalsCompletedSince(g, snap.since) >= 3 &&
          (g.matchHistory || []).slice(snap.matchCount).some((m) => m.res === "V") },
      /* CAPÍTULO 10 — La credencial */
      { title: "La credencial", zone: "prensa",
        objective: "Supera tu mejor nota u OVR y consigue una victoria.",
        intro: [
          { m: "orgullosa", t: "Ya está." },
          { m: "decidida", t: "Esta vez he elegido no publicar." },
          { m: "idle", t: "Y me siento más segura de la periodista que quiero ser." },
          { m: "happy", t: "Aunque reconozco que ha sido muchísimo más difícil que imprimir una portada." },
          { m: "sorprendida", t: "Mira." },
          { m: "happy", t: "¡Mira bien!" },
          { m: "decidida", t: "Ahora sí." },
          { m: "orgullosa", t: "Ya no estoy aquí porque conozco a alguien que conoce a alguien." },
          { m: "happy", t: "Bueno... sigo conociendo a muchísima gente." },
          { m: "decidida", t: "Pero ahora tengo un sitio propio." },
          { m: "idle", t: "¿Te acuerdas de aquella primera noticia?" },
          { m: "happy", t: "La del primer partido." },
          { m: "orgullosa", t: "Yo estaba emocionadísima por escribir tres líneas sobre ti." },
          { m: "decidida", t: "Ahora tengo una credencial y puedo entrar aquí como periodista." },
          { m: "curiosa", t: "Y lo mejor es que sé que no ha sido porque alguien me haya hecho un favor." },
          { m: "orgullosa", t: "Me lo he ganado." },
          { m: "happy", t: "Bueno, tú también has ayudado. Eres bastante buen material periodístico." },
        ],
        setFlags: ["millyJournalist"],
        snap: (g) => ({ bestRating: g.bestRating || 0, ovr: calcOVR(g.player.stats), matchCount: (g.matchHistory || []).length }),
        subs: [
          (g, snap) => (g.bestRating || 0) > snap.bestRating || calcOVR(g.player.stats) > snap.ovr,
          (g, snap) => (g.matchHistory || []).slice(snap.matchCount).some((m) => m.res === "V"),
        ],
        check: (g, snap) => ((g.bestRating || 0) > snap.bestRating || calcOVR(g.player.stats) > snap.ovr) &&
          (g.matchHistory || []).slice(snap.matchCount).some((m) => m.res === "V") },
      /* CAPÍTULO 11 — La noticia que no esperaba */
      { title: "La noticia que no esperaba", zone: "parque",
        objective: "Completa una racha de 6 días y un hito de carrera.",
        intro: [
          { m: "orgullosa", t: "Esto sí que es una noticia." },
          { m: "decidida", t: "He llegado hasta aquí sin dejar atrás el kiosco, el barrio ni la forma en la que empecé." },
          { m: "idle", t: "Y eso era lo que más miedo me daba." },
          { m: "preocupada", t: "Tengo una oportunidad." },
          { m: "idle", t: "Una de esas oportunidades que deberían hacerte saltar de alegría." },
          { m: "preocupada", t: "Y no estoy saltando." },
          { m: "curiosa", t: "Me han ofrecido algo que podría cambiar mi trabajo." },
          { m: "preocupada", t: "Y una parte de mí piensa que debería aceptarlo sin pensarlo." },
          { m: "idle", t: "Pero entonces miro el kiosco." },
          { m: "idle", t: "Y pienso en toda la gente que he conocido aquí." },
          { m: "preocupada", t: "Si me voy, ¿quién va a repartir el periódico por aquí?" },
          { m: "happy", t: "Sí, ya sé que parece una pregunta absurda." },
          { m: "idle", t: "Pero no quiero convertirme en alguien que cuenta historias de un sitio en el que ya no vive." },
          { m: "idle", t: "Quizá llevo tanto tiempo intentando demostrar que puedo ser periodista que he olvidado preguntarme qué clase de vida quiero tener." },
          { m: "curiosa", t: "Tú has tenido que tomar decisiones parecidas con tu carrera." },
          { m: "idle", t: "Así que necesito un poco de perspectiva." },
          { m: "decidida", t: "No para que decidas por mí." },
          { m: "idle", t: "Solo para recordar que elegir algo nuevo no significa necesariamente abandonar todo lo anterior." },
        ],
        snap: (g) => ({ tierId: g.tier.id, seasonNum: g.season.num }),
        subs: [
          { count: (g) => g.player.streak || 0, goal: 6 },
          (g, snap) => g.tier.id !== snap.tierId || g.season.num !== snap.seasonNum,
        ],
        check: (g, snap) => (g.player.streak || 0) >= 6 && (g.tier.id !== snap.tierId || g.season.num !== snap.seasonNum) },
      /* CAPÍTULO 12 — La gran historia */
      { title: "La gran historia", zone: "estadio",
        objective: "Gana un partido, suma gol/asistencia y supera tu mejor OVR o nota.",
        intro: [
          { m: "happy", t: "Creo que ya lo entiendo." },
          { m: "idle", t: "No tengo que elegir entre ser periodista y seguir siendo Milly del kiosco." },
          { m: "orgullosa", t: "Puedo llevarme el barrio conmigo." },
          { m: "decidida", t: "Y quizá eso sea precisamente lo que hace que mis historias sean distintas." },
          { m: "curiosa", t: "No me mires así." },
          { m: "happy", t: "Sí, llevo la cámara." },
          { m: "decidida", t: "Y sí, esta vez voy a hacer el reportaje entero." },
          { m: "orgullosa", t: "No sobre una estrella." },
          { m: "decidida", t: "Sobre alguien que empezó en Tercera y se empeñó en llegar arriba." },
          { m: "curiosa", t: "Tengo la libreta. Tengo la cámara. Tengo la acreditación." },
          { m: "happy", t: "Y tengo como cincuenta preguntas." },
          { m: "decidida", t: "Pero esta vez no quiero preguntarte solamente por el partido." },
          { m: "idle", t: "Quiero contar todo lo que hay detrás." },
          { m: "orgullosa", t: "Las primeras noticias pequeñas. La rutina. Las victorias. Los días malos." },
          { m: "curiosa", t: "El cambio de club. La gente que empezó a reconocerte. Todo lo que cambió mientras tú seguías intentando mejorar." },
          { m: "decidida", t: "Porque si voy a escribir la historia más importante de mi carrera hasta ahora, quiero que se entienda cómo empezó." },
          { m: "happy", t: "Y sí, también voy a intentar sacar una foto espectacular." },
        ],
        setFlags: ["millyBigStory"],
        snap: (g) => ({ matchCount: (g.matchHistory || []).length, ovr: calcOVR(g.player.stats), bestRating: g.bestRating || 0 }),
        subs: [
          (g, snap) => (g.matchHistory || []).slice(snap.matchCount).some((m) => m.res === "V"),
          (g, snap) => (g.matchHistory || []).slice(snap.matchCount).some((m) => (m.myGoals || 0) > 0 || (m.myAssists || 0) > 0),
          (g, snap) => calcOVR(g.player.stats) > snap.ovr || (g.bestRating || 0) > snap.bestRating,
        ],
        check: (g, snap) => {
          const ms = (g.matchHistory || []).slice(snap.matchCount);
          return ms.some((m) => m.res === "V") && ms.some((m) => (m.myGoals || 0) > 0 || (m.myAssists || 0) > 0) &&
            (calcOVR(g.player.stats) > snap.ovr || (g.bestRating || 0) > snap.bestRating);
        } },
      /* CAPÍTULO 13 — La portada */
      { title: "La portada", zone: "kiosco",
        objective: "Alcanza el nivel de élite.",
        intro: [
          { m: "orgullosa", t: "Tengo todo lo que necesito." },
          { m: "orgullosa", t: "Ya está." },
          { m: "happy", t: "He tardado tres noches." },
          { m: "curiosa", t: "He cambiado el titular siete veces." },
          { m: "happy", t: "Una era demasiado dramática. Otra parecía un anuncio. Otra sonaba como si hubieras ganado un Mundial." },
          { m: "orgullosa", t: "Y al final he dejado tu nombre como estaba." },
          { m: "idle", t: "Porque después de todo este tiempo, creo que ya sé quién eres." },
          { m: "idle", t: "No eres solamente el jugador que sale en las estadísticas." },
          { m: "orgullosa", t: "Eres el chico que llegó al barrio intentando demostrar algo." },
          { m: "idle", t: "Y también eres la persona que aprendió a seguir adelante cuando las cosas no salían." },
          { m: "happy", t: "He contado todo eso." },
          { m: "curiosa", t: "Bueno, casi todo. Algunas cosas no cabían en una portada." },
          { m: "orgullosa", t: "Pero esta edición es mía." },
          { m: "idle", t: "Y me hace ilusión pensar que alguien que compre el periódico dentro de unos años pueda leerla y saber que yo estaba allí." },
          { m: "happy", t: "Eso sí que es una buena noticia." },
        ],
        snap: () => ({}),
        check: (g) => g.tier.id >= TIERS[TIERS.length - 1].id },
      /* FINAL — La última entrega (sin objetivo propio: se resuelve en cuanto se lee) */
      { title: "La última entrega", zone: "kiosco",
        objective: "Sin objetivo adicional.",
        intro: [
          { m: "orgullosa", t: "Lo has conseguido." },
          { m: "idle", t: "Y ahora sí puedo cerrar la historia." },
          { m: "happy", t: "Bueno... esta historia." },
          { m: "orgullosa", t: "Porque seguro que mañana pasa otra cosa." },
          { m: "periodico", t: "¡Buenos días!" },
          { m: "happy", t: "¿Sabes qué es lo gracioso?" },
          { m: "orgullosa", t: "Que después de todo esto, sigo haciendo exactamente lo mismo." },
          { m: "happy", t: "Te traigo el periódico." },
          { m: "idle", t: "Solo que ahora, algunas de las historias que hay dentro también las he escrito yo." },
          { m: "idle", t: "Y una de ellas empezó contigo." },
          { m: "happy", t: "¿Te acuerdas de aquella primera noticia?" },
          { m: "orgullosa", t: "Tres líneas. Un partido. Una historia pequeñísima." },
          { m: "idle", t: "Pues mira dónde hemos acabado." },
          { m: "happy", t: "Tú en la élite y yo con una credencial que todavía me da demasiada ilusión enseñar." },
          { m: "orgullosa", t: "Supongo que los dos hemos cambiado bastante." },
          { m: "idle", t: "Pero me alegra que algunas cosas sigan igual." },
          { m: "periodico", t: "Como esto." },
          { m: "happy", t: "Tu periódico de hoy." },
        ],
        snap: () => ({}), check: () => true },
      /* EPÍLOGO — El kiosco sigue aquí (última etapa: final:true, entrega el pin al entrar aquí) */
      { title: "El kiosco sigue aquí", zone: "kiosco", final: true,
        intro: [
          { m: "idle", t: "¿Sabes qué me gusta de este sitio?" },
          { m: "happy", t: "Que aquí las cosas cambian muchísimo." },
          { m: "idle", t: "Pero algunas personas siguen volviendo." },
          { m: "happy", t: "Yo sigo teniendo el kiosco." },
          { m: "curiosa", t: "Sigo teniendo mis notas." },
          { m: "happy", t: "Sigo teniendo demasiadas preguntas." },
          { m: "idle", t: "Y de vez en cuando sigo escribiendo algo que empezó aquí." },
          { m: "periodico", t: "Así que toma." },
          { m: "periodico", t: "Tu periódico." },
          { m: "happy", t: "Y si lees algo raro sobre ti, ven a preguntarme antes de sacar conclusiones." },
          { m: "curiosa", t: "Podría ser verdad." },
          { m: "happy", t: "O podría ser una noticia muy, muy mal interpretada." },
        ],
        setFlags: ["millyStoryComplete", "millyPinEarned"],
        grantItem: "milly_pin", reveal: "milly_pin" },
    ],
  }],
};

/* ============================================================
   YUNA · tercera campaña completa, romance. Prólogo + 15 capítulos +
   final + epílogo. A diferencia de Elisa/Milly, su capítulo NO arranca
   de inmediato: el trigger exige el primer gol de carrera (así lo pide
   el documento — "la primera aparición ocurre tras el primer gol").

   Capítulo 5 ("La pregunta incómoda") es la primera escena de historia
   con respuesta de varias opciones: se apoya en el mismo mecanismo de
   "replies" que ya usan las respuestas sueltas de chat (opt.setFlag),
   solo que ahora checkStories también lo reenvía desde la etapa (ver
   enterStage/checkStories más abajo) — las tres opciones convergen y
   marcan el mismo flag, así el motor no necesita saber cuál se eligió
   para poder avanzar de etapa.

   playa/playablush comparten el mismo archivo (no existe todavía una
   pose "playa" neutra aparte de la vulnerable): se mantienen como
   moods distintos en el guion para el día que haya arte propio de cada
   una, en vez de mezclar con un mood de uniforme normal — eso sí
   rompería la regla de outfits del documento. */
/* helper: rama de afinidad elegida en el capítulo 5 ("calido" | "cauto" | "curioso" | null
   si aún no se ha llegado a esa decisión), usada por los introBuild de C6/C9/C13 para
   sustituir o añadir una línea concreta según la rama — ver "9 · Variantes por la decisión
   del capítulo 5" en FUTABITA_Yuna_Rework_3.0.docx. Las tres ramas CONVERGEN: no cambian
   ninguna misión, solo el tono de tres escenas. */
const yunaAffOf = (g) => g.yunaAff_calido ? "calido" : g.yunaAff_cauto ? "cauto" : g.yunaAff_curioso ? "curioso" : null;

/* línea "Y no sé qué hacer con eso, si te digo la verdad" del capítulo 6 — la sustituye
   introBuild según la rama del capítulo 5. El texto de aquí es el "por defecto". */
const YUNA_C6_AFF_LINE = { m: "blush", t: "Y no sé qué hacer con eso, si te digo la verdad." };
const YUNA_C6_AFF_LINES = {
  calido: { m: "blush", t: "Y como el otro día dijiste que te parecería bonito, pues me he permitido estar nerviosa sin sentirme una acosadora. Gracias por eso." },
  cauto: { m: "preocupada", t: "Y voy a intentar no ser pesada. Lo digo en serio. Dime si en algún momento es demasiado." },
  curioso: { m: "blush", t: "Y sigo pensando en lo que dijiste. Lo de que depende de quién fuera. Llevo semanas dándole vueltas a eso." },
};
/* línea añadida en el capítulo 9 justo antes de "Y creo que quizá me gustas tú" — por
   defecto no hay línea añadida (marcador vacío que introBuild filtra si no hay rama). */
const YUNA_C9_AFF_MARKER = { m: "blush", t: "" };
const YUNA_C9_AFF_LINES = {
  calido: { m: "blush", t: "Y ya sé que me dijiste que te parecería bonito. Por eso me atrevo a decirlo hoy y no dentro de seis meses." },
  cauto: { m: "preocupada", t: "Y sé que me dijiste que daría un poco de miedo. Lo he tenido en cuenta cada día desde entonces, para que lo sepas." },
  curioso: { m: "blush", t: "Aquel día me preguntaste que depende de quién fuera. Pues era yo. Siempre era yo." },
};
/* línea añadida en el capítulo 13 tras "Y no me pienso corregir esta vez" — mismo patrón
   de marcador vacío filtrado por defecto. */
const YUNA_C13_AFF_MARKER = { m: "blush", t: "" };
const YUNA_C13_AFF_LINES = {
  calido: { m: "enamorada", t: "Dijiste «bonito». Llevo un año viviendo de esa palabra." },
  cauto: { m: "blush", t: "Y si sigue dando un poco de miedo, lo entiendo. A mí también me lo da." },
  curioso: { m: "enamorada", t: "Y ahora ya sabes de quién dependía." },
};

const YUNA_C6_INTRO = [
  { m: "happy", t: "Siete y dos. Nota de siete y dos." },
  { m: "angry", t: "No la he mirado nada más acabar. La he mirado por la noche, como una persona normal." },
  { m: "blush", t: "…La he mirado nada más acabar." },
  { m: "idle", t: "Y ganasteis bien. No de rebote. Bien." },
  { m: "barcelona", t: "Vale. Mira esto." },
  { m: "barcelona", t: "Esto sí es importante y no pienso fingir que me da igual." },
  { m: "happy", t: "He estado en estadios así. Unos cuantos. Más de los que debería para mi edad." },
  { m: "idle", t: "Pero siempre desde la grada, con veinte mil personas delante y alguien tapándome en el momento del gol." },
  { m: "blush", t: "Esta vez no." },
  { m: "idle", t: "Esta vez el que va a estar ahí abajo eres tú." },
  YUNA_C6_AFF_LINE,
  { m: "idle", t: "Toda mi vida el campo ha sido un sitio al que se va a ver a gente que no conoces." },
  { m: "preocupada", t: "Que es cómodo, porque no puedes decepcionar a nadie desde la grada." },
  { m: "blush", t: "Y ahora resulta que voy a estar nerviosa por un partido." },
  { m: "angry", t: "¡Nerviosa por el resultado!" },
  { m: "angry", t: "…" },
  { m: "blush", t: "No. Nerviosa por ti." },
  { m: "angry", t: "¡Como experiencia futbolística!" },
  { m: "idle", t: "…Eso ni siquiera significa nada. Ya ni lo intento." },
];
const YUNA_C9_INTRO = [
  { m: "idle", t: "Cuatro días y una victoria." },
  { m: "blush", t: "Y sí, los miré todos. Uno por uno, según se iban cerrando." },
  { m: "angry", t: "Funcionó, por cierto. Lo del número que sube." },
  { m: "blush", t: "Que sigue siendo un mecanismo horrible, pero funcionó." },
  { m: "blush", t: "Esto es raro. Estar aquí es raro." },
  { m: "idle", t: "No suelo ir a casa de nadie. No es una frase hecha, es que literalmente no lo hago." },
  { m: "preocupada", t: "Pero quería hablar contigo sin que hubiera gente alrededor y sin que hubiera un partido de por medio." },
  { m: "idle", t: "He traído la caja. No sé por qué. Sí sé por qué." },
  { m: "blush", t: "Ábrela." },
  { m: "idle", t: "…" },
  { m: "blush", t: "Ahí está la entrada del estadio. Y la foto, impresa, que ya sé que es de abuela pero me da igual." },
  { m: "preocupada", t: "Y una servilleta de la cafetería de al lado de tu campo, del día que ganasteis 3-1 y yo me quedé fuera esperando media hora porque no sabía si te ibas a molestar si entraba." },
  { m: "angry", t: "Esa no la habías visto. Ahora ya la has visto. Ya está." },
  { m: "idle", t: "El caso es que abrí la caja el jueves para meter una cosa y me quedé mirándola." },
  { m: "preocupada", t: "Y me di cuenta de que ya no la abro para recordar." },
  { m: "preocupada", t: "La abro para comprobar." },
  { m: "blush", t: "Para comprobar que esto está pasando de verdad y que no me lo estoy inventando." },
  { m: "idle", t: "Y eso es distinto. Eso ya no es coleccionar." },
  { m: "blush", t: "Últimamente me pongo nerviosa contigo por cosas que antes no me ponían nerviosa." },
  { m: "blush", t: "Cuando me escribes. Cuando te veo después de un partido. Cuando me acuerdo de algo que dijiste hace tres semanas." },
  { m: "preocupada", t: "Y me da miedo decirlo y que después todo cambie." },
  { m: "idle", t: "Porque ahora mismo me gusta cómo estamos." },
  { m: "blush", t: "Me gusta hablar contigo." },
  { m: "preocupada", t: "Me gusta estar contigo." },
  YUNA_C9_AFF_MARKER,
  { m: "blush", t: "Y creo que quizá me gustas tú." },
  { m: "angry", t: "…Quizá." },
  { m: "blush", t: "Gracias por no reírte." },
  { m: "suave", t: "Y no necesito que me contestes hoy. En serio." },
  { m: "idle", t: "Solo quería que supieras que detrás de todas mis excusas había algo de verdad." },
  { m: "idle", t: "…" },
  { m: "blush", t: "Y ahora, si no te importa, vamos a hablar de otra cosa antes de que me muera." },
  { m: "idle", t: "Quiero verte mejorar. En serio, no como excusa: quiero ver ese número subir." },
  { m: "blush", t: "Porque si esto sale mal, al menos quiero haber estado aquí en el año en que empezaste a ser bueno de verdad." },
  { m: "angry", t: "…Eso ha sido muy dramático. Ignóralo." },
  { m: "idle", t: "Sube tu media. Y cinco días seguidos, que ya sé que puedes." },
];
const YUNA_C13_INTRO = [
  { m: "happy", t: "Me avisaste." },
  { m: "blush", t: "Once minutos después del pitido final. Los conté." },
  { m: "angry", t: "No porque estuviera mirando el reloj. Bueno. Sí." },
  { m: "suave", t: "Fue lo mejor de la semana, para que lo sepas. Más que el resultado." },
  { m: "blush", t: "Tengo algo que decirte." },
  { m: "idle", t: "Y esta vez no es sobre el Barça. Ni sobre tus estadísticas. Ni sobre el partido del domingo." },
  { m: "blush", t: "Me gustas." },
  { m: "angry", t: "Mucho." },
  { m: "blush", t: "Y me da una vergüenza tremenda decirlo así, sin nada delante." },
  { m: "idle", t: "Porque llevo meses buscando excusas para estar cerca de ti. Y me las sé todas de memoria." },
  { m: "idle", t: "La primera fueron los datos. Que quería comprobar si el gol había sido casualidad." },
  { m: "idle", t: "La segunda fue que estaba comparando materiales en una tienda." },
  { m: "blush", t: "La tercera fue que había una bufanda de más, que es de las peores mentiras que he dicho en mi vida." },
  { m: "idle", t: "La cuarta fue que me gusta guardar cosas." },
  { m: "blush", t: "La quinta fue una pregunta hipotética que no tenía absolutamente nada de hipotética." },
  { m: "idle", t: "La sexta fue «como experiencia futbolística», que ni siquiera significa nada." },
  { m: "blush", t: "La séptima fue que la foto era del partido." },
  { m: "angry", t: "La octava fue que no estaba celosa. Esa fue especialmente mala." },
  { m: "idle", t: "…" },
  { m: "enamorada", t: "Y en algún momento entre la séptima y la octava me di cuenta de que ya no necesitaba ninguna." },
  { m: "blush", t: "Que quería verte porque eras tú. Sin partido, sin caja, sin número que comprobar." },
  { m: "enamorada", t: "Y quiero seguir estando contigo." },
  { m: "angry", t: "Así que ya está. Lo he dicho." },
  { m: "blush", t: "Y no me pienso corregir esta vez." },
  YUNA_C13_AFF_MARKER,
  { m: "enamorada", t: "No sé qué va a pasar ahora. En serio, no tengo ni idea y eso no me suele pasar." },
  { m: "blush", t: "Pero por primera vez no quiero esconderme." },
  { m: "enamorada", t: "Quiero descubrirlo contigo." },
  { m: "idle", t: "…" },
  { m: "happy", t: "Y ahora una cosa práctica, porque si seguimos así me da algo." },
  { m: "idle", t: "Quiero verte en Primera." },
  { m: "angry", t: "Sí, en Primera. Lo he dicho." },
  { m: "blush", t: "Llevo desde el primer día pensando que llegarías y no te lo he dicho nunca porque me parecía demasiado." },
  { m: "enamorada", t: "Pues ya no me parece demasiado." },
  { m: "idle", t: "Llega ahí. Y llega con seis días encadenados, porque no quiero verte llegar roto." },
];

const YUNA_STORY = {
  npc: "yuna",
  chapters: [{
    id: "cap1",
    title: "El primer gol",
    trigger: (g) => careerGoals(g) >= 1,
    stages: [
      /* PRÓLOGO — El primer gol (rework 3.0, ver FUTABITA_Yuna_Rework_3.0.docx).
         CORRECCIÓN RESPECTO A 2.0: el objetivo del prólogo NO es "marca tu primer gol" —
         Yuna aparece precisamente PORQUE ya lo vio marcar (ver el trigger del capítulo,
         careerGoals(g) >= 1). Esa condición se cumpliría en el instante cero si fuera
         también el objetivo. El objetivo real del prólogo es el SEGUNDO gol, que es
         exactamente lo que ella pide en voz alta al final de la escena. */
      { title: "El primer gol", zone: "barrio",
        objective: "Marca otro gol.",
        intro: [
          { m: "idle", t: "Eh. Tú eres el nuevo del {club}, ¿no?" },
          { m: "angry", t: "No pongas esa cara. No te estaba esperando." },
          { m: "idle", t: "Estaba aquí. Que es distinto." },
          { m: "barcelona", t: "Vale, antes de nada, para que no haya malentendidos luego: soy del Barça. Mucho. No un poco. Mucho." },
          { m: "barcelona", t: "Si eso te supone un problema, mejor lo sabemos ya." },
          { m: "idle", t: "Segundo. He visto tu gol." },
          { m: "idle", t: "Minuto setenta y uno. Te la dejaron atrás, mal, con efecto, y en vez de pararla la enganchaste de primeras." },
          { m: "angry", t: "Y estuvo bien. Bastante bien." },
          { m: "angry", t: "Pero no te emociones, porque no he venido por eso." },
          { m: "idle", t: "Es que hay una cosa que me molesta." },
          { m: "idle", t: "Cuando alguien hace algo así, normalmente es porque lo ha hecho mil veces antes y le sale solo." },
          { m: "idle", t: "Y tú no. Tú te sorprendiste." },
          { m: "idle", t: "Te vi la cara. Te sorprendiste igual que el portero." },
          { m: "blush", t: "Y llevo desde el domingo dándole vueltas a si eso significa que tuviste suerte…" },
          { m: "blush", t: "…o que todavía no sabes de lo que eres capaz." },
          { m: "angry", t: "¡Que es una duda estadística!" },
          { m: "angry", t: "Una duda estadística totalmente normal." },
          { m: "idle", t: "Total. Que tengo una duda y no me gusta tener dudas." },
          { m: "idle", t: "Así que vas a hacer algo muy fácil." },
          { m: "idle", t: "Vas a volver a marcar." },
          { m: "angry", t: "No mañana. No hace falta que sea mañana. Cuando puedas." },
          { m: "idle", t: "Pero vuelve a marcar, y así compruebo si aquello fue una casualidad o si de verdad hay algo ahí." },
          { m: "blush", t: "Y entonces… bueno. Entonces quizá vuelva a mirar tus números." },
          { m: "angry", t: "¡Por motivos estadísticos!" },
        ],
        replies: [
          { t: "¿Y tú quién eres?", m: "idle",
            r: [{ m: "idle", t: "Yuna." }, { m: "angry", t: "Y no, no soy periodista, ni ojeadora, ni nada de eso." },
              { m: "blush", t: "Soy alguien que ve muchos partidos." },
              { m: "angry", t: "Demasiados, dice mi madre. Pero eso no es asunto tuyo." }] },
          { t: "Tuve suerte.", m: "idle",
            r: [{ m: "angry", t: "Ya. Eso dicen todos." },
              { m: "idle", t: "El problema es que la suerte no se repite y tú vas a jugar otra vez el domingo." },
              { m: "blush", t: "Así que ya veremos." }] },
          { t: "¿Estuviste en el campo?", m: "idle",
            r: [{ m: "blush", t: "…" }, { m: "angry", t: "¡Estaba de paso!" },
              { m: "idle", t: "Vivo a cuatro calles. Se oye desde el balcón." },
              { m: "blush", t: "…Vale, sí. Estaba en la grada. Pero de pie, al final, que eso casi no cuenta." }] },
        ],
        setFlags: ["yunaMet"],
        snap: (g) => ({ since: todayStr(), matchCount: (g.matchHistory || []).length }),
        subs: [
          (g, s) => (g.matchHistory || []).slice(s.matchCount).reduce((a, m) => a + (m.myGoals || 0), 0) >= 1,
        ],
        check: (g, s) => (g.matchHistory || []).slice(s.matchCount).reduce((a, m) => a + (m.myGoals || 0), 0) >= 1 },
      /* CAPÍTULO 1 — Motivos estadísticos */
      { title: "Motivos estadísticos", zone: "barrio",
        objective: "Juega un partido y consigue una victoria o un gol.",
        intro: [
          { m: "idle", t: "Has vuelto a marcar." },
          { m: "idle", t: "Minuto treinta y cuatro. De cabeza, en el segundo palo, y saliste antes que el central." },
          { m: "angry", t: "No lo he visto en repetición, lo vi en directo. Que conste." },
          { m: "blush", t: "…Vale, también en repetición. Dos veces." },
          { m: "angry", t: "¡Para comprobar el salto!" },
          { m: "idle", t: "Bueno. Pues ya está. Duda resuelta. No fue casualidad." },
          { m: "idle", t: "…" },
          { m: "blush", t: "El problema es que ahora tengo una duda nueva." },
          { m: "idle", t: "Porque he estado mirando tus números otra vez. Los de esta temporada y los del año pasado." },
          { m: "angry", t: "Que se pueden mirar. Son públicos. No he hecho nada raro." },
          { m: "idle", t: "Y hay algo que no cuadra." },
          { m: "idle", t: "Marcas más de lo que deberías para los minutos que juegas. Bastante más." },
          { m: "idle", t: "Eso normalmente significa una de dos cosas: o estás rindiendo por encima de tu nivel y en tres meses se te acaba…" },
          { m: "blush", t: "…o estás mejorando ahora mismo, mientras hablamos, y los números todavía no se han enterado." },
          { m: "angry", t: "Y no sé cuál de las dos es. Y me está poniendo de los nervios." },
          { m: "idle", t: "Porque si es la primera, dentro de un mes dejo de mirar y no pasa nada." },
          { m: "blush", t: "Y si es la segunda…" },
          { m: "blush", t: "…entonces esto se va a poner interesante." },
          { m: "angry", t: "¡El análisis! El análisis se va a poner interesante." },
          { m: "idle", t: "Así que, para salir de dudas, necesito un partido más." },
          { m: "idle", t: "Uno entero. No diez minutos al final cuando ya está todo decidido." },
          { m: "angry", t: "Uno entero de verdad, quiero decir. Que si te sientan a los sesenta ya no me sirve." },
          { m: "idle", t: "Y quiero que salga algo de ahí. Una victoria o un gol, me da igual cuál." },
          { m: "blush", t: "Porque si sale, ya no será una racha rara. Será una tendencia." },
          { m: "angry", t: "Y las tendencias sí que se pueden seguir sin que nadie diga nada." },
          { m: "happy", t: "Legalmente. Estadísticamente. Con total normalidad." },
        ],
        replies: [
          { t: "Estoy mejorando.", m: "idle",
            r: [{ m: "idle", t: "Eso lo dice todo el mundo." },
              { m: "blush", t: "Pero tú lo has dicho sin pensarlo, así que quizá sea verdad." },
              { m: "angry", t: "No es un cumplido. Es una observación." }] },
          { t: "Tú sabes más de mí que yo.", m: "idle",
            r: [{ m: "blush", t: "…" }, { m: "angry", t: "¡Eso es porque tú no te miras y yo sí!" },
              { m: "angry", t: "…" }, { m: "blush", t: "Eso ha sonado fatal. Olvídalo." }] },
          { t: "¿Y si me dejo de importar?", m: "idle",
            r: [{ m: "idle", t: "Entonces dejo de mirar y ya está." },
              { m: "idle", t: "No sería la primera cosa que dejo atrás." },
              { m: "blush", t: "…Aunque preferiría que no." }] },
        ],
        snap: (g) => ({ since: todayStr(), matchCount: (g.matchHistory || []).length }),
        subs: [
          (g, s) => (g.matchHistory || []).slice(s.matchCount).length >= 1,
          (g, s) => (g.matchHistory || []).slice(s.matchCount).some((m) => m.res === "V" || (m.myGoals || 0) >= 1),
        ],
        check: (g, s) => (g.matchHistory || []).slice(s.matchCount).some((m) => m.res === "V" || (m.myGoals || 0) >= 1) },
      /* CAPÍTULO 2 — La tienda. CAMBIO RESPECTO A 2.0: el objetivo pedía visitar la tienda,
         que es la propia zona de la etapa (se cumpliría en el instante cero); se sustituye
         por una compra real registrada en cocoLog — usando el mismo patrón por fecha
         (e.day >= since) que ya usan el resto de misiones de Coco en este archivo, no el
         recuento por índice que proponía el documento. */
      { title: "La tienda", zone: "tienda",
        objective: "Compra algo en la tienda y consigue una victoria.",
        intro: [
          { m: "happy", t: "Ganado. Y con gol." },
          { m: "idle", t: "Los dos a la vez. No hacía falta que fueran los dos a la vez." },
          { m: "blush", t: "Pero bueno. Ya no es una racha rara." },
          { m: "angry", t: "Es una tendencia. Como dije. Que conste que lo dije yo primero." },
          { m: "barcelona", t: "No digas nada." },
          { m: "barcelona", t: "Estoy comparando materiales." },
          { m: "idle", t: "El tejido de esta temporada es mejor que el del año pasado. Más fino, pero abriga igual." },
          { m: "barcelona", t: "Y la costura del cuello ya no raspa, que era un escándalo." },
          { m: "angry", t: "¡Y no estoy comprando nada para ti!" },
          { m: "idle", t: "…" },
          { m: "idle", t: "¿Sabes lo que pasa con las tiendas de estas?" },
          { m: "idle", t: "Que todo el mundo entra pensando que viene a comprar ropa. Y no." },
          { m: "barcelona", t: "Vienes a comprar una prueba." },
          { m: "idle", t: "Una prueba de que estuviste ahí ese año. De que ese equipo, esa temporada, esa camiseta con ese patrocinador horrible, existieron y tú estabas delante." },
          { m: "blush", t: "Yo tengo bastantes pruebas." },
          { m: "angry", t: "No es una colección. Es… un archivo." },
          { m: "blush", t: "Un archivo grande." },
          { m: "idle", t: "En fin. Voy a mirar unas cosas." },
          { m: "angry", t: "Tú también puedes mirar. Pero no pienses ni por un segundo que hemos venido juntos." },
          { m: "idle", t: "Ah. Y ya que estamos aquí, vas a hacer una cosa." },
          { m: "idle", t: "Vas a comprarte algo. Lo que sea. Aquí o donde quieras, me da igual." },
          { m: "angry", t: "No para mí. Para ti." },
          { m: "blush", t: "Porque me parece fatal que lleves media temporada jugando y no tengas ni una sola cosa que demuestre que ha pasado." },
          { m: "idle", t: "Y luego gana el siguiente partido." },
          { m: "blush", t: "Así, cuando lo mires dentro de unos años, sabrás exactamente de qué semana era." },
          { m: "angry", t: "¡Es organización! No es sentimental. Es organización." },
        ],
        replies: [
          { t: "¿Cuántas cosas guardas?", m: "idle",
            r: [{ m: "blush", t: "…Muchas." }, { m: "angry", t: "No te voy a dar un número." },
              { m: "idle", t: "Pero si algún día lo ves, no te rías." },
              { m: "blush", t: "En serio. No te rías." }] },
          { t: "Yo no tengo nada de mis partidos.", m: "idle",
            r: [{ m: "angry", t: "¿Nada?" }, { m: "angry", t: "¿Ni una camiseta? ¿Ni un balón? ¿Nada?" },
              { m: "preocupada", t: "…Eso me parece muy triste, la verdad." },
              { m: "blush", t: "Habrá que arreglarlo." }] },
          { t: "Esa camiseta te quedaría bien.", m: "happy",
            r: [{ m: "blush", t: "…" }, { m: "angry", t: "¡Estamos hablando de materiales!" },
              { m: "blush", t: "…Gracias." },
              { m: "angry", t: "¡Eso no era un gracias! Era… una confirmación." }] },
        ],
        snap: (g) => ({ since: todayStr(), matchCount: (g.matchHistory || []).length }),
        subs: [
          (g, s) => (g.cocoLog || []).some((e) => e.type === "buy" && e.day >= s.since),
          (g, s) => (g.matchHistory || []).slice(s.matchCount).some((m) => m.res === "V"),
        ],
        check: (g, s) => (g.cocoLog || []).some((e) => e.type === "buy" && e.day >= s.since) &&
          (g.matchHistory || []).slice(s.matchCount).some((m) => m.res === "V") },
      /* CAPÍTULO 3 — La bufanda equivocada. Primer objeto de la campaña (el más citado
         después: C9, C12, C13, Final, Epílogo). Revelado a mitad de escena: ver
         stage.midReveal/introBefore/introAfter y la nota de queueStageScene. */
      { title: "La bufanda equivocada", zone: "barrio",
        objective: "Cierra 3 días de objetivos y marca un gol.",
        introBefore: [
          { m: "happy", t: "Ya tienes una cosa. Bien." },
          { m: "idle", t: "Y ganasteis, además, así que esa cosa ya tiene fecha." },
          { m: "blush", t: "Guárdala en algún sitio donde no se pierda. No la metas en un cajón cualquiera." },
          { m: "angry", t: "Los cajones cualquiera son donde mueren los recuerdos. Es un hecho." },
          { m: "idle", t: "Toma." },
          { m: "blush", t: "Es una bufanda." },
          { m: "angry", t: "Y no significa nada." },
          { m: "idle", t: "Había una de más." },
          { m: "idle", t: "…" },
          { m: "blush", t: "Vale, eso es mentira. No había una de más." },
          { m: "angry", t: "¡Pero tampoco es lo que estás pensando!" },
          { m: "idle", t: "Es que el sábado hacía un frío horrible y tú estabas en la banda con la chaqueta abierta como un idiota." },
          { m: "angry", t: "Y me pasé todo el segundo tiempo pensando en eso en lugar de ver el partido." },
          { m: "blush", t: "Y me molestó. Me molestó bastante." },
          { m: "idle", t: "Porque yo veo partidos. No me preocupo por la gente que está en el campo. Eso no lo hago." },
          { m: "blush", t: "Y el sábado sí." },
          { m: "angry", t: "Así que la bufanda es para que no vuelva a pasar." },
          { m: "angry", t: "Por mí. Es un regalo egoísta. Que quede claro." },
          { m: "blush", t: "Póntela. No, ahora no, no hace falta que…" },
          { m: "angry", t: "…" },
          { m: "blush", t: "…Bueno. Te queda bien." },
          { m: "angry", t: "¡Le queda bien a todo el mundo! ¡Es una bufanda!" },
        ],
        introAfter: [
          { m: "idle", t: "Bueno. Cambiando de tema, que llevo demasiado rato hablando de lana." },
          { m: "idle", t: "Quiero verte marcar otra vez. Pero esta vez con condiciones." },
          { m: "blush", t: "Porque he estado pensando y me he dado cuenta de una cosa un poco tonta." },
          { m: "idle", t: "Yo solo te veo los domingos. Noventa minutos cada siete días." },
          { m: "idle", t: "Y el resto de la semana, que es donde está casi toda tu vida, no la ve nadie." },
          { m: "angry", t: "Y eso me parece un fallo de muestreo enorme." },
          { m: "idle", t: "Así que quiero tres días bien hechos. De esos que no salen en ningún sitio." },
          { m: "blush", t: "Y luego un gol. Para que yo pueda ver el resultado de algo que no vi." },
        ],
        replies: [
          { t: "Gracias, Yuna.", m: "happy",
            r: [{ m: "blush", t: "…" }, { m: "angry", t: "No hagas eso." },
              { m: "idle", t: "Lo de decir mi nombre. No lo hagas." },
              { m: "blush", t: "Me descoloca." }] },
          { t: "¿Es de tu equipo?", m: "idle",
            r: [{ m: "barcelona", t: "Obviamente." }, { m: "angry", t: "No pensarías que te iba a regalar la de otro." },
              { m: "happy", t: "Y ahora vas por la calle con mis colores. Piénsalo." },
              { m: "blush", t: "…No lo pienses mucho." }] },
          { t: "No tenías que hacerlo.", m: "idle",
            r: [{ m: "angry", t: "Ya sé que no tenía que hacerlo." },
              { m: "idle", t: "Ese es justo el problema." },
              { m: "blush", t: "Las cosas que hay que hacer no me quitan el sueño." }] },
        ],
        setFlags: ["yunaFirstGift"],
        midReveal: "yuna_bufanda",
        snap: (g) => ({ since: todayStr(), matchCount: (g.matchHistory || []).length }),
        subs: [
          { count: (g, s) => daysGoalsCompletedSince(g, s.since), goal: 3 },
          (g, s) => (g.matchHistory || []).slice(s.matchCount).reduce((a, m) => a + (m.myGoals || 0), 0) >= 1,
        ],
        check: (g, s) => daysGoalsCompletedSince(g, s.since) >= 3 &&
          (g.matchHistory || []).slice(s.matchCount).reduce((a, m) => a + (m.myGoals || 0), 0) >= 1 },
      /* CAPÍTULO 4 — La caja. Capítulo clave: la caja es un PROP (nunca grantItem, nunca
         entra al inventario), origen del personaje y soporte de C8/C9/C12. */
      { title: "La caja", zone: "parque",
        objective: "Consigue una victoria con una racha de 3 días.",
        intro: [
          { m: "happy", t: "Tres días y un gol." },
          { m: "blush", t: "Y lo de los tres días me ha gustado más, aunque no lo vi." },
          { m: "idle", t: "Es raro alegrarse por algo que no has visto. No me había pasado nunca." },
          { m: "angry", t: "Y no lo digas en voz alta." },
          { m: "idle", t: "He traído una cosa. No te asustes." },
          { m: "blush", t: "Esto es una caja de zapatos." },
          { m: "angry", t: "Ya sé que es una caja de zapatos. No hace falta que pongas esa cara." },
          { m: "barcelona", t: "Tiene una pegatina del Barça medio despegada porque la puse yo con nueve años y no sabía poner pegatinas." },
          { m: "idle", t: "Ábrela si quieres. No hay nada raro dentro." },
          { m: "idle", t: "Entradas. Bastantes. Una pulsera de un partido de Champions. Un recorte de periódico. Cuatro llaveros feísimos." },
          { m: "blush", t: "Y una servilleta, sí. No preguntes por la servilleta." },
          { m: "idle", t: "¿Sabes por qué guardo todo esto?" },
          { m: "idle", t: "Nos mudamos mucho cuando era pequeña. Seis ciudades antes de los quince." },
          { m: "idle", t: "Cada año un colegio nuevo, una casa nueva y gente nueva que no se iba a acordar de mí en junio." },
          { m: "preocupada", t: "Al final aprendes a no deshacer del todo las maletas. Es más cómodo." },
          { m: "barcelona", t: "Y el fútbol era lo único que venía conmigo." },
          { m: "barcelona", t: "Da igual la ciudad: el domingo a la misma hora, la misma camiseta, las mismas voces en la radio." },
          { m: "blush", t: "Así que empecé a guardar cosas." },
          { m: "idle", t: "Porque una entrada es una prueba. Demuestra que ese día existió y que yo estaba delante." },
          { m: "preocupada", t: "Y si no guardas pruebas, un día miras atrás y no hay nada." },
          { m: "angry", t: "…" },
          { m: "blush", t: "Vale, eso ha sido mucho más intenso de lo que pretendía." },
          { m: "angry", t: "Olvida la mitad. La mitad que tú quieras." },
          { m: "idle", t: "El caso es que hay un problema con la caja." },
          { m: "blush", t: "Y es que todo lo que hay dentro es de partidos que vi desde la grada." },
          { m: "idle", t: "Ninguna de esas cosas es de alguien que conozco." },
          { m: "blush", t: "Y me apetece que haya una." },
          { m: "angry", t: "¡No he dicho tuya!" },
          { m: "angry", t: "…" },
          { m: "blush", t: "Bueno. Sí. He dicho tuya." },
          { m: "idle", t: "Así que gana un partido. Uno de verdad, no un empate maquillado." },
          { m: "idle", t: "Y llega a ese partido con tres días encadenados, que ya sé que no lo voy a ver pero quiero que estén ahí." },
          { m: "blush", t: "Y entonces guardo algo de ese día." },
          { m: "happy", t: "Y ya no será una caja de desconocidos." },
        ],
        replies: [
          { t: "Yo me acordaría de ti.", m: "happy",
            r: [{ m: "blush", t: "…" }, { m: "angry", t: "Eso no lo puedes saber." },
              { m: "idle", t: "Todo el mundo dice eso en septiembre." },
              { m: "blush", t: "…Pero gracias por decirlo igual." }] },
          { t: "¿Qué es lo más antiguo que hay ahí?", m: "idle",
            r: [{ m: "happy", t: "Una entrada de 2010. Fui con mi padre." },
              { m: "idle", t: "No me acuerdo del resultado." },
              { m: "blush", t: "Me acuerdo de que llovía y de que me dejó su chaqueta." },
              { m: "idle", t: "Ya ves. Al final nunca te acuerdas del marcador." }] },
          { t: "Enséñame la servilleta.", m: "idle",
            r: [{ m: "angry", t: "¡No!" }, { m: "blush", t: "…" }, { m: "angry", t: "Otro día." },
              { m: "happy", t: "Y no es tan interesante como te crees." }] },
        ],
        setFlags: ["yunaCaja"],
        snap: (g) => ({ since: todayStr(), matchCount: (g.matchHistory || []).length }),
        subs: [
          (g, s) => (g.matchHistory || []).slice(s.matchCount).some((m) => m.res === "V"),
          { count: (g) => g.player.streak || 0, goal: 3 },
        ],
        check: (g, s) => (g.matchHistory || []).slice(s.matchCount).some((m) => m.res === "V") &&
          (g.player.streak || 0) >= 3 },
      /* CAPÍTULO 5 — La pregunta hipotética. Decisión con flag permanente de afinidad
         (convergente: no bloquea contenido, solo cambia tono en C6/C9/C13). Añadido un
         objetivo ligero (opción principal del documento) para respetar la estructura de
         cuatro bloques sin encadenar dos escenas seguidas sin misión. */
      { title: "La pregunta hipotética", zone: "barrio",
        objective: "Gana un partido con nota de 7.0 o más y cierra 2 días de objetivos.",
        intro: [
          { m: "happy", t: "Ganado. Y con la racha entera." },
          { m: "blush", t: "Ya tengo la entrada de ese partido en la caja. La primera de alguien que conozco." },
          { m: "angry", t: "No la he puesto arriba del todo ni nada. Está donde toca, por fecha." },
          { m: "blush", t: "…Está arriba del todo." },
          { m: "idle", t: "Tengo una pregunta. Y es hipotética." },
          { m: "angry", t: "Hipotética de verdad. No de las que dice la gente para preguntar por sí misma." },
          { m: "idle", t: "Imagina que hay alguien que ve todos tus partidos." },
          { m: "idle", t: "Que se acuerda de los minutos. Que sabe en qué jornada fallaste aquel penalti y a qué portero." },
          { m: "blush", t: "Que empezó mirando por curiosidad y ahora los domingos no queda con nadie por si acaso hay partido." },
          { m: "preocupada", t: "Y que se acuerda de cosas de ti que tú ni sabes que has hecho." },
          { m: "blush", t: "…¿Te parecería raro?" },
          { m: "angry", t: "Y no estoy hablando de mí. Estoy preguntando en general." },
          { m: "idle", t: "Porque yo creo que depende." },
          { m: "idle", t: "Si esa persona solo quiere saber cosas sobre ti, para acumularlas, entonces sí. Es raro y da un poco de miedo." },
          { m: "blush", t: "Pero si esa persona empezó mirando un gol y acabó queriendo saber si el día que lo marcó había dormido bien…" },
          { m: "blush", t: "…entonces ya no está mirando a un jugador." },
          { m: "angry", t: "¡Da igual! ¡Es hipotético!" },
          { m: "preocupada", t: "Pero contéstame igual. Porque llevo semanas dándole vueltas y necesito saberlo." },
          { m: "idle", t: "Bueno. Da igual. Olvídalo." },
          { m: "blush", t: "Aunque ya que estamos, hay algo que sí quiero comprobar." },
          { m: "idle", t: "Llevo meses mirándote jugar y siempre desde fuera. Y desde fuera es fácil opinar." },
          { m: "idle", t: "Quiero verte hacer un partido bueno de verdad. No un gol suelto en una tarde mala." },
          { m: "idle", t: "Un partido ganado y bien jugado, con nota." },
          { m: "blush", t: "Y dos días cuidándote antes, que ya sabes que es la parte que no veo." },
          { m: "angry", t: "Y no es para nada personal. Es para cerrar el análisis." },
          { m: "blush", t: "…El análisis lleva cerrado bastante tiempo, si te soy sincera." },
        ],
        replies: [
          { t: "Me parecería bonito.", m: "blush", setFlag: "yunaAff_calido",
            r: [{ m: "blush", t: "…" }, { m: "angry", t: "¿B-bonito?" },
              { m: "blush", t: "Nadie dice «bonito». La gente dice «intenso», o «un poco mucho»." },
              { m: "blush", t: "Tú has dicho bonito." },
              { m: "angry", t: "…Vale. Pues nada. Pregunta contestada. Ya me puedo ir." },
              { m: "happy", t: "No me voy a ir." }] },
          { t: "Me daría un poco de miedo.", m: "preocupada", setFlag: "yunaAff_cauto",
            r: [{ m: "angry", t: "¡Exacto!" }, { m: "angry", t: "Eso mismo pensaba yo. Exactamente eso." },
              { m: "idle", t: "…" }, { m: "preocupada", t: "Ya. Bueno." },
              { m: "blush", t: "Entonces esa persona hipotética tendrá que ir más despacio, supongo." },
              { m: "angry", t: "Que es lo que iba a hacer de todas formas." }] },
          { t: "Depende de quién fuera.", m: "idle", setFlag: "yunaAff_curioso",
            r: [{ m: "blush", t: "…" }, { m: "idle", t: "Vaya. Esa es una respuesta lista." },
              { m: "blush", t: "¿Y si fuera alguien que ya conoces?" },
              { m: "angry", t: "…" }, { m: "angry", t: "¡No contestes! Era retórica. Esa sí era retórica." }] },
        ],
        setFlags: ["yunaHipotetica"],
        snap: (g) => ({ since: todayStr(), matchCount: (g.matchHistory || []).length }),
        subs: [
          (g, s) => (g.matchHistory || []).slice(s.matchCount).some((m) => m.res === "V" && (m.rating || 0) >= 7.0),
          { count: (g, s) => daysGoalsCompletedSince(g, s.since), goal: 2 },
        ],
        check: (g, s) => (g.matchHistory || []).slice(s.matchCount).some((m) => m.res === "V" && (m.rating || 0) >= 7.0) &&
          daysGoalsCompletedSince(g, s.since) >= 2 },
      /* CAPÍTULO 6 — El estadio. Primer objeto entregado en un estadio real (entrada);
         revelado a mitad de escena. La línea de afinidad se sustituye vía introBuild
         (ver YUNA_C6_INTRO/YUNA_C6_AFF_LINE arriba). */
      { title: "El estadio", zone: "estadio",
        objective: "Gana el partido o participa en un gol marcando o asistiendo.",
        introBefore: YUNA_C6_INTRO,
        introBuild: (g) => {
          const aff = yunaAffOf(g);
          if (!aff) return null;
          return YUNA_C6_INTRO.map((b) => b === YUNA_C6_AFF_LINE ? YUNA_C6_AFF_LINES[aff] : b);
        },
        introAfter: [
          { m: "barcelona", t: "Ah. Antes de que se me olvide y luego me arrepienta toda la semana." },
          { m: "idle", t: "Las entradas. Las tengo yo porque tú las habrías perdido, no me mires así." },
          { m: "blush", t: "Toma. La tuya." },
          { m: "angry", t: "No es un regalo. Es literalmente tu entrada. Es tuya. Te la estoy devolviendo." },
          { m: "blush", t: "Yo me quedo la mía." },
          { m: "idle", t: "Guárdala en un sitio decente. Y no en el bolsillo del pantalón, que luego pasan por la lavadora y se acabó." },
          { m: "idle", t: "Bueno. Ya está. Fuera nervios." },
          { m: "idle", t: "Solo quiero una cosa de este partido y no es que sea perfecto." },
          { m: "blush", t: "Quiero que pase algo." },
          { m: "idle", t: "Una victoria. O un gol tuyo. O una asistencia. Cualquier cosa que haga que este día tenga un dato dentro." },
          { m: "preocupada", t: "Porque una entrada de un cero a cero aburrido no la mira nadie dentro de diez años." },
          { m: "blush", t: "Y yo esta la voy a mirar." },
          { m: "angry", t: "…Bastantes veces, probablemente." },
        ],
        replies: [
          { t: "Podrías haberte quedado las dos.", m: "idle",
            r: [{ m: "blush", t: "…Ya." }, { m: "angry", t: "Lo he pensado." },
              { m: "idle", t: "Pero entonces sería una prueba de que yo estuve aquí." },
              { m: "blush", t: "Y quiero que sea una prueba de que estuvimos los dos." }] },
          { t: "¿Estás nerviosa de verdad?", m: "idle",
            r: [{ m: "angry", t: "No." }, { m: "angry", t: "…" }, { m: "blush", t: "Sí." },
              { m: "blush", t: "Y es horrible. No sé cómo lo aguantáis todos los domingos." }] },
          { t: "Voy a marcar para ti.", m: "happy",
            r: [{ m: "blush", t: "…" }, { m: "angry", t: "¡No digas eso!" },
              { m: "angry", t: "Ahora si no marcas voy a pensar que es culpa mía." },
              { m: "happy", t: "…Márcalo igual." }] },
        ],
        setFlags: ["yunaCampNou"],
        midReveal: "yuna_entrada",
        snap: (g) => ({ since: todayStr(), matchCount: (g.matchHistory || []).length }),
        subs: [
          (g, s) => (g.matchHistory || []).slice(s.matchCount).some((m) => m.res === "V" || (m.myGoals || 0) + (m.myAssists || 0) >= 1),
        ],
        check: (g, s) => (g.matchHistory || []).slice(s.matchCount).some((m) => m.res === "V" || (m.myGoals || 0) + (m.myAssists || 0) >= 1) },
      /* CAPÍTULO 7 — La foto. CAMBIO RESPECTO A 2.0: el objetivo "completa el partido y
         visita la zona de cierre del Estadio" no es expresable con las variables del motor
         y reutilizaba la propia zona de la etapa; se sustituye por victoria + racha, motivo
         que además da pie a la foto buena que ella promete al final. */
      { title: "La foto", zone: "estadio",
        objective: "Consigue una victoria y mantén una racha de 3 días.",
        introBefore: [
          { m: "happy", t: "Lo conseguiste." },
          { m: "blush", t: "Y yo estaba aquí. En este estadio, no en el sofá de mi casa." },
          { m: "idle", t: "Es distinto. Te lo juro que es distinto y no sabía que lo era." },
          { m: "angry", t: "No me hagas explicarlo porque no sé y voy a quedar fatal." },
          { m: "happy", t: "Espera. Espera, no te vayas todavía." },
          { m: "blush", t: "¿Nos hacemos una foto?" },
          { m: "angry", t: "¡Para mí! Para… para el partido. Para acordarme del partido." },
          { m: "idle", t: "La entrada está bien, pero una entrada es un papel con un número." },
          { m: "idle", t: "Te dice que estuviste. No te dice cómo fue." },
          { m: "blush", t: "Y hoy quiero acordarme de cómo fue." },
          { m: "idle", t: "Del ruido cuando entrasteis. De que hacía más calor del que parecía. De que la señora de mi lado no se sentó ni un minuto." },
          { m: "blush", t: "Y de nosotros." },
          { m: "angry", t: "¡No he dicho «nosotros» en ese sentido!" },
          { m: "angry", t: "…" },
          { m: "blush", t: "Bueno. Lo he dicho en ese sentido." },
          { m: "preocupada", t: "Es que hay un problema con la caja, ¿sabes?" },
          { m: "preocupada", t: "Todo lo que hay dentro son cosas. Papeles, telas, plástico." },
          { m: "blush", t: "Y las cosas te dicen que algo pasó, pero no te devuelven la cara que tenías ese día." },
          { m: "blush", t: "Y esa es la parte que se me olvida primero. Siempre." },
          { m: "happy", t: "Vale. Ven. Un poco más cerca, que si no sale medio estadio y no salimos nosotros." },
          { m: "angry", t: "No tan cerca." },
          { m: "blush", t: "…Bueno. Así." },
          { m: "happy", t: "Ya está. Ha quedado bien." },
          { m: "blush", t: "Te la mando. Y la quiero en un sitio donde no se pierda." },
          { m: "angry", t: "Y no se la enseñes a nadie del vestuario." },
          { m: "blush", t: "…Bueno. A uno. Pero elígelo bien." },
        ],
        introAfter: [
          { m: "idle", t: "Vale. Última cosa y te dejo, que tienes que ir al vestuario." },
          { m: "blush", t: "En esta foto tienes cara de muerto." },
          { m: "angry", t: "¡Es la verdad! Vienes de noventa minutos." },
          { m: "idle", t: "Y me da rabia, porque dentro de unos años voy a mirarla y voy a pensar «qué mal estaba»." },
          { m: "blush", t: "Así que quiero otra. Otro día, otro partido." },
          { m: "idle", t: "Pero para esa quiero que llegues bien. Con tres días encadenados detrás y un partido ganado." },
          { m: "happy", t: "Y entonces te hago la foto buena." },
          { m: "angry", t: "Esta la guardo igual, que quede claro. No la voy a tirar." },
        ],
        replies: [
          { t: "Sales bien.", m: "happy",
            r: [{ m: "blush", t: "…" }, { m: "angry", t: "Salgo con los ojos medio cerrados." },
              { m: "angry", t: "…" }, { m: "blush", t: "Vale. Salgo bien." },
              { m: "happy", t: "No la repitamos, entonces. Por si acaso." }] },
          { t: "¿Va a la caja?", m: "idle",
            r: [{ m: "blush", t: "No." }, { m: "idle", t: "La caja es para las cosas del pasado." },
              { m: "blush", t: "Esta la quiero donde la vea todos los días." },
              { m: "angry", t: "…No me hagas más preguntas hoy." }] },
          { t: "¿A quién se la vas a enseñar?", m: "idle",
            r: [{ m: "angry", t: "A nadie." }, { m: "idle", t: "…" },
              { m: "blush", t: "A mi mejor amiga. Que lleva tres meses preguntándome que quién es el del gol del minuto setenta y uno." },
              { m: "angry", t: "¡Porque yo no se lo he contado! ¡Ella sola ató cabos!" },
              { m: "happy", t: "…Se lo conté yo. El mismo día." }] },
        ],
        setFlags: ["yunaPhoto"],
        midReveal: "yuna_foto",
        snap: (g) => ({ since: todayStr(), matchCount: (g.matchHistory || []).length }),
        subs: [
          (g, s) => (g.matchHistory || []).slice(s.matchCount).some((m) => m.res === "V"),
          { count: (g) => g.player.streak || 0, goal: 3 },
        ],
        check: (g, s) => (g.matchHistory || []).slice(s.matchCount).some((m) => m.res === "V") &&
          (g.player.streak || 0) >= 3 },
      /* CAPÍTULO 8 — La cola. DECISIÓN DE DISEÑO (documento): la persona del conflicto no
         tiene nombre, no es un personaje de la campaña y no es rival romántica — es una
         aficionada que pidió una foto, evento de escena, no una estadística. Los celos de
         Yuna son desproporcionados y ella lo sabe: eso es lo que los hace funcionar. */
      { title: "La cola", zone: "parque",
        objective: "Cierra 4 días de objetivos y consigue una victoria.",
        intro: [
          { m: "happy", t: "Victoria y tres días. Ya tengo derecho a la foto buena." },
          { m: "blush", t: "No hoy. Hoy no estoy… hoy no." },
          { m: "idle", t: "Otro día." },
          { m: "celosa", t: "¿Quién era?" },
          { m: "idle", t: "La del otro día. Cuando salías del entrenamiento." },
          { m: "angry", t: "No me interesa." },
          { m: "celosa", t: "…Vale, sí me interesa un poco." },
          { m: "idle", t: "Te pidió una foto, ¿no? Ya lo vi. No hace falta que me lo expliques." },
          { m: "celosa", t: "Te pidió una foto y tú se la hiciste y ella se fue tan contenta." },
          { m: "angry", t: "Y está perfectamente bien. Es tu trabajo. Es lo que hay que hacer." },
          { m: "preocupada", t: "No es eso lo que me molesta." },
          { m: "celosa", t: "Lo que me molesta es que me haya molestado." },
          { m: "blush", t: "Porque antes no me pasaba." },
          { m: "idle", t: "Antes yo era la que te miraba desde fuera. Esa era mi posición y me gustaba." },
          { m: "preocupada", t: "Y ese día me di cuenta de que hay una cola." },
          { m: "preocupada", t: "Una cola de gente que te va a pedir una foto, y ella estaba delante, y yo detrás, y todos hacemos exactamente lo mismo." },
          { m: "celosa", t: "Guardar una prueba de que te hemos visto." },
          { m: "angry", t: "Y yo no quiero ser eso. No quiero ser la número catorce de una cola." },
          { m: "preocupada", t: "Y llevo toda mi vida siendo la nueva de la clase, así que sé perfectamente lo que es que alguien se olvide de ti sin querer y sin culpa." },
          { m: "blush", t: "Y odio esto. Odio estar diciéndolo." },
          { m: "idle", t: "Porque creo que ya sé por qué me pasa." },
          { m: "preocupada", t: "Y todavía no estoy preparada para decirlo en voz alta." },
          { m: "preocupada", t: "Perdona. De verdad." },
          { m: "idle", t: "No quiero decidir con quién hablas. Sería ridículo y además no tengo ningún derecho." },
          { m: "blush", t: "Solo me sorprendió descubrir cuánto me importaba." },
          { m: "angry", t: "Y eso es culpa tuya. Más o menos." },
          { m: "idle", t: "…" },
          { m: "blush", t: "Mira, vamos a hacer una cosa. Necesito dejar de darle vueltas a esto y para eso necesito algo que mirar." },
          { m: "idle", t: "Cuatro días. Cuatro días cerrados, seguidos o no, me da igual." },
          { m: "idle", t: "Y una victoria al final." },
          { m: "blush", t: "Porque cuando estoy así, lo único que me calma es tener un número que suba." },
          { m: "angry", t: "Es un mecanismo horrible y ya lo sé. No hace falta que me lo digas." },
        ],
        replies: [
          { t: "Tú no estás en ninguna cola.", m: "idle",
            r: [{ m: "celosa", t: "…" }, { m: "angry", t: "No digas cosas así sin avisar." },
              { m: "blush", t: "…" }, { m: "preocupada", t: "¿Lo dices porque es verdad o porque es lo que hay que decir?" },
              { m: "blush", t: "…Vale. No contestes. Te creo." }] },
          { t: "No me acuerdo de su cara.", m: "idle",
            r: [{ m: "celosa", t: "Mentira." }, { m: "idle", t: "…" }, { m: "blush", t: "¿En serio?" },
              { m: "happy", t: "…Vale. Eso me ha gustado más de lo que debería." },
              { m: "angry", t: "¡No te acostumbres a arreglarlo todo así!" }] },
          { t: "Estás celosa.", m: "idle",
            r: [{ m: "angry", t: "¡NO estoy celosa!" }, { m: "celosa", t: "…" }, { m: "celosa", t: "Estoy celosa." },
              { m: "blush", t: "Y es humillante, para que lo sepas. Llevo tres días practicando cómo decirte esto sin usar esa palabra." },
              { m: "angry", t: "Y la has dicho tú en cuatro segundos. Enhorabuena." }] },
        ],
        setFlags: ["yunaCelos"],
        snap: (g) => ({ since: todayStr(), matchCount: (g.matchHistory || []).length }),
        subs: [
          { count: (g, s) => daysGoalsCompletedSince(g, s.since), goal: 4 },
          (g, s) => (g.matchHistory || []).slice(s.matchCount).some((m) => m.res === "V"),
        ],
        check: (g, s) => daysGoalsCompletedSince(g, s.since) >= 4 &&
          (g.matchHistory || []).slice(s.matchCount).some((m) => m.res === "V") },
      /* CAPÍTULO 9 — Lo que no digo. Escena íntima pero NO sexual: la caja abierta encima
         de la mesa y lo que ella se atreve a decir. La primera reply es un aplazamiento
         deliberado, no un rechazo: si el jugador se declara aquí, el arco se rompe cuatro
         capítulos antes de tiempo. Línea de afinidad añadida vía introBuild (marcador
         vacío, filtrado si no hay rama elegida). */
      { title: "Lo que no digo", zone: "casa",
        objective: "Sube tu media (OVR) respecto al inicio del capítulo y alcanza una racha de 5 días.",
        intro: YUNA_C9_INTRO.filter((b) => b !== YUNA_C9_AFF_MARKER),
        introBuild: (g) => {
          const aff = yunaAffOf(g);
          if (!aff) return null;
          return YUNA_C9_INTRO.map((b) => b === YUNA_C9_AFF_MARKER ? YUNA_C9_AFF_LINES[aff] : b);
        },
        replies: [
          { t: "A mí también me gustas.", m: "happy",
            r: [{ m: "blush", t: "…" }, { m: "preocupada", t: "No. Espera. No lo digas todavía." },
              { m: "idle", t: "No porque no quiera oírlo. Lo quiero oír muchísimo." },
              { m: "preocupada", t: "Pero acabo de decirlo yo y ahora mismo no sabría distinguir si lo dices tú o si lo dices porque lo he dicho yo." },
              { m: "blush", t: "Dímelo otro día. Un día en el que no venga yo con una caja de zapatos." }] },
          { t: "No va a cambiar nada.", m: "idle",
            r: [{ m: "preocupada", t: "Va a cambiar todo. Eso es lo que pasa cuando dices estas cosas." },
              { m: "idle", t: "…" },
              { m: "blush", t: "Aunque supongo que llevaba ya un tiempo cambiado y lo único que faltaba era decirlo." }] },
          { t: "¿Por qué me lo cuentas ahora?", m: "idle",
            r: [{ m: "blush", t: "Porque estaba a punto de comprarme una libreta." },
              { m: "angry", t: "Para apuntar tus partidos. A mano." },
              { m: "angry", t: "Y ahí me paré y pensé: Yuna, esto ya no es normal ni de lejos." },
              { m: "happy", t: "Así que o te lo decía o me convertía oficialmente en un problema." }] },
        ],
        setFlags: ["yunaConfessionReady"],
        snap: (g) => ({ since: todayStr(), ovr: calcOVR(g.player.stats) }),
        subs: [
          (g, s) => calcOVR(g.player.stats) > s.ovr,
          { count: (g) => g.player.streak || 0, goal: 5 },
        ],
        check: (g, s) => calcOVR(g.player.stats) > s.ovr && (g.player.streak || 0) >= 5 },
      /* CAPÍTULO 10 — Una tarde sin fútbol. Único capítulo con outfit playa/playablush.
         Escena romántica sin contenido sexual: intimidad conversacional. bestRating se
         fotografía en el snap. */
      { title: "Una tarde sin fútbol", zone: "playa",
        objective: "Supera tu mejor nota de carrera en un partido y consigue una victoria.",
        intro: [
          { m: "playa", t: "Subiste el número. Y aguantaste cinco días." },
          { m: "playa", t: "Lo comprobé el domingo por la noche y me quedé tonta mirándolo un rato." },
          { m: "playablush", t: "Y esta vez no voy a fingir que fue por curiosidad estadística." },
          { m: "playa", t: "Ya no cuela ni para mí." },
          { m: "playa", t: "No te acostumbres a verme así." },
          { m: "playa", t: "Hoy no quiero hablar de goles." },
          { m: "playablush", t: "Ni de estadísticas. Ni de tu media. Ni de la jornada que viene." },
          { m: "playa", t: "Quiero una tarde normal. Una tarde de las que no se guardan en ninguna caja." },
          { m: "playablush", t: "…Y eso me está costando más de lo que pensaba, si te soy sincera." },
          { m: "playa", t: "Porque he estado haciendo la lista mentalmente mientras venía." },
          { m: "playablush", t: "El primer gol. La tienda. La bufanda. La entrada. La foto." },
          { m: "playa", t: "Todo lo nuestro empezó alrededor de un partido." },
          { m: "playablush", t: "Y no me quejo, ¿eh? Fue lo que nos puso en la misma calle." },
          { m: "playa", t: "Pero eso significa que nunca hemos hecho nada juntos que no fuera una excusa." },
          { m: "playablush", t: "Y necesito saber cómo somos sin eso." },
          { m: "playa", t: "Porque si resulta que sin fútbol no tenemos nada que decirnos, prefiero enterarme hoy." },
          { m: "blush", t: "…Y sí. Me pone bastante nerviosa decirlo así de claro." },
          { m: "happy", t: "Pero me apetece. Me apetece mucho." },
          { m: "playa", t: "Bueno. Pues ya está. Se acabó la tarde sin fútbol." },
          { m: "happy", t: "Ha durado tres horas. Es un récord para mí." },
          { m: "playablush", t: "Y ahora te voy a decir una cosa que va a sonar contradictoria con todo lo que acabo de decir." },
          { m: "playa", t: "Quiero que hagas tu mejor partido." },
          { m: "idle", t: "Tienes una nota máxima en tu historial. Quiero que la borres y pongas otra." },
          { m: "playablush", t: "Y no es una excusa para verte. Ya no necesito excusas para verte, eso quedó claro hace rato." },
          { m: "playa", t: "Es que hoy me lo he pasado bien de verdad." },
          { m: "playablush", t: "Y cuando me lo paso bien me entran unas ganas horribles de que a la gente que quiero le salgan las cosas." },
          { m: "angry", t: "…No he dicho «que quiero». He dicho «a la gente». En general." },
          { m: "happy", t: "He dicho «que quiero». Da igual. Sigue." },
        ],
        replies: [
          { t: "¿Y si no tenemos nada que decirnos?", m: "idle",
            r: [{ m: "playablush", t: "Entonces nos callamos y ya está." },
              { m: "playa", t: "Hay gente que se calla bien junta y gente que no." },
              { m: "playablush", t: "…Llevamos veinte minutos y todavía no me he agobiado, así que pinta bien." }] },
          { t: "Cuéntame algo que no sepa de ti.", m: "idle",
            r: [{ m: "playa", t: "…Vale." }, { m: "playablush", t: "No sé nadar bien. Nada bien. Lo justo para no ahogarme." },
              { m: "angry", t: "¡Y no te rías!" },
              { m: "playablush", t: "Seis ciudades y ninguna tenía piscina municipal decente. Es un fallo del sistema, no mío." }] },
          { t: "Esto es una cita.", m: "blush",
            r: [{ m: "blush", t: "…" }, { m: "angry", t: "No lo digas." },
              { m: "playablush", t: "…" }, { m: "playablush", t: "Vale. Es una cita." },
              { m: "angry", t: "Y no me lo hagas repetir porque no lo pienso repetir." }] },
        ],
        setFlags: ["yunaDate"],
        snap: (g) => ({ since: todayStr(), matchCount: (g.matchHistory || []).length, bestRating: g.bestRating || 0 }),
        subs: [
          (g, s) => (g.matchHistory || []).slice(s.matchCount).some((m) => (m.rating || 0) > s.bestRating),
          (g, s) => (g.matchHistory || []).slice(s.matchCount).some((m) => m.res === "V"),
        ],
        check: (g, s) => (g.matchHistory || []).slice(s.matchCount).some((m) => (m.rating || 0) > s.bestRating) &&
          (g.matchHistory || []).slice(s.matchCount).some((m) => m.res === "V") },
      /* CAPÍTULO 11 — La segunda bufanda. Primera aparición de la pose enamorada (una sola
         línea, deliberado: es la primera vez que no se corrige a sí misma tras decir algo
         sincero). El paralelismo con C2 (cuarenta minutos frente a cuatro) es el que hace
         funcionar el capítulo. Revelado a mitad de escena. */
      { title: "La segunda bufanda", zone: "tienda",
        objective: "Haz una operación en la tienda y vuelve a superar tu mejor nota de carrera.",
        introBefore: [
          { m: "happy", t: "Mejor nota de tu carrera." },
          { m: "blush", t: "Y ganasteis. Las dos cosas el mismo día, otra vez." },
          { m: "idle", t: "Empiezo a pensar que lo haces a propósito para que no pueda dosificar la alegría." },
          { m: "happy", t: "Me parece bien. Sigue." },
          { m: "idle", t: "He encontrado otra cosa." },
          { m: "blush", t: "Y esta vez no voy a decir que sobraba." },
          { m: "angry", t: "Porque sería una mentira malísima y ya la usé una vez." },
          { m: "idle", t: "La vi el martes, entré, la compré y me fui." },
          { m: "blush", t: "Tardé cuatro minutos. Sin dudarlo, sin dar vueltas por la tienda fingiendo que miraba otras cosas." },
          { m: "angry", t: "Y eso me tuvo rara todo el día." },
          { m: "idle", t: "Porque, ¿sabes cuánto tardé con la primera?" },
          { m: "blush", t: "Cuarenta minutos. Cuarenta." },
          { m: "angry", t: "Cogí tres, las dejé, salí, volví a entrar, me inventé una historia sobre que había una de más por si acaso me preguntabas." },
          { m: "blush", t: "Me preparé la excusa antes de comprar el regalo. Eso es lo que hacía yo." },
          { m: "idle", t: "Y el martes, nada. Cuatro minutos." },
          { m: "blush", t: "Supongo que después de todo lo que hemos hablado ya no tiene mucho sentido seguir fingiendo." },
          { m: "angry", t: "Aunque me sigue dando una vergüenza horrible, que conste. Eso no se ha ido." },
          { m: "blush", t: "Toma." },
          { m: "idle", t: "Es la de este año. La otra ya está vieja y encima la llevas fatal, siempre por dentro del abrigo." },
          { m: "angry", t: "No tires la primera." },
          { m: "blush", t: "…" },
          { m: "enamorada", t: "Y esta vez no hay ninguna excusa. La he elegido para ti." },
          { m: "angry", t: "Y si te burlas, me la llevo." },
        ],
        introAfter: [
          { m: "idle", t: "Vale. Antes de que esto se ponga peor, cambiemos de tema." },
          { m: "blush", t: "Quiero pedirte una cosa y no tiene nada que ver con bufandas." },
          { m: "idle", t: "Vuelve aquí. A la tienda, digo. Compra o vende algo, lo que sea." },
          { m: "angry", t: "¡No para gastarte el dinero!" },
          { m: "blush", t: "Es que la primera vez que vinimos aquí yo estaba fingiendo que comparaba materiales." },
          { m: "blush", t: "Y me apetece muchísimo volver al mismo sitio sin tener que fingir nada." },
          { m: "idle", t: "Y aparte de eso, quiero otra vez tu mejor nota." },
          { m: "angry", t: "Sí, ya sé que la acabas de batir. Bátela otra vez." },
          { m: "happy", t: "Ahora que sé que puedes, se me ha puesto el listón por las nubes. Es culpa tuya." },
        ],
        replies: [
          { t: "No me voy a burlar.", m: "idle",
            r: [{ m: "blush", t: "Ya lo sé." }, { m: "angry", t: "Lo digo por costumbre. Llevo meses diciéndolo por costumbre." },
              { m: "happy", t: "Es difícil dejar de defenderse cuando ya nadie te ataca." }] },
          { t: "Tengo las dos, entonces.", m: "happy",
            r: [{ m: "happy", t: "Tienes las dos." },
              { m: "blush", t: "Una de cuando no me atrevía a decírtelo y otra de ahora." },
              { m: "enamorada", t: "Y me gusta bastante que existan las dos." }] },
          { t: "¿Qué te gustaría que te regalara yo?", m: "idle",
            r: [{ m: "blush", t: "…" }, { m: "angry", t: "No sé. Nunca lo he pensado." },
              { m: "idle", t: "…" }, { m: "blush", t: "Sí lo he pensado. Muchas veces." },
              { m: "blush", t: "Cualquier cosa. Literalmente cualquier cosa, con tal de que la hayas elegido pensando en mí." },
              { m: "angry", t: "Y ahora deja de preguntar, que me estoy poniendo insoportable." }] },
        ],
        setFlags: ["yunaSecondGift"],
        midReveal: "yuna_bufanda2",
        snap: (g) => ({ since: todayStr(), bestRating: g.bestRating || 0 }),
        subs: [
          (g, s) => (g.cocoLog || []).some((e) => e.day >= s.since),
          (g, s) => (g.matchHistory || []).some((m) => (m.rating || 0) > s.bestRating),
        ],
        check: (g, s) => (g.cocoLog || []).some((e) => e.day >= s.since) &&
          (g.matchHistory || []).some((m) => (m.rating || 0) > s.bestRating) },
      /* CAPÍTULO 12 — La discusión. No se resuelve con una disculpa sin más: se resuelve
         cuando ella nombra el mecanismo real (contar la caja) y acepta que el problema es
         suyo, sin que eso invalide la queja. La reply 3 («Tira la caja») es deliberadamente
         dura y ella la rechaza: no suavizar. Misión más fácil de la segunda mitad a
         propósito: tras una discusión no se pide un hito, se pide constancia. */
      { title: "La discusión", zone: "parque",
        objective: "Cierra 3 días de objetivos y gana el siguiente partido.",
        intro: [
          { m: "idle", t: "Otra vez tu mejor nota. Y volviste a la tienda." },
          { m: "blush", t: "Lo sé porque estaba allí. Media hora antes y media hora después, por si acaso." },
          { m: "angry", t: "No coincidimos. Ya lo sé." },
          { m: "preocupada", t: "Y de eso quería hablar, precisamente." },
          { m: "angry", t: "Últimamente no tienes tiempo para nada." },
          { m: "preocupada", t: "Y antes de que digas nada: ya sé que tu carrera es importante." },
          { m: "idle", t: "Sé lo que has trabajado para llegar hasta aquí. Lo sé mejor que casi nadie, porque lo he ido apuntando." },
          { m: "preocupada", t: "Y no quiero ser la persona que te pide que abandones algo por ella. Esa persona me da asco." },
          { m: "angry", t: "Pero a veces siento que yo solo existo cuando te sobra un hueco." },
          { m: "angry", t: "Que soy lo que haces el martes si no hay entrenamiento doble." },
          { m: "preocupada", t: "Y no quiero sentirme así, porque no es justo para ti y encima me convierte en alguien que no me gusta." },
          { m: "idle", t: "…" },
          { m: "preocupada", t: "¿Sabes qué hice el jueves?" },
          { m: "preocupada", t: "Abrí la caja. Otra vez." },
          { m: "blush", t: "Y no para recordar nada. Para contar." },
          { m: "preocupada", t: "Conté cuántas cosas tuyas hay dentro y en qué fechas son." },
          { m: "preocupada", t: "Y vi que las últimas tres semanas no hay nada." },
          { m: "angry", t: "Y me puse mal. Por una caja de zapatos. Me puse mal por una caja de zapatos." },
          { m: "preocupada", t: "Porque toda mi vida he funcionado así: si no guardo una prueba, es que no pasó." },
          { m: "blush", t: "Y me da un miedo horrible que tu carrera se haga tan grande que yo acabe siendo tres semanas sin nada dentro." },
          { m: "preocupada", t: "Ya sé que no es justo. Sé perfectamente que no es justo." },
          { m: "idle", t: "No quiero decidir tu tiempo." },
          { m: "blush", t: "Solo quiero saber que también hay un sitio para mí." },
          { m: "angry", t: "Porque me importas demasiado. Y esa es la parte que no sé cómo arreglar." },
          { m: "preocupada", t: "Perdona tú también, por cierto." },
          { m: "idle", t: "No debería haberte hecho sentir que tienes que elegir. Eso ha estado mal." },
          { m: "blush", t: "Tu carrera es tuya." },
          { m: "enamorada", t: "Y yo quiero estar a tu lado, no delante." },
          { m: "happy", t: "Solo necesito que me dejes formar parte de tu vida y no solo de tu calendario." },
          { m: "idle", t: "Así que vamos a hacer algo fácil, que hoy ya hemos tenido bastante." },
          { m: "idle", t: "Tres días. Y gana el siguiente partido." },
          { m: "blush", t: "Y cuando ganes, avísame tú. No quiero enterarme por la app." },
          { m: "angry", t: "Eso es lo único que te estoy pidiendo. Un mensaje. Es literalmente un mensaje." },
        ],
        replies: [
          { t: "Tienes razón. Perdona.", m: "idle",
            r: [{ m: "preocupada", t: "…" }, { m: "angry", t: "No. No hagas eso." },
              { m: "idle", t: "No quiero que me des la razón tan rápido. Quiero que me digas si es verdad." },
              { m: "blush", t: "Porque si me das la razón por no discutir, dentro de un mes estamos otra vez aquí." },
              { m: "suave", t: "…Aunque gracias. De verdad." }] },
          { t: "No puedo prometerte más tiempo.", m: "idle",
            r: [{ m: "angry", t: "…" }, { m: "preocupada", t: "Vale." },
              { m: "idle", t: "Vale, eso es honesto. Prefiero eso." },
              { m: "blush", t: "No necesito más tiempo. Necesito saber cuándo. Que es distinto." },
              { m: "suave", t: "Dime un día de la semana y me callo tres meses." }] },
          { t: "Tira la caja.", m: "angry",
            r: [{ m: "angry", t: "¿Qué?" }, { m: "preocupada", t: "…" }, { m: "idle", t: "No puedo tirar la caja." },
              { m: "blush", t: "…" }, { m: "preocupada", t: "Aunque quizá sí tenga que dejar de contarla." },
              { m: "suave", t: "Eso sí. Eso lo puedo intentar." }] },
        ],
        setFlags: ["yunaConflicto"],
        snap: (g) => ({ since: todayStr(), matchCount: (g.matchHistory || []).length }),
        subs: [
          { count: (g, s) => daysGoalsCompletedSince(g, s.since), goal: 3 },
          (g, s) => (g.matchHistory || []).slice(s.matchCount).some((m) => m.res === "V"),
        ],
        check: (g, s) => daysGoalsCompletedSince(g, s.since) >= 3 &&
          (g.matchHistory || []).slice(s.matchCount).some((m) => m.res === "V") },
      /* CAPÍTULO 13 — Sin excusas. PUNTO DE NO RETORNO: la confesión, con la enumeración de
         las ocho excusas (una por capítulo 0-8, en orden — si se reordena algún capítulo
         hay que actualizar esta lista). Línea de afinidad añadida vía introBuild. */
      { title: "Sin excusas", zone: "parque",
        objective: "Alcanza la categoría Primera y mantén una racha de 6 días.",
        intro: YUNA_C13_INTRO.filter((b) => b !== YUNA_C13_AFF_MARKER),
        introBuild: (g) => {
          const aff = yunaAffOf(g);
          if (!aff) return null;
          return YUNA_C13_INTRO.map((b) => b === YUNA_C13_AFF_MARKER ? YUNA_C13_AFF_LINES[aff] : b);
        },
        replies: [
          { t: "Tú también me gustas.", m: "happy",
            r: [{ m: "blush", t: "…" }, { m: "enamorada", t: "Vale." }, { m: "enamorada", t: "Vale, vale, vale." },
              { m: "angry", t: "Dame un segundo, que llevo meses preparando qué decir si pasaba esto y se me ha ido todo." },
              { m: "happy", t: "…No tenía nada preparado. Mentira. Estaba segurísima de que no iba a pasar." }] },
          { t: "Me gustas desde la bufanda.", m: "happy",
            r: [{ m: "blush", t: "¿Desde la bufanda?" },
              { m: "angry", t: "¿Desde la bufanda y no has dicho nada en todo este tiempo?" },
              { m: "enamorada", t: "…" },
              { m: "happy", t: "Bueno. Somos igual de idiotas, entonces. Eso es tranquilizador." }] },
          { t: "Minuto setenta y uno.", m: "idle",
            r: [{ m: "blush", t: "…" }, { m: "angry", t: "¿Cómo…?" },
              { m: "idle", t: "Ese fue el gol. El primero. El que te vi." },
              { m: "blush", t: "Te acuerdas del minuto." },
              { m: "enamorada", t: "Llevo un año siendo la única que se acordaba de los minutos." },
              { m: "blush", t: "…No sabes lo que acabas de hacer." }] },
        ],
        setFlags: ["yunaRelationship"],
        snap: () => ({}),
        subs: [
          (g) => g.tier.id >= 4,
          (g) => (g.player.streak || 0) >= 6,
        ],
        check: (g) => g.tier.id >= 4 && (g.player.streak || 0) >= 6 },
      /* CAPÍTULO 14 — Juntos. Ya en pareja: la cercanía se expresa con confianza y humor,
         nunca contenido sexual ni descripción física. "He dejado de contar la caja" es la
         resolución real del arco de C12: la línea más importante del capítulo. */
      { title: "Juntos", zone: "casa",
        objective: "Sube tu media (OVR) respecto al inicio del capítulo y consigue una victoria.",
        intro: [
          { m: "enamorada", t: "Primera." },
          { m: "happy", t: "Y con seis días. Entero, como te pedí." },
          { m: "blush", t: "Lo vi anunciado y tuve que sentarme. Literalmente me tuve que sentar en el portal." },
          { m: "angry", t: "No se lo cuentes a nadie." },
          { m: "enamorada", t: "Es rarísimo decir «mi novio» y que seas tú." },
          { m: "blush", t: "Todavía me da vergüenza. Lo digo bajito y mirando a otro lado." },
          { m: "enamorada", t: "Pero me gusta." },
          { m: "happy", t: "Mucho." },
          { m: "idle", t: "¿Sabes qué es lo más raro de todo?" },
          { m: "enamorada", t: "Que durante meses estaba convencidísima de que tenía que esconderlo." },
          { m: "blush", t: "Que si lo decía se rompía. Que era como el fútbol, que si lo comentas en voz alta se acaba la racha." },
          { m: "happy", t: "Y lo dije. Y no se rompió nada." },
          { m: "idle", t: "…" },
          { m: "blush", t: "He hecho una cosa, por cierto. Y me vas a decir que estoy mal de la cabeza." },
          { m: "idle", t: "He dejado de contar la caja." },
          { m: "preocupada", t: "No la he tirado, que eso no lo voy a hacer nunca y ya lo hablamos." },
          { m: "blush", t: "Pero he dejado de abrirla para comprobar que esto sigue pasando." },
          { m: "enamorada", t: "Porque resulta que ahora te veo y ya está. No hace falta prueba." },
          { m: "angry", t: "Y me ha costado tres semanas y ha sido horrible, así que valóralo." },
          { m: "happy", t: "Bueno… excepto cuando me miras así." },
          { m: "blush", t: "Entonces sigo poniéndome nerviosa igual que el primer día." },
          { m: "enamorada", t: "Pero ya no finjo que no me pasa. Que es lo único que quería conseguir." },
          { m: "enamorada", t: "En fin. Que me gusta estar contigo así, sin tener que inventarme una razón." },
          { m: "blush", t: "Podría acostumbrarme bastante rápido." },
          { m: "idle", t: "Y ahora, ya que estás en Primera y todo el mundo te mira…" },
          { m: "angry", t: "…no te acomodes." },
          { m: "blush", t: "Lo digo en serio. He visto a muchísima gente llegar y quedarse quieta ahí." },
          { m: "idle", t: "Sube otra vez tu media. Un punto, lo que sea, pero que suba." },
          { m: "idle", t: "Y gana." },
          { m: "enamorada", t: "Porque ya no te miro para comprobar nada. Ahora te miro porque quiero ver hasta dónde llegas." },
        ],
        replies: [
          { t: "Sigues siendo insoportable.", m: "happy",
            r: [{ m: "angry", t: "¡Y tú sigues llevando la bufanda por dentro del abrigo!" },
              { m: "happy", t: "…" }, { m: "enamorada", t: "No cambies eso. Ninguna de las dos cosas." }] },
          { t: "¿Y si algún día se rompe?", m: "idle",
            r: [{ m: "preocupada", t: "…" }, { m: "idle", t: "Pues se rompe." },
              { m: "blush", t: "Y entonces me alegraré muchísimo de tener una caja llena de pruebas." },
              { m: "enamorada", t: "Pero hoy no. Hoy no pienso en eso." }] },
          { t: "Quiero conocer a tu familia.", m: "happy",
            r: [{ m: "angry", t: "¿Qué? ¡No!" }, { m: "blush", t: "…" },
              { m: "idle", t: "Mi madre lleva preguntando desde noviembre." },
              { m: "angry", t: "Y no sé cómo se enteró, porque yo no dije nada." },
              { m: "happy", t: "…Le enseñé la foto. Vale. Fui yo." }] },
        ],
        snap: (g) => ({ since: todayStr(), matchCount: (g.matchHistory || []).length, ovr: calcOVR(g.player.stats) }),
        subs: [
          (g, s) => calcOVR(g.player.stats) > s.ovr,
          (g, s) => (g.matchHistory || []).slice(s.matchCount).some((m) => m.res === "V"),
        ],
        check: (g, s) => calcOVR(g.player.stats) > s.ovr &&
          (g.matchHistory || []).slice(s.matchCount).some((m) => m.res === "V") },
      /* CAPÍTULO 15 — El recuerdo. Primera y única vez que se usan gf/ga (victoria por 2+
         goles), para dar variedad al último tramo. */
      { title: "El recuerdo", zone: "estadio",
        objective: "Supera tu mejor media (OVR) y gana un partido por dos goles de diferencia o más.",
        intro: [
          { m: "happy", t: "Subiste otra vez. Y ganasteis." },
          { m: "enamorada", t: "Ya no me sorprende, que es lo increíble de todo esto." },
          { m: "blush", t: "Hace un año me habría pasado una semana mirando ese número." },
          { m: "happy", t: "Y ahora pienso «claro, es él» y sigo con mi vida." },
          { m: "happy", t: "Mira. ¿Te acuerdas de esta?" },
          { m: "blush", t: "Mira qué cara tenía yo." },
          { m: "enamorada", t: "Estaba intentando convencerte de que aquella foto era del partido." },
          { m: "happy", t: "Qué vergüenza, de verdad. Se me nota en los ojos." },
          { m: "idle", t: "La hicimos justo ahí. En esa esquina, con la grada todavía medio llena." },
          { m: "enamorada", t: "Y míranos ahora, en el mismo sitio." },
          { m: "blush", t: "Hemos cambiado bastante desde aquel día." },
          { m: "idle", t: "…" },
          { m: "preocupada", t: "¿Sabes qué es lo raro?" },
          { m: "idle", t: "Al principio me daba miedo que te dieras cuenta de que me gustabas." },
          { m: "preocupada", t: "Y ahora me da miedo otra cosa completamente distinta." },
          { m: "preocupada", t: "Me da miedo que un día esto sea tan normal que dejemos de mirarlo." },
          { m: "blush", t: "Que la foto se quede en una carpeta del móvil y no la abra nadie en diez años." },
          { m: "enamorada", t: "Así que la voy a imprimir otra vez. Y la entrada la voy a poner con ella." },
          { m: "blush", t: "Y la bufanda vieja también, aunque no quepa. Ya haré sitio." },
          { m: "happy", t: "Tengo demasiados recuerdos tuyos ya. Muchísimos." },
          { m: "enamorada", t: "Y todavía quiero hacer más." },
          { m: "idle", t: "Vale. Última cosa antes de que se ponga a llover." },
          { m: "enamorada", t: "Quiero un partido para la caja. Uno de los gordos." },
          { m: "idle", t: "Tu mejor media hasta la fecha, y una victoria de las que se ganan bien. Por dos goles al menos." },
          { m: "angry", t: "No por uno de penalti en el noventa y cinco. Por dos." },
          { m: "blush", t: "Porque quiero acordarme del partido, no de un susto." },
          { m: "happy", t: "Y quiero que la entrada de ese día vaya justo al lado de esta." },
          { m: "enamorada", t: "La primera y la de ahora, juntas." },
          { m: "blush", t: "…Sí, ya sé que sigo siendo exactamente igual de intensa que en el capítulo de la caja." },
          { m: "happy", t: "Es que no era una fase." },
        ],
        replies: [
          { t: "Vamos a hacernos la foto buena.", m: "happy",
            r: [{ m: "blush", t: "…" }, { m: "happy", t: "La foto buena." },
              { m: "enamorada", t: "Llevas meses debiéndomela." },
              { m: "angry", t: "Y esta vez abre los ojos tú, que en la primera fui yo la que salió mal." }] },
          { t: "¿Y si dejamos de guardar cosas?", m: "idle",
            r: [{ m: "preocupada", t: "…" }, { m: "idle", t: "No sabría." },
              { m: "blush", t: "Pero es la primera vez que la idea no me da pánico." },
              { m: "enamorada", t: "Igual dentro de un tiempo. No hoy." }] },
          { t: "Yo también guardo cosas ya.", m: "happy",
            r: [{ m: "blush", t: "¿Qué guardas?" }, { m: "angry", t: "…" }, { m: "blush", t: "No me lo digas." },
              { m: "enamorada", t: "Sí. Sí dímelo. Dímelo ahora mismo." }] },
        ],
        snap: (g) => ({ since: todayStr(), matchCount: (g.matchHistory || []).length, ovr: calcOVR(g.player.stats) }),
        subs: [
          (g, s) => calcOVR(g.player.stats) > s.ovr,
          (g, s) => (g.matchHistory || []).slice(s.matchCount).some((m) => m.res === "V" && (m.gf || 0) - (m.ga || 0) >= 2),
        ],
        check: (g, s) => calcOVR(g.player.stats) > s.ovr &&
          (g.matchHistory || []).slice(s.matchCount).some((m) => m.res === "V" && (m.gf || 0) - (m.ga || 0) >= 2) },
      /* FINAL — Por una vez, sin excusas. Eco del prólogo («no he venido por ti» → «he
         venido por ti»): intocable. NO lleva final:true — la última etapa del capítulo es
         el EPÍLOGO. */
      { title: "Por una vez, sin excusas", zone: "estadio",
        objective: "Alcanza la categoría Europa.",
        intro: [
          { m: "enamorada", t: "Dos goles de diferencia y tu mejor media." },
          { m: "happy", t: "La entrada ya está en la caja, al lado de la primera. Como dije." },
          { m: "blush", t: "Y sí, las he mirado juntas un rato. Bastante rato." },
          { m: "barcelona", t: "Vale. Lo admito." },
          { m: "barcelona", t: "Sigo siendo la fan número uno del Barça y eso no lo va a cambiar nadie, ni tú." },
          { m: "happy", t: "Que quede claro por si alguien pensaba que se me iba a pasar." },
          { m: "enamorada", t: "Pero también soy la persona que estaba en esa grada el día que empezó todo esto." },
          { m: "idle", t: "Y me acuerdo de todo. Es mi único talento, ya lo sabes." },
          { m: "idle", t: "Me acuerdo del primer gol. Minuto setenta y uno." },
          { m: "happy", t: "Me acuerdo de mí misma inventándome que había venido a mirar estadísticas." },
          { m: "enamorada", t: "Me acuerdo de la bufanda que supuestamente sobraba." },
          { m: "blush", t: "De la entrada. De la foto. De la primera tarde en la que no hablamos de fútbol." },
          { m: "enamorada", t: "Incluso de la discusión. Sobre todo de la discusión." },
          { m: "happy", t: "Supongo que una relación también está hecha de esas cosas y no solo de las bonitas." },
          { m: "idle", t: "…" },
          { m: "idle", t: "¿Sabes qué te dije el primer día, exactamente?" },
          { m: "idle", t: "Te dije: «no he venido por ti»." },
          { m: "blush", t: "Y me lo creí. Me lo creí de verdad durante bastante tiempo." },
          { m: "enamorada", t: "Así que hoy quiero decir la frase bien, por una vez." },
          { m: "enamorada", t: "He venido por ti." },
          { m: "enamorada", t: "Vengo siempre por ti." },
          { m: "blush", t: "Y sí, me da vergüenza. Me va a dar vergüenza siempre, creo." },
          { m: "enamorada", t: "Pero ya no lo escondo." },
          { m: "enamorada", t: "Te quiero." },
          { m: "idle", t: "Y ahora la última cosa que te voy a pedir en toda mi vida como… lo que sea que he sido este año." },
          { m: "blush", t: "Analista no oficial. Eso." },
          { m: "enamorada", t: "Quiero verte arriba del todo. En Europa. Entre semana, con el himno y las cámaras." },
          { m: "idle", t: "No para tener una entrada más. Ya tengo demasiadas." },
          { m: "enamorada", t: "Es que llevo desde el minuto setenta y uno de aquel domingo diciendo que ibas a llegar." },
          { m: "happy", t: "Y me apetece muchísimo tener razón." },
        ],
        replies: [
          { t: "Yo también te quiero.", m: "happy",
            r: [{ m: "blush", t: "…" }, { m: "enamorada", t: "Ya lo sabía." },
              { m: "angry", t: "¡No lo sabía! No sabía nada. Estaba aterrorizada." },
              { m: "happy", t: "…Lo sabía un poco." }] },
          { t: "Has tardado un año en decirlo.", m: "idle",
            r: [{ m: "angry", t: "¡Un año y tres meses!" }, { m: "angry", t: "…" },
              { m: "blush", t: "Que lo tengo contado, sí. No me juzgues." },
              { m: "enamorada", t: "Y lo volvería a tardar. Pero solo un poco menos." }] },
          { t: "Yo no he venido por el fútbol.", m: "happy",
            r: [{ m: "blush", t: "…" }, { m: "enamorada", t: "Eso es lo más bonito que me has dicho nunca." },
              { m: "angry", t: "Y encima me lo has robado. Era mi frase." },
              { m: "happy", t: "Te la dejo. Por esta vez." }] },
        ],
        snap: () => ({}),
        subs: [(g) => g.tier.id >= 5],
        check: (g) => g.tier.id >= 5,
        reward: (g) => {
          const stats = { ...g.player.stats };
          stats.MEN = Math.min(99, stats.MEN + 1);
          return { ...g, player: { ...g.player, stats } };
        } },
      /* EPÍLOGO — La caja (última etapa: final:true, sin objetivo propio; entrega el pin a
         mitad de escena, ver midReveal). El título cambia respecto a la 2.0 porque el
         gesto final ya no es conservar un regalo, sino dejar de necesitar el archivo
         entero: la caja se queda en casa del jugador. */
      { title: "La caja", zone: "casa", final: true,
        introBefore: [
          { m: "enamorada", t: "Europa." },
          { m: "happy", t: "Tenía razón. Tenía razón desde el minuto setenta y uno." },
          { m: "angry", t: "Y pienso decirlo en todas las cenas familiares durante los próximos treinta años." },
          { m: "blush", t: "…Perdona. Lo de los treinta años ha salido solo." },
          { m: "enamorada", t: "No lo retiro." },
          { m: "enamorada", t: "¿Todavía guardas la bufanda?" },
          { m: "blush", t: "La que supuestamente sobraba." },
          { m: "happy", t: "Qué mentira más mala, por favor. Y funcionó igual." },
          { m: "idle", t: "…" },
          { m: "blush", t: "He traído la caja. Otra vez, sí." },
          { m: "idle", t: "Pero hoy no la traigo para enseñártela." },
          { m: "enamorada", t: "Se queda aquí." },
          { m: "angry", t: "No me mires así. Lo he pensado mucho." },
          { m: "idle", t: "Llevo desde los nueve años guardando pruebas de que las cosas pasaban, porque nada duraba lo suficiente." },
          { m: "preocupada", t: "Seis ciudades. Nunca deshice del todo una maleta." },
          { m: "blush", t: "Y esta caja siempre ha vivido debajo de mi cama, en la casa que tocara ese año." },
          { m: "enamorada", t: "Y quiero que a partir de ahora viva aquí." },
          { m: "blush", t: "Porque dejarla en tu casa significa que voy a volver." },
          { m: "enamorada", t: "Que es lo más parecido a quedarme que sé hacer." },
          { m: "idle", t: "Ah, y una cosa más. La de arriba del todo." },
          { m: "blush", t: "Es un pin. Es diminuto y no vale nada, lo compré en una parada de metro." },
          { m: "idle", t: "Lo llevo en la mochila desde hace años. Es lo único de la caja que no está guardado, porque es lo único que quería que se viera." },
          { m: "enamorada", t: "Y ahora es tuyo." },
          { m: "angry", t: "Y como lo pierdas, no te lo perdono. Lo digo completamente en serio." },
        ],
        introAfter: [
          { m: "happy", t: "Bueno. Ya está." },
          { m: "idle", t: "No la abras sin mí, que me entero." },
          { m: "enamorada", t: "Y no dejes de marcar, que todavía queda sitio dentro." },
          { m: "blush", t: "Bastante sitio, de hecho." },
          { m: "happy", t: "He hecho hueco." },
        ],
        replies: [
          { t: "Deshaz la maleta.", m: "happy",
            r: [{ m: "blush", t: "…" }, { m: "angry", t: "No digas esas cosas así, de golpe." },
              { m: "enamorada", t: "…" }, { m: "enamorada", t: "Vale." }, { m: "blush", t: "Vale." }] },
          { t: "Es nuestro primer recuerdo.", m: "idle",
            r: [{ m: "happy", t: "La bufanda, dices." }, { m: "enamorada", t: "Sí. Es el primero de los dos." },
              { m: "blush", t: "El gol era mío. La bufanda ya era nuestra." }] },
          { t: "Minuto setenta y uno.", m: "idle",
            r: [{ m: "angry", t: "¡Deja de hacer eso!" }, { m: "blush", t: "…" },
              { m: "enamorada", t: "No dejes de hacer eso nunca." }] },
        ],
        setFlags: ["yunaStoryComplete"],
        midReveal: "yuna_pin",
        objective: null,
        check: () => true },
    ],
  }],
};

/* ============================================================
   LÓPEZ · cuarta campaña completa. Prólogo + 15 capítulos + final +
   epílogo, capitán del vestuario desde el minuto uno (trigger:()=>true,
   como Elisa) — su prólogo ("El nuevo") exige que se haya jugado ya un
   primer partido, así que aparece justo después de tu primer partido
   de carrera, no antes.

   Capítulo 11 ("La despedida") depende de un cambio de club real y no
   lleva deadlineDays a propósito: si el jugador nunca cambia de club,
   la campaña se queda esperando ahí para siempre — es el comportamiento
   pedido por el documento, no un bloqueo. El resto de la campaña (cap.
   12 en adelante) sigue funcionando igual tras un cambio de club, sin
   necesitar ningún ajuste: la presencia de López en las zonas no
   depende de game.club/game.squad, así que no hace falta simularlo
   como "mensaje remoto".

   Objetos: solo el pin final se registra como ITEM real (mismo patrón
   "keepsake" que elisa_pin/milly_pin/yuna_pin). La llave de vestuario,
   la foto y el brazalete son símbolos narrativos representados con
   flags (lopezLocker/lopezTeamPhoto/lopezArmband), tal como pide el
   documento explícitamente para el brazalete. */
const LOPEZ_STORY = {
  npc: "lopez",
  chapters: [{
    id: "cap1",
    title: "La historia de López",
    trigger: () => true,
    stages: [
      /* PRÓLOGO — El nuevo (rework de diálogos, ver
         FUTABITA_Lopez_Rework_Narrativo_para_Code.docx — no toca objetivos ni
         comportamiento, solo sustituye el texto de las escenas). Mismo fix de
         contradicción temporal que Elisa/Milly/Yuna: los bloques de reacción
         "cuando el jugador vuelve tras cumplir el objetivo" se han movido al
         PRINCIPIO de la etapa siguiente. */
      { title: "El nuevo", zone: "barrio",
        objective: "Completa tu primer partido de carrera.",
        intro: [
          { m: "happy", t: "Tú eres el nuevo, ¿no?" },
          { m: "happy", t: "Vale, tranquilo. Primera norma del vestuario: si alguien te dice que conoce todas las normas, está mintiendo." },
          { m: "idle", t: "Soy López. Capitán." },
          { m: "happy", t: "Y mi trabajo hoy es evitar que hagas alguna tontería antes de tu primer partido." },
          { m: "idle", t: "No porque crea que vayas a hacerlo." },
          { m: "happy", t: "Porque todos lo hacemos." },
          { m: "idle", t: "Cuando llegas a un vestuario nuevo, todo parece más grande de lo que es." },
          { m: "happy", t: "Gente que no conoces, bromas que no entiendes, nombres que vas a olvidar cinco minutos después." },
          { m: "serio", t: "Así que no intentes demostrar nada todavía." },
          { m: "happy", t: "Primero aprende dónde está tu sitio." },
          { m: "idle", t: "Ven. Te enseño dónde vas a pasar demasiado tiempo durante los próximos meses." },
        ],
        setFlags: ["lopezMet", "lopezLocker"],
        snap: () => ({}),
        check: (g) => (g.matchHistory || []).length > 0 },
      /* CAPÍTULO 1 — La taquilla */
      { title: "La taquilla", zone: "ciudad-dep",
        objective: "Completa 3 días cumpliendo objetivos.",
        intro: [
          { m: "happy", t: "¿Ves? Ya has sobrevivido al primero." },
          { m: "idle", t: "Te voy a dar una cosa." },
          { m: "orgulloso", t: "Esta llave significa que ya tienes sitio aquí." },
          { m: "happy", t: "No te emociones. Sigue siendo la taquilla del nuevo." },
          { m: "idle", t: "Pero es tuya." },
          { m: "idle", t: "Mira tu taquilla." },
          { m: "happy", t: "Parece una tontería, pero el día que dejas de sentir que ese sitio es tuyo se nota." },
          { m: "idle", t: "Al principio vienes, dejas las cosas y te vas." },
          { m: "serio", t: "Después empiezas a dejar algo que no es solo ropa." },
          { m: "happy", t: "Una rutina. Una broma. Una historia que solo entiende el vestuario." },
          { m: "idle", t: "Y un día te das cuenta de que si no vienes, alguien pregunta dónde estás." },
          { m: "happy", t: "Ahí sabes que ya eres parte del grupo." },
          { m: "serio", t: "Aquí nadie empieza siendo importante." },
          { m: "idle", t: "Primero eres el nuevo. Luego eres compañero. Y, si te lo ganas, un día eres uno de los que hacen que los demás estén bien." },
          { m: "happy", t: "Pero de momento eres el nuevo. No te emociones." },
          { m: "idle", t: "Quiero ver si empiezas a encontrar tu sitio sin que nadie tenga que llevarte de la mano." },
        ],
        setFlags: ["lopezStoryStarted"],
        snap: (g) => ({ since: todayStr() }),
        progressCount: (g, snap) => daysGoalsCompletedSince(g, snap.since), progressGoal: 3,
        check: (g, snap) => daysGoalsCompletedSince(g, snap.since) >= 3 },
      /* CAPÍTULO 2 — El código del vestuario */
      { title: "El código del vestuario", zone: "ciudad-dep",
        objective: "Gana un partido y completa 4 días de objetivos.",
        intro: [
          { m: "happy", t: "Bien." },
          { m: "idle", t: "Ya no pareces tan perdido." },
          { m: "happy", t: "No es exactamente un ascenso, pero algo es algo." },
          { m: "serio", t: "Sigue así. La gente empieza a confiar cuando ve que apareces todos los días." },
          { m: "happy", t: "Un vestuario tiene memoria." },
          { m: "idle", t: "Se acuerda de quién llega tarde, quién anima, quién desaparece cuando las cosas van mal..." },
          { m: "serio", t: "Y también se acuerda de quién se queda cuando nadie sabe qué decir." },
          { m: "idle", t: "Hay una parte del fútbol que no sale en las estadísticas." },
          { m: "happy", t: "Saber cuándo hacer una broma." },
          { m: "serio", t: "Saber cuándo dejar de hacerla." },
          { m: "idle", t: "Saber cuándo un compañero necesita que le digan que espabile y cuándo simplemente necesita que alguien se siente a su lado." },
          { m: "happy", t: "No hace falta que seas el mejor." },
          { m: "serio", t: "Pero intenta no ser el que desaparece." },
          { m: "idle", t: "Quiero que después de tu próximo partido el equipo sepa que puede contar contigo, gane o pierda." },
        ],
        snap: (g) => ({ since: todayStr(), matchCount: (g.matchHistory || []).length }),
        subs: [
          { count: (g, snap) => daysGoalsCompletedSince(g, snap.since), goal: 4 },
          (g, snap) => (g.matchHistory || []).slice(snap.matchCount).some((m) => m.res === "V"),
        ],
        check: (g, snap) => daysGoalsCompletedSince(g, snap.since) >= 4 &&
          (g.matchHistory || []).slice(snap.matchCount).some((m) => m.res === "V") },
      /* CAPÍTULO 3 — La foto */
      { title: "La foto", zone: "ciudad-dep",
        objective: "Completa un partido y consigue una valoración positiva.",
        intro: [
          { m: "happy", t: "Eso es." },
          { m: "idle", t: "Ahora ya no estás solamente jugando para ti." },
          { m: "serio", t: "Has empezado a entender lo que significa estar dentro de un equipo." },
          { m: "happy", t: "Y tranquilo, no voy a ponerme sentimental." },
          { m: "idle", t: "Todavía." },
          { m: "happy", t: "¡Foto! Vamos, que luego todos decís que nunca salís bien." },
          { m: "happy", t: "Ponte aquí." },
          { m: "idle", t: "¿Sabes por qué quiero que la tengas?" },
          { m: "orgulloso", t: "Porque dentro de unos años vas a mirar esta foto y vas a pensar que parecías muchísimo más nuevo de lo que creías." },
          { m: "happy", t: "Y probablemente vas a reírte de la cara que tienes ahora." },
          { m: "idle", t: "Pero también vas a mirar a todos los que salen alrededor." },
          { m: "serio", t: "Algunos seguirán aquí. Otros se habrán ido. Algunos serán titulares, otros cambiarán de club, otros quizá dejen el fútbol." },
          { m: "orgulloso", t: "Eso es lo raro de un vestuario." },
          { m: "idle", t: "Nunca sabes qué momento vas a acabar recordando." },
          { m: "happy", t: "Así que guárdala." },
          { m: "orgulloso", t: "No por postureo. Guárdala porque hoy formas parte de esto." },
          { m: "happy", t: "Y yo voy a decir dentro de unos años que ya sabía que ibas a llegar lejos." },
        ],
        setFlags: ["lopezTeamPhoto"],
        snap: (g) => ({ matchCount: (g.matchHistory || []).length }),
        subs: [
          (g, snap) => (g.matchHistory || []).length > snap.matchCount,
          (g, snap) => (g.matchHistory || []).slice(snap.matchCount).some((m) => (m.rating || 0) >= 7),
        ],
        check: (g, snap) => {
          const ms = (g.matchHistory || []).slice(snap.matchCount);
          return ms.length > 0 && ms.some((m) => (m.rating || 0) >= 7);
        } },
      /* CAPÍTULO 4 — Cuando el capitán habla */
      { title: "Cuando el capitán habla", zone: "ciudad-dep",
        objective: "Completa una racha de 5 días.",
        intro: [
          { m: "orgulloso", t: "Buena valoración." },
          { m: "happy", t: "Y mira la foto." },
          { m: "idle", t: "Ya tienes una buena actuación para recordar." },
          { m: "orgulloso", t: "Algún día esa foto va a significar más de lo que parece." },
          { m: "capitan", t: "Ser capitán no significa ser el que más grita." },
          { m: "capitan", t: "Ni el que manda a los demás." },
          { m: "serio", t: "Significa que cuando alguien tiene un mal día, alguien tiene que darse cuenta." },
          { m: "idle", t: "Y cuando el equipo pierde, alguien tiene que seguir hablando con todos al día siguiente." },
          { m: "serio", t: "Es fácil liderar cuando todo sale bien." },
          { m: "capitan", t: "Lo difícil es mantener unido al grupo cuando empieza a aparecer la duda." },
          { m: "idle", t: "Yo también he tenido días en los que no sabía qué decir." },
          { m: "happy", t: "La diferencia es que cuando llevas el brazalete no puedes fingir que no pasa nada." },
          { m: "serio", t: "Por eso quiero que empieces a entender una cosa." },
          { m: "capitan", t: "Liderar no empieza cuando alguien te da un brazalete." },
          { m: "serio", t: "Empieza cuando los demás empiezan a mirar qué haces tú cuando las cosas se complican." },
          { m: "happy", t: "Así que sí. Es bastante menos glamuroso de lo que parece." },
        ],
        setFlags: ["lopezCaptainTalk"],
        snap: () => ({}),
        progressCount: (g) => g.player.streak || 0, progressGoal: 5,
        check: (g) => (g.player.streak || 0) >= 5 },
      /* CAPÍTULO 5 — La mala tarde */
      { title: "La mala tarde", zone: "ciudad-dep",
        objective: "Completa un entrenamiento y juega el siguiente partido.",
        intro: [
          { m: "serio", t: "Ahí está." },
          { m: "orgulloso", t: "No has hecho nada espectacular." },
          { m: "idle", t: "Precisamente por eso me gusta." },
          { m: "capitan", t: "Has estado ahí cinco días seguidos. Eso también es liderazgo." },
          { m: "agotado", t: "Hoy no me hagas correr más de la cuenta." },
          { m: "happy", t: "Es una broma. Más o menos." },
          { m: "agotado", t: "La verdad es que llevo unos días bastante fundido." },
          { m: "preocupado", t: "Y hay algo que nadie te explica cuando empiezas a jugar a este nivel." },
          { m: "idle", t: "Hay días en los que todo el mundo espera que estés bien porque eres el capitán." },
          { m: "preocupado", t: "Aunque tú no estés bien." },
          { m: "agotado", t: "Tienes que animar a los demás, entrenar, competir y poner buena cara." },
          { m: "idle", t: "Y a veces llegas al vestuario y lo único que quieres es sentarte cinco minutos sin que nadie te pregunte nada." },
          { m: "preocupado", t: "Supongo que también tengo que aprender a decirlo." },
          { m: "happy", t: "No soy de hierro, aunque me guste hacer como que sí." },
          { m: "idle", t: "Hoy no necesito que me soluciones nada." },
          { m: "preocupado", t: "Solo quiero que entiendas que hasta el capitán tiene días malos." },
        ],
        snap: (g) => ({ since: todayStr(), matchCount: (g.matchHistory || []).length }),
        subs: [
          (g, snap) => Object.entries(g.logs || {}).some(([d, l]) => d >= snap.since && l.gym),
          (g, snap) => (g.matchHistory || []).length > snap.matchCount,
        ],
        check: (g, snap) => Object.entries(g.logs || {}).some(([d, l]) => d >= snap.since && l.gym) &&
          (g.matchHistory || []).length > snap.matchCount },
      /* CAPÍTULO 6 — El vestuario después de una derrota */
      { title: "El vestuario después de una derrota", zone: "ciudad-dep",
        objective: "Pierde un partido y completa 2 días de objetivos.",
        intro: [
          { m: "agotado", t: "Gracias." },
          { m: "happy", t: "No has intentado arreglarme la vida. Bien hecho." },
          { m: "serio", t: "Has hecho algo más útil." },
          { m: "idle", t: "Has seguido trabajando." },
          { m: "orgulloso", t: "Eso es lo que espero de un compañero." },
          { m: "preocupado", t: "No me importa que hoy haya salido mal." },
          { m: "serio", t: "Me importa lo que hagamos mañana." },
          { m: "idle", t: "Cuando ganas, todo el mundo sabe abrazarse." },
          { m: "capitan", t: "Cuando pierdes es cuando sabes quién forma parte del equipo." },
          { m: "preocupado", t: "Hoy hay gente que va a entrar aquí pensando que ha fallado." },
          { m: "serio", t: "Y no quiero que mañana nadie tenga miedo de volver a intentarlo." },
          { m: "idle", t: "Una derrota no te dice quién eres." },
          { m: "capitan", t: "Lo que haces después sí." },
          { m: "happy", t: "Así que mañana quiero verte aquí." },
          { m: "happy", t: "Y con cara de no haber perdido la final del mundo." },
          { m: "serio", t: "Si quieres formar parte de este vestuario, tienes que saber ganar juntos." },
          { m: "capitan", t: "Pero también tienes que saber perder juntos." },
        ],
        snap: (g) => ({ since: todayStr(), matchCount: (g.matchHistory || []).length }),
        subs: [
          (g, snap) => (g.matchHistory || []).slice(snap.matchCount).some((m) => m.res === "D"),
          { count: (g, snap) => daysGoalsCompletedSince(g, snap.since), goal: 2 },
        ],
        check: (g, snap) => (g.matchHistory || []).slice(snap.matchCount).some((m) => m.res === "D") &&
          daysGoalsCompletedSince(g, snap.since) >= 2 },
      /* CAPÍTULO 7 — El brazalete */
      { title: "El brazalete", zone: "ciudad-dep",
        objective: "Alcanza un hito de OVR o gana 2 partidos.",
        intro: [
          { m: "idle", t: "Has vuelto." },
          { m: "happy", t: "Y no pareces tan dramático como ayer." },
          { m: "serio", t: "Bien." },
          { m: "orgulloso", t: "No has intentado borrar la derrota. Has respondido a ella." },
          { m: "capitan", t: "Eso es lo que hace un equipo." },
          { m: "capitan", t: "¿Sabes por qué guardo esto con tanto cuidado?" },
          { m: "capitan", t: "Porque no es mío." },
          { m: "serio", t: "Me lo dejaron." },
          { m: "idle", t: "Igual que algún día yo se lo dejaré a otro." },
          { m: "serio", t: "Cuando era más joven pensaba que el brazalete significaba ser el jugador más importante." },
          { m: "orgulloso", t: "Luego entendí que no." },
          { m: "capitan", t: "El brazalete dice que la gente confía en ti cuando las cosas se ponen feas." },
          { m: "serio", t: "No porque tengas todas las respuestas." },
          { m: "idle", t: "Porque saben que no vas a desaparecer cuando no las tengas." },
          { m: "capitan", t: "Y eso no se consigue de golpe." },
          { m: "orgulloso", t: "Se consigue con semanas como las que llevas teniendo." },
          { m: "idle", t: "Cada entrenamiento. Cada partido. Cada vez que vuelves después de una derrota." },
          { m: "serio", t: "Eso es lo que hace que alguien empiece a merecer que otros lo sigan." },
        ],
        setFlags: ["lopezArmband"],
        snap: (g) => ({ ovr: calcOVR(g.player.stats), matchCount: (g.matchHistory || []).length }),
        check: (g, snap) => calcOVR(g.player.stats) > snap.ovr ||
          (g.matchHistory || []).slice(snap.matchCount).filter((m) => m.res === "V").length >= 2 },
      /* CAPÍTULO 8 — El nuevo líder */
      { title: "El nuevo líder", zone: "parque",
        objective: "Completa una racha de 6 días.",
        intro: [
          { m: "orgulloso", t: "Bien." },
          { m: "capitan", t: "Esto no significa que vayas a llevar el brazalete mañana." },
          { m: "idle", t: "Significa que ya entiendo por qué algunos empiezan a mirarte cuando necesitan una respuesta." },
          { m: "happy", t: "Tengo una noticia terrible." },
          { m: "happy", t: "Ya no eres el nuevo." },
          { m: "orgulloso", t: "Y eso significa que ahora me toca encontrar a otro al que molestar." },
          { m: "idle", t: "Aunque, sinceramente, creo que ya te has ganado el derecho a devolverme alguna." },
          { m: "serio", t: "Pero también significa algo más." },
          { m: "orgulloso", t: "Puedo confiarte cosas que antes no podía." },
          { m: "idle", t: "Al principio te enseñaba cómo sobrevivir en el vestuario." },
          { m: "serio", t: "Ahora empiezo a pensar que podrías ayudar a alguien que llegue después de ti." },
          { m: "happy", t: "Y eso es bastante gracioso." },
          { m: "idle", t: "Porque yo todavía me acuerdo de tu primer día." },
          { m: "orgulloso", t: "Parecías estar intentando averiguar dónde sentarte sin que nadie lo notara." },
          { m: "happy", t: "Ahora hay gente que te busca." },
          { m: "serio", t: "Eso es crecer dentro de un equipo." },
        ],
        setFlags: ["lopezTrust"],
        snap: () => ({}),
        progressCount: (g) => g.player.streak || 0, progressGoal: 6,
        check: (g) => (g.player.streak || 0) >= 6 },
      /* CAPÍTULO 9 — Playa sin uniforme */
      { title: "Playa sin uniforme", zone: "playa",
        objective: "Completa un hito de carrera y una victoria.",
        intro: [
          { m: "orgulloso", t: "Ya está." },
          { m: "happy", t: "Definitivamente ya no eres el nuevo." },
          { m: "serio", t: "Ahora tienes que decidir qué clase de compañero quieres ser para los que vengan después." },
          { m: "playa", t: "Aquí hay una norma muy importante." },
          { m: "playa", t: "Hoy no hablamos de fútbol." },
          { m: "playa", t: "Si digo 'partido', me tiras al agua." },
          { m: "playa", t: "Y no, no estoy bromeando." },
          { m: "playa", t: "Llevo tanto tiempo pensando en el equipo que a veces se me olvida que existe una vida fuera." },
          { m: "playa", t: "Y eso es peligroso." },
          { m: "playa", t: "Porque si todo lo que eres está relacionado con el fútbol, el día que las cosas van mal parece que se cae todo lo demás." },
          { m: "playa", t: "Así que hoy quiero hacer algo bastante revolucionario." },
          { m: "playa", t: "No hacer nada relacionado con nuestra carrera." },
          { m: "playa", t: "Bueno... casi nada." },
          { m: "playa", t: "Si ganas mañana, prometo no mencionarlo." },
        ],
        snap: (g) => ({ tierId: g.tier.id, seasonNum: g.season.num, matchCount: (g.matchHistory || []).length }),
        subs: [
          (g, snap) => g.tier.id !== snap.tierId || g.season.num !== snap.seasonNum,
          (g, snap) => (g.matchHistory || []).slice(snap.matchCount).some((m) => m.res === "V"),
        ],
        check: (g, snap) => (g.tier.id !== snap.tierId || g.season.num !== snap.seasonNum) &&
          (g.matchHistory || []).slice(snap.matchCount).some((m) => m.res === "V") },
      /* CAPÍTULO 10 — Cuando cambia el vestuario */
      { title: "Cuando cambia el vestuario", zone: "ciudad-dep",
        objective: "Sube +2 tu media (OVR) o completa la temporada.",
        intro: [
          { m: "playa", t: "¿Ves?" },
          { m: "playa", t: "Un día sin hablar de fútbol y seguimos vivos." },
          { m: "playa", t: "Deberíamos hacer esto más a menudo." },
          { m: "playa", t: "Aunque si alguien pregunta, hemos estado entrenando la recuperación mental." },
          { m: "serio", t: "Puede que algún día te vayas." },
          { m: "preocupado", t: "Y si llega ese día, no voy a ser el tío que te diga que te quedes solo porque me da pena." },
          { m: "idle", t: "Sería bastante egoísta." },
          { m: "orgulloso", t: "Si tienes una oportunidad para crecer, tienes que cogerla." },
          { m: "serio", t: "Yo también tuve que decidir cosas así." },
          { m: "idle", t: "Y no siempre fue fácil dejar atrás un vestuario." },
          { m: "preocupado", t: "Porque cuando llevas tiempo con un grupo, empiezas a pensar que irte significa perderlo." },
          { m: "orgulloso", t: "Pero no funciona así." },
          { m: "serio", t: "Un vestuario que te ha marcado no desaparece porque cambies de camiseta." },
          { m: "happy", t: "Eso sí: si te vas a un club mejor, mínimo me mandas una foto del vestuario." },
          { m: "happy", t: "Quiero comprobar si las taquillas son mejores que las nuestras." },
          { m: "serio", t: "Pero antes de pensar en irte, asegúrate de que realmente estás preparado." },
        ],
        snap: (g) => ({ seasonNum: g.season.num, ovr: calcOVR(g.player.stats) }),
        check: (g, snap) => calcOVR(g.player.stats) >= snap.ovr + 2 || g.season.num !== snap.seasonNum },
      /* CAPÍTULO 11 — La despedida (sin deadlineDays a propósito: espera a un cambio de
         club real, aunque tarde meses o no llegue nunca — ver nota al inicio del bloque) */
      { title: "La despedida", zone: "ciudad-dep",
        objective: "Cambia de club.",
        intro: [
          { m: "orgulloso", t: "Bien." },
          { m: "idle", t: "Ahora ya hay algo que decidir." },
          { m: "serio", t: "Y si llega la oportunidad, quiero que la elijas por lo que necesitas tú." },
          { m: "preocupado", t: "Bueno... ha llegado." },
          { m: "serio", t: "No te voy a soltar un discurso de película." },
          { m: "idle", t: "Ni voy a fingir que me parece fantástico que te vayas." },
          { m: "orgulloso", t: "Pero sí estoy orgulloso." },
          { m: "serio", t: "Porque cuando llegaste aquí necesitabas que alguien te enseñara dónde estaba tu sitio." },
          { m: "idle", t: "Y ahora te vas porque has encontrado uno nuevo." },
          { m: "orgulloso", t: "Eso significa que hemos hecho las cosas bien." },
          { m: "preocupado", t: "El primer vestuario siempre se queda contigo." },
          { m: "idle", t: "Vas a conocer gente nueva. Vas a volver a ser el nuevo. Y probablemente volverás a pensar que nadie sabe quién eres." },
          { m: "happy", t: "Y entonces recordarás que ya has pasado por esto." },
          { m: "orgulloso", t: "Así que vete." },
          { m: "happy", t: "Crece. Hazte mejor. Y si te conviertes en una estrella insoportable, recuerda que yo te conocí cuando todavía no sabías dónde estaba tu taquilla." },
        ],
        setFlags: ["lopezOldClub"],
        snap: (g) => ({ clubName: g.club.name }),
        check: (g, snap) => g.club.name !== snap.clubName },
      /* CAPÍTULO 12 — El nuevo vestuario */
      { title: "El nuevo vestuario", zone: "ciudad-dep",
        objective: "Completa un partido con el nuevo club.",
        intro: [
          { m: "serio", t: "Cuida de tu nuevo vestuario." },
          { m: "happy", t: "Y mándame esa foto." },
          { m: "orgulloso", t: "Quiero verla." },
          { m: "happy", t: "Bueno, campeón. ¿Qué tal la nueva taquilla?" },
          { m: "happy", t: "¿Ya te has aprendido los nombres o sigues llamando a todo el mundo 'tío'?" },
          { m: "idle", t: "Te dije que un vestuario nuevo se construye desde cero." },
          { m: "serio", t: "Y ahora entiendes algo que antes no podías entender." },
          { m: "idle", t: "Cuando llegas a un grupo nuevo, nadie sabe todavía qué puedes aportar." },
          { m: "orgulloso", t: "No puedes exigir confianza." },
          { m: "serio", t: "Tienes que construirla." },
          { m: "happy", t: "Como hiciste aquí." },
          { m: "idle", t: "Ahora te toca a ti hacer que otro jugador deje de sentirse nuevo." },
          { m: "orgulloso", t: "No necesitas copiarme." },
          { m: "serio", t: "Hazlo a tu manera." },
          { m: "happy", t: "Aunque si quieres copiar alguna de mis bromas, adelante. Tengo demasiadas." },
        ],
        snap: (g) => ({ matchCount: (g.matchHistory || []).length }),
        check: (g, snap) => (g.matchHistory || []).length > snap.matchCount },
      /* CAPÍTULO 13 — Tu turno */
      { title: "Tu turno", zone: "ciudad-dep",
        objective: "Gana tras una derrota o completa una racha de 5 días.",
        intro: [
          { m: "happy", t: "¿Y?" },
          { m: "orgulloso", t: "Has jugado." },
          { m: "idle", t: "Ahora ya tienes el primer ladrillo de tu nuevo vestuario." },
          { m: "serio", t: "El resto depende de ti." },
          { m: "serio", t: "Tengo una pregunta." },
          { m: "serio", t: "Si fueras tú el capitán, ¿qué harías después de una derrota así?" },
          { m: "idle", t: "No quiero que me digas lo que crees que quiero oír." },
          { m: "orgulloso", t: "Quiero saber qué harías tú." },
          { m: "serio", t: "Porque llevo bastante tiempo hablando yo." },
          { m: "idle", t: "Y últimamente me he dado cuenta de que ya no necesitas tantas respuestas." },
          { m: "orgulloso", t: "Necesitas aprender a encontrarlas." },
          { m: "serio", t: "Yo puedo decirte lo que hice cuando estaba en tu situación." },
          { m: "idle", t: "Pero eso no significa que sea lo correcto para ti." },
          { m: "orgulloso", t: "Así que dime qué harías." },
        ],
        setFlags: ["lopezMentorTurn"],
        snap: (g) => ({ matchCount: (g.matchHistory || []).length }),
        check: (g, snap) => {
          const ms = (g.matchHistory || []).slice(snap.matchCount);
          for (let i = 0; i < ms.length - 1; i++) if (ms[i].res === "D" && ms[i + 1].res === "V") return true;
          return (g.player.streak || 0) >= 5;
        } },
      /* CAPÍTULO 14 — Lo que queda */
      { title: "Lo que queda", zone: "parque",
        objective: "Alcanza un nuevo máximo de OVR o de nota.",
        intro: [
          { m: "orgulloso", t: "Esa era la respuesta que quería escuchar." },
          { m: "idle", t: "No porque sea igual que la mía." },
          { m: "serio", t: "Porque es tuya." },
          { m: "orgulloso", t: "Creo que ha llegado el momento de dejar de enseñarte y empezar a preguntarte cosas." },
          { m: "orgulloso", t: "¿Te acuerdas de cuando te enseñé la taquilla?" },
          { m: "happy", t: "Parecías acojonado." },
          { m: "orgulloso", t: "Ahora mírate." },
          { m: "idle", t: "Has cambiado de club. Has ganado. Has perdido. Has vuelto a levantarte." },
          { m: "serio", t: "Y, sobre todo, has aprendido a estar con un equipo." },
          { m: "orgulloso", t: "Eso es lo que más me gusta de esta historia." },
          { m: "happy", t: "No que seas mejor jugador." },
          { m: "serio", t: "Que ya no necesitas que yo te diga dónde colocarte." },
          { m: "orgulloso", t: "Ya sabes dónde está tu sitio." },
          { m: "idle", t: "Y si mañana llega otro nuevo, probablemente seas tú quien le enseñe la taquilla." },
          { m: "happy", t: "Procura no darle demasiadas bromas el primer día." },
          { m: "orgulloso", t: "Aunque alguna tendrás que contarle." },
        ],
        setFlags: ["lopezLeader"],
        snap: (g) => ({ ovr: calcOVR(g.player.stats), bestRating: g.bestRating || 0 }),
        check: (g, snap) => calcOVR(g.player.stats) > snap.ovr || (g.bestRating || 0) > snap.bestRating },
      /* CAPÍTULO 15 — El brazalete pasa de mano */
      { title: "El brazalete pasa de mano", zone: "ciudad-dep",
        objective: "Completa una racha de 7 días y gana un partido.",
        intro: [
          { m: "orgulloso", t: "Bien." },
          { m: "serio", t: "Ahora sí puedo decir que confío completamente en ti." },
          { m: "happy", t: "Y eso que al principio no sabía ni dónde dejarte." },
          { m: "capitan", t: "Te voy a decir algo que no digo mucho." },
          { m: "capitan", t: "Estoy orgulloso de ti." },
          { m: "serio", t: "No porque seas el mejor del vestuario." },
          { m: "orgulloso", t: "Porque cuando te tocó estar abajo, aprendiste a quedarte." },
          { m: "capitan", t: "Cuando perdiste, volviste." },
          { m: "serio", t: "Cuando llegaste a otro vestuario, empezaste otra vez." },
          { m: "orgulloso", t: "Y cuando otros empezaron a necesitarte, no te apartaste." },
          { m: "capitan", t: "Eso es lo que hace un capitán." },
          { m: "idle", t: "No hace falta que lleves el brazalete para entenderlo." },
          { m: "orgulloso", t: "De hecho, quizá el día que más merezcas llevarlo sea el día que ya no necesites que nadie te lo diga." },
          { m: "capitan", t: "Así que toma." },
          { m: "serio", t: "No es tuyo." },
          { m: "orgulloso", t: "Todavía." },
          { m: "happy", t: "Pero puedes sostenerlo un rato." },
        ],
        snap: (g) => ({ matchCount: (g.matchHistory || []).length }),
        subs: [
          { count: (g) => g.player.streak || 0, goal: 7 },
          (g, snap) => (g.matchHistory || []).slice(snap.matchCount).some((m) => m.res === "V"),
        ],
        check: (g, snap) => (g.player.streak || 0) >= 7 &&
          (g.matchHistory || []).slice(snap.matchCount).some((m) => m.res === "V") },
      /* FINAL — Ya no eres el nuevo */
      { title: "Ya no eres el nuevo", zone: "ciudad-dep",
        objective: "Alcanza el nivel de élite.",
        intro: [
          { m: "orgulloso", t: "Perfecto." },
          { m: "capitan", t: "Ahora sí." },
          { m: "serio", t: "Ya sabes lo que significa." },
          { m: "happy", t: "Mira quién ha venido." },
          { m: "happy", t: "El nuevo." },
          { m: "orgulloso", t: "Bueno... ya no." },
          { m: "capitan", t: "He tenido compañeros que llegaron, se fueron, ganaron títulos y desaparecieron." },
          { m: "serio", t: "Pero algunos se quedan contigo." },
          { m: "orgulloso", t: "Tú eres uno de esos." },
          { m: "idle", t: "Cuando llegaste te di una llave porque necesitabas saber que tenías un sitio." },
          { m: "happy", t: "Después hicimos una foto porque pensé que algún día te gustaría recordar cómo empezó todo." },
          { m: "serio", t: "Y después te hablé del brazalete porque quería que entendieras que pertenecer a un equipo no es solo jugar." },
          { m: "orgulloso", t: "Ahora ya no tengo que explicarte nada de eso." },
          { m: "happy", t: "Así que enhorabuena." },
          { m: "orgulloso", t: "Ya sabes dónde está tu taquilla." },
          { m: "happy", t: "Aunque sigue sin gustarme cómo la tienes ordenada." },
          { m: "orgulloso", t: "Y eso sí que no va a cambiar." },
        ],
        snap: () => ({}),
        check: (g) => g.tier.id >= TIERS[TIERS.length - 1].id },
      /* EPÍLOGO — La foto (última etapa: final:true, entrega el pin y +1 FIS al entrar aquí) */
      { title: "La foto", zone: "casa", final: true,
        intro: [
          { m: "orgulloso", t: "Has llegado muy lejos." },
          { m: "serio", t: "Y me alegra haber estado aquí cuando empezaste." },
          { m: "happy", t: "Ahora vete antes de que me ponga sentimental y pierda mi reputación." },
          { m: "happy", t: "¿Sigues teniendo la foto?" },
          { m: "orgulloso", t: "Entonces sí que has entendido algo." },
          { m: "idle", t: "Mira esa cara." },
          { m: "happy", t: "Eras completamente nuevo." },
          { m: "orgulloso", t: "Y ahora ya no." },
          { m: "serio", t: "Hay cosas que no sirven para subir de OVR." },
          { m: "happy", t: "No te dan goles. No mejoran tus estadísticas. No te hacen correr más rápido." },
          { m: "orgulloso", t: "Pero hacen que todo lo demás haya merecido la pena." },
          { m: "happy", t: "Guárdala." },
          { m: "orgulloso", t: "Esa foto es parte de tu carrera tanto como cualquier partido." },
        ],
        setFlags: ["lopezPinEarned", "lopezStoryComplete"],
        grantItem: "lopez_pin", reveal: "lopez_pin",
        reward: (g) => {
          const stats = { ...g.player.stats };
          stats.FIS = Math.min(99, stats.FIS + 1);
          return { ...g, player: { ...g.player, stats } };
        } },
    ],
  }],
};

/* ============================================================
   IGOR · quinta campaña completa. Prólogo + 15 capítulos + final +
   epílogo, sin cambios de motor: reutiliza tal cual la arquitectura de
   Elisa/Milly/Yuna/López. Conocido desde el minuto uno (trigger:()=>
   true) — su prólogo transcurre en el Restaurante, que se autodesbloquea
   al encolarse esa misma escena (igual que "kiosco" con Milly).

   Solo el pin final se registra como ITEM real ("keepsake", igual que
   los demás). Receta/plato/delantal son símbolos narrativos con flags
   propias (igorRecipe/igorSignatureDish/igorApron), tal como pide el
   documento — guindilla/taza de café/mancuerna/libreta táctica ya
   existen como objetos reutilizables de otras campañas y no necesitan
   nada nuevo. */
const IGOR_STORY = {
  npc: "igor",
  chapters: [{
    id: "cap1",
    title: "La historia de Igor",
    trigger: () => true,
    stages: [
      /* PRÓLOGO — La cocina del delantero (rework de diálogos, ver
         FUTABITA_Igor_Rework_Narrativo_para_Code.docx — no toca objetivos ni
         comportamiento, solo sustituye el texto de las escenas). Mismo fix de
         contradicción temporal que Elisa/Milly/Yuna/López: los bloques de
         reacción "cuando el jugador vuelve tras cumplir el objetivo" se han
         movido al PRINCIPIO de la etapa siguiente. */
      { title: "La cocina del delantero", zone: "restaurante",
        objective: "Cumple tu objetivo de proteína en un día cerrado.",
        intro: [
          { m: "happy", t: "¡Ah! Tú eres el jugador del que me han hablado." },
          { m: "happy", t: "Ven, ven. No te preocupes, no voy a juzgarte por lo que hayas comido hoy." },
          { m: "idle", t: "Todavía." },
          { m: "happy", t: "Soy Igor. Chef, cocinero, especialista en convertir una comida aburrida en una victoria táctica." },
          { m: "idle", t: "Tú juegas los partidos. Yo intento que llegues a ellos con gasolina." },
          { m: "happy", t: "Pero antes de empezar a darte consejos, quiero saber una cosa." },
          { m: "idle", t: "¿Cómo comes cuando nadie te está mirando?" },
          { m: "happy", t: "Porque es muy fácil decir que vas a cuidarte." },
          { m: "serio", t: "Lo difícil es hacerlo cuando tienes prisa, cuando estás cansado o cuando simplemente no te apetece cocinar." },
          { m: "happy", t: "Así que no voy a darte una conferencia." },
          { m: "idle", t: "Primero quiero ver cómo empiezas." },
        ],
        setFlags: ["igorMet", "metIgor", "igorStoryStarted"],
        snap: () => ({ since: todayStr() }),
        check: (g, snap) => Object.entries(g.logs || {}).some(([d, l]) =>
          d >= snap.since && l.closed && (l.prot || 0) >= g.player.goals.protein) },
      /* CAPÍTULO 1 — La alineación del plato */
      { title: "La alineación del plato", zone: "restaurante",
        objective: "Cumple el objetivo de proteína durante 3 días.",
        intro: [
          { m: "happy", t: "Bien." },
          { m: "orgulloso", t: "Has empezado." },
          { m: "idle", t: "Ahora ya puedo ayudarte de verdad." },
          { m: "happy", t: "Y tranquilo. No voy a perseguirte con una báscula." },
          { m: "chef", t: "Mira esto." },
          { m: "chef", t: "Proteína atrás. Carbohidratos en el medio. Grasas haciendo su trabajo sin llamar demasiado la atención." },
          { m: "happy", t: "¿Ves? Un equipo." },
          { m: "idle", t: "Una comida también tiene posiciones." },
          { m: "happy", t: "Si quitas una pieza, igual puedes jugar." },
          { m: "idle", t: "Pero luego no me vengas diciendo que el segundo tiempo se te hizo largo." },
          { m: "serio", t: "Lo importante no es que cada plato sea perfecto." },
          { m: "idle", t: "Es que empieces a entender qué necesita tu cuerpo para que no tenga que jugar siempre en inferioridad." },
          { m: "happy", t: "Y para eso quiero que pruebes una cosa." },
          { m: "idle", t: "No quiero que cambies todo de golpe." },
          { m: "serio", t: "Solo quiero ver si puedes mantener una alimentación con suficiente proteína durante varios días." },
          { m: "happy", t: "Constancia. Esa palabra aburrida que gana más partidos de los que parece." },
        ],
        setFlags: ["igorRecipe"],
        snap: () => ({ since: todayStr() }),
        progressCount: (g, snap) => proteinDaysSince(g, snap.since), progressGoal: 3,
        check: (g, snap) => proteinDaysSince(g, snap.since) >= 3 },
      /* CAPÍTULO 2 — La receta */
      { title: "La receta", zone: "casa",
        objective: "Cumple el objetivo de proteína durante 3 días.",
        intro: [
          { m: "orgulloso", t: "Tres días." },
          { m: "happy", t: "Perfecto." },
          { m: "idle", t: "Ahora ya sé que no fue una casualidad." },
          { m: "chef", t: "Toma." },
          { m: "happy", t: "Te he traído algo." },
          { m: "idle", t: "No es una dieta." },
          { m: "happy", t: "Es una receta." },
          { m: "serio", t: "Hay una diferencia enorme." },
          { m: "happy", t: "Una dieta te dice qué tienes que hacer." },
          { m: "idle", t: "Una receta te invita a querer hacerlo." },
          { m: "serio", t: "Quiero que tengas algo que puedas repetir cuando no tengas ganas de pensar." },
          { m: "happy", t: "Porque cuidar la alimentación no debería convertirse en otra tarea que odiar." },
          { m: "idle", t: "Pruébala." },
          { m: "happy", t: "Y si no te gusta, me lo dices." },
          { m: "serio", t: "No me ofendo." },
          { m: "happy", t: "Bueno... me ofendo un poco." },
          { m: "idle", t: "Pero puedo arreglarla." },
        ],
        snap: () => ({ since: todayStr() }),
        progressCount: (g, snap) => proteinDaysSince(g, snap.since), progressGoal: 3,
        check: (g, snap) => proteinDaysSince(g, snap.since) >= 3 },
      /* CAPÍTULO 3 — La guindilla */
      { title: "La guindilla", zone: "restaurante",
        objective: "Completa un entrenamiento y una comida objetivo.",
        intro: [
          { m: "orgulloso", t: "¿Ves?" },
          { m: "happy", t: "Ya tienes una comida que sabes preparar." },
          { m: "idle", t: "Eso me gusta más que cualquier número." },
          { m: "serio", t: "Porque significa que empiezas a poder cuidarte sin necesitar que yo esté delante." },
          { m: "happy", t: "Aunque seguiré apareciendo. No te libras tan fácil." },
          { m: "happy", t: "Hoy vamos a hablar de un ingrediente peligroso." },
          { m: "happy", t: "La guindilla." },
          { m: "idle", t: "Pequeña. Inocente. Mentira." },
          { m: "happy", t: "En fútbol sería ese jugador que parece que no va a hacer nada y en el minuto noventa te destroza el partido." },
          { m: "idle", t: "Pero no te la he traído solo para hacer una comparación absurda." },
          { m: "happy", t: "Quiero que entiendas algo." },
          { m: "serio", t: "Comer bien no significa que todo tenga que ser serio." },
          { m: "idle", t: "Puedes disfrutar de la comida." },
          { m: "happy", t: "Puedes probar algo nuevo." },
          { m: "serio", t: "Puedes incluso equivocarte con una receta y sobrevivir." },
          { m: "happy", t: "Aunque si te pasas con la guindilla, no prometo nada." },
          { m: "idle", t: "Quiero que entrenar y comer de forma adecuada empiecen a formar parte de tu rutina sin que todo parezca una obligación." },
        ],
        snap: () => ({ since: todayStr() }),
        subs: [
          (g, snap) => Object.entries(g.logs || {}).some(([d, l]) => d >= snap.since && l.gym),
          (g, snap) => Object.entries(g.logs || {}).some(([d, l]) => d >= snap.since && l.closed && (l.prot || 0) >= g.player.goals.protein),
        ],
        check: (g, snap) => Object.entries(g.logs || {}).some(([d, l]) => d >= snap.since && l.gym) &&
          Object.entries(g.logs || {}).some(([d, l]) => d >= snap.since && l.closed && (l.prot || 0) >= g.player.goals.protein) },
      /* CAPÍTULO 4 — Cocina de dos */
      { title: "Cocina de dos", zone: "casa",
        objective: "Completa un día de objetivos y una comida objetivo.",
        intro: [
          { m: "happy", t: "Perfecto." },
          { m: "idle", t: "Entrenamiento hecho y comida hecha." },
          { m: "orgulloso", t: "Eso es exactamente lo que quería ver." },
          { m: "happy", t: "La guindilla, por cierto, ha sobrevivido." },
          { m: "idle", t: "De momento." },
          { m: "chef", t: "Hoy no vienes a comer." },
          { m: "happy", t: "Hoy vienes a trabajar." },
          { m: "happy", t: "Tranquilo. Yo también empecé quemando cosas." },
          { m: "serio", t: "La cocina tiene algo parecido al fútbol: no puedes aprender mirando." },
          { m: "chef", t: "Así que ponte aquí. Y no toques eso." },
          { m: "happy", t: "Bueno, puedes tocarlo. Pero si lo rompes, no lo has tocado tú." },
          { m: "idle", t: "Hasta ahora te he estado diciendo qué comer." },
          { m: "serio", t: "Hoy quiero que veas cuánto trabajo hay detrás de una comida sencilla." },
          { m: "chef", t: "Cortar, preparar, esperar, probar." },
          { m: "happy", t: "Y volver a empezar cuando algo sale mal." },
          { m: "serio", t: "Es exactamente lo que haces cuando entrenas." },
          { m: "idle", t: "Nadie mejora porque un día le salga todo perfecto." },
          { m: "happy", t: "Mejora porque vuelve al día siguiente." },
        ],
        setFlags: ["igorKitchen"],
        snap: () => ({ since: todayStr() }),
        subs: [
          (g, snap) => daysGoalsCompletedSince(g, snap.since) >= 1,
          (g, snap) => Object.entries(g.logs || {}).some(([d, l]) => d >= snap.since && l.closed && (l.prot || 0) >= g.player.goals.protein),
        ],
        check: (g, snap) => daysGoalsCompletedSince(g, snap.since) >= 1 &&
          Object.entries(g.logs || {}).some(([d, l]) => d >= snap.since && l.closed && (l.prot || 0) >= g.player.goals.protein) },
      /* CAPÍTULO 5 — El plato estrella */
      { title: "El plato estrella", zone: "restaurante",
        objective: "Aumenta al menos 1 kg desde aquí o alcanza un hito de OVR.",
        intro: [
          { m: "orgulloso", t: "Mira eso." },
          { m: "happy", t: "No está perfecto." },
          { m: "idle", t: "Pero lo has hecho tú." },
          { m: "orgulloso", t: "Y eso vale muchísimo más de lo que parece." },
          { m: "happy", t: "Ya puedes volver a comer como cliente. Por hoy." },
          { m: "chef", t: "Este es mi plato." },
          { m: "orgulloso", t: "No porque sea el más caro. Ni el más complicado." },
          { m: "idle", t: "Lo hice cuando todavía estaba intentando demostrarme que podía ser chef." },
          { m: "serio", t: "Recuerdo perfectamente aquel día." },
          { m: "happy", t: "Me salió mal la primera vez." },
          { m: "idle", t: "La segunda también." },
          { m: "happy", t: "La tercera fue comestible." },
          { m: "orgulloso", t: "Y la cuarta fue la primera vez que alguien me pidió repetir." },
          { m: "idle", t: "Ahí entendí que quizá tenía algo." },
          { m: "serio", t: "Por eso este plato significa tanto para mí." },
          { m: "happy", t: "No porque sea perfecto." },
          { m: "orgulloso", t: "Porque me recuerda que algo puede empezar siendo mediocre y acabar convirtiéndose en parte de ti." },
          { m: "idle", t: "Tú estás en una etapa parecida." },
          { m: "serio", t: "Todavía estás construyendo tu cuerpo, tu carrera y tus hábitos." },
          { m: "happy", t: "No necesitas hacerlo todo perfecto." },
          { m: "orgulloso", t: "Necesitas seguir mejorando." },
        ],
        setFlags: ["igorSignatureDish"],
        snap: (g) => ({ weight: (g.player.weightLog || []).length ? g.player.weightLog[g.player.weightLog.length - 1].kg : g.player.weight0,
          ovr: calcOVR(g.player.stats) }),
        check: (g, snap) => {
          const lastKg = (g.player.weightLog || []).length ? g.player.weightLog[g.player.weightLog.length - 1].kg : g.player.weight0;
          return (lastKg - snap.weight) >= 1 || calcOVR(g.player.stats) > snap.ovr;
        } },
      /* CAPÍTULO 6 — El cuerpo también habla */
      { title: "El cuerpo también habla", zone: "car",
        objective: "Cumple objetivos de alimentación y sueño durante 4 días.",
        intro: [
          { m: "orgulloso", t: "Lo has conseguido." },
          { m: "happy", t: "Mira dónde estabas y mira dónde estás." },
          { m: "idle", t: "Ahora entiendo por qué me gusta cocinar para ti." },
          { m: "orgulloso", t: "Me recuerda a cuando yo estaba empezando." },
          { m: "serio", t: "Hay una cosa que la gente olvida." },
          { m: "serio", t: "El cuerpo habla." },
          { m: "idle", t: "Cuando estás cansado, cuando duermes mal, cuando entrenas sin comer suficiente... te lo está diciendo." },
          { m: "happy", t: "El problema es que no tiene subtítulos." },
          { m: "idle", t: "Y por eso a veces seguimos empujando." },
          { m: "serio", t: "Pensamos que descansar es perder tiempo." },
          { m: "idle", t: "Que dormir una hora más es hacer menos." },
          { m: "happy", t: "Que comer más es siempre mejor." },
          { m: "serio", t: "Y ninguna de esas cosas funciona así." },
          { m: "idle", t: "Tu cuerpo no es una máquina a la que le puedas exigir rendimiento infinito." },
          { m: "orgulloso", t: "Si quieres mejorar, también tienes que aprender a escuchar." },
          { m: "happy", t: "Así que durante unos días quiero que hagas algo muy poco espectacular." },
          { m: "idle", t: "Come bien. Duerme bien. Entrena." },
          { m: "serio", t: "Y observa cómo responde tu cuerpo." },
        ],
        snap: () => ({ since: todayStr() }),
        progressCount: (g, snap) => proteinSleepDaysSince(g, snap.since), progressGoal: 4,
        check: (g, snap) => proteinSleepDaysSince(g, snap.since) >= 4 },
      /* CAPÍTULO 7 — No todo es proteína */
      { title: "No todo es proteína", zone: "restaurante",
        objective: "Cierra un día sin caer en forma mala.",
        intro: [
          { m: "orgulloso", t: "Bien." },
          { m: "idle", t: "¿Notas la diferencia?" },
          { m: "happy", t: "No hace falta que me respondas." },
          { m: "serio", t: "Si tú la notas, ya lo he conseguido." },
          { m: "preocupado", t: "¿Cuánto has comido hoy?" },
          { m: "preocupado", t: "No, espera. No me lo digas todavía." },
          { m: "serio", t: "Si estás pensando en cada número que comes, ya no estás disfrutando de la comida." },
          { m: "idle", t: "Y eso me preocupa más que cualquier cifra." },
          { m: "happy", t: "Yo fui quien te enseñó a mirar la alimentación." },
          { m: "serio", t: "Así que si te he hecho pensar que comer bien significa estar contando todo el tiempo, tengo parte de culpa." },
          { m: "idle", t: "La nutrición es una herramienta." },
          { m: "serio", t: "No debería convertirse en una jaula." },
          { m: "happy", t: "Es como jugar un partido mirando solo el marcador." },
          { m: "idle", t: "Sabes el resultado, pero te estás perdiendo todo lo que ocurre en el campo." },
          { m: "preocupado", t: "Quiero que sigas cuidándote." },
          { m: "serio", t: "Pero también quiero que puedas sentarte a comer sin sentir que tienes que aprobar un examen." },
          { m: "happy", t: "Así que esta vez la misión es precisamente no obsesionarte." },
        ],
        snap: () => ({ since: todayStr() }),
        check: (g, snap) => Object.entries(g.logs || {}).some(([d, l]) => d >= snap.since && l.closed && l.form && l.form !== "caida") },
      /* CAPÍTULO 8 — El chef agotado */
      { title: "El chef agotado", zone: "restaurante",
        objective: "Completa una racha de 5 días.",
        intro: [
          { m: "happy", t: "Eso." },
          { m: "idle", t: "Has cumplido sin convertirlo todo en una operación matemática." },
          { m: "orgulloso", t: "Me alegra." },
          { m: "serio", t: "Porque quizá estés aprendiendo algo más importante que cualquier cantidad de proteína." },
          { m: "cansado", t: "Hoy la cocina me ha ganado por goleada." },
          { m: "happy", t: "Pero no se lo digas a nadie." },
          { m: "cansado", t: "Bueno... tampoco hace falta que me mires así." },
          { m: "preocupado", t: "Llevo demasiados días intentando que todo salga perfecto." },
          { m: "idle", t: "Que el servicio salga bien. Que la comida salga bien. Que todo el mundo coma bien." },
          { m: "cansado", t: "Y me he dado cuenta de que llevo semanas sin preguntarme cómo estoy yo." },
          { m: "preocupado", t: "A veces me acuerdo de cuidar a todo el mundo y se me olvida que yo también necesito parar." },
          { m: "cansado", t: "Qué ironía, ¿eh?" },
          { m: "happy", t: "El chef dando consejos y luego comiéndose el banquillo de su propia vida." },
          { m: "serio", t: "No quiero llegar a odiar algo que me encanta simplemente porque no sé cuándo parar." },
          { m: "idle", t: "Tú has aprendido a escuchar tu cuerpo." },
          { m: "preocupado", t: "Ahora me toca aprender a mí." },
          { m: "happy", t: "No te preocupes. No voy a desaparecer." },
          { m: "cansado", t: "Solo necesito recordar que descansar también forma parte del partido." },
        ],
        setFlags: ["igorBurnout"],
        snap: () => ({}),
        progressCount: (g) => g.player.streak || 0, progressGoal: 5,
        check: (g) => (g.player.streak || 0) >= 5 },
      /* CAPÍTULO 9 — La receta que no está escrita */
      { title: "La receta que no está escrita", zone: "barrio",
        objective: "Gana un partido y completa 3 días de objetivos.",
        intro: [
          { m: "cansado", t: "Gracias por volver." },
          { m: "idle", t: "No necesitas decirme nada." },
          { m: "orgulloso", t: "Solo ver que sigues con tu rutina me recuerda que yo también tengo que cuidar la mía." },
          { m: "serio", t: "Creo que hoy hemos aprendido los dos." },
          { m: "idle", t: "Antes de todo esto, yo no sabía exactamente qué quería." },
          { m: "serio", t: "Solo sabía que me gustaba hacer comida para otras personas." },
          { m: "idle", t: "No pensaba en restaurantes, estrellas ni en tener mi propio sitio." },
          { m: "happy", t: "Cocinaba porque me gustaba ver la cara de alguien después de probar algo que había preparado yo." },
          { m: "orgulloso", t: "Luego descubrí que eso podía ser un trabajo." },
          { m: "idle", t: "Y después vino todo lo demás." },
          { m: "serio", t: "El restaurante. La presión. La necesidad de demostrar que sabía lo que hacía." },
          { m: "happy", t: "Y poco a poco empecé a pensar que tenía que ser el chef que siempre sabe qué decir." },
          { m: "idle", t: "Incluso contigo." },
          { m: "serio", t: "Cuando me preguntabas algo, yo tenía que tener una respuesta." },
          { m: "happy", t: "Proteína. Calorías. Recuperación. Todo." },
          { m: "orgulloso", t: "Pero quizá lo que realmente quería era algo mucho más sencillo." },
          { m: "idle", t: "Que la gente volviera a mi mesa porque había estado a gusto." },
        ],
        snap: (g) => ({ since: todayStr(), matchCount: (g.matchHistory || []).length }),
        subs: [
          { count: (g, snap) => daysGoalsCompletedSince(g, snap.since), goal: 3 },
          (g, snap) => (g.matchHistory || []).slice(snap.matchCount).some((m) => m.res === "V"),
        ],
        check: (g, snap) => daysGoalsCompletedSince(g, snap.since) >= 3 &&
          (g.matchHistory || []).slice(snap.matchCount).some((m) => m.res === "V") },
      /* CAPÍTULO 10 — Un día sin fútbol */
      { title: "Un día sin fútbol", zone: "playa",
        objective: "Completa un hito de carrera.",
        intro: [
          { m: "happy", t: "Mira." },
          { m: "orgulloso", t: "Has vuelto a hacerlo." },
          { m: "idle", t: "Y yo también." },
          { m: "happy", t: "He vuelto a disfrutar de una conversación sin tener que convertirla en una clase de nutrición." },
          { m: "orgulloso", t: "Creo que ya puedo llamarte amigo." },
          { m: "playa", t: "Hoy no soy chef." },
          { m: "playa", t: "No soy nutricionista." },
          { m: "playa", t: "Y definitivamente no soy tu entrenador." },
          { m: "playa", t: "Hoy soy un señor con un coco intentando recordar cómo se descansaba." },
          { m: "playa", t: "Y resulta que es más difícil de lo que parece." },
          { m: "playa", t: "Cuando llevas años haciendo algo con intensidad, parar puede darte culpa." },
          { m: "playa", t: "Piensas que deberías estar haciendo otra cosa." },
          { m: "playa", t: "Cocinando. Entrenando. Mejorando. Preparando mañana." },
          { m: "playa", t: "Pero hoy no." },
          { m: "playa", t: "Hoy quiero sentarme y disfrutar de estar aquí." },
          { m: "playa", t: "Sin objetivos." },
          { m: "playa", t: "Sin números." },
          { m: "playa", t: "Sin preguntarte cuánta proteína tiene el coco." },
          { m: "playa", t: "Aunque... ahora que lo dices..." },
          { m: "playa", t: "No. He dicho que no." },
        ],
        setFlags: ["igorBeach"],
        snap: (g) => ({ tierId: g.tier.id, seasonNum: g.season.num }),
        check: (g, snap) => g.tier.id !== snap.tierId || g.season.num !== snap.seasonNum },
      /* CAPÍTULO 11 — Volver a la cocina */
      { title: "Volver a la cocina", zone: "restaurante",
        objective: "Completa una racha de 6 días.",
        intro: [
          { m: "playa", t: "Ha estado bien." },
          { m: "playa", t: "Mucho." },
          { m: "playa", t: "Creo que necesitaba recordar que no todo tiene que servir para algo." },
          { m: "playa", t: "A veces estar bien ya es suficiente." },
          { m: "chef", t: "¿Sabes qué he descubierto?" },
          { m: "happy", t: "Que descansar no me quitó hambre." },
          { m: "orgulloso", t: "Me devolvió las ganas de cocinar." },
          { m: "chef", t: "Y eso es bastante importante." },
          { m: "idle", t: "He vuelto al restaurante y todo parece igual." },
          { m: "happy", t: "Las mismas sartenes. Los mismos platos. La misma cocina." },
          { m: "serio", t: "Pero yo no estoy igual." },
          { m: "idle", t: "Antes pensaba que tenía que hacer todo perfecto." },
          { m: "orgulloso", t: "Ahora quiero hacer las cosas bien y disfrutar mientras las hago." },
          { m: "happy", t: "Y si algo sale mal..." },
          { m: "chef", t: "Lo arreglamos." },
          { m: "idle", t: "Como en un partido." },
          { m: "happy", t: "No puedes volver atrás y borrar el error." },
          { m: "orgulloso", t: "Solo puedes jugar mejor la siguiente jugada." },
          { m: "idle", t: "Quiero recuperar el ritmo." },
        ],
        setFlags: ["igorBalance"],
        snap: () => ({}),
        progressCount: (g) => g.player.streak || 0, progressGoal: 6,
        check: (g) => (g.player.streak || 0) >= 6 },
      /* CAPÍTULO 12 — Tu receta */
      { title: "Tu receta", zone: "casa",
        objective: "Cumple objetivos de alimentación durante 4 días.",
        intro: [
          { m: "orgulloso", t: "Perfecto." },
          { m: "happy", t: "Ya lo siento otra vez." },
          { m: "idle", t: "Y esta vez no porque tenga que hacerlo." },
          { m: "orgulloso", t: "Porque quiero." },
          { m: "idle", t: "Hasta ahora siempre te he dicho qué comer." },
          { m: "serio", t: "Hoy quiero que me digas tú qué quieres preparar." },
          { m: "happy", t: "Sí. El chef pregunta al cliente." },
          { m: "orgulloso", t: "Porque ya no eres el chico que vino a preguntarme cuánta proteína tenía todo." },
          { m: "idle", t: "Has aprendido a mirar tus objetivos." },
          { m: "serio", t: "Pero también has aprendido a decidir por ti mismo." },
          { m: "happy", t: "Y eso es exactamente lo que quería conseguir." },
          { m: "idle", t: "Así que toma esta hoja." },
          { m: "orgulloso", t: "Escribe tu propia versión." },
          { m: "happy", t: "No quiero una receta perfecta." },
          { m: "serio", t: "Quiero una receta que puedas hacer tú." },
          { m: "idle", t: "Algo que te guste. Algo que te alimente. Algo que quieras volver a cocinar." },
          { m: "happy", t: "Si necesitas una idea, te doy diez." },
          { m: "idle", t: "Pero esta vez la decisión es tuya." },
        ],
        snap: () => ({ since: todayStr() }),
        progressCount: (g, snap) => proteinDaysSince(g, snap.since), progressGoal: 4,
        check: (g, snap) => proteinDaysSince(g, snap.since) >= 4 },
      /* CAPÍTULO 13 — La gran noche */
      { title: "La gran noche", zone: "estadio",
        objective: "Gana un partido o alcanza un hito de temporada.",
        intro: [
          { m: "orgulloso", t: "Eso es." },
          { m: "happy", t: "Ahora sí." },
          { m: "serio", t: "Ya no necesitas que te diga qué hacer." },
          { m: "orgulloso", t: "Y eso me hace estar más orgulloso que cualquier plato que haya preparado." },
          { m: "celebracion", t: "¡ESTO SE CELEBRA!" },
          { m: "happy", t: "No me importa la dieta esta noche." },
          { m: "chef", t: "Bueno, técnicamente sí me importa." },
          { m: "celebracion", t: "¡PERO HOY GANAMOS!" },
          { m: "orgulloso", t: "Y algunas victorias también hay que saborearlas." },
          { m: "happy", t: "He pasado mucho tiempo hablando contigo de disciplina." },
          { m: "serio", t: "De proteína. De sueño. De recuperación." },
          { m: "celebracion", t: "¡Hoy no!" },
          { m: "happy", t: "Hoy quiero cocinar algo porque nos apetece." },
          { m: "orgulloso", t: "Porque una carrera también está hecha de momentos así." },
          { m: "idle", t: "Si todo lo que hacemos es optimizar, nos olvidamos de por qué empezamos." },
          { m: "celebracion", t: "Y yo empecé porque me gustaba hacer feliz a la gente con comida." },
          { m: "happy", t: "Así que siéntate." },
          { m: "chef", t: "Hoy cocino yo." },
        ],
        snap: (g) => ({ matchCount: (g.matchHistory || []).length, tierId: g.tier.id, seasonNum: g.season.num }),
        check: (g, snap) => (g.matchHistory || []).slice(snap.matchCount).some((m) => m.res === "V") ||
          g.tier.id !== snap.tierId || g.season.num !== snap.seasonNum },
      /* CAPÍTULO 14 — Lo que realmente quería */
      { title: "Lo que realmente quería", zone: "restaurante",
        objective: "Mantén una racha de 7 días o supera tu mejor OVR.",
        intro: [
          { m: "celebracion", t: "¡Lo sabía!" },
          { m: "orgulloso", t: "Esta noche no contamos nada." },
          { m: "happy", t: "Bueno... salvo las historias." },
          { m: "celebracion", t: "¡Eso sí se cuenta!" },
          { m: "serio", t: "Durante años pensé que tenía que hacer el plato perfecto." },
          { m: "orgulloso", t: "Ahora creo que estaba equivocado." },
          { m: "idle", t: "Pensaba que si conseguía la receta perfecta, el servicio perfecto, el restaurante perfecto..." },
          { m: "serio", t: "...entonces sentiría que había llegado." },
          { m: "happy", t: "Pero no funciona así." },
          { m: "idle", t: "Siempre habrá un plato que puedas mejorar." },
          { m: "serio", t: "Siempre habrá alguien que cocine mejor." },
          { m: "orgulloso", t: "Siempre habrá otro partido." },
          { m: "idle", t: "Lo que no puedes repetir es una mesa llena de gente que quiere volver." },
          { m: "happy", t: "Lo importante no es que recuerden cada ingrediente." },
          { m: "orgulloso", t: "Es que quieran volver a sentarse contigo." },
          { m: "idle", t: "Y eso es lo que he conseguido aquí." },
          { m: "serio", t: "No gracias a ser perfecto." },
          { m: "orgulloso", t: "Gracias a haber construido algo que importa." },
          { m: "happy", t: "Y tú formas parte de eso." },
        ],
        setFlags: ["igorFriend"],
        snap: (g) => ({ ovr: calcOVR(g.player.stats) }),
        check: (g, snap) => (g.player.streak || 0) >= 7 || calcOVR(g.player.stats) > snap.ovr },
      /* CAPÍTULO 15 — El delantal */
      { title: "El delantal", zone: "restaurante",
        objective: "Cierra un día con entrenamiento, alimentación y sueño.",
        intro: [
          { m: "orgulloso", t: "Bien hecho." },
          { m: "happy", t: "Mira todo lo que has construido tú también." },
          { m: "serio", t: "Supongo que eso es lo que tenemos en común." },
          { m: "orgulloso", t: "Ninguno llegó aquí de golpe." },
          { m: "chef", t: "Esto no se regala a cualquiera." },
          { m: "happy", t: "Bueno... quizá sí." },
          { m: "orgulloso", t: "Pero contigo me apetece hacerlo." },
          { m: "serio", t: "Este delantal representa muchas horas." },
          { m: "idle", t: "Días buenos. Días horribles. Servicios interminables." },
          { m: "happy", t: "Y alguna que otra quemadura que prefiero olvidar." },
          { m: "orgulloso", t: "Pero también representa algo que he aprendido contigo." },
          { m: "serio", t: "Cuidar de alguien no significa decirle todo el tiempo qué tiene que hacer." },
          { m: "idle", t: "A veces significa darle herramientas y dejar que decida." },
          { m: "orgulloso", t: "Tú has aprendido a cuidarte sin convertirlo en una obligación." },
          { m: "happy", t: "Y yo he aprendido a disfrutar de mi trabajo sin sentir que tengo que ser perfecto." },
          { m: "chef", t: "Así que quiero que tengas esto." },
          { m: "orgulloso", t: "No para que te conviertas en chef." },
          { m: "happy", t: "Por favor, no." },
          { m: "serio", t: "Para que recuerdes que una parte de esta cocina también es tuya." },
        ],
        setFlags: ["igorApron"],
        snap: () => ({ since: todayStr() }),
        subs: [
          (g, snap) => Object.entries(g.logs || {}).some(([d, l]) => d >= snap.since && l.closed && l.gym),
          (g, snap) => Object.entries(g.logs || {}).some(([d, l]) => d >= snap.since && l.closed && (l.prot || 0) >= g.player.goals.protein),
          (g, snap) => Object.entries(g.logs || {}).some(([d, l]) => d >= snap.since && l.closed && l.sleep != null && l.sleep >= g.player.goals.sleepGoal),
        ],
        check: (g, snap) => Object.entries(g.logs || {}).some(([d, l]) => d >= snap.since && l.closed &&
          l.gym && (l.prot || 0) >= g.player.goals.protein && l.sleep != null && l.sleep >= g.player.goals.sleepGoal) },
      /* FINAL — A la mesa */
      { title: "A la mesa", zone: "restaurante",
        objective: "Alcanza el nivel de élite.",
        intro: [
          { m: "orgulloso", t: "Perfecto." },
          { m: "happy", t: "Ahora sí." },
          { m: "idle", t: "Creo que ya estás preparado." },
          { m: "orgulloso", t: "No para cocinar como yo." },
          { m: "happy", t: "Para cocinar a tu manera." },
          { m: "happy", t: "Mira quién ha venido." },
          { m: "happy", t: "Tengo dos noticias." },
          { m: "idle", t: "La primera: la comida está lista." },
          { m: "happy", t: "La segunda: no pienso preguntarte cuántas calorías tiene." },
          { m: "orgulloso", t: "Ya sabes cuidarte." },
          { m: "idle", t: "Ya sabes escuchar a tu cuerpo." },
          { m: "happy", t: "Y, lo más importante, ya sabes cuándo dejar de pensar en todo eso." },
          { m: "orgulloso", t: "Porque la comida no es solo combustible." },
          { m: "serio", t: "También es una mesa." },
          { m: "happy", t: "Una conversación." },
          { m: "orgulloso", t: "Un recuerdo." },
          { m: "idle", t: "Una celebración después de un día difícil." },
          { m: "happy", t: "Así que siéntate." },
          { m: "orgulloso", t: "Hoy comemos." },
          { m: "happy", t: "Sin tácticas. Sin estadísticas. Solo nosotros." },
        ],
        snap: () => ({}),
        check: (g) => g.tier.id >= TIERS[TIERS.length - 1].id },
      /* EPÍLOGO — La receta (última etapa: final:true, entrega el pin y +1 NUT al entrar aquí) */
      { title: "La receta", zone: "casa", final: true,
        intro: [
          { m: "orgulloso", t: "Lo has conseguido." },
          { m: "happy", t: "Y me alegra muchísimo haber podido verlo." },
          { m: "serio", t: "No porque hayas seguido mis consejos." },
          { m: "orgulloso", t: "Porque has aprendido a decidir por ti mismo." },
          { m: "happy", t: "Eso sí que merece una celebración." },
          { m: "idle", t: "¿Conservas la receta?" },
          { m: "happy", t: "Sabía que sí." },
          { m: "orgulloso", t: "Entonces ya está." },
          { m: "idle", t: "¿Sabes qué me gusta de esa hoja?" },
          { m: "happy", t: "Que al principio te la di yo." },
          { m: "orgulloso", t: "Y ahora es tuya." },
          { m: "idle", t: "Quizá ya no la cocines igual." },
          { m: "happy", t: "Mejor." },
          { m: "orgulloso", t: "Significa que has hecho algo tuyo con ella." },
          { m: "happy", t: "Algunas recetas no son para cocinar." },
          { m: "orgulloso", t: "Son para recordar cómo empezó todo." },
          { m: "happy", t: "Y esta me recuerda que un día entró por mi restaurante un jugador que quería mejorar." },
          { m: "idle", t: "Y acabó convirtiéndose en un amigo." },
        ],
        setFlags: ["igorPinEarned", "igorStoryComplete"],
        grantItem: "igor_pin", reveal: "igor_pin",
        reward: (g) => {
          const stats = { ...g.player.stats };
          stats.NUT = Math.min(99, stats.NUT + 1);
          return { ...g, player: { ...g.player, stats } };
        } },
    ],
  }],
};

/* ============================================================
   KARLA · sexta campaña completa. Prólogo + 15 capítulos + final +
   epílogo, sin cambios de motor: reutiliza tal cual la arquitectura de
   Elisa/Milly/Yuna/López/Igor. Conocida desde el minuto uno (trigger:
   ()=>true) — su prólogo transcurre en Zona de Patrocinadores, que se
   autodesbloquea al encolarse esa misma escena.

   Capítulo 8 ("Elegir qué quieres ser") es la segunda etapa de historia
   con réplicas (tras el capítulo 5 de Yuna): dos opciones que registran
   flags DISTINTOS (karlaChoiceStatus / karlaChoiceSelf) en vez de
   converger en uno compartido, porque aquí el documento sí quiere saber
   cuál se eligió — pero el objetivo de avance del capítulo (el hito de
   carrera) no depende de cuál sea, tal como pide "ambas convergen".

   Set de moods reconstruido en NPCS.lisa.arts (ver comentario ahí): dos
   sustituciones documentadas por moods sin asset propio fuera del
   outfit de gala — [ego] en zona no-gala → "negociadora"; [happy]/
   [serio] sueltos → "profesional". */
const KARLA_STORY = {
  npc: "lisa",
  chapters: [{
    id: "cap1",
    title: "La historia de Karla",
    trigger: () => true,
    stages: [
      /* PRÓLOGO — Tu primera marca (rework de diálogos, ver
         FUTABITA_Karla_Rework_Narrativo_para_Code.docx — no toca objetivos ni
         comportamiento, solo sustituye el texto de las escenas). Mismo fix de
         contradicción temporal que Elisa/Milly/Yuna/López/Igor: los bloques de
         reacción "cuando el jugador vuelve tras cumplir el objetivo" se han
         movido al PRINCIPIO de la etapa siguiente.
         El documento usa varios moods que Karla no tiene definidos (sin
         asset ni entrada en NPCS.lisa.arts): [ego], [serio], [happy], [idle],
         [personal_vulnerable], [personal_preocupada] y el typo [professional].
         Sustituidos con el mismo mapeo que ya usaba la implementación previa
         (confirmado comparando frases idénticas ya presentes en el código):
         ego→negociadora, serio/happy/idle/professional→profesional,
         personal_vulnerable→vulnerable, personal_preocupada→preocupada
         (Karla solo tiene un asset "vulnerable"/"preocupada" para ambos
         registros; "personal_orgullosa" sí existe como pose propia y se
         mantiene tal cual). */
      { title: "Tu primera marca", zone: "patro",
        objective: "Completa un partido o alcanza el primer hito de OVR.",
        intro: [
          { m: "negociadora", t: "Así que tú eres el nuevo talento del que todo el mundo está hablando." },
          { m: "negociadora", t: "Bien. Antes de que digas nada: no, no voy a pedirte que sonrías." },
          { m: "profesional", t: "Voy a explicarte cómo funciona esto." },
          { m: "negociadora", t: "Puedes marcar veinte goles y seguir siendo invisible si nadie sabe quién eres." },
          { m: "negociadora", t: "Y eso es precisamente lo que quiero evitar." },
          { m: "profesional", t: "Tu carrera acaba de empezar, pero ya hay algo alrededor de ella que empieza a moverse." },
          { m: "negociadora", t: "Marcas, prensa, gente que quiere una foto, gente que quiere asociarse a tu nombre." },
          { m: "profesional", t: "Todo eso va a aparecer aunque tú no lo busques." },
          { m: "negociadora", t: "La diferencia es si vas a dejar que otros decidan qué imagen tienen de ti." },
          { m: "negociadora", t: "Yo voy a conseguir que eso no pase." },
          { m: "negociadora", t: "Y sí, probablemente voy a ser insoportable." },
          { m: "profesional", t: "Pero prefiero ser insoportable y tenerlo todo controlado a dejar que tu carrera se construya sola." },
        ],
        setFlags: ["karlaMet", "metLisa", "karlaStoryStarted"],
        snap: (g) => ({ matchCount: (g.matchHistory || []).length, ovr: calcOVR(g.player.stats) }),
        check: (g, snap) => (g.matchHistory || []).length > snap.matchCount || calcOVR(g.player.stats) > snap.ovr },
      /* CAPÍTULO 1 — El precio de tu nombre */
      { title: "El precio de tu nombre", zone: "patro",
        objective: "Sube +2 tu media (OVR) o cambia de categoría.",
        intro: [
          { m: "orgullosa", t: "Bien." },
          { m: "negociadora", t: "Ya tienes algo que enseñar." },
          { m: "negociadora", t: "Ahora me toca a mí conseguir que la gente empiece a reconocer ese nombre." },
          { m: "negociadora", t: "Este contrato no te hace mejor jugador." },
          { m: "profesional", t: "Pero puede cambiar lo que ocurre alrededor de tu carrera." },
          { m: "negociadora", t: "Tu nombre empieza a valer dinero cuando la gente quiere asociarlo con algo." },
          { m: "profesional", t: "Y ahora mismo, eso es exactamente lo que quiero construir contigo." },
          { m: "negociadora", t: "Pero antes necesito que entiendas una cosa." },
          { m: "profesional", t: "Un patrocinador no compra solo tus goles." },
          { m: "profesional", t: "Compra atención. Confianza. Una historia que pueda contar." },
          { m: "negociadora", t: "Y tú todavía estás escribiendo la tuya." },
          { m: "negociadora", t: "Así que no voy a firmar nada importante hasta que vea que el jugador que estoy vendiendo también está creciendo." },
          { m: "orgullosa", t: "Consigue el siguiente salto de carrera." },
          { m: "negociadora", t: "Después hablaremos de números." },
        ],
        setFlags: ["karlaSponsor"],
        snap: (g) => ({ tierId: g.tier.id, ovr: calcOVR(g.player.stats) }),
        check: (g, snap) => calcOVR(g.player.stats) >= snap.ovr + 2 || g.tier.id !== snap.tierId },
      /* CAPÍTULO 2 — Primera sesión */
      { title: "Primera sesión", zone: "prensa",
        objective: "Completa un partido con buena valoración.",
        intro: [
          { m: "orgullosa", t: "Bien." },
          { m: "negociadora", t: "Ahora sí puedo poner tu nombre encima de un contrato sin sentir que estoy vendiendo humo." },
          { m: "negociadora", t: "No te acostumbres. La próxima vez voy a pedir más." },
          { m: "profesional", t: "Primera regla: no respondas a la pregunta que te hacen." },
          { m: "negociadora", t: "Responde a la pregunta que te interesa." },
          { m: "profesional", t: "No mientas. Simplemente decide qué parte de ti quieres enseñar." },
          { m: "orgullosa", t: "La prensa no necesita conocerte. Necesita una historia." },
          { m: "profesional", t: "Y hoy vamos a comprobar si eres capaz de contarla sin dejar que alguien más la escriba por ti." },
          { m: "negociadora", t: "Te van a preguntar por el partido, por tus objetivos y probablemente por cosas que no tienen nada que ver con el fútbol." },
          { m: "negociadora", t: "No tienes que contestarlo todo." },
          { m: "profesional", t: "Tienes que saber qué quieres que recuerden cuando termine la entrevista." },
          { m: "orgullosa", t: "Eso es construir una imagen." },
        ],
        setFlags: ["karlaPress"],
        snap: (g) => ({ matchCount: (g.matchHistory || []).length }),
        check: (g, snap) => (g.matchHistory || []).slice(snap.matchCount).some((m) => (m.rating || 0) >= 7) },
      /* CAPÍTULO 3 — La fotografía */
      { title: "La fotografía", zone: "patro",
        objective: "Alcanza un nuevo máximo de OVR o un hito de goles/asistencias.",
        intro: [
          { m: "orgullosa", t: "Perfecto." },
          { m: "profesional", t: "Ahora tengo algo más que enseñar a la prensa." },
          { m: "negociadora", t: "No solo eres alguien con potencial. Empiezas a tener resultados que respaldan la historia." },
          { m: "negociadora", t: "Eso hace mi trabajo bastante más fácil." },
          { m: "negociadora", t: "Mira a cámara." },
          { m: "profesional", t: "No, así no." },
          { m: "profesional", t: "Ahora sí." },
          { m: "orgullosa", t: "¿Ves? Ese es el jugador que quiero que vea una marca." },
          { m: "negociadora", t: "Y sí, yo también salgo mejor en las fotos. Es una desgracia que tendrás que aceptar." },
          { m: "profesional", t: "Pero fíjate en algo." },
          { m: "profesional", t: "Una fotografía no captura cómo juegas." },
          { m: "negociadora", t: "Captura cómo quieres que te recuerden durante esos dos segundos." },
          { m: "orgullosa", t: "Por eso importa." },
          { m: "negociadora", t: "Si vas a entrar en este mundo, tienes que aprender a controlar incluso las cosas que parecen pequeñas." },
          { m: "profesional", t: "Hoy es una foto." },
          { m: "negociadora", t: "Mañana puede ser una campaña completa." },
          { m: "negociadora", t: "Y algún día puede haber miles de personas mirando esa imagen." },
        ],
        setFlags: ["karlaFirstCampaign"],
        snap: (g) => ({ ovr: calcOVR(g.player.stats), goals: careerGoals(g), assists: careerAssists(g) }),
        check: (g, snap) => calcOVR(g.player.stats) > snap.ovr || careerGoals(g) > snap.goals || careerAssists(g) > snap.assists },
      /* CAPÍTULO 4 — La tarjeta VIP */
      { title: "La tarjeta VIP", zone: "casino",
        objective: "Completa un partido.",
        intro: [
          { m: "orgullosa", t: "Muy bien." },
          { m: "profesional", t: "Esta vez sí me gusta la foto." },
          { m: "negociadora", t: "Guárdala." },
          { m: "profesional", t: "Es la primera vez que tu imagen empieza a representar algo más que 'promesa'." },
          { m: "gala_idle", t: "Bienvenido." },
          { m: "gala_ego", t: "Aquí hay gente que puede hacer que tu carrera cambie en una noche." },
          { m: "gala_happy", t: "Y gente que puede perder muchísimo dinero en una noche." },
          { m: "gala_idle", t: "No confundas las dos cosas." },
          { m: "gala_ego", t: "Este lugar no existe solo para gastar." },
          { m: "gala_idle", t: "Aquí se hacen contactos." },
          { m: "gala_happy", t: "Aquí alguien puede verte jugar, recordar tu nombre y llamarte dentro de tres meses." },
          { m: "gala_ego", t: "O puede olvidarte cinco minutos después." },
          { m: "gala_idle", t: "El estatus abre puertas." },
          { m: "gala_ego", t: "Pero entrar por una puerta no significa que pertenezcas a la habitación." },
          { m: "gala_idle", t: "Quiero que aprendas a distinguir ambas cosas." },
        ],
        setFlags: ["karlaVIP", "karlaCasino"],
        snap: (g) => ({ matchCount: (g.matchHistory || []).length }),
        check: (g, snap) => (g.matchHistory || []).length > snap.matchCount },
      /* CAPÍTULO 5 — El juego de parecer invencible */
      { title: "El juego de parecer invencible", zone: "casino",
        objective: "Completa un objetivo de carrera sin caer en forma mala.",
        intro: [
          { m: "gala_happy", t: "Bienvenido oficialmente al circuito VIP." },
          { m: "gala_ego", t: "Aquí tienes." },
          { m: "gala_idle", t: "Guarda la tarjeta." },
          { m: "gala_ego", t: "No por presumir." },
          { m: "gala_happy", t: "Bueno... también un poco por presumir." },
          { m: "gala_ego", t: "¿Sabes qué es lo más difícil de estar aquí?" },
          { m: "gala_happy", t: "Que todo el mundo cree que estás disfrutando." },
          { m: "gala_vulnerable", t: "Y la mayoría de las veces sí." },
          { m: "gala_idle", t: "Te acostumbras a las luces. A que te miren. A que todo parezca importante." },
          { m: "gala_vulnerable", t: "Pero algunas noches solo quieres sentarte en algún sitio donde nadie espere nada de ti." },
          { m: "gala_ego", t: "Es ridículo, ¿verdad?" },
          { m: "gala_vulnerable", t: "Tienes exactamente lo que querías y aun así hay momentos en los que quieres desaparecer durante una hora." },
          { m: "gala_idle", t: "No te preocupes." },
          { m: "gala_ego", t: "No voy a convertirme de repente en una persona sensible." },
          { m: "gala_vulnerable", t: "Solo te estoy enseñando que este mundo tiene una parte que no sale en las fotografías." },
          { m: "gala_idle", t: "Y quizá algún día entiendas por qué." },
        ],
        setFlags: ["karlaPressure"],
        snap: (g) => ({ tierId: g.tier.id, seasonNum: g.season.num, since: todayStr() }),
        subs: [
          (g, snap) => g.tier.id !== snap.tierId || g.season.num !== snap.seasonNum,
          (g, snap) => !Object.entries(g.logs || {}).some(([d, l]) => d >= snap.since && l.closed && l.form === "caida"),
        ],
        check: (g, snap) => {
          const milestone = g.tier.id !== snap.tierId || g.season.num !== snap.seasonNum;
          const noBad = !Object.entries(g.logs || {}).some(([d, l]) => d >= snap.since && l.closed && l.form === "caida");
          return milestone && noBad;
        } },
      /* CAPÍTULO 6 — Una mala portada */
      { title: "Una mala portada", zone: "prensa",
        objective: "Gana tras una mala valoración o completa una racha de 3 días.",
        intro: [
          { m: "gala_vulnerable", t: "Bien." },
          { m: "gala_idle", t: "Has hecho lo que tenías que hacer sin dejar que toda esta gente te distraiga." },
          { m: "gala_ego", t: "Eso es más difícil de lo que parece." },
          { m: "gala_vulnerable", t: "Créeme." },
          { m: "molesta", t: "Esto no es lo que habíamos acordado." },
          { m: "profesional", t: "No han mentido exactamente." },
          { m: "molesta", t: "Han elegido la versión que más les convenía." },
          { m: "profesional", t: "Y eso es lo que tienes que aprender a controlar." },
          { m: "profesional", t: "Tú puedes jugar un partido perfecto y al día siguiente leer un titular que cuente otra historia." },
          { m: "molesta", t: "No porque hayas hecho algo mal." },
          { m: "negociadora", t: "Porque una portada necesita llamar la atención." },
          { m: "profesional", t: "La imagen pública no siempre es justa." },
          { m: "profesional", t: "Por eso tenemos que decidir qué parte de la historia vamos a reforzar después." },
          { m: "molesta", t: "No voy a dejar que una mala portada defina tu temporada." },
          { m: "orgullosa", t: "Pero tú tampoco puedes esconderte cuando algo sale mal." },
          { m: "profesional", t: "Hay que responder con hechos." },
        ],
        setFlags: ["karlaPublicImage"],
        snap: (g) => ({ matchCount: (g.matchHistory || []).length }),
        check: (g, snap) => {
          const ms = (g.matchHistory || []).slice(snap.matchCount);
          for (let i = 0; i < ms.length - 1; i++) if ((ms[i].rating || 10) < 6 && ms[i + 1].res === "V") return true;
          return (g.player.streak || 0) >= 3;
        } },
      /* CAPÍTULO 7 — El precio de la perfección */
      { title: "El precio de la perfección", zone: "atico",
        objective: "Alcanza un nuevo máximo de OVR o completa una racha de 5 días.",
        intro: [
          { m: "orgullosa", t: "Ahí está." },
          { m: "profesional", t: "Una mala historia pierde fuerza cuando el siguiente capítulo es mejor." },
          { m: "negociadora", t: "Y ahora tenemos algo nuevo que enseñar." },
          { m: "preocupada", t: "¿Alguna vez te has preguntado qué pasa cuando dejas de ser interesante?" },
          { m: "vulnerable", t: "No cuando eres malo. Cuando simplemente aparece alguien mejor." },
          { m: "preocupada", t: "Ese día llega para todo el mundo." },
          { m: "personal_orgullosa", t: "Por eso me esfuerzo tanto en no necesitar que nadie me diga que soy buena." },
          { m: "vulnerable", t: "Si eres útil, te quieren." },
          { m: "preocupada", t: "Si eres rentable, te llaman." },
          { m: "vulnerable", t: "Si eres la mejor, nadie pregunta qué hay detrás." },
          { m: "personal_orgullosa", t: "Pero cuando aparece alguien que puede ocupar tu sitio, todo cambia." },
          { m: "preocupada", t: "Llevo mucho tiempo intentando estar un paso por delante de ese momento." },
          { m: "vulnerable", t: "Y supongo que por eso me obsesiona tanto el control." },
          { m: "personal_orgullosa", t: "Contigo estoy intentando hacer lo mismo." },
          { m: "preocupada", t: "Prepararte para que cuando llegue la presión no te rompa." },
        ],
        setFlags: ["karlaPrivate"],
        snap: (g) => ({ ovr: calcOVR(g.player.stats) }),
        check: (g, snap) => calcOVR(g.player.stats) > snap.ovr || (g.player.streak || 0) >= 5 },
      /* CAPÍTULO 8 — Elegir qué quieres ser (única etapa con réplicas propias: cada opción
         marca un flag distinto, pero el avance del capítulo no depende de cuál se elija) */
      { title: "Elegir qué quieres ser", zone: "patro",
        objective: "Completa un hito de carrera.",
        intro: [
          { m: "personal_orgullosa", t: "Bien." },
          { m: "vulnerable", t: "Quizá no necesites que te prepare para todo." },
          { m: "preocupada", t: "Quizá solo necesites saber que alguien estará ahí cuando llegue." },
          { m: "profesional", t: "Tengo dos propuestas." },
          { m: "negociadora", t: "Una paga más." },
          { m: "negociadora", t: "La otra encaja mejor contigo." },
          { m: "profesional", t: "Las dos son buenas oportunidades." },
          { m: "negociadora", t: "Y las dos van a hacer que tu nombre sea más conocido." },
          { m: "negociadora", t: "Pero no quiero elegir por ti." },
          { m: "profesional", t: "Porque hasta ahora yo he estado pensando como si tu carrera fuera un producto que tengo que hacer crecer." },
          { m: "orgullosa", t: "Y lo es, en parte." },
          { m: "profesional", t: "Pero también es tu vida." },
          { m: "negociadora", t: "Así que quiero saber qué tipo de jugador quieres ser." },
          { m: "negociadora", t: "El que aparece en todas partes." },
          { m: "profesional", t: "O el que aparece donde realmente quiere estar." },
        ],
        replies: [
          { t: "La que paga más", m: "negociadora", r: ["Práctica. Me gusta cómo piensas."], setFlag: "karlaChoiceStatus" },
          { t: "La que encaja mejor conmigo", m: "personal_orgullosa", r: ["Esa es la respuesta que esperaba, la verdad."], setFlag: "karlaChoiceSelf" },
        ],
        snap: (g) => ({ tierId: g.tier.id, seasonNum: g.season.num }),
        check: (g, snap) => g.tier.id !== snap.tierId || g.season.num !== snap.seasonNum },
      /* CAPÍTULO 9 — La noche de la marca */
      { title: "La noche de la marca", zone: "casino",
        objective: "Consigue una victoria o un hito de temporada.",
        intro: [
          { m: "orgullosa", t: "Bien." },
          { m: "profesional", t: "Has elegido." },
          { m: "negociadora", t: "No voy a decirte que es la opción que yo habría tomado." },
          { m: "orgullosa", t: "Pero es una decisión que puedes defender." },
          { m: "profesional", t: "Eso es lo que importa." },
          { m: "gala_happy", t: "Esta noche todo el mundo quiere conocerte." },
          { m: "gala_ego", t: "Sonríe. No demasiado." },
          { m: "gala_idle", t: "Deja que piensen que estás cómodo." },
          { m: "gala_happy", t: "Esta es la parte que no sale en el contrato." },
          { m: "gala_idle", t: "Una sala llena de gente que quiere saber quién eres." },
          { m: "gala_ego", t: "Y muchos de ellos ya han decidido quién creen que eres antes de hablar contigo." },
          { m: "gala_vulnerable", t: "Si te agobias, búscame." },
          { m: "gala_idle", t: "No tienes que impresionar a todo el mundo." },
          { m: "gala_ego", t: "Solo a las personas que realmente importan." },
          { m: "gala_happy", t: "Y, por una noche, puedes disfrutar un poco." },
          { m: "gala_vulnerable", t: "Yo también voy a intentar hacerlo." },
        ],
        snap: (g) => ({ matchCount: (g.matchHistory || []).length, seasonNum: g.season.num }),
        check: (g, snap) => (g.matchHistory || []).slice(snap.matchCount).some((m) => m.res === "V") || g.season.num !== snap.seasonNum },
      /* CAPÍTULO 10 — Fuera del escaparate */
      { title: "Fuera del escaparate", zone: "playa",
        objective: "Completa un objetivo de carrera y mantén una forma positiva.",
        intro: [
          { m: "gala_happy", t: "Perfecto." },
          { m: "gala_ego", t: "¿Ves? Ya no pareces el chico que entró aquí por primera vez." },
          { m: "gala_vulnerable", t: "Aunque me alegra que sigas siendo tú cuando nadie está mirando." },
          { m: "gala_happy", t: "Toma." },
          { m: "gala_idle", t: "Guarda la pulsera." },
          { m: "playa", t: "No mires así." },
          { m: "playa", t: "Sí. También sé estar sin tacones, sin cámaras y sin gente preguntándome cuánto vale mi última campaña." },
          { m: "playa", t: "Hoy no soy tu asesora." },
          { m: "playa", t: "Y tú no eres mi proyecto." },
          { m: "playa", t: "¿Sabes qué es lo raro?" },
          { m: "playa", t: "Que cuando no hay nadie mirando, al principio no sabes qué hacer." },
          { m: "playa", t: "Durante tanto tiempo he pensado en cómo me ve la gente que a veces se me olvida preguntarme cómo estoy yo." },
          { m: "playa", t: "Aquí nadie está esperando que venda nada." },
          { m: "playa", t: "Ni que parezca perfecta." },
          { m: "playa", t: "Así que hoy quiero estar aquí sin tener que demostrar nada." },
          { m: "playa", t: "Y tú puedes hacer lo mismo." },
        ],
        setFlags: ["karlaBeach"],
        snap: (g) => ({ tierId: g.tier.id, seasonNum: g.season.num, since: todayStr() }),
        subs: [
          (g, snap) => g.tier.id !== snap.tierId || g.season.num !== snap.seasonNum,
          (g, snap) => !Object.entries(g.logs || {}).some(([d, l]) => d >= snap.since && l.closed && l.form === "caida"),
        ],
        check: (g, snap) => {
          const milestone = g.tier.id !== snap.tierId || g.season.num !== snap.seasonNum;
          const noBad = !Object.entries(g.logs || {}).some(([d, l]) => d >= snap.since && l.closed && l.form === "caida");
          return milestone && noBad;
        } },
      /* CAPÍTULO 11 — Lo que no sale en las fotos */
      { title: "Lo que no sale en las fotos", zone: "atico",
        objective: "Gana un partido o supera un máximo de carrera.",
        intro: [
          { m: "playa", t: "Ha sido agradable." },
          { m: "playa", t: "No voy a decir que me haya cambiado la vida." },
          { m: "playa", t: "Pero creo que necesitaba un día en el que nadie supiera cuánto valgo." },
          { m: "playa", t: "Ni cuánto vale mi imagen." },
          { m: "playa", t: "Solo yo." },
          { m: "vulnerable", t: "Cuando empecé, pensaba que si llegaba arriba dejaría de tener miedo." },
          { m: "preocupada", t: "No funciona así." },
          { m: "vulnerable", t: "Solo cambia el miedo." },
          { m: "personal_orgullosa", t: "Al principio tenía miedo de no ser suficientemente buena." },
          { m: "vulnerable", t: "Después tuve miedo de perder lo que había conseguido." },
          { m: "preocupada", t: "Y luego apareció otro miedo." },
          { m: "vulnerable", t: "Que todo el mundo estuviera viendo una versión de mí que ya no sabía si era real." },
          { m: "personal_orgullosa", t: "Supongo que por eso me volví tan obsesiva con la imagen." },
          { m: "vulnerable", t: "Si todo estaba controlado por fuera, podía fingir que también lo estaba por dentro." },
          { m: "preocupada", t: "Pero contigo ha sido diferente." },
          { m: "vulnerable", t: "Porque no necesitas que sea perfecta." },
          { m: "personal_orgullosa", t: "Y eso es bastante incómodo." },
          { m: "vulnerable", t: "Pero también es un alivio." },
        ],
        setFlags: ["karlaTrust"],
        snap: (g) => ({ matchCount: (g.matchHistory || []).length, ovr: calcOVR(g.player.stats), bestRating: g.bestRating || 0 }),
        check: (g, snap) => (g.matchHistory || []).slice(snap.matchCount).some((m) => m.res === "V") ||
          calcOVR(g.player.stats) > snap.ovr || (g.bestRating || 0) > snap.bestRating },
      /* CAPÍTULO 12 — Tu nombre, tus reglas */
      { title: "Tu nombre, tus reglas", zone: "prensa",
        objective: "Completa un partido con buena valoración.",
        intro: [
          { m: "personal_orgullosa", t: "Lo has conseguido." },
          { m: "vulnerable", t: "Y esta vez no me preocupa cómo queda la foto." },
          { m: "personal_orgullosa", t: "Me importa que estés bien." },
          { m: "profesional", t: "Esta vez no te voy a preparar la respuesta." },
          { m: "profesional", t: "Habla." },
          { m: "orgullosa", t: "Quiero ver qué haces cuando nadie te está diciendo qué imagen tienes que vender." },
          { m: "profesional", t: "Te van a hacer una pregunta incómoda." },
          { m: "profesional", t: "Y no quiero interrumpirte." },
          { m: "negociadora", t: "Si quieres responder de forma diplomática, hazlo." },
          { m: "profesional", t: "Si quieres ser directo, también." },
          { m: "orgullosa", t: "Lo importante es que después puedas decir que era tu respuesta." },
          { m: "vulnerable", t: "Yo pasé demasiado tiempo dejando que otros decidieran qué versión de mí era más vendible." },
          { m: "profesional", t: "No quiero hacerte lo mismo." },
        ],
        snap: (g) => ({ matchCount: (g.matchHistory || []).length }),
        check: (g, snap) => (g.matchHistory || []).slice(snap.matchCount).some((m) => (m.rating || 0) >= 7) },
      /* CAPÍTULO 13 — El contrato grande */
      { title: "El contrato grande", zone: "patro",
        objective: "Alcanza el tier/OVR del gran hito comercial.",
        intro: [
          { m: "orgullosa", t: "Bien." },
          { m: "profesional", t: "No necesitabas que te pusiera palabras." },
          { m: "orgullosa", t: "Eso significa que la imagen ya es tuya." },
          { m: "negociadora", t: "Mucho más fácil de gestionar cuando el jugador sabe quién es." },
          { m: "negociadora", t: "Este es el contrato que cambia las cosas." },
          { m: "negociadora", t: "Dinero. Visibilidad. Eventos. Todo." },
          { m: "profesional", t: "También significa que habrá más ojos sobre ti." },
          { m: "negociadora", t: "Más cámaras." },
          { m: "profesional", t: "Más opiniones." },
          { m: "negociadora", t: "Más gente convencida de que sabe quién eres." },
          { m: "orgullosa", t: "Es exactamente el tipo de oportunidad que buscábamos cuando nos conocimos." },
          { m: "profesional", t: "Pero ahora hay una diferencia." },
          { m: "profesional", t: "Ya no quiero preguntarte si puedes soportarlo." },
          { m: "orgullosa", t: "Quiero preguntarte si lo quieres." },
          { m: "negociadora", t: "Porque si dices que sí, voy a hacer que el acuerdo sea lo mejor posible." },
          { m: "vulnerable", t: "Y si dices que no, no voy a pensar que has fracasado." },
          { m: "profesional", t: "Tu carrera no tiene que parecer impresionante para los demás todo el tiempo." },
        ],
        snap: (g) => ({ tierId: g.tier.id }),
        check: (g, snap) => {
          const next = TIERS.find((t) => t.id === snap.tierId + 1);
          return (next && calcOVR(g.player.stats) >= next.minOvr) || g.tier.id !== snap.tierId;
        } },
      /* CAPÍTULO 14 — No eres una marca */
      { title: "No eres una marca", zone: "atico",
        objective: "Completa una racha de 7 días.",
        intro: [
          { m: "orgullosa", t: "Bien." },
          { m: "negociadora", t: "Ahora sí." },
          { m: "orgullosa", t: "Ya estás preparado para decidir qué quieres hacer con todo esto." },
          { m: "preocupada", t: "Creo que he cometido un error." },
          { m: "vulnerable", t: "He pasado tanto tiempo intentando ser alguien que nadie pudiera reemplazar..." },
          { m: "vulnerable", t: "...que olvidé que una persona no funciona como una marca." },
          { m: "preocupada", t: "Una marca puede cambiar de campaña." },
          { m: "vulnerable", t: "Puede cambiar de imagen." },
          { m: "personal_orgullosa", t: "Puede desaparecer y volver seis meses después con otro nombre." },
          { m: "vulnerable", t: "Una persona no." },
          { m: "preocupada", t: "Y yo estaba empezando a tratar mi propia vida como si fuera una campaña que nunca podía salir mal." },
          { m: "personal_orgullosa", t: "Tú me has obligado a acordarme." },
          { m: "vulnerable", t: "Porque contigo podía quitarme la máscara y seguir siendo Karla." },
          { m: "personal_orgullosa", t: "Y eso vale más para mí que cualquier contrato." },
        ],
        snap: () => ({}),
        progressCount: (g) => g.player.streak || 0, progressGoal: 7,
        check: (g) => (g.player.streak || 0) >= 7 },
      /* CAPÍTULO 15 — La última negociación */
      { title: "La última negociación", zone: "patro",
        objective: "Alcanza el nivel de élite.",
        intro: [
          { m: "personal_orgullosa", t: "Gracias." },
          { m: "vulnerable", t: "No por hacerme mejor profesional." },
          { m: "personal_orgullosa", t: "Por recordarme que también soy una persona." },
          { m: "negociadora", t: "Tengo una última propuesta." },
          { m: "profesional", t: "No es para una marca." },
          { m: "orgullosa", t: "Es para ti." },
          { m: "profesional", t: "Quiero que firmemos una cosa antes de seguir." },
          { m: "negociadora", t: "No un contrato." },
          { m: "profesional", t: "Un acuerdo entre nosotros." },
          { m: "orgullosa", t: "Que tu carrera sea tuya antes que de cualquier persona que intente venderla." },
          { m: "negociadora", t: "Yo voy a negociar. Voy a proteger tus intereses. Voy a buscar las mejores oportunidades." },
          { m: "profesional", t: "Pero no voy a decidir quién tienes que ser." },
          { m: "orgullosa", t: "Eso lo decides tú." },
          { m: "vulnerable", t: "Supongo que es la primera vez que puedo decir eso sin miedo a que alguien me quite algo." },
          { m: "negociadora", t: "Y no te acostumbres a verme tan filosófica." },
          { m: "orgullosa", t: "Tenemos una reputación que mantener." },
        ],
        snap: () => ({}),
        check: (g) => g.tier.id >= TIERS[TIERS.length - 1].id },
      /* FINAL — La persona detrás del nombre */
      { title: "La persona detrás del nombre", zone: "atico",
        objective: "Alcanza el hito final.",
        intro: [
          { m: "orgullosa", t: "Perfecto." },
          { m: "profesional", t: "Ahora sí puedo decir que eres un profesional." },
          { m: "orgullosa", t: "No porque hayas conseguido un contrato enorme." },
          { m: "vulnerable", t: "Porque sabes qué quieres hacer con él." },
          { m: "vulnerable", t: "¿Sabes qué es lo más raro?" },
          { m: "vulnerable", t: "Al principio pensé que iba a convertirte en una estrella." },
          { m: "personal_orgullosa", t: "Y acabaste recordándome por qué quería serlo yo." },
          { m: "vulnerable", t: "No por el dinero." },
          { m: "vulnerable", t: "No por las fotos." },
          { m: "personal_orgullosa", t: "Ni siquiera por entrar en todas esas salas donde antes no podía entrar." },
          { m: "vulnerable", t: "Por poder elegir quién quiero ser." },
          { m: "personal_orgullosa", t: "Creo que durante mucho tiempo confundí que me miraran con que me conocieran." },
          { m: "vulnerable", t: "Ahora sé que no es lo mismo." },
          { m: "personal_orgullosa", t: "Y contigo aprendí que alguien puede conocerte sin necesitar que seas impresionante todo el tiempo." },
          { m: "vulnerable", t: "Gracias." },
          { m: "personal_orgullosa", t: "De verdad." },
        ],
        snap: () => ({}),
        check: (g) => g.tier.id >= TIERS[TIERS.length - 1].id },
      /* EPÍLOGO — Sin cámaras (última etapa: final:true, entrega el pin y +1 MEN al entrar aquí) */
      { title: "Sin cámaras", zone: "casa", final: true,
        intro: [
          { m: "personal_orgullosa", t: "Lo has conseguido." },
          { m: "vulnerable", t: "Y esta vez no voy a pensar en cómo queda la historia." },
          { m: "personal_orgullosa", t: "Me basta con saber que es nuestra." },
          { m: "personal_orgullosa", t: "No necesito saber cómo va tu imagen esta semana." },
          { m: "personal_orgullosa", t: "Ni cuántos seguidores has ganado." },
          { m: "vulnerable", t: "Solo dime si estás bien." },
          { m: "personal_orgullosa", t: "Eso sí que me interesa." },
          { m: "vulnerable", t: "Qué ironía." },
          { m: "personal_orgullosa", t: "Hace meses habría empezado esta conversación preguntándote por tus números." },
          { m: "vulnerable", t: "Ahora solo quiero saber cómo estás." },
          { m: "personal_orgullosa", t: "Supongo que eso significa que hemos hecho bien las cosas." },
        ],
        setFlags: ["karlaPinEarned", "karlaStoryComplete"],
        grantItem: "karla_pin", reveal: "karla_pin",
        reward: (g) => {
          const stats = { ...g.player.stats };
          stats.MEN = Math.min(99, stats.MEN + 1);
          return { ...g, player: { ...g.player, stats } };
        } },
    ],
  }],
};

/* ============================================================
   BEKA · séptima campaña, DLC independiente ("Choque de clases").
   Prólogo + 15 capítulos + final + epílogo, misma arquitectura que el
   resto. Rival directa de otro club: en el campo compite, en la
   Discoteca (donde trabaja algunas noches) deja de competir. Su
   "angry" es pique competitivo/chulería, nunca enfado real — igual
   que Karla/Yuna.

   Zona nueva para objetivos: "Visita la Discoteca" (capítulos 3/4/8/11/14)
   no tenía forma de comprobarse en el motor (nada registraba qué zonas
   había visitado el jugador) — se añadió la infraestructura mínima
   (game.zoneVisits, ver useEffect junto a visitedZoneObj, y el helper
   zoneVisitedSince) sin tocar ningún otro sistema.

   Estructura FINAL/EPÍLOGO distinta a las demás campañas: el documento
   coloca la entrega del pin dentro de la escena "FINAL — Desde abajo"
   y deja el EPÍLOGO como una coda corta sin recompensa. El motor solo
   dispara reward() en la ÚLTIMA etapa (la marcada final:true), así que
   aquí el diálogo de la entrega del pin se movió a la etapa EPÍLOGO
   (ver más abajo) para que dispare correctamente — ni una línea de
   diálogo del documento se ha tocado ni recortado, solo se reordenó
   en qué etapa del motor cae cada bloque para que el pin se entregue
   en el momento narrativo correcto. */
const BEKA_STORY = {
  npc: "beka",
  chapters: [{
    id: "cap1",
    title: "La historia de Beka",
    trigger: () => true,
    stages: [
      /* PRÓLOGO — La chica del balón (rework de diálogos, ver
         FUTABITA_Beka_Rework_Narrativo_para_Code.docx — no toca objetivos ni
         comportamiento, solo sustituye el texto de las escenas). Mismo fix de
         contradicción temporal que el resto de personajes: los bloques de
         reacción "cuando el jugador vuelve tras cumplir el objetivo" se han
         movido al PRINCIPIO de la etapa siguiente. */
      { title: "La chica del balón", zone: "barrio",
        objective: "Completa un partido.",
        intro: [
          { m: "idle", t: "Tú eres {player}, ¿no?" },
          { m: "idle", t: "El del {club}." },
          { m: "angry", t: "Te he visto jugar." },
          { m: "idle", t: "No está mal." },
          { m: "angry", t: "No pongas esa cara. «No está mal» es bastante para ser el primer día." },
          { m: "idle", t: "Yo soy Beka. Juego en otro club." },
          { m: "angry", t: "Y antes de que preguntes: sí. Soy bastante mejor de lo que parezco." },
          { m: "idle", t: "Aunque supongo que eso tendremos que comprobarlo." },
          { m: "angry", t: "Porque una cosa es ver a alguien en un partido y otra muy distinta es tenerlo delante." },
          { m: "idle", t: "Ahora ya sé quién eres." },
          { m: "angry", t: "Así que cuando vuelva a verte jugar voy a fijarme en algo más que en si marcas." },
          { m: "idle", t: "Quiero saber si de verdad eres tan bueno como dicen." },
          { m: "angry", t: "Y si no lo eres, te lo voy a decir." },
        ],
        setFlags: ["bekaMet"],
        snap: (g) => ({ matchCount: (g.matchHistory || []).length }),
        check: (g, snap) => (g.matchHistory || []).length > snap.matchCount },
      /* CAPÍTULO 1 — No te emociones */
      { title: "No te emociones", zone: "ciudad-dep",
        objective: "Consigue una victoria y marca al menos 1 gol o asistencia desde el inicio del capítulo.",
        intro: [
          { m: "angry", t: "Bien." },
          { m: "idle", t: "Ahora ya tengo algo con lo que compararte." },
          { m: "angry", t: "Nos veremos otra vez." },
          { m: "angry", t: "He visto tu último partido." },
          { m: "idle", t: "Has mejorado." },
          { m: "angry", t: "No demasiado. No te vengas arriba." },
          { m: "idle", t: "Pero ahora sí entiendo por qué me llamó la atención tu nombre." },
          { m: "angry", t: "Cuando alguien empieza a mejorar, hay dos opciones." },
          { m: "idle", t: "O te alegras y sigues a lo tuyo..." },
          { m: "angry", t: "...o empiezas a preguntarte si vas a dejar que te pase por encima." },
          { m: "idle", t: "Yo soy más de la segunda." },
          { m: "angry", t: "Si quieres que te tome en serio, hay una cosa que puedes hacer." },
          { m: "angry", t: "Ganar." },
          { m: "idle", t: "Y no me vale una victoria cualquiera." },
          { m: "angry", t: "Quiero que demuestres que puedes aparecer cuando importa." },
        ],
        snap: (g) => ({ matchCount: (g.matchHistory || []).length, goals: careerGoals(g), assists: careerAssists(g) }),
        subs: [
          (g, snap) => (g.matchHistory || []).slice(snap.matchCount).some((m) => m.res === "V"),
          (g, snap) => careerGoals(g) > snap.goals || careerAssists(g) > snap.assists,
        ],
        check: (g, snap) => (g.matchHistory || []).slice(snap.matchCount).some((m) => m.res === "V") &&
          (careerGoals(g) > snap.goals || careerAssists(g) > snap.assists) },
      /* CAPÍTULO 2 — Te estoy empezando a conocer */
      { title: "Te estoy empezando a conocer", zone: "barrio",
        objective: "Completa 3 días de objetivos y consigue una nota de partido igual o superior a tu mejor nota del capítulo anterior.",
        intro: [
          { m: "celebracion", t: "Vale." },
          { m: "celebracion", t: "Eso sí ha estado bien." },
          { m: "angry", t: "Pero una vez no cambia nada." },
          { m: "idle", t: "Ahora quiero ver si puedes hacerlo otra vez." },
          { m: "idle", t: "Empiezo a saber cómo juegas." },
          { m: "angry", t: "Y eso es malo para ti." },
          { m: "idle", t: "Ya sé cuándo aceleras." },
          { m: "idle", t: "Cuándo te escondes." },
          { m: "idle", t: "Cuándo intentas hacer demasiado porque quieres demostrar algo." },
          { m: "angry", t: "Al principio solo sabía que eras bueno." },
          { m: "idle", t: "Ahora empiezo a saber por qué." },
          { m: "angry", t: "Así que la próxima vez no te va a salir tan fácil." },
          { m: "idle", t: "Y espero que tú también estés aprendiendo cómo juego yo." },
          { m: "angry", t: "Porque si esto va a ser una rivalidad de verdad, no pienso ser la única que estudie." },
          { m: "idle", t: "Quiero que me obligues a cambiar." },
          { m: "angry", t: "Si te haces mejor, yo tendré que hacerme mejor." },
          { m: "idle", t: "Ese es el trato." },
        ],
        snap: (g) => ({ since: todayStr(), matchCount: (g.matchHistory || []).length, bestRating: g.bestRating || 0 }),
        subs: [
          { count: (g, snap) => daysGoalsCompletedSince(g, snap.since), goal: 3 },
          (g, snap) => (g.matchHistory || []).slice(snap.matchCount).some((m) => (m.rating || 0) >= snap.bestRating),
        ],
        check: (g, snap) => daysGoalsCompletedSince(g, snap.since) >= 3 &&
          (g.matchHistory || []).slice(snap.matchCount).some((m) => (m.rating || 0) >= snap.bestRating) },
      /* CAPÍTULO 3 — La otra vida */
      { title: "La otra vida", zone: "discoteca",
        objective: "Visita la Discoteca.",
        intro: [
          { m: "idle", t: "Eso quería." },
          { m: "angry", t: "Que me obligaras a mejorar." },
          { m: "idle", t: "Ahora empieza a ser divertido." },
          { m: "disco_happy", t: "¿Qué haces tú aquí?" },
          { m: "disco_happy", t: "Espera. No me digas que has venido a buscarme." },
          { m: "disco_happy", t: "Porque si es así, vas a tener que explicarte." },
          { m: "disco_seria", t: "Trabajo aquí algunas noches." },
          { m: "disco_happy", t: "Sí. Ya sé que no pega mucho con la imagen que te habías hecho de mí." },
          { m: "disco_seria", t: "Pero aquí puedo estar tranquila." },
          { m: "disco_happy", t: "Bueno. Todo lo tranquila que puede estar una persona trabajando con música a todo volumen." },
          { m: "disco_seria", t: "En el campo todo el mundo sabe quién soy." },
          { m: "disco_happy", t: "Aquí soy la chica que está trabajando esta noche." },
          { m: "disco_seria", t: "Y, sinceramente, a veces eso me gusta." },
          { m: "disco_happy", t: "Nadie me pregunta cuánto he corrido ni quién ha ganado." },
          { m: "disco_seria", t: "Solo si la mesa quiere otra bebida." },
          { m: "disco_happy", t: "Así que ahora ya sabes algo de mí que no sale cuando juego." },
        ],
        setFlags: ["bekaDisco"],
        snap: () => ({ since: todayStr() }),
        check: (g, snap) => zoneVisitedSince(g, "discoteca", snap.since) },
      /* CAPÍTULO 4 — Después del partido */
      { title: "Después del partido", zone: "discoteca",
        objective: "Gana un partido y visita la Discoteca después.",
        intro: [
          { m: "disco_happy", t: "Una cosa." },
          { m: "disco_happy", t: "Aquí no somos rivales." },
          { m: "disco_seria", t: "Al menos hasta que salgamos por esa puerta." },
          { m: "disco_happy", t: "¿Has ganado?" },
          { m: "disco_happy", t: "Entonces hoy puedes quedarte." },
          { m: "disco_seria", t: "Me gusta venir aquí después de jugar." },
          { m: "disco_happy", t: "Durante un rato nadie me pregunta por la clasificación." },
          { m: "disco_seria", t: "Ni por el próximo partido." },
          { m: "disco_happy", t: "Solo por si quiero otra canción." },
          { m: "disco_seria", t: "Es raro." },
          { m: "disco_happy", t: "En el campo estoy pensando todo el tiempo en lo que viene después." },
          { m: "disco_seria", t: "Aquí puedo terminar una noche y ya está." },
          { m: "disco_happy", t: "Sin analizarla." },
          { m: "disco_seria", t: "Quizá por eso me gusta hablar contigo aquí." },
          { m: "disco_happy", t: "No tengo que pensar en cómo voy a ganarte." },
          { m: "disco_seria", t: "Puedo simplemente escucharte." },
        ],
        snap: (g) => ({ matchCount: (g.matchHistory || []).length, since: todayStr() }),
        subs: [
          (g, snap) => (g.matchHistory || []).slice(snap.matchCount).some((m) => m.res === "V"),
          (g, snap) => zoneVisitedSince(g, "discoteca", snap.since),
        ],
        check: (g, snap) => (g.matchHistory || []).slice(snap.matchCount).some((m) => m.res === "V") &&
          zoneVisitedSince(g, "discoteca", snap.since) },
      /* CAPÍTULO 5 — No todo es ganar */
      { title: "No todo es ganar", zone: "parque",
        objective: "Mantén una racha de 3 días y completa al menos 3 días de objetivos diarios.",
        intro: [
          { m: "disco_seria", t: "Ha estado bien." },
          { m: "disco_happy", t: "No la noche. La conversación." },
          { m: "disco_happy", t: "No pongas esa cara. No me arrepiento de haberlo dicho." },
          { m: "idle", t: "Hoy no te voy a retar." },
          { m: "idle", t: "Relájate." },
          { m: "idle", t: "Bueno... intenta." },
          { m: "agotada", t: "¿Sabes qué pasa cuando llevas demasiado tiempo intentando demostrar algo?" },
          { m: "idle", t: "Que un día ya no sabes si estás jugando porque te gusta o porque tienes miedo de quedarte atrás." },
          { m: "angry", t: "A mí me pasa bastante." },
          { m: "agotada", t: "Al principio quería ganar porque me encantaba competir." },
          { m: "idle", t: "Luego empecé a pensar que si dejaba de ganar, alguien iba a ocupar mi sitio." },
          { m: "angry", t: "Y cuando piensas así, todo se convierte en una carrera." },
          { m: "agotada", t: "Incluso los días en los que estás cansada." },
          { m: "idle", t: "Incluso los días en los que no te apetece." },
          { m: "angry", t: "Y ahí es cuando competir deja de ser divertido." },
          { m: "idle", t: "No te estoy diciendo que aflojes." },
          { m: "agotada", t: "Solo quiero recordar por qué empezamos." },
        ],
        snap: () => ({ since: todayStr() }),
        subs: [
          { count: (g) => g.player.streak || 0, goal: 3 },
          { count: (g, snap) => daysGoalsCompletedSince(g, snap.since), goal: 3 },
        ],
        check: (g, snap) => (g.player.streak || 0) >= 3 && daysGoalsCompletedSince(g, snap.since) >= 3 },
      /* CAPÍTULO 6 — Que suba el nivel */
      { title: "Que suba el nivel", zone: "car",
        objective: "Mejora tu OVR desde que empezó el capítulo y completa 4 días de objetivos.",
        intro: [
          { m: "idle", t: "No te estoy pidiendo que me entiendas." },
          { m: "idle", t: "Solo... que no te olvides de disfrutarlo." },
          { m: "angry", t: "He oído que estás mejorando." },
          { m: "angry", t: "Qué rabia." },
          { m: "idle", t: "Pero también me gusta." },
          { m: "angry", t: "Si tú subes, yo tengo que subir." },
          { m: "idle", t: "Y si yo subo, tú no puedes quedarte quieto." },
          { m: "celebracion", t: "Así funciona esto." },
          { m: "angry", t: "No quiero que nuestra rivalidad sea una excusa para hablar mucho y mejorar poco." },
          { m: "idle", t: "Quiero que cuando nos crucemos dentro de unos meses podamos decir que los dos somos mejores por habernos tenido delante." },
          { m: "celebracion", t: "Así que aprieta." },
          { m: "angry", t: "Yo voy a hacer lo mismo." },
        ],
        snap: (g) => ({ ovr: calcOVR(g.player.stats), since: todayStr() }),
        subs: [
          (g, snap) => calcOVR(g.player.stats) > snap.ovr,
          { count: (g, snap) => daysGoalsCompletedSince(g, snap.since), goal: 4 },
        ],
        check: (g, snap) => calcOVR(g.player.stats) > snap.ovr && daysGoalsCompletedSince(g, snap.since) >= 4 },
      /* CAPÍTULO 7 — La gente empieza a mirar */
      { title: "La gente empieza a mirar", zone: "prensa",
        objective: "Sube +2 tu media (OVR) o cambia de categoría, y juega un partido después.",
        intro: [
          { m: "celebracion", t: "Ahora sí." },
          { m: "angry", t: "Vuelve a hacerlo." },
          { m: "celebracion", t: "Porque yo también voy a hacerlo." },
          { m: "idle", t: "Te están empezando a reconocer." },
          { m: "angry", t: "No te emociones." },
          { m: "idle", t: "La gente te mira cuando ganas y opina cuando pierdes." },
          { m: "disco_seria", t: "Y cuando eso empieza, es difícil volver atrás." },
          { m: "idle", t: "Yo llevo un poco más de tiempo sabiendo cómo funciona." },
          { m: "angry", t: "Primero te gusta que te reconozcan." },
          { m: "idle", t: "Después empiezas a pensar en lo que esperan de ti." },
          { m: "disco_seria", t: "Y entonces cada partido pesa un poco más." },
          { m: "idle", t: "No quiero que te pase lo mismo que a mí." },
          { m: "angry", t: "Aunque probablemente te va a pasar." },
          { m: "disco_seria", t: "Si algún día te pesa, ven aquí." },
          { m: "disco_happy", t: "Pero no esperes que te deje ganar." },
        ],
        snap: (g) => ({ tierId: g.tier.id, ovr: calcOVR(g.player.stats), matchCount: (g.matchHistory || []).length }),
        subs: [
          (g, snap) => calcOVR(g.player.stats) >= snap.ovr + 2 || g.tier.id !== snap.tierId,
          (g, snap) => (g.matchHistory || []).length > snap.matchCount,
        ],
        check: (g, snap) => (calcOVR(g.player.stats) >= snap.ovr + 2 || g.tier.id !== snap.tierId) &&
          (g.matchHistory || []).length > snap.matchCount },
      /* CAPÍTULO 8 — Ya no es solo una rivalidad */
      { title: "Ya no es solo una rivalidad", zone: "discoteca",
        objective: "Visita la Discoteca y completa 2 días de objetivos diarios desde el inicio del capítulo.",
        intro: [
          { m: "disco_seria", t: "Bien." },
          { m: "disco_happy", t: "Ahora ya sabes lo que significa que empiecen a mirarte." },
          { m: "disco_seria", t: "Y todavía sigues aquí." },
          { m: "disco_happy", t: "Hoy tenemos una regla." },
          { m: "disco_happy", t: "No hablamos de fútbol." },
          { m: "disco_seria", t: "Una noche." },
          { m: "disco_happy", t: "Puedes sobrevivir." },
          { m: "disco_happy", t: "Podemos hablar de música." },
          { m: "disco_seria", t: "De comida." },
          { m: "disco_happy", t: "De cosas absurdas que no tienen nada que ver con nuestras carreras." },
          { m: "disco_seria", t: "Y si empiezas a hablar de tu próximo partido, te vas." },
          { m: "disco_happy", t: "Lo digo en serio." },
          { m: "disco_seria", t: "Es raro." },
          { m: "disco_seria", t: "Contigo puedo estar aquí y no pensar en quién es mejor." },
          { m: "disco_happy", t: "Eso no significa que vaya a dejar de intentar ganarte." },
          { m: "disco_seria", t: "Solo significa que ahora hay cosas que me importan además de eso." },
          { m: "disco_happy", t: "Y no voy a hacer una lista." },
          { m: "disco_seria", t: "No preguntes." },
        ],
        setFlags: ["bekaClose"],
        snap: () => ({ since: todayStr() }),
        subs: [
          (g, snap) => zoneVisitedSince(g, "discoteca", snap.since),
          { count: (g, snap) => daysGoalsCompletedSince(g, snap.since), goal: 2 },
        ],
        check: (g, snap) => zoneVisitedSince(g, "discoteca", snap.since) && daysGoalsCompletedSince(g, snap.since) >= 2 },
      /* CAPÍTULO 9 — Te estás alejando */
      { title: "Te estás alejando", zone: "barrio",
        objective: "Mejora tu OVR o sube de categoría desde que empezó el capítulo.",
        intro: [
          { m: "disco_seria", t: "Supongo que ya no eres solo el tío al que quiero ganar." },
          { m: "disco_happy", t: "No preguntes qué significa eso." },
          { m: "idle", t: "Así que has subido." },
          { m: "idle", t: "Enhorabuena." },
          { m: "angry", t: "Ya está. Se acabó la ceremonia." },
          { m: "idle", t: "Me alegro por ti." },
          { m: "agotada", t: "Solo que ahora parece que corres más rápido que yo." },
          { m: "angry", t: "Y no me gusta quedarme atrás." },
          { m: "idle", t: "Antes podía pensar que si tú mejorabas, yo simplemente tendría que alcanzarte." },
          { m: "agotada", t: "Ahora empiezo a tener la sensación de que la distancia crece." },
          { m: "angry", t: "Y eso me pone de mal humor." },
          { m: "idle", t: "No contigo." },
          { m: "angry", t: "Conmigo." },
          { m: "agotada", t: "Porque no quiero que todo lo que hemos construido termine convirtiéndose en mí intentando alcanzarte desde atrás." },
          { m: "idle", t: "Así que voy a hacer lo que siempre hago." },
          { m: "angry", t: "Entrenar más." },
          { m: "idle", t: "Y esta vez no quiero que me esperes." },
        ],
        snap: (g) => ({ tierId: g.tier.id, ovr: calcOVR(g.player.stats) }),
        check: (g, snap) => g.tier.id !== snap.tierId || calcOVR(g.player.stats) > snap.ovr },
      /* CAPÍTULO 10 — No necesito que me salves */
      { title: "No necesito que me salves", zone: "enfermeria",
        objective: "Recupera una forma de «buen» o «alza», completa 3 días de objetivos y consigue una victoria.",
        intro: [
          { m: "angry", t: "No me esperes." },
          { m: "idle", t: "Si te alcanzo, será porque yo también he llegado." },
          { m: "agotada", t: "Estoy bien." },
          { m: "agotada", t: "Deja de mirarme así." },
          { m: "angry", t: "No necesito que me salves." },
          { m: "idle", t: "Necesito seguir." },
          { m: "agotada", t: "Porque si paro, siento que todo el mundo me adelanta." },
          { m: "idle", t: "Y no pienso volver a empezar desde abajo." },
          { m: "angry", t: "Ya sé que suena mal." },
          { m: "agotada", t: "También sé que no puedo seguir apretando cada vez que tengo miedo." },
          { m: "idle", t: "Pero cuando llevas tanto tiempo construyendo algo, parar parece perderlo." },
          { m: "angry", t: "No quiero que me mires como si estuviera rota." },
          { m: "agotada", t: "Quiero volver a estar bien." },
          { m: "idle", t: "Y si para eso tengo que aceptar que hoy no puedo con todo, supongo que tendré que hacerlo." },
          { m: "angry", t: "Pero no me conviertas en un proyecto." },
          { m: "idle", t: "Ayúdame solo a recordar que descansar también forma parte de seguir." },
        ],
        setFlags: ["bekaCrisis", "bekaCrisisResolved"],
        snap: (g) => ({ since: todayStr(), matchCount: (g.matchHistory || []).length }),
        subs: [
          (g) => g.player.form === "buen" || g.player.form === "alza",
          { count: (g, snap) => daysGoalsCompletedSince(g, snap.since), goal: 3 },
          (g, snap) => (g.matchHistory || []).slice(snap.matchCount).some((m) => m.res === "V"),
        ],
        check: (g, snap) => (g.player.form === "buen" || g.player.form === "alza") &&
          daysGoalsCompletedSince(g, snap.since) >= 3 &&
          (g.matchHistory || []).slice(snap.matchCount).some((m) => m.res === "V") },
      /* CAPÍTULO 11 — La noche que no hablamos de fútbol */
      { title: "La noche que no hablamos de fútbol", zone: "discoteca",
        objective: "Visita la Discoteca y completa un día de objetivos desde el inicio del capítulo.",
        intro: [
          { m: "idle", t: "Vale." },
          { m: "idle", t: "Quizá no todo sea apretar hasta romper." },
          { m: "angry", t: "Pero no se lo digas a nadie." },
          { m: "disco_happy", t: "Hoy sí." },
          { m: "disco_happy", t: "Cero fútbol." },
          { m: "disco_seria", t: "Ni tu club. Ni el mío. Ni la clasificación." },
          { m: "disco_happy", t: "Y si alguno de los dos lo menciona, paga la siguiente ronda." },
          { m: "disco_seria", t: "Hemos hablado tanto de mejorar que a veces se nos olvida que también tenemos que vivir." },
          { m: "disco_happy", t: "Así que cuéntame algo que no tenga nada que ver con tu carrera." },
          { m: "disco_seria", t: "Yo también te contaré algo." },
          { m: "disco_happy", t: "Algo de verdad." },
          { m: "disco_seria", t: "¿Sabes qué es lo raro?" },
          { m: "disco_seria", t: "Que cuando estoy aquí contigo no siento que tenga que demostrar nada." },
          { m: "disco_happy", t: "Ni ser mejor." },
          { m: "disco_seria", t: "Ni estar más fuerte." },
          { m: "disco_happy", t: "Ni fingir que estoy perfectamente." },
          { m: "disco_seria", t: "Y eso me gusta." },
          { m: "disco_seria", t: "Mucho." },
        ],
        setFlags: ["bekaTrust"],
        snap: () => ({ since: todayStr() }),
        subs: [
          (g, snap) => zoneVisitedSince(g, "discoteca", snap.since),
          (g, snap) => daysGoalsCompletedSince(g, snap.since) >= 1,
        ],
        check: (g, snap) => zoneVisitedSince(g, "discoteca", snap.since) && daysGoalsCompletedSince(g, snap.since) >= 1 },
      /* CAPÍTULO 12 — Lo que cuesta seguir */
      { title: "Lo que cuesta seguir", zone: "casa",
        objective: "Completa 3 días de objetivos y gana el siguiente partido.",
        intro: [
          { m: "disco_seria", t: "No voy a repetirlo." },
          { m: "disco_happy", t: "Así que aprovecha." },
          { m: "idle", t: "Hoy quería preguntarte algo." },
          { m: "idle", t: "¿Tú también tienes miedo?" },
          { m: "idle", t: "A quedarte atrás." },
          { m: "idle", t: "A que todo esto termine siendo demasiado." },
          { m: "agotada", t: "Yo sí." },
          { m: "idle", t: "A veces miro lo lejos que hemos llegado y pienso que debería estar disfrutándolo más." },
          { m: "agotada", t: "Pero una parte de mí sigue pensando en lo que falta." },
          { m: "idle", t: "El siguiente partido. El siguiente nivel. La siguiente temporada." },
          { m: "angry", t: "Supongo que por eso seguimos." },
          { m: "idle", t: "Porque si dejamos de correr, aparece la pregunta de qué queda cuando ya no hay nada que perseguir." },
          { m: "agotada", t: "Y todavía no sé responderla." },
          { m: "idle", t: "Pero creo que es más fácil cuando hay alguien que entiende lo mismo." },
          { m: "angry", t: "No te pongas sentimental." },
          { m: "idle", t: "Solo estoy diciendo que quizá no estamos tan solos como pensábamos." },
        ],
        snap: (g) => ({ since: todayStr(), matchCount: (g.matchHistory || []).length }),
        subs: [
          { count: (g, snap) => daysGoalsCompletedSince(g, snap.since), goal: 3 },
          (g, snap) => (g.matchHistory || []).slice(snap.matchCount).some((m) => m.res === "V"),
        ],
        check: (g, snap) => daysGoalsCompletedSince(g, snap.since) >= 3 &&
          (g.matchHistory || []).slice(snap.matchCount).some((m) => m.res === "V") },
      /* CAPÍTULO 13 — Caminos distintos */
      { title: "Caminos distintos", zone: "estadio",
        objective: "Sube de categoría y consigue una victoria.",
        intro: [
          { m: "idle", t: "Vale." },
          { m: "idle", t: "Entonces no soy la única." },
          { m: "angry", t: "Eso no significa que vaya a aflojar." },
          { m: "idle", t: "Pero sí significa que ahora sé por qué sigo." },
          { m: "idle", t: "Mírate." },
          { m: "idle", t: "Cuando te conocí estabas en Tercera." },
          { m: "celebracion", t: "Ahora estás aquí." },
          { m: "idle", t: "Y yo también he llegado más lejos de lo que pensaba." },
          { m: "disco_seria", t: "Lo curioso es que durante mucho tiempo pensé que nuestro objetivo era acabar en el mismo sitio." },
          { m: "idle", t: "Ahora creo que no." },
          { m: "disco_seria", t: "Supongo que eso es lo que me gusta de nuestra historia." },
          { m: "disco_seria", t: "Ninguno de los dos se quedó esperando al otro." },
          { m: "idle", t: "Tú seguiste tu camino." },
          { m: "celebracion", t: "Yo seguí el mío." },
          { m: "disco_seria", t: "Y aun así seguimos encontrándonos." },
          { m: "idle", t: "Eso es bastante más difícil que simplemente competir." },
          { m: "celebracion", t: "Así que disfruta esto." },
          { m: "angry", t: "Porque todavía quiero ver hasta dónde llegas." },
        ],
        snap: (g) => ({ tierId: g.tier.id, matchCount: (g.matchHistory || []).length }),
        subs: [
          (g, snap) => g.tier.id !== snap.tierId,
          (g, snap) => (g.matchHistory || []).slice(snap.matchCount).some((m) => m.res === "V"),
        ],
        check: (g, snap) => g.tier.id !== snap.tierId &&
          (g.matchHistory || []).slice(snap.matchCount).some((m) => m.res === "V") },
      /* CAPÍTULO 14 — Todavía no he terminado */
      { title: "Todavía no he terminado", zone: "discoteca",
        objective: "Completa un partido y visita la Discoteca.",
        intro: [
          { m: "celebracion", t: "Sigue." },
          { m: "angry", t: "Todavía quiero ver hasta dónde llegas." },
          { m: "disco_happy", t: "Hola." },
          { m: "disco_happy", t: "Cuánto tiempo." },
          { m: "disco_seria", t: "He estado ocupada." },
          { m: "disco_seria", t: "Entrenando. Jugando. Intentando construir lo mío." },
          { m: "disco_happy", t: "Y no, no te voy a contar todo." },
          { m: "disco_seria", t: "Algunas cosas quiero conseguirlas por mí misma." },
          { m: "disco_happy", t: "Creo que antes confundía estar cerca de alguien con necesitar saberlo todo de esa persona." },
          { m: "disco_seria", t: "Ahora no." },
          { m: "disco_happy", t: "Puedo alegrarme de que te vaya bien sin saber exactamente qué estás haciendo cada día." },
          { m: "disco_seria", t: "Y puedo seguir queriendo ganarte sin que eso cambie lo demás." },
          { m: "disco_happy", t: "Supongo que eso es madurar." },
          { m: "disco_seria", t: "Aunque suena horrible decirlo en voz alta." },
        ],
        snap: (g) => ({ matchCount: (g.matchHistory || []).length, since: todayStr() }),
        subs: [
          (g, snap) => (g.matchHistory || []).length > snap.matchCount,
          (g, snap) => zoneVisitedSince(g, "discoteca", snap.since),
        ],
        check: (g, snap) => (g.matchHistory || []).length > snap.matchCount && zoneVisitedSince(g, "discoteca", snap.since) },
      /* CAPÍTULO 15 — Una última vez (el documento da tres cierres distintos según el
         resultado del partido, pero el propio objetivo exige ganar — así que el cierre de
         empate/derrota nunca llega a ser alcanzable bajo ese objetivo: se usa el cierre de
         victoria, el único que el check() puede confirmar) */
      { title: "Una última vez", zone: "estadio",
        objective: "Gana un partido y supera tu mejor nota del capítulo anterior.",
        intro: [
          { m: "disco_seria", t: "Pero me alegra que sigas aquí." },
          { m: "disco_happy", t: "Aunque sigas siendo un pesado." },
          { m: "angry", t: "Hoy no voy a dejarte pasar." },
          { m: "angry", t: "Ni por amistad. Ni por historia. Ni por nada." },
          { m: "celebracion", t: "Hoy quiero saber quién ha mejorado más." },
          { m: "angry", t: "No quiero que esto sea una despedida." },
          { m: "idle", t: "Quiero que sea una última comprobación." },
          { m: "celebracion", t: "Porque después de todo este tiempo todavía necesito saber una cosa." },
          { m: "angry", t: "Si te vuelvo a ver en el campo dentro de un año, ¿voy a tener que seguir corriendo para alcanzarte?" },
          { m: "celebracion", t: "Espero que sí." },
          { m: "angry", t: "Así que dame un partido que merezca la pena." },
        ],
        snap: (g) => ({ matchCount: (g.matchHistory || []).length, bestRating: g.bestRating || 0 }),
        subs: [
          (g, snap) => (g.matchHistory || []).slice(snap.matchCount).some((m) => m.res === "V"),
          (g, snap) => (g.matchHistory || []).slice(snap.matchCount).some((m) => (m.rating || 0) > snap.bestRating),
        ],
        check: (g, snap) => (g.matchHistory || []).slice(snap.matchCount).some((m) => m.res === "V") &&
          (g.matchHistory || []).slice(snap.matchCount).some((m) => (m.rating || 0) > snap.bestRating) },
      /* FINAL — Desde abajo (sin objetivo propio: se resuelve en cuanto se lee, igual que
         el FINAL de Milly) */
      { title: "Desde abajo", zone: "discoteca",
        objective: "Sin objetivo adicional.",
        intro: [
          { m: "agotada", t: "Vale." },
          { m: "idle", t: "Has sido mejor." },
          { m: "idle", t: "Y eso me fastidia." },
          { m: "celebracion", t: "Pero también me hace ilusión." },
          { m: "disco_seria", t: "¿Te acuerdas del primer día?" },
          { m: "disco_seria", t: "Te vi y pensé: «otro que se cree bueno»." },
          { m: "disco_happy", t: "Luego quise ganarte." },
          { m: "disco_seria", t: "Después quise alcanzarte." },
          { m: "disco_seria", t: "Y en algún momento dejé de saber cuál de las dos cosas me importaba más." },
          { m: "disco_happy", t: "Porque mientras yo intentaba adelantarte, tú estabas convirtiéndote en alguien a quien quería ver bien." },
          { m: "disco_seria", t: "Y eso es bastante raro para alguien a quien al principio solo quería ganar." },
          { m: "disco_happy", t: "Supongo que hemos pasado demasiado tiempo juntos para seguir fingiendo que solo somos rivales." },
          { m: "disco_seria", t: "No voy a dejar de competir contigo." },
          { m: "disco_happy", t: "Pero ya no necesito ganarte para que me importe lo que te pase." },
          { m: "disco_seria", t: "Hemos empezado desde abajo." },
          { m: "disco_seria", t: "Hemos tenido que currárnoslo." },
          { m: "disco_happy", t: "Y mira dónde estamos." },
          { m: "disco_seria", t: "No hemos llegado aquí porque uno haya ganado al otro." },
          { m: "disco_happy", t: "Hemos llegado porque durante meses nos hemos obligado a seguir." },
          { m: "idle", t: "Tú me hiciste mejorar." },
          { m: "disco_seria", t: "Y espero haber hecho lo mismo contigo." },
        ],
        snap: () => ({}), check: () => true },
      /* EPÍLOGO — Nos vemos en el campo (última etapa: final:true, entrega el pin y +1 FUE
         al entrar aquí, ver reward — la escena de la entrega, "RECOMPENSA: entregar
         beka_pin" en el documento, se mantiene aquí desde FINAL: mismo criterio que ya
         usaba la implementación previa de Beka) */
      { title: "Nos vemos en el campo", zone: "discoteca", final: true,
        intro: [
          { m: "idle", t: "Toma." },
          { m: "idle", t: "Este sí es un regalo." },
          { m: "angry", t: "Y no lo pierdas." },
          { m: "disco_happy", t: "Si lo pierdes tendrás que volver a verme." },
          { m: "disco_happy", t: "Así que tampoco sería tan malo." },
          { m: "disco_happy", t: "¿Sabes qué es lo mejor?" },
          { m: "disco_happy", t: "Que ahora ya no necesito una excusa para hablar contigo." },
          { m: "disco_seria", t: "Antes tenía que encontrar una forma de competir." },
          { m: "disco_happy", t: "Ahora puedo simplemente venir." },
          { m: "angry", t: "Aunque tampoco te emociones." },
          { m: "angry", t: "Sigo queriendo ganarte." },
          { m: "disco_happy", t: "Algunas cosas no tienen por qué cambiar." },
          { m: "disco_seria", t: "Nos vemos." },
        ],
        setFlags: ["bekaStoryComplete", "bekaPinEarned"],
        grantItem: "beka_pin", reveal: "beka_pin",
        reward: (g) => {
          const stats = { ...g.player.stats };
          stats.FUE = Math.min(99, stats.FUE + 1);
          return { ...g, player: { ...g.player, stats } };
        } },
    ],
  }],
};

/* ============================================================
   NINA · octava campaña, la pescadora de la Playa. Prólogo + 15
   capítulos + final + epílogo, misma arquitectura que el resto —
   con una pieza nueva: varias etapas llevan una captura de pesca en
   medio de la escena (ver stage.fish/introBefore/introAfter y
   queueStageScene/FishingSequence). Sin outfits nuevos: solo los 5
   moods del documento + "lanzandocaña" para la propia secuencia.

   Las capturas de la campaña son deterministas (el fishId de cada
   etapa siempre es el mismo, nunca al azar) — la aleatoriedad solo
   existe en la pesca libre posterior (ver freeFish/pickWeightedFish),
   tal como pide el documento. */
const NINA_STORY = {
  npc: "nina",
  chapters: [{
    id: "cap1",
    title: "La historia de Nina",
    trigger: () => true,
    stages: [
      /* PRÓLOGO — La chica que nunca tiene prisa (rework de diálogos, ver
         FUTABITA_Nina_Rework_Dialogos_para_Code.docx — no toca objetivos ni
         comportamiento, solo sustituye el texto de las escenas) */
      { title: "La chica que nunca tiene prisa", zone: "playa",
        objective: "Completa un día de alimentación y sueño, y vuelve a hablar con Nina.",
        intro: [
          { m: "seria", t: "¿Tú eres el que viene a entrenar a esta hora?" },
          { m: "happy", t: "Ya decía yo que esa cara de cansancio no podía ser de alguien que hubiera venido a tomar el sol." },
          { m: "seria", t: "Tranquilo. No te estoy juzgando. Yo también he tenido días en los que parecía que dormir era una actividad opcional." },
          { m: "happy", t: "La diferencia es que yo tengo una excusa. Me paso demasiado tiempo aquí." },
          { m: "orgullosa", t: "Soy Nina. Pesco aquí casi todos los días." },
          { m: "happy", t: "Y sí, antes de que preguntes, se me da bastante bien." },
          { m: "seria", t: "Aunque los peces tienen la mala costumbre de no reconocer mis méritos." },
          { m: "happy", t: "Puedes pasarte una hora mirando el agua y no ocurre absolutamente nada." },
          { m: "seria", t: "Y, curiosamente, eso es parte de lo que me gusta." },
          { m: "seria", t: "En el fútbol todo tiene que pasar rápido. Entrenas, juegas, mejoras, miras una estadística y ya estás pensando en la siguiente." },
          { m: "happy", t: "Aquí no." },
          { m: "seria", t: "Aquí puedes lanzar la caña y esperar." },
          { m: "seria", t: "No hay una barra que te diga cuánto falta. No hay un número que te diga si lo estás haciendo bien." },
          { m: "happy", t: "Solo estás tú, el agua y la posibilidad de que algo pique." },
          { m: "seria", t: "Si estás acostumbrado a querer resultados todo el rato, al principio desespera." },
          { m: "happy", t: "Pero quizá por eso te vendría bien." },
          { m: "happy", t: "¿Has vuelto?" },
          { m: "orgullosa", t: "Bien. Entonces quizá sí tengas la paciencia necesaria." },
          { m: "happy", t: "No significa que vayas a pescar nada, ¿eh? Eso sería demasiado fácil." },
          { m: "seria", t: "Pero podemos intentarlo." },
        ],
        setFlags: ["ninaMet"],
        snap: () => ({ since: todayStr() }),
        check: (g, snap) => Object.entries(g.logs || {}).some(([d, l]) => d >= snap.since && l.closed &&
          (l.prot || 0) >= g.player.goals.protein && l.sleep != null && l.sleep >= g.player.goals.sleepGoal) },
      /* CAPÍTULO 1 — Primera caña (desbloqueo del sistema de pesca) */
      { title: "Primera caña", zone: "playa",
        objective: "Captura una sardina.",
        introBefore: [
          { m: "happy", t: "Vale. Hoy sí." },
          { m: "seria", t: "Si has venido hasta aquí después de cuidar un poco la alimentación y descansar, supongo que podemos darte una oportunidad." },
          { m: "happy", t: "No te emociones. La primera vez no vamos a hacer nada complicado." },
          { m: "seria", t: "Quiero que entiendas una cosa antes de empezar." },
          { m: "seria", t: "Pescar no consiste en lanzar la caña y conseguir un premio inmediatamente." },
          { m: "happy", t: "Aunque admito que sería bastante cómodo." },
          { m: "seria", t: "Vas a lanzar, vas a esperar y puede que no pase nada durante un rato." },
          { m: "happy", t: "Y cuando pase algo, no intentes reaccionar como si estuvieras marcando un gol en el último minuto." },
          { m: "seria", t: "Mira la caña. Escucha. Ten paciencia." },
          { m: "happy", t: "Y si sale algo, ya veremos qué has conseguido." },
        ],
        fish: { id: "pez_sardina", rarity: "comun" },
        introAfter: [
          { m: "happy", t: "¡Ahí está!" },
          { m: "orgullosa", t: "Tu primera captura." },
          { m: "happy", t: "¿Ves? No ha sido tan difícil." },
          { m: "seria", t: "Bueno... quizá he hablado demasiado pronto." },
          { m: "happy", t: "Pero guárdala. De verdad." },
          { m: "seria", t: "Puede parecer una sardina cualquiera, pero hace un rato no tenías nada y ahora tienes algo que has conseguido tú." },
          { m: "happy", t: "La próxima vez veremos qué tal se te da volver a intentarlo." },
        ],
        setFlags: ["ninaFishingUnlocked", "ninaFishingIntroDone"],
        snap: () => ({}), check: () => true },
      /* CAPÍTULO 2 — Una captura también se come */
      { title: "Una captura también se come", zone: "playa",
        objective: "Ya tienes la caballa. Cumple el objetivo de proteína durante 2 días.",
        introBefore: [
          { m: "seria", t: "¿Qué has hecho con la sardina?" },
          { m: "happy", t: "No me digas que la has guardado como si fuera un trofeo." },
          { m: "seria", t: "Bueno... en realidad me parece bastante tierno." },
          { m: "happy", t: "Pero también se puede comer." },
          { m: "seria", t: "Y precisamente por eso quería hablar contigo." },
          { m: "seria", t: "El otro día te dije que aquí acababas teniendo algo real delante de ti. Pues ahora quiero que empieces a pensar qué haces con eso después." },
          { m: "seria", t: "Pescar puede ser una actividad, una forma de desconectar... pero si estás intentando ganar peso y ponerte más fuerte, también puedes aprovechar lo que consigues." },
          { m: "happy", t: "No quiero convertir esto en otra lista de cosas que tienes que hacer bien." },
          { m: "seria", t: "Solo quiero que empieces a cuidar un poco más lo que comes." },
          { m: "seria", t: "Haz una cosa durante los próximos días. Intenta cumplir tu objetivo de proteína." },
          { m: "happy", t: "No hace falta que te obsesiones. Solo quiero que veas qué pasa cuando eres constante." },
          { m: "seria", t: "Y cuando vuelvas, volveremos a lanzar la caña." },
          { m: "happy", t: "A ver si tenemos un poco más de suerte que la primera vez." },
        ],
        fish: { id: "pez_caballa", rarity: "comun" },
        introAfter: [
          { m: "orgullosa", t: "Muy bien." },
          { m: "happy", t: "Mira eso. Definitivamente hemos subido un poco el nivel." },
          { m: "seria", t: "Y ahora ya sabes algo importante: no siempre puedes decidir qué vas a conseguir." },
          { m: "happy", t: "Puedes prepararte. Puedes esperar. Puedes volver." },
          { m: "orgullosa", t: "Pero al final tienes que ver qué sale." },
        ],
        snap: (g) => ({ since: todayStr() }),
        progressCount: (g, snap) => proteinDaysSince(g, snap.since), progressGoal: 2,
        check: (g, snap) => proteinDaysSince(g, snap.since) >= 2 },
      /* CAPÍTULO 3 — Ya empiezas a entenderlo */
      { title: "Ya empiezas a entenderlo", zone: "playa",
        objective: "Ya tienes la lubina. Completa 2 días de alimentación.",
        introBefore: [
          { m: "happy", t: "Mira quién ha vuelto." },
          /* reconocimiento de los 2 días de proteína del capítulo anterior: va AQUÍ, al
             empezar este capítulo, porque es el momento en que el jugador acaba de
             cumplirlos. En el documento aparece dentro del capítulo 2, pero allí la
             captura se entrega al ARRANCAR la etapa (ver queueStageScene), así que Nina
             celebraba unos días que todavía no habían pasado. */
          { m: "happy", t: "¿Lo has conseguido?" },
          { m: "orgullosa", t: "Dos días. Bien." },
          { m: "seria", t: "¿Ves? No parecía gran cosa cuando te lo propuse." },
          { m: "happy", t: "Pero estas cosas empiezan así. Un día, luego otro, y de repente ya forma parte de tu rutina." },
          { m: "seria", t: "La otra vez te fuiste con una caballa y un par de días más de proteína cumplidos." },
          { m: "happy", t: "No está mal para alguien que al principio parecía dispuesto a tirar de la caña como si fuera una barra de pesas." },
          { m: "seria", t: "Pero hay una cosa que quiero que entiendas." },
          { m: "seria", t: "La primera captura puede ser suerte." },
          { m: "happy", t: "La segunda también." },
          { m: "seria", t: "Lo interesante es lo que haces después." },
          { m: "seria", t: "Volver aunque no sepas qué va a pasar." },
          { m: "happy", t: "Porque si vienes pensando únicamente en conseguir algo concreto, te vas a desesperar." },
          { m: "seria", t: "Hoy quiero que hagamos otra salida." },
          { m: "happy", t: "No porque yo sepa que vamos a sacar algo mejor." },
          { m: "seria", t: "Porque quiero que empieces a acostumbrarte a este ritmo." },
          { m: "happy", t: "Comes, descansas, vuelves, lanzas la caña... y ves qué pasa." },
        ],
        fish: { id: "pez_lubina", rarity: "poco_comun" },
        introAfter: [
          { m: "orgullosa", t: "Esa ya tiene otra pinta." },
          { m: "happy", t: "No está nada mal." },
          { m: "seria", t: "Y fíjate en que cada vez tienes menos prisa por saber qué va a salir." },
          { m: "happy", t: "Eso sí que es progreso." },
        ],
        snap: (g) => ({ since: todayStr() }),
        progressCount: (g, snap) => daysGoalsCompletedSince(g, snap.since), progressGoal: 2,
        check: (g, snap) => daysGoalsCompletedSince(g, snap.since) >= 2 },
      /* CAPÍTULO 4 — Lo que llevas a casa */
      { title: "Lo que llevas a casa", zone: "playa",
        objective: "Ya tienes la dorada. Completa 3 días de alimentación.",
        introBefore: [
          /* reconocimiento de los días del capítulo anterior (mismo motivo que en el 3) */
          { m: "happy", t: "Has vuelto a cumplirlo." },
          { m: "orgullosa", t: "Empiezas a tener cierta constancia." },
          { m: "seria", t: "¿Nunca te ha pasado que entrenas muchísimo y luego llegas a casa sin ganas de preparar nada?" },
          { m: "happy", t: "A mí sí." },
          { m: "seria", t: "Y por eso aprendí a valorar algo muy sencillo: tener algo en casa que te apetezca comer." },
          { m: "seria", t: "Porque cuando todo lo que ves son números, objetivos y cantidades, comer puede convertirse en otra tarea." },
          { m: "happy", t: "Pero cuando has pescado tú algo, aunque sea una captura pequeña, cambia." },
          { m: "seria", t: "Ya no es solo 'tengo que comer'." },
          { m: "happy", t: "Es 'he conseguido esto, ahora voy a ver qué hago con ello'." },
          { m: "seria", t: "Quiero que empieces a verlo así." },
          { m: "happy", t: "Además, si sale mal, siempre puedes culpar al pez." },
          { m: "happy", t: "Es una técnica culinaria muy avanzada." },
          { m: "seria", t: "Durante unos días cuida un poco tu alimentación y vuelve a salir conmigo." },
          { m: "happy", t: "No sé qué encontraremos, pero quizá tengamos una captura que merezca una buena comida." },
        ],
        fish: { id: "pez_dorada", rarity: "poco_comun" },
        introAfter: [
          { m: "orgullosa", t: "Esta sí que merece una buena comida." },
          { m: "seria", t: "Y recuerda algo: no necesitas comer perfecto." },
          { m: "seria", t: "Solo necesitas empezar a cuidar un poco más lo que haces cada día." },
          { m: "happy", t: "Si haces eso durante suficiente tiempo, empiezas a notar la diferencia." },
        ],
        snap: (g) => ({ since: todayStr() }),
        progressCount: (g, snap) => daysGoalsCompletedSince(g, snap.since), progressGoal: 3,
        check: (g, snap) => daysGoalsCompletedSince(g, snap.since) >= 3 },
      /* CAPÍTULO 5 — El silencio */
      { title: "El silencio", zone: "playa",
        objective: "Ya tienes la trucha. Mantén una racha de 3 días.",
        introBefore: [
          /* reconocimiento de los 3 días del capítulo anterior (mismo motivo que en el 3) */
          { m: "happy", t: "Tres días. Bien." },
          { m: "seria", t: "Ya estás haciendo algo que al principio parecía pesado sin darle tantas vueltas." },
          { m: "seria", t: "Hoy no quiero hablar demasiado." },
          { m: "happy", t: "No pongas esa cara. No estoy enfadada." },
          { m: "seria", t: "Solo quiero que escuches." },
          { m: "seria", t: "El agua. El viento. La caña." },
          { m: "seria", t: "Después de pasar tanto tiempo viendo gente correr detrás de algo, a veces viene bien quedarse quieto." },
          { m: "happy", t: "Aunque sean cinco minutos." },
          { m: "seria", t: "Últimamente has estado cumpliendo tus objetivos y volviendo a pescar." },
          { m: "happy", t: "Y creo que ya empiezas a entender por qué me gusta esto." },
          { m: "seria", t: "No sabes cuándo va a picar." },
          { m: "seria", t: "No sabes qué vas a sacar." },
          { m: "happy", t: "Solo puedes estar preparado y esperar." },
          { m: "seria", t: "Quiero que hagas lo mismo durante los próximos días." },
          { m: "seria", t: "Come, descansa y no te obsesiones con hacerlo todo perfecto." },
          { m: "happy", t: "Después vuelve." },
          { m: "seria", t: "Nos sentaremos aquí y veremos qué decide hacer el agua." },
        ],
        fish: { id: "pez_trucha", rarity: "raro" },
        introAfter: [
          { m: "orgullosa", t: "Bien." },
          { m: "happy", t: "No has intentado forzarla." },
          { m: "seria", t: "Eso es más importante de lo que parece." },
          { m: "happy", t: "Al principio querías que todo ocurriera rápido." },
          { m: "seria", t: "Ahora estás empezando a dejar que las cosas ocurran." },
        ],
        snap: () => ({}),
        progressCount: (g) => g.player.streak || 0, progressGoal: 3,
        check: (g) => (g.player.streak || 0) >= 3 },
      /* CAPÍTULO 6 — Algo grande */
      { title: "Algo grande", zone: "playa",
        objective: "Ya tienes el atún. Consigue el objetivo de proteína durante 3 días.",
        introBefore: [
          { m: "happy", t: "Hoy te he traído hasta aquí porque quiero probar algo." },
          { m: "seria", t: "Hasta ahora hemos tenido capturas pequeñas, algunas mejores que otras." },
          { m: "happy", t: "Y no sabemos nunca qué va a aparecer." },
          { m: "seria", t: "Pero llega un momento en el que empiezas a preguntarte qué habrá más lejos." },
          { m: "happy", t: "Y eso es justo lo que me pasa a mí." },
          { m: "seria", t: "Hay días en los que la playa está tranquila y otros en los que parece que todo lo que hay debajo del agua se ha puesto de acuerdo para fastidiarte." },
          { m: "happy", t: "Hoy vamos a comprobar de qué tipo es." },
          { m: "seria", t: "No sé qué vamos a sacar." },
          { m: "happy", t: "Puede que sea algo normal." },
          { m: "seria", t: "Puede que sea algo grande." },
          { m: "happy", t: "Y si tienes suerte, quizá sea una captura que recuerdes." },
          { m: "happy", t: "¿Preparado?" },
          { m: "seria", t: "Entonces no pienses demasiado." },
          { m: "happy", t: "Lanza y espera." },
        ],
        fish: { id: "pez_atun", rarity: "raro" },
        introAfter: [
          { m: "sorprendida", t: "¡¿Eso estaba ahí abajo?!" },
          { m: "happy", t: "Vale. Vale. No voy a decir nada." },
          { m: "orgullosa", t: "Bueno... sí. Estoy impresionada." },
          { m: "seria", t: "¿Ves por qué no me gusta prometerte lo que va a salir?" },
          { m: "happy", t: "Porque cuando algo así aparece, la sorpresa es mucho mejor." },
        ],
        snap: (g) => ({ since: todayStr() }),
        progressCount: (g, snap) => proteinDaysSince(g, snap.since), progressGoal: 3,
        check: (g, snap) => proteinDaysSince(g, snap.since) >= 3 },
      /* CAPÍTULO 7 — El pez espada */
      { title: "El pez espada", zone: "playa",
        objective: "Ya tienes el pez espada. Completa 3 días de objetivos de alimentación.",
        introBefore: [
          { m: "seria", t: "Hay una diferencia entre pescar algo grande y pescar algo que parece diseñado para hacerte quedar mal." },
          { m: "happy", t: "El pez espada entra en la segunda categoría." },
          { m: "seria", t: "Y después de lo que sacamos la última vez, no quiero que te confíes." },
          { m: "happy", t: "Que hayas pescado un atún no significa que ahora seas invencible." },
          { m: "seria", t: "De hecho, cuanto más grande puede ser la captura, más importante es tener paciencia." },
          { m: "seria", t: "Así que vamos a seguir con la rutina." },
          { m: "happy", t: "Cuida la alimentación, descansa y vuelve cuando estés listo." },
          { m: "seria", t: "Luego lanzamos la caña y dejamos que el agua decida." },
          { m: "happy", t: "Si notas que tiembla demasiado, respira." },
          { m: "happy", t: "Y si sale algo enorme, intenta no gritar." },
          { m: "happy", t: "Yo grité la primera vez." },
          { m: "seria", t: "¿Listo?" },
          { m: "happy", t: "Entonces vamos." },
        ],
        fish: { id: "pez_espada", rarity: "epico" },
        introAfter: [
          { m: "sorprendida", t: "..." },
          { m: "happy", t: "Retiro oficialmente lo de que eres principiante." },
          { m: "orgullosa", t: "Eso ha sido muy bueno." },
          { m: "seria", t: "Y ahora entiendes por qué nunca te digo qué vas a sacar." },
          { m: "happy", t: "Porque ni yo lo sé." },
        ],
        snap: (g) => ({ since: todayStr() }),
        progressCount: (g, snap) => daysGoalsCompletedSince(g, snap.since), progressGoal: 3,
        check: (g, snap) => daysGoalsCompletedSince(g, snap.since) >= 3 },
      /* CAPÍTULO 8 — Una idea terrible */
      { title: "Una idea terrible", zone: "playa",
        objective: "Ya tienes el tiburón. Cumple 4 días de alimentación.",
        introBefore: [
          { m: "happy", t: "Tengo una idea." },
          { m: "seria", t: "Antes de que preguntes, sí, probablemente sea mala." },
          { m: "happy", t: "Pero ya que hemos llegado hasta aquí..." },
          { m: "seria", t: "Hemos pasado de una sardina a algo que casi parecía querer arrancarte la caña de las manos." },
          { m: "happy", t: "Y todavía sigues volviendo." },
          { m: "seria", t: "Eso me gusta." },
          { m: "happy", t: "Porque significa que ya no vienes solo por conseguir una recompensa." },
          { m: "seria", t: "Así que quiero que probemos una salida diferente." },
          { m: "happy", t: "No sé qué vamos a encontrar." },
          { m: "seria", t: "Pero me gustaría intentar algo que normalmente no querrías ver acercándose a ti." },
          { m: "happy", t: "Y sí. Estoy hablando de un tiburón." },
          { m: "seria", t: "No te preocupes. Si todo sale mal, yo correré primero." },
          { m: "happy", t: "Cuatro días." },
          { m: "seria", t: "Si has llegado hasta aquí, ya sabes lo que significa." },
          { m: "happy", t: "Cuida lo que haces fuera de la playa y luego vuelve conmigo." },
          { m: "seria", t: "Lo demás no lo podemos controlar." },
        ],
        fish: { id: "pez_tiburon", rarity: "legendario" },
        introAfter: [
          { m: "sorprendida", t: "..." },
          { m: "happy", t: "Creo que acabo de perder cinco años de vida." },
          { m: "orgullosa", t: "Pero ha valido la pena." },
          { m: "seria", t: "Aunque te juro que la próxima vez elegimos algo más tranquilo." },
        ],
        snap: (g) => ({ since: todayStr() }),
        progressCount: (g, snap) => daysGoalsCompletedSince(g, snap.since), progressGoal: 4,
        check: (g, snap) => daysGoalsCompletedSince(g, snap.since) >= 4 },
      /* CAPÍTULO 9 — El pez que nunca olvidó (sin captura: prepara la del capítulo 10) */
      { title: "El pez que nunca olvidó", zone: "playa",
        objective: "Completa 4 días de alimentación y sueño.",
        intro: [
          { m: "seria", t: "Hay algo que nunca te he contado." },
          { m: "seria", t: "Cuando empecé a pescar, venía con mi padre." },
          { m: "happy", t: "Yo no sabía absolutamente nada." },
          { m: "happy", t: "Solo quería lanzar la caña y sacar algo enorme." },
          { m: "seria", t: "Él se reía porque me pasaba el día preguntando cuándo iba a picar." },
          { m: "seria", t: "Un día vimos un pez luna." },
          { m: "seria", t: "No conseguimos sacarlo." },
          { m: "happy", t: "Ni siquiera estuvimos cerca." },
          { m: "seria", t: "Pero recuerdo perfectamente aquel momento." },
          { m: "seria", t: "El agua, la caña, mi padre riéndose y yo convencida de que la próxima vez lo conseguiría." },
          { m: "happy", t: "La próxima vez nunca llegó." },
          { m: "seria", t: "Y con los años me di cuenta de que quizá no era realmente el pez lo que recordaba." },
          { m: "seria", t: "Era estar allí con él." },
          { m: "orgullosa", t: "Por eso quiero intentarlo otra vez." },
          { m: "seria", t: "No porque crea que esta vez vaya a salir." },
          { m: "happy", t: "Ya sabes que nunca sabemos qué va a picar." },
          { m: "seria", t: "Pero quiero volver a sentarme aquí y ver qué pasa." },
          { m: "seria", t: "Si quieres acompañarme, primero haz lo de siempre." },
          { m: "happy", t: "Come, descansa, cuídate un poco y vuelve." },
          { m: "orgullosa", t: "Luego tendremos nuestra salida." },
          { m: "seria", t: "Ya está." },
          { m: "happy", t: "No hay mucho más que preparar." },
          { m: "seria", t: "Mañana volveremos a lanzar la caña." },
          { m: "happy", t: "Y esta vez no voy a decirte que va a salir nada." },
          { m: "seria", t: "Solo quiero estar aquí cuando ocurra." },
        ],
        setFlags: ["ninaTrustUp"],
        snap: (g) => ({ since: todayStr() }),
        progressCount: (g, snap) => proteinSleepDaysSince(g, snap.since), progressGoal: 4,
        check: (g, snap) => proteinSleepDaysSince(g, snap.since) >= 4 },
      /* CAPÍTULO 10 — El pez luna (captura emocional de la campaña) */
      { title: "El pez luna", zone: "playa",
        objective: "Captura un pez luna.",
        introBefore: [
          { m: "seria", t: "Hoy no quiero que pienses en ganar." },
          { m: "seria", t: "Ni en mejorar." },
          { m: "seria", t: "Ni siquiera en la captura." },
          { m: "happy", t: "Solo quiero que estés aquí." },
          { m: "seria", t: "Hemos pasado por unas cuantas salidas desde que apareciste por primera vez." },
          { m: "happy", t: "Y mira dónde estamos." },
          { m: "seria", t: "Cuando pique, no tengas prisa." },
          { m: "seria", t: "Déjalo tirar." },
          { m: "seria", t: "Espera." },
          { m: "happy", t: "Confía en lo que has aprendido." },
          { m: "seria", t: "Y pase lo que pase, no te preocupes si no sale." },
          { m: "seria", t: "No necesito que esta vez termine como yo quiero." },
          { m: "happy", t: "Solo quiero vivir el momento." },
        ],
        fish: { id: "pez_luna", rarity: "legendario" },
        introAfter: [
          { m: "sorprendida", t: "..." },
          { m: "sorprendida", t: "Lo has conseguido." },
          { m: "seria", t: "Después de tantos años..." },
          { m: "orgullosa", t: "Pensaba que cuando llegara este momento iba a gritar." },
          { m: "happy", t: "Y resulta que solo quiero quedarme aquí un rato." },
          { m: "seria", t: "Creo que llevaba mucho tiempo pensando que necesitaba conseguir este pez." },
          { m: "happy", t: "Y ahora que está aquí, me doy cuenta de que lo que echaba de menos era todo lo demás." },
          { m: "orgullosa", t: "Gracias por hacerlo conmigo." },
        ],
        snap: () => ({}), check: () => true },
      /* FINAL — Ya sabes pescar (sin captura propia) */
      { title: "Ya sabes pescar", zone: "playa",
        objective: "Sin objetivo adicional.",
        intro: [
          { m: "happy", t: "Bueno." },
          { m: "orgullosa", t: "Oficialmente ya no puedo llamarte principiante." },
          { m: "happy", t: "Aunque tampoco voy a llamarte experto. No quiero que se te suba a la cabeza." },
          { m: "seria", t: "¿Sabes qué es curioso?" },
          { m: "seria", t: "Cuando empezaste, querías sacar algo de aquí." },
          { m: "happy", t: "Una captura, una recompensa, algo que pudieras guardar." },
          { m: "seria", t: "Y poco a poco empezaste a entender que la parte importante estaba antes de que apareciera el pez." },
          { m: "seria", t: "Esperar. Volver. Comer. Descansar. Intentarlo otra vez." },
          { m: "happy", t: "Supongo que eso también cuenta como mejorar." },
          { m: "orgullosa", t: "Y ahora tienes un montón de pescado que vender cuando abramos la tienda." },
          { m: "happy", t: "Así que tampoco hemos perdido el tiempo." },
        ],
        snap: () => ({}), check: () => true },
      /* EPÍLOGO — ¿Eso es un pez? (última etapa: final:true, captura de cangrejo +
         marca ninaStoryComplete y desbloquea la pesca libre al entrar aquí) */
      { title: "¿Eso es un pez?", zone: "playa", final: true,
        introBefore: [
          { m: "happy", t: "Hoy no hay objetivos." },
          { m: "happy", t: "Ni peces legendarios. Ni retos." },
          { m: "seria", t: "Solo vamos a pescar." },
          { m: "happy", t: "Ya sabes cómo funciona." },
          { m: "seria", t: "Lanzamos la caña, esperamos y vemos qué decide hacer el agua." },
        ],
        fish: { id: "cangrejo", rarity: "especial" },
        introAfter: [
          { m: "sorprendida", t: "..." },
          { m: "happy", t: "Eso no es un pez." },
          { m: "happy", t: "Pero técnicamente ha mordido el anzuelo." },
          { m: "orgullosa", t: "Lo voy a contar como una captura." },
        ],
        setFlags: ["ninaStoryComplete"],
        reward: (g) => {
          const stats = { ...g.player.stats };
          stats.NUT = Math.min(99, stats.NUT + 1);
          return { ...g, player: { ...g.player, stats } };
        } },
    ],
  }],
};

/* ============================================================
   COCO · la tendera del Centro Comercial (ver
   FUTABITA_Coco_Rework_v2_Centro_Comercial.docx). Su etapa de comerciante
   errante quedó atrás: ahora tiene puesto fijo en el Centro Comercial (id
   interno "tienda", el documento permite explícitamente conservarlo) y
   aparece UN DÍA SÍ Y UN DÍA NO — nada de rotar entre Parque/Barrio ni del
   antiguo ciclo de 5 días. Su función principal sigue siendo la tienda
   (comprar/vender objetos, ver CocoShop/buyFromCoco/sellToCoco más abajo en
   App); su historia es un hilo secundario sobre esa misma tienda.

   game.cocoVisit = { day, zone, products: [{ id, price, sold }] } —
   generado una vez por día activo y fijo durante todo ese día (el
   documento pide explícitamente que abrir/cerrar la tienda no
   rerollee nada). game.cocoLog = últimas transacciones (compra/venta,
   con precio, día, zona y a qué visita pertenecían) — es lo que usan
   los check() de las etapas para detectar "compra algo", "vende
   algo", "compra por 40 o menos", etc., exactamente igual que
   matchHistory se usa para los objetivos de partido en el resto de
   personajes. */
const COCO_CONSUMABLES = ["botiquin", "libreta_tactica", "especias_raras", "bebida_energetica", "amuleto_suerte", "zapatillas"];
/* Patrón exacto del documento: ACTIVA 1 DÍA -> AUSENTE 1 DÍA -> ACTIVA 1 DÍA...
   game.cocoNextVisitDay guarda qué día le toca volver; mientras no se alcance, cocoVisit
   se vacía (Coco ausente). Al generar una visita nueva se apunta el día siguiente + 1 como
   próxima, de modo que el jugador que se salta días la encuentra igualmente disponible en
   cuanto vuelve (nunca se queda "encallada" en una fecha pasada). */
const COCO_ZONE = "tienda";
const refreshCocoVisit = (g) => {
  const today = todayStr();
  if (g.cocoVisit && g.cocoVisit.day === today) return g; /* visita de hoy ya generada: no rerollear nada */
  /* día de descanso: solo el día INMEDIATAMENTE posterior a una visita. Si han pasado dos
     o más días desde la última, ya le toca volver a estar. */
  const restingToday = !!(g.cocoVisit && dayDiff(g.cocoVisit.day, today) === 1)
    || !!(g.cocoNextVisitDay && dayDiff(today, g.cocoNextVisitDay) > 0);
  if (restingToday) {
    const next = g.cocoNextVisitDay || addDays(g.cocoVisit.day, 2);
    return g.cocoVisit ? { ...g, cocoVisit: null, cocoNextVisitDay: next } : g;
  }
  const zoneDef = ZONES.find((z) => z.id === COCO_ZONE);
  /* si el Centro Comercial todavía no está desbloqueado, Coco simplemente no aparece —
     nunca se la manda a otra zona (regla crítica del documento) */
  if (!zoneDef || !zoneDef.unlocked(g)) return g.cocoVisit ? { ...g, cocoVisit: null } : g;
  const ids = [...COCO_CONSUMABLES].sort(() => Math.random() - 0.5).slice(0, 3);
  const products = ids.map((id) => ({ id, price: Math.floor(rnd(30, 61)), sold: false }));
  return { ...g, cocoVisit: { day: today, zone: COCO_ZONE, products }, cocoNextVisitDay: addDays(today, 2) };
};
/* precio de venta al azar dentro del rango del pez (ver ITEMS[id].sellMin/sellMax) —
   se roza una sola vez por apertura del panel VENDER (ver CocoShop), no en cada render,
   para que el precio mostrado y el cobrado sean siempre el mismo número. */
const rollSellPrice = (itemId) => {
  const it = ITEMS[itemId];
  if (!it || it.sellMin == null) return 0;
  return Math.floor(rnd(it.sellMin, it.sellMax + 1));
};
/* cuántas visitas DISTINTAS (por día de visita) tienen alguna entrada del tipo pedido
   desde una fecha — para "en 2/3 visitas diferentes" (capítulos 4 y 9) */
const cocoDistinctVisits = (g, since, types) =>
  new Set((g.cocoLog || []).filter((e) => e.day >= since && types.includes(e.type)).map((e) => e.visitDay)).size;
const COCO_STORY = {
  npc: "coco",
  chapters: [{
    id: "cap1",
    title: "La historia de Coco",
    trigger: () => true,
    stages: [
      /* PRÓLOGO — La chica de la tienda (rework v2, ver
         FUTABITA_Coco_Rework_v2_Centro_Comercial.docx: nueva personalidad pija +
         puesto fijo en el Centro Comercial). Este documento ya viene escrito con la
         estructura correcta de reacciones — cada capítulo abre reaccionando a lo que
         acabas de hacer y plantea su propio objetivo al final, sin bloques de reacción
         embebidos tras la línea de MISIÓN — así que no ha hecho falta reordenar nada,
         a diferencia de los reworks anteriores.
         Todas las etapas llevan zone:"tienda" (Centro Comercial): Coco ya no cambia de
         localización, así que la escena siempre ocurre en su tienda. */
      { title: "La chica de la tienda", zone: "tienda",
        objective: "Consigue 20 monedas y vuelve a hablar con Coco.",
        intro: [
          { m: "idle", t: "¿Tú eres el nuevo?" },
          { m: "happy", t: "No pongas esa cara. No te estoy vendiendo nada todavía." },
          { m: "blush", t: "Bueno... todavía." },
          { m: "idle", t: "Soy Coco. Y esta es mi tienda." },
          { m: "happy", t: "Antes iba de un lado a otro con mis cosas, pero sinceramente, cariño, cargar bolsas por media ciudad deja de ser glamuroso bastante rápido." },
          { m: "seria", t: "Ahora tengo un sitio fijo en el Centro Comercial." },
          { m: "happy", t: "Y mira qué monada. Todo ordenadito, todo colocado, buena iluminación... una chica necesita un mínimo de dignidad." },
          { m: "idle", t: "Aquí vendo cosas útiles, cosas curiosas y alguna que otra cosa que la gente compra simplemente porque le parece monísima." },
          { m: "blush", t: "No voy a juzgar. Yo también tengo mis debilidades." },
          { m: "happy", t: "Si quieres hacer negocios conmigo, primero tendrás que demostrarme que tienes algo de dinero." },
        ],
        setFlags: ["cocoMet"],
        snap: (g) => ({ fichas: g.fichas || 0 }),
        check: (g, snap) => (g.fichas || 0) >= snap.fichas + 20 },
      /* CAPÍTULO 1 — Primera compra */
      { title: "Primera compra", zone: "tienda",
        objective: "Compra un consumible a Coco.",
        intro: [
          { m: "happy", t: "Ah, has vuelto." },
          { m: "idle", t: "Te estaba viendo mirar la tienda como si estuvieras decidiendo qué bolso comprar." },
          { m: "blush", t: "No te preocupes, es una decisión importante. Una nunca debe comprar cualquier cosa." },
          { m: "happy", t: "Hoy tengo varias cositas nuevas." },
          { m: "idle", t: "Mi mercancía cambia cada visita, así que si ves algo que te interesa, no te quedes contemplándolo eternamente." },
          { m: "seria", t: "Y recuerda que los precios también pueden variar." },
          { m: "happy", t: "Vamos, haz tu primera compra." },
          { m: "blush", t: "Quiero comprobar si tienes criterio o simplemente compras lo primero que brilla." },
        ],
        snap: () => ({ since: todayStr() }),
        check: (g, snap) => (g.cocoLog || []).some((e) => e.type === "buy" && e.day >= snap.since) },
      /* CAPÍTULO 2 — También compro */
      { title: "También compro", zone: "tienda",
        objective: "Vende un objeto a Coco.",
        intro: [
          { m: "idle", t: "Hay una cosa que todavía no te he explicado." },
          { m: "happy", t: "Yo no solo vendo. También compro." },
          { m: "blush", t: "Sí, cariño. Ese objeto que llevas guardado desde hace siglos puede tener una vida mucho más interesante que estar acumulando polvo." },
          { m: "idle", t: "Lo que tú ya no necesitas puede ser justo lo que otra persona está buscando." },
          { m: "happy", t: "Tú me lo vendes, yo te doy monedas y todos contentos." },
          { m: "seria", t: "Además, un inventario lleno no es precisamente sinónimo de buen gusto." },
          { m: "blush", t: "No digo que el tuyo esté mal. Solo... tiene personalidad." },
          { m: "happy", t: "Así que cuando tengas algo que ya no uses, tráemelo." },
        ],
        snap: () => ({ since: todayStr() }),
        check: (g, snap) => (g.cocoLog || []).some((e) => e.type === "sell" && e.day >= snap.since) },
      /* CAPÍTULO 3 — Los precios, cariño */
      { title: "Los precios, cariño", zone: "tienda",
        objective: "Compra un objeto cuyo precio sea de 40 monedas o menos.",
        intro: [
          { m: "seria", t: "Hoy vamos a hablar de algo muy importante: precios." },
          { m: "idle", t: "No todo cuesta lo mismo cada vez que vienes." },
          { m: "happy", t: "La mercancía cambia, lo que me cuesta conseguirla cambia y, naturalmente, mi precio cambia." },
          { m: "blush", t: "¿Es injusto? Qué palabra tan fea." },
          { m: "happy", t: "Yo prefiero decir que es el mercado." },
          { m: "idle", t: "Si ves una ganga, aprovecha." },
          { m: "seria", t: "Si está caro, siempre puedes esperar a mi siguiente día disponible." },
          { m: "blush", t: "Aunque luego no vengas llorando si alguien se te adelanta." },
          { m: "happy", t: "Los buenos clientes saben cuándo comprar." },
        ],
        snap: () => ({ since: todayStr() }),
        check: (g, snap) => (g.cocoLog || []).some((e) => e.type === "buy" && e.day >= snap.since && e.price <= 40) },
      /* CAPÍTULO 4 — De dónde sale la mercancía */
      { title: "De dónde sale la mercancía", zone: "tienda",
        objective: "Compra 2 consumibles en dos visitas diferentes de Coco.",
        intro: [
          { m: "idle", t: "Siempre me preguntáis de dónde saco las cosas." },
          { m: "happy", t: "Qué curiosos sois." },
          { m: "seria", t: "Antes tenía que moverme muchísimo para conseguir mercancía." },
          { m: "idle", t: "Hablaba con gente, intercambiaba cosas, encontraba oportunidades y compraba productos antes de que los demás se dieran cuenta de que los querían." },
          { m: "happy", t: "Era divertido." },
          { m: "blush", t: "Pero cargar media tienda encima no tenía absolutamente nada de glamour." },
          { m: "seria", t: "Ahora tengo contactos y un sitio fijo donde traer todo." },
          { m: "happy", t: "El Centro Comercial es muchísimo más cómodo." },
          { m: "blush", t: "Y, sinceramente, una tienda así me pega bastante más." },
        ],
        snap: () => ({ since: todayStr() }),
        check: (g, snap) => cocoDistinctVisits(g, snap.since, ["buy"]) >= 2 },
      /* CAPÍTULO 5 — Lo que llevas encima */
      { title: "Lo que llevas encima", zone: "tienda",
        objective: "Vende objetos hasta conseguir 100 monedas acumuladas.",
        intro: [
          { m: "idle", t: "Madre mía. ¿De verdad llevas todo eso en el inventario?" },
          { m: "happy", t: "Cariño, hay una diferencia entre estar preparado y llevar media vida contigo." },
          { m: "blush", t: "Aunque no voy a juzgarte demasiado." },
          { m: "seria", t: "Un inventario lleno no significa necesariamente que tengas más." },
          { m: "idle", t: "A veces solo significa que tienes cosas que otra persona podría aprovechar mejor." },
          { m: "happy", t: "Si ya no utilizas algo, véndelo." },
          { m: "blush", t: "Y haz espacio para cosas que sí vayas a usar." },
          { m: "idle", t: "Créeme, saber desprenderse también tiene bastante estilo." },
        ],
        snap: () => ({ since: todayStr() }),
        check: (g, snap) => (g.cocoLog || []).filter((e) => e.type === "sell" && e.day >= snap.since)
          .reduce((sum, e) => sum + e.price, 0) >= 100 },
      /* CAPÍTULO 6 — La mercancía rara */
      { title: "La mercancía rara", zone: "tienda",
        objective: "Compra un consumible y consúmelo.",
        intro: [
          { m: "sorprendida", t: "Espera. Mira lo que tengo hoy." },
          { m: "happy", t: "Esto no aparece todos los días." },
          { m: "idle", t: "Algunas cosas dependen de estar en el sitio correcto, conocer a la persona adecuada o simplemente tener buen ojo." },
          { m: "blush", t: "Y yo, evidentemente, tengo muchísimo buen ojo." },
          { m: "happy", t: "Por eso cuando encuentro algo interesante lo aprovecho." },
          { m: "seria", t: "Tú también deberías aprender a guardar unas monedas." },
          { m: "idle", t: "Porque nunca sabes cuándo va a aparecer algo que realmente merezca la pena." },
          { m: "blush", t: "Y sería bastante triste verlo y no poder comprarlo." },
        ],
        snap: (g) => ({ since: todayStr(), itemsUsedCount: g.itemsUsedCount || 0 }),
        subs: [
          (g, snap) => (g.cocoLog || []).some((e) => e.type === "buy" && e.day >= snap.since),
          (g, snap) => (g.itemsUsedCount || 0) > snap.itemsUsedCount,
        ],
        check: (g, snap) => (g.cocoLog || []).some((e) => e.type === "buy" && e.day >= snap.since) &&
          (g.itemsUsedCount || 0) > snap.itemsUsedCount },
      /* CAPÍTULO 7 — Una tienda de verdad. Único objetivo que el documento cambia de
         verdad: antes era "encuéntrala en una localización distinta a la visita anterior",
         imposible ahora que su puesto es fijo — pasa a ser "hazlo durante una NUEVA
         visita", que es la misma idea (esperar a que vuelva) adaptada al ciclo de días
         alternos. El check compara contra el día de visita que estaba activo al empezar
         la etapa, igual que antes comparaba contra la zona anterior. */
      { title: "Una tienda de verdad", zone: "tienda",
        objective: "Realiza una compra o venta con Coco durante una nueva visita.",
        intro: [
          { m: "happy", t: "¿Sabes qué me gusta de estar aquí?" },
          { m: "idle", t: "Que ya no tengo que montar y desmontar mi negocio todo el rato." },
          { m: "seria", t: "Antes era bolsas, cajas, caminar, buscar sitio y volver a recogerlo todo." },
          { m: "happy", t: "Ahora tengo una tienda fija." },
          { m: "blush", t: "Buena iluminación, espacio, escaparates... una maravilla." },
          { m: "idle", t: "Y lo mejor es que la gente sabe dónde encontrarme." },
          { m: "happy", t: "Creo que me he acostumbrado bastante rápido." },
          { m: "seria", t: "Quizá tener un sitio al que volver no esté tan mal." },
        ],
        snap: (g) => ({ since: todayStr(), prevVisitDay: g.cocoVisit ? g.cocoVisit.day : null }),
        check: (g, snap) => (g.cocoLog || []).some((e) => (e.type === "buy" || e.type === "sell") &&
          e.day >= snap.since && e.visitDay && e.visitDay !== snap.prevVisitDay) },
      /* CAPÍTULO 8 — Una buena oportunidad */
      { title: "Una buena oportunidad", zone: "tienda",
        objective: "Compra un consumible por 30–35 monedas.",
        intro: [
          { m: "idle", t: "Hoy estás de suerte." },
          { m: "happy", t: "Tengo algo que normalmente vendería un poquito más caro." },
          { m: "blush", t: "Pero voy a hacerte un precio especial." },
          { m: "seria", t: "No porque me haya vuelto generosa de repente." },
          { m: "happy", t: "Simplemente me interesa que vuelvas." },
          { m: "idle", t: "Una buena clientela vale muchísimo más que ganar unas monedas extra una sola tarde." },
          { m: "blush", t: "Y tú estás empezando a ser bastante buen cliente." },
          { m: "happy", t: "No te emociones." },
          { m: "blush", t: "Todavía no tienes tarjeta VIP." },
        ],
        snap: () => ({ since: todayStr() }),
        check: (g, snap) => (g.cocoLog || []).some((e) => e.type === "buy" && e.day >= snap.since && e.price >= 30 && e.price <= 35) },
      /* CAPÍTULO 9 — Mi clientela */
      { title: "Mi clientela", zone: "tienda",
        objective: "Realiza compras o ventas con Coco en 3 visitas diferentes.",
        intro: [
          { m: "seria", t: "Creo que ya llevas suficiente tiempo viniendo como para que pueda llamarte cliente habitual." },
          { m: "happy", t: "No pongas esa cara. Es un cumplido." },
          { m: "idle", t: "Una tienda no son solo los productos." },
          { m: "seria", t: "También son las personas que vuelven, las conversaciones y la confianza." },
          { m: "blush", t: "Después de pasar tanto tiempo moviéndome de un lado a otro, tener caras conocidas aquí se siente bastante bien." },
          { m: "happy", t: "No voy a ponerme sentimental." },
          { m: "idle", t: "Pero me gusta que vuelvas." },
          { m: "blush", t: "Y no, eso no significa que tengas descuento." },
          { m: "happy", t: "Aún." },
        ],
        snap: () => ({ since: todayStr() }),
        check: (g, snap) => cocoDistinctVisits(g, snap.since, ["buy", "sell"]) >= 3 },
      /* CAPÍTULO 10 — Lo que realmente buscaba */
      { title: "Lo que realmente buscaba", zone: "tienda",
        objective: "Compra un objeto y vende otro en la misma visita.",
        intro: [
          { m: "seria", t: "Te voy a contar un secreto." },
          { m: "blush", t: "Si se lo cuentas a todo el mundo, lo voy a negar." },
          { m: "seria", t: "Cuando empecé a viajar no lo hacía solamente para vender." },
          { m: "idle", t: "Estaba buscando algo." },
          { m: "happy", t: "Una cosa concreta que pensaba que algún día encontraría." },
          { m: "seria", t: "Nunca la encontré." },
          { m: "idle", t: "Y con el tiempo entendí que quizá esa era precisamente la gracia." },
          { m: "happy", t: "Seguir buscando. Encontrar cosas nuevas. Conocer gente." },
          { m: "blush", t: "Y ahora resulta que tengo una tienda en un Centro Comercial bastante mono." },
          { m: "seria", t: "Quizá esto sea lo más parecido que he tenido a encontrar un sitio al que volver." },
        ],
        snap: () => ({ since: todayStr() }),
        check: (g, snap) => {
          const entries = (g.cocoLog || []).filter((e) => e.day >= snap.since);
          const buys = new Set(entries.filter((e) => e.type === "buy").map((e) => e.visitDay));
          const sells = new Set(entries.filter((e) => e.type === "sell").map((e) => e.visitDay));
          return [...buys].some((v) => sells.has(v));
        } },
      /* FINAL — Mi clientela favorita (última etapa: final:true, sin recompensa de
         objeto — el documento no pide ninguna, solo el flag de cierre) */
      { title: "Mi clientela favorita", zone: "tienda", final: true,
        intro: [
          { m: "happy", t: "Bueno, mira quién ha vuelto." },
          { m: "idle", t: "Creo que ya puedo decir que formas parte de mi clientela habitual." },
          { m: "blush", t: "No te emociones. Eso no incluye descuento VIP." },
          { m: "happy", t: "Todavía." },
          { m: "seria", t: "He pasado mucho tiempo pensando en aquella cosa que buscaba cuando empecé a viajar." },
          { m: "idle", t: "Y creo que ya sé qué era." },
          { m: "happy", t: "No era un objeto." },
          { m: "seria", t: "Era tener un sitio al que volver." },
          { m: "happy", t: "Una tienda bonita, mercancía nueva, gente que reconozco cuando entra por la puerta..." },
          { m: "blush", t: "Y algún cliente que vuelve demasiado a menudo." },
          { m: "happy", t: "Pero bueno. Hay cosas peores." },
          { m: "seria", t: "Así que supongo que me voy a quedar aquí un poquito más." },
          { m: "blush", t: "No te acostumbres demasiado." },
          { m: "happy", t: "Sigo teniendo una reputación que mantener." },
        ],
        setFlags: ["cocoStoryComplete"] },
    ],
  }],
};
/* Saludo recurrente de los días activos (sección 8 del documento). Solo se encola una vez
   por día de visita y SOLO tras cerrar su campaña (cocoStoryComplete): mientras la historia
   sigue viva son sus capítulos los que llevan la conversación, y meter un saludo genérico
   en medio los pisaría. Es puro sabor: no arranca misiones ni toca la tienda, tal como pide
   el documento ("no crear misiones recurrentes nuevas obligatorias"). */
const COCO_GREETING = [
  { m: "happy", t: "Cariño, hoy sí estoy aquí." },
  { m: "blush", t: "Y he traído cositas bastante monas." },
  { m: "idle", t: "Mira primero, decide después. Una chica con criterio no compra a lo loco." },
  { m: "happy", t: "Aunque si quieres comprar varias cosas, yo no voy a impedírtelo." },
  { m: "seria", t: "Si hoy no encuentras nada, no pasa nada." },
  { m: "blush", t: "Mañana vuelvo a estar disponible. Ya sabes, agenda de chica ocupada." },
  { m: "happy", t: "Ahora dime qué necesitas." },
];

/* ============================================================
   VERA · artista observadora, novena campaña y primera con recompensas
   de campaña MÚLTIPLES (un cuadro por capítulo, no solo un pin al final).

   Por eso su historia no cabe en un único capítulo largo como las demás:
   el motor (checkStories) solo dispara stage.reward() al ENTRAR en una
   etapa final:true, y entrar en una etapa final:true cierra el capítulo
   entero e inmediatamente pasa al siguiente (su propio check/objective,
   si los tuviera, nunca se evaluarían). Así que cada "CAPÍTULO N" del
   documento se parte en dos etapas dentro de su propio capítulo:
     1) la etapa de SETUP (con el objective/check real del capítulo),
     2) una etapa de ENTREGA (final:true) que solo lleva la reacción al
        objetivo que se acaba de cumplir + el reward() de ese cuadro.
   El capítulo N+1 empieza limpio, sin repetir esa reacción (ya se ha
   mostrado en la etapa de entrega), tal como pide el documento: "La
   reacción a este objetivo NO va en esta intro; va al principio de la
   siguiente etapa" — aquí "la siguiente etapa" es la de entrega.

   Cada etapa de ENTREGA lleva grantItem/reveal (no reward()): a diferencia
   de los pines de las otras 8 campañas, aquí SÍ importa que la entrega
   ocurra durante la conversación, no en el instante en que se cumple el
   objetivo — así que el cuadro se añade al inventario y se dispara
   <CuadroReveal> (la pantalla grande "imagen → efectos → click para
   continuar" que pide el documento) solo cuando el jugador de verdad lee
   la última frase de esa escena (ver applyOnRead/queueStageScene), nunca
   antes. Con reward() (como usan las demás campañas) la entrega salta en
   cuanto checkStories detecta el objetivo cumplido, aunque el jugador
   todavía no haya hablado con el personaje — para un pin silencioso eso
   pasa desapercibido, pero para la pantalla grande de un cuadro se nota
   muchísimo (el popup salta solo, sin que Vera "te lo dé" en la charla).

   Moods: el documento no define asset para [suave] (solo lista idle,
   happy, seria, preocupada, pintora, pintora_pensando, playa,
   playa_regalo, icon) — igual que con Coco, se deja el mood tal cual y
   cae automáticamente a "idle" (npc.def) mediante el fallback ya
   existente en el motor, sin inventar un asset nuevo.

   Checks: el documento pide explícitamente mapear cada misión a una
   condición que YA exista en el juego. CAP5/CAP6 ("hito social",
   "interactúa con 3 personajes") se resuelven con game.seenMoods (ya
   usado por el motor para marcar qué mood de cada npc ha leído el
   jugador — su claves son, por tanto, "personajes con los que ya has
   interactuado") comparando contra un snapshot tomado al empezar la
   etapa, igual que el resto de checks "desde que empezó el capítulo". */
const VERA_STORY = {
  npc: "vera",
  chapters: [
    { id: "cap1", title: "Primer toque", trigger: () => true,
      stages: [
        /* PRÓLOGO — Algo que pintar (sin MISIÓN propia en el documento:
           se resuelve en cuanto se lee, igual que el FINAL de Milly/Beka) */
        { title: "Algo que pintar", zone: "parque",
          objective: "Sin objetivo adicional.",
          intro: [
            { m: "idle", t: "Perdona. ¿Puedes quedarte quieto un segundo?" },
            { m: "sorprendida", t: "No, no por nada raro. Estaba intentando dibujar lo que tienes detrás y, de repente, me he quedado mirándote a ti." },
            { m: "happy", t: "Eso suele ser buena señal." },
            { m: "idle", t: "Soy Vera. Pinto. Bueno... intento pintar. Últimamente tengo un pequeño problema." },
            { m: "preocupada", t: "Tengo materiales, tiempo, ideas a medias, tres cuadernos llenos de cosas que no terminé y una cantidad bastante preocupante de dibujos de tazas." },
            { m: "happy", t: "No sé por qué dibujo tantas tazas." },
            { m: "idle", t: "Lo que no tengo es una idea que me haga pensar: esto merece convertirse en un cuadro." },
            { m: "seria", t: "Así que he decidido observar un poco más." },
            { m: "idle", t: "Y tú pareces estar haciendo muchas cosas. Entrenas, intentas mejorar, comes, descansas... incluso sales por ahí." },
            { m: "happy", t: "Quizá pueda encontrar algo interesante en todo eso." },
            { m: "pintora_pensando", t: "No necesito que poses para mí. Solo quiero ver qué ocurre cuando alguien intenta cambiar algo de su vida." },
            { m: "idle", t: "Si no te importa, voy a acompañarte un poco." },
            { m: "happy", t: "Prometo no dibujarte mientras duermes." },
          ],
          setFlags: ["veraMet"],
          snap: () => ({}), check: () => true },
        /* CAPÍTULO 1 — Primer toque */
        { title: "Primer toque", zone: "parque",
          objective: "Completa un día de preparación: entrenamiento + alimentación + sueño.",
          intro: [
            { m: "idle", t: "He estado observándote un poco. No te preocupes, no tanto como para saber a qué hora desayunas." },
            { m: "happy", t: "Aunque ahora que lo pienso, eso sería bastante útil para una artista obsesionada con los detalles." },
            { m: "seria", t: "Hay algo que me interesa de los comienzos. Desde fuera parecen insignificantes." },
            { m: "idle", t: "Un entrenamiento más. Una comida más. Un día en el que decides hacer algo en lugar de dejarlo para mañana." },
            { m: "pintora_pensando", t: "Pero cuando juntas muchos de esos momentos, de repente existe una historia." },
            { m: "happy", t: "Y creo que quiero empezar por ahí." },
            { m: "seria", t: "No quiero pintar una gran victoria todavía. Quiero pintar el momento en el que alguien decide dar el primer paso." },
            { m: "idle", t: "Así que voy a observarte mientras empiezas a construir esa rutina." },
            { m: "happy", t: "No hace falta que sea perfecto. Solo necesito ver que de verdad has empezado." },
          ],
          snap: () => ({ since: todayStr() }),
          check: (g, snap) => daysGoalsCompletedSince(g, snap.since) >= 1 },
        /* ENTREGA — Cuadro «Primer toque» (final:true: cierra el capítulo 1 y entrega el
           cuadro; su reacción es la que el documento escribe al principio de "CAPÍTULO 2") */
        { title: "Primer toque", final: true,
          intro: [
            { m: "happy", t: "Así que lo hiciste." },
            { m: "idle", t: "Ayer parecía un día cualquiera. Y, sin embargo, ahora puedo mirarlo y decir que fue el principio de algo." },
            { m: "seria", t: "Eso es lo que quería ver." },
          ],
          grantItem: "cuadro_primer_toque", reveal: "cuadro_primer_toque" },
      ] },
    { id: "cap2", title: "No parar", trigger: () => true,
      stages: [
        { title: "No parar", zone: "parque",
          objective: "Mantén una racha de 3 días de objetivos diarios.",
          intro: [
            { m: "pintora_pensando", t: "He hecho un dibujo esta mañana. No es exactamente una persona corriendo. Es más bien... una persona que ha decidido volver a correr." },
            { m: "idle", t: "Hay una diferencia enorme entre las dos cosas." },
            { m: "seria", t: "El primer día puede ser entusiasmo. El segundo ya es una elección." },
            { m: "idle", t: "Y después llega esa parte aburrida en la que nadie te aplaude por repetir lo que dijiste que ibas a hacer." },
            { m: "happy", t: "Creo que ahí está el cuadro." },
            { m: "seria", t: "Durante unos días, no busques hacer algo espectacular. Solo intenta no romper el hilo que acabas de empezar." },
          ],
          progressCount: (g) => g.player.streak || 0, progressGoal: 3,
          snap: () => ({}),
          check: (g) => (g.player.streak || 0) >= 3 },
        { title: "No parar", final: true,
          intro: [
            { m: "happy", t: "Tres días." },
            { m: "seria", t: "No parece una cifra enorme escrita en una pantalla, pero ahora entiendo por qué me interesaba." },
            { m: "idle", t: "Has vuelto a hacerlo incluso después de que la novedad desapareciera." },
          ],
          grantItem: "cuadro_no_parar", reveal: "cuadro_no_parar" },
      ] },
    { id: "cap3", title: "Después del esfuerzo", trigger: () => true,
      stages: [
        { title: "Después del esfuerzo", zone: "parque",
          objective: "Cumple el objetivo de proteína durante 3 días.",
          intro: [
            { m: "pintora_pensando", t: "Y mientras terminaba el segundo cuadro me di cuenta de que estaba dibujando siempre la misma mitad de la historia." },
            { m: "sorprendida", t: "El esfuerzo." },
            { m: "seria", t: "Entrenar. Correr. Intentarlo otra vez. Todo eso queda muy bien en un cuadro." },
            { m: "idle", t: "Pero nadie pinta lo que pasa cuando termina." },
            { m: "happy", t: "El cuerpo pide cosas. La cabeza también." },
            { m: "seria", t: "Y si estás intentando mejorar de verdad, no puedes tratar la alimentación como si fuera una nota al pie." },
            { m: "idle", t: "Creo que mi siguiente cuadro tiene que hablar de eso." },
            { m: "happy", t: "No de comer mucho. De entender que lo que haces después también forma parte del esfuerzo." },
            { m: "seria", t: "Ayúdame a verlo durante unos días." },
          ],
          progressCount: (g, snap) => proteinDaysSince(g, snap.since), progressGoal: 3,
          snap: () => ({ since: todayStr() }),
          check: (g, snap) => proteinDaysSince(g, snap.since) >= 3 },
        { title: "Después del esfuerzo", final: true,
          intro: [
            { m: "suave", t: "Ahora sí lo entiendo." },
            { m: "idle", t: "No puedes separar el esfuerzo de lo que haces para recuperarte de él." },
            { m: "seria", t: "He pasado tanto tiempo buscando movimiento para mis cuadros que me había olvidado de algo muy sencillo." },
          ],
          grantItem: "cuadro_despues_del_esfuerzo", reveal: "cuadro_despues_del_esfuerzo" },
      ] },
    { id: "cap4", title: "Donde el ruido termina", trigger: () => true,
      stages: [
        /* única excepción de zona de toda la campaña: transcurre en la Playa (ver
           NOTA DE ZONAS del documento) */
        { title: "Donde el ruido termina", zone: "playa",
          objective: "Cumple el objetivo de sueño durante 3 días.",
          intro: [
            { m: "happy", t: "A veces la mejor escena es la que no está pasando nada." },
            { m: "pintora_pensando", t: "Mira el mar." },
            { m: "idle", t: "No hay una barra que suba. No hay una racha que mantener. No hay nadie diciendo que tienes que ser mejor mañana." },
            { m: "suave", t: "Solo hay un momento en el que puedes parar." },
            { m: "seria", t: "Y eso también forma parte de cuidar de ti." },
            { m: "happy", t: "Quiero pintar esa sensación. El segundo en el que el ruido de todo lo demás desaparece." },
            { m: "idle", t: "Así que durante unos días quiero que me enseñes algo distinto: que también sabes descansar." },
          ],
          progressCount: (g, snap) => Object.entries(g.logs || {}).filter(([d, l]) =>
            d >= snap.since && l.closed && l.sleep != null && l.sleep >= g.player.goals.sleepGoal).length,
          progressGoal: 3,
          snap: () => ({ since: todayStr() }),
          check: (g, snap) => Object.entries(g.logs || {}).filter(([d, l]) =>
            d >= snap.since && l.closed && l.sleep != null && l.sleep >= g.player.goals.sleepGoal).length >= 3 },
        { title: "Donde el ruido termina", final: true,
          intro: [
            { m: "happy", t: "Vale. Lo admito." },
            { m: "happy", t: "Pensaba que iba a ser imposible hacer un cuadro sobre descanso y acabar aquí." },
            { m: "idle", t: "Pero supongo que descansar no significa quedarse quieto para siempre." },
          ],
          grantItem: "cuadro_donde_el_ruido_termina", reveal: "cuadro_donde_el_ruido_termina" },
      ] },
    { id: "cap5", title: "Una noche más", trigger: () => true,
      stages: [
        { title: "Una noche más", zone: "parque",
          objective: "Completa un hito social existente del juego y visita la Discoteca.",
          intro: [
            { m: "seria", t: "Hay días para apretar. Hay días para parar. Y también hay días para salir, hablar, reírte y recordar que no eres una máquina de estadísticas." },
            { m: "happy", t: "Además, este sitio tiene una luz increíble." },
            { m: "pintora_pensando", t: "Mira todas esas formas. Nadie se queda quieto. Todo cambia de color cada segundo." },
            { m: "idle", t: "Creo que llevo demasiado tiempo intentando encontrar inspiración en cosas importantes." },
            { m: "happy", t: "Quizá también esté en una noche que no tiene ninguna consecuencia." },
            { m: "seria", t: "Quiero capturar esa sensación: una noche que simplemente ocurre y mañana ya será un recuerdo." },
            { m: "happy", t: "No necesito que ganes nada para este cuadro. Necesito que vuelvas a hacer algo por ti." },
          ],
          snap: (g) => ({ since: todayStr(), seenNpcs: Object.keys(g.seenMoods || {}) }),
          subs: [
            (g, snap) => Object.keys(g.seenMoods || {}).some((n) => !snap.seenNpcs.includes(n)),
            (g, snap) => zoneVisitedSince(g, "discoteca", snap.since),
          ],
          check: (g, snap) => Object.keys(g.seenMoods || {}).some((n) => !snap.seenNpcs.includes(n)) &&
            zoneVisitedSince(g, "discoteca", snap.since) },
        { title: "Una noche más", final: true,
          intro: [
            { m: "happy", t: "La noche me ha dejado pensando." },
            { m: "idle", t: "No por la pintura. Bueno, también por la pintura." },
            { m: "seria", t: "Me di cuenta de que cuando intentaba recordar lo que había visto, no recordaba las luces." },
          ],
          grantItem: "cuadro_una_noche_mas", reveal: "cuadro_una_noche_mas" },
      ] },
    { id: "cap6", title: "La gente que pasa", trigger: () => true,
      stages: [
        { title: "La gente que pasa", zone: "parque",
          objective: "Interactúa con 3 personajes y completa 2 acciones de ciudad existentes.",
          intro: [
            { m: "pintora_pensando", t: "Recordaba a la gente." },
            { m: "idle", t: "A alguien riéndose. A alguien que iba con prisa. A alguien que parecía completamente perdido en sus pensamientos." },
            { m: "seria", t: "Incluso me acordé de algunos de los personajes que he ido viendo por la ciudad." },
            { m: "happy", t: "Supongo que ese es el problema de pintar FUTABITA." },
            { m: "idle", t: "Hay demasiadas personas interesantes." },
            { m: "seria", t: "Hasta ahora estaba intentando pintar lo que haces." },
            { m: "happy", t: "Ahora quiero pintar a quién eres cuando nadie está pensando en tus estadísticas." },
            { m: "idle", t: "Quiero llenar el cuadro de pequeños momentos. No hace falta que sean importantes." },
            { m: "pintora_pensando", t: "Solo tienen que ser reales." },
            { m: "seria", t: "Ayúdame a observar la ciudad. Habla con gente. Muévete por ella. Quiero ver qué aparece cuando dejamos de mirar solo el campo." },
          ],
          snap: (g) => ({ since: todayStr(), seenNpcs: Object.keys(g.seenMoods || {}) }),
          subs: [
            (g, snap) => Object.keys(g.seenMoods || {}).filter((n) => !snap.seenNpcs.includes(n)).length >= 3,
            (g, snap) => Object.entries(g.zoneVisits || {}).filter(([, d]) => d >= snap.since).length >= 2,
          ],
          check: (g, snap) => Object.keys(g.seenMoods || {}).filter((n) => !snap.seenNpcs.includes(n)).length >= 3 &&
            Object.entries(g.zoneVisits || {}).filter(([, d]) => d >= snap.since).length >= 2 },
        { title: "La gente que pasa", final: true,
          intro: [
            { m: "suave", t: "Ya lo entiendo." },
            { m: "idle", t: "He estado buscando inspiración como si fuera una cosa que pudiera encontrar escondida en algún sitio." },
            { m: "seria", t: "Pero no estaba escondida." },
            { m: "happy", t: "Estaba en todo lo que has ido haciendo." },
          ],
          grantItem: "cuadro_la_gente_que_pasa", reveal: "cuadro_la_gente_que_pasa" },
      ] },
    { id: "cap7", title: "Lo que queda", trigger: () => true,
      stages: [
        { title: "Lo que queda", zone: "parque",
          objective: "Completa un hito global de progreso existente y mantén una racha de 5 días.",
          intro: [
            { m: "idle", t: "El primer día en el que decidiste empezar." },
            { m: "seria", t: "Los días en los que seguiste aunque ya no fuera emocionante." },
            { m: "idle", t: "La comida después del entrenamiento. El descanso. Una noche cualquiera. La gente que pasa por la ciudad y que normalmente ni miramos." },
            { m: "pintora_pensando", t: "He intentado pintar cada una de esas cosas por separado." },
            { m: "suave", t: "Y creo que ahora sé por qué no terminaba de funcionar." },
            { m: "seria", t: "No son historias separadas." },
            { m: "happy", t: "Son partes de la misma." },
            { m: "idle", t: "La tuya." },
            { m: "preocupada", t: "Me da un poco de miedo este cuadro." },
            { m: "happy", t: "No porque no sepa qué pintar. Por primera vez sé exactamente qué quiero hacer." },
            { m: "seria", t: "Me da miedo que, cuando lo termine, ya no tenga ninguna excusa para seguir buscando." },
            { m: "suave", t: "Pero supongo que eso también forma parte de pintar." },
            { m: "idle", t: "Así que esta vez no quiero observarte desde lejos." },
            { m: "seria", t: "Quiero que completes una última etapa de todo lo que hemos estado hablando." },
            { m: "happy", t: "No tiene que ser perfecto. Solo tiene que demostrar que la historia que empezamos no era solo una idea bonita." },
          ],
          progressCount: (g) => g.player.streak || 0, progressGoal: 5,
          snap: (g) => ({ tierId: g.tier.id, ovr: calcOVR(g.player.stats) }),
          subs: [
            (g, snap) => g.tier.id !== snap.tierId || calcOVR(g.player.stats) > snap.ovr,
            { count: (g) => g.player.streak || 0, goal: 5 },
          ],
          check: (g, snap) => (g.tier.id !== snap.tierId || calcOVR(g.player.stats) > snap.ovr) && (g.player.streak || 0) >= 5 },
        { title: "Lo que queda", final: true,
          intro: [
            { m: "happy", t: "Lo terminamos." },
            { m: "suave", t: "Bueno. Lo terminé yo. Pero me entiendes." },
          ],
          grantItem: "cuadro_lo_que_queda", reveal: "cuadro_lo_que_queda" },
      ] },
    /* FINAL — El cuadro que faltaba (capítulo de cierre: sin MISIÓN propia, narración de
       cierre + desbloqueo de INSPIRACIÓN LIBRE, ver refreshVeraFreeVisit. Pantalla especial
       con vera_playa_regalo.webp en vez del cuadro de campaña — "tratamiento ligeramente
       más especial" que pide el documento, ver CuadroReveal) */
    { id: "cap8", title: "El cuadro que faltaba", trigger: () => true,
      stages: [
        { title: "El cuadro que faltaba", zone: "parque", final: true,
          intro: [
            { m: "seria", t: "He estado mirando el cuadro durante un rato intentando decidir si le faltaba algo." },
            { m: "idle", t: "Y creo que no." },
            { m: "suave", t: "No porque sea perfecto. Porque ya no necesita serlo." },
            { m: "happy", t: "Tiene el principio, la constancia, la comida, el descanso, la noche y todas esas personas que pasan por la ciudad." },
            { m: "seria", t: "Y en algún sitio, casi escondido, estás tú." },
            { m: "suave", t: "No como un retrato." },
            { m: "happy", t: "Como la persona que hizo que todo lo demás ocurriera." },
            { m: "idle", t: "Supongo que eso era lo que estaba buscando desde el principio." },
            { m: "suave", t: "No quería encontrar algo bonito." },
            { m: "seria", t: "Quería encontrar algo que mereciera ser recordado." },
            { m: "happy", t: "Gracias por ayudarme a encontrarlo." },
          ],
          setFlags: ["veraStoryComplete"],
          reveal: "vera_completion" },
      ] },
  ],
};
/* INSPIRACIÓN LIBRE: modo semanal que se desbloquea tras VERA_STORY (flag veraStoryComplete).
   No es parte de STORIES/checkStories (esa historia ya queda "done" tras el capítulo 8, y
   checkStories nunca reevalúa un capítulo "done") — es una visita periódica independiente,
   con la misma arquitectura que game.cocoVisit/refreshCocoVisit pero mucho más simple: no
   hay tienda, solo una escena corta y un cuadro genérico de precio aleatorio (ver
   refreshVeraFreeVisit, llamado desde checkZoneUnlocks junto a refreshCocoVisit). */
const VERA_FREE_BEATS = [
  { m: "happy", t: "He cometido un error." },
  { m: "idle", t: "Pensaba que terminar este cuadro iba a dejarme tranquila durante un tiempo." },
  { m: "happy", t: "Ha ocurrido exactamente lo contrario." },
  { m: "pintora_pensando", t: "Ahora tengo ideas para veinte cuadros." },
  { m: "seria", t: "Así que, si no te importa, voy a seguir necesitando inspiración." },
  { m: "happy", t: "Y quizá pueda darte algo a cambio." },
];

/* ============================================================
   ALEXIA · introduce los cassettes musicales (ver ITEMS kind:"cassette",
   activateCassette/applyDayClose y refreshAlexiaVisit más abajo en App).

   Misma partición SETUP+ENTREGA que usa VERA_STORY y por la misma razón:
   el motor solo dispara reward()/grantItem al ENTRAR en una etapa
   final:true, y esa entrada cierra el capítulo entero de inmediato (su
   propio check, si lo tuviera, nunca se evaluaría). Alexia entrega 7
   cassettes en puntos distintos de la historia (no solo un pin final), así
   que cada "CAPÍTULO N" que reparte cassette se parte en dos etapas dentro
   de su propio capítulo: una de SETUP (con el objective/check real) y una
   de ENTREGA (final:true, solo la reacción al objetivo recién cumplido +
   grantItem/reveal de ese cassette). Los capítulos que NO reparten cassette
   (prólogo, cap1, cap8, cap10) no necesitan partirse: su reacción ya vive,
   sin más, al principio de la intro de la etapa siguiente dentro del MISMO
   capítulo — este documento, a diferencia de los primeros reworks de la
   temporada, ya viene escrito con esa estructura correcta.

   Checks: el documento pide expresamente no inventar mecánicas nuevas y
   mapear cada misión a algo que el juego ya sepa comprobar.
     - "20 XP en cualquier stat" (prólogo): no existe un contador de XP
       total por stat (xp[k] se reinicia en cada subida de nivel), así que
       se reconstruye con stats[k]*10000+xp[k] como progreso monótono
       comparable entre snapshots — sube siempre que ganas XP, aunque subas
       de nivel por el camino.
     - "Consigue XP en <STAT> durante 2 días": no hay un registro de qué
       stat ganó XP cada día, así que cada capítulo usa el campo real de
       game.logs que de verdad genera XP en ESE stat en applyDayClose:
       FUE -> día de gym, RES -> hábitos completados (disciplina/
       concentración), NUT -> día con kcal Y proteína cumplidas, MEN -> día
       en buena forma (alza/buen, claridad mental). REC ya tiene su propio
       enunciado explícito ("cumple el objetivo de sueño"), sin ambigüedad.
     - "Objetivo de progreso general" / "hito global de progreso": mismo
       criterio que ya usan Beka/Karla/Yuna para "hito de carrera" —
       daysGoalsCompletedSince para el primero (más ligero, constancia),
       tier/OVR para el segundo (más grande, la síntesis de ALL IN). */
const alexiaStatProgress = (g) => Object.fromEntries(STAT_KEYS.map((k) => [k, g.player.stats[k] * 10000 + (g.player.xp[k] || 0)]));
const ALEXIA_STORY = {
  npc: "alexia",
  chapters: [
    { id: "cap1", title: "Tu música", trigger: () => true,
      stages: [
        /* PRÓLOGO — Tu música (sin cassette: desarrolla la historia) */
        { title: "Tu música", zone: "atico",
          objective: "Consigue 20 XP en cualquier stat y vuelve a hablar con Alexia.",
          intro: [
            { m: "idle", t: "¿Tú también entrenas con música?" },
            { m: "happy", t: "Vale, eso ya me cae bien." },
            { m: "music", t: "Yo no puedo hacer casi nada sin música." },
            { m: "idle", t: "No porque necesite ruido todo el rato. Una canción puede cambiar completamente cómo haces algo." },
            { m: "happy", t: "La misma carrera puede sentirse horrible o increíble dependiendo de lo que estés escuchando." },
            { m: "blush", t: "Suena un poco dramático, lo sé." },
            { m: "idle", t: "Llevo años haciendo playlists para todo: entrenar, concentrarme, salir... hasta tengo una para limpiar mi habitación." },
            { m: "happy", t: "Esa última casi nunca funciona." },
            { m: "music", t: "Ahora quiero hacer algo distinto: cassettes." },
            { m: "idle", t: "Algo físico. Eliges uno, lo pones y durante un rato entras en ese mood." },
            { m: "happy", t: "Quiero preparar mezclas para distintos momentos, pero primero quiero ver cómo encajan contigo." },
          ],
          setFlags: ["alexiaMet"],
          snap: (g) => ({ statProgress: alexiaStatProgress(g) }),
          progressCount: (g, snap) => Math.max(...STAT_KEYS.map((k) => alexiaStatProgress(g)[k] - snap.statProgress[k])), progressGoal: 20,
          check: (g, snap) => STAT_KEYS.some((k) => alexiaStatProgress(g)[k] - snap.statProgress[k] >= 20) },
        /* CAPÍTULO 1 — Encontrar el ritmo (sin cassette: desarrolla la historia) */
        { title: "Encontrar el ritmo", zone: "atico",
          objective: "Completa una actividad de entrenamiento existente y vuelve a hablar con Alexia.",
          intro: [
            { m: "happy", t: "Así que has probado a moverte con música." },
            { m: "idle", t: "¿Notas la diferencia?" },
            { m: "music", t: "No hace falta que sea enorme. A veces solo necesitas el empujón para empezar." },
            { m: "seria", t: "Hay días en los que tienes energía de sobra y otros en los que tu cuerpo quiere sofá." },
            { m: "happy", t: "Ahí entra una buena canción." },
            { m: "blush", t: "No hace milagros. Aunque alguna playlist mía se acerca bastante." },
            { m: "music", t: "Estoy preparando una mezcla para esos días en los que necesitas velocidad." },
            { m: "happy", t: "Algo que te haga pensar: venga, una más." },
            { m: "idle", t: "Creo que debería ser el primero de mis cassettes." },
          ],
          snap: () => ({ since: todayStr() }),
          check: (g, snap) => Object.entries(g.logs || {}).some(([d, l]) => d >= snap.since && l.closed && l.gym) },
        /* CAPÍTULO 2 — FULL SPEED (setup) */
        { title: "FULL SPEED", zone: "atico",
          objective: "Mantén una racha de 2 días de objetivos diarios.",
          intro: [
            { m: "happy", t: "Dos días." },
            { m: "idle", t: "Ya has empezado a encontrar tu ritmo." },
            { m: "music", t: "He terminado la mezcla." },
            { m: "happy", t: "Se llama FULL SPEED." },
            { m: "seria", t: "No es para hacer todo más rápido sin pensar." },
            { m: "idle", t: "Es para cuando necesitas dejar de darle vueltas y empezar a moverte." },
            { m: "blush", t: "La probé entrenando y casi me paso de intensidad." },
            { m: "happy", t: "Eso sí que es una buena señal." },
            { m: "music", t: "Quiero que la tengas. Actívala cuando necesites ese pequeño empujón." },
          ],
          progressCount: (g) => g.player.streak || 0, progressGoal: 2,
          snap: () => ({}),
          check: (g) => (g.player.streak || 0) >= 2 },
        /* ENTREGA — Cassette «FULL SPEED» (final:true: cierra el capítulo 1 y entrega el
           cassette; su intro es la reacción que el documento escribe al principio de
           "CAPÍTULO 3 — POWER BEAT") */
        { title: "FULL SPEED", final: true,
          intro: [
            { m: "happy", t: "FULL SPEED te queda bastante bien." },
            { m: "idle", t: "Pero no todo es velocidad." },
          ],
          grantItem: "cassette_full_speed", reveal: "cassette_full_speed" },
      ] },
    { id: "cap2", title: "POWER BEAT", trigger: () => true,
      stages: [
        { title: "POWER BEAT", zone: "atico",
          objective: "Consigue XP en FUE durante 2 días.",
          intro: [
            { m: "seria", t: "Hay momentos en los que necesitas fuerza." },
            { m: "music", t: "Por eso he hecho otra mezcla: POWER BEAT." },
            { m: "idle", t: "Tiene una base mucho más pesada." },
            { m: "blush", t: "De esas que hacen que hasta preparar la mochila parezca una misión importante." },
            { m: "happy", t: "Úsala cuando estés trabajando la fuerza." },
            { m: "seria", t: "No para hacerte invencible. Solo para darte ese momento de energía en el que dices: vale, puedo con esto." },
          ],
          progressCount: (g, snap) => Object.entries(g.logs || {}).filter(([d, l]) => d >= snap.since && l.closed && l.gym).length, progressGoal: 2,
          snap: () => ({ since: todayStr() }),
          check: (g, snap) => Object.entries(g.logs || {}).filter(([d, l]) => d >= snap.since && l.closed && l.gym).length >= 2 },
        { title: "POWER BEAT", final: true,
          intro: [
            { m: "happy", t: "La fuerza está bien." },
            { m: "idle", t: "Pero hay algo todavía más difícil: concentrarse." },
          ],
          grantItem: "cassette_power_beat", reveal: "cassette_power_beat" },
      ] },
    { id: "cap3", title: "LOCK IN", trigger: () => true,
      stages: [
        { title: "LOCK IN", zone: "atico",
          objective: "Consigue XP en RES durante 2 días.",
          intro: [
            { m: "seria", t: "Puedes tener tiempo, energía y ganas y acabar mirando cualquier cosa menos lo que estabas haciendo." },
            { m: "blush", t: "Soy experta. Una vez organicé una playlist durante dos horas para evitar una tarea." },
            { m: "music", t: "Por eso hice LOCK IN." },
            { m: "idle", t: "Menos ruido, menos distracciones." },
            { m: "happy", t: "Quiero que lo pruebes cuando necesites mantener la cabeza en una cosa." },
          ],
          progressCount: (g, snap) => Object.entries(g.logs || {}).filter(([d, l]) => d >= snap.since && l.closed && (l.habitsDone || []).length > 0).length, progressGoal: 2,
          snap: () => ({ since: todayStr() }),
          check: (g, snap) => Object.entries(g.logs || {}).filter(([d, l]) => d >= snap.since && l.closed && (l.habitsDone || []).length > 0).length >= 2 },
        { title: "LOCK IN", final: true,
          intro: [
            { m: "happy", t: "¿Sabes qué problema tiene una playlist perfecta?" },
            { m: "idle", t: "Que no puede hacer todo el trabajo." },
          ],
          grantItem: "cassette_lock_in", reveal: "cassette_lock_in" },
      ] },
    { id: "cap4", title: "GOOD ENERGY", trigger: () => true,
      stages: [
        { title: "GOOD ENERGY", zone: "atico",
          objective: "Consigue XP en NUT durante 2 días.",
          intro: [
            { m: "seria", t: "Puedes tener la mejor música, pero si no cuidas lo que metes en tu cuerpo, tarde o temprano se nota." },
            { m: "happy", t: "No voy a convertirme en tu nutricionista." },
            { m: "blush", t: "Tengo límites." },
            { m: "music", t: "Pero sí hice una mezcla para esos días en los que quieres sentirte con energía." },
            { m: "happy", t: "GOOD ENERGY." },
            { m: "idle", t: "La idea es sencilla: comer bien, beber agua y no tratar la alimentación como algo secundario." },
            { m: "seria", t: "La música puede acompañarte, pero el cuerpo necesita combustible." },
          ],
          progressCount: (g, snap) => Object.entries(g.logs || {}).filter(([d, l]) => d >= snap.since && l.closed && (l.kcal || 0) >= g.player.goals.kcal && (l.prot || 0) >= g.player.goals.protein).length, progressGoal: 2,
          snap: () => ({ since: todayStr() }),
          check: (g, snap) => Object.entries(g.logs || {}).filter(([d, l]) => d >= snap.since && l.closed && (l.kcal || 0) >= g.player.goals.kcal && (l.prot || 0) >= g.player.goals.protein).length >= 2 },
        { title: "GOOD ENERGY", final: true,
          intro: [
            { m: "idle", t: "Ahora viene mi cassette favorito." },
            { m: "happy", t: "No porque sea el más potente." },
          ],
          grantItem: "cassette_good_energy", reveal: "cassette_good_energy" },
      ] },
    { id: "cap5", title: "SLOW DOWN", trigger: () => true,
      stages: [
        { title: "SLOW DOWN", zone: "atico",
          objective: "Cumple el objetivo de sueño durante 2 días.",
          intro: [
            { m: "music", t: "Precisamente porque no intenta serlo." },
            { m: "seria", t: "SLOW DOWN." },
            { m: "idle", t: "No todo tiene que servir para acelerar." },
            { m: "happy", t: "A veces necesitas que alguien te recuerde que puedes bajar el ritmo." },
            { m: "blush", t: "Incluso yo necesito eso." },
            { m: "idle", t: "Dormir bien, descansar, dejar que la cabeza se apague." },
            { m: "music", t: "Esta mezcla está hecha para eso." },
            { m: "happy", t: "No tienes que hacer nada espectacular. Solo parar un poco." },
          ],
          progressCount: (g, snap) => Object.entries(g.logs || {}).filter(([d, l]) => d >= snap.since && l.closed && l.sleep != null && l.sleep >= g.player.goals.sleepGoal).length, progressGoal: 2,
          snap: () => ({ since: todayStr() }),
          check: (g, snap) => Object.entries(g.logs || {}).filter(([d, l]) => d >= snap.since && l.closed && l.sleep != null && l.sleep >= g.player.goals.sleepGoal).length >= 2 },
        { title: "SLOW DOWN", final: true,
          intro: [
            { m: "happy", t: "Ya tenemos cinco." },
            { m: "idle", t: "Y me falta uno que me costó bastante." },
          ],
          grantItem: "cassette_slow_down", reveal: "cassette_slow_down" },
      ] },
    { id: "cap6", title: "CLEAR MIND", trigger: () => true,
      stages: [
        { title: "CLEAR MIND", zone: "atico",
          objective: "Consigue XP en MEN durante 2 días.",
          intro: [
            { m: "music", t: "CLEAR MIND." },
            { m: "seria", t: "La cabeza es complicada." },
            { m: "idle", t: "Puedes estar motivado y aun así tener un día horrible." },
            { m: "happy", t: "Puedes estar cansado sin estar físicamente cansado." },
            { m: "blush", t: "Y puedes pasar veinte minutos mirando una pantalla sin saber qué estabas haciendo." },
            { m: "happy", t: "Créeme, me pasa." },
            { m: "music", t: "Esta mezcla no intenta hacerte feliz a la fuerza." },
            { m: "seria", t: "Solo intenta limpiar un poco el ruido." },
          ],
          progressCount: (g, snap) => Object.entries(g.logs || {}).filter(([d, l]) => d >= snap.since && l.closed && (l.form === "alza" || l.form === "buen")).length, progressGoal: 2,
          snap: () => ({ since: todayStr() }),
          check: (g, snap) => Object.entries(g.logs || {}).filter(([d, l]) => d >= snap.since && l.closed && (l.form === "alza" || l.form === "buen")).length >= 2 },
        { title: "CLEAR MIND", final: true,
          intro: [
            { m: "happy", t: "Ya tienes casi toda la colección." },
            { m: "idle", t: "FULL SPEED, POWER BEAT, LOCK IN, GOOD ENERGY, SLOW DOWN y CLEAR MIND." },
          ],
          grantItem: "cassette_clear_mind", reveal: "cassette_clear_mind" },
      ] },
    { id: "cap7", title: "Lo que falta", trigger: () => true,
      stages: [
        /* CAPÍTULO 8 — Lo que falta (sin cassette: desarrolla la historia) */
        { title: "Lo que falta", zone: "atico",
          objective: "Completa un objetivo existente de progreso general.",
          intro: [
            { m: "music", t: "Seis cassettes para seis momentos distintos." },
            { m: "seria", t: "Pero mientras los hacía me di cuenta de algo." },
            { m: "idle", t: "Yo estaba intentando separar cosas que en realidad nunca están separadas." },
            { m: "happy", t: "La fuerza afecta a la cabeza. Dormir afecta al entrenamiento. Comer bien cambia tu energía." },
            { m: "blush", t: "Y estar de buen humor hace que todo parezca un poquito más fácil." },
            { m: "music", t: "Me falta una última mezcla." },
            { m: "idle", t: "Una que no sea para un stat concreto." },
          ],
          progressCount: (g, snap) => daysGoalsCompletedSince(g, snap.since), progressGoal: 3,
          snap: () => ({ since: todayStr() }),
          check: (g, snap) => daysGoalsCompletedSince(g, snap.since) >= 3 },
        /* CAPÍTULO 9 — ALL IN (setup: su propia reacción al CAP8 ya abre esta etapa, tal
           como está escrito en el documento — no hace falta partir nada aquí) */
        { title: "ALL IN", zone: "atico",
          objective: "Completa un hito global de progreso existente.",
          intro: [
            { m: "happy", t: "Lo sabía." },
            { m: "music", t: "Tenías que llegar hasta aquí." },
            { m: "seria", t: "He terminado el último cassette." },
            { m: "idle", t: "ALL IN." },
            { m: "happy", t: "No es más rápido. No es más fuerte. No es más relajado." },
            { m: "seria", t: "Es todo a la vez." },
            { m: "music", t: "Porque al final no puedes separar una parte de ti del resto." },
            { m: "idle", t: "Entrenar, comer, descansar, concentrarte y tener la cabeza en su sitio forman parte de lo mismo." },
            { m: "blush", t: "Sí, quizá me estoy poniendo un poco filosófica." },
            { m: "happy", t: "Pero me gusta." },
            { m: "seria", t: "Quiero que lo tengas. Este no lo voy a volver a regalar." },
          ],
          snap: (g) => ({ tierId: g.tier.id, ovr: calcOVR(g.player.stats) }),
          check: (g, snap) => g.tier.id !== snap.tierId || calcOVR(g.player.stats) > snap.ovr },
        /* ENTREGA — Cassette «ALL IN» */
        { title: "ALL IN", final: true,
          intro: [
            { m: "happy", t: "Mira eso." },
            { m: "idle", t: "Ya no estás usando la música para que te diga qué hacer." },
          ],
          grantItem: "cassette_all_in", reveal: "cassette_all_in" },
      ] },
    { id: "cap8", title: "Tu propio ritmo", trigger: () => true,
      stages: [
        /* CAPÍTULO 10 — Tu propio ritmo (sin cassette: desarrolla la historia) */
        { title: "Tu propio ritmo", zone: "atico",
          objective: "Mantén una racha de 4 días.",
          intro: [
            { m: "seria", t: "La estás usando para acompañarte." },
            { m: "music", t: "Eso era lo que quería conseguir desde el principio." },
            { m: "happy", t: "No hay una canción que haga que entrenes por ti." },
            { m: "idle", t: "Solo canciones que te ayudan a entrar en el estado adecuado." },
            { m: "blush", t: "Y tu ritmo no tiene que ser igual al mío." },
            { m: "happy", t: "Solo tiene que ser tuyo." },
          ],
          progressCount: (g) => g.player.streak || 0, progressGoal: 4,
          snap: () => ({}),
          check: (g) => (g.player.streak || 0) >= 4 },
        /* FINAL — Tu playlist (última etapa: final:true, sin cassette — los 7 ya se
           entregaron antes; solo cierra la campaña y desbloquea el modo infinito, ver
           refreshAlexiaVisit) */
        { title: "Tu playlist", zone: "atico", final: true,
          intro: [
            { m: "happy", t: "Así que hemos llegado al final." },
            { m: "idle", t: "Bueno... al final de esta historia." },
            { m: "music", t: "Porque la música no se termina." },
            { m: "seria", t: "Tienes los siete cassettes." },
            { m: "happy", t: "Los seis para momentos concretos y ALL IN para cuando quieras ir a por todo." },
            { m: "blush", t: "Aunque espero que no lo pongas para hacer absolutamente cualquier cosa." },
            { m: "idle", t: "No quiero ser responsable de que limpies tu habitación a velocidad absurda." },
            { m: "happy", t: "A partir de ahora puedes usarlos cuando quieras." },
            { m: "music", t: "Y yo seguiré preparando mezclas." },
            { m: "seria", t: "Todavía hay canciones que no he encontrado." },
            { m: "happy", t: "Así que supongo que nos veremos." },
          ],
          setFlags: ["alexiaStoryComplete"] },
      ] },
  ],
};
/* MODO INFINITO de Alexia (ver refreshAlexiaVisit): 1 día activa cada 5 (mismo patrón que
   usaba Coco v1, distinto del ciclo alterno de Coco v2 — el documento de Alexia es
   explícito: "Alexia aparece 1 día cada 5 días"), solo tras completar su campaña
   (alexiaStoryComplete). Entrega 1 cassette aleatorio del pool de 6 (nunca ALL IN, que
   queda como recompensa única de historia). */
const ALEXIA_GREETING = [
  { m: "happy", t: "Otra vez por aquí." },
  { m: "music", t: "Llevo días dándole vueltas a una mezcla nueva." },
  { m: "idle", t: "Toma, prueba esta." },
];

/* ============================================================
   MILO · criatura escondida tras una roca del Parque (ver
   FUTABITA_Milo_Rework_Narrativo_v4_Jugador_Vera_Milo.docx). Estructura
   de tres: el jugador está presente en cada escena pero nunca tiene
   líneas propias (el documento lo pide explícitamente); Vera hace de
   intérprete y puente, Milo se dirige cada vez más directamente al
   jugador a medida que gana confianza.

   Novedad de motor: hasta ahora una escena entera pertenecía a UN solo
   personaje (addScene recibía un "from" único para todos sus beats).
   Aquí Vera y Milo hablan dentro de la MISMA escena, así que cada beat
   puede llevar su propio "from" que pisa el de la escena solo para esa
   línea (ver addScene/queueStageScene) — sin overrides, cualquier otra
   historia se comporta exactamente igual que antes.

   Arco visual (ver NPCS.milo.arts): escondido (prólogo-cap1) -> shy
   (cap2-cap4, primera revelación) -> idle (cap5-cap9, ya confía) ->
   happy (cap10-epílogo, busca al jugador por iniciativa propia). Los
   cambios de mood ocurren DENTRO de la propia etapa cuando el documento
   marca un cambio de pose a media escena (p.ej. cap2: Milo sale del
   escondite a mitad de conversación), no entre etapas.

   Recompensa: solo UNA, la Carta de Milo, entregada al cerrar el
   capítulo 10 (no al final de la historia entera, a diferencia de
   Elisa/Milly/etc.) — así que en vez de partir cada capítulo en
   SETUP+ENTREGA (patrón de Vera/Alexia, innecesario aquí porque solo
   hay un premio), toda la historia vive en un único capítulo largo
   (patrón de Elisa/Milly) y grantItem/reveal se colocan directamente en
   una pequeña etapa de entrega entre el capítulo 10 y el FINAL — no
   necesita final:true porque grantItem/reveal se disparan por
   applyOnRead al leer la escena, no por cerrar capítulo.

   Checks: "actividad de fútbol" -> día con gym; "actividad de ciudad" ->
   día cualquiera cerrado; "actividad social" (cap4, cameo de Nina) ->
   visita a la Zona Deportiva, mismo mecanismo zoneVisitedSince que ya
   usa Beka para la Discoteca; "hito global" (cap9) -> mismo criterio que
   Beka cap9 (cambio de tier o mejora de OVR). */
const MILO_STORY = {
  npc: "milo",
  chapters: [{
    id: "cap1",
    title: "La historia de Milo",
    trigger: () => true,
    stages: [
      /* PRÓLOGO — Dos ojos detrás de la roca */
      { title: "Dos ojos detrás de la roca", zone: "parque",
        objective: "Vuelve a visitar el parque.",
        intro: [
          { m: "pintora_pensando", t: "Espera. ¿Has visto eso?", from: "Vera" },
          { m: "seria", t: "Llevo un rato pensando que eran reflejos... pero esos ojos llevan demasiado tiempo mirándonos.", from: "Vera" },
          { m: "escondido", t: "..." },
          { m: "seria", t: "Hola.", from: "Vera" },
          { m: "escondido", t: "Hola." },
          { m: "happy", t: "Vale. Eso ha sido inesperadamente educado.", from: "Vera" },
          { m: "escondido", t: "No os acerquéis." },
          { m: "seria", t: "No vamos a acercarnos.", from: "Vera" },
          { m: "escondido", t: "¿Él tampoco?" },
          { m: "seria", t: "Tampoco.", from: "Vera" },
          { m: "escondido", t: "Bien." },
          { m: "pintora_pensando", t: "¿Cómo te llamas?", from: "Vera" },
          { m: "escondido", t: "Milo." },
          { m: "happy", t: "Milo. Encantada.", from: "Vera" },
          { m: "escondido", t: "¿Él también?" },
          { m: "happy", t: "Sí. Aunque no creo que necesites que hable por él.", from: "Vera" },
          { m: "escondido", t: "Vale." },
          { m: "seria", t: "No vamos a hacerte nada. Solo queríamos saber quién estaba ahí.", from: "Vera" },
          { m: "escondido", t: "Ya lo sabéis." },
          { m: "happy", t: "Sí. Y ahora tenemos un segundo problema.", from: "Vera" },
          { m: "escondido", t: "¿Cuál?" },
          { m: "happy", t: "Que ahora queremos saber por qué te escondes.", from: "Vera" },
          { m: "escondido", t: "No." },
          { m: "happy", t: "Respuesta rápida.", from: "Vera" },
        ],
        setFlags: ["miloMet"],
        snap: () => ({}), check: () => true },
      /* CAPÍTULO 1 — No hace falta salir */
      { title: "No hace falta salir", zone: "parque",
        objective: "Completa una actividad de ciudad y vuelve al parque.",
        intro: [
          { m: "idle", t: "Ha vuelto a aparecer.", from: "Vera" },
          { m: "escondido", t: "Sí." },
          { m: "happy", t: "Y esta vez sabía que veníamos.", from: "Vera" },
          { m: "escondido", t: "Sí." },
          { m: "seria", t: "¿Te molesta que venga él?", from: "Vera" },
          { m: "escondido", t: "No." },
          { m: "seria", t: "¿Te molesta que venga yo?", from: "Vera" },
          { m: "escondido", t: "Un poco." },
          { m: "happy", t: "Perfecto. Me siento muy querida.", from: "Vera" },
          { m: "escondido", t: "No era eso." },
          { m: "happy", t: "Ya lo sé.", from: "Vera" },
          { m: "seria", t: "¿Quieres que nos vayamos?", from: "Vera" },
          { m: "escondido", t: "No." },
          { m: "seria", t: "Entonces nos quedamos aquí.", from: "Vera" },
          { m: "escondido", t: "¿Aunque él se quede?" },
          { m: "seria", t: "Aunque él se quede.", from: "Vera" },
          { m: "escondido", t: "Vale." },
          { m: "pintora_pensando", t: "Creo que eso es lo más cerca que vas a estar de una invitación.", from: "Vera" },
          { m: "escondido", t: "No es una invitación." },
          { m: "happy", t: "Claro que no.", from: "Vera" },
        ],
        snap: (g) => ({ since: todayStr() }),
        check: (g, snap) => Object.entries(g.logs || {}).some(([d, l]) => d >= snap.since && l.closed) },
      /* CAPÍTULO 2 — Un poco de luz (primera revelación: escondido -> shy A MEDIA ESCENA) */
      { title: "Un poco de luz", zone: "parque",
        objective: "Completa una actividad de fútbol y vuelve al parque.",
        intro: [
          { m: "happy", t: "Te dije que volveríamos.", from: "Vera" },
          { m: "escondido", t: "Sí." },
          { m: "seria", t: "¿Y sigues escondido?", from: "Vera" },
          { m: "escondido", t: "Sí." },
          { m: "happy", t: "Bueno. Al menos eres constante.", from: "Vera" },
          { m: "escondido", t: "Estoy pensando." },
          { m: "seria", t: "¿En qué?", from: "Vera" },
          { m: "escondido", t: "En él." },
          { m: "seria", t: "¿En él?", from: "Vera" },
          { m: "escondido", t: "No sé si puedo estar delante de alguien y no tener que irme." },
          { m: "seria", t: "No tienes que demostrar nada.", from: "Vera" },
          { m: "escondido", t: "¿Y si salgo?" },
          { m: "seria", t: "Entonces sales.", from: "Vera" },
          { m: "escondido", t: "¿Y si me arrepiento?" },
          { m: "seria", t: "Vuelves a esconderte.", from: "Vera" },
          { m: "shy", t: "Así está bien." },
          { m: "happy", t: "Sí.", from: "Vera" },
          { m: "shy", t: "No me miréis tanto." },
          { m: "happy", t: "Eso va a ser difícil.", from: "Vera" },
          { m: "shy", t: "Vera." },
          { m: "happy", t: "Vale, vale.", from: "Vera" },
          { m: "shy", t: "Él puede mirar." },
          { m: "happy", t: "¿Solo él?", from: "Vera" },
          { m: "shy", t: "Sí." },
        ],
        setFlags: ["miloFirstReveal"],
        snap: (g) => ({ since: todayStr() }),
        check: (g, snap) => Object.entries(g.logs || {}).some(([d, l]) => d >= snap.since && l.closed && l.gym) },
      /* CAPÍTULO 3 — El balón */
      { title: "El balón", zone: "parque",
        objective: "Completa una actividad de fútbol y consigue una victoria.",
        intro: [
          { m: "shy", t: "Has vuelto." },
          { m: "happy", t: "Mira quién habla primero.", from: "Vera" },
          { m: "shy", t: "No me gusta cuando haces eso." },
          { m: "happy", t: "¿Qué cosa?", from: "Vera" },
          { m: "shy", t: "Hacer que parezca importante." },
          { m: "seria", t: "Vale.", from: "Vera" },
          { m: "shy", t: "Él también ha vuelto." },
          { m: "happy", t: "Sí.", from: "Vera" },
          { m: "shy", t: "Pensaba que quizá no volvería." },
          { m: "seria", t: "¿Y te habría molestado?", from: "Vera" },
          { m: "shy", t: "Sí." },
          { m: "happy", t: "Puedes decírselo a él.", from: "Vera" },
          { m: "shy", t: "Me alegra que hayas vuelto." },
          { m: "seria", t: "Mucho mejor.", from: "Vera" },
          { m: "shy", t: "¿Quieres jugar?" },
          { m: "happy", t: "Eso tendrás que preguntárselo a él.", from: "Vera" },
          { m: "shy", t: "Ah." },
          { m: "shy", t: "¿Juegas conmigo?" },
          { m: "happy", t: "Creo que acabas de conseguir una invitación.", from: "Vera" },
          { m: "shy", t: "No era una invitación." },
          { m: "happy", t: "Claro.", from: "Vera" },
        ],
        snap: (g) => ({ since: todayStr(), matchCount: (g.matchHistory || []).length }),
        subs: [
          (g, snap) => Object.entries(g.logs || {}).some(([d, l]) => d >= snap.since && l.closed && l.gym),
          (g, snap) => (g.matchHistory || []).slice(snap.matchCount).some((m) => m.res === "V"),
        ],
        check: (g, snap) => Object.entries(g.logs || {}).some(([d, l]) => d >= snap.since && l.closed && l.gym) &&
          (g.matchHistory || []).slice(snap.matchCount).some((m) => m.res === "V") },
      /* CAPÍTULO 4 — Una persona más (cameo de Nina, no requiere su campaña) */
      { title: "Una persona más", zone: "ciudad-dep",
        objective: "Completa una actividad social y mantén una racha de 2 días.",
        intro: [
          { m: "happy", t: "Te presento a alguien.", from: "Vera" },
          { m: "shy", t: "¿Por qué?" },
          { m: "happy", t: "Porque dijiste que querías jugar.", from: "Vera" },
          { m: "shy", t: "Contigo." },
          { m: "happy", t: "Y con él.", from: "Vera" },
          { m: "shy", t: "Ah." },
          { m: "happy", t: "¿Este es Milo?", from: "Nina" },
          { m: "happy", t: "Sí.", from: "Vera" },
          { m: "shy", t: "Hola." },
          { m: "happy", t: "Hola. ¿Juegas de verdad o solo dices que juegas?", from: "Nina" },
          { m: "shy", t: "Juego." },
          { m: "happy", t: "Perfecto.", from: "Nina" },
          { m: "shy", t: "¿Tú eres buena?" },
          { m: "happy", t: "Bastante.", from: "Nina" },
          { m: "happy", t: "Mucho.", from: "Vera" },
          { m: "happy", t: "Gracias por la ayuda.", from: "Nina" },
          { m: "shy", t: "¿Él juega bien?" },
          { m: "happy", t: "Eso lo tienes que descubrir tú.", from: "Nina" },
          { m: "shy", t: "Vale." },
          { m: "shy", t: "No ha sido tan malo." },
          { m: "happy", t: "No.", from: "Vera" },
          { m: "shy", t: "Podemos hacerlo otra vez." },
        ],
        setFlags: ["miloSocial"],
        snap: (g) => ({ since: todayStr() }),
        subs: [
          (g, snap) => zoneVisitedSince(g, "ciudad-dep", snap.since),
          { count: (g) => g.player.streak || 0, goal: 2 },
        ],
        check: (g, snap) => zoneVisitedSince(g, "ciudad-dep", snap.since) && (g.player.streak || 0) >= 2 },
      /* CAPÍTULO 5 — Lo que guarda (Milo ya no se esconde: mood pasa a idle) */
      { title: "Lo que guarda", zone: "parque",
        objective: "Completa objetivos de alimentación y descanso durante 2 días.",
        intro: [
          { m: "idle", t: "Hoy te veo menos nervioso.", from: "Vera" },
          { m: "idle", t: "Estoy acostumbrándome." },
          { m: "happy", t: "¿A nosotros?", from: "Vera" },
          { m: "idle", t: "A él." },
          { m: "happy", t: "Ah.", from: "Vera" },
          { m: "idle", t: "Tú hablas mucho." },
          { m: "happy", t: "Eso también es cierto.", from: "Vera" },
          { m: "idle", t: "Él no." },
          { m: "happy", t: "Tampoco sabes si es porque no quiere.", from: "Vera" },
          { m: "idle", t: "No importa." },
          { m: "seria", t: "¿Qué llevas en la bolsa?", from: "Vera" },
          { m: "idle", t: "Cosas." },
          { m: "happy", t: "Ya hemos tenido esta conversación.", from: "Vera" },
          { m: "idle", t: "Son mías." },
          { m: "seria", t: "Vale.", from: "Vera" },
          { m: "idle", t: "Había una pelota pequeña." },
          { m: "seria", t: "¿Antes?", from: "Vera" },
          { m: "idle", t: "Antes." },
          { m: "seria", t: "¿De alguien?", from: "Vera" },
          { m: "idle", t: "Sí." },
          { m: "happy", t: "No tienes que enseñárnosla.", from: "Vera" },
          { m: "idle", t: "No." },
          { m: "idle", t: "Pero a él sí." },
        ],
        setFlags: ["miloPastObject"],
        snap: () => ({ since: todayStr() }),
        progressCount: (g, snap) => proteinSleepDaysSince(g, snap.since), progressGoal: 2,
        check: (g, snap) => proteinSleepDaysSince(g, snap.since) >= 2 },
      /* CAPÍTULO 6 — No es que no me guste la gente */
      { title: "No es que no me guste la gente", zone: "parque",
        objective: "Mantén una racha de 3 días y completa una actividad de fútbol.",
        intro: [
          { m: "idle", t: "¿Puedo preguntarte algo?", from: "Vera" },
          { m: "idle", t: "Sí." },
          { m: "seria", t: "Cuando alguien se acerca, quieres esconderte.", from: "Vera" },
          { m: "idle", t: "Sí." },
          { m: "seria", t: "Pero cuando él no viene, lo preguntas.", from: "Vera" },
          { m: "idle", t: "Sí." },
          { m: "seria", t: "Entonces no es que no te guste la gente.", from: "Vera" },
          { m: "idle", t: "No." },
          { m: "seria", t: "¿Qué pasa entonces?", from: "Vera" },
          { m: "idle", t: "La gente se va." },
          { m: "seria", t: "¿Alguien se fue?", from: "Vera" },
          { m: "idle", t: "Sí." },
          { m: "seria", t: "¿Y esperaste?", from: "Vera" },
          { m: "idle", t: "Mucho." },
          { m: "seria", t: "¿Te dijo que volvería?", from: "Vera" },
          { m: "idle", t: "No." },
          { m: "seria", t: "Entonces, ¿por qué esperaste?", from: "Vera" },
          { m: "idle", t: "Porque no sabía qué más hacer." },
          { m: "seria", t: "Lo siento.", from: "Vera" },
          { m: "idle", t: "No fue culpa tuya." },
          { m: "seria", t: "No estaba hablando de mí.", from: "Vera" },
          { m: "idle", t: "Ya." },
          { m: "idle", t: "Él no se ha ido." },
          { m: "seria", t: "No.", from: "Vera" },
          { m: "idle", t: "Eso está bien." },
        ],
        setFlags: ["miloPastRevealed"],
        snap: () => ({ since: todayStr() }),
        subs: [
          { count: (g) => g.player.streak || 0, goal: 3 },
          (g, snap) => Object.entries(g.logs || {}).some(([d, l]) => d >= snap.since && l.closed && l.gym),
        ],
        check: (g, snap) => (g.player.streak || 0) >= 3 &&
          Object.entries(g.logs || {}).some(([d, l]) => d >= snap.since && l.closed && l.gym) },
      /* CAPÍTULO 7 — Puedes decidir mañana (Milo ya se dirige directamente al jugador) */
      { title: "Puedes decidir mañana", zone: "parque",
        objective: "Completa objetivos diarios durante 3 días.",
        intro: [
          { m: "idle", t: "He pensado en lo que me contaste.", from: "Vera" },
          { m: "idle", t: "No quiero hablar de eso." },
          { m: "seria", t: "No tenemos que hacerlo.", from: "Vera" },
          { m: "idle", t: "Bien." },
          { m: "seria", t: "Solo quería decirte algo.", from: "Vera" },
          { m: "idle", t: "¿Qué?" },
          { m: "seria", t: "No tienes que decidir hoy si confías en nosotros.", from: "Vera" },
          { m: "idle", t: "¿No?" },
          { m: "seria", t: "No. Puedes decidir mañana.", from: "Vera" },
          { m: "idle", t: "¿Y pasado?" },
          { m: "seria", t: "También.", from: "Vera" },
          { m: "idle", t: "Eso es mucho tiempo." },
          { m: "happy", t: "Exactamente.", from: "Vera" },
          { m: "idle", t: "Entonces me quedo hoy." },
          { m: "happy", t: "Me parece un buen comienzo.", from: "Vera" },
          { m: "idle", t: "Él también puede quedarse." },
          { m: "happy", t: "Eso tendrás que decírselo tú.", from: "Vera" },
          { m: "idle", t: "Vale." },
          { m: "idle", t: "Quédate." },
        ],
        snap: () => ({ since: todayStr() }),
        progressCount: (g, snap) => daysGoalsCompletedSince(g, snap.since), progressGoal: 3,
        check: (g, snap) => daysGoalsCompletedSince(g, snap.since) >= 3 },
      /* CAPÍTULO 8 — Sin esconderse */
      { title: "Sin esconderse", zone: "ciudad-dep",
        objective: "Consigue una victoria y mantén una racha de 4 días.",
        intro: [
          { m: "idle", t: "Hay bastante gente hoy.", from: "Vera" },
          { m: "idle", t: "Lo sé." },
          { m: "seria", t: "Si quieres volver a la roca, nadie te va a seguir.", from: "Vera" },
          { m: "idle", t: "No quiero." },
          { m: "happy", t: "¿Seguro?", from: "Vera" },
          { m: "idle", t: "Sí." },
          { m: "idle", t: "Quiero jugar con él." },
          { m: "happy", t: "Entonces ve.", from: "Vera" },
          { m: "idle", t: "¿Vienes?" },
          { m: "happy", t: "Voy a mirar.", from: "Vera" },
          { m: "idle", t: "No. Tú también." },
          { m: "happy", t: "Vale.", from: "Vera" },
        ],
        setFlags: ["miloConfident"],
        snap: (g) => ({ matchCount: (g.matchHistory || []).length }),
        subs: [
          (g, snap) => (g.matchHistory || []).slice(snap.matchCount).some((m) => m.res === "V"),
          { count: (g) => g.player.streak || 0, goal: 4 },
        ],
        check: (g, snap) => (g.matchHistory || []).slice(snap.matchCount).some((m) => m.res === "V") &&
          (g.player.streak || 0) >= 4 },
      /* CAPÍTULO 9 — Puedo volver */
      { title: "Puedo volver", zone: "parque",
        objective: "Completa un hito global y mantén una racha de 5 días.",
        intro: [
          { m: "happy", t: "¿Has venido solo?", from: "Vera" },
          { m: "idle", t: "Sí." },
          { m: "happy", t: "¿Y no te has escondido?", from: "Vera" },
          { m: "idle", t: "No." },
          { m: "happy", t: "¿Por qué?", from: "Vera" },
          { m: "idle", t: "Porque sabía que podía salir." },
          { m: "happy", t: "Eso es nuevo.", from: "Vera" },
          { m: "idle", t: "Y si me pongo nervioso, puedo volver." },
          { m: "happy", t: "A la roca.", from: "Vera" },
          { m: "idle", t: "Sí." },
          { m: "happy", t: "Pero ya no la necesitas.", from: "Vera" },
          { m: "idle", t: "A veces sí." },
          { m: "happy", t: "Mejor respuesta.", from: "Vera" },
          { m: "idle", t: "¿Él viene?" },
          { m: "happy", t: "Creo que sí.", from: "Vera" },
          { m: "idle", t: "Bien." },
          { m: "idle", t: "Quiero enseñarle algo." },
        ],
        snap: (g) => ({ tierId: g.tier.id, ovr: calcOVR(g.player.stats) }),
        subs: [
          (g, snap) => g.tier.id !== snap.tierId || calcOVR(g.player.stats) > snap.ovr,
          { count: (g) => g.player.streak || 0, goal: 5 },
        ],
        check: (g, snap) => (g.tier.id !== snap.tierId || calcOVR(g.player.stats) > snap.ovr) && (g.player.streak || 0) >= 5 },
      /* CAPÍTULO 10 — Aquí estás (Milo aparece por iniciativa propia: mood pasa a happy) */
      { title: "Aquí estás", zone: "ciudad-dep",
        objective: "Consigue una victoria y mantén una racha de 5 días.",
        intro: [
          { m: "happy", t: "¡Has venido!" },
          { m: "happy", t: "Creo que alguien estaba esperando.", from: "Vera" },
          { m: "happy", t: "Sí." },
          { m: "happy", t: "¿Desde cuándo?", from: "Vera" },
          { m: "happy", t: "Desde antes." },
          { m: "happy", t: "Eso explica por qué llevas diez minutos mirando la entrada.", from: "Vera" },
          { m: "happy", t: "No estaba mirando." },
          { m: "happy", t: "Claro.", from: "Vera" },
          { m: "happy", t: "¿Jugamos?" },
          { m: "happy", t: "Hoy no quiero esconderme." },
          { m: "happy", t: "Ya me había dado cuenta.", from: "Vera" },
          { m: "happy", t: "La roca sigue ahí." },
          { m: "happy", t: "Sí.", from: "Vera" },
          { m: "happy", t: "Puedo volver cuando quiera." },
          { m: "happy", t: "Y también puedes quedarte.", from: "Vera" },
          { m: "happy", t: "Me quedo." },
          { m: "happy", t: "Contigo." },
          { m: "happy", t: "Vamos." },
        ],
        setFlags: ["miloReady"],
        snap: (g) => ({ matchCount: (g.matchHistory || []).length }),
        subs: [
          (g, snap) => (g.matchHistory || []).slice(snap.matchCount).some((m) => m.res === "V"),
          { count: (g) => g.player.streak || 0, goal: 5 },
        ],
        check: (g, snap) => (g.matchHistory || []).slice(snap.matchCount).some((m) => m.res === "V") &&
          (g.player.streak || 0) >= 5 },
      /* ENTREGA — Carta de Milo (no final:true: grantItem/reveal solo necesitan que se lea
         la escena, no cerrar capítulo — ver nota de cabecera. El documento no escribe
         diálogo propio para este momento, solo "RECOMPENSA: Carta de Milo x1", así que la
         reacción es una escena corta nueva en el mismo tono corto y directo de Milo). */
      { title: "Aquí estás", zone: "ciudad-dep",
        objective: "Sin objetivo adicional.",
        intro: [
          { m: "happy", t: "Espera." },
          { m: "happy", t: "Toma esto." },
          { m: "happy", t: "¿Se lo estás dando tú?", from: "Vera" },
          { m: "happy", t: "Sí." },
          { m: "happy", t: "Eso sí que es nuevo.", from: "Vera" },
          { m: "happy", t: "Es para que no se le olvide." },
        ],
        setFlags: ["miloPinEarned"],
        grantItem: "milo_pin", reveal: "milo_pin",
        snap: () => ({}), check: () => true },
      /* FINAL — El dibujo */
      { title: "El dibujo", zone: "parque",
        objective: "Sin objetivo adicional.",
        intro: [
          { m: "seria", t: "He terminado.", from: "Vera" },
          { m: "happy", t: "¿El dibujo?" },
          { m: "happy", t: "Sí.", from: "Vera" },
          { m: "happy", t: "¿Estoy escondido?" },
          { m: "happy", t: "No.", from: "Vera" },
          { m: "happy", t: "Enséñamelo." },
          { m: "happy", t: "Me gusta." },
          { m: "happy", t: "¿De verdad?", from: "Vera" },
          { m: "happy", t: "Sí." },
          { m: "happy", t: "Pensaba que querrías esconderte también en el dibujo.", from: "Vera" },
          { m: "happy", t: "No." },
          { m: "happy", t: "¿Por qué?", from: "Vera" },
          { m: "happy", t: "Porque él está ahí." },
          { m: "happy", t: "Ah.", from: "Vera" },
          { m: "happy", t: "Y tú también." },
          { m: "happy", t: "Entonces supongo que está bien.", from: "Vera" },
          { m: "happy", t: "Está muy bien." },
        ],
        snap: () => ({}), check: () => true },
      /* EPÍLOGO — La roca (sin misión: cierra el símbolo visual de la campaña) */
      { title: "La roca", zone: "parque", final: true,
        intro: [
          { m: "happy", t: "¿Qué haces aquí?", from: "Vera" },
          { m: "happy", t: "Me gusta este sitio." },
          { m: "happy", t: "Pensaba que lo odiabas.", from: "Vera" },
          { m: "happy", t: "Antes." },
          { m: "happy", t: "¿Y ahora?", from: "Vera" },
          { m: "happy", t: "Ahora puedo estar aquí sin esconderme." },
          { m: "happy", t: "Eso cambia bastante las cosas.", from: "Vera" },
          { m: "happy", t: "Sí." },
          { m: "happy", t: "¿Nos vamos?" },
          { m: "happy", t: "¿A dónde?", from: "Vera" },
          { m: "happy", t: "A buscarle." },
        ],
        setFlags: ["miloStoryComplete"] },
    ],
  }],
};

/* registro único: desde la fusión de La Metrópolis dentro de La Ciudad ya no hace
   falta separar por mapa (todas las zonas conviven en el mismo SVG). */
const STORIES = { ...toStories(QUESTS), elisa: ELISA_STORY, milly: MILLY_STORY, yuna: YUNA_STORY, lopez: LOPEZ_STORY, igor: IGOR_STORY, lisa: KARLA_STORY, beka: BEKA_STORY, nina: NINA_STORY, coco: COCO_STORY, vera: VERA_STORY, alexia: ALEXIA_STORY, milo: MILO_STORY };

/* ============================================================
   OBJETOS COLECCIONABLES · dos tipos: "consumable" (los usas, dan
   XP de una stat y se gastan) y "gift" (se los das a un personaje
   concreto: reacciona con un mensaje propio y el objeto desaparece
   del inventario). game.inventory = { itemId: cantidad }.
   ============================================================ */
/* seis consumibles, uno por stat (ver STAT_KEYS), pensados para ser difíciles de
   conseguir: +50 XP cada uno. */
const ITEMS = {
  botiquin: { name: "Botiquín de Recuperación", icon: "🩹", img: "/images/objects/botiquin.webp", kind: "consumable", stat: "REC", xp: 50,
    desc: "Un kit de recuperación rápida. Lo usas y notas las piernas más frescas al instante." },
  libreta_tactica: { name: "Libreta Táctica", icon: "📓", img: "/images/objects/libreta_tactica.webp", kind: "consumable", stat: "RES", xp: 50,
    desc: "Llena de anotaciones de Elisa sobre cómo aguantar los noventa minutos sin bajar el ritmo." },
  especias_raras: { name: "Especias Raras", icon: "🌶️", img: "/images/objects/guindilla.webp", kind: "consumable", stat: "NUT", xp: 50,
    desc: "Una mezcla que Igor trae de sus viajes de cocina. Nadie sabe bien qué lleva, pero funciona." },
  amuleto_suerte: { name: "Amuleto de la Suerte", icon: "🍀", img: "/images/objects/amuleto_suerte.webp", kind: "consumable", stat: "FUE", xp: 50,
    desc: "Dicen que trae suerte. Lo que seguro trae es fuerza, si te acuerdas de usarlo." },
  bebida_energetica: { name: "Bebida Energética", icon: "🥤", img: "/images/objects/bebida_energetica.webp", kind: "consumable", stat: "MEN", xp: 50,
    desc: "Justo lo que hace falta para afinar la cabeza antes de un día exigente." },
  zapatillas: { name: "Zapatillas de Entrenamiento", icon: "👟", img: "/images/objects/zapatillas_de_entrenamiento.webp", kind: "consumable", stat: "FIS", xp: 50,
    desc: "Un par nuevo, todavía sin estrenar del todo. Dan ganas de salir a correr." },
  perfume_lujo: { name: "Perfume de Lujo", icon: "🧴", img: "/images/objects/perfume_lujo.webp", kind: "gift", giveTo: "lisa",
    desc: "Un frasco carísimo que Milly guardaba 'para una ocasión especial'. Le pega mucho a Karla." },
  /* Cartas coleccionables (ver FUTABITA_Sistema_Cartas_y_Sobres_Code.docx). Los antiguos
     "pines" de historia pasan a ser el MISMO objeto conceptual actualizado, no un sistema
     paralelo: mismo id (elisa_pin, etc. — el documento pide explícitamente no renombrar,
     "aunque el archivo diga _pin, Code debe tratarlo como CARTA"), solo cambia el asset
     (ahora en /images/cartas, ver CARD_POOL/SobreReveal más abajo) y se vuelven vendibles
     a precio fijo. kind:"card": sin botón de acción en InventoryPanel (igual que antes con
     "keepsake"), pero con sellMin/sellMax que ya es lo único que activa el botón VENDER en
     CocoShop. nina_pin/coco_pin/vera_pin/alexia_pin son cartas sin pin de historia propio:
     si algún día tienen su propia entrega narrativa pueden reutilizar este mismo id sin
     tener que crear nada — por ahora solo existen en el pool del sobre. milo_pin es la
     única excepción de este grupo: MILO_STORY sí la entrega al cerrar su campaña (capítulo
     10, ver grantItem/reveal), así que además de vivir en el pool del sobre también tiene
     su propia entrada en CARD_STORY_FLAG más abajo. */
  elisa_pin: { name: "Carta de Elisa", icon: "🎴", img: "/images/cartas/elisa_pin.webp", kind: "card", sellMin: 15, sellMax: 15,
    desc: "La carta que te dio Elisa al cierre de vuestra historia. Coleccionable, vendible a Coco por 15 monedas." },
  milly_pin: { name: "Carta de Milly", icon: "🎴", img: "/images/cartas/milly_pin.webp", kind: "card", sellMin: 15, sellMax: 15,
    desc: "La carta que te dio Milly al publicar su gran reportaje. Coleccionable, vendible a Coco por 15 monedas." },
  yuna_pin: { name: "Carta de Yuna", icon: "🎴", img: "/images/cartas/yuna_pin.webp", kind: "card", sellMin: 15, sellMax: 15,
    desc: "La carta que te dio Yuna cuando por fin dejó de esconderse detrás de las excusas. Coleccionable, vendible a Coco por 15 monedas." },
  lopez_pin: { name: "Carta de López", icon: "🎴", img: "/images/cartas/lopez_pin.webp", kind: "card", sellMin: 15, sellMax: 15,
    desc: "La carta que te dio López cuando dejaste de ser 'el nuevo'. Coleccionable, vendible a Coco por 15 monedas." },
  igor_pin: { name: "Carta de Igor", icon: "🎴", img: "/images/cartas/igor_pin.webp", kind: "card", sellMin: 15, sellMax: 15,
    desc: "La carta que te dio Igor el día que dejó de tratarte como cliente. Coleccionable, vendible a Coco por 15 monedas." },
  karla_pin: { name: "Carta de Karla", icon: "🎴", img: "/images/cartas/karla_pin.webp", kind: "card", sellMin: 15, sellMax: 15,
    desc: "La carta que te dio Karla cuando dejó de tratarte como un proyecto comercial. Coleccionable, vendible a Coco por 15 monedas." },
  beka_pin: { name: "Carta de Beka", icon: "🎴", img: "/images/cartas/beka_pin.webp", kind: "card", sellMin: 15, sellMax: 15,
    desc: "La carta que te dio Beka el día que dejasteis de fingir que solo erais rivales. Coleccionable, vendible a Coco por 15 monedas." },
  nina_pin: { name: "Carta de Nina", icon: "🎴", img: "/images/cartas/nina_pin.webp", kind: "card", sellMin: 15, sellMax: 15,
    desc: "Carta coleccionable de Nina. Vendible a Coco por 15 monedas." },
  coco_pin: { name: "Carta de Coco", icon: "🎴", img: "/images/cartas/coco_pin.webp", kind: "card", sellMin: 15, sellMax: 15,
    desc: "Carta coleccionable de Coco. Vendible a Coco por 15 monedas." },
  vera_pin: { name: "Carta de Vera", icon: "🎴", img: "/images/cartas/vera_pin.webp", kind: "card", sellMin: 15, sellMax: 15,
    desc: "Carta coleccionable de Vera. Vendible a Coco por 15 monedas." },
  alexia_pin: { name: "Carta de Alexia", icon: "🎴", img: "/images/cartas/alexia_pin.webp", kind: "card", sellMin: 15, sellMax: 15,
    desc: "Carta coleccionable de Alexia. Vendible a Coco por 15 monedas." },
  milo_pin: { name: "Carta de Milo", icon: "🎴", img: "/images/cartas/milo_pin.webp", kind: "card", sellMin: 15, sellMax: 15,
    desc: "La carta que Milo te dio el día que dejó de necesitar esconderse. Coleccionable, vendible a Coco por 15 monedas." },
  /* Objetos de ELISA_STORY (rework 3.0): kind:"keepsake" — recuerdos de campaña no
     consumibles, sin sellMin/sellMax a propósito (el guion los describe como "sin valor",
     no se venden a Coco). Distintos de sus tocayos genéricos que ya vende Coco
     (libreta_tactica/amuleto_suerte/botiquin, kind:"consumable" con +50 XP): mismo aspecto
     visual reutilizado, pero conceptualmente son objetos de historia de Elisa, no
     consumibles al azar de tienda — por eso llevan id propio en vez de reutilizar esos.
     KEEPSAKE_NPC (ver CuadroReveal) hace que su pantalla de revelado use el color de Elisa. */
  elisa_libreta: { name: "Libreta táctica de Elisa", icon: "📓", img: "/images/objects/libreta_tactica.webp", kind: "keepsake",
    desc: "Usada, con las esquinas dobladas. Faltan las siete primeras páginas." },
  elisa_taza: { name: "Taza de la oficina", icon: "☕", img: "/images/objects/tazadecafe.webp", kind: "keepsake",
    desc: "Fea, con el borde saltado. Se queda en la oficina de Elisa." },
  elisa_amuleto: { name: "Moneda de Elisa", icon: "🍀", img: "/images/objects/amuleto_suerte.webp", kind: "keepsake",
    desc: "Sin curso legal. La lleva encima desde su primera firma." },
  elisa_botiquin: { name: "Botiquín de Elisa", icon: "🩹", img: "/images/objects/botiquin.webp", kind: "keepsake",
    desc: "Lo llevaba en el bolso desde el primer día. Nunca lo había abierto." },
  yuna_bufanda: { name: "Bufanda de Yuna", icon: "🧣", img: "/images/objects/bufanda.webp", kind: "keepsake",
    desc: "«Había una de más.» No había una de más." },
  yuna_entrada: { name: "Entrada del estadio", icon: "🎫", img: "/images/objects/entradapartido.webp", kind: "keepsake",
    desc: "Su par. Se quedó la otra, dice que porque tú la habrías perdido." },
  yuna_foto: { name: "Foto con Yuna", icon: "📷", img: "/images/objects/fotos.webp", kind: "keepsake",
    desc: "Sales con cara de muerto, dice ella. La sigue guardando igual." },
  yuna_bufanda2: { name: "Segunda bufanda", icon: "🧣", img: "/images/objects/bufanda.webp", kind: "keepsake",
    desc: "Esta vez tardó cuatro minutos en elegirla. Sin excusa." },
  /* Cuadros de Vera (ver VERA_STORY): kind:"painting", no consumible ni regalable (igual
     que los pines, sin botón de acción en InventoryPanel), pero sí vendibles a Coco —
     ITEMS[id].sellMin/sellMax es lo único que gatilla el botón VENDER en CocoShop (ver
     openSell), sin necesitar ningún caso especial para "painting" en ese código. Los 7
     cuadros de campaña llevan precio fijo (sellMin===sellMax, el documento pide un precio
     exacto creciente); el cuadro genérico semanal usa el rango 100–300 que pide el
     documento, resuelto con el mismo rollSellPrice que ya usan los peces de Nina. */
  cuadro_primer_toque: { name: "Cuadro: Primer toque", icon: "🖼️", img: "/images/cuadros/Primer%20toque.webp", kind: "painting", sellMin: 100, sellMax: 100,
    desc: "El primer cuadro de Vera desde que empezó a observarte. El día en el que decidiste dar el primer paso." },
  cuadro_no_parar: { name: "Cuadro: No parar", icon: "🖼️", img: "/images/cuadros/No%20parar.webp", kind: "painting", sellMin: 150, sellMax: 150,
    desc: "La parte aburrida de la constancia, la que nadie aplaude. Vera dice que ahí estaba el cuadro de verdad." },
  cuadro_despues_del_esfuerzo: { name: "Cuadro: Después del esfuerzo", icon: "🖼️", img: "/images/cuadros/Despues%20del%20esfuerzo.webp", kind: "painting", sellMin: 200, sellMax: 200,
    desc: "Lo que pasa cuando termina el esfuerzo. Vera quería pintar la otra mitad de la historia que nadie pinta." },
  cuadro_donde_el_ruido_termina: { name: "Cuadro: Donde el ruido termina", icon: "🖼️", img: "/images/cuadros/Donde%20el%20ruido%20termina.webp", kind: "painting", sellMin: 250, sellMax: 250,
    desc: "El segundo en el que el ruido de todo lo demás desaparece. El mar, y nada más que el mar." },
  cuadro_una_noche_mas: { name: "Cuadro: Una noche más", icon: "🖼️", img: "/images/cuadros/Una%20noche%20mas.webp", kind: "painting", sellMin: 300, sellMax: 300,
    desc: "Una noche sin ninguna consecuencia, que mañana ya sería solo un recuerdo. Vera dice que no necesitaba que ganaras nada para pintarla." },
  cuadro_la_gente_que_pasa: { name: "Cuadro: La gente que pasa", icon: "🖼️", img: "/images/cuadros/La%20gente%20que%20pasa.webp", kind: "painting", sellMin: 350, sellMax: 350,
    desc: "Pequeños momentos de la gente de la ciudad, ninguno importante por sí solo. Vera dice que solo tenían que ser reales." },
  cuadro_lo_que_queda: { name: "Cuadro: Lo que queda", icon: "🖼️", img: "/images/cuadros/Lo%20que%20queda.webp", kind: "painting", sellMin: 400, sellMax: 400,
    desc: "La síntesis de todo lo que Vera estuvo observando: el principio, la constancia, el descanso, la gente. Todo junto por fin." },
  cuadro_generico: { name: "Cuadro de Vera", icon: "🖼️", img: "/images/cuadros/cuadro%20generico.webp", kind: "painting", sellMin: 100, sellMax: 300,
    desc: "Uno más de los cuadros que Vera sigue pintando cada semana desde que terminasteis su campaña. Nunca sabes cuál va a traer." },
  /* capturas de Nina: objetos normales del inventario (kind:"fish"), sin sistema aparte —
     ver FishingSequence y FISH_RARITY para cómo se muestran en la pantalla de captura.
     sellMin/sellMax: precio al que Coco los compra (ver sellPriceFor/COCO_STORY) — son
     los únicos objetos vendibles por ahora, tal como especifica el documento de Coco. */
  pez_sardina: { name: "Sardina", icon: "🐟", img: "/images/peces/sardina.webp", kind: "fish", rarity: "comun", sellMin: 8, sellMax: 12,
    desc: "Tu primera captura. No parece gran cosa, pero todo el mundo empieza por algo pequeño." },
  pez_caballa: { name: "Caballa", icon: "🐟", img: "/images/peces/caballa.webp", kind: "fish", rarity: "comun", sellMin: 10, sellMax: 15,
    desc: "El primer paso para dejar de ser completamente nuevo en esto." },
  pez_lubina: { name: "Lubina", icon: "🐟", img: "/images/peces/lubina.webp", kind: "fish", rarity: "poco_comun", sellMin: 15, sellMax: 20,
    desc: "Ya tiene otra pinta. Empiezas a tener mano." },
  pez_dorada: { name: "Dorada", icon: "🐟", img: "/images/peces/dorada.webp", kind: "fish", rarity: "poco_comun", sellMin: 18, sellMax: 25,
    desc: "Esta sí que merece una buena comida." },
  pez_trucha: { name: "Trucha", icon: "🐟", img: "/images/peces/trucha.webp", kind: "fish", rarity: "raro", sellMin: 25, sellMax: 35,
    desc: "No la forzaste. Eso es más importante de lo que parece." },
  pez_atun: { name: "Atún", icon: "🐟", img: "/images/peces/atun.webp", kind: "fish", rarity: "raro", sellMin: 40, sellMax: 60,
    desc: "¿Eso estaba ahí abajo? El primer gran salto de tamaño." },
  pez_espada: { name: "Pez espada", icon: "🐟", img: "/images/peces/pezespada.webp", kind: "fish", rarity: "epico", sellMin: 70, sellMax: 100,
    desc: "Ya nadie puede llamarte principiante después de esto." },
  pez_tiburon: { name: "Tiburón", icon: "🦈", img: "/images/peces/tiburon.webp", kind: "fish", rarity: "legendario", sellMin: 100, sellMax: 150,
    desc: "Cinco años de vida perdidos. Ha valido la pena." },
  pez_luna: { name: "Pez luna", icon: "🐡", img: "/images/peces/pezluna.webp", kind: "fish", rarity: "legendario", sellMin: 200, sellMax: 300,
    desc: "El pez que Nina nunca olvidó. Lo habéis conseguido juntos." },
  cangrejo: { name: "Cangrejo", icon: "🦀", img: "/images/peces/cangrejo.webp", kind: "fish", rarity: "especial", sellMin: 15, sellMax: 25,
    desc: "Técnicamente no es un pez. Pero ha mordido el anzuelo, así que cuenta como captura." },
  /* Cassettes de Alexia (ver ALEXIA_STORY y activateCassette/applyDayClose más abajo):
     kind:"cassette", no consumibles ni vendibles (a diferencia de los cuadros de Vera, el
     documento es explícito: "no son recuerdos vendibles, son objetos funcionales" — por
     eso no llevan sellMin/sellMax). boostStat/boostMult/boostDays son los datos que lee
     activateCassette() para montar game.activeBoost; "ALL" en boostStat activa los seis
     stats a la vez (solo ALL IN). Los 7 ya tienen ilustración propia (optimizada a webp
     800×800, mismo criterio que el resto de objetos). */
  cassette_full_speed: { name: "Cassette: FULL SPEED", icon: "📼", img: "/images/objects/cassette_full_speed.webp", kind: "cassette", boostStat: "FIS", boostMult: 1.5, boostDays: 4,
    desc: "Para cuando necesitas dejar de darle vueltas y empezar a moverte. +50% XP FIS durante 4 días." },
  cassette_power_beat: { name: "Cassette: POWER BEAT", icon: "📼", img: "/images/objects/cassette_power_beat.webp", kind: "cassette", boostStat: "FUE", boostMult: 1.5, boostDays: 4,
    desc: "Base pesada, de las que hacen que hasta preparar la mochila parezca importante. +50% XP FUE durante 4 días." },
  cassette_lock_in: { name: "Cassette: LOCK IN", icon: "📼", img: "/images/objects/cassette_lock_in.webp", kind: "cassette", boostStat: "RES", boostMult: 1.5, boostDays: 4,
    desc: "Menos ruido, menos distracciones. +50% XP RES durante 4 días." },
  cassette_good_energy: { name: "Cassette: GOOD ENERGY", icon: "📼", img: "/images/objects/cassette_good_energy.webp", kind: "cassette", boostStat: "NUT", boostMult: 1.5, boostDays: 4,
    desc: "Para los días en los que quieres sentirte con energía de verdad. +50% XP NUT durante 4 días." },
  cassette_slow_down: { name: "Cassette: SLOW DOWN", icon: "📼", img: "/images/objects/cassette_slow_down.webp", kind: "cassette", boostStat: "REC", boostMult: 1.5, boostDays: 4,
    desc: "No todo tiene que servir para acelerar. +50% XP REC durante 4 días." },
  cassette_clear_mind: { name: "Cassette: CLEAR MIND", icon: "📼", img: "/images/objects/cassette_clear_mind.webp", kind: "cassette", boostStat: "MEN", boostMult: 1.5, boostDays: 4,
    desc: "No intenta hacerte feliz a la fuerza. Solo limpia un poco el ruido. +50% XP MEN durante 4 días." },
  cassette_all_in: { name: "Cassette: ALL IN", icon: "📼", img: "/images/objects/cassette_all_in.webp", kind: "cassette", boostStat: "ALL", boostMult: 1.5, boostDays: 4,
    desc: "No es más rápido, ni más fuerte, ni más relajado. Es todo a la vez. +50% XP a todos los stats durante 4 días. Recompensa única de historia: nunca vuelve a aparecer en el modo infinito." },
};
/* pool del modo infinito de Alexia (ver refreshAlexiaVisit): los 6 cassettes de stat,
   nunca ALL IN — construido a partir de los ITEMS reales, no de una lista aparte. */
const ALEXIA_CASSETTE_POOL = Object.keys(ITEMS).filter((id) => ITEMS[id].kind === "cassette" && id !== "cassette_all_in");
/* pool del sobre diario del Casino (ver ITEMS kind:"card" y SobreReveal/openSobre más
   abajo): construido a partir de los ITEMS reales existentes, tal como pide el documento
   ("no inventar nombres de cartas que no existan") — nunca una lista aparte que pueda
   desincronizarse de qué cartas existen de verdad. */
const CARD_POOL = Object.keys(ITEMS).filter((id) => ITEMS[id].kind === "card");
/* una carta puede haberse "descubierto" por historia (el flag XPinEarned que ya ponen las
   campañas con pin/carta de cierre) o por sobre (game.cardsDiscovered, ver openSobre) —
   se comprueban ambas fuentes sin tener que tocar ninguna historia existente. */
const CARD_STORY_FLAG = {
  elisa_pin: "elisaPinEarned", milly_pin: "millyPinEarned", yuna_pin: "yunaPinEarned",
  lopez_pin: "lopezPinEarned", igor_pin: "igorPinEarned", karla_pin: "karlaPinEarned", beka_pin: "bekaPinEarned",
  milo_pin: "miloPinEarned",
};
const isCardDiscovered = (g, cardId) =>
  !!(CARD_STORY_FLAG[cardId] && g[CARD_STORY_FLAG[cardId]]) || !!(g.cardsDiscovered && g.cardsDiscovered[cardId]);
/* metadatos de rareza para la pantalla de captura de Nina (ver FishingSequence): etiqueta
   visible y color del brillo/borde, de menos a más espectacular. */
const FISH_RARITY = {
  comun: { label: "Común", color: "#B9BCA8" },
  poco_comun: { label: "Poco común", color: "#3F8F2B" },
  raro: { label: "Raro", color: "#2E6ED6" },
  epico: { label: "Épico", color: "#9C6BD6" },
  legendario: { label: "Legendario", color: "#E0A526" },
  especial: { label: "Especial", color: "#D65A2E" },
};
/* pesca libre (sección 8 del documento de Nina, disponible tras completar su campaña):
   frecuencias relativas, no probabilidades exactas — solo determinan qué tan a menudo
   sale cada pez en la tirada diaria. Las capturas de la campaña narrativa NUNCA usan
   esto: son siempre deterministas (ver stage.fish en NINA_STORY). */
const FREE_FISH_WEIGHTS = { pez_sardina: 30, pez_caballa: 22, pez_lubina: 15, pez_dorada: 12,
  pez_trucha: 10, pez_atun: 6, pez_espada: 3, pez_tiburon: 1, pez_luna: 1, cangrejo: 2 };
const pickWeightedFish = () => {
  const total = Object.values(FREE_FISH_WEIGHTS).reduce((a, w) => a + w, 0);
  let roll = Math.random() * total;
  for (const [id, w] of Object.entries(FREE_FISH_WEIGHTS)) { if (roll < w) return id; roll -= w; }
  return "pez_sardina";
};
/* dar un objeto a su destinatario: reacción propia del personaje + el objeto se gasta */
const ITEM_GIVE_REACTIONS = {
  lisa: { npc: "lisa", text: "Vaya... tienes buen gusto para los detalles, para ser sincera. No esperaba esto de ti. Gracias, de verdad." },
};

/* --- CARTAS DE PERSONAJE · galería sin efecto de juego: retrato + bio corta.
   Se desbloquean solas al conocer a cada uno (mismos flags que ya existen). --- */
/* ya no hace falta un campo "variants": ahora todas las poses de un personaje (incluidas
   las que antes eran variantes por zona) viven directamente en su propio NPCS[x].arts,
   así que la carta las recoge solas (ver CardDetail) */
const CARDS = [
  { npc: "elisa", unlocked: () => true,
    bio: "Mánager y entrenadora. Dura en el despacho, blanda cuando cree que nadie mira. Siempre tiene un plan, aunque no siempre lo comparta." },
  { npc: "yuna", unlocked: (g) => !!g.yunaMet,
    bio: "Superfan del Barça con fama de tsundere. Sabe tus estadísticas mejor que tú, aunque jure que 'solo pasaba por aquí'." },
  { npc: "lopez", unlocked: () => true,
    bio: "Capitán del vestuario. El brazalete le queda grande a cualquiera, pero a él le queda perfecto." },
  { npc: "milly", unlocked: (g) => !!g.metMilly,
    bio: "Del Kiosco. Te trae el periódico en persona cada día, con más cotilleos de los que pediste." },
  { npc: "lisa", unlocked: (g) => !!g.metLisa,
    bio: "Futbolista profesional, gestiona patrocinios. Engreída de cara al público, exigente de puertas para adentro." },
  { npc: "igor", unlocked: (g) => !!g.metIgor, bio: "Chef estrella del Restaurante. Trata la nutrición como táctica de fútbol, con datos curiosos siempre a mano." },
  { npc: "beka", unlocked: (g) => !!g.bekaMet,
    bio: "Futbolista de otro club. Rival directa, competitiva y algo macarra — aunque de noche, en la Discoteca, deja de competir durante unas horas." },
  { npc: "nina", unlocked: (g) => !!g.ninaMet,
    bio: "La pescadora de la Playa. Nunca tiene prisa — y poco a poco te enseña que tampoco hace falta tenerla siempre." },
  { npc: "coco", unlocked: (g) => !!g.cocoMet,
    bio: "La tendera del Centro Comercial. Pija, coqueta y muy buena negociante — atiende un día sí y otro no, y siempre compra lo que ya no quieres." },
  { npc: "vera", unlocked: (g) => !!g.veraMet,
    bio: "Artista observadora, algo despistada. Busca inspiración en tu rutina y termina pintando momentos que merece la pena recordar." },
  { npc: "alexia", unlocked: (g) => !!g.alexiaMet,
    bio: "Relajada, segura y muy ligada a la música. Convierte distintos estados mentales en cassettes que dan un empujón temporal a tu entrenamiento." },
  { npc: "milo", unlocked: (g) => !!g.miloMet,
    bio: "Una criatura que vive escondida tras una roca del Parque. Le cuesta confiar, pero poco a poco deja de necesitar esconderse." },
];

/* --- EL PERIÓDICO · plantillas con titular y cuerpo, por secciones.
   Mínimo ~20 por sección para que la edición diaria no se repita enseguida. --- */
const NEWS = [
  /* ---- PORTADA ---- */
  { sec: "PORTADA", w: "hot", h: "{player}, el nombre de la temporada", b: "Con {streak} días de trabajo impecable a sus espaldas, el {position} del {club} atraviesa el mejor momento de su joven carrera. En la ciudad deportiva ya no se habla de otra cosa: la pregunta no es si dará el salto, sino cuándo." },
  { sec: "PORTADA", w: "good", h: "El {club} se encomienda a su {position}", b: "La media de {ovr} de {player} empieza a pesar en cada alineación. El cuerpo técnico lo sabe, el vestuario lo sabe y la grada lo corea: el futuro pasa por sus botas." },
  { sec: "PORTADA", w: "derbiSoon", h: "Semana de PARTIDAZO en {league}", b: "El {club} se mide al {derbiRival} y la ciudad ya huele a día grande. Entradas volando, peñas organizando la previa y un {player} que llega afinado al partido que nadie quiere perderse." },
  { sec: "PORTADA", w: "seasonStart", h: "Arranca la temporada {season}", b: "Nueva campaña en {league} y las quinielas ya circulan. En el {club} evitan hablar de objetivos, pero la plantilla llega con hambre y {player} apunta a pieza clave." },
  { sec: "PORTADA", w: "bad", h: "¿Qué le pasa a {player}?", b: "El bajón de las últimas sesiones no ha pasado desapercibido. En el club piden calma y recuerdan que las temporadas son largas, pero la afición contiene la respiración." },
  { sec: "PORTADA", h: "La regularidad, la otra estrella del {club}", b: "Sin hacer ruido, el {club} ha construido su temporada sobre el trabajo diario de jugadores como {player}. La prensa nacional empieza a fijarse en el fenómeno." },
  { sec: "PORTADA", w: "scorer", h: "{player} ya es más que una promesa", b: "Con {goals} goles en lo que va de curso, el {position} del {club} ha dejado de ser 'el joven con proyección' para convertirse en argumento de vestuario. Los números empiezan a hablar más alto que las expectativas." },
  { sec: "PORTADA", w: "win", h: "El {club} encadena su mejor racha en años", b: "Tres puntos más, {streak} días de trabajo detrás. En la ciudad deportiva nadie se atreve a hablar de objetivos en voz alta, pero las cuentas ya se hacen en los bares de siempre." },
  { sec: "PORTADA", w: "loss", h: "El {club} encaja un golpe en {league}", b: "La derrota deja tocada, que no hundida, a una plantilla que sigue confiando en su proceso. 'Se analiza, se corrige y se sigue', repiten desde el banquillo con la boca pequeña." },
  { sec: "PORTADA", w: "seasonEnd", h: "Recta final: el {club} se juega la temporada", b: "Quedan las jornadas que cuentan doble. {player} y compañía afrontan el tramo decisivo con {goals} goles en la mochila y la sensación de que aún queda historia por escribir." },
  { sec: "PORTADA", w: "starter", h: "{player} ya no se mueve del once", b: "Lo que empezó como una apuesta del cuerpo técnico se ha convertido en costumbre: el {position} encadena titularidades y el vestuario ya cuenta con él para lo importante." },
  { sec: "PORTADA", w: "kgUp", h: "El cambio físico que nadie esperaba tan rápido", b: "{player} ha ganado {kg} kg desde su llegada al {club}, y se nota en el campo. El preparador físico, parco en elogios, se permitió esta semana un 'vamos por buen camino'." },
  { sec: "PORTADA", h: "Radiografía de un vestuario que crece", b: "El {club} no solo suma puntos: suma identidad. Jugadores como {player} explican por qué esta plantilla se siente distinta a las de otros años, aunque nadie sepa explicar del todo por qué." },
  { sec: "PORTADA", h: "{league}, la categoría que nadie mira y todos deberían", b: "Fútbol de verdad, sin cámaras ni focos: esfuerzo, cabezazos, camisetas empapadas y una afición que se deja la voz por menos dinero del que cuesta una entrada de primera división." },
  { sec: "PORTADA", w: "hasGoals", h: "El gol como costumbre", b: "{player} lleva {goals} dianas esta temporada y ya no sorprende a nadie en el vestuario cuando marca. Lo raro, dicen, sería lo contrario." },
  { sec: "PORTADA", h: "El {club}, entre la ilusión y la cautela", b: "La directiva pide prudencia, la afición pide sueños y en medio de ambas cosas entrena una plantilla que solo quiere que le dejen jugar al fútbol." },
  { sec: "PORTADA", w: "benched", h: "Rotaciones: el debate que no cesa", b: "La suplencia de {player} ha reabierto la eterna discusión de bar: ¿rotar para llegar frescos o alinear siempre a los mejores? En el {club}, cada jornada trae una respuesta distinta." },
  { sec: "PORTADA", h: "Historias de cantera: el caso {club}", b: "Sin grandes presupuestos ni fichajes rimbombantes, el {club} sigue demostrando que el trabajo de base también gana partidos. {player} es, hoy, su ejemplo más visible." },
  { sec: "PORTADA", w: "good", h: "Los números no mienten", b: "Media de {ovr} y una progresión que ya analizan hasta los rivales. En el {club} prefieren no hablar de techos: 'aquí el límite se pone cada semana, no antes'." },
  { sec: "PORTADA", h: "Un domingo cualquiera en {league}", b: "Bufandas, bocadillos de calamares y un marcador que decide bares enteros. Nada ha cambiado en {league} en cincuenta años, y ojalá no cambie nunca." },
  { sec: "PORTADA", w: "derbiSoon", h: "La ciudad se para por el {derbiRival}", b: "Comercios con la bufanda en el escaparate, discusiones de barbería y una grada que llevaba semanas esperando esta fecha. El derbi ante el {derbiRival} ya se juega antes de empezar." },
  /* ---- RUMORES ---- */
  { sec: "RUMORES", w: "good", h: "Ojeadores en la grada", b: "Al menos dos clubes de categoría superior habrían pedido informes sobre {player} en las últimas jornadas. En el {club} se hacen los sordos, pero el mercado nunca duerme." },
  { sec: "RUMORES", w: "hot", h: "¿Cláusula al alza?", b: "El entorno de {player} guarda silencio, pero su valor no: la progresión del {position} obligaría al {club} a replantearse su ficha antes de lo previsto." },
  { sec: "RUMORES", h: "La paella de la directiva 'va muy en serio'", b: "Fuentes del vestuario aseguran que la paella prometida si el equipo acaba arriba está garantizada. El utillero ya habría preguntado por el tamaño del recipiente." },
  { sec: "RUMORES", h: "Un grande de {league} estudia el modelo del {club}", b: "El trabajo silencioso de la preparación física del {club} empieza a tener imitadores. 'Que copien, nosotros seguimos', responden desde el club." },
  { sec: "RUMORES", w: "good", h: "Suena el teléfono en el {club}", b: "Nadie confirma nada, pero tampoco lo desmiente nadie: en el entorno de {player} aseguran que 'ha habido contactos exploratorios'. Frase que en este mundo significa exactamente lo que uno quiera que signifique." },
  { sec: "RUMORES", h: "El bulo de la semana", b: "Corría el rumor de que el {club} ficharía a un delantero internacional retirado. Resultó ser un señor con la misma cara que salió a pasear a su perro por la ciudad deportiva. Desmentido oficial y carcajada general." },
  { sec: "RUMORES", w: "hot", h: "Un agente 'muy conocido' se ha interesado", b: "Así, sin nombres ni pruebas, corre por los bares cercanos al estadio. La fuente: 'me lo dijo un primo que trabaja cerca de eso'. El nivel de fiabilidad, el de siempre." },
  { sec: "RUMORES", h: "¿Vuelve el filial a jugar en el campo grande?", b: "Rumor recurrente cada pretemporada que nunca se confirma ni se descarta del todo. La directiva, fiel a su estilo, 'lo está estudiando' desde hace tres años." },
  { sec: "RUMORES", h: "El misterio del banquillo VIP", b: "Nadie sabe quién se sienta cada domingo en el asiento reservado sin nombre de la grada de preferencia. Las teorías van desde un exjugador legendario hasta el cuñado del presidente." },
  { sec: "RUMORES", w: "scorer", h: "{player}, en el radar (según fuentes sin verificar)", b: "Un canal de estadísticas con más seguidores que rigor asegura que {player} 'podría interesar' a media docena de clubes. La lista, sospechosamente, incluye a todos los que juegan bonito en la tele." },
  { sec: "RUMORES", h: "El presidente 'lo negó todo antes de que se lo preguntaran'", b: "En rueda de prensa, y sin que nadie mencionara ningún fichaje, el máximo mandatario del {club} quiso 'dejar clara' la postura del club. Los periodistas se miraron sin entender del todo la pregunta que respondía." },
  { sec: "RUMORES", h: "Se busca patrocinador para la manga de la camiseta", b: "El club abre conversaciones con varias empresas locales. La panadería de la esquina ya ha mostrado 'interés serio', aunque el presupuesto no da ni para el cuello." },
  { sec: "RUMORES", w: "good", h: "'Precio de salida' ya tiene numerito", b: "Sin oferta formal sobre la mesa, en los mentideros del club ya se atreven a poner cifra al valor de {player}. Cifra que, cómo no, cambia según quién la cuente." },
  { sec: "RUMORES", h: "El rumor del cambio de escudo", b: "Cada cierto tiempo resurge la leyenda urbana de que el club 'estudia' modernizar el escudo. La afición ya ha organizado, preventivamente, la protesta." },
  { sec: "RUMORES", h: "¿Habrá pretemporada en el extranjero?", b: "Se habla de una gira que suena más a excusa para un viaje de la directiva que a plan deportivo real. Nadie lo confirma. Nadie lo desmiente. Todos quieren ir." },
  { sec: "RUMORES", w: "derbiSoon", h: "Entradas del derbi 'agotadas en horas' (según el bar de siempre)", b: "La fuente es informal pero fiable: si el bar de la esquina dice que no quedan entradas, no quedan entradas. Nadie ha comprobado en taquilla, tampoco hace falta." },
  { sec: "RUMORES", h: "El fichaje fantasma de cada verano", b: "Un central con nombre que nadie recuerda 'está a punto de firmar' desde hace tres mercados seguidos. Empieza a formar parte del folclore del club más que del mercado." },
  { sec: "RUMORES", w: "kgUp", h: "'Cambio físico que llama la atención'", b: "En el gimnasio de enfrente al estadio comentan que la evolución de {player} 'ya se nota hasta desde fuera'. Fuente: el dueño del gimnasio, que también vende suplementos, así que ojo." },
  { sec: "RUMORES", h: "La cláusula que nadie ha visto pero todos citan", b: "Se habla de una cláusula de rescisión 'blindada' sin que exista documento público que la confirme. En el fútbol de base, los rumores también tienen su propio reglamento no escrito." },
  { sec: "RUMORES", w: "seasonEnd", h: "Movimientos de verano, antes de que acabe la liga", b: "Con la temporada aún viva, ya circulan nombres para reforzar la plantilla del próximo año. La directiva pide centrarse en lo de ahora. Nadie le hace mucho caso." },
  /* ---- VESTUARIO ---- */
  { sec: "VESTUARIO", w: "win", h: "La playlist de la victoria", b: "Tras el último triunfo, el vestuario del {club} sonó a reggaeton clásico durante cuarenta minutos. Los vecinos no han presentado quejas: 'se les oía felices'." },
  { sec: "VESTUARIO", w: "loss", h: "Silencio y doble sesión", b: "Tras la última derrota, el vestuario del {club} eligió la vía clásica: poca palabra y trabajo extra. 'Aquí no se esconde nadie', se escuchó desde dentro." },
  { sec: "VESTUARIO", h: "La lavadora 'La Bestia' cumple años", b: "El electrodoméstico más querido de la ciudad deportiva suma otro año de servicio. El utillero prepara una celebración 'íntima, solo para ropa de confianza'." },
  { sec: "VESTUARIO", h: "El arroz de los martes, patrimonio del club", b: "El táper más famoso del vestuario ya tiene fama en toda la categoría. Rivales han llegado a pedir la receta tras los partidos. La respuesta: 'secreto de vestuario'." },
  { sec: "VESTUARIO", h: "Multa del mes: el ranking", b: "La caja de multas del vestuario cierra el mes con el listado de siempre: móviles en el vestuario, llegar tarde al bus y, una vez más, alguien cantando en la ducha sin permiso del público." },
  { sec: "VESTUARIO", w: "starter", h: "El once de cada semana, decidido en el rondo", b: "El cuerpo técnico lo niega, pero en el vestuario todos coinciden: quien gana el rondo de los jueves 'tiene más papeletas' para el domingo. La superstición manda más que la pizarra." },
  { sec: "VESTUARIO", h: "Cumpleaños en la ciudad deportiva", b: "Tarta compartida, felicitación colectiva desafinada y la broma de siempre sobre la edad del homenajeado. El vestuario del {club} no se pierde ni una fecha señalada." },
  { sec: "VESTUARIO", w: "win", h: "La foto de la victoria, ya es tradición", b: "Después de cada triunfo, el mismo ritual: foto de grupo en el túnel de vestuarios, siempre con el mismo que sale con los ojos cerrados. Nadie se atreve a repetirla." },
  { sec: "VESTUARIO", h: "El botiquín, el sitio más visitado del club", b: "Entre esguinces leves, contracturas de despacho y algún que otro drama exagerado, el fisio del {club} se ha convertido en el segundo entrenador no oficial de la plantilla." },
  { sec: "VESTUARIO", h: "Guerra fría por el aire acondicionado", b: "Un sector del vestuario lo quiere a tope, otro jura que así 'se cogen todas las lesiones'. El termostato de la sala de masajes es, a día de hoy, el objeto más disputado del club." },
  { sec: "VESTUARIO", w: "loss", h: "Autocrítica en petit comité", b: "Sin cámaras ni micrófonos, el grupo se reunió tras la derrota para hablar claro entre ellos. Lo que se dijo, se queda dentro. Lo que se prometió, se verá el domingo." },
  { sec: "VESTUARIO", h: "El escondite de las chuches del utillero", b: "Cambia de sitio cada semana y aun así el vestuario entero sabe siempre dónde está. El utillero jura que 'esta vez no lo encontrará nadie'. Ya van doce 'esta vez'." },
  { sec: "VESTUARIO", h: "La lista de reproducción, motivo de guerra civil", b: "El altavoz del vestuario ha vuelto a cambiar de manos. Reguetón contra rock de toda la vida, otra vez. El árbitro de la disputa, como siempre, el capitán." },
  { sec: "VESTUARIO", w: "starter", h: "El taquillero, ese oficio no reconocido", b: "Cada titular tiene su ritual de taquilla: unos la dejan impecable, otros la convierten en zona catastrófica. {player} pertenece, según fuentes internas, al segundo grupo." },
  { sec: "VESTUARIO", h: "Se recauda para el regalo del fisio", b: "El vestuario organiza una colecta discreta por su próximo cumpleaños. La propuesta ganadora, de momento: un sillón nuevo 'que no cruja cada vez que se sienta'." },
  { sec: "VESTUARIO", w: "benched", h: "El banquillo, también tiene su propio código", b: "Los suplentes del {club} han desarrollado su liturgia particular: aplausos sincronizados, comentarios técnicos en voz baja y una solidaridad que solo se entiende desde dentro." },
  { sec: "VESTUARIO", h: "Anécdota del bus: capítulo enésimo", b: "El viaje de vuelta a casa siempre deja alguna escena para el recuerdo. Esta semana, protagonizada por un GPS que insistió media hora en mandarles por un camino de tierra." },
  { sec: "VESTUARIO", h: "El vestuario estrena mascota no oficial", b: "Un gato ha decidido instalarse en la puerta de la ciudad deportiva y ya tiene nombre, comida reservada y una discusión abierta sobre si puede o no entrar a la sala de masajes." },
  { sec: "VESTUARIO", w: "hot", h: "El vestuario ya tiene MVP no oficial de la racha", b: "Sin encuesta ni votación formal, el grupo ha decidido entre risas que {player} es 'el jugador del momento'. El premio, de momento, es solo la coña continua." },
  { sec: "VESTUARIO", h: "Charla táctica con final inesperado", b: "La pizarra del entrenador terminó con más flechas de las necesarias y una broma final que rebajó la tensión antes del partido. El vestuario lo agradeció más que la propia táctica." },
  /* ---- LA LIGA ---- */
  { sec: "LA LIGA", w: "hasGoals", h: "{player}, en la pelea por el pichichi", b: "Con {goals} tantos, el {position} del {club} se cuela entre los nombres propios de la categoría. Los defensas rivales ya le dedican marcajes especiales." },
  { sec: "LA LIGA", h: "El calendario no da tregua", b: "Jornada tras jornada, {league} sigue apretando la tabla. Los técnicos coinciden: 'esto lo decidirán los detalles y las plantillas que mejor se cuiden'." },
  { sec: "LA LIGA", h: "Los porteros piden piedad", b: "Tres goleadas en la última jornada han reabierto el debate: ¿es {league} la liga más ofensiva del país? Los guardametas reclaman 'un poco de compasión' para el fin de semana." },
  { sec: "LA LIGA", h: "La tabla, más apretada que nunca", b: "A falta de varias jornadas, seis equipos se reparten los puestos de arriba por apenas cuatro puntos. Los estadísticos de la categoría ya no se fían de sus propias proyecciones." },
  { sec: "LA LIGA", w: "derbiSoon", h: "El derbi que paraliza {league}", b: "Cada temporada el calendario regala esta fecha marcada en rojo. Aficiones enteras organizan su semana alrededor de noventa minutos que, para ellos, valen por toda la liga." },
  { sec: "LA LIGA", h: "Los árbitros, protagonistas involuntarios", b: "Tres polémicas arbitrales en la última jornada reabren el eterno debate de bar: ¿hace falta VAR en {league}? La respuesta oficial: 'se está estudiando'. La respuesta del bar: ya se sabe." },
  { sec: "LA LIGA", h: "El farolillo rojo también tiene su historia", b: "El colista de {league} suma ya varias jornadas sin ganar, pero se resiste a tirar la toalla. 'Aquí nadie regala nada, ni las derrotas', aseguran desde su vestuario." },
  { sec: "LA LIGA", w: "seasonStart", h: "Así se presenta {league} esta temporada", b: "Nuevos fichajes, algún que otro proyecto ambicioso y el runrún de siempre sobre quién puede dar la sorpresa. La categoría empieza con más incógnitas que certezas." },
  { sec: "LA LIGA", h: "El campo que todos temen visitar", b: "Un césped irregular, una grada que aprieta desde el primer minuto y un ambiente que se nota nada más bajar del autobús. Pocos equipos salen de allí con los tres puntos." },
  { sec: "LA LIGA", h: "Estadística curiosa de la jornada", b: "Ningún equipo de {league} ha ganado todavía a domicilio en sábado por la tarde esta temporada. Los aficionados a la numerología ya tienen tema para toda la semana." },
  { sec: "LA LIGA", w: "hasGoals", h: "La lucha por la bota de la categoría, más viva que nunca", b: "{player} se mantiene entre los máximos goleadores de {league} con {goals} tantos, en una pelea que promete apretarse hasta la última jornada." },
  { sec: "LA LIGA", h: "El misterio de los horarios", b: "Nadie entiende cómo se deciden los horarios de {league} esta temporada, ni siquiera los propios clubes. La federación, preguntada al respecto, remite a un comunicado que tampoco lo explica." },
  { sec: "LA LIGA", h: "Fútbol de barrio, pasión de verdad", b: "Sin grandes contratos televisivos ni focos mediáticos, {league} sigue llenando gradas con algo que en categorías superiores empieza a escasear: cercanía." },
  { sec: "LA LIGA", h: "El sorteo de la próxima jornada, ya da que hablar", b: "El calendario ha vuelto a juntar a dos rivales históricos en la misma semana. Las quinielas de bar ya tienen ganador antes incluso de saber las alineaciones." },
  { sec: "LA LIGA", h: "Los banquillos también compiten", b: "La guerra de gestos, protestas y carreritas por la banda entre los técnicos de {league} da, esta semana, casi tanto que hablar como lo que pasa dentro del campo." },
  { sec: "LA LIGA", w: "good", h: "{club}, de sorpresa a candidato", b: "Nadie lo tenía en las quinielas al empezar la temporada y ahora nadie se atreve a descartarlo. El {club} se ha ganado, jornada a jornada, el respeto de {league}." },
  { sec: "LA LIGA", h: "El ruido de fondo de cada domingo", b: "Bocadillos de calamares, bufandas heredadas y una megafonía que se corta a mitad de himno. {league} no cambia, y en el fondo, eso es lo mejor que tiene." },
  { sec: "LA LIGA", h: "La grada visitante, ese personaje aparte", b: "Pocos kilómetros de viaje, mucho ruido y una fidelidad que no entiende de resultados. Cada estadio de {league} tiene su rincón reservado para los que vienen de fuera." },
  { sec: "LA LIGA", h: "El VAR llega (o no) a las categorías regionales", b: "El eterno debate vuelve con cada polémica: ¿tiene sentido implantarlo aquí? Mientras se decide, los árbitros de {league} siguen jugándosela a ojo, como toda la vida." },
  { sec: "LA LIGA", w: "loss", h: "Jornada negra para los favoritos", b: "Varios de los aspirantes al ascenso pinchan en la misma semana, {club} incluido. La tabla de {league} se revuelve un poco más y da esperanzas a los de abajo." },
  /* ---- HUMOR (La Contra) ---- */
  { sec: "HUMOR", h: "El VAR del bar", b: "El videoarbitraje oficial del Bar Manolo dictaminó ayer que 'aquello era penalti en 1997 y lo sigue siendo hoy'. La sentencia es inapelable y va acompañada de bravas." },
  { sec: "HUMOR", h: "Horóscopo deportivo", b: "Los astros predicen para hoy: entrenamiento fuerte, alguna agujeta traicionera y un rondo en el que alguien hará el ridículo. Los astros nunca fallan." },
  { sec: "HUMOR", h: "Se busca", b: "Balón visto por última vez en la grada norte tras un despeje del central rival. Responde al nombre de 'Pelota'. Se ruega devolución: es el bueno, el de los partidos." },
  { sec: "HUMOR", h: "Encuesta exprés", b: "El 94% de los aficionados encuestados asegura que 'este año sí'. El 6% restante es del equipo rival y también dice que este año sí. Alguien se equivoca." },
  { sec: "HUMOR", h: "Meteorología aplicada", b: "Previsión para el fin de semana: lluvia de ocasiones, rachas de contraataque y un 90% de probabilidad de que el míster diga 'partido trampa'." },
  { sec: "HUMOR", h: "Cartas al director", b: "'Llevo diez años pidiendo que pongan un banco más en la grada de fondo. Firmado: un aficionado con las rodillas cansadas.' El club responde que 'lo está estudiando', como todo." },
  { sec: "HUMOR", h: "Anuncios clasificados", b: "SE VENDE bufanda del año del ascenso, poco usada por superstición. SE BUSCA compañero de grada que no grite instrucciones tácticas peores que las del entrenador." },
  { sec: "HUMOR", h: "Consultorio sentimental deportivo", b: "'Doctora, mi pareja me ha dejado plantado dos domingos por ir al fútbol.' Respuesta: 'Dígale que el fútbol, al menos, siempre vuelve a las cinco.'" },
  { sec: "HUMOR", h: "Estadística inútil de la semana", b: "El bocadillo de calamares se vende un 12% más rápido cuando el equipo va perdiendo al descanso. La ciencia del consuelo, confirmada una vez más." },
  { sec: "HUMOR", h: "Frase de la jornada (mal citada)", b: "'El fútbol es así', dijo alguien, en algún momento, sobre algo. Nadie recuerda quién, cuándo ni por qué, pero la frase sigue funcionando para absolutamente todo." },
  { sec: "HUMOR", h: "El tiempo en el campo de al lado", b: "Previsión para el partido de los benjamines de las diez: frío intenso, algún padre gritando más que los niños y un 100% de probabilidad de que alguien llore, y no será por el resultado." },
  { sec: "HUMOR", h: "Trivia de bar", b: "Pregunta de la semana: ¿en qué año ganamos aquella liga regional que todos juran recordar pero nadie sabe explicar bien? El premio: una ronda, si alguien acierta. Nadie ha acertado nunca." },
  { sec: "HUMOR", h: "El árbitro también tiene sentimientos", b: "Tras el pitido final, el colegiado de turno confesó a un compañero que 'algún día también me gustaría que me aplaudieran al salir'. El compañero le dijo que soñar es gratis." },
  { sec: "HUMOR", h: "Objetos perdidos (segunda edición)", b: "Además de la pelota de la grada norte, esta semana se suma a la lista una bota derecha, un megáfono y la paciencia del utillero. Se ruega devolución de al menos uno." },
  { sec: "HUMOR", h: "El resumen del bar en tres frases", b: "'Hemos jugado mejor que ellos.' 'El árbitro nos ha condicionado.' 'El año que viene, con esta base, subimos seguro.' Se repite cada domingo, gane quien gane." },
  { sec: "HUMOR", h: "Rebajas en el bazar deportivo", b: "Espinilleras a mitad de precio, camisetas de la temporada pasada con el nombre mal cosido y un cartel que lleva ahí desde el verano: 'liquidación total, últimos días' (van tres meses)." },
  { sec: "HUMOR", h: "Aviso del ayuntamiento", b: "Se comunica que el campo municipal cerrará el lunes por 'mantenimiento del césped'. Fuentes cercanas al jardinero apuntan que en realidad quiere ver la liga tranquilo por la tele." },
  { sec: "HUMOR", h: "Micrófono en la grada de fondo", b: "'¡Que se note el pulmón!', 'Árbitro, cómprate unas gafas', y el clásico 'esto en mis tiempos no pasaba'. La banda sonora de cada domingo, siempre la misma, siempre distinta." },
  { sec: "HUMOR", h: "Test: ¿cuánto sabes de tu propio equipo?", b: "Pregunta 1: ¿cuántos goles lleva {player} esta temporada? Si has dudado, tranquilo: la mitad de la grada tampoco lo sabe y aun así grita su nombre cada domingo." },
  { sec: "HUMOR", h: "La marmota del entrenamiento", b: "El rondo de los martes vuelve a terminar en la misma discusión de siempre: si tocó la línea o no tocó la línea. Nadie lo sabrá jamás. Nadie dejará de discutirlo." },
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
  const fileRef = useRef();
  const onFile = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onRestore(String(reader.result || ""));
    reader.readAsText(file);
  };
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
          <input ref={fileRef} type="file" accept=".json,application/json" style={{ display: "none" }} onChange={onFile} />
          <button className="btn-gold" style={{ width: "100%", marginBottom: 8 }}
            onClick={() => fileRef.current?.click()}>📁 Subir archivo de respaldo</button>
          <div style={{ fontSize: 11, color: "#6F7563", textAlign: "center", margin: "0 0 8px" }}>o pega el texto a mano</div>
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

/* duración de cada fase según la rareza de la captura: cuanto más rara, más se alarga
   la espera/sacudida antes de la revelación (ver documento de Nina, sección 3: "para
   peces raros/épicos/legendarios, aumentar duración, intensidad de brillo..."). */
const FISH_DURATION_MULT = { comun: 1, poco_comun: 1.1, raro: 1.3, epico: 1.6, legendario: 2, especial: 1.15 };
/* secuencia de pesca de Nina: sustituye a NpcDialogue mientras el kind de la entrada al
   frente de la cola es "fishing" (ver queueStageScene/resolveFishing). No es un minijuego
   de habilidad: es una escena con fases fijas (lanzar → esperar → picada → suspense →
   revelación) que termina en una pantalla de captura de solo lectura, a la espera de un
   click del jugador — nunca avanza sola, igual que pide el documento ("no hacer que la
   captura desaparezca automáticamente"). */
function FishingSequence({ entry, onConfirm }) {
  const npc = NPCS[entry.npc] || NPCS.nina;
  const item = ITEMS[entry.fish.id];
  const rarity = FISH_RARITY[entry.fish.rarity] || FISH_RARITY.comun;
  const mult = FISH_DURATION_MULT[entry.fish.rarity] || 1;
  const [phase, setPhase] = useState("cast"); // cast -> wait -> shake -> suspense -> reveal
  useEffect(() => { setPhase("cast"); }, [entry.id]);
  useEffect(() => {
    const delays = { cast: 900, wait: 1100, shake: 850, suspense: 550 };
    const next = { cast: "wait", wait: "shake", shake: "suspense", suspense: "reveal" };
    if (phase === "reveal") return;
    if (phase === "shake") buzz(20);
    const t = setTimeout(() => setPhase(next[phase]), delays[phase] * mult);
    return () => clearTimeout(t);
  }, [phase, mult]);
  useEffect(() => { if (phase === "reveal") buzz([20, 30, 60]); }, [phase]);

  const art = npc.arts["lanzandocaña"];
  const phaseText = { cast: "Lanza la caña...", wait: "Esperando...", shake: "¡Está picando!", suspense: "..." }[phase];

  if (phase !== "reveal") {
    return (
      <div className="fishing-ov">
        <div className={"fishing-pose" + (phase === "shake" ? " fishing-shake" : "")}>
          {art ? <img src={art} alt={npc.name} className="fishing-pose-img" />
            : <div className="fishing-pose-img fishing-pose-fallback">{npc.name[0]}</div>}
        </div>
        <div className="fishing-hint">{phaseText}</div>
      </div>);
  }
  return (
    <div className="fishing-ov fishing-reveal" onClick={() => onConfirm(entry.id)}>
      <div className="fishing-catch-card" style={{ "--fish-glow": rarity.color }}>
        <div className="fishing-glow" />
        {item.img && <img src={item.img} alt={item.name} className="fishing-fish-img" />}
        <div className="fishing-fish-name">{item.name}</div>
        <div className="fishing-fish-rarity" style={{ color: rarity.color, borderColor: rarity.color }}>{rarity.label}</div>
      </div>
      <div className="fishing-hint">toca para continuar</div>
    </div>);
}

/* Pantalla grande de entrega de un cuadro de Vera (ver VERA_STORY/reward y
   game.pendingCuadroReveal): "imagen grande -> efectos -> click para continuar" que pide
   el documento de Vera. Reutiliza la misma estructura visual que la revelación de pesca de
   Nina (FishingSequence, fase "reveal") en vez de inventar un patrón nuevo: mismo glow,
   misma animación de aparición (fishpop/fishglow), solo con sus propias clases "cuadro-*"
   porque el layout (imagen más ancha, sin tarjeta de rareza) es distinto. itemId puede ser
   el id de uno de los 8 ITEMS de tipo "painting", o el sentinel especial "vera_completion"
   (cierre de campaña, sin objeto de inventario: usa vera_playa_regalo con un tratamiento
   ligeramente más grande, tal como pide el documento). */
/* subtítulo genérico según el tipo de objeto — "painting" (cuadros de Vera), "cassette"
   (mezclas de Alexia) y cualquier otro kind futuro caen a un "Nuevo objeto conseguido"
   neutro en vez de dar por hecho que todo lo que pasa por esta pantalla es un cuadro. */
const REWARD_KIND_LABEL = { painting: "Nuevo cuadro conseguido", cassette: "Nuevo cassette conseguido", card: "Nueva carta conseguida", keepsake: "Objeto conseguido" };
/* de qué personaje es cada carta (ver ITEMS kind:"card"), solo para elegir el color del
   resplandor en CuadroReveal — su id no siempre coincide con la clave de NPCS (karla_pin
   es de "lisa", no de "karla"), así que no se puede derivar quitando el sufijo "_pin". */
const CARD_NPC = { elisa_pin: "elisa", milly_pin: "milly", yuna_pin: "yuna", lopez_pin: "lopez",
  igor_pin: "igor", karla_pin: "lisa", beka_pin: "beka", nina_pin: "nina", coco_pin: "coco", vera_pin: "vera",
  alexia_pin: "alexia", milo_pin: "milo" };
/* mismo propósito que CARD_NPC pero para los objetos kind:"keepsake" (recuerdos no
   vendibles que entrega una historia, distintos de las cartas coleccionables). */
const KEEPSAKE_NPC = { elisa_libreta: "elisa", elisa_taza: "elisa", elisa_amuleto: "elisa", elisa_botiquin: "elisa",
  yuna_bufanda: "yuna", yuna_entrada: "yuna", yuna_foto: "yuna", yuna_bufanda2: "yuna" };
function CuadroReveal({ itemId, onClose }) {
  const isCompletion = itemId === "vera_completion";
  const item = !isCompletion ? ITEMS[itemId] : null;
  const img = isCompletion ? NPCS.vera.arts.playa_regalo : item && item.img;
  const title = isCompletion ? "La historia de Vera" : item && item.name;
  const subtitle = isCompletion ? "Campaña completada · Inspiración libre desbloqueada"
    : REWARD_KIND_LABEL[item && item.kind] || "Nuevo objeto conseguido";
  const glow = isCompletion ? NPCS.vera.color
    : item && item.kind === "cassette" ? NPCS.alexia.color
    : item && item.kind === "card" && CARD_NPC[itemId] ? NPCS[CARD_NPC[itemId]].color
    : item && item.kind === "keepsake" && KEEPSAKE_NPC[itemId] ? NPCS[KEEPSAKE_NPC[itemId]].color
    : NPCS.vera.color;
  useEffect(() => { rewardShimmer(); }, [itemId]);
  return (
    <div className="cuadro-reveal-ov" onClick={onClose}>
      <div className={"cuadro-reveal-card" + (isCompletion ? " cuadro-reveal-big" : "")} style={{ "--cuadro-glow": glow }}>
        <div className="cuadro-reveal-glow" />
        {img && <img src={img} alt={title} className="cuadro-reveal-img" />}
        <div className="cuadro-reveal-name">{title}</div>
        <div className="cuadro-reveal-sub">{subtitle}</div>
      </div>
      <div className="fishing-hint cuadro-reveal-hint">toca para continuar</div>
    </div>);
}

/* Apertura del sobre diario del Casino (ver openSobre/game.pendingSobreReveal y
   FUTABITA_Sistema_Cartas_y_Sobres_Code.docx): a diferencia de FishingSequence (que avanza
   fase a fase por temporizador), aquí el sobre se queda quieto esperando un toque — el
   jugador decide cuándo abrirlo, no una cuenta atrás. Un click sobre el sobre dispara el
   crujido (envelopeShake) y una breve animación de apertura (fase "opening", ~450ms) antes
   de revelar la carta con su propio sonido (rewardShimmer). Reutiliza las clases fishing-*
   para las fases de espera/apertura y las cuadro-reveal-* de <CuadroReveal> para la
   revelación final, así las tres pantallas de recompensa grande (pesca, cuadros, cartas)
   comparten la misma base visual. La carta ya se decidió y se añadió al inventario en
   openSobre (game state) en cuanto el jugador pulsó "abrir sobre" en el Casino: este
   componente es solo la puesta en escena de esa entrega. */
function SobreReveal({ reveal, onClose }) {
  const [phase, setPhase] = useState("closed"); // closed (esperando toque) -> opening -> reveal
  useEffect(() => { setPhase("closed"); }, [reveal.id]);
  useEffect(() => {
    if (phase !== "opening") return;
    const t = setTimeout(() => setPhase("reveal"), 450);
    return () => clearTimeout(t);
  }, [phase]);
  useEffect(() => { if (phase === "reveal") { buzz([20, 30, 60]); rewardShimmer(); } }, [phase]);

  if (phase !== "reveal") {
    const open = () => { if (phase !== "closed") return; buzz(20); envelopeShake(); setPhase("opening"); };
    return (
      <div className="fishing-ov" onClick={open}>
        <div className={"fishing-pose" + (phase === "opening" ? " fishing-shake" : "")}>
          <img src="/images/cartas/sobre.webp" alt="Sobre" className="fishing-pose-img" />
        </div>
        <div className="fishing-hint">{phase === "closed" ? "toca para abrir" : "Abriendo el sobre..."}</div>
      </div>);
  }
  const item = ITEMS[reveal.id];
  return (
    <div className="cuadro-reveal-ov" onClick={onClose}>
      <div className="cuadro-reveal-card" style={{ "--cuadro-glow": "#CDF546" }}>
        <div className="cuadro-reveal-glow" />
        {item.img && <img src={item.img} alt={item.name} className="cuadro-reveal-img" />}
        <div className="cuadro-reveal-name">{item.name}</div>
        <div className="cuadro-reveal-sub">{reveal.isNew ? "NUEVA CARTA" : "CARTA REPETIDA"}</div>
      </div>
      <div className="fishing-hint cuadro-reveal-hint">toca para continuar</div>
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

/* Periódico como ventana modal: se cierra con la X o tocando fuera, y se puede
   reabrir las veces que quieras el mismo día (cada apertura vuelve a animar la portada). */
/* Pantalla de "visitar" una zona: fondo a toda pantalla + flecha para volver.
   Si hay alguien esperando ahí, su diálogo (NpcDialogue) aparece por encima, a nivel
   de App. Si no hay nadie, un cartel lo dice; el Kiosco es la excepción porque
   siempre hay periódico, así que en vez de cartel ofrece abrirlo.
   Fondo real: si existe /images/zones/{id}.webp se usa; si no (todavía no se ha
   subido), cae a un degradado de marcador de posición sin romper nada. */
function ZoneScreen({ zone, pendingNpc, onBack, onOpenPaper, game, onOpenSobre, onFish, onBuyCoco, onSellCoco }) {
  const [imgOk, setImgOk] = useState(true);
  const [showCocoShop, setShowCocoShop] = useState(false);
  const npc = pendingNpc ? NPCS[pendingNpc] : null;
  const showPaperPrompt = zone.kind === "paper" && !pendingNpc;
  const isHome = zone.kind === "home";
  const isCasino = zone.id === "casino";
  /* Coco está "activa" en su zona durante toda la visita (ver zoneActiveNpc/zonePending),
     tenga o no una frase de historia pendiente ahora mismo — si la tiene, su diálogo
     normal (a nivel de App) se pinta encima y tapa este panel; si no, el jugador ve
     directamente el acceso a la tienda. */
  const isCoco = !!(game.cocoVisit && game.cocoVisit.zone === zone.id);
  /* pesca libre: solo tras completar la campaña de Nina (ver NINA_STORY, FINAL/EPÍLOGO) */
  const isPlaya = zone.id === "playa" && !!game.ninaStoryComplete;
  const fishedToday = isPlaya && game.ninaFishDay === todayStr();
  const sobreToday = isCasino && game && game.sobreDay === todayStr();
  return (
    <div className="zone-screen">
      {imgOk ? (
        <img key={zone.id} src={`/images/zones/${zone.id}.webp`} alt="" className="zone-bg-img" onError={() => setImgOk(false)} />
      ) : (
        <div className="zone-bg-fallback" style={{ background:
          `linear-gradient(160deg, ${npc ? npc.color : "#7A8065"}77, #16190F 78%)` }} />
      )}
      <div className="zone-shade" />
      <button className="zone-back" onClick={onBack}>← Volver</button>
      <div className="zone-label">{zone.label}</div>
      {!pendingNpc && !showPaperPrompt && !isHome && !isCasino && !isPlaya && !isCoco && (
        <div className="zone-empty-card">
          <div style={{ fontSize: 30, marginBottom: 6 }}>🏚️</div>
          Parece que no hay nadie por aquí ahora mismo.</div>)}
      {showPaperPrompt && (
        <button className="zone-empty-card zone-paper-btn" onClick={onOpenPaper}>
          🗞️ Leer el periódico de hoy</button>)}
      {isHome && <HouseRoom game={game} />}
      {isCasino && !pendingNpc && (
        <div className="house-room">
          <div className="house-card">
            <div className="house-title">🎴 Sobre del Casino</div>
            {sobreToday ? (
              <div style={{ fontSize: 13, color: "#EFEEE3", lineHeight: 1.5 }}>
                Ya has abierto tu sobre hoy.<br />Vuelve mañana para otra carta.</div>
            ) : (
              <button className="btn-gold sm" style={{ width: "100%" }} onClick={onOpenSobre}>
                🎴 Abrir sobre (1 disponible hoy)</button>
            )}
          </div>
        </div>)}
      {isPlaya && !pendingNpc && (
        <div className="house-room">
          <div className="house-card">
            <div className="house-title">🎣 Pesca libre</div>
            {fishedToday ? (
              <div style={{ fontSize: 13, color: "#EFEEE3", lineHeight: 1.5 }}>
                Ya has pescado hoy.<br />Vuelve mañana para otra tirada.</div>
            ) : (
              <button className="btn-gold sm" style={{ width: "100%" }} onClick={onFish}>
                🎣 Lanzar la caña (tirada gratis de hoy)</button>
            )}
          </div>
        </div>)}
      {isCoco && (
        <div className="house-room">
          <div className="house-card">
            <div className="house-title">🛍️ La tienda de Coco</div>
            <div style={{ fontSize: 12.5, color: "#9a9e8e", marginBottom: 10 }}>
              Hoy está abierta. Coco atiende un día sí y otro no, con mercancía nueva cada vez.</div>
            <button className="btn-gold sm" style={{ width: "100%" }} onClick={() => setShowCocoShop(true)}>
              🛒 Ver tienda</button>
          </div>
        </div>)}
      {showCocoShop && (
        <CocoShop game={game} onClose={() => setShowCocoShop(false)} onBuy={onBuyCoco} onSell={onSellCoco} />)}
    </div>);
}

/* Tienda de Coco: 3 slots de compra fijos durante toda la visita (ver game.cocoVisit,
   generado por refreshCocoVisit — abrir/cerrar este panel nunca cambia productos ni
   precios) + un botón VENDER aparte con los objetos vendibles del inventario (por ahora
   solo peces, ver ITEMS[id].sellMin/sellMax). Cada compra/venta pide confirmación con
   objeto, efecto/cantidad y precio antes de ejecutar la transacción, tal como pide el
   documento — nunca se descuenta/entrega nada con un solo click. */
function CocoShop({ game, onClose, onBuy, onSell }) {
  const [confirmBuy, setConfirmBuy] = useState(null); // índice de slot
  const [sellMode, setSellMode] = useState(false);
  const [sellPrices, setSellPrices] = useState(null); // { [itemId]: precio }, rolado una vez al abrir VENDER
  const [confirmSell, setConfirmSell] = useState(null); // { id, price, qty }
  const visit = game.cocoVisit;
  if (!visit) return null;
  const openSell = () => {
    const prices = {};
    Object.entries(game.inventory || {}).forEach(([id, qty]) => {
      if (qty > 0 && ITEMS[id] && ITEMS[id].sellMin != null) prices[id] = rollSellPrice(id);
    });
    setSellPrices(prices);
    setSellMode(true);
  };
  return (
    <div className="overlay" style={{ background: "rgba(5,7,13,.75)", zIndex: 65, alignItems: "flex-end", padding: "0 0 16px" }} onClick={onClose}>
      <div className="sheet" style={{ maxHeight: "78vh", overflowY: "auto", borderRadius: 22 }} onClick={(e) => e.stopPropagation()}>
        <div className="ptitle" style={{ fontSize: 16, marginBottom: 14 }}>🛍️ TIENDA DE COCO · 🪙 {game.fichas || 0}</div>
        {!sellMode ? (
          <>
            {visit.products.map((p, i) => {
              const it = ITEMS[p.id];
              return (
                <div key={i} className="panel" style={{ display: "flex", alignItems: "center", gap: 10, opacity: p.sold ? .5 : 1 }}>
                  {it.img ? <img src={it.img} alt={it.name} className="item-ico-img" /> : <span style={{ fontSize: 22 }}>{it.icon}</span>}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: "#26291D" }}>{it.name}</div>
                    <div style={{ fontSize: 10.5, color: "#6F7563" }}>+{it.xp} XP {it.stat}</div>
                  </div>
                  {p.sold ? (
                    <span style={{ fontSize: 11, color: "#9a9e8e", fontFamily: "'Oswald',sans-serif" }}>AGOTADO</span>
                  ) : (
                    <button className="btn-gold sm" onClick={() => setConfirmBuy(i)}>🪙 {p.price}</button>
                  )}
                </div>);
            })}
            <button className="btn-ghost sm" style={{ width: "100%", marginTop: 4 }} onClick={openSell}>💰 Vender objetos</button>
          </>
        ) : (
          <>
            <button className="btn-ghost sm" style={{ marginBottom: 10 }} onClick={() => setSellMode(false)}>← Volver a comprar</button>
            {Object.keys(sellPrices || {}).length === 0 && (
              <div className="empty"><span className="em-ico">🎒</span>
                No tienes nada que Coco quiera comprar ahora mismo.</div>)}
            {Object.entries(sellPrices || {}).map(([id, price]) => {
              const it = ITEMS[id];
              const qty = (game.inventory || {})[id] || 0;
              return (
                <div key={id} className="panel" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {it.img ? <img src={it.img} alt={it.name} className="item-ico-img" /> : <span style={{ fontSize: 22 }}>{it.icon}</span>}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: "#26291D" }}>{it.name}</div>
                    <div style={{ fontSize: 10.5, color: "#6F7563" }}>Tienes ×{qty}</div>
                  </div>
                  <button className="btn-gold sm" onClick={() => setConfirmSell({ id, price, qty })}>🪙 {price}</button>
                </div>);
            })}
          </>
        )}
      </div>
      {confirmBuy != null && (() => {
        const slot = visit.products[confirmBuy];
        const it = ITEMS[slot.id];
        return (
          <div className="overlay" style={{ background: "rgba(5,7,13,.88)", zIndex: 90 }}
            onClick={(e) => { e.stopPropagation(); setConfirmBuy(null); }}>
            <div className="item-lightbox" onClick={(e) => e.stopPropagation()}>
              {it.img ? <img src={it.img} alt={it.name} className="item-lightbox-img" /> : <span style={{ fontSize: 90 }}>{it.icon}</span>}
              <div className="item-lightbox-name">{it.name}</div>
              <div className="item-lightbox-desc">{it.desc}</div>
              <div className="item-lightbox-desc" style={{ fontWeight: 700 }}>+{it.xp} XP {it.stat} · 🪙 {slot.price}</div>
              <div style={{ display: "flex", gap: 8, width: "100%" }}>
                <button className="btn-gold sm" style={{ flex: 1 }} disabled={(game.fichas || 0) < slot.price}
                  onClick={() => { onBuy(confirmBuy); setConfirmBuy(null); }}>Comprar</button>
                <button className="btn-ghost sm" style={{ flex: 1 }} onClick={() => setConfirmBuy(null)}>Cancelar</button>
              </div>
            </div>
          </div>);
      })()}
      {confirmSell && (() => {
        const it = ITEMS[confirmSell.id];
        return (
          <div className="overlay" style={{ background: "rgba(5,7,13,.88)", zIndex: 90 }}
            onClick={(e) => { e.stopPropagation(); setConfirmSell(null); }}>
            <div className="item-lightbox" onClick={(e) => e.stopPropagation()}>
              {it.img ? <img src={it.img} alt={it.name} className="item-lightbox-img" /> : <span style={{ fontSize: 90 }}>{it.icon}</span>}
              <div className="item-lightbox-name">{it.name} · tienes ×{confirmSell.qty}</div>
              <div className="item-lightbox-desc" style={{ fontWeight: 700 }}>🪙 {confirmSell.price}</div>
              <div style={{ display: "flex", gap: 8, width: "100%" }}>
                <button className="btn-gold sm" style={{ flex: 1 }}
                  onClick={() => { onSell(confirmSell.id, 1, confirmSell.price); setConfirmSell(null); }}>Vender 1</button>
                <button className="btn-ghost sm" style={{ flex: 1 }} onClick={() => setConfirmSell(null)}>Cancelar</button>
              </div>
            </div>
          </div>);
      })()}
    </div>);
}

/* Tu Casa: sin personaje, muestra la vitrina de trofeos (una liga ganada = un trofeo)
   y las estadísticas de partidos de toda tu carrera. */
/* partidas de antes de que careerLog guardara pos/club/colores como campos propios:
   solo tenían "text" tipo "1º con UD Alzira · 12 goles · media 7.4", así que lo
   reconstruimos leyendo esa frase para no perder los trofeos ya ganados */
const trophyInfo = (c) => {
  if (c.pos != null) return c;
  const m = (c.text || "").match(/^(\d+)º con (.+?) ·/);
  if (!m) return { ...c, pos: null };
  const club = m[2];
  const known = [...REGIONAL_POOL, ...TIERS.flatMap((t) => t.clubs)].find((cl) => cl.name === club);
  return { ...c, pos: +m[1], club, c1: known ? known.c1 : "#3F4433", c2: known ? known.c2 : "#8A8E7C" };
};
function HouseRoom({ game }) {
  const trophies = (game.careerLog || []).map(trophyInfo).filter((c) => c.pos === 1);
  const hist = game.matchHistory || [];
  const wins = hist.filter((m) => m.res === "V").length;
  const draws = hist.filter((m) => m.res === "E").length;
  const losses = hist.filter((m) => m.res === "D").length;
  const goals = hist.reduce((a, m) => a + (m.myGoals || 0), 0);
  const assists = hist.reduce((a, m) => a + (m.myAssists || 0), 0);
  const rated = hist.filter((m) => m.rating != null);
  const avgR = rated.length ? (rated.reduce((a, m) => a + m.rating, 0) / rated.length).toFixed(1) : "—";
  const bestR = rated.length ? Math.max(...rated.map((m) => m.rating)) : null;
  return (
    <div className="house-room" onClick={(e) => e.stopPropagation()}>
      <div className="house-card">
        <div className="house-title">🏆 Vitrina de trofeos</div>
        {trophies.length === 0 ? (
          <div className="empty" style={{ padding: "10px 4px" }}>
            <span className="em-ico">🗄️</span>Todavía no hay ninguna liga en la vitrina.<br />Termina 1º de tu categoría para ganar tu primer trofeo.</div>
        ) : (
          <div className="house-trophies">
            {trophies.map((t, i) => (
              <div key={i} className="house-trophy">
                <Crest c1={t.c1} c2={t.c2} name={t.club} size={30} />
                <div style={{ fontSize: 10.5, color: "#9a9e8e", marginTop: 4 }}>T{t.season}</div>
                <div style={{ fontSize: 10, color: "#EFEEE3", fontWeight: 600 }}>🏆</div>
              </div>))}
          </div>)}
      </div>
      <div className="house-card">
        <div className="house-title">📊 Estadísticas de carrera</div>
        <div className="house-stats">
          <div className="house-stat"><b>{hist.length}</b><span>Partidos</span></div>
          <div className="house-stat"><b>{wins}-{draws}-{losses}</b><span>V-E-D</span></div>
          <div className="house-stat"><b>{goals}</b><span>Goles</span></div>
          <div className="house-stat"><b>{assists}</b><span>Asistencias</span></div>
          <div className="house-stat"><b>{avgR}</b><span>Media</span></div>
          <div className="house-stat"><b>{bestR != null ? bestR : "—"}</b><span>Mejor nota</span></div>
        </div>
      </div>
    </div>);
}

function PaperModal({ game, onRead, onClose }) {
  return (
    <div className="overlay" style={{ background: "rgba(5,7,13,.88)", zIndex: 70, padding: 14 }} onClick={onClose}>
      <button className="chat-back" style={{ position: "fixed", top: 14, right: 14, zIndex: 71 }} onClick={onClose}>✕</button>
      <div style={{ width: "100%", maxWidth: 460, maxHeight: "90vh", overflowY: "auto", borderRadius: 14 }}
        onClick={(e) => e.stopPropagation()}>
        <Newspaper game={game} onRead={onRead} />
      </div>
    </div>);
}

/* progreso DENTRO de la etapa activa (no de la historia entera): si la etapa declara
   "subs" (las sub-condiciones que componen su objetivo, ver stage.subs en STORIES),
   la barra es cuánto se ha cumplido de cada una ahora mismo — así "gana dos partidos"
   sube al 50% tras el primero y al 100% tras el segundo. Cada sub puede ser:
     - una función (g, snap) => boolean: cuenta como un único objetivo (0 o 1 unidad);
     - un objeto { count: (g, snap) => número, goal: número }: cuenta como "goal"
       unidades en total, de las cuales count(g,snap) están cumplidas — así "3 días de
       objetivos" pesa 3 unidades dentro de la misión, no una sola "sub" equivalente a
       cualquier otro objetivo booleano. El progreso final es unidades cumplidas / unidades
       totales de TODOS los subs juntos: cada objetivo individual (cada día, cada condición
       booleana) pesa lo mismo, nunca se agrupan varios objetivos en un único "pack" que
       valga igual que uno solo (p.ej. "3 días + 1 victoria" son 4 objetivos de 25% cada
       uno, no "días" al 50% y "victoria" al 50%). */
function stageProgress(game, stageDef, snap) {
  if (stageDef.subs && stageDef.subs.length) {
    let done = 0, total = 0;
    stageDef.subs.forEach((sub) => {
      if (typeof sub === "function") { total += 1; done += sub(game, snap) ? 1 : 0; return; }
      total += sub.goal;
      done += Math.min(sub.count(game, snap), sub.goal);
    });
    return total > 0 ? done / total : 0;
  }
  /* etapas de un único objetivo "acumula N de algo" (días cumplidos, racha...) sin subs:
     progressCount/progressGoal dan la cuenta real en vez de dejar la barra a 0% hasta
     el último día, que es justo lo que hacía parecer que un día bueno "no contaba". */
  if (stageDef.progressCount) return Math.min(stageDef.progressCount(game, snap) / stageDef.progressGoal, 1);
  return stageDef.check(game, snap) ? 1 : 0;
}

/* Registro de misiones: solo enseña las historias que ya han empezado (nada de spoilers
   de las que aún no se han desbloqueado). La barra representa el progreso de la etapa
   ACTIVA (se reinicia al empezar cada una); al completarse queda en verde esperando a
   que el jugador hable con el personaje — la siguiente etapa no aparece ni la barra se
   reinicia hasta que lea esa conversación (game.storyPending[key]). */
function QuestPanel({ game, onClose, storiesRegistry }) {
  const active = Object.entries(storiesRegistry)
    .map(([key, def]) => ({ key, def, st: (game.stories || {})[key] }))
    .filter((x) => x.st && x.st.stage !== -1);
  /* replay de la cinemática de la etapa activa: SOLO lectura, ver comentario junto a
     startReplay/advanceReplay más abajo — no toca game ni llama a setGame en ningún punto. */
  const [replay, setReplay] = useState(null); // { npc, name, steps, idx } | null
  const startReplay = (npcKey, name, stageDef) => {
    const ctx = flavorCtx(game);
    const beat = (b) => ({ kind: "beat", m: b.m, t: fillTpl(b.t, ctx) });
    /* las etapas de pesca (ver NINA_STORY) no tienen "intro": su guion se parte en
       introBefore + la captura + introAfter. El replay reconstruye la escena COMPLETA
       en el mismo orden en que se vivió, secuencia de pesca y pantalla de captura
       incluidas — pero como un paso más que se pasa con un toque: aquí nada llama a
       resolveFishing, así que el pez NO vuelve a entrar en el inventario. */
    const steps = stageDef.intro
      ? stageDef.intro.map(beat)
      : [...(stageDef.introBefore || []).map(beat),
         ...(stageDef.fish ? [{ kind: "fishing", fish: stageDef.fish }] : []),
         ...(stageDef.introAfter || []).map(beat)];
    if (!steps.length) return;
    setReplay({ npc: npcKey, name, steps, idx: 0 });
  };
  /* avanza el índice local nada más: no hay applyOnRead, ni npcQueue, ni setGame.
     Al pasar el último paso, idx supera el total y el replay se cierra solo — eso YA
     es "volver automáticamente a Misiones", porque el panel nunca se desmontó debajo. */
  const advanceReplay = () => setReplay((r) => {
    if (!r) return null;
    const nextIdx = r.idx + 1;
    return nextIdx >= r.steps.length ? null : { ...r, idx: nextIdx };
  });
  const replayStep = replay ? replay.steps[replay.idx] : null;
  const replayEntry = replayStep && (replayStep.kind === "fishing"
    ? { id: `replay-${replay.idx}`, npc: replay.npc, mood: "lanzandocaña", kind: "fishing", text: "", fish: replayStep.fish }
    : { id: `replay-${replay.idx}`, npc: replay.npc, mood: replayStep.m, text: replayStep.t });
  return (
    <div className="overlay" style={{ background: "rgba(5,7,13,.75)", zIndex: 65, alignItems: "flex-end", padding: "0 0 16px" }} onClick={onClose}>
      <div className="sheet" style={{ maxHeight: "78vh", overflowY: "auto", borderRadius: 22 }} onClick={(e) => e.stopPropagation()}>
        <div className="ptitle" style={{ fontSize: 16, marginBottom: 14 }}>📜 MISIONES</div>
        {active.length === 0 && (
          <div className="empty"><span className="em-ico">🎯</span>
            Todavía no hay ninguna historia en marcha.<br />Sigue explorando la ciudad.</div>)}
        {active.map(({ key, def, st }) => {
          const npc = NPCS[def.npc];
          const chapter = def.chapters[st.chapter];
          const stageDef = chapter.stages[st.stage];
          const waitingToTalk = !st.done && !!(game.storyPending && game.storyPending[key]);
          const pct = st.done || waitingToTalk ? 1 : stageProgress(game, stageDef, st.snap);
          const portrait = (
            <img src={npc.icon} alt={npc.name} className="quest-portrait-img" />);
          return (
            <div key={key} className="quest-card">
              {/* recordatorio de la cinemática de la etapa activa: solo si hay una etapa en
                  marcha (no en historias ya completadas/cerradas) — replay de solo lectura,
                  no reinicia la misión ni repite ningún efecto de esa escena */}
              {st.done ? (
                <div className="quest-portrait">{portrait}</div>
              ) : (
                <button onClick={() => startReplay(def.npc, npc.name, stageDef)}
                  aria-label={`Volver a ver la escena de ${npc.name}`} className="quest-portrait quest-portrait-btn">
                  {portrait}
                  <span className="quest-replay-hint">↻</span>
                </button>)}
              <div className="quest-body">
                <div className="quest-chapter">{chapter.title}</div>
                {st.done ? (
                  <div className="quest-status" style={{ color: st.failed ? "#9a9e8e" : "#3F8F2B" }}>
                    {st.failed ? "Historia cerrada" : "✓ Completada"}</div>
                ) : (
                  <>
                    <div className="quest-stage">{stageDef.title}</div>
                    {waitingToTalk ? (
                      <div className="quest-status" style={{ color: "#3F8F2B" }}>
                        ✓ Completada · habla con {npc.name}</div>
                    ) : (
                      <div className="quest-objective">{stageDef.objective}</div>
                    )}
                    <div className="quest-track-row">
                      <div className="track quest-track">
                        <div className="fill" style={{ width: `${pct * 100}%`, background: pct >= 1 ? "#2E9E44" : "#CDF546" }} />
                      </div>
                      <span className="quest-pct">{Math.round(pct * 100)}%</span>
                    </div>
                  </>)}
              </div>
            </div>);
        })}
      </div>
      {replayEntry && (
        <div onClick={(e) => e.stopPropagation()}>
          {replayEntry.kind === "fishing"
            ? <FishingSequence entry={replayEntry} onConfirm={advanceReplay} />
            : <NpcDialogue entry={replayEntry} queueLeft={replay.steps.length - replay.idx}
                onAdvance={advanceReplay} onChoice={() => {}} onOffer={() => {}} />}
        </div>)}
    </div>);
}

/* vista ampliada de un objeto: se abre al tocar su icono (en la mochila o en la tienda
   del Casino), por encima de cualquiera de los dos paneles. La tienda solo la usa para
   ver la imagen grande (sin "actions"); la mochila le pasa además cantidad y el botón de
   usar/regalar que le corresponda, así el detalle completo vive en un único sitio. */
function ItemLightbox({ item, qty, actions, onClose }) {
  if (!item) return null;
  return (
    <div className="overlay" style={{ background: "rgba(5,7,13,.88)", zIndex: 90 }}
      onClick={(e) => { e.stopPropagation(); onClose(); }}>
      <div className="item-lightbox" onClick={(e) => e.stopPropagation()}>
        {item.img ? <img src={item.img} alt={item.name} className="item-lightbox-img" />
          : <span style={{ fontSize: 90 }}>{item.icon}</span>}
        <div className="item-lightbox-name">{item.name}{qty > 1 ? ` ×${qty}` : ""}</div>
        <div className="item-lightbox-desc">{item.desc}</div>
        {actions}
        <button className="btn-ghost sm" onClick={onClose}>Cerrar</button>
      </div>
    </div>);
}

/* Inventario: burbuja propia junto a Misiones y Viajar. Rejilla de slots (solo icono +
   cantidad, como un inventario de videojuego); nombre/descripción/acción (Usar → XP a una
   stat, o Regalar a su personaje) se ven al tocar un slot, en el mismo ItemLightbox que ya
   usaba la tienda del Casino para el zoom. */
function InventoryPanel({ game, onClose, onUseItem, onGiveItem, onActivateCassette }) {
  const [zoomId, setZoomId] = useState(null);
  /* activar un cassette mientras ya hay otro puesto pide confirmación explícita (el
     documento lo exige: "requiere confirmación y sustituye el anterior"); activar sin
     nada puesto no necesita ese paso extra. */
  const [confirmSwap, setConfirmSwap] = useState(null); // itemId en espera de confirmación
  const inv = Object.entries(game.inventory || {}).filter(([, qty]) => qty > 0);
  const zoomItem = zoomId ? ITEMS[zoomId] : null;
  const zoomQty = zoomId ? (game.inventory || {})[zoomId] || 0 : 0;
  const recipient = zoomItem && zoomItem.kind === "gift" ? CARDS.find((c) => c.npc === zoomItem.giveTo) : null;
  const canGive = recipient && recipient.unlocked(game);
  const activeBoost = game.activeBoost;
  const activeCassette = activeBoost ? ITEMS[activeBoost.itemId] : null;
  const tryActivate = (id) => {
    if (activeBoost && activeBoost.itemId !== id) { setConfirmSwap(id); return; }
    onActivateCassette(id); setZoomId(null);
  };
  return (
    <div className="overlay" style={{ background: "rgba(5,7,13,.75)", zIndex: 65, alignItems: "flex-end", padding: 0 }} onClick={onClose}>
      <div className="sheet" style={{ maxHeight: "78vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div className="ptitle" style={{ fontSize: 16, marginBottom: 14 }}>🎒 INVENTARIO</div>
        {inv.length === 0 && (
          <div className="empty"><span className="em-ico">🎒</span>
            Todavía no tienes ningún objeto.<br />Los consigues completando misiones, en regalos sueltos de la ciudad o en la tienda del Casino.</div>)}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {inv.map(([id, qty]) => {
            const it = ITEMS[id];
            if (!it) return null;
            return (
              <button key={id} className="inv-slot" onClick={() => setZoomId(id)}>
                {it.img ? <img src={it.img} alt={it.name} className="inv-slot-img" />
                  : <span style={{ fontSize: 26 }}>{it.icon}</span>}
                {qty > 1 && <span className="inv-slot-qty">×{qty}</span>}
              </button>);
          })}
        </div>
      </div>
      <ItemLightbox item={zoomItem} qty={zoomQty} onClose={() => setZoomId(null)}
        actions={zoomItem && (
          <>
            {zoomItem.kind === "consumable" && (
              <button className="btn-gold sm" style={{ width: "100%" }} onClick={() => { onUseItem(zoomId); setZoomId(null); }}>
                Usar · +{zoomItem.xp} XP {zoomItem.stat === "random" ? "(stat al azar)" : zoomItem.stat}</button>)}
            {zoomItem.kind === "gift" && (
              canGive ? (
                <button className="btn-gold sm" style={{ width: "100%" }} onClick={() => { onGiveItem(zoomId); setZoomId(null); }}>
                  Regalar a {NPCS[zoomItem.giveTo].name}</button>
              ) : (
                <div style={{ fontSize: 11.5, color: "#9a9e8e" }}>Todavía no conoces a {NPCS[zoomItem.giveTo].name} para dárselo.</div>
              ))}
            {zoomItem.kind === "cassette" && (
              activeBoost && activeBoost.itemId === zoomId ? (
                <div style={{ fontSize: 12.5, color: "#5C7010", fontWeight: 600, textAlign: "center" }}>
                  🔥 Activo · {activeBoost.daysLeft} {activeBoost.daysLeft === 1 ? "día" : "días"} restantes</div>
              ) : (
                <button className="btn-gold sm" style={{ width: "100%" }} onClick={() => tryActivate(zoomId)}>
                  Activar · +{Math.round((zoomItem.boostMult - 1) * 100)}% XP {zoomItem.boostStat === "ALL" ? "todos los stats" : zoomItem.boostStat} · {zoomItem.boostDays} días</button>
              ))}
          </>
        )} />
      {confirmSwap && (
        <div className="overlay" style={{ background: "rgba(5,7,13,.88)", zIndex: 95, padding: 14 }} onClick={() => setConfirmSwap(null)}>
          <div className="sheet" style={{ maxWidth: 340 }} onClick={(e) => e.stopPropagation()}>
            <div className="ptitle" style={{ fontSize: 15, marginBottom: 10 }}>🔥 Sustituir cassette activo</div>
            <div style={{ fontSize: 13, color: "#26291D", lineHeight: 1.5, marginBottom: 14 }}>
              Ya tienes <strong>{activeCassette && activeCassette.name}</strong> activo
              ({activeBoost.daysLeft} {activeBoost.daysLeft === 1 ? "día" : "días"} restantes).
              Activar <strong>{ITEMS[confirmSwap].name}</strong> ahora lo sustituye — el boost anterior se pierde.</div>
            <button className="btn-gold sm" style={{ width: "100%", marginBottom: 8 }}
              onClick={() => { onActivateCassette(confirmSwap); setConfirmSwap(null); setZoomId(null); }}>
              Sustituir de todos modos</button>
            <button className="btn-ghost sm" style={{ width: "100%" }} onClick={() => setConfirmSwap(null)}>Cancelar</button>
          </div>
        </div>)}
    </div>);
}

/* ---------- LA CIUDAD · mapa de zonas con desbloqueo progresivo ---------- */
function CityMap({ game, onVisit, zones, vb, svgSrc, mapLabel }) {
  const npcQueue = game.npcQueue || [];
  const [flash, setFlash] = useState(null); /* id de zona mostrando su requisito/aviso */

  const flashReq = (id) => {
    buzz(10);
    setFlash(id);
    setTimeout(() => setFlash((cur) => (cur === id ? null : cur)), 2200);
  };
  /* tocar una zona ya no abre nada directamente: te lleva a visitarla (ZoneScreen),
     que es quien decide si hay alguien esperando o si está vacía */
  const zoneClick = (z, unlocked) => {
    if (!unlocked || z.kind === "soon") { flashReq(z.id); return; }
    onVisit(z.id);
  };
  /* centro de cada zona en las coordenadas nativas del SVG (para el texto del candado) */
  const cx = (z) => vb.x + (z.x / 100) * vb.w;
  const cy = (z) => vb.y + (z.y / 100) * vb.h;
  const flashZone = flash ? zones.find((z) => z.id === flash) : null;

  /* mapa todavía sin zonas (p.ej. la Metrópolis, a la espera de su SVG y sus personajes) */
  if (!zones.length) return (
    <div className="city-wrap city-empty">
      <div className="city-empty-card">
        <div style={{ fontSize: 34, marginBottom: 8 }}>🚧</div>
        {mapLabel} está en construcción.<br />Vuelve pronto.
      </div>
    </div>);

  return (
    <div className="city-wrap">
      <img src={svgSrc} alt={`Mapa de ${mapLabel}`} className="city-bg-img" />
      <div className="city-coins">🪙 {game.fichas || 0}</div>
      {/* la zona en sí (su silueta real del mapa) es lo clicable, no un círculo suelto encima.
          bloqueadas: gris + candado. desbloqueadas sin nada pendiente: invisible, pero clicable
          en toda su forma. Con algo pendiente, esa silueta queda tapada por la burbuja de personaje. */}
      <svg className="city-overlay" viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} preserveAspectRatio="none">
        {zones.filter((z) => !z.unlocked(game)).map((z) => (
          <g key={z.id} className="city-lockshape" onClick={() => zoneClick(z, false)}>
            {z.pts ? <polygon points={z.pts} className="city-lockfill" />
              /* sin edificio propio (El Barrio): círculo invisible solo para ampliar la zona tocable */
              : <circle cx={cx(z)} cy={cy(z)} r="20" fill="transparent" />}
            <text x={cx(z)} y={cy(z)} className={"city-locktxt" + (z.pts ? "" : " small")} textAnchor="middle" dominantBaseline="central">🔒</text>
          </g>))}
        {zones.filter((z) => z.unlocked(game) && !zonePending(z, game)).map((z) => (
          <g key={z.id} className="city-clickshape" onClick={() => zoneClick(z, true)}>
            {z.pts ? <polygon points={z.pts} fill="transparent" />
              : <circle cx={cx(z)} cy={cy(z)} r="20" fill="transparent" />}
          </g>))}
      </svg>
      {zones.map((z) => {
        const unlocked = z.unlocked(game);
        const style = { left: z.x + "%", top: z.y + "%" };
        /* el candado, el clic en reposo y el aviso van todos dentro del overlay SVG /
           centrados en el punto; los nombres ya están dibujados en el propio mapa. */
        const pending = unlocked && zonePending(z, game);
        if (!pending) {
          return <div key={z.id} className="city-zone" style={style} />;
        }
        /* la cara del personaje solo se ve si tiene algo pendiente que contar.
           en zonas con varios personajes, se enseña el primero que tenga algo pendiente. */
        const activeKey = zoneActiveNpc(z, npcQueue, game);
        const npc = activeKey ? NPCS[activeKey] : null;
        return (
          <div key={z.id} className="city-zone" style={style}>
            <button className={"city-bubble pend" + (z.big ? " big" : "")}
              onClick={() => zoneClick(z, true)} aria-label={z.label}>
              {npc ? <img src={npc.icon} alt={npc.name} className="city-ico-img" />
                : <span className="city-ico-emoji">{z.icon}</span>}
              <span className="dot" style={{ top: -2, right: -2, padding: "3px 4px" }} />
            </button>
          </div>);
      })}
      {/* aviso de requisito: centrado siempre en horizontal (a la altura de la zona tocada),
          para que nunca se corte aunque el candado esté pegado al borde izquierdo o derecho */
        flashZone && (
          <div className="city-req" style={{ top: `calc(${flashZone.y}% + 26px)` }}>
            {flashZone.kind === "soon" && flashZone.unlocked(game) ? "Próximamente" : ZONE_LOCKED_MSG}
          </div>)}
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
    if (isEmptyDayLog(l)) return "transparent"; /* cerrado sin ningún registro: no cuenta como mal día */
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
            🟢 Buen día · 🟡 Estancado · 🔴 En caída · ⬜ Sin uso · Toca cualquier día para ver o anotar
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
                {!log.closed
                  ? <div style={{ fontSize: 11.5, color: "#5C7010", fontWeight: 600, paddingBottom: 4 }}>Día aún sin cerrar</div>
                  : isEmptyDayLog(log)
                  ? <div style={{ fontSize: 11.5, color: "#9a9e8e", fontWeight: 600, paddingBottom: 4 }}>No se usó la app este día</div>
                  : <Fila k="Resultado" v={<FormBadge form={log.form} size={12} />} />}
                {log.closed && !isEmptyDayLog(log) && <Fila k="Cumplimiento" v={log.pct + "%"} />}
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

function LogTab({ game, log, onLog, logDate, onDate, onCloseDay, savedMeals, onSaveMeal, onUseSaved, onDeleteSaved,
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
              <span key={i} className="chip chip-fav">
                <button className="chip-fav-btn" onClick={() => addSaved(m)}>
                  {m.name === starName ? "⭐ " : ""}{m.name} · {m.kcal}kcal</button>
                <button className="chip-fav-del" aria-label={`Quitar ${m.name} de favoritos`}
                  onClick={(e) => { e.stopPropagation(); onDeleteSaved(m.name); }}>✕</button>
              </span>))}
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
            <div className="rest-fill" style={{ width: (restLeft / (act.restLen || 150)) * 100 + "%" }} />
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
  /* llama de boost activo (ver game.activeBoost/ITEMS kind:"cassette"): el documento pide
     que aparezca en la pantalla principal mientras dure, y que al tocarla se vea el
     cassette, el stat y el tiempo restante. */
  const [showBoost, setShowBoost] = useState(false);
  const boost = game.activeBoost;
  const boostItem = boost ? ITEMS[boost.itemId] : null;
  return (
    <div style={{ padding: "18px 16px 96px" }}>
      {boost && boostItem && (
        <button onClick={() => setShowBoost(true)} className="btn-ghost sm"
          style={{ display: "flex", alignItems: "center", gap: 6, margin: "0 auto 10px", background: "#2B140C",
            color: "#EFEEE3", borderColor: "#F2542D" }}>
          🔥 {boostItem.name} activo · {boost.daysLeft} {boost.daysLeft === 1 ? "día" : "días"}</button>)}
      {showBoost && boost && boostItem && (
        <div className="overlay" style={{ background: "rgba(5,7,13,.75)", zIndex: 65, padding: 14 }} onClick={() => setShowBoost(false)}>
          <div className="sheet" style={{ maxWidth: 340, textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 34 }}>🔥</div>
            <div className="ptitle" style={{ fontSize: 15, marginTop: 6 }}>{boostItem.name}</div>
            <div style={{ fontSize: 13, color: "#26291D", marginTop: 4 }}>
              +{Math.round((boost.mult - 1) * 100)}% XP {boost.stat === "ALL" ? "en todos los stats" : boost.stat}</div>
            <div style={{ fontSize: 12.5, color: "#6F7563", marginTop: 4 }}>
              {boost.daysLeft} {boost.daysLeft === 1 ? "cierre de día restante" : "cierres de día restantes"}</div>
            <button className="btn-ghost sm" style={{ width: "100%", marginTop: 14 }} onClick={() => setShowBoost(false)}>Cerrar</button>
          </div>
        </div>)}
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
        {STAT_KEYS.map((k) => {
          const boosted = boost && (boost.stat === k || boost.stat === "ALL");
          return (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontFamily: "'Oswald',sans-serif", width: 34, fontSize: 13 }}>{k}{boosted && " 🔥"}</span>
            <span style={{ fontFamily: "'Oswald',sans-serif", width: 24, fontSize: 14, color: "#16190F", fontWeight: 700 }}>{p.stats[k]}</span>
            <div className="track" style={{ flex: 1 }}>
              <div className="fill" style={{ width: Math.min(100, ((p.xp[k] || 0) / xpToNext(p.stats[k])) * 100) + "%", background: boosted ? "#8A5FD6" : "#CDF546" }} />
            </div>
            <span style={{ fontSize: 10, color: "#9a9e8e", width: 56, textAlign: "right" }}>{p.xp[k] || 0}/{xpToNext(p.stats[k])} XP</span>
          </div>);
        })}
      </div>
    </div>
  );
}

/* ---------- COPIA DE SEGURIDAD ---------- */
function BackupPanel({ getBackup, onRestore }) {
  const [show, setShow] = useState(false);
  const [txt, setTxt] = useState("");
  const [downloaded, setDownloaded] = useState(false);
  const fileRef = useRef();
  /* archivo descargado, no portapapeles: un respaldo largo (muchos días de registro)
     se puede cortar al copiar/pegar entre apps sin avisar; un archivo no tiene ese riesgo */
  const download = () => {
    const t = getBackup();
    const blob = new Blob([t], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `futabita-respaldo-${todayStr()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };
  /* subir el archivo directamente (en vez de pegar su contenido a mano) evita el mismo
     corte silencioso del que ya avisa el comentario de arriba: un respaldo con muchos
     días de registro pega su texto de golpe, sin ese riesgo. */
  const onFile = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onRestore(String(reader.result || ""));
    reader.readAsText(file);
  };
  return (
    <div className="panel" style={{ borderColor: "#B8E02E", borderWidth: 2 }}>
      <div className="ptitle">💾 Copia de seguridad</div>
      <div style={{ fontSize: 12, color: "#6F7563", marginBottom: 10, lineHeight: 1.5 }}>
        Descarga tu partida como archivo y guárdalo donde quieras. Si la app se resetea, sube ese archivo
        en "Restaurar" (o en la pantalla inicial) y recuperas tu carrera entera: stats, temporada, mensajes y misiones.
        (La foto de perfil y el escudo no se incluyen, para no hacer el archivo gigante — tendrás que
        volver a ponerlos a mano si los usabas.)
        Hazlo al final de cada día por seguridad.</div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn-gold sm" style={{ flex: 1 }} onClick={download}>{downloaded ? "✓ ¡Descargado!" : "Descargar respaldo"}</button>
        <button className="btn-ghost sm" style={{ flex: 1 }} onClick={() => setShow(!show)}>Restaurar</button>
      </div>
      {show && (
        <div style={{ marginTop: 8 }}>
          <input ref={fileRef} type="file" accept=".json,application/json" style={{ display: "none" }} onChange={onFile} />
          <button className="btn-gold sm" style={{ width: "100%", marginBottom: 8 }}
            onClick={() => fileRef.current?.click()}>📁 Subir archivo de respaldo</button>
          <div style={{ fontSize: 11, color: "#9a9e8e", textAlign: "center", margin: "0 0 8px" }}>o pega el texto a mano</div>
          <textarea className="inp" rows={4} placeholder="Pega aquí tu respaldo" value={txt} onChange={(e) => setTxt(e.target.value)} />
          <button className="btn-ghost" style={{ width: "100%" }} onClick={() => onRestore(txt)}>Restaurar partida</button>
        </div>)}
    </div>
  );
}

/* Detalle de una carta de personaje: bio + todas sus poses. Las que ya has visto en
   conversación se ven de verdad; las que no, salen en silueta (misma imagen, en negro),
   para dar pistas de que existen sin desvelarlas del todo. */
function CardDetail({ npc, game, onClose }) {
  const def = NPCS[npc];
  const card = CARDS.find((c) => c.npc === npc);
  const seenMoods = game.seenMoods || {};
  /* todas las poses del personaje (idle/happy/... y las que antes eran variantes de zona,
     ahora un mood más del mismo npc, ver NPCS) salen directamente de su propio arts */
  const moods = Object.keys(def.arts || {});
  const defIdx = Math.max(0, moods.indexOf(def.def));
  const [idx, setIdx] = useState(defIdx);
  const mood = moods[idx];
  const isSeen = !!(seenMoods[npc] || {})[mood];
  const move = (d) => setIdx((i) => (i + d + moods.length) % moods.length);
  return (
    <div className="overlay" style={{ background: "rgba(5,7,13,.75)", zIndex: 65, alignItems: "flex-end", padding: 0 }} onClick={onClose}>
      <div className="sheet" style={{ maxHeight: "82vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div className="ptitle" style={{ fontSize: 16, marginBottom: 12, textAlign: "center" }}>{def.name}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          {moods.length > 1 && (
            <button className="btn-ghost sm" style={{ borderRadius: "50%", width: 36, height: 36, padding: 0, flexShrink: 0 }}
              onClick={() => move(-1)} aria-label="Pose anterior">‹</button>)}
          <div style={{ textAlign: "center" }}>
            <img src={def.arts[mood]} alt={isSeen ? mood : "silueta"} style={{ width: 180, height: 250, objectFit: "cover",
              borderRadius: 16, border: "1.5px solid #16190F", filter: isSeen ? "none" : "brightness(0)" }} />
            <div style={{ fontSize: 11, color: "#9a9e8e", marginTop: 6, textTransform: "uppercase", letterSpacing: 1 }}>
              {isSeen ? mood : "???"} {moods.length > 1 && `· ${idx + 1}/${moods.length}`}</div>
          </div>
          {moods.length > 1 && (
            <button className="btn-ghost sm" style={{ borderRadius: "50%", width: 36, height: 36, padding: 0, flexShrink: 0 }}
              onClick={() => move(1)} aria-label="Pose siguiente">›</button>)}
        </div>
        <div style={{ fontSize: 12.5, color: "#6F7563", marginTop: 14, lineHeight: 1.5, textAlign: "center" }}>{card ? card.bio : ""}</div>
      </div>
    </div>);
}

/* ---------- PERFIL / OBJETIVOS ---------- */
function ProfileTab({ game, photo, onWeight, onPhoto, onRemovePhoto, crest, onCrest, onRemoveCrest,
  crestScale, onCrestScale, onGoals, getBackup, onRestore, haptics, onHaptics, voices, onVoices, onOpenCard }) {
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
        <div className="ptitle">🃏 Cartas de personaje</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, borderRadius: 10, overflow: "hidden" }}>
          {CARDS.map((c) => {
            const npc = NPCS[c.npc];
            const on = c.unlocked(game);
            return (
              <button key={c.npc} onClick={() => on && onOpenCard(c.npc)} disabled={!on} aria-label={on ? npc.name : "Carta sin desbloquear"}
                style={{ position: "relative", aspectRatio: "1 / 1", background: "#D8D6C6", border: "none", padding: 0,
                  cursor: on ? "pointer" : "default", overflow: "hidden" }}>
                {on ? (
                  <img src={npc.icon} alt={npc.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 26, color: "#9a9e8e" }}>❓</div>
                )}
              </button>);
          })}
        </div>
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
/* un día "sin uso": se cerró (por la ventana de gracia o manualmente) sin que el jugador
   registrara absolutamente nada — ni comida, ni sueño, ni gym, ni hábitos. No es que el día
   saliera mal, es que la app no se abrió. Se usa para que el calendario (ver CalendarView)
   lo pinte en blanco en vez de rojo/EN CAÍDA, tanto para días nuevos que se cierren así de
   ahora en adelante como para los que ya quedaron guardados así en partidas existentes. */
const isEmptyDayLog = (l) => !!l && (l.kcal || 0) === 0 && (l.prot || 0) === 0 && !l.gym &&
  l.sleep == null && (l.habitsDone || []).length === 0 && (l.meals || []).length === 0;

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
  const [visitedZone, setVisitedZone] = useState(null); // qué zona de la Ciudad estás visitando ahora mismo
  const [showPaper, setShowPaper] = useState(false); // periódico abierto como ventana modal desde el Kiosco
  const [openCard, setOpenCard] = useState(null); // npc de la carta de personaje abierta en la galería
  const [showQuests, setShowQuests] = useState(false); // registro de misiones
  const [showInventory, setShowInventory] = useState(false); // objetos coleccionables
  const saveTimer = useRef();

  const pushToast = (t) => { setToast(t); setTimeout(() => setToast(null), 3200); };
  /* al salir de la pestaña Ciudad, cualquier visita/periódico/registro abierto se cierra */
  useEffect(() => { if (tab !== "chat") { setVisitedZone(null); setShowPaper(false); setShowQuests(false); setShowInventory(false); } }, [tab]);
  /* quién tiene algo pendiente en la zona que estás visitando ahora: se recalcula solo
     en cada render, así que en cuanto se vacía su cola la pantalla pasa sola al cartel
     de "no hay nadie" sin necesidad de un efecto aparte que pueda desincronizarse. */
  /* comprobación extra de bloqueo aquí también (no solo en el clic del mapa): una zona
     bloqueada nunca debe poder "visitarse" aunque algo dejara visitedZone con su id. */
  const visitedZoneObj = visitedZone && game && isZoneUnlocked(game, visitedZone)
    ? ZONES.find((z) => z.id === visitedZone) : null;
  const visitedActiveNpc = visitedZoneObj ? zoneActiveNpc(visitedZoneObj, game ? (game.npcQueue || []) : [], game) : null;
  /* registro mínimo de "última vez que se visitó esta zona" (g.zoneVisits), para objetivos
     de historia tipo "visita X" (ver zoneVisitedSince/BEKA_STORY) — no existía ninguna
     necesidad de esto antes de Beka, así que no se guardaba en ningún sitio. */
  useEffect(() => {
    if (!visitedZoneObj) return;
    const id = visitedZoneObj.id, today = todayStr();
    setGame((g) => {
      if (!g) return g;
      if (g.zoneVisits && g.zoneVisits[id] === today) return g; /* ya registrada hoy: nada que reevaluar */
      /* checkStories también aquí (no solo tras partidos/cierre de día/pesaje): así un
         objetivo de tipo "visita X" se completa en el momento de entrar, no en la
         siguiente acción de juego que por casualidad vuelva a llamar al motor */
      return checkStories(checkZoneUnlocks({ ...g, zoneVisits: { ...(g.zoneVisits || {}), [id]: today } }));
    });
  }, [visitedZoneObj && visitedZoneObj.id]);

  /* mensajes en 2ª persona -> cola de diálogos NPC; 3ª persona -> artículo del periódico.
     Mantiene la firma histórica: los ~20 puntos que llaman addMsg no cambian. */
  /* tope de cola: si el jugador estuvo días sin abrir, no se apilan decenas de diálogos.
     12 y no menos: las escenas narrativas más largas (el prólogo y el final de la campaña
     de Elisa tienen 7 beats) solo llevan applyOnRead en la ÚLTIMA frase, así que con un
     tope más bajo la propia escena se autodesalojaba su primer beat según se iba encolando.
     Las ofertas y los mensajes que confirman un hito (applyOnRead) nunca se descartan: si
     se perdieran, el estado avanzaría sin que el jugador hubiera leído la escena.
     El desalojo se lleva la escena ENTERA (mismo sceneId) de una vez, nunca una frase
     suelta: si solo se descartara la frase encontrada, una escena larga podía perder sus
     primeras frases y dejar solo la última (protegida por su applyOnRead) — el jugador
     entraba a la burbuja y "saltaba" directo al cierre, sin ver el resto de la conversación.
     Muta `q` in situ y devuelve si consiguió liberar algo (false = ya no queda nada
     desalojable, todo lo que hay está protegido). */
  const evictOneForRoom = (q) => {
    const bad = q.find((e) => e.kind !== "offer" && !e.applyOnRead
      && !q.some((o) => e.sceneId && o.sceneId === e.sceneId && o.applyOnRead));
    if (!bad) return false;
    if (bad.sceneId) { for (let i = q.length - 1; i >= 0; i--) if (q[i].sceneId === bad.sceneId) q.splice(i, 1); }
    else q.splice(q.indexOf(bad), 1);
    return true;
  };
  const addMsg = (g, from, text, extra = {}) => {
    const npc = senderToNpc(from);
    if (npc) {
      const q = [...(g.npcQueue || [])];
      /* skipEvict: esta frase es una más de una escena cuyo hueco YA se reservó de golpe
         (ver reserveQueueRoom/addScene). Si se repitiera el desalojo aquí, y no quedara
         nada más que desalojar fuera de la propia escena (cola llena de OTRAS escenas
         protegidas por su propio applyOnRead), la escena en construcción empezaría a
         comerse sus propias frases anteriores otra vez — exactamente el bug que
         reserveQueueRoom existe para evitar. Mejor dejar que la cola supere el tope en
         ese caso raro que romper la escena que se está encolando. */
      if (!extra.skipEvict) while (q.length >= 12 && evictOneForRoom(q)) { /* hueco para el mensaje que entra */ }
      q.push({ id: Date.now() + Math.random(), npc, mood: extra.mood || moodOf(npc, text), text,
        kind: extra.kind, offer: extra.offer, replies: extra.replies, applyOnRead: extra.applyOnRead, zone: extra.zone,
        fish: extra.fish, afterBeats: extra.afterBeats, freeFish: extra.freeFish, sceneId: extra.sceneId });
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
     Solo la ÚLTIMA frase lleva los extras (replies, kind, offer...); la zona (si la escena
     tiene una) va en TODAS las frases, para que la burbuja "+N en espera" de esa zona
     cuente la escena entera y no solo su último mensaje. */
  /* hace hueco para las `n` entradas que van a encolarse juntas. Si el tope se comprobara
     entrada a entrada mientras la escena se construye, sus primeras frases (sin applyOnRead
     todavía, porque esa marca solo la lleva la última) no tendrían nada que las protegiera
     de un desalojo disparado por sus propias frases siguientes: la escena podía
     autodesalojarse a medias antes de terminar de encolarse. */
  const reserveQueueRoom = (g, n) => {
    const q = [...(g.npcQueue || [])];
    while (q.length + n > 12 && evictOneForRoom(q)) { /* sigue haciendo hueco */ }
    return { ...g, npcQueue: q };
  };
  const addScene = (g, from, beats, extra = {}) => {
    const sceneId = extra.sceneId || (beats.length > 1 ? Date.now() + Math.random() : undefined);
    /* preReserved: quien llama ya ha reservado sitio para un bloque mayor que estos beats
       (ver la rama de pesca de queueStageScene, que encola frases + captura como una unidad) */
    let out = extra.preReserved ? g : reserveQueueRoom(g, beats.length);
    /* b.from (ver MILO_STORY): una escena normalmente es "varias frases seguidas del MISMO
       personaje" y usa el "from" de la llamada para todas — pero la campaña de Milo necesita
       que Vera y Milo hablen dentro de la MISMA escena (Vera de intérprete, Milo respondiendo
       directamente). Cada beat puede llevar su propio "from" que pisa el de la escena solo
       para esa línea; sin overrides, el comportamiento de siempre no cambia en nada. */
    beats.forEach((b, i) => {
      out = addMsg(out, b.from || from, b.t, i === beats.length - 1
        ? { mood: b.m, ...extra, sceneId, skipEvict: true } : { mood: b.m, zone: extra.zone, sceneId, skipEvict: true });
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
  /* suelta las visitas de personajes cuya hora ya ha pasado (ver pendingAppearances en
     processNewDays): se llama en cada carga de la app, no solo una vez al día, para que
     cada vez que entres haya opción de encontrarte a alguien nuevo en vez de recibirlas
     todas de golpe la primera vez que abres la app ese día. */
  const releaseDuePending = (g) => {
    const pending = g.pendingAppearances || [];
    if (!pending.length) return g;
    const now = Date.now();
    const due = pending.filter((p) => p.dueAt <= now);
    if (!due.length) return g;
    let out = { ...g, pendingAppearances: pending.filter((p) => p.dueAt > now) };
    const ctx = flavorCtx(out);
    due.forEach((p) => {
      const pool = AMBIENT_BY_CHAR[p.npc];
      const def = NPCS[p.npc];
      /* si la zona donde "vive" este personaje todavía no está desbloqueada, esta
         aparición se descarta en vez de encolar un mensaje sin ningún sitio donde
         leerlo (ver isZoneUnlocked/HOME_ZONE) — no es progreso real que se pierda,
         es solo relleno ambiental provisional (ver AMBIENT_BY_CHAR) */
      if (!pool || !def || !isZoneUnlocked(out, HOME_ZONE[p.npc])) return;
      const filtered = pool.filter((y) => !y.w || (COND[y.w] && COND[y.w](ctx)));
      if (filtered.length) out = playPoolEntry(out, def.name, filtered[Math.floor(Math.random() * filtered.length)], ctx);
    });
    return out;
  };
  /* Vera, modo INSPIRACIÓN LIBRE (ver VERA_FREE_BEATS): mismo patrón día-activo/ausente que
     refreshCocoVisit, pero sin tienda — solo una escena corta que entrega un cuadro genérico
     con applyOnRead.grantItem/reveal (ver applyOnRead más abajo), 1 vez cada 7 días, y solo
     después de completar la campaña (game.veraStoryComplete). */
  const refreshVeraFreeVisit = (g) => {
    if (!g.veraStoryComplete) return g;
    const today = todayStr();
    if (g.veraFreeVisit && g.veraFreeVisit.day === today) return g;
    let nextDay = g.veraNextFreeDay;
    if (g.veraFreeVisit && g.veraFreeVisit.day !== today && !nextDay) nextDay = addDays(g.veraFreeVisit.day, 7);
    if (nextDay && dayDiff(today, nextDay) > 0) {
      return g.veraFreeVisit ? { ...g, veraFreeVisit: null, veraNextFreeDay: nextDay } : g;
    }
    let out = addScene(g, "Vera", VERA_FREE_BEATS, { zone: "parque",
      applyOnRead: { grantItem: "cuadro_generico", reveal: "cuadro_generico" } });
    return { ...out, veraFreeVisit: { day: today }, veraNextFreeDay: addDays(today, 7) };
  };
  /* Alexia, modo infinito post-historia (ver ALEXIA_STORY): mismo patrón día-activo/ausente
     que refreshVeraFreeVisit, pero con el ciclo 1 día activa / 4 ausente que pedía el
     documento (el que tenía Coco en su v1, antes del rework a puesto fijo alterno) —
     solo entrega un cassette de stat al azar (nunca ALL IN, que es recompensa única de
     historia — ver ALEXIA_CASSETTE_POOL), y solo tras completar la campaña
     (game.alexiaStoryComplete). */
  const refreshAlexiaVisit = (g) => {
    if (!g.alexiaStoryComplete) return g;
    const today = todayStr();
    if (g.alexiaVisit && g.alexiaVisit.day === today) return g;
    let nextDay = g.alexiaNextVisitDay;
    if (g.alexiaVisit && g.alexiaVisit.day !== today && !nextDay) nextDay = addDays(g.alexiaVisit.day, 5);
    if (nextDay && dayDiff(today, nextDay) > 0) {
      return g.alexiaVisit ? { ...g, alexiaVisit: null, alexiaNextVisitDay: nextDay } : g;
    }
    const itemId = ALEXIA_CASSETTE_POOL[Math.floor(Math.random() * ALEXIA_CASSETTE_POOL.length)];
    let out = addScene(g, "Alexia", ALEXIA_GREETING, { zone: "atico",
      applyOnRead: { grantItem: itemId, reveal: itemId } });
    return { ...out, alexiaVisit: { day: today }, alexiaNextVisitDay: addDays(today, 5) };
  };
  /* saludo de Coco de los días que está (ver COCO_GREETING): una sola escena por día de
     visita y solo con su campaña ya cerrada — mientras la historia sigue viva son sus
     capítulos los que hablan. game.cocoGreetDay evita repetirlo al reentrar en la zona. */
  const refreshCocoGreeting = (g) => {
    if (!g.cocoStoryComplete || !g.cocoVisit) return g;
    if (g.cocoGreetDay === g.cocoVisit.day) return g;
    const out = addScene(g, "Coco", COCO_GREETING, { zone: COCO_ZONE });
    return { ...out, cocoGreetDay: g.cocoVisit.day };
  };
  /* comprueba si alguna zona de la ciudad se acaba de desbloquear (Karla)
     y, si es la primera vez, encola su escena de presentación. Se llama tras cualquier
     acción que pueda mover el requisito: media, goles de carrera o ascenso de categoría. */
  const checkZoneUnlocks = (g) => {
    let out = refreshAlexiaVisit(refreshCocoGreeting(refreshVeraFreeVisit(refreshCocoVisit(g))));
    [...ZONES, ...EXTRA_NPCS].forEach((z) => {
      if (!z.metFlag || out[z.metFlag] || (out.introQueued && out.introQueued[z.metFlag]) || !z.unlocked(out)) return;
      /* el flag "ya lo conoces" no se marca aquí: se marca cuando el jugador lee la escena
         de verdad (applyOnRead), para no dar por vista una conversación que se perdió */
      const npcKey = Array.isArray(z.npc) ? z.npc[0] : z.npc;
      out = addScene(out, NPCS[npcKey].name, z.intro.map((b) => ({ m: b.m, t: fillTpl(b.t, flavorCtx(out)) })),
        { applyOnRead: { flags: [z.metFlag] } });
      out = { ...out, introQueued: { ...(out.introQueued || {}), [z.metFlag]: true } };
    });
    return out;
  };
  /* motor de misiones: arranca la historia de un personaje cuando toca, avanza de etapa
     cuando se cumple el objetivo (o se agota el plazo) y encola la escena correspondiente.
     El estado de la misión (etapa, "ya empezada") solo se confirma cuando el jugador LEE
     la escena (applyOnRead), no en el momento en que se cumple la condición: así nunca
     aparece una misión "activa" cuya conversación de arranque no ha visto todavía. */
  /* motor de historias: avanza cada personaje por las ETAPAS de su capítulo actual
     (ver STORIES). El progreso es siempre determinista — depende de check(g,snap),
     nunca de la rotación ambiental aleatoria — así que esto encaja tal cual con
     "el azar decide cuándo aparece una escena disponible, nunca si la historia avanza". */
  /* entrar en una etapa desbloquea, en el mismo momento en que se encola su escena, la
     zona donde esa escena transcurre (stage.zone) y cualquier zona extra que la etapa
     quiera abrir de cara a un crossover futuro (stage.alsoUnlock) — así "el personaje te
     espera en X" y "X se desbloquea" son el mismo evento, sin depender de que el jugador
     haya leído todavía el mensaje (no podría llegar a X para leerlo si no). */
  const enterStage = (g, stage) => {
    let out = stage.zone ? unlockZone(g, stage.zone) : g;
    (stage.alsoUnlock || []).forEach((zoneId) => { out = unlockZone(out, zoneId); });
    return out;
  };
  /* encola la escena de una etapa. Si la etapa declara "fish" (ver stage.introBefore/
     introAfter/fish en NINA_STORY), la escena se corta en dos con la secuencia de pesca
     en medio: introBefore se encola como una escena normal y luego una entrada especial
     kind:"fishing" (que la app renderiza como <FishingSequence> en vez de <NpcDialogue>)
     lleva consigo introAfter y el applyOnRead que cerraría la etapa — así el avance de
     la historia no se confirma hasta que el jugador confirma la captura Y lee la
     reacción completa, exactamente igual que cualquier otra escena. */
  const queueStageScene = (out, def, key, stageObj, state, beatsOverride) => {
    const npcName = NPCS[def.npc].name;
    const zone = stageObj.zone;
    if (stageObj.fish) {
      const before = (stageObj.introBefore || []).map((b) => ({ m: b.m, t: fillTpl(b.t, flavorCtx(out)) }));
      const after = (stageObj.introAfter || []).map((b) => ({ m: b.m, t: fillTpl(b.t, flavorCtx(out)) }));
      /* las frases previas y la entrada de pesca son UNA sola escena: comparten sceneId y
         se reserva sitio para el bloque entero de una vez. Si no, el tope de cola podía
         quedarse solo con la parte protegida (la de pesca, la única con applyOnRead) y
         tirar las frases de antes: Nina aparecía lanzando la caña sin haber dicho nada. */
      const sceneId = Date.now() + Math.random();
      out = reserveQueueRoom(out, before.length + 1);
      out = addScene(out, npcName, before, { zone, sceneId, preReserved: true });
      out = addMsg(out, npcName, "", { mood: "lanzandocaña", kind: "fishing", zone, sceneId, skipEvict: true,
        fish: stageObj.fish, afterBeats: after, applyOnRead: { story: { key, state }, flags: stageObj.setFlags,
          grantItem: stageObj.grantItem, reveal: stageObj.reveal } });
      return out;
    }
    /* revelado de objeto a mitad de escena (ver YUNA_STORY 3.0): mismo corte en dos que el
       caso "fish" de arriba pero sin minijuego en medio — el primer tramo (introBefore)
       termina justo en el gesto de entrega y su applyOnRead SOLO otorga el objeto
       (grantItem/reveal), así que la pantalla de objeto conseguido aparece en el instante
       exacto en que se lee esa línea. El segundo tramo (introAfter, con las respuestas del
       jugador) es el que de verdad avanza la historia: su applyOnRead lleva el story/flags,
       así que el progreso de la misión no se confirma hasta que el jugador también termine
       de leer eso y elija una respuesta. Comparten sceneId para que la burbuja "+N en
       espera" cuente la escena completa como una unidad, igual que en el caso "fish". */
    if (stageObj.midReveal) {
      /* introBuild (ver ELISA_STORY 3.0) también se admite aquí, aplicado al tramo
         introBefore: permite que YUNA_STORY sustituya una línea de afinidad del capítulo 5
         (C6) sin necesitar un mecanismo aparte del que ya usan las etapas normales. */
      const beforeSrc = (stageObj.introBuild && stageObj.introBuild(out)) || stageObj.introBefore;
      const before = beforeSrc.map((b) => ({ m: b.m, t: fillTpl(b.t, flavorCtx(out)) }));
      const after = stageObj.introAfter.map((b) => ({ m: b.m, t: fillTpl(b.t, flavorCtx(out)) }));
      const sceneId = Date.now() + Math.random();
      out = reserveQueueRoom(out, before.length + after.length);
      out = addScene(out, npcName, before, { zone, sceneId, preReserved: true,
        applyOnRead: { grantItem: stageObj.midReveal, reveal: stageObj.midReveal } });
      out = addScene(out, npcName, after, { zone, sceneId, preReserved: true, replies: stageObj.replies,
        applyOnRead: { story: { key, state }, flags: stageObj.setFlags } });
      return out;
    }
    const beats = (beatsOverride || stageObj.intro).map((b) => ({ m: b.m, t: fillTpl(b.t, flavorCtx(out)), from: b.from }));
    /* grantItem/reveal (ver VERA_STORY): a diferencia de reward(), que checkStories dispara
       en el momento en que se CUMPLE el objetivo (antes de que el jugador haya leído nada),
       esto viaja dentro de applyOnRead y por tanto solo se aplica cuando el jugador de
       verdad lee la última frase de la escena — así Vera "te da" el cuadro durante la
       conversación, no en un popup que salta solo al cerrar el día. */
    return addScene(out, npcName, beats, { zone, replies: stageObj.replies,
      applyOnRead: { story: { key, state }, flags: stageObj.setFlags,
        grantItem: stageObj.grantItem, reveal: stageObj.reveal } });
  };
  const checkStories = (g) => {
    let out = g;
    const stories = { ...(out.stories || {}) };
    const pending = { ...(out.storyPending || {}) };
    Object.entries(STORIES).forEach(([key, def]) => {
      if (pending[key]) return; /* ya hay una escena suya esperando a leerse, no dupliques */
      let st = stories[key];
      const chapterIdx = st ? st.chapter : 0;
      const chapter = def.chapters[chapterIdx];
      if (!chapter) return; /* ya completó todos los capítulos que existen por ahora */
      /* sin estado todavía, o el capítulo actual avanzó pero aún no ha arrancado su
         primera etapa (stage -1): en ambos casos toca comprobar el trigger de ESTE capítulo */
      if (!st || st.stage === -1) {
        if (!chapter.trigger(out)) return;
        const s0 = chapter.stages[0];
        const state = { chapter: chapterIdx, stage: 0, snap: s0.snap ? s0.snap(out) : {}, startDay: todayStr() };
        out = enterStage(out, s0);
        out = queueStageScene(out, def, key, s0, state, s0.introBuild ? s0.introBuild(out) : null);
        pending[key] = true;
        return;
      }
      if (st.done) return;
      const stage = chapter.stages[st.stage];
      const deadlineHit = stage.deadlineDays && dayDiff(st.startDay, todayStr()) > stage.deadlineDays;
      if (!stage.check(out, st.snap) && !deadlineHit) return;
      const failed = deadlineHit && !stage.check(out, st.snap);
      const nextIdx = st.stage + 1;
      const next = chapter.stages[nextIdx];
      /* última etapa del capítulo: si hay otro capítulo detrás, este queda "completado"
         de fondo y el siguiente se evaluará (con su propio trigger) en un día futuro;
         si no hay más capítulos, la historia entera queda done */
      const chapterDone = !!next.final;
      const hasNextChapter = chapterDone && !failed && !!def.chapters[chapterIdx + 1];
      const state = hasNextChapter
        ? { chapter: chapterIdx + 1, stage: -1, snap: {}, startDay: todayStr() } /* -1: aún no ha empezado su primera etapa */
        : { chapter: chapterIdx, stage: nextIdx, snap: next.snap ? next.snap(out) : {}, startDay: todayStr(), done: chapterDone, failed };
      const beats = failed && next.introFail ? next.introFail : (next.introBuild ? next.introBuild(out) : next.intro);
      out = enterStage(out, next);
      out = queueStageScene(out, def, key, next, state, beats);
      pending[key] = true;
      if (chapterDone && next.reward && !failed) out = next.reward(out);
    });
    out.storyPending = pending;
    out.stories = stories;
    return out;
  };

  /* aplica lo que una escena "confirma" solo al leerla de verdad: flags de "ya conoces a X"
     y/o el arranque o avance de una misión. Así el estado nunca se adelanta a la conversación.
     grantItem/reveal: usados por la entrega semanal de Vera (ver refreshVeraFreeVisit), que no
     pasa por STORIES/reward — añade el objeto al inventario y marca qué cuadro debe mostrar la
     pantalla grande (ver game.pendingCuadroReveal/CuadroReveal) solo al leer la escena de verdad. */
  const applyOnRead = (g, patch) => {
    if (!patch) return g;
    let out = g;
    if (patch.flags) { const f = {}; patch.flags.forEach((k) => (f[k] = true)); out = { ...out, ...f }; }
    if (patch.story) out = { ...out,
      stories: { ...(out.stories || {}), [patch.story.key]: patch.story.state },
      /* libera el "esperando lectura": si no, checkStories se saltaría esta historia para siempre */
      storyPending: { ...(out.storyPending || {}), [patch.story.key]: false } };
    if (patch.grantItem) { const inv = { ...(out.inventory || {}) }; inv[patch.grantItem] = (inv[patch.grantItem] || 0) + 1; out = { ...out, inventory: inv }; }
    if (patch.reveal) out = { ...out, pendingCuadroReveal: patch.reveal };
    return out;
  };
  /* cola de diálogos: avanzar, elegir respuesta, resolver oferta */
  const advanceNpc = (id) => setGame((g) => {
    const e = (g.npcQueue || []).find((x) => x.id === id);
    let out = applyOnRead(g, e && e.applyOnRead);
    /* marca esa pose como "ya vista" para la carta de personaje, en cuanto el jugador
       de verdad lee el mensaje (no al encolarlo, para que la silueta sea sincera) */
    if (e && e.npc && e.mood) {
      const seen = { ...(out.seenMoods || {}) };
      seen[e.npc] = { ...(seen[e.npc] || {}), [e.mood]: true };
      out = { ...out, seenMoods: seen };
    }
    return { ...out, npcQueue: (out.npcQueue || []).filter((x) => x.id !== id) };
  });
  const answerChoice = (id, idx) => setGame((g) => {
    const q = g.npcQueue || [];
    const e = q.find((x) => x.id === id);
    if (!e || !e.replies || !e.replies[idx]) return g;
    const opt = e.replies[idx];
    /* si la escena con réplicas es de una historia (ver checkStories: replies puede ir
       en la última frase junto a applyOnRead), confirmar aquí el progreso guardado en esa
       frase — si no, se perdía en cuanto el jugador elegía una opción, porque la entrada
       original se descarta a continuación y la respuesta nueva no lleva applyOnRead. */
    let out = applyOnRead(g, e.applyOnRead);
    /* la réplica del personaje entra al frente de la cola, con su propia expresión.
       "r" admite dos formatos: array de strings (una sola frase, se elige una al azar con
       pick() — formato clásico de Yuna/Karla, útil para variar el texto) o array de beats
       {m,t} (varias frases seguidas, cada una con su propio mood — lo que necesita
       ELISA_STORY 3.0, donde una respuesta del jugador puede llevar 2-3 frases con cambios
       de expresión, igual que cualquier otra escena). Sin tocar nada, el formato antiguo
       sigue funcionando exactamente igual. */
    const lines = typeof opt.r[0] === "string"
      ? [{ m: opt.m || "happy", t: pick(opt.r) }]
      : opt.r.map((b) => ({ m: b.m || opt.m || "happy", t: b.t }));
    const resp = lines.map((b) => ({ id: Date.now() + Math.random(), npc: e.npc, mood: b.m, text: b.t }));
    out = { ...out, npcQueue: [...resp, ...q.filter((x) => x.id !== id)] };
    /* algunas respuestas dejan una marca que otro personaje puede recordar más adelante
       (p.ej. le cuentas un secreto a Milly y luego Yuna "se entera" por su cuenta) */
    if (opt.setFlag) out[opt.setFlag] = true;
    /* algunas respuestas también regalan un objeto de colección (ver ITEMS) */
    if (opt.giveItem) out = { ...out, inventory: { ...(out.inventory || {}), [opt.giveItem]: ((out.inventory || {})[opt.giveItem] || 0) + 1 } };
    return out;
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
  /* confirma una captura de pesca (ver FishingSequence): añade el pez al inventario como
     un objeto normal y, si la captura venía con una reacción de Nina pendiente
     (afterBeats — historia narrativa) o marca de pesca libre (freeFish), la resuelve aquí
     mismo. Solo se llama al click del jugador en la pantalla de captura: nunca al
     encolar la escena, para que reproducir/perder una escena no pueda duplicar el pez. */
  const resolveFishing = (id) => setGame((g) => {
    const q = g.npcQueue || [];
    const e = q.find((x) => x.id === id);
    if (!e || e.kind !== "fishing") return g;
    const inv = { ...(g.inventory || {}) };
    inv[e.fish.id] = (inv[e.fish.id] || 0) + 1;
    let out = { ...g, inventory: inv, npcQueue: q.filter((x) => x.id !== id) };
    if (e.freeFish) out.ninaFishDay = todayStr();
    if (e.afterBeats && e.afterBeats.length) out = addScene(out, "Nina", e.afterBeats, { zone: e.zone, applyOnRead: e.applyOnRead });
    else if (e.applyOnRead) out = applyOnRead(out, e.applyOnRead);
    return out;
  });
  /* pesca libre diaria (ver ZonaScreen "🎣 Pescar", desbloqueada tras BEKA... NINA_STORY):
     mismo mecanismo que la escena narrativa (una entrada kind:"fishing" en la cola), pero
     con el pez elegido al azar por rareza en vez de determinista, y sin reacción de Nina
     detrás (afterBeats vacío: la captura se cierra sola al confirmarla). */
  const freeFish = () => {
    if (game.ninaFishDay === todayStr()) return;
    const fishId = pickWeightedFish();
    setGame((g) => addMsg(g, "Nina", "", { mood: "lanzandocaña", kind: "fishing", zone: "playa",
      fish: { id: fishId, rarity: ITEMS[fishId].rarity }, afterBeats: [], freeFish: true }));
  };
  /* compra a Coco (ver CocoShop): revalida sold/fichas contra el estado MÁS RECIENTE
     dentro del propio setGame (no el "game" ya renderizado), para que un doble click no
     pueda cobrar/entregar el mismo slot dos veces — ver sección 13 del documento. */
  const buyFromCoco = (slotIdx) => {
    const visit = game.cocoVisit;
    if (!visit) return;
    const slot = visit.products[slotIdx];
    if (!slot || slot.sold) return;
    if ((game.fichas || 0) < slot.price) { pushToast("No tienes fichas suficientes."); return; }
    const it = ITEMS[slot.id];
    setGame((g) => {
      const v = g.cocoVisit;
      const s = v && v.products[slotIdx];
      if (!v || !s || s.sold || (g.fichas || 0) < s.price) return g;
      const products = v.products.map((p, i) => (i === slotIdx ? { ...p, sold: true } : p));
      const inv = { ...(g.inventory || {}) };
      inv[s.id] = (inv[s.id] || 0) + 1;
      const log = [{ type: "buy", itemId: s.id, price: s.price, day: todayStr(), zone: v.zone, visitDay: v.day },
        ...(g.cocoLog || [])].slice(0, 30);
      return checkStories(checkZoneUnlocks({ ...g, fichas: g.fichas - s.price, inventory: inv,
        cocoVisit: { ...v, products }, cocoLog: log }));
    });
    pushToast(`✅ Comprado: ${it.name} · 🪙 -${slot.price}`);
    const reaction = slot.price <= 35 ? "Hoy te lo estoy dejando casi regalado."
      : slot.price <= 50 ? "Un precio bastante razonable." : "Es difícil de conseguir. No pongas esa cara.";
    setTimeout(() => pushToast(`💬 Coco: «${reaction}»`), 900);
    buzz(15);
  };
  /* vende a Coco: price ya viene rolado y confirmado desde CocoShop (ver rollSellPrice),
     así el número mostrado en la confirmación y el que se cobra son siempre el mismo. */
  const sellToCoco = (itemId, qty, price) => {
    if (!game.cocoVisit) return;
    if (((game.inventory || {})[itemId] || 0) < qty) return;
    const it = ITEMS[itemId];
    const rareSold = it.kind === "fish" && ["raro", "epico", "legendario"].includes(it.rarity);
    setGame((g) => {
      const cur = (g.inventory || {})[itemId] || 0;
      if (cur < qty) return g;
      const inv = { ...g.inventory, [itemId]: cur - qty };
      if (inv[itemId] <= 0) delete inv[itemId];
      const total = price * qty;
      const v = g.cocoVisit;
      const log = [{ type: "sell", itemId, price: total, day: todayStr(), zone: v ? v.zone : null, visitDay: v ? v.day : null },
        ...(g.cocoLog || [])].slice(0, 30);
      let out = checkStories(checkZoneUnlocks({ ...g, inventory: inv, fichas: (g.fichas || 0) + total, cocoLog: log }));
      if (rareSold) out = addMsg(out, "Coco", "¡Vaya! No esperaba que trajeras algo así.", { mood: "sorprendida" });
      return out;
    });
    pushToast(`✅ Vendido: ${it.name} ×${qty} · 🪙 +${price * qty}`);
    buzz(15);
  };

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
        const { boost, next } = consumeBoostDay(out.activeBoost);
        const r = applyDayClose(out.player, log, d, boost);
        out.player = r.player;
        out.activeBoost = next;
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
      /* Milly te trae el periódico en persona cada día que hay edición nueva: esto es un
         sistema aparte (ligado al Kiosco/NEWS), no la rotación ambiental de más abajo */
      const mp = MILLY_PAPER_LINES.filter((y) => !y.w || (COND[y.w] && COND[y.w](c)));
      out = playPoolEntry(out, "Milly", mp[Math.floor(Math.random() * mp.length)], c);
      /* breves del día: 2-3 líneas cortas de prensa/afición/redes/club */
      const brevs = pickFlavor(out, 2 + Math.round(Math.random()), ["press", "fan", "social", "club"]);
      brevs.forEach((fv) => { out = addMsg(out, fv.from, fv.text); });
      out.recentTpl = [...(out.recentTpl || []), ...brevs.map((m) => m.t).filter(Boolean)].slice(-12);
      /* rotación AMBIENTE: 3-4 personajes conocidos, elegidos con el mismo peso cada uno,
         para que no se queden mudos entre capítulos de su historia real (ver checkStories,
         que ya encola sus escenas de progreso de forma determinista, sin pasar por aquí).
         Un personaje con una escena de historia pendiente hoy no entra en este sorteo,
         para no duplicar su turno. Contenido PROVISIONAL, ver comentario sobre AMBIENT_*. */
      {
        const storyPending = out.storyPending || {};
        /* "conocido" ya no basta por sí solo: hace falta además que su zona esté
           desbloqueada (ver releaseDuePending) — Elisa y López antes entraban aquí
           sin comprobar nada porque su historia se dispara el día 1 y normalmente
           desbloquea su zona en la misma pasada, pero eso era una coincidencia de
           orden de ejecución, no una garantía */
        const known = {
          yuna: !!out.yunaMet && isZoneUnlocked(out, HOME_ZONE.yuna),
          elisa: isZoneUnlocked(out, HOME_ZONE.elisa),
          lopez: isZoneUnlocked(out, HOME_ZONE.lopez),
          lisa: !!out.metLisa && isZoneUnlocked(out, HOME_ZONE.lisa),
          igor: !!out.metIgor && isZoneUnlocked(out, HOME_ZONE.igor),
        };
        const names = Object.keys(AMBIENT_BY_CHAR).filter((k) => known[k] && !storyPending[k]);
        const shuffled = [...names].sort(() => Math.random() - 0.5);
        const target = Math.min(names.length, 3 + Math.floor(Math.random() * 2)); /* 3 o 4 personajes hoy */
        /* no se encolan ya mismo: se reparten a lo largo del día (ver releaseDuePending),
           para que cada vez que abras la app haya opción de encontrarte a alguien nuevo
           en vez de recibir las 3-4 visitas de golpe al primer vistazo del día */
        const now = Date.now();
        const endOfDay = new Date(); endOfDay.setHours(23, 30, 0, 0);
        const windowMs = Math.max(30 * 60 * 1000, endOfDay.getTime() - now);
        const pending = shuffled.slice(0, target)
          .map((npc) => ({ npc, dueAt: Math.round(now + Math.random() * windowMs) }))
          .sort((a, b) => a.dueAt - b.dueAt);
        out.pendingAppearances = [...(out.pendingAppearances || []), ...pending];
      }
    }
    out = releaseDuePending(out);
    return checkStories(checkZoneUnlocks(out));
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
      /* Milly te trae el periódico de hoy en persona (ver comentario junto a
         MILLY_PAPER_LINES): la primera presentación real ya la gestiona su propia
         historia (ver MILLY_STORY, chapter.trigger:()=>true, se evalúa al final de esta
         misma función vía checkStories) — aquí solo se asegura de que el día del fichaje
         tenga su edición, sin repetir un saludo de "primera vez" que ya no le corresponde. */
      {
        const c = flavorCtx(out);
        const mp = MILLY_PAPER_LINES.filter((y) => !y.w || (COND[y.w] && COND[y.w](c)));
        out = playPoolEntry(out, "Milly", mp[Math.floor(Math.random() * mp.length)], c);
      }
      if (viaTransfer && tierId > g.tier.id) buzz([30, 40, 60]);
      if (viaTransfer && tierId > g.tier.id && !g.firstRiseDone) {
        out.firstRiseDone = true;
        out = addMsg(out, "Tu agente",
          "Tu primer salto de categoría. 📈 El primero de muchos. Firmé contigo por días como hoy — disfrútalo.");
      }
      return checkStories(checkZoneUnlocks(out));
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
      /* la primera aparición de Yuna (justo tras tu primer gol de carrera) ya la gestiona
         su propia historia (ver YUNA_STORY: chapter.trigger espera careerGoals(g) > 0),
         que se evalúa al final de esta misma función vía checkStories. */
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
        out.careerLog = [...out.careerLog, { season: s.num, pos, club: g.club.name, c1: g.club.c1, c2: g.club.c2, league: g.tier.league,
          text: `${pos}º con ${g.club.name} · ${goals} goles · media ${avgR}` }];
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
      return checkStories(checkZoneUnlocks(out));
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
  const deleteSavedMeal = (name) => setGame((g) => ({ ...g, savedMeals: (g.savedMeals || []).filter((m) => m.name !== name) }));
  /* sobre diario del Casino (ver FUTABITA_Sistema_Cartas_y_Sobres_Code.docx): sustituye a
     la antigua ruleta de +5..20 fichas — el documento pide eliminar esa recompensa directa
     y convertir el Casino en la fuente diaria de sobres/cartas. La carta se elige y se
     entrega aquí mismo (game.pendingSobreReveal guarda qué tocó y si era nueva o repetida);
     <SobreReveal>, montada a nivel de App, solo se encarga de la animación y de que el
     jugador tenga que tocar para continuar antes de dar la escena por vista. */
  const openSobre = () => {
    if (game.sobreDay === todayStr()) return; /* ya se ha abierto hoy, botón no debería ni estar visible */
    const cardId = pick(CARD_POOL);
    const isNew = !isCardDiscovered(game, cardId);
    setGame((g) => {
      const inv = { ...(g.inventory || {}) };
      inv[cardId] = (inv[cardId] || 0) + 1;
      const discovered = { ...(g.cardsDiscovered || {}), [cardId]: true };
      return { ...g, sobreDay: todayStr(), inventory: inv, cardsDiscovered: discovered,
        pendingSobreReveal: { id: cardId, isNew } };
    });
    buzz(15);
  };
  /* usar un objeto consumible: XP a la stat indicada (o una al azar si stat:"random") y se gasta */
  const useItem = (itemId) => setGame((g) => {
    const def = ITEMS[itemId];
    if (!def || def.kind !== "consumable" || !(g.inventory || {})[itemId]) return g;
    const stat = def.stat === "random" ? pick(["FIS", "FUE", "RES", "NUT", "REC", "MEN"]) : def.stat;
    const p = g.player;
    const stats = { ...p.stats }, xp = { ...p.xp };
    xp[stat] = (xp[stat] || 0) + def.xp;
    let upped = false;
    while (stats[stat] < 99 && xp[stat] >= xpToNext(stats[stat])) { xp[stat] -= xpToNext(stats[stat]); stats[stat] += 1; upped = true; }
    const inv = { ...g.inventory, [itemId]: g.inventory[itemId] - 1 };
    if (inv[itemId] <= 0) delete inv[itemId];
    if (upped) setTimeout(() => pushToast(`📈 ¡${stat} sube a ${stats[stat]}!`), 700);
    pushToast(`✅ ${def.name} usado · +${def.xp} XP ${stat}`);
    /* cuenta simple de consumos, solo para el objetivo "compra un consumible y
       consúmelo" de COCO_STORY (ver stage.check del capítulo 6) */
    return { ...g, inventory: inv, player: { ...p, stats, xp }, itemsUsedCount: (g.itemsUsedCount || 0) + 1 };
  });
  /* regalar un objeto: reacción del destinatario en su cola de diálogos + se gasta */
  const giveItemTo = (itemId) => setGame((g) => {
    const def = ITEMS[itemId];
    if (!def || def.kind !== "gift" || !(g.inventory || {})[itemId]) return g;
    const inv = { ...g.inventory, [itemId]: g.inventory[itemId] - 1 };
    if (inv[itemId] <= 0) delete inv[itemId];
    const reaction = ITEM_GIVE_REACTIONS[def.giveTo];
    let out = { ...g, inventory: inv };
    if (reaction) out = addMsg(out, NPCS[reaction.npc].name, reaction.text, { mood: "happy" });
    return out;
  });
  /* activar un cassette (ver ITEMS kind:"cassette"/game.activeBoost/applyDayClose): no se
     gasta al activarlo — es una colección, no un consumible, y el documento deja claro que
     "el jugador puede guardarlos para usarlos más adelante". Solo puede haber un boost
     activo a la vez; sustituir uno ya en marcha lo decide el jugador antes de llamar a esto
     (ver InventoryPanel, que pide confirmación si ya hay otro activo). */
  const activateCassette = (itemId) => setGame((g) => {
    const def = ITEMS[itemId];
    if (!def || def.kind !== "cassette" || !(g.inventory || {})[itemId]) return g;
    pushToast(`🔥 ${def.name} activado · ${def.boostDays} días`);
    buzz([20, 30, 20]);
    return { ...g, activeBoost: { itemId, stat: def.boostStat, mult: def.boostMult, daysLeft: def.boostDays } };
  });
  const addWeight = (kg) => { setGame((g) => {
    const p = g.player;
    const stats = { ...p.stats }, xp = { ...p.xp };
    xp.MEN = (xp.MEN || 0) + 8;
    let upped = false;
    while (stats.MEN < 99 && xp.MEN >= xpToNext(stats.MEN)) { xp.MEN -= xpToNext(stats.MEN); stats.MEN += 1; upped = true; }
    if (upped) setTimeout(() => pushToast("🧠 ¡MEN sube a " + stats.MEN + "! Cabeza fría, crack"), 600);
    return checkStories(checkZoneUnlocks({ ...g, player: { ...p, stats, xp,
      weightLog: [...p.weightLog, { d: todayStr(), kg }] } }));
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
        sets, restUntil: null, restLen: gy.restDefault || 150 } };
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
          restUntil: marcando ? Date.now() + (a.restLen || 150) * 1000 : a.restUntil } };
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
    const { boost, next } = consumeBoostDay(g.activeBoost);
    const r = applyDayClose(g.player, log, dateStr, boost);
    let out = { ...g, player: r.player, activeBoost: next, logs: { ...g.logs, [dateStr]: { ...log, closed: true, pct: r.pct, form: r.form } } };
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
    return checkStories(checkZoneUnlocks(out));
  });

  /* respaldo manual (independiente del almacenamiento automático) */
  /* la foto de perfil y el escudo van como imagen en base64: ocupan muchísimo texto
     y no aportan nada a la partida en sí, así que se quedan fuera del respaldo */
  const getBackup = () => JSON.stringify({ v: 1, game });
  const restoreBackup = (txt) => {
    try {
      const b = JSON.parse(txt.trim());
      /* además de player, se comprueban los campos que el resto de la app da por hecho
         sin fallback (club.name, tier.league, season.num...): un archivo que no sea de
         verdad un respaldo de FUTABITA (o uno corrupto) debe rechazarse aquí, ANTES de
         guardarlo, porque si llega a setGame la pantalla se queda en blanco y ya no hay
         forma de volver a abrir "Restaurar" para intentarlo con el archivo correcto. */
      if (!b.game || !b.game.player || !b.game.player.stats || !b.game.club || !b.game.club.name ||
        !b.game.tier || !b.game.tier.league || !b.game.season || b.game.season.num == null) throw new Error("bad");
      const g = processNewDays(sanitizeGame(b.game));
      setGame(g); stSet("game", g);
      if (b.photo) savePhoto(b.photo);
      if (b.crest) saveCrest(b.crest);
      if (b.crestScale) saveCrestScale(b.crestScale);
      setTab("home");
      pushToast("✓ Carrera restaurada. ¡Bienvenido de vuelta!");
    } catch (e) { pushToast("✗ Ese archivo no es un respaldo válido de FUTABITA"); }
  };

  if (!loaded || !game) return (
    <div className="screen" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
      <div className="ball-wrap">
        <div className="ball">⚽</div>
        <div className="ball-shadow" />
      </div>
      <div style={{ color: "#16190F", fontFamily: "'Oswald',sans-serif", letterSpacing: 4, fontSize: 15 }}>FUTABITA 3.1</div>
    </div>);

  /* aviso en la pestaña Ciudad: diálogos en cola + la edición de hoy sin leer.
     Red de seguridad: un mensaje cuya zona (explícita o la "home" del personaje)
     no esté desbloqueada nunca debería llegar a encolarse (ver enterStage/
     releaseDuePending), pero si alguno se colara igualmente — partida antigua,
     estado manipulado a mano, etc. — no debe sumar al número: si no hay ninguna
     burbuja donde leerlo, tampoco debe existir el aviso de que hay algo pendiente. */
  const unreadTotal = (game.npcQueue || [])
    .filter((e) => isZoneUnlocked(game, e.zone || HOME_ZONE[e.npc])).length +
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
              onDeleteSaved={deleteSavedMeal}
              notify={pushToast} onGoGym={() => setTab("gym")} onAddNote={addNote} onDelNote={delNote} />}
            {tab === "gym" && <GymTab game={game} api={gymApi} notify={pushToast} />}
            {tab === "league" && <LeagueTab game={game} onPlayMatch={playMatch} crest={crest} crestScale={crestScale} />}
            {tab === "chat" && (
              <CityMap game={game} onVisit={setVisitedZone} zones={ZONES} vb={CITY_MAP_VB}
                svgSrc="/images/city-map.svg" mapLabel="La Ciudad" />)}
            {tab === "me" && <ProfileTab game={game} photo={photo} onWeight={addWeight} onPhoto={savePhoto} onRemovePhoto={removePhoto}
              crest={crest} onCrest={saveCrest} onRemoveCrest={removeCrest} crestScale={crestScale} onCrestScale={saveCrestScale}
              onGoals={setGoals} getBackup={getBackup} onRestore={restoreBackup} haptics={haptics} onHaptics={setHapticsPref}
              voices={voicesOn} onVoices={setVoicesPref} onOpenCard={setOpenCard} />}
          </div>
          <nav className="tabbar">
            {[["home", "🏠", "Inicio"], ["log", "📝", "Registro"], ["gym", "🏋️", "Gym"], ["league", "🏆", "Liga"], ["chat", "🏙️", "Ciudad"], ["me", "👤", "Yo"]].map(([id, ic, lb]) => (
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
      {/* carta de personaje: overlay a nivel de App (fuera de .tab-in), por el mismo motivo
          que el diálogo de personaje más abajo: el contenedor de pestañas anima un transform
          y eso rompe position:fixed en los hijos si se dibuja dentro de él. */}
      {openCard && <CardDetail npc={openCard} game={game} onClose={() => setOpenCard(null)} />}
      {/* pantalla grande de entrega de cuadro de Vera (ver CuadroReveal/pendingCuadroReveal):
          nivel de App como el resto de overlays de esta lista, no depende de qué pestaña o
          zona esté abierta porque el reward() que la dispara puede ocurrir en cualquier
          momento (ver checkStories/applyOnRead). */}
      {game.pendingCuadroReveal && (
        <CuadroReveal itemId={game.pendingCuadroReveal}
          onClose={() => setGame((g) => ({ ...g, pendingCuadroReveal: null }))} />)}
      {/* apertura del sobre diario del Casino (ver openSobre/SobreReveal): mismo criterio
          de montaje que CuadroReveal, a nivel de App y no dentro de ZoneScreen — así sigue
          visible aunque el jugador pulse "Volver" mientras dura la animación. */}
      {game.pendingSobreReveal && (
        <SobreReveal reveal={game.pendingSobreReveal}
          onClose={() => setGame((g) => ({ ...g, pendingSobreReveal: null }))} />)}
      {/* visitar una zona: fondo a toda pantalla + flecha para volver */}
      {tab === "chat" && visitedZoneObj && (
        <ZoneScreen zone={visitedZoneObj} pendingNpc={visitedActiveNpc} game={game}
          onBack={() => setVisitedZone(null)} onOpenPaper={() => setShowPaper(true)} onOpenSobre={openSobre} onFish={freeFish}
          onBuyCoco={buyFromCoco} onSellCoco={sellToCoco} />)}
      {/* diálogo de personaje: overlay a nivel de App (fuera de .tab-in), aparece encima
          del fondo de la zona en cuanto hay alguien esperando ahí (visitedActiveNpc).
          Agrupar por sceneId (no por npc): una escena normal es de un solo personaje y esto
          no cambia nada, pero MILO_STORY necesita que Vera y Milo hablen dentro de la MISMA
          escena (ver addScene/b.from) — filtrar por "npc === visitedActiveNpc" partía esa
          escena en dos bloques (todas las líneas de Vera primero, luego todas las de Milo),
          perdiendo el ida y vuelta real de la conversación. Agrupando por sceneId se respeta
          el orden de inserción real sea cual sea el número de personajes que participan. */}
      {tab === "chat" && visitedActiveNpc && (() => {
        const zq = (game.npcQueue || []).filter((e) => entryMatchesZone(e, visitedZoneObj.id));
        const q = zq.length && zq[0].sceneId ? zq.filter((e) => e.sceneId === zq[0].sceneId) : zq.slice(0, 1);
        if (!q.length) return null;
        /* secuencia de pesca de Nina: mismo hueco en la cola que un mensaje normal (kind
           "fishing", ver queueStageScene/addMsg), pero se renderiza con su propio
           componente en vez de NpcDialogue — solo-lectura hasta que el jugador confirma
           la captura con un click (ver resolveFishing). */
        if (q[0].kind === "fishing") return <FishingSequence entry={q[0]} onConfirm={resolveFishing} />;
        return (
          <NpcDialogue entry={q[0]} queueLeft={q.length}
            onAdvance={advanceNpc} onChoice={answerChoice} onOffer={answerOffer} />);
      })()}
      {tab === "chat" && showPaper && (
        <PaperModal game={game} onRead={markPaperRead} onClose={() => setShowPaper(false)} />)}
      {tab === "chat" && !visitedZone && !showPaper && (
        <div className="quest-fab-wrap">
          <button className="quest-fab" onClick={() => setShowQuests(true)} aria-label="Misiones">📜</button>
          <button className="quest-fab" onClick={() => setShowInventory(true)} aria-label="Inventario">🎒</button>
        </div>)}
      {tab === "chat" && showQuests && (
        <QuestPanel game={game} onClose={() => setShowQuests(false)} storiesRegistry={STORIES} />)}
      {tab === "chat" && showInventory && (
        <InventoryPanel game={game} onClose={() => setShowInventory(false)} onUseItem={useItem} onGiveItem={giveItemTo}
          onActivateCassette={activateCassette} />)}
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
      .chip-fav { display:flex; align-items:stretch; padding:0; overflow:hidden; }
      .chip-fav-btn { background:none; border:none; color:inherit; font:inherit; cursor:pointer; padding:7px 6px 7px 13px; }
      .chip-fav-del { background:none; border:none; border-left:1.5px solid rgba(20,23,14,.16); color:#9a9e8e;
        font-size:11px; padding:7px 10px; cursor:pointer; line-height:1; }
      .chip-fav-del:hover { color:#E14B4B; }
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
      /* --- misiones (ver QuestPanel): retrato grande sin recorte circular, toca la imagen
         para repetir la cinemática de la etapa activa (mismo startReplay de siempre) --- */
      .quest-card { display:flex; gap:14px; align-items:stretch; background:#FDFDF8;
        border:1.5px solid rgba(20,23,14,.1); border-radius:16px; padding:10px; margin-top:10px; }
      .quest-portrait { position:relative; width:88px; height:88px; flex-shrink:0; border-radius:12px;
        overflow:hidden; border:1.5px solid rgba(20,23,14,.14); padding:0; background:#E4E3D5; }
      .quest-portrait-img { width:100%; height:100%; object-fit:cover; display:block; }
      .quest-portrait-btn { cursor:pointer; }
      .quest-replay-hint { position:absolute; right:4px; bottom:4px; width:22px; height:22px; border-radius:50%;
        background:rgba(5,7,13,.62); color:#EFEEE3; font-size:13px; line-height:22px; text-align:center; }
      .quest-body { flex:1; min-width:0; display:flex; flex-direction:column; justify-content:center; gap:2px; }
      .quest-chapter { font-family:'Oswald',sans-serif; font-size:14.5px; color:#16190F; }
      .quest-stage { font-size:12px; color:#6F7563; }
      .quest-objective { font-size:13px; color:#26291D; margin-top:3px; line-height:1.4; }
      .quest-status { font-size:12.5px; font-weight:600; margin-top:2px; }
      .quest-track-row { display:flex; align-items:center; gap:8px; margin-top:7px; }
      .quest-track { flex:1; }
      .quest-pct { font-family:'Oswald',sans-serif; font-size:11px; color:#7A7F62; width:32px; text-align:right; flex-shrink:0; }
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
      /* botón de misiones: mismo truco de centrado que la tabbar (para alinearse con ella
         sin importar el ancho de viewport), pero el botón en sí solo ocupa la izquierda */
      .quest-fab-wrap { position:fixed; bottom:78px; left:50%; transform:translateX(-50%);
        width:calc(100% - 20px); max-width:460px; display:flex; justify-content:flex-start; gap:10px;
        z-index:35; pointer-events:none; }
      .quest-fab { pointer-events:auto; width:52px; height:52px; border-radius:50%; background:#16190F;
        color:#CDF546; border:2px solid #CDF546; font-size:22px; display:flex; align-items:center;
        justify-content:center; cursor:pointer; box-shadow:0 6px 16px rgba(20,23,14,.4); }
      /* --- visitar una zona: fondo a toda pantalla --- */
      .zone-screen { position:fixed; inset:0; z-index:25; background:#16190F; overflow:hidden; }
      .zone-bg-img, .zone-bg-fallback { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
      .zone-shade { position:absolute; inset:0; background:linear-gradient(to bottom, rgba(5,7,13,.55) 0%, rgba(5,7,13,.05) 22%, rgba(5,7,13,.1) 60%, rgba(5,7,13,.75) 100%); }
      .zone-back { position:fixed; top:14px; left:14px; z-index:2; background:rgba(16,18,8,.75); color:#EFEEE3;
        border:1.5px solid rgba(239,238,227,.4); border-radius:20px; padding:9px 16px; font-size:13px;
        font-family:'Oswald',sans-serif; letter-spacing:.5px; cursor:pointer; }
      .zone-label { position:fixed; top:16px; left:50%; transform:translateX(-50%); z-index:1; color:#EFEEE3;
        font-family:'Oswald',sans-serif; font-size:13px; letter-spacing:2px; text-transform:uppercase;
        text-shadow:0 2px 8px rgba(0,0,0,.6); }
      .zone-empty-card { position:fixed; left:50%; bottom:18%; transform:translateX(-50%); z-index:2;
        background:rgba(16,18,8,.82); color:#EFEEE3; padding:16px 22px; border-radius:18px; text-align:center;
        max-width:78%; font-size:13.5px; line-height:1.5; border:1.5px solid rgba(239,238,227,.25); }
      .zone-paper-btn { border:1.5px solid #CDF546; cursor:pointer; font-family:'Oswald',sans-serif;
        letter-spacing:1px; font-size:14px; }
      /* --- Tu Casa: vitrina de trofeos + estadísticas de carrera --- */
      .house-room { position:fixed; left:50%; bottom:90px; transform:translateX(-50%); z-index:2;
        width:88%; max-width:360px; max-height:60vh; overflow-y:auto; display:flex; flex-direction:column; gap:10px; }
      .house-card { background:rgba(16,18,8,.85); border:1.5px solid rgba(239,238,227,.25); border-radius:16px; padding:14px; }
      .house-title { color:#CDF546; font-family:'Oswald',sans-serif; font-size:13px; letter-spacing:1px; margin-bottom:10px; }
      .house-trophies { display:flex; flex-wrap:wrap; gap:12px; }
      .house-trophy { display:flex; flex-direction:column; align-items:center; }
      .house-stats { display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; }
      .house-stat { text-align:center; background:rgba(239,238,227,.06); border-radius:10px; padding:8px 4px; }
      .house-stat b { display:block; font-family:'Oswald',sans-serif; font-size:16px; color:#EFEEE3; }
      .house-stat span { font-size:10px; color:#9a9e8e; }
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
      /* --- secuencia de pesca de Nina (ver FishingSequence) --- */
      .fishing-ov { position:fixed; inset:0; z-index:30; display:flex; flex-direction:column;
        align-items:center; justify-content:center; gap:22px;
        background:radial-gradient(ellipse at 50% 20%, #0E3A4A, #05070d 78%); cursor:pointer; }
      .fishing-pose { display:flex; align-items:center; justify-content:center; }
      /* animación propia, NO npcin: aquella lleva incrustado un translateX(-50%) porque
         .npc-art se centra con position:absolute + left:50%. La pose de pesca se centra
         con flexbox, así que ese -50% la desplazaba media anchura a la izquierda (y con
         fill-mode:both se quedaba ahí, cortada por el borde). */
      .fishing-pose-img { max-height:52vh; max-width:80vw; object-fit:contain;
        filter:drop-shadow(0 14px 30px rgba(0,0,0,.6)); animation:fishingin .3s cubic-bezier(.2,1.2,.4,1) both; }
      @keyframes fishingin { from { opacity:0; transform:translateY(24px) scale(.96); }
        to { opacity:1; transform:translateY(0) scale(1); } }
      .fishing-pose-fallback { width:150px; height:150px; border-radius:50%; background:#2E9EC9;
        display:flex; align-items:center; justify-content:center; font-family:'Oswald',sans-serif; font-size:64px; color:#fff; }
      .fishing-shake .fishing-pose-img { animation:fishingshake .35s ease-in-out infinite; }
      @keyframes fishingshake { 0%,100% { transform:rotate(0deg) translateX(0); }
        25% { transform:rotate(-3deg) translateX(-4px); } 75% { transform:rotate(3deg) translateX(4px); } }
      .fishing-hint { font-family:'Oswald',sans-serif; font-size:13px; letter-spacing:2px; color:#EFEEE3;
        text-transform:uppercase; opacity:.85; }
      .fishing-reveal .fishing-hint { animation:npccaret 1s ease-in-out infinite; }
      .fishing-catch-card { position:relative; display:flex; flex-direction:column; align-items:center;
        gap:6px; animation:fishpop .5s cubic-bezier(.2,1.4,.4,1) both; }
      @keyframes fishpop { from { opacity:0; transform:scale(.6); } to { opacity:1; transform:scale(1); } }
      .fishing-glow { position:absolute; top:50%; left:50%; width:280px; height:280px;
        transform:translate(-50%,-50%); border-radius:50%; background:radial-gradient(circle, var(--fish-glow) 0%, transparent 70%);
        opacity:.5; filter:blur(6px); animation:fishglow 1.8s ease-in-out infinite; pointer-events:none; }
      @keyframes fishglow { 0%,100% { opacity:.35; transform:translate(-50%,-50%) scale(1); }
        50% { opacity:.6; transform:translate(-50%,-50%) scale(1.08); } }
      .fishing-fish-img { position:relative; z-index:1; max-height:34vh; max-width:78vw; object-fit:contain;
        filter:drop-shadow(0 10px 26px rgba(0,0,0,.55)); }
      .fishing-fish-name { position:relative; z-index:1; font-family:'Oswald',sans-serif; font-size:20px;
        letter-spacing:1px; color:#EFEEE3; margin-top:4px; }
      .fishing-fish-rarity { position:relative; z-index:1; font-family:'Oswald',sans-serif; font-size:11.5px;
        letter-spacing:2px; text-transform:uppercase; border:1.5px solid; border-radius:20px; padding:3px 14px; }
      /* --- entrega de cuadros de Vera (ver CuadroReveal) --- */
      .cuadro-reveal-ov { position:fixed; inset:0; z-index:30; display:flex; flex-direction:column;
        align-items:center; justify-content:center; gap:22px;
        background:radial-gradient(ellipse at 50% 20%, #241A3A, #05070d 78%); cursor:pointer; }
      .cuadro-reveal-card { position:relative; display:flex; flex-direction:column; align-items:center;
        gap:8px; animation:fishpop .5s cubic-bezier(.2,1.4,.4,1) both; }
      .cuadro-reveal-glow { position:absolute; top:50%; left:50%; width:320px; height:320px;
        transform:translate(-50%,-50%); border-radius:50%; background:radial-gradient(circle, var(--cuadro-glow) 0%, transparent 70%);
        opacity:.5; filter:blur(6px); animation:fishglow 1.8s ease-in-out infinite; pointer-events:none; }
      .cuadro-reveal-img { position:relative; z-index:1; max-height:44vh; max-width:82vw; object-fit:contain;
        border-radius:6px; filter:drop-shadow(0 14px 30px rgba(0,0,0,.6)); }
      .cuadro-reveal-big .cuadro-reveal-img { max-height:52vh; }
      .cuadro-reveal-name { position:relative; z-index:1; font-family:'Oswald',sans-serif; font-size:20px;
        letter-spacing:1px; color:#EFEEE3; margin-top:4px; text-align:center; }
      .cuadro-reveal-sub { position:relative; z-index:1; font-family:'Oswald',sans-serif; font-size:11.5px;
        letter-spacing:1.5px; text-transform:uppercase; color:#8A6FD6; text-align:center; }
      .cuadro-reveal-hint { animation:npccaret 1s ease-in-out infinite; }
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
      .item-ico-img { width:32px; height:32px; object-fit:cover; border-radius:10px; flex-shrink:0; cursor:zoom-in; }
      .inv-slot { position:relative; aspect-ratio:1; background:#F0EFE5; border:1.5px solid rgba(20,23,14,.08);
        border-radius:14px; display:flex; align-items:center; justify-content:center; padding:10px; cursor:pointer; }
      .inv-slot-img { width:100%; height:100%; object-fit:cover; border-radius:9px; }
      .inv-slot-qty { position:absolute; bottom:4px; right:4px; font-family:'Oswald',sans-serif; font-size:10px;
        color:#26291D; background:rgba(239,238,227,.92); border-radius:6px; padding:1px 5px; line-height:1.3; }
      .item-lightbox { display:flex; flex-direction:column; align-items:center; gap:12px; background:#EFEEE3;
        border-radius:22px; padding:26px 22px; max-width:320px; width:88%; }
      .item-lightbox-img { width:100%; max-width:220px; aspect-ratio:1; object-fit:contain; border-radius:18px;
        background:#FDFDF8; border:1.5px solid rgba(20,23,14,.1); }
      .item-lightbox-name { font-family:'Oswald',sans-serif; font-size:16px; color:#16190F; text-align:center; }
      .item-lightbox-desc { font-size:12.5px; color:#4A4E3F; line-height:1.5; text-align:center; }
      .fade-seq { opacity:0; animation:fadeup .9s ease forwards; }
      @keyframes fadeup { from { opacity:0; transform:translateY(14px);} to { opacity:1; transform:none; } }
      .toast { position:fixed; bottom:84px; left:50%; transform:translateX(-50%); background:#16190F; color:#EFEEE3;
        border:1.5px solid #CDF546; border-radius:14px; padding:10px 16px; font-size:13px; z-index:80;
        animation:pop .3s ease both; max-width:90%; text-align:center; }
      /* --- la ciudad: mapa dibujado (SVG propio) + capa de zonas encima --- */
      .city-wrap { position:relative; width:100%; margin:6px 0 30px; line-height:0; }
      .city-empty { display:flex; align-items:center; justify-content:center; min-height:50vh; }
      .city-empty-card { line-height:1.5; text-align:center; color:#6F7563; font-size:13.5px;
        background:#F0EFE5; border-radius:16px; padding:26px 22px; max-width:260px; }
      .city-bg-img { display:block; width:100%; height:auto; }
      .city-coins { position:absolute; top:10px; right:10px; z-index:3; line-height:1.4;
        background:rgba(22,25,15,.78); color:#EFEEE3; font-family:'Oswald',sans-serif; font-size:13px;
        font-weight:600; padding:5px 11px; border-radius:20px; border:1.5px solid rgba(205,245,70,.5); }
      .city-overlay { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; }
      .city-lockshape { pointer-events:auto; cursor:pointer; }
      /* pointer-events:auto no basta con fill transparent (el SVG solo cuenta el área
         pintada); "all" fuerza a que toda la silueta sea clicable aunque sea invisible */
      .city-clickshape { cursor:pointer; }
      .city-clickshape polygon, .city-clickshape circle { pointer-events:all; }
      .city-lockfill { fill:#8b8878; opacity:.82; }
      .city-locktxt { font-size:34px; pointer-events:none; }
      /* El Barrio no tiene edificio propio que pintar de gris: su candado va suelto y más pequeño */
      .city-locktxt.small { font-size:20px; }
      /* ancla de tamaño cero: la burbuja se centra por su cuenta con su propio transform */
      .city-zone { position:absolute; width:0; height:0; z-index:2; }
      .city-bubble { position:absolute; left:0; top:0; transform:translate(-50%,-50%);
        width:58px; height:58px; border-radius:50%; background:#FFFFFF; border:2px solid #16190F;
        display:flex; align-items:center; justify-content:center; overflow:hidden; padding:0;
        cursor:pointer; box-shadow:0 4px 0 rgba(20,23,14,.35); flex-shrink:0; }
      .city-bubble.big { width:80px; height:80px; border-width:2.5px; box-shadow:0 5px 0 rgba(20,23,14,.35); }
      .city-bubble.pend { animation:citybob 1.15s ease-in-out infinite; }
      /* la animación tiene que arrastrar el translate(-50%,-50%) del centrado en cada frame:
         una keyframe reemplaza el transform entero, no lo suma al de la regla base */
      @keyframes citybob { 0%,100% { transform:translate(-50%,-50%) translateY(0); } 50% { transform:translate(-50%,-50%) translateY(-10px); } }
      .city-ico-img { width:100%; height:100%; object-fit:cover; background:#FFFFFF; display:block; }
      .city-ico-emoji { font-size:27px; }
      .city-bubble.big .city-ico-emoji { font-size:36px; }
      /* siempre centrado en horizontal respecto al mapa entero (no a la zona tocada),
         para que nunca se corte si el candado está pegado al borde izquierdo o derecho */
      .city-req { position:absolute; left:50%; transform:translateX(-50%); background:#16190F; color:#EFEEE3; font-size:10.5px;
        line-height:1.35; padding:6px 10px; border-radius:10px; width:160px; text-align:center; z-index:6;
        animation:pop .25s ease both; box-shadow:0 6px 16px rgba(20,23,14,.4); }
      @media (prefers-reduced-motion: reduce) { .city-bubble.pend { animation:none !important; } }
      @media (prefers-reduced-motion: reduce) { .fut-shine, .fade-seq, .official-flash, .card-drop, .pop-in, .event-in { animation:none !important; opacity:1 !important; } }
    `}</style>
  );
}
