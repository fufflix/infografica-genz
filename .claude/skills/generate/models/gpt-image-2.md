# GPT Image 2

Il fornitore si sceglie dalla gerarchia di [`../SKILL.md`](../SKILL.md); l’ordine delle sezioni qui sotto non indica priorità.

Testo dentro l'immagine: insegne, locandine, menu, confezioni, schermate. **Si sceglie la prima volta che serve testo leggibile.**

| Campo | Valore |
|---|---|
| ID su Higgsfield | `gpt_image_2` (esiste anche `gpt_image_2_5`, il predefinito generale di Higgsfield) |
| ID su fal.ai | `openai/gpt-image-2` · modifica: `openai/gpt-image-2/edit` |
| Metodo | Sincrono |
| Tipo | Immagine |
| Costo | Higgsfield: 0,5 crediti a 1k qualità bassa (preventivo del 27/10/2026); qualità e risoluzione più alte costano di più: preventivo sempre. fal: chiedere `estimate_cost` |

## Higgsfield
`generate_image` con `model: "gpt_image_2"`, `resolution` 1k | 2k | 4k, `quality` low | medium | high (predefinito low), proporzioni 1:1, 4:3, 3:4, 16:9, 21:9, 9:16, 3:2, 2:3, riferimento con ruolo `image`.

## fal.ai
```json
{ "prompt": "...", "image_size": "landscape_16_9", "quality": "medium", "background": "auto", "num_images": 1 }
```
- Attenzione: su fal la qualità predefinita è `high` (la più cara): impostala esplicitamente.
- `background: "transparent"` per loghi o adesivi su fondo trasparente.
- Risposta: `images[0].url`.

## Note
- Scrivi nel prompt il testo esatto tra virgolette doppie dritte e indica la lingua.

## KIE.ai (prima scelta per le immagini)
- Costo: da 6 crediti (≈0,03 $) a immagine. Verifica la cifra esatta nella pagina del modello su kie.ai prima del preventivo.
- ID del modello (campo `model`), due ID distinti, verificati il 27/10/2026 su [testo-a-immagine](https://docs.kie.ai/market/gpt/gpt-image-2-text-to-image) e [immagine-a-immagine](https://docs.kie.ai/market/gpt/gpt-image-2-image-to-image): `gpt-image-2-text-to-image` · `gpt-image-2-image-to-image` (riferimenti in `input_urls`, max 16).
- Campi di `input`: `prompt` (1-20000 caratteri), `aspect_ratio` (auto, 1:1, 3:2, 2:3, 4:3, 3:4, 5:4, 4:5, 16:9, 9:16, 2:1, 1:2, 3:1, 1:3, 21:9, 9:21; predefinito auto), `resolution` (`1K` | `2K` | `4K`: la pagina chiede di impostarla sempre in modo esplicito), `background` (transparent | opaque | auto, **solo a 1K**). A 2K non valgono 5:4, 4:5, 3:1, 1:3, 9:21; a 4K non valgono 3:1, 1:3, 9:21.
- Esempio: `{"model":"gpt-image-2-text-to-image","input":{"prompt":"...","aspect_ratio":"16:9","resolution":"1K"}}`
- Flusso Kie comune: `node .claude/skills/generate/scripts/kie.mjs crea '{"model":"<id>","input":{...}}'` → `taskId` → `kie.mjs attendi <taskId>` (interroga ogni 10 s fino a `success` o `fail`) → primo URL di `urls` → `salva.mjs --url ... --provider kie --costo "<crediti> cr Kie"`. Riferimenti locali: `kie.mjs carica <file>` (URL valido 24 ore). Kie risponde HTTP 200 anche sugli errori: lo script controlla il campo `code`.
