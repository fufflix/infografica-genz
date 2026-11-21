---
name: copy-milite
description: Stile copy di Germano Milite (Fufflix, Young). Usare SEMPRE prima di scrivere o rivedere qualunque testo in italiano destinato a lettori: pagine web, landing, one page, report, articoli, titoli, didascalie, post, email, meta description, alt text, testi di video e infografiche. Contiene le regole di voce e punteggiatura e il controllo obbligatorio prima della consegna.
---

# Copy Milite

Regole valide in tutti i repo Fufflix. Prevalgono su qualunque altra guida di stile; le indicazioni del titolare per il singolo lavoro prevalgono su tutto.

## Quale file leggere

- Sempre: questo file.
- Pagine web, landing, one page, presentazioni: `onepage.md` e `guida.md`.
- Articoli, inchieste, notizie (registro Young): `stile-young.md`.
- Testi business, proposte, email: `guida.md`.

## Regole che non si violano mai

1. **Mai la virgola prima della congiunzione "e" o "ed".** In nessun caso, nemmeno con soggetti diversi o dopo un inciso. Riformula, usa il punto o i due punti.
2. **"ed" davanti a vocale** e davanti a ha/hanno ("ed è", "ed ha"), mai davanti a consonante. Lo stesso per "ad".
3. **Virgolette alte “ ”**, mai dritte " " nel testo, mai basse « », mai annidate (dentro si usano le singole ‘ ’).
4. **Niente em dash (—) né en dash (–)**, niente trattini come incisi: virgole o parentesi.
5. Niente emoji, niente bullet con la prima parola in grassetto seguita da due punti, pochi elenchi.
6. Niente formule da AI: "Non è X. È Y.", "Il punto è", "Non è un dettaglio", "Il risultato?", "Ecco perché", "Ma c'è di più", "Sembra una sfumatura. Non lo è.", triadi ritmiche, frasi-slogan corte in serie.
7. Non inventare dati, citazioni, testimonianze o risultati. Numeri e formulazioni dei dati forniti non si toccano; ogni fonte va linkata.

## Controllo obbligatorio prima della consegna

Non consegnare finché lo script non dà zero errori:

```bash
node .claude/skills/copy-milite/check.mjs <file...>
```

Funziona su .html (solo il testo visibile, più title, meta description e alt), .md, .txt, .srt, .json. Cerca: ", e " e ", ed ", "ed" davanti a consonante, virgolette dritte o basse, em dash ed en dash, le formule vietate. Senza Node, fare la stessa ricerca a mano con grep. Vale anche per titoli SEO, meta description, alt text e didascalie.
