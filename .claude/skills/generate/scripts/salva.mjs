#!/usr/bin/env node
// Salva un output della skill /generate nella cartella generations/ (piatta),
// scrive il diario JSON accanto al file e rigenera generations/manifest.js
// che alimenta la galleria (generations/galleria.html).
//
// Uso:
//   node .claude/skills/generate/scripts/salva.mjs --url <URL> --progetto <p> --descrizione <d> \
//        --modello <id> --provider <google|fal|higgsfield|kie> --prompt "<testo>" \
//        [--refs refs/logo.png,refs/volto.jpg] [--params '{"aspect":"16:9"}'] [--costo "0.70 USD"] [--ext png]
//   node .claude/skills/generate/scripts/salva.mjs --file <percorso-locale> ...   (stesse opzioni)
//   node .claude/skills/generate/scripts/salva.mjs --ricostruisci               (solo manifest)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const DIR = path.join(ROOT, "generations");
const MEDIA = /\.(png|jpe?g|webp|gif|avif|mp4|webm|mov)$/i;
const VIDEO = /\.(mp4|webm|mov)$/i;

function args(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith("--")) continue;
    const k = argv[i].slice(2);
    const v = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
    out[k] = v;
  }
  return out;
}

function slug(s) {
  return String(s || "senza-nome")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "senza-nome";
}

function extFrom(url, contentType) {
  const m = String(url).split("?")[0].match(/\.([a-z0-9]{2,4})$/i);
  if (m && MEDIA.test("." + m[1])) return m[1].toLowerCase();
  const map = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "video/mp4": "mp4", "video/webm": "webm", "image/gif": "gif" };
  return map[(contentType || "").split(";")[0]] || "bin";
}

function ricostruisci() {
  fs.mkdirSync(DIR, { recursive: true });
  const voci = fs.readdirSync(DIR)
    .filter((f) => MEDIA.test(f) && fs.statSync(path.join(DIR, f)).isFile())
    .map((f) => {
      const base = f.replace(/\.[^.]+$/, "");
      let log = null;
      try { log = JSON.parse(fs.readFileSync(path.join(DIR, base + ".json"), "utf8")); } catch {}
      const creato = log?.created ? Date.parse(log.created) : fs.statSync(path.join(DIR, f)).mtimeMs;
      return {
        file: f,
        tipo: VIDEO.test(f) ? "video" : "immagine",
        creato: new Date(creato).toISOString(),
        modello: log?.model || null,
        provider: log?.provider || null,
        prompt: log?.prompt || null,
        larghezza: log?.width || null,
        altezza: log?.height || null,
      };
    })
    .sort((a, b) => b.creato.localeCompare(a.creato));
  const js = "// Generato da .claude/skills/generate/scripts/salva.mjs: non modificare a mano.\n" +
    "window.GENERAZIONI = " + JSON.stringify(voci, null, 1) + ";\n";
  fs.writeFileSync(path.join(DIR, "manifest.js"), js);
  return voci.length;
}

async function main() {
  const a = args(process.argv.slice(2));
  if (a.ricostruisci) { console.log(`manifest: ${ricostruisci()} file`); return; }
  if (!a.url && !a.file) throw new Error("serve --url oppure --file");
  if (!a.modello || !a.prompt) throw new Error("servono --modello e --prompt (il diario è il contratto)");

  let buf, ext = a.ext;
  if (a.url) {
    const r = await fetch(a.url);
    if (!r.ok) throw new Error(`download fallito: HTTP ${r.status}`);
    buf = Buffer.from(await r.arrayBuffer());
    ext = ext || extFrom(a.url, r.headers.get("content-type"));
  } else {
    buf = fs.readFileSync(a.file);
    ext = ext || path.extname(a.file).slice(1).toLowerCase();
  }
  if (!MEDIA.test("." + ext)) throw new Error(`estensione non riconosciuta: ${ext}`);

  const ts = Math.floor(Date.now() / 1000);
  const base = `${slug(a.progetto)}_${slug(a.descrizione)}_${ts}`;
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(path.join(DIR, `${base}.${ext}`), buf);

  let params = {};
  if (a.params) { try { params = JSON.parse(a.params); } catch { throw new Error("--params non è JSON valido"); } }
  const log = {
    model: a.modello,
    provider: a.provider || null,
    prompt: a.prompt,
    refs: a.refs ? String(a.refs).split(",").map((s) => s.trim()).filter(Boolean) : [],
    params,
    cost: a.costo || null,
    source_url: a.url || null,
    job_id: a.job || null,
    created: new Date(ts * 1000).toISOString(),
  };
  if (a.larghezza) log.width = Number(a.larghezza);
  if (a.altezza) log.height = Number(a.altezza);
  fs.writeFileSync(path.join(DIR, `${base}.json`), JSON.stringify(log, null, 2) + "\n");
  const n = ricostruisci();
  console.log(JSON.stringify({ salvato: `generations/${base}.${ext}`, diario: `generations/${base}.json`, totale_galleria: n }));
}

main().catch((e) => { console.error("ERRORE:", e.message); process.exit(1); });
