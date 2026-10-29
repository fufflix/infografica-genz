# Nano Banana 2.1

Il fornitore si sceglie dalla gerarchia di [`../SKILL.md`](../SKILL.md); l’ordine delle sezioni qui sotto non indica priorità.

Versione di qualità della famiglia Nano Banana: fino a 4K, fino a 14 riferimenti, testo e persone/prodotti coerenti. **Si usa solo dopo che il titolare ha scelto una bozza.** È il modello predefinito di fal per testo-a-immagine e per le modifiche.

| Campo | Valore |
|---|---|
| ID su Higgsfield | `nano_banana_2_1` |
| ID su fal.ai | `google/nano-banana-2.1` · modifica con riferimenti: `google/nano-banana-2.1/edit` |
| Metodo | Sincrono |
| Tipo | Immagine |
| Costo | chiedere sempre il preventivo (`get_cost: true` su Higgsfield, `estimate_cost` su fal): varia con la risoluzione |

## Higgsfield
`generate_image` con `model: "nano_banana_2_1"`, `resolution` 1k | 2k | 4k, `thinking_level` minimal | medium | high, `seed`, `medias` con ruolo `image_references` (anche `mask`, `video_references`). Proporzioni anche estreme: 4:1, 1:4, 8:1, 1:8.

## fal.ai
```json
{ "prompt": "...", "resolution": "2K", "aspect_ratio": "16:9", "num_images": 1 }
```
Modifica: endpoint `/edit` con `"image_urls": ["<url caricato con upload_file>"]`. Risposta: `images[0].url`.

## Note
- Per il passaggio bozza → finale riusa esattamente lo stesso prompt e gli stessi riferimenti della bozza scelta (li trovi nel suo diario JSON).

## KIE.ai (prima scelta per le immagini)
- Costo: Kie elenca "Nano Banana 2" da 8 crediti (≈0,04 $); la disponibilità della 2.1 su Kie non è verificata. Verifica la cifra esatta nella pagina del modello su kie.ai prima del preventivo.
- ID del modello (campo `model`): **da confermare** sulla pagina del modello in docs.kie.ai alla prima chiamata, poi scriverlo qui (la pagina generale dei modelli non lo riporta).
- Flusso Kie comune: `node .claude/skills/generate/scripts/kie.mjs crea '{"model":"<id>","input":{...}}'` → `taskId` → `kie.mjs attendi <taskId>` (interroga ogni 10 s fino a `success` o `fail`) → primo URL di `urls` → `salva.mjs --url ... --provider kie --costo "<crediti> cr Kie"`. Riferimenti locali: `kie.mjs carica <file>` (URL valido 24 ore). Kie risponde HTTP 200 anche sugli errori: lo script controlla il campo `code`.
