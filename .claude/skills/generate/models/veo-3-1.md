# Veo 3.1

Il fornitore si sceglie dalla gerarchia di [`../SKILL.md`](../SKILL.md); l’ordine delle sezioni qui sotto non indica priorità.

Video di qualità più alta a partire da un fotogramma iniziale. Più lento e più caro di Kling: **si usa quando il movimento di Kling non basta per un'inquadratura importante.**

| Campo | Valore |
|---|---|
| ID su Higgsfield | `veo3_1` (più economico: `veo3_1_lite`) |
| ID su Kie AI | `veo-3-1` con `input.model` = `veo3_lite` · `veo3_fast` (predefinito) · `veo3` (Quality) — verificato su docs.kie.ai |
| fal.ai | **non disponibile**: il catalogo di fal riporta Veo 2 e Veo 3 come ritirati e nessun Veo 3.1 (verifica del 27/10/2026, due ricerche) |
| Metodo | **Asincrono** |
| Tipo | Video, 4, 6 o 8 s |
| Costo | Higgsfield: 32 crediti per 8 s (variante fast, qualità basic) ≈ 1,00 $; `veo3_1_lite` 12 crediti ≈ 0,375 $. Kie, a video (kie.ai/veo-3-1, 27/10/2026): Lite 30 cr ≈ 0,15 $ (720p) / 35 cr (1080p); Fast 60 cr ≈ 0,30 $ / 65 cr; Quality 250 cr ≈ 1,25 $ / 255 cr; 4K molto più caro |

## Preventivo obbligatorio
`get_cost: true` con i parametri reali, poi aspetta il "vai". Per Google usa la ricetta `google-vertex.md`; su KIE.ai verifica il prezzo del modello. Questa ricetta non riporta un ID Veo su fal verificato: dopo Google/Higgsfield/KIE.ai esclusi, verifica il catalogo fal prima di dichiarare il modello indisponibile.

## Higgsfield
```json
{ "params": { "model": "veo3_1", "prompt": "...", "duration": 8, "aspect_ratio": "16:9",
  "variant": "veo-3-1-fast", "quality": "basic",
  "medias": [{ "role": "start_image", "value": "<media_id>" }] } }
```
- `variant`: veo-3-1-fast | veo-3-1-preview. `quality`: basic | high | ultra. Proporzioni 16:9, 9:16.
- Attesa con `jobs_wait`.

## Kie AI
```json
{ "model": "veo-3-1",
  "input": { "model": "veo3_fast", "prompt": "...", "generation_type": "TEXT_2_VIDEO",
             "aspect_ratio": "16:9", "resolution": "720p", "duration": 8,
             "image_urls": ["<url, solo per FIRST_AND_LAST_FRAMES_2_VIDEO o REFERENCE_2_VIDEO>"] } }
```
- `generation_type`: `TEXT_2_VIDEO` · `FIRST_AND_LAST_FRAMES_2_VIDEO` (1-2 immagini) · `REFERENCE_2_VIDEO` (1-3 immagini; non con Quality). `duration`: 4, 6, 8. `aspect_ratio`: 16:9, 9:16, Auto.
- Il video a 720p può stare in `origin_urls`, a 1080p/4K in `result_urls`: lo script legge entrambi i formati noti; se `urls` è vuoto, guarda la risposta grezza con `kie.mjs stato`.
- Flusso: `kie.mjs crea` → `kie.mjs attendi <taskId>` → `salva.mjs --provider kie`.
