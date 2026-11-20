# 02: Design system

The source is Figma page **03 · Components & Tokens** (`4:3`) and the variable collection **Keeper Color**. Every variable has a WEB code syntax such as `hsl(var(--primary))`. Board `9:2` shows the palette, type and voice.

Mood: warm paper, soft ink, no alarms. There's no clinical blue and no red anywhere. Light mode only in v2.

## 1. Tokens: paste into `src/index.css`
Replace the whole current `:root { … }` block. Drop `.dark`, the gradients and the blue shadows. shadcn's semantic names are mapped so existing `ui/*` components inherit the new look. **`--destructive` maps to the plum `safety` colour on purpose: there is no red in Keeper.**

```css
@layer base {
  :root {
    /* shadcn semantic tokens */
    --background: 37 42% 94%;          /* #F6F1E9 oat paper */
    --foreground: 251 12% 18%;         /* #2A2833 soft ink */
    --card: 38 100% 98%;               /* #FFFCF7 surface */
    --card-foreground: 251 12% 18%;
    --popover: 38 100% 98%;
    --popover-foreground: 251 12% 18%;
    --primary: 138 22% 37%;            /* #4A7356 moss */
    --primary-foreground: 38 100% 98%;
    --secondary: 125 21% 89%;          /* = primary-soft */
    --secondary-foreground: 138 24% 34%;
    --muted: 38 37% 90%;               /* #EFE8DC surface-sunken */
    --muted-foreground: 262 6% 39%;    /* #625E69 (darkened for AA) */
    --accent: 125 21% 89%;
    --accent-foreground: 138 24% 34%;
    --destructive: 260 32% 27%;        /* = safety plum, NOT red */
    --destructive-foreground: 38 100% 98%;
    --border: 36 32% 85%;              /* #E4DACB */
    --input: 36 32% 85%;
    --ring: 138 22% 37%;
    --radius: 1.25rem;                 /* 20px */

    /* Keeper tokens */
    --primary-soft: 125 21% 89%;       /* #DDE9DE */
    --primary-strong: 138 24% 34%;     /* #416A4D: text/icons on soft fills */
    --meal: 21 71% 70%;        --meal-soft: 24 83% 91%;      /* #E9A27C / #FBE3D3 */
    --sleep: 253 51% 71%;      --sleep-soft: 256 66% 94%;    /* #9F8FDB / #ECE7FA */
    --feeling: 43 74% 57%;     --feeling-soft: 45 85% 90%;   /* #E2B53F / #FBF0CF */
    --move: 147 23% 54%;       --move-soft: 130 27% 91%;     /* #6FA487 / #E3EFE5 */
    --water: 196 43% 61%;      --water-soft: 194 51% 92%;    /* #6FAFC6 / #E0F0F5 */
    --range-below: 252 49% 79%;  /* #B9AEE3 lavender */
    --range-in: 134 24% 69%;     /* #9CC2A5 sage */
    --range-above: 23 78% 73%;   /* #F0AE86 apricot */
    --safety: 260 32% 27%;       /* #3E2F5B plum */
    --safety-foreground: 38 100% 98%;

    --shadow-soft: 0 8px 24px hsl(251 12% 18% / 0.07);
    --shadow-lift: 0 2px 6px hsl(251 12% 18% / 0.10);
  }
  html { -webkit-tap-highlight-color: transparent; }
  body { @apply bg-background text-foreground font-sans antialiased; }
}
```

The existing `--success`, `--warning` and `--info` are used by `getLevelColor()` in `src/types/glucose.ts`. **Rewrite that helper** to return `range-below`, `range-in` or `range-above` classes, then delete those three vars.

## 2. Tailwind: `tailwind.config.ts` → `theme.extend`
```ts
colors: {
  // keep existing shadcn entries, then add:
  "primary-soft": "hsl(var(--primary-soft))",
  "primary-strong": "hsl(var(--primary-strong))",
  surface: { DEFAULT: "hsl(var(--card))", sunken: "hsl(var(--muted))" },
  meal: { DEFAULT: "hsl(var(--meal))", soft: "hsl(var(--meal-soft))" },
  sleep: { DEFAULT: "hsl(var(--sleep))", soft: "hsl(var(--sleep-soft))" },
  feeling: { DEFAULT: "hsl(var(--feeling))", soft: "hsl(var(--feeling-soft))" },
  move: { DEFAULT: "hsl(var(--move))", soft: "hsl(var(--move-soft))" },
  water: { DEFAULT: "hsl(var(--water))", soft: "hsl(var(--water-soft))" },
  range: { below: "hsl(var(--range-below))", in: "hsl(var(--range-in))", above: "hsl(var(--range-above))" },
  safety: { DEFAULT: "hsl(var(--safety))", foreground: "hsl(var(--safety-foreground))" },
},
fontFamily: {
  serif: ['"Fraunces Variable"', "Fraunces", "Georgia", "serif"],
  sans: ['"DM Sans"', "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
},
borderRadius: { tile: "22px", card: "24px", "card-lg": "28px", sheet: "32px" },
boxShadow: { soft: "var(--shadow-soft)", lift: "var(--shadow-lift)" },
maxWidth: { app: "430px" },
```
Remove `backgroundImage` (the gradients) and the `custom-*` shadows once nothing uses them.

## 3. Type scale
Add these as component classes in `src/index.css` (`@layer components`). They match the Figma text styles `Keeper/*`.

| Class | Family | Weight | Size / line height | Tracking | Use |
|---|---|---|---|---|---|
| `.t-display` | serif | 600 | 36/42 (hero 48–88 on landing) | −1px | Welcome, big moments |
| `.t-title` | serif | 600 | 28/34 (30/36 on screen titles) | −0.5px | Screen titles |
| `.t-heading` | serif | 600 | 21/27 | −0.2px | Card titles |
| `.t-quote` | serif italic | 400 | 22/30 | 0 | Quotes (landing/boards) |
| `.t-number` | serif | 400 | 56/60 (timer 56, rings 34–44) | −1.5px | Timers, countdowns, revealed glucose |
| `.t-body-l` | sans | 400 | 17/25 | 0 | Lead copy |
| `.t-body` | sans | 400 | 15/22 | 0 | Default |
| `.t-body-strong` | sans | 600 | 15/22 | 0 | Buttons, item titles |
| `.t-label` | sans | 600 | 13/18 | 0.1px | Chips, tab labels |
| `.t-caption` | sans | 500 | 12/16 | 0 | Meta |
| `.t-overline` | sans | 700 | 11/14 | 1.2px, uppercase | Section labels |

**Fonts:** self-host them, with no Google Fonts CDN, because of the local-first rule.
```bash
npm i @fontsource-variable/fraunces @fontsource/dm-sans
```
```ts
// src/main.tsx (and the landing entry)
import "@fontsource-variable/fraunces";
import "@fontsource-variable/fraunces/wght-italic.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";
```

## 4. Spacing, shape and elevation
- **Screen:** horizontal padding 24 px. Vertical rhythm between blocks is 14–18 px. The app column is `max-w-app mx-auto`.
- **Cards:** `bg-card rounded-card p-4` (16–18 px). Hero cards use `rounded-card-lg p-5`. Insight, nudge and info cards use the matching `*-soft` background with no border.
- **Sheets:** `rounded-t-sheet`, a 40×5 grabber, and a scrim of `foreground` at 30–32% opacity.
- **Pills and chips:** `rounded-full`.
- **Elevation:** use `shadow-lift` only on toggle knobs, selected segments and floating cards, and `shadow-soft` on floating panels. Everything else is flat.

## 5. Components (Figma → React)
Put these in `src/components/keeper/`. Build on shadcn primitives where noted.

| Figma | React | Spec |
|---|---|---|
| TabBar `5:166` (Active=Today/Week/Learn/You) | `TabBar` | Card background with a 1 px top border. 4 items, each 72 px wide. The active item has a `primary-soft` 60×32 pill behind a 22 px icon and a `t-label text-primary` label; inactive items use `t-caption text-muted-foreground`. 34 px home-indicator safe area via `env(safe-area-inset-bottom)`. |
| LogTile `5:227` (Kind=Meal/Sleep/Feeling/Move/Water) | `LogTile kind` | 62 px column: a 58 px `rounded-tile bg-{kind}-soft` square with a 24 px icon (`stroke-[1.8] text-foreground`), then a `t-label` label. It's a button with `aria-label="Log {kind}"`. |
| LogDot `5:228` | `LogDot kind` | 40 px `rounded-[14px] bg-{kind}-soft` with a 20 px icon. Also used with `mail` for envelopes. |
| Chip `5:237` (State=Default/Selected) | `Chip selected` | `rounded-full px-4 py-2.5 t-label`. **Default:** `bg-card border border-border`. **Selected:** `bg-primary-soft border-[1.5px] border-primary text-primary-strong` with a 16 px check icon. `role="checkbox"` or `aria-pressed`. |
| Button `5:244` (Primary/Secondary/Ghost) | extend shadcn `Button` | Height 54, `rounded-full`, `t-body-strong`. **Primary:** `bg-primary text-primary-foreground`. **Secondary:** `bg-card border`. **Ghost:** `text-primary`. Full width on screens. |
| FaceOption `5:297` (Mood × State) | `FaceOption mood selected` | 104 px card, `rounded-card`, 44 px face SVG, `t-label`. **Selected:** `bg-feeling-soft border-2 border-feeling`. `role="radio"`. SVGs below. |
| TimelineItem `5:298` | `TimelineItem` | Card, `rounded-[20px]`, padding 12/16: LogDot, title (`t-body-strong`), meta (`t-caption muted`), time on the right. |
| (screens) | `Toggle` | 52×32 track (`bg-primary` on / `bg-border` off) with a 26 px card-colour knob carrying `shadow-lift`. Use the shadcn `Switch` restyled. |
| (screens) | `Segmented` | `bg-muted rounded-full p-1`. The selected segment is `bg-card shadow-lift`. Use Radix ToggleGroup. |
| (screens) | `RangeBar value range` | Three rounded 14 px segments (`range-below` / `range-in` / `range-above`), widths proportional to the bands. The marker is a 28 px ring (card fill, 3 px foreground stroke). Labels use `t-caption`. Never put numbers on the bar. |
| (screens) | `Quilt` | A grid of rounded patches coloured by kind (solid for some, soft for others). Missing slots are dashed `border-border`. |
| (screens) | `Ring` | SVG `stroke-linecap="round"`, 14–16 px stroke. The track is the soft colour and progress is the accent. Respect reduced motion. |
| (screens) | `Envelope` | SVG below. |
| (screens) | `SafetyCard` / `SafetyScreen` | `bg-safety text-safety-foreground`. Inner cards use a translucent overlay at 12% opacity. |

### Face SVGs (44×44, stroke 2, `currentColor`)
```html
<!-- Sleepy -->
<svg viewBox="0 0 44 44" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="22" cy="22" r="19"/><path d="M12.5 19.5q3.5 2.6 7 0"/><path d="M24.5 19.5q3.5 2.6 7 0"/><path d="M19 29.5h6"/><path d="M33 6h5l-5 5h5" stroke-width="1.6"/></svg>
<!-- Steady -->
<svg viewBox="0 0 44 44" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="22" cy="22" r="19"/><circle cx="16" cy="18.5" r="1.8" fill="currentColor" stroke="none"/><circle cx="28" cy="18.5" r="1.8" fill="currentColor" stroke="none"/><path d="M15 26q7 6 14 0"/></svg>
<!-- Buzzy -->
<svg viewBox="0 0 44 44" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="22" cy="22" r="17"/><circle cx="16" cy="18" r="2.4" fill="currentColor" stroke="none"/><circle cx="28" cy="18" r="2.4" fill="currentColor" stroke="none"/><ellipse cx="22" cy="28" rx="3.4" ry="3.8"/><path d="M3 9l3.2 2.6"/><path d="M41 9l-3.2 2.6"/><path d="M22 1.5v2.8"/></svg>
```

### Envelope SVG (D4)
```html
<svg viewBox="0 0 200 150"><rect x="4" y="20" width="192" height="126" rx="18" class="fill-card stroke-border" stroke-width="2"/><path d="M8 30 L100 92 L192 30" class="stroke-border" stroke-width="4" fill="none" stroke-linejoin="round"/><circle cx="100" cy="92" r="26" class="fill-primary"/><!-- lucide Leaf, 22px, text-primary-foreground, centred on the seal --></svg>
```

## 6. Icons
Use `lucide-react` (already installed). Stroke 1.8–2, sizes 16, 18, 20, 22 and 24.

| Use | Lucide |
|---|---|
| Meal | `Utensils` |
| Sleep | `Moon` |
| Feeling | `Smile` |
| Move | `Footprints` |
| Water | `GlassWater` |
| Medicines | `Pill` |
| Tea | `Coffee` |
| Tabs | `Sun` (Today), `LayoutGrid` (Week), `BookOpen` (Learn), `User` (You) |
| Tiny habit / break-fast | `Leaf` |
| Why this / fasting | `Clock` |
| Safety | `ShieldCheck` |
| Sealed | `Mail` |
| Locked | `Lock` |
| Show / hide number | `Eye` / `EyeOff` |
| Photo | `Camera` |
| Insight | `Sparkles` |
| Ramadan | `Sunrise` / `Moon` |
| Desk moves | `Armchair` |
| Calm minute | `Wind` |
| Packaged snack | `Package` |
| Navigation | `ChevronLeft`, `ChevronRight`, `X`, `Check` |
| Privacy note | `Heart` |

## 7. Accessibility
WCAG contrast, computed from the tokens:

| Pair | Ratio | OK for |
|---|---|---|
| foreground on background | 12.9:1 | all text |
| foreground on card | 14.2:1 | all text |
| muted-foreground (#625E69) on background | 5.6:1 | body text |
| muted-foreground on surface-sunken | 5.2:1 | body text |
| primary-foreground on primary | 5.3:1 | button labels |
| primary on background | 4.8:1 | links, ghost buttons |
| **primary-strong** on primary-soft | 4.95:1 | selected chip labels and pill text. Don't use `primary` on `primary-soft` (4.3:1). |
| safety-foreground on safety | 11.6:1 | all text |
| foreground on any `*-soft` | ≥ 11.5:1 | all text |

Accent colours (`meal`, `sleep`, `feeling`, `move`, `water`, `range-*`) are **fills only**, never text.

Other requirements:
- Never use colour alone. Range bands always carry the words Below, In your range or Above.
- Face options have visible labels and `aria-checked`.
- Timers announce through `aria-live="polite"` once per minute, not every second.
- Support 200% text zoom without clipping: cards grow, nothing has a fixed height except the rings.

## 8. Motion
- 180–280 ms `ease-out` for sheets, segment changes and the toggle.
- The ring progresses linearly, updated once per second.
- No confetti, no shake and no bounce on errors.
- `prefers-reduced-motion`: no ring animation, and sheets fade instead of sliding.
