# Nano Banana 2 Lite

Il fornitore si sceglie dalla gerarchia di [`../SKILL.md`](../SKILL.md); l’ordine delle sezioni qui sotto non indica priorità.

Immagine di tutti i giorni: economica, rapidissima (sotto i 2 secondi), buona con le immagini di riferimento. **Modello predefinito per le bozze.**

| Campo | Valore |
|---|---|
| ID su Higgsfield | `nano_banana_2_lite` |
| ID su fal.ai | `google/nano-banana-2-lite` |
| Metodo | Sincrono su entrambi (risultato nella stessa chiamata) |
| Tipo | Immagine |
| Autenticazione | connettori della sessione (nessuna chiave) |
| Costo | Higgsfield: 1 credito a immagine (preventivo `get_cost`, 27/10/2026). fal: il listino espone "1 unità" senza tradurla in dollari: chiedi `estimate_cost` con `unit_quantity` o leggi la pagina prezzi prima di dichiarare una cifra |

## Higgsfield (riserva, soglia di 50 crediti)
`mcp__Higgsfield__generate_image` con:
```json
{ "params": { "model": "nano_banana_2_lite", "prompt": "...", "aspect_ratio": "16:9",
  "medias": [{ "role": "image_references", "value": "<media_id>" }] } }
```
- Proporzioni: auto, 1:1, 3:2, 2:3, 4:3, 3:4, 4:5, 5:4, 9:16, 16:9, 21:9. Risoluzione fissa 1k.
- Parametri extra: `thinking` (MINIMAL | HIGH, predefinito HIGH), `is_inpaint` con ruolo `mask`.
- Riferimenti: `media_upload` → `curl -X PUT --upload-file` sull'URL restituito → `media_confirm` → usa il `media_id`.
- Risposta: URL del file nei risultati del lavoro; se non è pronto, `jobs_wait` con il `job_id`.

## fal.ai (ultima risorsa)
`mcp__Fal_Ai__run_model` con `endpoint_id: "google/nano-banana-2-lite"` e input:
```json
{ "prompt": "...", "aspect_ratio": "16:9", "num_images": 1, "output_format": "png" }
```
- Risposta: `images[0].url` (più `description`).
- Per lavorare su riferimenti usa `google/nano-banana-2.1/edit` (questo endpoint non dichiara `image_urls`).

## REST fuori da Claude (alternativa)
`POST https://fal.run/google/nano-banana-2-lite` · intestazione `Authorization: Key $FAL_KEY` · stesso corpo JSON.

## Note
- Varianti dello stesso prompt: `count` (Higgsfield, 1-4) o `num_images` (fal) in un'unica chiamata.

## KIE.ai (prima scelta per le immagini)
- Costo: da 4 crediti (≈0,02 $) a immagine (kie.ai/pricing, 27/10/2026). Verifica la cifra esatta nella pagina del modello su kie.ai prima del preventivo.
- ID del modello (campo `model`): `nano-banana-2-lite` — verificato il 27/10/2026 su [docs.kie.ai/market/google/nano-banana-2-lite](https://docs.kie.ai/market/google/nano-banana-2-lite) (unico valore ammesso). Stesso ID per testo-a-immagine e con riferimenti.
- Campi di `input`: `prompt` (max 20000 caratteri, obbligatorio), `aspect_ratio` (**obbligatorio**: 1:1, 1:4, 1:8, 2:3, 3:2, 3:4, 4:1, 4:3, 4:5, 5:4, 8:1, 9:16, 16:9, 21:9, auto), `image_urls` (facoltativo, max 10; jpeg/png/webp, max 30 MB ciascuno; URL, non contenuto del file: usa `kie.mjs carica`).
- Esempio: `{"model":"nano-banana-2-lite","input":{"prompt":"...","aspect_ratio":"16:9"}}`
- Flusso Kie comune: `node .claude/skills/generate/scripts/kie.mjs crea '{"model":"<id>","input":{...}}'` → `taskId` → `kie.mjs attendi <taskId>` (interroga ogni 10 s fino a `success` o `fail`) → primo URL di `urls` → `salva.mjs --url ... --provider kie --costo "<crediti> cr Kie"`. Riferimenti locali: `kie.mjs carica <file>` (URL valido 24 ore). Kie risponde HTTP 200 anche sugli errori: lo script controlla il campo `code`.
