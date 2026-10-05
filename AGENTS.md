# DIVE POOL trainer

## Project

- Purpose: memory trainer for formation skydiving dive-pool codes and figures.
- Work from the project root that contains this file.
- GitHub repository: `https://github.com/RobMaas01/DivePoolTrainer-Web`
- Main branch: `main`

## Application rules

- The default language is English. Available languages are English, Dutch, Belgian Dutch, French, German, and Ukrainian.
- Keep the training screen compact and stable on phone and laptop sizes.
- Keep `GO` at the bottom of the training screen.
- Keep the pool name, jump code, remaining count, and figure area in fixed positions.
- The figure overview uses `RANDOM POOL` and `BLOCK POOL` filters.
- Do not add explanatory copy or incorrect figure names to the training flow.
- Do not show a duplicate code below an enlarged figure.
- Keep the small `Made by Rob Maas` credit in the non-training footer.

## Local verification

Before committing:

```text
node --check app.js
node --check i18n.js
node --check sw.js
```

For a visual check, serve the project folder with a local static server and test both a phone-sized viewport and a laptop-sized viewport. Verify language selection, pool selection, all three levels, figure reveal, figure enlargement, and the mobile filter row.

## Publishing

1. Commit changes to `main` and push to GitHub.
2. Netlify is connected to `RobMaas01/DivePoolTrainer-Web` and automatically deploys new commits from `main`.
3. The public production site is:
   `https://divepooltrainer.netlify.app/`
4. Keep the Netlify project public for normal users.
5. GitHub Pages remains available as a fallback at:
   `https://robmaas01.github.io/DivePoolTrainer-Web/`

Do not upload builds manually to Netlify when the GitHub connection is working. After a push, check the Netlify deploy status and open the production URL to verify the deployed version.
