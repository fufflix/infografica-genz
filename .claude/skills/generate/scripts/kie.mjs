#!/usr/bin/env node
// Client minimo per Kie AI (https://docs.kie.ai), usato dalla skill /generate.
// Chiave: variabile KIE_API_KEY (ambiente o .env nella radice del repo). Se manca,
// la richiesta parte senza intestazione: funziona solo se il proxy dell'ambiente
// inietta la credenziale per api.kie.ai (segreto di rete).
//
// Uso:
//   node kie.mjs crediti
//   node kie.mjs crea '<json corpo createTask: {"model":"...","input":{...}}>'
//   node kie.mjs stato <taskId>
//   node kie.mjs attendi <taskId> [secondi_max=900]     (interroga ogni 10 s)
//   node kie.mjs carica <file-locale>                   (URL pubblico valido 24 ore)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const API = "https://api.kie.ai";
const UPLOAD = "https://kieai.redpandaai.co";

function chiave() {
  if (process.env.KIE_API_KEY) return process.env.KIE_API_KEY;
  try {
    const m = fs.readFileSync(path.join(ROOT, ".env"), "utf8").match(/^KIE_API_KEY=(.+)$/m);
    if (m) return m[1].trim();
  } catch {}
  return null;
}

function intestazioni(json = true) {
  const h = {};
  const k = chiave();
  if (k) h.Authorization = `Bearer ${k}`;
  if (json) h["Content-Type"] = "application/json";
  return h;
}

// Kie risponde HTTP 200 anche sugli errori: conta il campo "code" del corpo.
async function chiama(url, opt = {}) {
  const r = await fetch(url, opt);
  const testo = await r.text();
  let j;
  try { j = JSON.parse(testo); } catch { throw new Error(`risposta non JSON (HTTP ${r.status}): ${testo.slice(0, 200)}`); }
  if (j.code !== 200) throw new Error(`Kie code ${j.code}: ${j.msg || "errore"}${j.code === 401 ? " (chiave mancante o non valida)" : ""}`);
  return j.data;
}

function risultato(d) {
  let res = null;
  try { res = d.resultJson ? JSON.parse(d.resultJson) : null; } catch {}
  return {
    taskId: d.taskId, model: d.model, stato: d.state,
    urls: res?.resultUrls || res?.data?.result_urls || [],
    crediti: d.creditsConsumed ?? null,
    errore: d.state === "fail" ? `${d.failCode || ""} ${d.failMsg || ""}`.trim() : null,
  };
}

async function main() {
  const [cmd, a, b] = process.argv.slice(2);
  if (cmd === "crediti") {
    const d = await chiama(`${API}/api/v1/chat/credit`, { headers: intestazioni(false) });
    console.log(JSON.stringify({ crediti: d, usd: Math.round(d * 0.005 * 1000) / 1000 }));
  } else if (cmd === "crea") {
    const corpo = JSON.parse(a);
    const d = await chiama(`${API}/api/v1/jobs/createTask`, { method: "POST", headers: intestazioni(), body: JSON.stringify(corpo) });
    console.log(JSON.stringify({ taskId: d.taskId }));
  } else if (cmd === "stato") {
    const d = await chiama(`${API}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(a)}`, { headers: intestazioni(false) });
    console.log(JSON.stringify(risultato(d)));
  } else if (cmd === "attendi") {
    const fine = Date.now() + (Number(b) || 900) * 1000;
    for (;;) {
      const d = await chiama(`${API}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(a)}`, { headers: intestazioni(false) });
      if (d.state === "success" || d.state === "fail") { console.log(JSON.stringify(risultato(d))); if (d.state === "fail") process.exit(2); return; }
      if (Date.now() > fine) { console.log(JSON.stringify({ taskId: a, stato: d.state, nota: "tempo scaduto: il lavoro continua, riprova con 'attendi'" })); process.exit(3); }
      await new Promise((r) => setTimeout(r, 10000));
    }
  } else if (cmd === "carica") {
    const fd = new FormData();
    fd.append("file", new Blob([fs.readFileSync(a)]), path.basename(a));
    fd.append("uploadPath", "generate-refs");
    fd.append("fileName", path.basename(a));
    const d = await chiama(`${UPLOAD}/api/file-stream-upload`, { method: "POST", headers: intestazioni(false), body: fd });
    console.log(JSON.stringify({ url: d.downloadUrl, nota: "valido 24 ore" }));
  } else {
    console.error("comandi: crediti | crea <json> | stato <taskId> | attendi <taskId> [s] | carica <file>");
    process.exit(1);
  }
}

main().catch((e) => { console.error("ERRORE:", e.message); process.exit(1); });
