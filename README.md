<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# GradeCurve Pro

**Transform raw exam scores into compliant grade distributions using advanced mathematical optimization.**

A client-side web application designed for legal academia to convert raw scores into discrete letter grades that simultaneously satisfy:
- 📊 Mean GPA constraints (e.g., 3.28-3.32)
- 📈 Distribution tier percentages (e.g., 11-13% for A+/A)
- ⬆️ Strict monotonicity (higher scores → higher grades)

## 🚀 Live Demo

**Production:** [https://gradecurve.vercel.app](https://gradecurve.vercel.app) *(replace with your actual URL)*
**GitHub Pages:** [https://yourusername.github.io/GradeCurve](https://yourusername.github.io/GradeCurve)

## ✨ Features

- 🎯 **Top-N Dynamic Programming Algorithm** - Finds mathematically optimal grade distributions
- 📁 **Flexible Import** - Upload CSV, Excel, or paste raw scores
- ⚙️ **Fully Configurable** - JSON-based grading scales and constraints
- 🤖 **AI Pedagogical Analysis** - Optional Gemini-powered fairness audits
- 📤 **Multiple Export Formats** - CSV, Excel, and PDF reports
- 🔒 **Privacy First** - All processing happens client-side (no server uploads)

## 🏃 Run Locally

**Prerequisites:** Node.js 18+

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/GradeCurve.git
   cd GradeCurve
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **(Optional) Set up Gemini API for AI reports:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local and add your API key from https://aistudio.google.com/app/apikey
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

5. **Build for production:**
   ```bash
   npm run build
   npm run preview  # Test production build locally
   ```

## 🌐 Deployment

### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/GradeCurve)

**Or manually:**

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. **(Optional) Add environment variable for AI features:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add `GEMINI_API_KEY` with your API key

### Deploy to GitHub Pages

GitHub Actions workflow is already configured. Just push to `master` branch:

```bash
git push origin master
```

The app will be available at `https://yourusername.github.io/GradeCurve`

## ⚙️ Configuration

Edit grading constraints via the Settings Panel in-app, or upload a custom JSON configuration:

```json
{
  "grades": [
    { "label": "A+", "value": 4.333 },
    { "label": "A", "value": 4.000 }
  ],
  "aggregate": {
    "mean": { "min": 3.28, "max": 3.32 }
  },
  "distribution": [
    {
      "labels": ["A+", "A"],
      "percentRange": { "min": 11, "max": 13 }
    }
  ],
  "targetResultCount": 3
}
```

Default configuration is based on Emory Law School grading policies.

## 🧮 How It Works

The application implements a **Top-N Dynamic Programming Algorithm** that:

1. **Pre-processes** scores into unique blocks (reduces state space)
2. **Explores** grade assignments using dynamic programming
3. **Prunes** suboptimal paths (keeps top 60 candidates per state)
4. **Penalizes** constraint violations and grade gaps
5. **Returns** the top 3-5 most compliant scenarios

**Time Complexity:** O(K² × G × N) where K = unique scores, G = grade levels, N = buffer size
**Performance:** Handles 100+ students in <100ms client-side

## 📚 Tech Stack

- **Frontend:** React 19 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Export:** xlsx, papaparse, jspdf
- **AI:** Google Gemini API (optional)

## 🤝 Contributing

Contributions are welcome! This tool is designed to help educators nationwide.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - Feel free to use this for any educational institution.

## 🙏 Acknowledgments

Algorithm design based on research by Seth J. Chandler (2025).
Built with ❤️ for educators dealing with mandatory grade curves.

---

**Questions?** Open an issue or contact [your-email@example.com]
