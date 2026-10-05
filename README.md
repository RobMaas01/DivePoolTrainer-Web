# Dive Pool Trainer Web

Een zelfstandige, responsieve webapp om de letters en formaties van formation skydiving te leren. Werkt op desktop, laptop, Android en iPhone/iPad in de browser. Installatie en account zijn niet nodig.

## Functies

- Vier oorspronkelijke dive pools: FS4 AAA, FS4 AAA ISR, FS8 Outdoor en FS8 Indoor.
- Willekeurige sprongen zonder herhaling totdat de pool leeg is.
- Moeilijkheid van 1–5 punten en automatische figuurweergave na 0–5 seconden.
- Figuurkaarten vergroten en figuren doorzoeken op code of naam.
- Instellingen worden lokaal in de browser bewaard; er worden geen persoonsgegevens verzonden.
- Werkt offline nadat de site een keer volledig is geladen.

De figuurgegevens en 78 afbeeldingen zijn overgenomen uit de oorspronkelijke Android app in `Ontwikkel/DivePoolTrainer`. `python tools/import_pool.py` kan deze gegevens opnieuw importeren als beide projectmappen naast elkaar staan. Geef anders het pad naar de Android bron als argument mee. De oorspronkelijke Android bron is niet aangepast.

## Lokaal starten

Gebruik een lokale webserver vanuit deze map, bijvoorbeeld:

```sh
python -m http.server 8000
```

Open daarna `http://localhost:8000`. Rechtstreeks `index.html` openen via `file://` werkt niet voor het laden van `data/pool.json`.

## Publiceren met GitHub Pages

Publiceer de root van de `main` branch via **Settings → Pages → Build and deployment → Deploy from a branch → main / (root)**. De site gebruikt relatieve paden en werkt daardoor onder `https://robmaas01.github.io/DivePoolTrainer-Web/`.

Alle bronbestanden staan direct in deze repository. Er is geen buildstap, backend of betaalde dienst nodig.
