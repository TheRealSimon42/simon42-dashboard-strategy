# Internationalization (i18n) - Language Files

This directory contains separate language files for the Simon42 Dashboard Strategy.

## Structure

Each language has its own file following the naming pattern:
- `simon42-i18n-{lang}.js` where `{lang}` is the ISO 639-1 language code (e.g., `de`, `en`, `fr`, `es`)

## Current Languages

- **German (de)**: `simon42-i18n-de.js`
- **English (en)**: `simon42-i18n-en.js`

## Adding a New Language

To add support for a new language:

1. **Create a new language file** in this directory:
   ```bash
   dist/utils/i18n/simon42-i18n-{lang}.js
   ```
   Example: `simon42-i18n-fr.js` for French

2. **Export the translations** as a named export with the language code:
   ```javascript
   // dist/utils/i18n/simon42-i18n-fr.js
   export const fr = {
     overview: "Vue d'ensemble",
     summaries: "Résumés",
     favorites: "Favoris",
     // ... all other translation keys
   };
   ```

3. **Import and register** in `simon42-i18n.js`:
   ```javascript
   // Import the new language file
   import { fr } from './i18n/simon42-i18n-fr.js';
   
   // Add it to the translations object
   const translations = {
     de,
     en,
     fr  // Add here
   };
   ```

4. **Ensure all keys are present**: Copy all keys from an existing language file (e.g., `de` or `en`) and translate them. Missing keys will fall back to the key name itself.

## Translation Keys

All language files must include the same set of keys. See `simon42-i18n-de.js` or `simon42-i18n-en.js` for the complete list of required keys.

## Usage

The i18n system is used throughout the codebase via the `t()` function:

```javascript
import { t, initLanguage } from './utils/simon42-i18n.js';

// Initialize language (usually done once at startup)
initLanguage(config, hass);

// Use translations
const text = t('overview'); // Returns "Übersicht" in German, "Overview" in English
```

## Language Detection

The system automatically detects the language from:
1. Explicit `language` or `lang` config property
2. `hass.language` (Home Assistant language setting)
3. Falls back to German (`de`) if no match is found

## Placeholder Support

Translations support placeholders using `{key}` syntax:

```javascript
// In language file:
publicTransportCardMissingDeps: "Die Card '{card}' ist nicht installiert."

// Usage:
t('publicTransportCardMissingDeps', { card: 'hvv-card' })
// Returns: "Die Card 'hvv-card' ist nicht installiert."
```

