# Seedance 2.0 Fast

Il fornitore si sceglie dalla gerarchia di [`../SKILL.md`](../SKILL.md); l’ordine delle sezioni qui sotto non indica priorità.

Da riferimenti a video: gli dai fino a 9 immagini (più video e audio di riferimento) e le anima. **Si usa quando si vogliono animare immagini di riferimento invece di un solo prompt.**

| Campo | Valore |
|---|---|
| ID su fal.ai | `bytedance/seedance-2.0/fast/reference-to-video` |
| ID su Higgsfield | `seedance_2_0` con `mode: "fast"` (esistono anche `seedance_2_0_mini` e `seedance_2_5`) |
| Metodo | Asincrono (usa submit/attesa: un video richiede tempo) |
| Tipo | Video, 4-15 s, 480p o 720p su fal |
| Costo | fal: 0,0112 USD ogni 1000 token (unità di fatturazione del listino; la guida di partenza indicava circa 0,24 USD/s a 720p, cifra non verificata qui). Higgsfield: 22,5 crediti per 5 s con impostazioni predefinite (mode std, 720p; preventivo del 27/10/2026) |

## Preventivo obbligatorio
Su fal la stima in token non si traduce da sola in secondi: chiedi `estimate_cost`; se resta "sconosciuto", dillo e mostra il preventivo Higgsfield (`get_cost: true` con `mode: "fast"`).

## fal.ai
```json
{ "prompt": "...", "image_urls": ["<url1>", "<url2>"], "duration": "5",
  "resolution": "720p", "aspect_ratio": "16:9", "generate_audio": true }
```
- Le immagini locali vanno prima su `upload_file` (`prepare_upload: true` → PUT con curl → `file_url`).
- Risposta: `video.url`.

## Higgsfield
`generate_video` con `model: "seedance_2_0"`, `mode: "fast"`, `resolution`, `duration`, `medias` con ruolo `image_references` (anche `start_image`, `end_image`, `video_references`, `audio_references`).

## KIE.ai (dopo Google e Higgsfield, prima di fal.ai)
- Costo: da 6,8 crediti al secondo (≈0,034 $/s). Verifica la cifra esatta nella pagina del modello su kie.ai prima del preventivo.
- ID del modello (campo `model`): `bytedance/seedance-2-fast` — verificato il 27/10/2026 su [docs.kie.ai/market/bytedance/seedance-2-fast](https://docs.kie.ai/market/bytedance/seedance-2-fast). Nota: non è `seedance-2.0-fast` (forma usata da altri fornitori).
- Campi di `input`: `prompt` (3-20000 caratteri), `reference_image_urls` (fino a 9), `reference_video_urls` (fino a 3, mp4/mov, 480p-720p, 2-15 s ciascuno e 15 s in tutto), `reference_audio_urls` (fino a 3, wav/mp3), `first_frame_url` / `last_frame_url` (**incompatibili** con i `reference_*`), `generate_audio` (predefinito true), `resolution` (`480p` | `720p`, predefinito 720p), `aspect_ratio` (1:1, 4:3, 3:4, 16:9, 9:16, 21:9, adaptive; predefinito 16:9), `duration` (intero 4-15 o -1; predefinito 5), `web_search` (solo testo-a-video), `nsfw_checker`. I video di riferimento si fatturano a tariffa ridotta.
- Esempio: `{"model":"bytedance/seedance-2-fast","input":{"prompt":"...","reference_image_urls":["<url>"],"generate_audio":false,"resolution":"720p","aspect_ratio":"16:9","duration":5}}`
- Flusso Kie comune: `node .claude/skills/generate/scripts/kie.mjs crea '{"model":"<id>","input":{...}}'` → `taskId` → `kie.mjs attendi <taskId>` (interroga ogni 10 s fino a `success` o `fail`) → primo URL di `urls` → `salva.mjs --url ... --provider kie --costo "<crediti> cr Kie"`. Riferimenti locali: `kie.mjs carica <file>` (URL valido 24 ore). Kie risponde HTTP 200 anche sugli errori: lo script controlla il campo `code`.
