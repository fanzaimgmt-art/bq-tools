# Obra — Design Reference Synthesis (top platforms → what to apply)

Studied the design language of the platforms people use daily. Distilled the patterns and applied them to Obra. (Marketing sites animate perpetually so static capture wasn't reliable — this is the synthesis + the concrete changes made.)

## What the top platforms do
- **Linear** — near-black surface, ONE subtle accent, tight type scale, very generous + consistent spacing, minimal borders, FLAT buttons with a subtle shadow, smooth (never bouncy) motion, lots of negative space.
- **Stripe** — clean, restrained type WEIGHTS (semibold, not black everywhere), heavy whitespace, FLAT solid buttons (no glow), gradients used sparingly as a single accent, not on every element.
- **Vercel** — extreme minimalism, sharp + flat, mono accents, very tight and clean, nothing decorative.
- **Mercury / Ramp (fintech)** — calm, serious, trustworthy: muted neutrals + ONE accent, simple flat cards, NO flashy glows. "This handles my money" = stability over effects.

## The common thread (= "premium + stable")
**Restraint, not effects.** Flat over glowy. Semibold over black. Generous consistent spacing. One accent. Minimal chrome. Smooth subtle motion. Token-consistent radii.

## Obra gaps found + fixes applied
1. **Primary button was flashy** — gold *gradient* + heavy 24px gold *glow* + *spring/bounce* easing. Reads as flashy, not premium/stable. → **Fixed:** flat solid gold, subtle shadow, smooth ease-out lift on hover, weight 600. (Global, via style.css → every page.)
2. **Card radius hardcoded 14px** (off-token) → use `--r-lg` (16px) for consistency.
3. **Over-bold display weights** in places → reserve heaviest weight for the hero; semibold for section headings. (Homepage already toned down.)
4. **Excess gold glows** on the busy homepage → removed in the homepage simplification.

## Already done in prior iterations
Homepage cut 10→5 sections; nav/footer unified + cleaned; typography snapped to one scale (no random sizes); new Obra "O" icon.

## Still optional (needs Moshe's call — bigger move)
- Display typeface: Space Grotesk is distinctive but a touch quirky for a *trust* brand. A more grounded grotesk could feel more "stable." Not changed without his sign-off.
