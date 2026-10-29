#!/usr/bin/env node
// Client minimo per Google Cloud Vertex AI (Gemini immagine, Veo), usato dalla skill /generate
// come fornitore PRIMARIO. Nessuna dipendenza: il token OAuth si ottiene da un account di
// servizio (JWT firmato con node:crypto) oppure da `gcloud auth print-access-token`.
//
// Configurazione (ambiente o .env nella radice del repo, vedi .env.example):
//   VERTEX_API_KEY                          chiave API di Vertex AI (modalità express): la via più semplice
//   GOOGLE_CLOUD_PROJECT                    ID del progetto GCP (solo con account di servizio o gcloud)
//   GOOGLE_CLOUD_REGION                     predefinita "global" per le immagini, "us-central1" per Veo
//   GOOGLE_APPLICATION_CREDENTIALS          percorso del JSON dell'account di servizio (in locale)
//   GOOGLE_APPLICATION_CREDENTIALS_JSON     contenuto del JSON (per il cloud, dove non ci sono file)
//   GEMINI_API_KEY                          solo immagini, via Gemini API (vedi note nella ricetta)
//
// Uso:
//   node vertex.mjs stato
//   node vertex.mjs esiste <modello>
//   node vertex.mjs immagine --modello <id> --prompt "..." --out <file> [--aspect 16:9] [--ref file.png ...]
//   node vertex.mjs video --modello <id> --prompt "..." --out <file.mp4> [--durata 8] [--aspect 16:9]
//                         [--risoluzione 720p] [--immagine file.png] [--senza-audio] [--attesa 1200]
//   node vertex.mjs attendi <nomeOperazione> --modello <id> --out <file.mp4> [--attesa 1200]
//
// Codici di uscita (la skill li legge per decidere il fallback):
//   0   riuscito (JSON su stdout)
//   10  FALLBACK CONSENTITO: quota/limite esaurito, timeout, modello non supportato o non trovato
//   3   video ancora in lavorazione allo scadere dell'attesa: riprova con `attendi`, NON è un errore
//   1   ogni altro errore (configurazione/credenziali mancanti, permessi, filtro di sicurezza,
//       richiesta non valida): NON si passa ad altri fornitori, si riferisce al titolare

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const SCOPE = "https://www.googleapis.com/auth/cloud-platform";

class Esito extends Error {
  constructor(codice, tipo, messaggio) { super(messaggio); this.codice = codice; this.tipo = tipo; }
}
const fallback = (tipo, msg) => new Esito(10, tipo, msg);
const errore = (tipo, msg) => new Esito(1, tipo, msg);

// ---- configurazione ------------------------------------------------------------------------

let envFile = null;
function leggi(nome) {
  if (process.env[nome]) return process.env[nome];
  if (envFile === null) {
    try { envFile = fs.readFileSync(path.join(ROOT, ".env"), "utf8"); } catch { envFile = ""; }
  }
  const m = envFile.match(new RegExp(`^${nome}=(.*)$`, "m"));
  const v = m && m[1].trim().replace(/^["']|["']$/g, "");
  return v || null;
}

function credenzialiServizio() {
  const inline = leggi("GOOGLE_APPLICATION_CREDENTIALS_JSON");
  const file = leggi("GOOGLE_APPLICATION_CREDENTIALS");
  let testo = inline;
  if (!testo && file) {
    try { testo = fs.readFileSync(file, "utf8"); }
    catch { throw errore("config", `GOOGLE_APPLICATION_CREDENTIALS punta a un file non leggibile: ${file}`); }
  }
  if (!testo) return null;
  try {
    const j = JSON.parse(testo);
    if (!j.client_email || !j.private_key) throw new Error("mancano client_email o private_key");
    return j;
  } catch (e) { throw errore("config", `JSON dell'account di servizio non valido: ${e.message}`); }
}

const b64url = (b) => Buffer.from(b).toString("base64url");

async function tokenDaServizio(sa) {
  const ora = Math.floor(Date.now() / 1000);
  const corpo = `${b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64url(JSON.stringify({
    iss: sa.client_email, scope: SCOPE, aud: sa.token_uri || "https://oauth2.googleapis.com/token", iat: ora, exp: ora + 3600,
  }))}`;
  const firma = crypto.createSign("RSA-SHA256").update(corpo).sign(sa.private_key);
  const r = await rete(sa.token_uri || "https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${corpo}.${b64url(firma)}` }),
  }, 30);
  if (!r.ok) throw errore("auth", `scambio del token rifiutato (HTTP ${r.status}): ${r.testo.slice(0, 200)}`);
  return JSON.parse(r.testo).access_token;
}

function tokenDaGcloud() {
  try {
    return execFileSync("gcloud", ["auth", "print-access-token"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 20000 }).trim() || null;
  } catch { return null; }
}

async function accesso() {
  const sa = credenzialiServizio();
  if (sa) return { metodo: "account di servizio", token: await tokenDaServizio(sa) };
  const k = leggi("VERTEX_API_KEY");
  if (k) return { metodo: "chiave API Vertex", chiave: k };
  const g = tokenDaGcloud();
  if (g) return { metodo: "gcloud", token: g };
  return null;
}

function progetto() {
  const p = leggi("GOOGLE_CLOUD_PROJECT");
  if (!p) throw errore("config", "manca GOOGLE_CLOUD_PROJECT (ID del progetto Google Cloud): vedi .env.example");
  return p;
}

const host = (reg) => (reg === "global" ? "https://aiplatform.googleapis.com" : `https://${reg}-aiplatform.googleapis.com`);
// Con la chiave API (modalità express) l'indirizzo non ha progetto né regione.
const urlModello = (reg, modello, azione, acc) => acc?.chiave
  ? `https://aiplatform.googleapis.com/v1/publishers/google/models/${modello}:${azione}`
  : `${host(reg)}/v1/projects/${progetto()}/locations/${reg}/publishers/google/models/${modello}:${azione}`;
const intest = (acc) => (acc?.chiave ? { "x-goog-api-key": acc.chiave } : {});

// ---- rete e classificazione degli errori ---------------------------------------------------

async function rete(url, opt = {}, secondi = 120) {
  try {
    const r = await fetch(url, { ...opt, signal: AbortSignal.timeout(secondi * 1000) });
    return { ok: r.ok, status: r.status, testo: await r.text() };
  } catch (e) {
    if (e.name === "TimeoutError" || e.name === "AbortError" || /ETIMEDOUT|UND_ERR_(CONNECT_)?TIMEOUT|timed out/i.test(`${e.code} ${e.cause?.code} ${e.message}`))
      throw fallback("timeout", `nessuna risposta da Google Cloud entro ${secondi} s`);
    throw errore("rete", `chiamata a Google Cloud non riuscita: ${e.cause?.code || e.message}`);
  }
}

// Traduce una risposta d'errore di Google nelle tre cause che autorizzano il fallback, o in errore.
function classifica(r) {
  let e = {};
  try { e = JSON.parse(r.testo).error || {}; } catch {}
  const stato = e.status || "";
  const msg = (e.message || r.testo || "").slice(0, 300);
  if (r.status === 429 || stato === "RESOURCE_EXHAUSTED" || /quota|rate limit|too many requests/i.test(msg))
    return fallback("quota", `quota o limite di richieste esaurito (HTTP ${r.status}): ${msg}`);
  if (r.status === 504 || r.status === 408 || stato === "DEADLINE_EXCEEDED")
    return fallback("timeout", `Google Cloud è andato in timeout (HTTP ${r.status}): ${msg}`);
  if (r.status === 404 || stato === "NOT_FOUND" ||
      (r.status === 400 && /not supported|unsupported|publisher model|model.*(not found|does not exist)/i.test(msg)))
    return fallback("modello-non-supportato", `modello non supportato o non trovato in questa regione/progetto (HTTP ${r.status}): ${msg}`);
  if (r.status === 401 || r.status === 403 || stato === "PERMISSION_DENIED" || stato === "UNAUTHENTICATED")
    return errore("permessi", `credenziali o permessi rifiutati (HTTP ${r.status}): ${msg}`);
  return errore("richiesta", `errore di Google Cloud (HTTP ${r.status}): ${msg}`);
}

async function chiama(url, token, corpo, secondi, extra = {}) {
  const r = await rete(url, {
    method: corpo === undefined ? "GET" : "POST",
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), "Content-Type": "application/json", ...extra },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  }, secondi);
  if (!r.ok) throw classifica(r);
  try { return JSON.parse(r.testo); } catch { throw errore("richiesta", `risposta non JSON: ${r.testo.slice(0, 200)}`); }
}

// ---- argomenti -----------------------------------------------------------------------------

function args(argv) {
  const o = { _: [], ref: [] };
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith("--")) { o._.push(argv[i]); continue; }
    const k = argv[i].slice(2);
    const v = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
    if (k === "ref") o.ref.push(v); else o[k] = v;
  }
  return o;
}
const richiesto = (a, k) => { if (!a[k] || a[k] === true) throw errore("uso", `manca --${k}`); return a[k]; };
const MIME = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };
function fileInline(p) {
  const mime = MIME[path.extname(p).toLowerCase()];
  if (!mime) throw errore("uso", `formato immagine non supportato: ${p}`);
  return { mimeType: mime, data: fs.readFileSync(p).toString("base64") };
}
function scrivi(out, base64) {
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  fs.writeFileSync(out, Buffer.from(base64, "base64"));
}

// ---- comandi -------------------------------------------------------------------------------

async function stato() {
  const r = { progetto: leggi("GOOGLE_CLOUD_PROJECT"), regione: leggi("GOOGLE_CLOUD_REGION") || "(predefinita: global immagini, us-central1 video)",
    credenziali: null, gemini_api_key: !!leggi("GEMINI_API_KEY"), pronto_vertex: false, mancano: [] };
  const acc = await accesso().catch((e) => { r.mancano.push(`credenziali non valide: ${e.message}`); return null; });
  if (acc) r.credenziali = acc.metodo;
  else if (!r.mancano.some((m) => m.startsWith("credenziali"))) r.mancano.push("VERTEX_API_KEY");
  if (acc && !acc.chiave && !r.progetto) r.mancano.push("GOOGLE_CLOUD_PROJECT (serve con account di servizio o gcloud, non con la chiave)");
  r.pronto_vertex = !!(acc && (acc.chiave || r.progetto));
  console.log(JSON.stringify(r, null, 1));
  if (!r.pronto_vertex && !r.gemini_api_key) process.exitCode = 1;
}

// Controllo gratuito: il modello esiste nel catalogo Google? (non genera nulla, non costa)
async function esiste(modello) {
  const acc = await accesso();
  if (!acc) throw errore("config", "nessuna credenziale Google Cloud: vedi .env.example");
  const j = await chiama(`https://aiplatform.googleapis.com/v1beta1/publishers/google/models/${modello}`, acc.token, undefined, 30, intest(acc));
  console.log(JSON.stringify({ modello, trovato: true, nome: j.name, stato: j.launchStage || j.versionState || null }));
}

async function immagine(a) {
  const modello = richiesto(a, "modello"), out = richiesto(a, "out"), prompt = richiesto(a, "prompt");
  const reg = leggi("GOOGLE_CLOUD_REGION") || "global";
  const parti = [...a.ref.map((p) => ({ inlineData: fileInline(p) })), { text: prompt }];
  const corpo = {
    contents: [{ role: "user", parts: parti }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"], ...(a.aspect ? { imageConfig: { aspectRatio: a.aspect } } : {}) },
  };
  let j;
  const acc = await accesso();
  if (acc) {
    j = await chiama(urlModello(reg, modello, "generateContent", acc), acc.token, corpo, 120, intest(acc));
  } else if (leggi("GEMINI_API_KEY")) {
    j = await chiama(`https://generativelanguage.googleapis.com/v1beta/models/${modello}:generateContent`, "", corpo, 120, { "x-goog-api-key": leggi("GEMINI_API_KEY") });
  } else {
    throw errore("config", "nessuna credenziale Google Cloud (account di servizio, gcloud o GEMINI_API_KEY): vedi .env.example");
  }
  const bloc = j.promptFeedback?.blockReason;
  if (bloc) throw errore("sicurezza", `prompt bloccato dal filtro di Google (${bloc}): non è un caso di fallback`);
  const cand = j.candidates?.[0];
  const img = cand?.content?.parts?.find((p) => (p.inlineData || p.inline_data)?.data);
  if (!img) throw errore("sicurezza", `nessuna immagine restituita (finishReason: ${cand?.finishReason || "assente"}): non è un caso di fallback`);
  const dati = img.inlineData || img.inline_data;
  scrivi(out, dati.data);
  console.log(JSON.stringify({ file: out, mime: dati.mimeType || dati.mime_type, modello, via: acc ? `Vertex AI (${acc.chiave ? "express" : reg}, ${acc.metodo})` : "Gemini API (chiave)", progetto: acc && !acc.chiave ? progetto() : null }));
}

async function sondaVideo(nomeOp, modello, out, reg, attesa) {
  const acc = await accesso();
  const fine = Date.now() + attesa * 1000;
  for (;;) {
    const j = await chiama(urlModello(reg, modello, "fetchPredictOperation", acc), acc.token, { operationName: nomeOp }, 60, intest(acc));
    if (j.done) {
      if (j.error) throw classifica({ status: j.error.code === 8 ? 429 : j.error.code === 5 ? 404 : 400, testo: JSON.stringify({ error: { message: j.error.message, status: j.error.code === 8 ? "RESOURCE_EXHAUSTED" : "" } }) });
      const v = j.response?.videos?.[0];
      if (!v) {
        const filtrati = j.response?.raiMediaFilteredReasons;
        throw errore("sicurezza", `nessun video restituito${filtrati ? ` (filtro: ${filtrati.join("; ")})` : ""}: non è un caso di fallback`);
      }
      if (v.bytesBase64Encoded) { scrivi(out, v.bytesBase64Encoded); }
      else throw errore("richiesta", `il video è stato salvato su Cloud Storage (${v.gcsUri || "?"}) invece di tornare nella risposta: non previsto da questo script`);
      console.log(JSON.stringify({ file: out, mime: v.mimeType || "video/mp4", modello, via: `Vertex AI (${acc.chiave ? "express" : reg}, ${acc.metodo})`, progetto: acc.chiave ? null : progetto(), operazione: nomeOp }));
      return;
    }
    if (Date.now() > fine) {
      console.log(JSON.stringify({ stato: "in-lavorazione", operazione: nomeOp, modello, nota: "il video continua a generarsi (e a costare): riprova con `attendi`. Il fallback è consentito solo se resta bloccato dopo due attese complete" }));
      process.exit(3);
    }
    await new Promise((r) => setTimeout(r, 10000));
  }
}

async function video(a) {
  const modello = richiesto(a, "modello"), out = richiesto(a, "out"), prompt = richiesto(a, "prompt");
  const reg = leggi("GOOGLE_CLOUD_REGION") && leggi("GOOGLE_CLOUD_REGION") !== "global" ? leggi("GOOGLE_CLOUD_REGION") : "us-central1";
  const acc = await accesso();
  if (!acc) throw errore("config", "per i video serve VERTEX_API_KEY o un account di servizio (la sola GEMINI_API_KEY non basta): vedi .env.example");
  const istanza = { prompt };
  if (a.immagine) { const f = fileInline(a.immagine); istanza.image = { bytesBase64Encoded: f.data, mimeType: f.mimeType }; }
  const parametri = { sampleCount: 1, aspectRatio: a.aspect || "16:9", durationSeconds: Number(a.durata) || 8, generateAudio: !a["senza-audio"] };
  if (a.risoluzione) parametri.resolution = a.risoluzione;
  const j = await chiama(urlModello(reg, modello, "predictLongRunning", acc), acc.token, { instances: [istanza], parameters: parametri }, 60, intest(acc));
  if (!j.name) throw errore("richiesta", `risposta senza nome dell'operazione: ${JSON.stringify(j).slice(0, 200)}`);
  console.error(`operazione avviata: ${j.name}`);
  await sondaVideo(j.name, modello, out, reg, Number(a.attesa) || 1200);
}

async function attendi(a) {
  const reg = leggi("GOOGLE_CLOUD_REGION") && leggi("GOOGLE_CLOUD_REGION") !== "global" ? leggi("GOOGLE_CLOUD_REGION") : "us-central1";
  if (!(await accesso())) throw errore("config", "nessuna credenziale Google Cloud: vedi .env.example");
  await sondaVideo(richiesto({ x: a._[1] }, "x"), richiesto(a, "modello"), richiesto(a, "out"), reg, Number(a.attesa) || 1200);
}

async function main() {
  const a = args(process.argv.slice(2));
  const cmd = a._[0];
  if (cmd === "stato") await stato();
  else if (cmd === "esiste") await esiste(a._[1] || richiesto(a, "modello"));
  else if (cmd === "immagine") await immagine(a);
  else if (cmd === "video") await video(a);
  else if (cmd === "attendi") await attendi(a);
  else throw errore("uso", "comandi: stato | esiste <modello> | immagine ... | video ... | attendi <operazione> ...");
}

main().catch((e) => {
  if (e instanceof Esito) {
    console.error(JSON.stringify({ errore: e.tipo, fallback_consentito: e.codice === 10, dettaglio: e.message }));
    process.exit(e.codice);
  }
  console.error(JSON.stringify({ errore: "interno", fallback_consentito: false, dettaglio: e.message }));
  process.exit(1);
});
