# 台灣人口統計模擬引擎

**語言：** [English](README.md) | 繁體中文

一個互動式 React 單頁應用程式，模擬台灣從 **2025 年至 2100 年**的人口變遷軌跡。調整總和生育率（TFR）與淨移民人數，探索不同政策選擇如何影響一個國家的撫養比與經濟未來。

> **AI 協作說明：** 本專案由 Gemini（Google）與 [Claude](https://claude.ai)（Anthropic）共同協作完成。

---

## 關於本專案

台灣目前擁有全球最低的總和生育率之一（2025 年約為 0.86），正快速步入「超高齡」社會。本模擬工具採用標準的**世代組成人口模型（Cohort-Component Method）**，預測不同政策槓桿對台灣未來人口的影響。

核心指標為**撫養比**——每 100 名勞動年齡成人所對應的受撫養人口數（兒童加上老年人）——並對應從「健康人口紅利」到「系統崩潰」的各個閾值區間。

## 功能特色

- **即時世代模擬** — 逐年迭代 101 個年齡組，套用死亡率、生育率與移民率
- **固定 vs. 動態生育率情境** — 測試固定生育率，或透過線性插值設定「最終目標生育率」，模擬文化或政策的漸進轉變
- **互動式儀表板：**
  - 含彩色閾值區間的撫養比軌跡折線圖
  - 即時人口金字塔（觀看它如何倒置）
  - 各人口組成（青年／勞動／老年／總計）隨時間的絕對數量變化圖
- **多語系（i18n）** — 完整翻譯：English、繁體中文、한국어、日本語
- **淺色 / 深色主題** 切換

## 技術堆疊

| 層次 | 選用技術 |
|---|---|
| 框架 | React 18 |
| 建置工具 | Vite 6 |
| 樣式 | Tailwind CSS 3 |
| 圖示 | Lucide React |
| 圖表 | 手刻 SVG（零外部圖表套件依賴） |
| 部署 | GitHub Pages（`gh-pages` 套件或 GitHub Actions） |

## 快速開始

需要 **Node.js 18+**。

```bash
# 複製專案
git clone https://github.com/your-username/taiwan-demographics.git
cd taiwan-demographics

# 安裝套件
npm install

# 啟動開發伺服器
npm run dev
```

在瀏覽器開啟 `http://localhost:5173`。

## 部署

### 方法 A — 手動（一行指令）

```bash
npm run deploy
```

此指令會執行 `vite build`，並將 `dist/` 資料夾推送至 `gh-pages` 分支。完成後，應用程式將發佈於：

```
https://<your-username>.github.io/taiwan-demographics/
```

### 方法 B — GitHub Actions（推送後自動部署）

`.github/workflows/deploy.yml` 工作流程已包含在專案中。推送至 `main` 分支後即自動建置並部署。請在倉庫設定中啟用 GitHub Pages：

> **Settings → Pages → Source: GitHub Actions**

## 資料來源與方法論

- **台灣 2025 基礎數據：** 依公開人口統計資料近似建模。總人口約 23.3M，TFR 約 0.86，預設淨移民約 20,000 人/年。年齡分組：青年（0–14 歲）268 萬、勞動（15–64 歲）1,595 萬、老年（65 歲以上）467 萬。
- **死亡率：** 依現代平均壽命（約 81 歲）近似建模。
- **出生數：** 由 15–49 歲女性（約占該年齡層人口 50%）與年化 TFR（除以 35 個生育年）計算得出。
- **移民分配：** 分散至 20–34 歲的勞動年齡組。
- **概念框架：** 撫養比閾值參考自 Max Fisher 的影片評論：*[How China blew up its own future](https://www.youtube.com/watch?v=AultJcNb90c)*。

## 貢獻

歡迎提交 Issues 與 Pull Requests。若您是人口學家或資料科學家，歡迎貢獻更精確的年齡別生育率或動態死亡率曲線。

## 授權

MIT
