#!/usr/bin/env node
// Controllo copy Milite: node check.mjs file1 [file2 ...]. Esce con 1 se trova errori.
import fs from "node:fs";
const files = process.argv.slice(2);
if (!files.length) { console.error("uso: node check.mjs <file...>"); process.exit(2); }
const RULES = [
  [/,\s+ed?\b/g, 'virgola prima di "e"/"ed"'],
  [/\bed\s+(?![aeiouàèéìòùAEIOUÈhH])\p{L}/giu, '"ed" davanti a consonante'],
  [/\bad\s+(?![aeiouàèéìòùAEIOU])\p{L}/gu, '"ad" davanti a consonante (controllare)'],
  [/"/g, 'virgolette dritte (usare “ ”)'],
  [/[«»]/g, 'virgolette basse (usare “ ”)'],
  [/[—–]/g, 'em dash / en dash'],
  [/\s-\s/g, 'trattino usato come inciso'],
  [/Non è (un dettaglio|una sfumatura)|Il punto è|Il risultato\?|Ecco perché|Ma c'è di più|Non lo è\./g, 'formula da AI'],
];
function visible(html) {
  const keep = [];
  html.replace(/<title>([\s\S]*?)<\/title>/gi, (_, t) => keep.push(t));
  html.replace(/<meta[^>]+(?:name|property)="(?:description|og:description|og:title|twitter:title|twitter:description)"[^>]*content="([^"]*)"/gi, (_, t) => keep.push(t));
  html.replace(/\salt="([^"]*)"/gi, (_, t) => keep.push(t));
  const body = html
    .replace(/<(script|style|svg|head)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, "\n")
    .replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&nbsp;/g, " ");
  return keep.join("\n") + "\n" + body;
}
let errors = 0;
for (const f of files) {
  let t = fs.readFileSync(f, "utf8");
  if (/\.html?$/i.test(f)) t = visible(t);
  if (/\.json$/i.test(f)) { const out = []; JSON.stringify(JSON.parse(t), (k, v) => { if (typeof v === "string") out.push(v); return v; }); t = out.join("\n"); }
  if (/\.md$/i.test(f)) t = t.replace(/```[\s\S]*?```/g, " ").replace(/`[^`]*`/g, " ").replace(/\]\([^)]*\)/g, "]");
  t.split("\n").forEach((line, i) => {
    for (const [re, msg] of RULES) {
      re.lastIndex = 0; let m;
      while ((m = re.exec(line))) {
        errors++;
        const a = Math.max(0, m.index - 30);
        console.log(`${f}:${i + 1}  ${msg}  …${line.slice(a, m.index + 30).trim()}…`);
      }
    }
  });
}
console.log(errors ? `\n${errors} da correggere.` : "Copy OK: nessun errore.");
process.exit(errors ? 1 : 0);
