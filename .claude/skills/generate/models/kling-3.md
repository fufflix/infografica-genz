# Kling 3.0

Il fornitore si sceglie dalla gerarchia di [`../SKILL.md`](../SKILL.md); l’ordine delle sezioni qui sotto non indica priorità.

Video generico: buon movimento, prezzo onesto, audio nativo. **Modello video predefinito.** Da testo o da fotogramma iniziale (ed eventualmente finale).

| Campo | Valore |
|---|---|
| ID su Higgsfield | `kling3_0` (più rapido: `kling3_0_turbo`) |
| ID su fal.ai | `fal-ai/kling-video/v3/standard/text-to-video` · `fal-ai/kling-video/v3/standard/image-to-video` · versioni `pro` e `turbo` disponibili |
| Metodo | **Asincrono** (invia, poi attendi) |
| Tipo | Video, 3-15 s |
| Costo | fal: 0,14 USD al secondo (standard; 5 s ≈ 0,70 USD), turbo standard 0,112 USD/s. Higgsfield: 10 crediti per 5 s in modalità std (preventivi del 27/10/2026) |

## Preventivo obbligatorio
Prima di inviare: `estimate_cost` su fal (passa `duration`) e `get_cost: true` su Higgsfield, poi presenta modello, durata, risoluzione, fornitore e cifra e **aspetta il "vai"**.

## Higgsfield
`mcp__Higgsfield__generate_video`:
```json
{ "params": { "model": "kling3_0", "prompt": "...", "duration": 5, "aspect_ratio": "16:9",
  "mode": "std", "sound": "on",
  "medias": [{ "role": "start_image", "value": "<media_id o job_id di un'immagine generata>" }] } }
```
- `mode`: std | pro | 4k. Proporzioni 16:9, 9:16, 1:1. Ruoli: `start_image`, `end_image`.
- Attesa: `jobs_wait` (al massimo 15 s per chiamata, ripeti finché è terminato).

## fal.ai
`mcp__Fal_Ai__submit_job`, poi `check_job` ripetuto (attende fino a 40 s per volta) finché è COMPLETED.
```json
{ "prompt": "...", "duration": "5", "aspect_ratio": "16:9", "generate_audio": true }
```
- Da immagine: endpoint `image-to-video` con `start_image_url` (obbligatorio) e facoltativo `end_image_url`.
- `duration` è una stringa ("3"…"15"). Risposta: `video.url`.

## REST fuori da Claude
`POST https://queue.fal.run/fal-ai/kling-video/v3/standard/text-to-video` con `Authorization: Key $FAL_KEY` → `request_id`; stato su `.../requests/{id}/status`, risultato su `.../requests/{id}`.

## Note
- Scarica subito il risultato con `salva.mjs`: gli URL scadono.

## KIE.ai (dopo Google e Higgsfield, prima di fal.ai)
- Costo: da 14 crediti al secondo (≈0,07 $/s), configurazione più economica; pro/1080p costa di più. Verifica la cifra esatta nella pagina del modello su kie.ai prima del preventivo.
- ID del modello (campo `model`): `kling-3.0/video` — verificato il 27/10/2026 su [docs.kie.ai/market/kling/kling-3-0](https://docs.kie.ai/market/kling/kling-3-0) (unico valore ammesso). Un solo ID per testo-a-video e immagine-a-video.
- Campi di `input`: `sound` (booleano, obbligatorio; attivarlo cambia il prezzo), `duration` (stringa `"3"`…`"15"`, obbligatorio), `mode` (`std` | `pro` | `4K`, obbligatorio), `multi_shots` (booleano, obbligatorio), `prompt` (max 2500 caratteri; obbligatorio se `multi_shots` è false), `aspect_ratio` (`16:9` | `9:16` | `1:1`; obbligatorio per il testo-a-video, facoltativo con `image_urls`), `image_urls` (1 = primo fotogramma, 2 = primo e ultimo; con `multi_shots` vale solo il primo), `multi_prompt` (fino a 5 scene, `prompt` max 500 caratteri e `duration` intera 1-12; `duration` totale = somma), `kling_elements` (max 3).
- Esempio: `{"model":"kling-3.0/video","input":{"prompt":"...","sound":false,"duration":"5","aspect_ratio":"16:9","mode":"std","multi_shots":false}}`
- Flusso Kie comune: `node .claude/skills/generate/scripts/kie.mjs crea '{"model":"<id>","input":{...}}'` → `taskId` → `kie.mjs attendi <taskId>` (interroga ogni 10 s fino a `success` o `fail`) → primo URL di `urls` → `salva.mjs --url ... --provider kie --costo "<crediti> cr Kie"`. Riferimenti locali: `kie.mjs carica <file>` (URL valido 24 ore). Kie risponde HTTP 200 anche sugli errori: lo script controlla il campo `code`.
