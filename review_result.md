# Principal Engineer Review — Global Demographics Simulation Engine

**Reviewer perspective:** Staff / Principal-level, FAANG standards  
**Date:** 2026-03-07  
**Repo:** `LawrenceHwang/global-demographics`  
**Scope:** Architecture, Implementation, Algorithm, Accessibility, i18n, UX/UI

---

## Executive Summary

This is a well-conceived, educationally impactful demographic simulation SPA with clean visual design and solid domain knowledge. The core simulation logic is correct and the UI is polished. However, **the entire application lives in a single 980-line file (`App.jsx`)**, making it the dominant structural risk for any future refactoring. Below is a systematic review with prioritized, actionable recommendations.

**Overall rating: B+** — Strong concept and design; needs architectural decomposition and accessibility improvements before scaling further.

---

## 1. Architecture

### 1.1 The Single-File Monolith (Critical)

> [!CAUTION]
> `App.jsx` is a **68 KB, 980-line monolith** containing country configuration data, mortality profiles, the simulation engine, i18n translations, data sources, helper functions, chart rendering logic, and all UI components.

**Impact:** Any change to any concern risks regressions in unrelated areas. Merge conflicts will be frequent. Test isolation is impossible.

**Recommended decomposition:**

| Module | Responsibility |
|---|---|
| `data/countries.js` | `COUNTRY_CONFIG` object |
| `data/mortality.js` | `MORTALITY_PROFILES` |
| `data/sources.js` | `DATA_SOURCES` |
| `engine/simulation.js` | `runSimulation`, `buildCountryPopulation` |
| `i18n/translations.js` | Translation strings (or adopt `react-i18next`) |
| `i18n/useTranslation.js` | The `t()` hook, extracted from the component |
| `components/Header.jsx` | App bar with language/theme controls |
| `components/StatusBanner.jsx` | Dependency status banner |
| `components/CountrySelector.jsx` | Country grid |
| `components/PlaybackControls.jsx` | Year slider, play/pause/reset |
| `components/TfrControls.jsx` | TFR card (fixed/dynamic) |
| `components/MigrationControls.jsx` | Migration slider |
| `components/MetricCards.jsx` | Total Pop / Dep Ratio / Workforce cards |
| `components/charts/DependencyTrajectory.jsx` | SVG trajectory chart |
| `components/charts/DemographicPyramid.jsx` | SVG pyramid chart |
| `components/charts/PopulationComposition.jsx` | SVG composition chart |
| `components/Footer.jsx` | Data sources, links |
| `hooks/useSimulation.js` | Custom hook wrapping simulation state |
| `hooks/useTheme.js` | Theme toggle logic |
| `utils/format.js` | `formatPop`, `computeYAxisMax`, `formatYLabel` |

### 1.2 State Management

The component manages **11 independent `useState` calls** at root level. As complexity grows, this will become unwieldy.

**Recommendation:** Consolidate related state into a `useReducer` or extract custom hooks:
- `useSimulationParams()` → `{ tfr, isDynamicTfr, terminalTfr, terminalYear, migration, country }`
- `usePlayback()` → `{ currentYear, isPlaying, play, pause, reset }`
- `useTheme()` → `{ theme, toggle }`

### 1.3 No Testing Infrastructure

> [!WARNING]
> There are **zero tests** — no unit tests, no integration tests, no snapshot tests. The simulation engine is a pure function ideal for unit testing.

**Recommendation:**
- Add Vitest (already in the Vite ecosystem)
- Write unit tests for `runSimulation`, `buildCountryPopulation`, `formatPop`, `computeYAxisMax`
- Add snapshot tests for the SVG chart components once extracted
- Consider Playwright for E2E smoke tests on the live demo

### 1.4 Build & Deployment

The CI/CD pipeline (`deploy.yml`) is clean and correct. Minor improvements:
- The `package.json` `name` field is still `"taiwan-demographics"` — should be `"global-demographics"`
- The README Getting Started section says `cd taiwan-demographics` instead of `cd global-demographics`
- `dist/` is in `.gitignore` but is also tracked as a directory in the repo — should be cleaned

---

## 2. Implementation Quality

### 2.1 Strengths

- **Deterministic, pure simulation function** — `runSimulation` is a pure function with no side effects; easy to test and reason about
- **Memoization** — Correct use of `useMemo` to avoid recomputing simulation on every render
- **Inline SVG charts** — Zero charting library dependencies; impressive level of control
- **Clean Tailwind usage** — Consistent use of design tokens, good dark mode support

### 2.2 Issues

| Severity | Issue | Location |
|---|---|---|
| 🔴 High | Inline IIFE inside JSX (`{(() => { ... })()}`) for the pyramid chart makes it hard to read, debug, or test. Extract to a component. | L839–882 |
| 🟡 Medium | `history.find(h => h.year === currentYear)` is O(n) per render; with 101 entries this is fine, but `history[currentYear - 2025]` would be O(1) and is already used for `popByYear`. | L440 |
| 🟡 Medium | Magic numbers throughout: `35` (reproductive years), `0.5` (gender ratio), `100` (year span), `15` (migration bins). These should be named constants. | Multiple |
| 🟡 Medium | `useEffect` for playback interval uses `100ms` — this is hardcoded and not configurable. Consider a `PLAYBACK_SPEED_MS` constant. | L476–486 |
| 🟡 Medium | `getDependencyStatus` is defined **inside** the component, recreated every render. Move outside or wrap in `useCallback`. | L488–494 |
| 🟢 Low | Mixed function definition styles (`function` vs arrow `const`). Choose one convention and stick with it. | Throughout |
| 🟢 Low | `xPos` hardcodes `100` for the year range (2025–2125). If the simulation range ever changes, this will silently break. | L499 |

### 2.3 Performance Considerations

- **Full simulation runs on every parameter change.** This is 101 years × 101 cohorts — O(10K) operations, which is trivially fast. Not a concern currently, but if you add multi-country comparison mode, consider Web Workers.
- **The `popByYear` array stores 101 copies of 101-element arrays.** ~10K numbers — negligible memory. Fine as-is.
- **Re-rendering SVG charts:** Every slider tick re-renders 3 SVG charts. React's diffing handles this, but `React.memo` wrappers on chart components (once extracted) would be a good optimization.

---

## 3. Algorithm & Domain Accuracy

### 3.1 Cohort-Component Model

The simulation implements a standard **cohort-component method**, the gold standard in demography. The implementation is sound:
- ✅ Age-specific mortality applied correctly (age *i* survivors = population at *i-1* × (1 - mortality at *i-1*))
- ✅ Births derived from women 15–49 × TFR ÷ 35 — reasonable simplification
- ✅ Migration distributed to working-age cohorts 20–34
- ✅ Dynamic TFR linear interpolation works correctly

### 3.2 Simplifications & Known Limitations

| Simplification | Impact | Recommendation |
|---|---|---|
| **Flat gender ratio (50%)** | Overstates female population slightly for countries with gender imbalances (e.g., China, India) | Accept for v1; flag in methodology |
| **Uniform TFR ÷ 35** instead of Age-Specific Fertility Rates (ASFR) | Misses the fertility peak at 25–34 in developed countries; underweights contributions from younger mothers in high-TFR countries | Medium-term: add ASFR if data sourced |
| **Static mortality** | Real mortality is improving over time; life expectancy in 2100 will be higher than today | Accept for v1; document assumption |
| **Only 2 mortality profiles** | A country like China is labeled "developed" but has different mortality than Germany | Consider adding a "middle" profile |
| **Migration only to 20–34** | Real migration has wider age distribution, includes families | Accept for v1 |
| **No sex-disaggregated model** | Can't model gender-specific policies (e.g., China's gender imbalance) | Accept for v1 |
| **Year range discrepancy**: README says "2025–2175" but code simulates 2025–2125 | Confusing | Fix the README |

### 3.3 Numerical Stability

- `Math.max(0, nextPop[i] + immigrantPerBin)` correctly prevents negative populations during emigration — good.
- The accumulator at age 100 (`nextPop[100] += currentPop[100] * (1 - mortality[100])`) prevents population from "falling off the edge" — correct.

---

## 4. Accessibility (A11y)

> [!IMPORTANT]
> The application has **significant accessibility gaps** that would prevent use by screen-reader users and reduce usability for users with motor, cognitive, or visual impairments.

### 4.1 Critical Issues

| Issue | Details |
|---|---|
| **SVG charts have no accessible data** | All three charts use `aria-label` on the `<svg>` element but provide no accessible alternative. Screen readers will announce "Dependency Ratio Trajectory" and nothing else. No `<title>`, `<desc>`, `role="img"`, or data table fallback. |
| **Range inputs lack `aria-label`** | The year slider, TFR slider, terminal TFR slider, target year slider, and migration slider have **no accessible names**. A screen reader will just say "slider". |
| **No `<main>` landmark** | The page has `<header>` but no `<main>`, `<nav>`, or `<footer>` landmarks. Screen-reader navigation is impaired. |
| **`lang="en"` is hardcoded** in `index.html` | When the user switches to Chinese/Korean/Japanese, the `<html lang>` attribute doesn't update. Screen readers will attempt to read CJK text with English pronunciation rules. |
| **Focus management** | Country buttons have no `aria-current` or `aria-pressed` attribute. Keyboard users cannot determine which country is selected without visual cues. |
| **Color-only encoding** | The dependency ratio trajectory chart and pyramid chart rely solely on color to distinguish zones/bands. Users with color vision deficiency cannot interpret thresholds. |

### 4.2 Additional Improvements

- Add `aria-live="polite"` to the status banner so screen readers announce dependency status changes
- Range inputs should announce their current value (via `aria-valuetext`)
- The play/pause button correctly has text labels — good
- The collapsible data sources section should use `aria-expanded`
- All buttons should have minimum 44×44 CSS px touch targets (several are below this)

---

## 5. Internationalization (i18n)

### 5.1 Strengths

- 4 languages fully supported: English, 繁體中文, 한국어, 日本語
- Translation function `t()` with parameter interpolation is clean
- Country names are localized
- README has a Chinese translation (`README.zh-TW.md`)

### 5.2 Issues

| Severity | Issue |
|---|---|
| 🔴 High | **`lang` attribute not synced.** As noted in A11y, `<html lang="en">` never changes. This is both an i18n and accessibility bug. Use `useEffect` to set `document.documentElement.lang = lang`. |
| 🟡 Medium | **Footer links are hardcoded** — "Live Demo" / "GitHub" have inline translations via ternary chain (L966) instead of using the `t()` function. This pattern won't scale. |
| 🟡 Medium | **Number formatting is locale-unaware.** `formatPop` always uses English-style formatting (e.g., "23.3M"). Korean and Japanese conventions differ. Consider using `Intl.NumberFormat` with the active locale. |
| 🟡 Medium | **No RTL support.** If Arabic or Hebrew were added, the layout would break. Not urgent but worth noting in the architecture. |
| 🟡 Medium | **Translation keys are in a flat namespace.** As translations grow, a nested structure (`controls.tfr.label`) would be easier to maintain. |
| 🟢 Low | **`videoTitle` is untranslated** across all locales (always English). This is perhaps intentional since it's a proper title, but it should be documented. |
| 🟢 Low | **Translation file colocation.** Translations should be in separate files per language (e.g., `i18n/en.json`, `i18n/zh.json`). This makes it easier for translators to work independently and for tools like Crowdin/Weblate to ingest. |

---

## 6. UX / UI Design

### 6.1 Strengths (genuine praise)

- **Excellent visual hierarchy.** The status banner → metric cards → charts reading order is intentional and effective.
- **Responsive layout.** The sidebar collapses on mobile with a toggle — good pattern.
- **Dark mode** is well-implemented with consistent Tailwind dark: variants.
- **Dependency key card** provides essential context for interpreting the data — great pedagogical design.
- **Auto-scaling axes** on all charts prevent clipping and adapt to different countries' population scales.
- **Color-coded status system** (green → amber → orange → red → rose) creates appropriate urgency.

### 6.2 Issues & Suggestions

| Severity | Issue | Recommendation |
|---|---|---|
| 🔴 High | **Pyramid chart is symmetric (not gendered).** Users expect population pyramids to show male-left / female-right. The current design shows the same data mirrored, which is technically incorrect and misleading. | Either show Male/Female split (requires sex-disaggregated data) or clearly label this as "total population by age" and use a horizontal bar chart instead of a mirrored butterfly chart. |
| 🟡 Medium | **No tooltips on charts.** Users cannot get exact values for a specific year/data point without scrubbing the slider. | Add hover tooltips to the trajectory and composition charts, at minimum showing value at the cursor's X position. |
| 🟡 Medium | **Year slider precision.** The slider moves 1 year per step across 100 years. On small screens this is imprecise. | Consider adding ±1 year step buttons or a numeric input field alongside the slider. |
| 🟡 Medium | **Country name truncation.** "United Stat..." is truncated on the button (visible in screenshot). | Use a 2-letter country code or abbreviation below the flag instead: "US", "CA", "JP", etc. Or increase the grid column span. |
| 🟢 Low | **No loading state.** On first load, the simulation runs synchronously before paint. For the current data this is imperceptible, but would become noticeable with more countries. | Consider a skeleton screen for perceived performance. |
| 🟢 Low | **Footer links** ("Live Demo" / "GitHub") are self-referential when already on the live demo. | Consider detecting the current origin and suppressing the live demo link. |
| 🟢 Low | **Playback speed is not adjustable.** Power users may want 2× or 0.5× speed. | Add a speed selector dropdown. |

---

## 7. Prioritized Refactoring Roadmap

Grouped by effort and impact, ordered by recommended execution sequence:

### Phase 1: Foundation (1–2 days)

1. **Decompose `App.jsx`** into the module structure from §1.1
2. **Fix `package.json` name** to `"global-demographics"`
3. **Fix README inconsistencies** (year range, clone directory name)
4. **Add Vitest** and write unit tests for `runSimulation` and `buildCountryPopulation`
5. **Extract named constants** for magic numbers

### Phase 2: Accessibility & i18n (1–2 days)

6. **Sync `<html lang>`** with the language selector
7. **Add `aria-label`** to all range inputs
8. **Add semantic landmarks** (`<main>`, `<nav>`, `<footer>`)
9. **Add `aria-live`** to the status banner
10. **Add accessible alternatives** for SVG charts (hidden data tables or `<desc>`)
11. **Move footer translations** into the `t()` system
12. **Move translations** to separate per-language files

### Phase 3: UX Polish (2–3 days)

13. **Fix or relabel the pyramid chart** — either add sex disaggregation or change to a horizontal bar chart
14. **Add hover tooltips** to charts
15. **Add `aria-expanded`** to collapsible sections
16. **Add keyboard navigation** improvements for the country selector
17. **Use `Intl.NumberFormat`** for locale-aware number formatting

### Phase 4: Architecture Maturation (3–5 days)

18. **Introduce `react-i18next`** or a similar library with lazy-loading per language
19. **Add Playwright E2E tests** covering country switching, simulation playback, and dark mode
20. **Add `React.memo`** to chart components to prevent unnecessary re-renders
21. **Consider `useReducer`** for simulation parameter state
22. **Add error boundaries** around chart components
23. **Bundle analysis** — ensure no unnecessary code is shipped

---

## 8. Summary Table

| Dimension | Score | Key Finding |
|---|---|---|
| **Architecture** | C+ | 980-line monolith, no tests, no separation of concerns |
| **Implementation** | B+ | Clean logic, good memoization, but magic numbers and inline IIFEs |
| **Algorithm** | A− | Sound cohort-component model with clearly documented simplifications |
| **Accessibility** | D | Charts, sliders, and landmarks lack accessible markup; `lang` attr broken |
| **i18n** | B | 4 languages work, but locale not synced with HTML, numbers not formatted |
| **UX/UI** | B+ | Strong visual design and interactivity, but the mirrored pyramid misrepresents data |

---

> [!TIP]
> The strongest asset of this project is the **domain expertise baked into the data configuration** — the calibrated anchor points, the well-sourced country data, and the clear methodology documentation. Protect this during refactoring by extracting it into its own data layer first.
