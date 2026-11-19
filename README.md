# Nishkam Bhatia — AI Tools, Prompts & Websites

Every AI tool, website and prompt shared on [@nishkambhatia](https://www.instagram.com/nishkambhatia) and [Nishtek AI](https://www.youtube.com/@nishtek), in one searchable page.

## Files

| File | What it is |
| --- | --- |
| `index.html` | Page layout and copy |
| `styles.css` | All styling (light and dark themes) |
| `app.js` | Search, filters, prompt editor, Google Sheet sync |
| `assets/vault.js` | The resource list (websites, prompts, tutorials) |
| `assets/portrait-*.webp` | Photos for light and dark mode |

## Adding resources

- **Quickest:** add a row to the public Google Sheet (title, description, URL). The site picks it up automatically on load.
- **Permanent:** add an object to `assets/vault.js`, following the shape of the existing entries.

## Adding a vibe coded project

1. Upload a screenshot to `assets/projects/` (e.g. `my-tool.png`).
2. In `assets/projects.js`, copy the existing block and paste it at the **top** of the list. Fill in title, url, image, description and tags.

The newest project shows as the big featured card; older ones sit in a two-column grid below it. Numbers (#01, #02…) are added automatically.

Hosted with GitHub Pages — no build step.
