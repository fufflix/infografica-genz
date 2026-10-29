# Seedance 2.5

Il fornitore si sceglie dalla gerarchia di [`../SKILL.md`](../SKILL.md); l’ordine delle sezioni qui sotto non indica priorità.

Il Seedance di qualità: video con audio nativo fino a 30 s, da testo, da immagine o da molti riferimenti (fino a 30 immagini, 10 video, 10 audio su fal). **Si usa quando Seedance 2.0 Fast non basta.**

| Campo | Valore |
|---|---|
| ID su Higgsfield | `seedance_2_5` |
| ID su fal.ai | `bytedance/seedance-2.5/us/text-to-video` · `/us/image-to-video` · `/us/reference-to-video` (versione ospitata negli USA) |
| ID su Kie AI | `bytedance/seedance-2-5` — verificato il 27/10/2026 su docs.kie.ai/market/bytedance/seedance-2-5 (esiste anche `bytedance/seedance-2-5-draft`) |
| Altri | WaveSpeed AI (non collegato) |
| Metodo | Asincrono |
| Tipo | Video, fino a 30 s, 480p / 720p / 1080p |
| Costo | Higgsfield: 35 crediti per 5 s con impostazioni predefinite ≈ 1,09 $. Kie (kie.ai/blog/seedance-2-5-pricing, prezzi "beta"): 480p 0,14 $/s, 720p 0,315 $/s, 1080p 0,79 $/s senza video in ingresso; 0,085 / 0,19 / 0,475 $/s con video in ingresso. fal: 0,0214 $ ogni 1000 token (non traducibile in secondi senza `estimate_cost`) |

## Preventivo obbligatorio
Higgsfield `get_cost: true` (con saldo residuo), Kie dalla tabella sopra per risoluzione e durata, fal `estimate_cost`. Se fal resta "sconosciuto", dillo.

## Higgsfield
`generate_video` con `model: "seedance_2_5"`, `duration`, `aspect_ratio`, `medias` (controlla i ruoli con `models_explore` action `get`).

## fal.ai
`submit_job` → `check_job`. Corpo minimo per testo: `{ "prompt": "...", "duration": "5", "resolution": "720p", "aspect_ratio": "16:9" }`. Leggi lo schema con `get_model_schema` alla prima chiamata e annota qui i campi. Risposta: `video.url`.

## Kie AI
Flusso: `kie.mjs crea '{"model":"bytedance/seedance-2-5","input":{...}}'` → `kie.mjs attendi <taskId>` → `salva.mjs --provider kie`. Con `return_last_frame` Kie restituisce anche `lastFrameUrl`.
- Campi di `input`: `prompt` (max 20480 caratteri), `first_frame_url` / `last_frame_url` (l'ultimo richiede il primo; incompatibili con i `reference_*`), `reference_image_urls` (max 30), `reference_video_urls` (max 10, mp4/mov/mkv, 2-30 s, totale ≤ 30 s), `reference_audio_urls` (max 10, totale ≤ 30 s), `generate_audio` (predefinito true), `resolution` (`480p` | `720p` | `1080p`; predefinito 720p), `aspect_ratio` (1:1, 4:3, 3:4, 16:9, 9:16, 21:9, adaptive; predefinito adaptive), `duration` (intero 4-30 o -1; predefinito 5), `output_format` (mp4 | mov), `draft` (se true solo 480p), `return_last_frame`, `web_search`, `nsfw_checker`.
- Esempio: `{"model":"bytedance/seedance-2-5","input":{"prompt":"...","generate_audio":false,"resolution":"720p","aspect_ratio":"16:9","duration":5}}`
