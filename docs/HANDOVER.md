# GradeCurve Pro: Technical Specification & Handover Document

## 1. Project Overview
GradeCurve Pro is a client-side web application designed for legal academia to convert raw exam scores into discrete grade distributions that comply with complex institutional constraints (e.g., Law School "mandatory curves").

**Core Value Proposition:** Unlike simple proportional curving, this app uses a mathematical optimization algorithm to find valid, monotonic distributions that satisfy mean GPA, median, and tier-based percentage ranges simultaneously.

## 2. Technical Stack
- **Framework:** React 18 (TypeScript)
- **Build Tool:** Vite
- **Styling:** Tailwind CSS (with Typography plugin for AI reports)
- **Deployment:** GitHub Pages (via GitHub Actions)
- **Key Libraries:**
  - `xlsx`, `papaparse`: Data ingestion and Excel/CSV export.
  - `html2canvas`, `jspdf`: Premium PDF generation from rendered Markdown.
  - `react-markdown`, `remark-gfm`: AI report rendering.
  - `@google/generative-ai`: Gemini 3 Flash Preview integration.

## 3. Data Flow & User Interface
### Step 0: Data Ingestion
- **Inputs:** File upload (CSV, XLSX, TXT) or raw text paste.
- **Parsing:** Automatic extraction of headers and rows.

### Step 1: Configuration & Mapping
- **Column Mapping:** User designates which column contains the numeric "Score". Other columns (Name, ID) can be "preserved" for the final export.
- **Constraints Editor (SettingsPanel.tsx):** 
  - **Grade Scale:** Definitions of labels (A, A-, etc.) and their quality points (GPA values).
  - **Distribution Tiers:** Groups of grades (e.g., "A+/A/A-") with mandatory min/max percentage ranges.
  - **Aggregate Constraints:** Mandatory Mean GPA range for the entire class.
  - **JSON Storage:** Capability to upload/download these configuration sets.

### Step 2: Algorithmic Generation
- **Process:** The app runs up to 5,000+ path evaluations locally to find the "Top N" (currently 3-5) most compliant scenarios.
- **Visualization:** Comparative bar charts showing the distribution of each scenario against the mandatory "Constraints" (ghost bars).

### Step 3: AI Pedagogical Audit
- **Gemini Integration:** Sends a summary of the math (cutoffs, mean, compliance) to `gemini-3-flash-preview`.
- **Prompt Logic:** Instructs the AI to provide a qualitative "Pedagogical Audit," highlighting fairness, morale impact, and distribution clusters.

## 4. The Algorithm (gradeEngine.ts)
The application implements a **Top-N Dynamic Programming Algorithm** based on a framework by Seth J. Chandler (2025).

### Key Components:
1. **Pre-Processing:** Aggregates scores into unique "blocks" to reduce the search state space.
2. **DP Trellis:** A state-space explorer where each state represents `(consumed_students, current_grade_level)`. 
3. **Leaderboard Pruning:** At each grade level, the algorithm keeps only the top `BUFFER_N` (set to 60) most promising paths to avoid combinatorial explosion.
4. **Soft Constraint Penalties:**
   - **Compliance Penalty:** Heavily penalizes any scenario that steps outside mandatory percentage ranges.
   - **Gap Penalty:** Fixed penalty (50) for "skipping" a grade category (assigning 0 students to a grade between two grades that have students), which prevents unnatural-looking curves.
   - **Mean Penalty:** Distance-based penalty to pull the curve toward the center of the mandatory mean.
5. **Monotonicity:** Strictly enforced—a higher raw score *cannot* receive a lower grade than a lower raw score.

## 5. Export Architecture
- **Excel:** Generates a multi-sheet workbook (Sheet 1: Student Roster with Grades; Sheet 2: Compliance Stats).
- **PDF:** Captures the Markdown-rendered AI report using a scaled `html2canvas` snapshot.
- **Save System:** Uses the **File System Access API** (`showSaveFilePicker`) to provide a standard "Save As" experience, falling back to an anchor-link injection for maximum compatibility.

---

# Incident Report: Deployment & Export Failures

## 1. Summary of Failures
During the final deployment phase, the application experienced a cascading series of UX and functional failures that prevented the user from reliably downloading correctly-named reports.

## 2. Root Cause Analysis
### A. GitHub Pages Base Path Misconfiguration
- **Issue:** Vite defaults to the root `/`. GitHub Pages projects are usually hosted at `/<repo-name>/`.
- **Failure:** Initially, all assets (JS/CSS) 404'd. Fixing this required updating `vite.config.ts` with `base: '/GradeCurve/'`.

### B. Browser "Stealth" Downloads (The UUID Issue)
- **Issue:** Modern browsers (specifically Chrome/Firefox) generate generic UUID filenames (e.g., `2cfc35fe-...`) for programmatic downloads if the `download` attribute is triggered on an anchor element not currently mounted in the DOM.
- **Failure:** My initial fixes failed to mount the links correctly or lacked the `requestAnimationFrame` delay required for the browser to associate the `download` name with the generated `Blob`.

### C. PDF Bloat (18MB Files)
- **Issue:** `html2canvas` captures at a default scale of 2x. Exporting these as raw `image/png` into a PDF resulted in massive file sizes for simple text reports.
- **Failure:** I failed to implement JPEG compression and scaled-down capture (1.5x) in the first iteration.

### D. Deployment & Caching Lag
- **Issue:** GitHub Actions takes ~60-90 seconds to deploy. Browsers heavily cache `.js` bundles from GitHub.
- **Failure:** The user was testing older versions of the code while I was pushing new fixes. The lack of a "Build Timestamp" or versioning in the UI made this invisible, leading to extreme frustration and the impression that no changes were occurring.

## 3. Current Resolution Status
- **Export Control:** Logic now utilizes `showSaveFilePicker` for explicit "Save As" control.
- **Filename Logic:** Filenames are sanitized and forced via DOM injection.
- **PDF Optimization:** Switched to JPEG 85% quality with 1.5x scale (size reduced 18x).
- **Build Transparency:** Added a timestamp in the footer to verify the active deployment version.
