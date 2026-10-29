# Google Cloud (Vertex AI): primo per i video, secondo per le immagini

Ricetta per immagini e video quando la gerarchia di `../SKILL.md` seleziona Google (regola del titolare, 28/10/2026). **Video: Google → Higgsfield → KIE.ai → fal.ai. Immagini: KIE.ai → Google → Higgsfield → fal.ai.** Per le immagini KIE.ai si valuta sempre prima. Google non ancora configurato/accessibile si salta, senza bloccare il lavoro.

| Campo | Valore |
|---|---|
| Script | `node .claude/skills/generate/scripts/vertex.mjs` |
| Configurazione | via semplice: la sola variabile `VERTEX_API_KEY` (chiave API Vertex, modalità express, nessun progetto da indicare). In alternativa account di servizio + `GOOGLE_CLOUD_PROJECT` (`.env.example`). Controllo: `vertex.mjs stato` |
| Metodo | Immagine: sincrono. Video: asincrono (`predictLongRunning`, poi interrogazione ogni 10 s) |
| Archiviazione | lo script scrive il file con `--out`; poi `salva.mjs --file <percorso> --provider google ...` |

## Quale modello Google usare

| Compito richiesto | Modello Google | ID Vertex | Stato dell'ID |
|---|---|---|---|
| Immagine, bozze (predefinita) | Nano Banana 2 Lite | `gemini-3.1-flash-lite-image` | dedotto dall'indirizzo della pagina Google, **da confermare con `esiste`** |
| Immagine, versione finale | Nano Banana 2.1 (poi Nano Banana 2, poi Pro) | `gemini-3.1-flash-image`, `gemini-3-pro-image-preview` | dedotti/da fonti terze, **da confermare con `esiste`**; l'ID di Nano Banana 2.1 non è noto: cercarlo nella pagina Google del modello |
| Immagine, qualunque (ID sicuro) | Nano Banana | `gemini-2.5-flash-image` | **confermato** nella pagina Google, disponibile (GA) |
| Immagine con testo leggibile | Nano Banana 2.1 / Pro | come sopra | GPT Image 2 non è Google: se è nominato esplicitamente → riserva (caso «modello non supportato») |
| Video (predefinito e di qualità) | Veo 3.1 | `veo-3.1-generate-001`; più economico `veo-3.1-fast-generate-001` (varianti `-preview` nelle docs più vecchie) | pagina Google conferma «Veo 3.1»; **ID esatti da confermare con `esiste`** |
| Video con Kling / Seedance nominati | nessun equivalente | | → riserva (caso «modello non supportato») |

**Imagen 2 e Imagen 3 non si usano.** Dalla documentazione Google (pagine «Versioni dei modelli» e note di rilascio di Vertex AI, consultate il 27/10/2026): gli ID GA di Imagen 3 e Imagen 4 hanno come data di ritiro il 30/06/2026, con `gemini-2.5-flash-image` indicato come sostituto; le versioni Imagen precedenti erano già ritirate il 24/09/2025. Non ho verificato se i vecchi ID rispondano ancora: non vale la pena, quindi non sono nel routing.

## Procedura

1. `vertex.mjs stato`. Se `pronto_vertex` è falso e non c'è `GEMINI_API_KEY`, dichiara Google non configurato e passa al successivo nella gerarchia di `../SKILL.md`. Non chiedere nuovamente chiavi o dati già forniti.
2. Primo uso di un ID non «confermato» nella sessione: `vertex.mjs esiste <id>` (gratuito, non genera nulla). Se l'ID non esiste, prova il successivo della tabella; se nessun ID Google esiste, quello è il caso «modello non supportato» → riserva.
3. Genera:
   ```bash
   # immagine
   node .claude/skills/generate/scripts/vertex.mjs immagine --modello gemini-2.5-flash-image \
     --prompt "..." --aspect 16:9 [--ref generations/refs/logo.png] --out generations/_tmp.png
   # video (dopo preventivo e "vai")
   node .claude/skills/generate/scripts/vertex.mjs video --modello veo-3.1-fast-generate-001 \
     --prompt "..." --durata 8 --aspect 16:9 [--risoluzione 720p] [--immagine generations/refs/inizio.png] --out generations/_tmp.mp4
   ```
   Riferimenti (loghi, volti): si passano come file con `--ref` o `--immagine`, mai descritti a parole.
4. Leggi il **codice di uscita**: `0` fatto → archivia; `10` → fallback consentito, dichiara il motivo e passa alla riserva (SKILL.md); `3` → video in lavorazione, `vertex.mjs attendi <operazione> --modello <id> --out <file>`; `1` → distingui indisponibilità di configurazione/autenticazione/permessi (passa al successivo) da richiesta non valida o filtro (riferisci l’errore; non cambiare fornitore per aggirare il filtro). Un lavoro già accettato o un invio dall’esito incerto non va duplicato.
5. Archivia: `salva.mjs --file generations/_tmp.png --provider google --modello <id> --progetto ... --prompt "..." --costo "<stima da pagina prezzi Google>"` (lo script rinomina il file nel formato standard).

## Costi e crediti

- Prezzi: pagina ufficiale cloud.google.com/vertex-ai/generative-ai/pricing, da leggere **prima di ogni preventivo video**: qui non riporto cifre perché non le ho verificate.
- Il saldo dei crediti Google Cloud non si legge via API: il titolare lo vede in Console → Fatturazione → Crediti. Non dire mai che i crediti «verranno usati» come fatto certo: dipende dalle condizioni del credito (prodotti ammessi, scadenza), che il titolare controlla lì.
- Con `GEMINI_API_KEY` (Gemini API, non Vertex) la fatturazione segue il progetto legato alla chiave: l'uso dei crediti va verificato, per questo la strada preferita è l'account di servizio su Vertex.

## Limiti di questo script (dichiarati)

- Scritto sulla documentazione Google; provato **solo contro un server finto** (classificazione degli errori e firma del token), **mai contro Google reale**: non c'erano credenziali. La prima generazione vera è il collaudo: se l'API risponde in modo diverso dal previsto, correggi lo script e la ricetta.
- **Con la sola `VERTEX_API_KEY` i video non sono garantiti**: la modalità express di Vertex è un sottoinsieme delle funzioni (nella [documentazione](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/start/express-mode/vertex-ai-express-mode-api-reference) il riferimento REST elenca solo `generateContent` e simili, nessuna menzione di Veo). Lo script ci prova; se Google risponde 404 vale come «modello non supportato» e il video passa alla riserva, dichiarandolo e dopo il preventivo. Per Veo su Google serve l'account di servizio.
- I video tornano nella risposta come dati: se in futuro si imposta un deposito Cloud Storage, lo script va esteso.
- La regione predefinita delle immagini è `global` (alcuni modelli Gemini immagine non sono regionali); se Google risponde 404 con una regione impostata a mano, prova prima senza `GOOGLE_CLOUD_REGION`.
