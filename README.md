# 📚 Bookbriefs — AI-Powered Book Intelligence Platform

Bookbriefs transforms books into structured, interactive knowledge systems. Upload any book and get detailed chapter summaries, character tracking, plot arc breakdowns, theme extraction, relationship graphs, and more — all powered by Claude AI.

---

## ✨ Features

### Library & Interface
- **Vintage Library UI** — warm wooden bookshelves, parchment tones, serif typography, and book spines you click to open
- **Personal Digital Library** — books appear as physical spines on a shelf, categorized by genre
- **Drag-and-Drop Upload** — supports `.txt`, `.pdf`, `.epub`, `.mobi`, `.docx` file selection (text extraction works with `.txt`)

### AI Analysis Pipeline
Every uploaded book runs through an **8-step Claude-powered analysis pipeline**:

| Step | What It Does |
|------|-------------|
| 1. Structure Detection | Identifies chapters, headings, and sections |
| 2. Chapter Summaries | Detailed narrative retellings with emotional tone and key events |
| 3. Character Extraction | Profiles with traits, motivations, fears, goals, and development arcs |
| 4. Relationship Mapping | Friendships, rivalries, alliances, family connections, and how they evolve |
| 5. Plot Arc Detection | Main arc (setup → climax → resolution), subplots, and turning points |
| 6. Theme Extraction | Major themes, recurring motifs, and symbolism with chapter references |
| 7. Timeline Construction | Chronological events with significance ratings and consequences |
| 8. Quote Extraction | Categorized quotes (philosophical, emotional, character-defining, plot-revealing) |

### Dashboard Tabs

- **Overview** — at-a-glance statistics, key characters, and theme tags
- **Chapter Summaries** — smooth, engaging narrative retellings of each chapter's events, decisions, and emotional beats
- **Characters** — structured profiles; click any character for their full journey, timeline of appearances, and relationship details
- **Plot Arcs** — visual arc breakdown with gradient bar, subplots, and turning points on a timeline
- **Themes & Symbolism** — major themes with chapter links, recurring motifs, and symbolic elements
- **Timeline** — chronological event stream with significance indicators (major/moderate/minor) and consequence chains
- **Relationships** — interactive network graph with color-coded relationship types + detailed cards
- **Quotes** — categorized quote cards with speaker, chapter, and context
- **Semantic Search** — natural language queries like *"scenes about betrayal"* or *"moments of doubt"*
- **POV Mode** — reconstructs the entire story from any character's first-person perspective

### Spoiler Protection
Toggle **Avoid Spoilers** and select your current chapter. All content beyond that chapter is dynamically filtered across every tab — summaries, characters, timeline, quotes, and even POV mode.

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (single-file JSX artifact) |
| AI Engine | Anthropic Claude API (Sonnet) |
| Styling | Custom CSS with CSS variables, Google Fonts (Playfair Display, Crimson Pro, EB Garamond) |
| State | React hooks (`useState`, `useCallback`, `useRef`, `useMemo`) |

---

## 🚀 Getting Started

### Prerequisites
- A modern web browser
- Access to [claude.ai](https://claude.ai) (the app runs as a React artifact)

### Running the App
1. Open the `.jsx` artifact file in Claude's artifact viewer
2. The vintage library homepage will load
3. Click **"+ Add Book"** or **"Upload Your First Book"**
4. Select a `.txt` file of your book
5. Fill in the title, author, and genre
6. Click **"Analyze Book"** and watch the 8-step pipeline run
7. The book appears on your shelf — click its spine to explore the dashboard

### Supported File Formats
| Format | Status |
|--------|--------|
| `.txt` | ✅ Full text extraction in-browser |
| `.pdf` | 📎 File accepted (text extraction requires server-side processing) |
| `.epub` | 📎 File accepted (text extraction requires server-side processing) |
| `.mobi` | 📎 File accepted (text extraction requires server-side processing) |
| `.docx` | 📎 File accepted (text extraction requires server-side processing) |

> **Note:** For best results, use `.txt` files. The in-browser `FileReader` API reads plain text directly. Binary formats (PDF, EPUB, etc.) would require a backend parser for full extraction.

---

## 📖 Usage Guide

### Uploading a Book
1. Click **"+ Add Book"** in the header or shelf
2. Drag and drop a file onto the upload zone, or click to browse
3. The title auto-fills from the filename — edit as needed
4. Select the genre from the dropdown
5. Click **"Analyze Book"**

### Navigating the Dashboard
- Use the **left sidebar** to switch between tabs
- Click any **character name** to view their full journey
- Click **relationship graph nodes** to jump to character profiles
- Use the **spoiler toggle** at the bottom of the sidebar to protect against spoilers

### Semantic Search
Navigate to the **Search** tab and type natural language queries:
- *"scenes where the hero doubts themselves"*
- *"dialogue between two rivals"*
- *"moments of sacrifice"*
- *"chapters involving [character name]"*

### POV Reconstruction
Navigate to the **POV Mode** tab, select a character, and Claude will generate a first-person narrative retelling of the story from that character's perspective — including only scenes they experience, their emotional progression, and their knowledge at each point.

---

## 🎨 Design Philosophy

Bookbriefs's interface is designed around a **cozy vintage library** aesthetic:

- **Color palette** — deep mahogany, warm amber, antique gold, and parchment tones
- **Typography** — Playfair Display for headings, Crimson Pro for body text, EB Garamond for literary content
- **Book spines** — each book renders as a colored spine on a wooden shelf with realistic shadows and hover animations
- **Texture** — SVG noise grain overlay, radial gradient ambient lighting, and warm shadow depth
- **Interaction** — smooth transitions, fade-in animations, and hover effects throughout

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│                 React Frontend               │
│  ┌─────────┐  ┌──────────┐  ┌────────────┐ │
│  │ Library  │  │Dashboard │  │  Upload     │ │
│  │  View    │  │  View    │  │  Modal      │ │
│  └─────────┘  └──────────┘  └────────────┘ │
│         │            │              │        │
│         └────────────┼──────────────┘        │
│                      │                       │
│              ┌───────▼────────┐              │
│              │  State Manager │              │
│              │  (React Hooks) │              │
│              └───────┬────────┘              │
│                      │                       │
│         ┌────────────▼────────────┐          │
│         │   Claude API Client     │          │
│         │  (8-step pipeline)      │          │
│         └────────────┬────────────┘          │
└──────────────────────┼───────────────────────┘
                       │
               ┌───────▼────────┐
               │  Anthropic API  │
               │  (Claude Sonnet)│
               └────────────────┘
```

### Analysis Pipeline Flow
```
Upload → Text Extraction → Structure Detection → Chapter Summaries
  → Character Extraction → Relationship Mapping → Plot Arc Detection
  → Theme Extraction → Timeline Construction → Quote Extraction
  → Dashboard Render
```

---

## 🔮 Future Extensibility

The architecture supports adding:

- **Audiobook narration** via TTS APIs
- **Cross-book character comparisons** across multiple uploads
- **Reading recommendations** based on theme similarity
- **Multi-book theme analysis** for comparative literary study
- **Backend server** (FastAPI + PostgreSQL) for persistent storage and binary file parsing
- **Graph database** (Neo4j) for richer narrative knowledge graphs
- **Incremental processing** and result caching for large books

---

## 📝 License

This project is provided as-is for personal and educational use.

---

