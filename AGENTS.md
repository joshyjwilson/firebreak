# Devon Archery Finder – Conventions

This document defines the file layout and conventions for the Devon archery finder feature. All future tickets should follow these specifications as the single source of truth.

## Site Structure

The site uses a flat, static HTML structure with the following file organization:

- `index.html` – Main entry point and HTML structure
- `style.css` – All styling (no CSS framework)
- `data/devon_venues.json` – Venue data source
- `js/state.js` – State management and data loading
- `js/map.js` – Map rendering and interaction
- `js/list.js` – List rendering and item display
- `js/controls.js` – Control panel and user interaction logic

## Data Schema

Venue objects in `devon_venues.json` follow this schema:

```json
{
  "id": "string (unique identifier)",
  "name": "string (venue name)",
  "address": "string (full address)",
  "lat": "number (latitude)",
  "lng": "number (longitude)",
  "cost_gbp": "number or null (cost in GBP, null if free or unknown)",
  "cost_notes": "string (additional pricing information)",
  "rating": "number or null (0–5 scale, one decimal place, null if not rated)",
  "rating_count": "integer or null (number of ratings)",
  "source_url": "string or null (reference URL)"
}
```

## Script Load Order

Scripts are loaded in plain `<script>` tags with no bundler or modules. The load order must be:

1. `js/state.js` – Initializes state and data
2. `js/map.js` – Map rendering (depends on state)
3. `js/list.js` – List rendering (depends on state)
4. `js/controls.js` – Controls (depends on map and list)

No deferred loading, dynamic imports, or module systems.

## Styling Conventions

- **Layout**: Two-pane design with map on left/top and list on right/bottom
- **Colors**: Define two or three main colors as CSS variables (no inline colors)
- **Framework**: No CSS framework; all styling is custom CSS
- **Responsiveness**: Adapt layout for viewport size as needed

## Deployment

- **Source**: `main` branch at repository root
- **Host**: GitHub Pages
- **Method**: Automatic deployment via `.github/workflows/deploy-pages.yml`
- **Site Type**: Static site (no build step required)
