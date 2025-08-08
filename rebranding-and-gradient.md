### Leaker Flow Rebranding & Brand Gradient

This document summarizes the updates made to rebrand the project to Leaker Flow and documents the brand gradient we created, including exact CSS tokens/utilities and where they are used.


### Branding Updates (Text, Metadata, Links)

- Project/package name
  - Updated `frontend/package.json` → `name: "leakerflow"`
- Site config and global metadata
  - `frontend/src/lib/site.ts` → `name`, `url`, `description`, and social links → Leaker Flow / `leakerflow.com`
  - `frontend/src/app/layout.tsx` and `frontend/src/app/metadata.ts` → titles, descriptions, authors, creator, publisher set to Leaker Flow / Comercial Toddy
- Share pages and dashboards
  - `frontend/src/app/share/[threadId]/layout.tsx` → Titles/descriptions now say “Leaker Flow”
  - Dashboards (`agents`, `projects`, `credentials`) layouts/titles updated to “Leaker Flow”
- Component alt text and copy
  - Sidebar/logo components → alt text set to “Leaker Flow”
  - Thread/Playback/Chat components → text and alt references changed from “Suna” to “Leaker Flow”
- Home and marketing copy
  - `frontend/src/components/home/sections/open-source-section.tsx` → repository text and links → `leakerflow/leakerflow`, copy updated to Leaker Flow
  - `frontend/src/components/home/sections/hero-section.tsx` → headline uses Leaker Flow with gradient text
  - `frontend/src/components/home/sections/use-cases-section.tsx` → section title and copy updated to Leaker Flow, icon treatments adjusted
  - `frontend/src/components/home/ui/hero-video-dialog.tsx` → play button container uses brand gradient
  - `frontend/src/components/home/sections/cta-section.tsx` → background uses brand gradient; primary CTA remains white
  - Footer and navbar links set to `leakerflow` profiles
- English consistency in home configuration
  - `frontend/src/lib/home.tsx` → all remaining Portuguese strings for hero/CTA/FAQ/Pricing/Quote standardized to English


### Brand Gradient Tokens (globals.css)

The brand gradient is defined centrally and available in both light and dark modes via CSS variables.

```css
:root {
  /* Leaker Flow brand gradient tokens */
  --brand-from: #8B5CF6; /* purple */
  --brand-via: #3B82F6;  /* blue */
  --brand-to:  #22D3EE;  /* cyan */
  --brand-gradient: linear-gradient(45deg, var(--brand-from) 0%, var(--brand-via) 50%, var(--brand-to) 100%);
}

.dark {
  /* Keep same gradient in dark; tweak here if needed */
  --brand-from: #8B5CF6;
  --brand-via: #3B82F6;
  --brand-to:  #22D3EE;
  --brand-gradient: linear-gradient(45deg, var(--brand-from) 0%, var(--brand-via) 50%, var(--brand-to) 100%);
}
```


### Brand Gradient Utilities (globals.css)

Utilities to apply the gradient as a background or as clipped text, plus optional CTA helpers.

```css
/* Leaker Flow: brand gradient utilities (centralized) */
.bg-brand-gradient { background-image: var(--brand-gradient) !important; background-size: 150% 150%; }
.text-brand-gradient {
  background-image: var(--brand-gradient) !important;
  background-repeat: no-repeat !important;
  background-size: 100% 100% !important;
  background-position: 0 0 !important;
  -webkit-background-clip: text !important;
  background-clip: text !important;
  color: transparent !important;
  -webkit-text-fill-color: transparent !important;
  display: inline-block; /* avoid block overlay */
}

/* Apply brand gradient to primary/secondary CTA-like elements without editing each component */
/* Buttons (shadcn/ui sets data-slot="button") */
[data-slot="button"].bg-primary,
[data-slot="button"].bg-secondary {
  background-image: var(--brand-gradient);
  background-color: transparent;
}
[data-slot="button"].bg-primary:hover,
[data-slot="button"].bg-secondary:hover { filter: brightness(1.03); }

/* Links styled as buttons (common CTAs use bg-secondary) */
a.bg-primary,
a.bg-secondary,
button.bg-primary,
button.bg-secondary {
  background-image: var(--brand-gradient);
  background-color: transparent;
}
a.bg-primary:hover,
a.bg-secondary:hover,
button.bg-primary:hover,
button.bg-secondary:hover { filter: brightness(1.03); }
```


### Where the Gradient Is Applied

- Text (clipped gradient)
  - Hero headline: `frontend/src/components/home/sections/hero-section.tsx` using `.text-brand-gradient`
  - Use-cases title: `frontend/src/components/home/sections/use-cases-section.tsx` using `.text-brand-gradient`
- Backgrounds / containers
  - Hero video play button (outer/inner circles): `frontend/src/components/home/ui/hero-video-dialog.tsx` using `.bg-brand-gradient`
  - CTA section main container: `frontend/src/components/home/sections/cta-section.tsx` using `.bg-brand-gradient`
  - Open-source badges and icon containers: `frontend/src/components/home/sections/open-source-section.tsx` using `.bg-brand-gradient`

Notes:
- The “View on GitHub” button intentionally remains white (`bg-white text-black`) as requested.
- Icons placed on gradient backgrounds use `text-white` and `border-transparent` for contrast.


### Usage Examples

- Gradient text:
  ```tsx
  <h1>
    <span className="text-brand-gradient">Leaker Flow</span>
    <span className="text-primary">, the AI Employee.</span>
  </h1>
  ```

- Gradient background container:
  ```tsx
  <div className="rounded-full bg-brand-gradient p-4">
    <Icon className="text-white" />
  </div>
  ```


### Additional Considerations

- The gradient tokens are centralized in `frontend/src/app/globals.css` to ensure consistency. Avoid hardcoding gradient colors directly in components; prefer `.bg-brand-gradient` or `.text-brand-gradient`.
- If future brand colors change, update only the `--brand-from`, `--brand-via`, `--brand-to` variables (light/dark) and all usages will follow. 