# Design System: Saint // Cold Steel Hosting

<!-- impeccable:design-tokens -->

## Aesthetics & Atmosphere
Tactical cyber-ops command center, high-end developer terminal, aggressive minimalist engineering. Deep black void punctuated by razor-sharp crimson lasers and crisp technical typography.

## Color Tokens
- `bg-pitch`: `#000000` (Pure pitch black void)
- `bg-charcoal`: `#080808` (Darkest charcoal surface)
- `bg-panel`: `#0d0d0d` (Tactical container panels)
- `bg-panel-elevated`: `#141414` (Hover and elevated states)
- `accent-crimson`: `#FF0000` (Pure vibrant neon red highlight)
- `accent-crimson-dim`: `#990000` (Subdued structural red)
- `accent-crimson-dark`: `#3a0000` (Grounded border/shadow base)
- `accent-blood`: `#550000` (Deep background warning tint)
- `text-stark`: `#FFFFFF` (High contrast primary headings/labels)
- `text-silver`: `#D4D4D8` (High readability body text)
- `text-muted`: `#71717A` (Technical metadata, subtext, timestamps)
- `border-dim`: `#1f1f1f` (Inactive hairline borders)
- `border-crimson`: `#FF0000` (Active focused borders)
- `border-crimson-subtle`: `rgba(255, 0, 0, 0.25)`

## Typography
- **Monospace Primary:** `JetBrains Mono`, `Fira Code`, `ui-monospace`, `SFMono-Regular`, monospace
- **Headings:** Bold uppercase technical labels (`SAINT // COLD STEEL HOSTING`, `CLUSTER_METRICS_V8.2`, `ORCHESTRATION_ENGINE`)
- **Hierarchy:** High visual contrast with crimson highlights on technical parameters, ports, status indicators, and alerts.

## Components & Form Factors
- **Corners:** Hard edges strictly enforced (`rounded-none` or `rounded-sm`). No pill shapes, no soft bubbly cards.
- **Borders:** Thin 1px technical pixel-borders (`border border-red-950/40 hover:border-red-600/80`).
- **Glow & Shadows:** Subtle active glowing box-shadows (`box-shadow: 0 0 15px rgba(255, 0, 0, 0.3)`).
- **Custom Scrollbar:** Pitch black track, 4px width, deep crimson thumb (`#990000`).
- **Tactical Grid:** Subtle background dot/line cyber grid patterns (`background-size: 24px 24px`).
