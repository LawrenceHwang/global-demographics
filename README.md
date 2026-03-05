# Taiwan Demographics Simulation Engine

**Languages:** English | [繁體中文](README.zh-TW.md)

An interactive React SPA that models Taiwan's population trajectory from **2025 to 2100**. Adjust the Total Fertility Rate (TFR) and Net Migration to explore how policy decisions shape a nation's dependency ratio and economic future.

> **AI Collaboration Note:** This project was co-created with Gemini (Google) and [Claude](https://claude.ai) (Anthropic).

---

## About

Taiwan has one of the lowest Total Fertility Rates in the world (~0.86 as of 2025), pushing it rapidly toward a "super-aged" society. This simulation uses a standard **Cohort-Component demographic model** to project how different policy levers alter Taiwan's future.

The core metric is the **Dependency Ratio** — the number of youth and elderly dependents per 100 working-age adults — tracked against thresholds from *Healthy Demographic Dividend* to *System Collapse*.

## Features

- **Real-time Cohort Simulation** — Iterates 101 age cohorts year-by-year, applying mortality, fertility, and migration rates
- **Fixed vs. Dynamic TFR Scenarios** — Test a constant rate or model a gradual cultural/policy shift with a linearly interpolated "Terminal Target TFR"
- **Interactive Dashboards:**
  - Dependency ratio trajectory with colored threshold zones
  - Real-time demographic pyramid (watch it flip upside-down)
  - Absolute population composition over time (Youth / Working / Elderly / Total)
- **i18n** — Fully translated: English, 繁體中文, 한국어, 日本語
- **Light / Dark mode**

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 18 |
| Build Tool | Vite 6 |
| Styling | Tailwind CSS 3 |
| Icons | Lucide React |
| Charts | Hand-coded inline SVG (zero charting dependencies) |
| Deploy | GitHub Pages via `gh-pages` or GitHub Actions |

## Getting Started

Requires **Node.js 18+**.

```bash
# Clone
git clone https://github.com/your-username/taiwan-demographics.git
cd taiwan-demographics

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
https://<your-username>.github.io/taiwan-demographics/
```

### Option B — GitHub Actions (automatic on push)

A workflow is included at `.github/workflows/deploy.yml`. Once you push to `main`, it builds and deploys automatically. Enable GitHub Pages in your repo settings:

> **Settings → Pages → Source: GitHub Actions**

## Data Sources & Methodology

- **Base Data (Taiwan 2025):** Approximated from public demographic data. Total population ~23.3M, TFR ~0.86, default net migration ~20,000/year. Age buckets: Youth (0–14) 2.68M, Working (15–64) 15.95M, Elderly (65+) 4.67M.
- **Mortality Rates:** Approximated for modern life expectancy (~81 years).
- **Births:** Calculated from women aged 15–49 (≈50% of that cohort) and annual TFR divided across 35 reproductive years.
- **Migration:** Distributed across working-age cohorts (20–34).
- **Conceptual Framework:** Dependency ratio thresholds based on concepts from Max Fisher's video essay *[How China blew up its own future](https://www.youtube.com/watch?v=AultJcNb90c)*.

## Contributing

Contributions, issues, and feature requests are welcome. If you are a demographer or data scientist and want to contribute more accurate Age-Specific Fertility Rates (ASFR) or dynamic mortality curves, please open a Pull Request.

## License

MIT
