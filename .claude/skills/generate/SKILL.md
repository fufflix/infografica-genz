---
name: generate
description: >-
  Genera immagini e video con instradamento per tipo di media: KIE.ai sempre prima scelta per le immagini; Google Cloud (Vertex AI), Higgsfield, KIE.ai e fal.ai in questo ordine per i video. Higgsfield mantiene una riserva di 50 crediti; fal.ai è sempre ultimo. Passa al successivo se il servizio è occupato o indisponibile. Preventivo obbligatorio prima di ogni video e archivio unico in generations/. Si attiva con $generate, /generate, "genera un’immagine", "genera un video", "crea un’immagine", "fammi una copertina", "miniatura", "thumbnail", "anima questa foto", "generate image", "generate video", "create image", "animate".
---

# /generate

Pipeline in quattro passi, sempre in quest'ordine:

1. **Instrada**: applica la gerarchia per immagini o video della sezione «Instradamento». Leggi la ricetta del modello in `models/`; `models/google-vertex.md` si legge quando la strada scelta è Google.
2. **Prepara i riferimenti**: carica le immagini vere (loghi, volti, foto di stile) da `generations/refs/`. Mai descrivere un logo o un volto a parole.
3. **Genera**: chiama il fornitore come dice la ricetta. Se il lavoro è asincrono, attendi con pazienza (vedi ricetta).
4. **Archivia e registra**: salva il file piatto in `generations/` con lo script, che scrive anche il diario JSON e aggiorna la galleria.

## Modelli

ID e costi verificati il 27/10/2026: Higgsfield con i preventivi gratuiti (`get_cost: true`), fal con `get_pricing`, Kie con le sue pagine prezzi ufficiali (kie.ai/pricing, kie.ai/veo-3-1, kie.ai/blog/seedance-2-5-pricing). Equivalenti in dollari: 1 credito Higgsfield = 0,03125 $ (piano Plus, 450 $/anno per 1200 crediti/mese); 1 credito Kie ≈ 0,005 $ (dichiarato da Kie).

| Compito | Modello | Higgsfield | Kie AI | fal.ai | Ricetta |
|---|---|---|---|---|---|
| Immagine, bozze (predefinita) | Nano Banana 2 Lite | `nano_banana_2_lite` · 1 cr (≈0,031 $) | da 4 cr (≈0,02 $) | `google/nano-banana-2-lite` · prezzo non esposto in $ | `models/nano-banana-2-lite.md` |
| Immagine, versione finale | Nano Banana 2.1 | `nano_banana_2_1` · 1,5 cr (≈0,047 $) | Nano Banana 2 da 8 cr (≈0,04 $); 2.1 da verificare | `google/nano-banana-2.1` · `/edit` | `models/nano-banana-2-1.md` |
| Immagine con testo leggibile | GPT Image 2 | `gpt_image_2` · 0,5 cr a 1k bassa | da 6 cr (≈0,03 $) | `openai/gpt-image-2` · `/edit` | `models/gpt-image-2.md` |
| Video (predefinito) | Kling 3.0 | `kling3_0` · 10 cr per 5 s (≈0,31 $) | da 14 cr/s (≈0,07 $/s) | `fal-ai/kling-video/v3/standard/...` · 0,14 $/s | `models/kling-3.md` |
| Video di qualità | Veo 3.1 | `veo3_1` · 32 cr per 8 s (≈1,00 $); `veo3_1_lite` 12 cr | `veo-3-1`: Lite 0,15 $, Fast 0,30 $, Quality 1,25 $ a video (720p) | **non disponibile** (ritirato) | `models/veo-3-1.md` |
| Video da riferimenti, economico | Seedance 2.0 Fast | `seedance_2_0` mode fast · 12,5 cr per 5 s (≈0,39 $) | da 6,8 cr/s (≈0,034 $/s) | `bytedance/seedance-2.0/fast/reference-to-video` | `models/seedance-2-fast.md` |
| Video da riferimenti, qualità | Seedance 2.5 | `seedance_2_5` · 35 cr per 5 s (≈1,09 $) | 720p 0,315 $/s (0,19 $/s con video in ingresso) | `bytedance/seedance-2.5/us/...` · 0,0214 $ ogni 1000 token | `models/seedance-2-5.md` |

I prezzi "da" di Kie sono la configurazione più economica: quelli reali dipendono da risoluzione e durata, quindi si verificano sempre nella pagina del modello prima del preventivo. Quando un modello migliore esce, si aggiunge una ricetta in `models/` e una riga qui.

## Instradamento per immagini e video (decisione del titolare, 28/10/2026)

Questa gerarchia sostituisce la precedente regola «Google obbligatorio per ogni generazione» e la scelta del più economico tra Kie e fal. L'ordine delle colonne della tabella e delle sezioni nelle ricette non indica priorità.

| Tipo di media | Ordine dei fornitori |
|---|---|
| **Immagini, sempre** (bozze, finali, testo, modifiche e riferimenti) | **KIE.ai → Google Cloud (Vertex AI) → Higgsfield → fal.ai** |
| **Video** | **Google Cloud (Vertex AI) → Higgsfield → KIE.ai → fal.ai** |

- **KIE.ai è sempre la prima scelta per le immagini**, anche con Google configurato o molti crediti Higgsfield. Non iniziare da un altro fornitore solo perché ha un connettore più comodo.
- Per i video, prova prima Google quando è utilizzabile, per consumare prima i crediti del progetto del titolare. Se il modello richiesto esplicitamente non esiste su Google, considera Google non adatto senza sostituire il modello.
- **fal.ai è sempre l'ultima risorsa**, dopo aver escluso i fornitori che lo precedono per quel tipo di media. Un suo prezzo inferiore non cambia questa gerarchia. Scegli una configurazione economica e adatta dentro il fornitore selezionato.
- Se un fornitore è occupato o indisponibile **prima che un lavoro venga accettato** (capacità esaurita, rate limit, quota/credito insufficiente, modello assente, servizio non raggiungibile, connettore/credenziali/permessi mancanti o rifiutati), dichiara il motivo e passa al successivo, senza chiedere di ripristinare ogni volta il servizio.
- Google non ancora configurato o accessibile **non blocca il lavoro**: saltalo e continua nella gerarchia. Non chiedere nuovamente account, progetto o chiavi già forniti. Una mancata configurazione non dimostra che il credito Google sia esaurito.
- Se tutti i fornitori sono esclusi, comunica l'impedimento concreto; non dichiarare una generazione eseguita.

### Riserva di 50 crediti Higgsfield

Quando la gerarchia arriva a Higgsfield, prima di generare leggi saldo e preventivo con gli strumenti disponibili (`balance`, `get_cost: true`).

- Usa Higgsfield solo se **saldo attuale > 50** e **saldo − costo previsto ≥ 50**.
- Con **50 crediti residui o meno**, oppure se il lavoro porterebbe sotto 50, salta Higgsfield e continua con il prossimo fornitore. Non ricaricare o rinnovare l'abbonamento.
- Se saldo o costo non sono verificabili, Higgsfield non è eleggibile: dichiaralo e passa oltre. Dopo un eventuale accredito/rinnovo verificato, rivaluta il saldo.
- Non scegliere Higgsfield per un'immagine se KIE.ai è utilizzabile: la riserva non modifica l'ordine per le immagini.
- Nel preventivo video riporta il saldo Higgsfield e quello previsto dopo il lavoro **solo se Higgsfield è stato valutato**; altrimenti indica che non è stato necessario consultarlo.

### Attese, errori e cambi di fornitore

- **Un lavoro già accettato, in coda o in elaborazione non è un fornitore «occupato» da saltare.** Conserva job/task/operation ID e continua il polling dello stesso lavoro; non avviare una copia presso un altro fornitore.
- Se una richiesta di invio va in timeout e non sai se è stata accettata, verifica stato e cronologia prima di inviarla altrove. Un timeout del polling non prova che il lavoro sia fallito.
- Per Google, controlla la configurazione con `node .claude/skills/generate/scripts/vertex.mjs stato` prima del primo utilizzo nella sessione. Se manca, passa oltre. Se utilizzabile, segui `models/google-vertex.md`: codice `0` → archivia; `3` → continua con `attendi`; `10` → valuta il fallback tecnico senza duplicare lavori pendenti. Con codice `1`, distingui indisponibilità di autenticazione/configurazione da richiesta non valida o filtro.
- Non cambiare fornitore per aggirare un filtro di sicurezza. Una richiesta non valida va corretta prima di una nuova chiamata; non trattarla come prova che il servizio sia indisponibile.
- Dichiara fornitore scelto e motivi dei salti (es. «Google non configurato → Higgsfield: saldo 58, costo 10, riserva non rispettata → KIE.ai»).
- Un cambio di fornitore per un video mantiene la regola del preventivo: comunica costo e fornitore effettivi prima di una nuova esecuzione a pagamento; non nascondere un possibile addebito del lavoro precedente.

Collegamenti:
- **Google Cloud (Vertex AI)**: nessun connettore; script `scripts/vertex.mjs` (`stato`, `esiste`, `immagine`, `video`, `attendi`). Variabili in `.env.example`: `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_REGION`, `GOOGLE_APPLICATION_CREDENTIALS` (in locale) oppure `GOOGLE_APPLICATION_CREDENTIALS_JSON` (nel cloud), facoltativa `GEMINI_API_KEY` (solo immagini). Mai chiedere o incollare le chiavi in chat.
- **Higgsfield** e **fal.ai**: connettori della sessione (`mcp__Higgsfield__*`, `mcp__Fal_Ai__*`), nessuna chiave.
- **Kie AI**: nessun connettore; API REST con lo script `scripts/kie.mjs` (`crediti`, `crea`, `stato`, `attendi`, `carica`). La chiave sta nella variabile d'ambiente `KIE_API_KEY` impostata dal titolare nelle impostazioni dell'ambiente cloud (oppure in `.env` in locale, escluso da git). Mai chiederla o incollarla in chat. Se lo script risponde `401`, l’autenticazione non è disponibile o è rifiutata: dichiaralo e passa al successivo nella gerarchia del tipo di media; non dedurre che la chiave manchi soltanto dal codice HTTP.
- Saldo Kie: `node .claude/skills/generate/scripts/kie.mjs crediti`.

## Archivio

- Ogni file va **piatto** in `generations/` (nella radice di questo repository). Nessuna sottocartella. I riferimenti stanno in `generations/refs/`.
- Nome: `{progetto}_{descrizione}_{timestamp}.{ext}` (lo fa lo script).
- A inizio sessione, prima della prima generazione: `node .claude/skills/generate/scripts/salva.mjs --ricostruisci` (allinea la galleria ai file davvero presenti).
- Salvataggio, sempre e solo con lo script, subito dopo il risultato (gli URL dei fornitori scadono in poche ore). Per Google il file è già locale (`vertex.mjs --out`): usa `--file <percorso>` al posto di `--url`:

  ```bash
  node .claude/skills/generate/scripts/salva.mjs --url "<URL risultato>" \
    --progetto <progetto> --descrizione "<cosa è>" \
    --modello <id modello> --provider <google|higgsfield|kie|fal> --prompt "<prompt completo inviato>" \
    [--refs refs/logo.png] [--params '{"aspect_ratio":"16:9"}'] [--costo "10 crediti"] [--job <id>]
  ```

  Lo script scarica il file, scrive accanto il diario `stesso-nome.json` (modello, fornitore, prompt, riferimenti, parametri, costo, data) e rigenera `generations/manifest.js`, così il file compare da solo nella galleria `generations/galleria.html`. Non aprire la galleria a ogni generazione.
- Sessione nel cloud: il contenitore viene eliminato a fine sessione. Dopo ogni salvataggio **manda il file in chat** con `SendUserFile` (`display: "render"` per immagini e video), così il titolare lo conserva. Immagini e diari si possono committare; i video sono esclusi da git (`generations/.gitignore`) e restano anche nelle librerie dei fornitori.

## Regole (il contratto)

- **Preventivo prima di ogni video a pagamento**: indica modello, fornitore, durata, risoluzione e costo previsto (dollari o crediti), poi **aspetta un "vai" esplicito**. Il preventivo non è un'approvazione. Un'approvazione vale una sola esecuzione.
- **Bozza economica, poi versione bella**: si itera su Nano Banana 2 Lite. Solo quando il titolare sceglie la preferita si rilancia lo stesso prompt su un modello di qualità.
- **Riferimenti veri, mai descritti**: logo, volto o prodotto si passano come file. Se manca in `generations/refs/`, fermati e chiedilo. Per i loghi Fufflix usa i file di `assets/img/brand/` (copiali in `generations/refs/`).
- **Una generazione alla volta** quando sono più di una, per non sbattere sui limiti di frequenza. Eccezione: varianti dello stesso prompt in un'unica chiamata (`count` su Higgsfield, `num_images` su fal e Kie dove previsto).
- **Dopo ogni salvataggio, il diario** (lo fa lo script: non saltarlo).
- Non attivare gratuità o crediti "illimitati" di Higgsfield (`use_unlim`, `use_free_gens`) se il titolare non lo chiede.
- Per le pagine partner valgono palette e loghi Fufflix descritti in `CLAUDE.md`, salvo indicazioni diverse per quel partner.
- Se una chiamata risponde "modello non trovato", cerca l'ID aggiornato nel catalogo del fornitore e correggi la ricetta e la tabella qui sopra.

## Nota per le sessioni cloud (verificata il 29/10/2026)

- Node 22 non usa da solo il proxy della sessione: lancia gli script con `NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt`. Il proxy inietta le credenziali di `api.kie.ai` (basta `KIE_API_KEY=dummy`) e di `aiplatform.googleapis.com`.
- Su Vertex le credenziali le inietta il proxy: se `vertex.mjs stato` segnala credenziali assenti o non valide, chiama l'API REST direttamente con `curl` (progetto `partner-512920`, regione `us-central1`), senza materializzare chiavi.
