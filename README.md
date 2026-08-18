# Zotero List Select

Zotero 9 plugin — select items in the current library or collection by pasting a comma-separated list of field values.

## Features

- Match by **Title**, **DOI**, **Year**, or **Extra**
- Quoted values supported: `"A title, with a comma"` works correctly
- Values can be comma-separated or one per line (or mixed)
- DOI matching normalizes `https://doi.org/` and `doi:` prefixes automatically
- Optional case-sensitive matching
- Searches the currently selected collection, or the entire library if none is selected

## Install

1. Download `zotero-list-select.xpi` from the [latest release](https://github.com/wullli/zotero-list-select/releases/latest).
2. In Zotero: **Tools → Add-ons → gear icon → Install Add-on From File…**
3. Restart Zotero.

## Usage

1. In Zotero, navigate to the library or collection you want to search within.
2. Open **Tools → Select Items by List…**
3. Choose the field to match (Title, DOI, Year, Extra).
4. Paste your values — comma-separated, one per line, or both:

   ```
   10.1038/nature12373, 10.1126/science.1248506
   ```

   ```
   "A title, with a comma"
   Another Title
   ```

5. Click **Select Items**. Matching items are highlighted in the list.

## Versioning

Plugin versions follow `{zotero_major}.{zotero_minor}.{zotero_patch}` of the Zotero version they target, with an optional `.{n}` suffix for plugin-only patch releases:

| Plugin version | Meaning |
|---|---|
| `9.0.6` | First release for Zotero 9.0.6 |
| `9.0.6.1` | Bug fix, same Zotero target |
| `9.0.7` | Rebuilt/tested against Zotero 9.0.7 |

Pick the release whose prefix matches your installed Zotero version.

## Build from source

```bash
git clone https://github.com/wullli/zotero-list-select.git
cd zotero-list-select
npm run build
# produces zotero-list-select.xpi
```

## License

MIT
