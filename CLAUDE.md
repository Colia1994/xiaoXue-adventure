# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start Vite dev server with HMR
npm run build    # Production build
npm run preview  # Preview production build locally
npm run lint     # ESLint check
```

No test framework is configured.

## Architecture

This is a Roguelike card game ("小雪闯上海") built with React 19 + Vite 8 + PixiJS 8.

### Core Layer

- **`src/App.jsx`** — Monolithic ~2500-line component (`XiaoXueGame`) that owns all game state and logic. Game phases: `title → battle → gameover/win`. Contains card playing, enemy AI turns, gene infection/spreading, drag-and-drop, and animation orchestration. State is managed via `useState`/`useRef` (no external state library).

- **`src/game/constants.js`** — All game data: 8 gene types (`GENES`), 10 mutation combos (`MUTATIONS`), card definitions (`DECK_CONFIG`), enemy templates for 6 stages (`ENEMY_TEMPLATES`), boss skills/patterns (`BOSS_SKILLS`, `BOSS_PATTERNS`), and `generateDeck()`.

- **`src/game/battleLogic.js`** — `calcCardEffect(card, buff)` computes final damage/armor/heal by applying gene bonuses and mutation effects.

- **`src/game/soundSystem.js`** — Procedural 8-bit sound via Web Audio API oscillators. No audio files; all sounds are synthesized.

### Gene/Mutation System

Cards carry genes (e.g. `sharp`, `tough`, `fast`). When a card is played, its genes "infect" adjacent cards in hand. A card with two specific genes triggers a mutation (combo skill) with enhanced effects. Mutations are keyed by sorted gene pair: `getMutationKey(a, b)` → `"sharp+tough"`. There are 10 defined mutation combos.

### UI Layer

- **`src/components/`** — `Card.jsx` (card rendering + drag handlers), `Enemy.jsx`, `PlayerCharacter.jsx`, `PlayerStatus.jsx`, `SpineCanvas.jsx` (Spine animation via `@esotericsoftware/spine-pixi`), `Tooltip.jsx`.

- **`src/effects/`** — PixiJS-based battle effects: `BattleEffects.jsx`, `ComboSystem.jsx`, `DamageNumbers.jsx`, `HitEffects.jsx`, `ParticleSystem.jsx`, `ScreenShake.js`, `StatusEffects.jsx`.

### Patterns

- Drag-and-drop uses refs (`mouseDownIdxRef`, `mouseDownPosRef`, `hasDraggedRef`) managed in App.jsx with mouse/touch event listeners on `window`.
- All styling is inline with CSS custom properties from `src/index.css` for responsive sizing via `clamp()`.
- Card types: `attack`, `defend`, `heal`, `buff`, `skill`. Non-attack cards play on click; attack cards require dragging onto an enemy target.
- Enemy AI: each enemy has a skill pool in `BOSS_SKILLS`; the final boss uses a fixed rotation pattern (`BOSS_PATTERNS`).
