# QRF2 DIVE POOL trainer

Een zelfstandige, responsieve webapp om de letters en formaties van formation skydiving te leren. Werkt op desktop, laptop, Android en iPhone/iPad in de browser. Installatie en account zijn niet nodig.

## Functies

- Vier oorspronkelijke dive pools: FS4 AAA, FS4 AAA ISR, FS8 Outdoor en FS8 Indoor.
- Willekeurige sprongen zonder herhaling totdat de pool leeg is.
- Vaste oefenindeling zoals de Android app: codes boven, figuren midden en GO onderaan op dezelfde plek.
- Drie niveaus: Beginner trekt één random of blok; Intermediate telt door tot 3 of 4 formaties; Expert tot 5 of 6 formaties. Een random telt 1 en een blok 2. De figuren verschijnen na 0-5 seconden.
- Figuurkaarten vergroten en figuren doorzoeken op code of naam.
- Instellingen worden lokaal in de browser bewaard; er worden geen persoonsgegevens verzonden.
- Werkt offline nadat de site een keer volledig is geladen.
- Engels is de standaardtaal. De interface is ook beschikbaar in Nederlands, Vlaams Nederlands (België), Frans, Duits en Oekraïens. De taalkeuze blijft lokaal bewaard. Officiële figuurnamen blijven in het Engels.

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

GitHub Pages kan JavaScript en CSS tijdelijk in de browser cachen. Verhoog bij een volgende publicatie de `?v=` versies in `index.html` en de corresponderende paden plus `CACHE_NAME` in `sw.js`. Zo krijgen bezoekers meteen de nieuwste versie.
