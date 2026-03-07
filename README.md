# Global Demographics Simulation Engine

**Languages:** English | [繁體中文](README.zh-TW.md)

An interactive React SPA that models population trajectories from **2025 to 2125** for **9 countries and regions**. Adjust the Total Fertility Rate (TFR) and Net Migration to explore how policy decisions shape a nation's dependency ratio and economic future.

**[→ Live Demo](https://lawrencehwang.github.io/global-demographics/)**

> **AI Collaboration Note:** This project was co-created with Gemini (Google) and [Claude](https://claude.ai) (Anthropic).

---

## Countries / Regions

| Country | 2025 TFR | Default Net Migration | Notes |
|---|---|---|---|
| 🇹🇼 Taiwan | 0.86 | +20,000 | One of the world's lowest TFRs |
| 🇺🇸 United States | 1.62 | +1,000,000 | High immigration offsetting low TFR |
| 🇨🇦 Canada | 1.44 | +400,000 | Strong immigration-driven growth |
| 🇯🇵 Japan | 1.20 | +100,000 | Paradigmatic aging society |
| 🇰🇷 South Korea | 0.72 | +100,000 | Record-low TFR (2023) |
| 🇨🇳 China | 1.09 | −100,000 | One-child policy legacy visible in pyramid |
| 🇩🇪 Germany | 1.35 | +300,000 | Post-war baby boom cohort approaching retirement |
| 🇳🇪 Niger | 6.73 | −20,000 | World's **highest** TFR — rapid growth |
| 🇲🇱 Mali | 5.97 | −30,000 | Second-highest TFR globally |

Niger and Mali are included as high-TFR reference points to show the opposite end of the demographic spectrum.

---

## About

This simulation uses a standard **Cohort-Component demographic model** to project how different policy levers alter a country's future population structure.

The core metric is the **Dependency Ratio** — the number of youth and elderly dependents per 100 working-age adults — tracked against thresholds from *Healthy Demographic Dividend* to *System Collapse*.

Each country ships with:
- Calibrated 2025 age distributions (from national statistics offices and UN WPP 2024)
- Country-specific TFR and net migration defaults
- Appropriate mortality profile (developed-world ~LE 80+ vs. high-fertility ~LE 62)

## Features

- **9 Countries / Regions** — Switch instantly; simulation resets to each country's verified 2025 baseline
- **Real-time Cohort Simulation** — Iterates 101 age cohorts year-by-year, applying mortality, fertility, and migration rates
- **Fixed vs. Dynamic TFR Scenarios** — Test a constant rate or model a gradual cultural/policy shift with a linearly interpolated "Terminal Target TFR"
- **Interactive Dashboards:**
  - Dependency ratio trajectory with colored threshold zones and hover tooltips
  - Age distribution chart with color-coded age bands and hover tooltips
  - Absolute population composition over time (Youth / Working / Elderly / Total) with auto-scaled Y-axis and hover tooltips
- **Cited Data Sources** — Collapsible footer lists every primary source per country
- **i18n** — Fully translated: English, 繁體中文, 한국어, 日本語 with locale-aware number formatting
- **Accessibility** — Semantic landmarks, ARIA labels on all controls, accessible chart descriptions, screen-reader-friendly language switching
- **Light / Dark mode**

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 18 |
| Build Tool | Vite 6 |
| Styling | Tailwind CSS 3 |
| Icons | Lucide React |
| Charts | Hand-coded inline SVG (zero charting dependencies) |
| Testing | Vitest |
| Deploy | GitHub Pages via `gh-pages` or GitHub Actions |

## Architecture

The codebase follows a modular component architecture:

```
src/
├── App.jsx                 # Thin orchestrator (~80 lines)
├── data/                   # Constants, country configs, mortality profiles, sources
├── engine/                 # Pure simulation functions + unit tests
├── utils/                  # Formatting utilities + unit tests
├── i18n/                   # Per-language translation files + useTranslation hook
├── hooks/                  # Custom hooks (useSimulation, usePlayback, useTheme)
└── components/             # UI components + charts/
```

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch
```

Unit tests cover the simulation engine (population construction, determinism, parameter sensitivity, boundary conditions) and formatting utilities.

## Getting Started

Requires **Node.js 18+**.

```bash
# Clone
git clone https://github.com/LawrenceHwang/global-demographics.git
cd global-demographics

# Install
npm install

# Develop
npm run dev
```

Open `http://localhost:5173` in your browser.

## Deployment

### Option A — Manual (one command)

```bash
npm run deploy
```

This runs `vite build` then pushes the `dist/` folder to the `gh-pages` branch. Your app will be live at:

```
https://<your-username>.github.io/global-demographics/
```

### Option B — GitHub Actions (automatic on push)

A workflow is included at `.github/workflows/deploy.yml`. Once you push to `main`, it builds and deploys automatically. Enable GitHub Pages in your repo settings:

> **Settings → Pages → Source: GitHub Actions**

## Data Sources & Methodology

All population figures are 2025 estimates (medium variant where applicable).

| Source | Coverage |
|---|---|
| **[UN World Population Prospects 2024](https://population.un.org/wpp/)** | All countries — primary reference |
| **[Taiwan MOHW](https://www.mohw.gov.tw/)** + National Development Council Projections 2022–2070 | Taiwan |
| **[US Census Bureau IDB 2024](https://www.census.gov/programs-surveys/international-programs/about/idb.html)** + CDC NCHS (TFR 2023: 1.616) | United States |
| **[Statistics Canada](https://www.statcan.gc.ca/)** Cat. 91-520-X | Canada |
| **[Statistics Bureau of Japan](https://www.stat.go.jp/)** 2024 + MHLW Vital Statistics (TFR 2023: 1.20) | Japan |
| **[Statistics Korea (KOSIS)](https://kosis.kr/)** 2024 (TFR 2023: 0.72 — record low) | South Korea |
| **[NBS China](https://www.stats.gov.cn/)** Statistical Yearbook 2024 (TFR 2023: 1.09) | China |
| **[Destatis](https://www.destatis.de/)** Bevölkerungsvorausberechnung 2024 (TFR 2023: 1.35) | Germany |
| **UN WPP 2024** + World Bank WDI 2024 | Niger, Mali |

### Simulation Methodology

- **Mortality:** Two profiles — *developed* (life expectancy ~80–84 yrs) and *high-fertility* (LE ~62 yrs, infant mortality ~50/1000). Approximated from WHO/UN age-specific death rates.
- **Births:** Women aged 15–49 (≈50% of that cohort) × (TFR ÷ 35 reproductive years) = annual births.
- **Migration:** Distributed evenly across working-age cohorts (ages 20–34). Negative values model net emigration.
- **Conceptual Framework:** Dependency ratio thresholds based on concepts from Max Fisher's *[How China blew up its own future](https://www.youtube.com/watch?v=AultJcNb90c)*.

## Contributing

Contributions, issues, and feature requests are welcome. If you are a demographer or data scientist and want to contribute more accurate Age-Specific Fertility Rates (ASFR), dynamic mortality curves, or additional countries, please open a Pull Request.

### Known Simplifications

- **Flat gender ratio (50%)** — Does not model sex-specific imbalances
- **Uniform TFR ÷ 35** — Uses a flat annual birth rate instead of Age-Specific Fertility Rates (ASFR)
- **Static mortality** — Mortality profiles do not improve over time
- **Two mortality profiles** — "Developed" and "high-fertility" (no intermediate profile)
- **Migration only to ages 20–34** — Real migration has a wider age distribution

## License

MIT
