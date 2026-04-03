import { useState, useEffect, useCallback, useRef, useMemo } from "react";

// ============================================================
// CONSTANTS & HELPERS
// ============================================================
const ANTHROPIC_MODEL = "claude-sonnet-4-20250514";

const TABS = [
  { id: "overview", label: "Overview", icon: "📖" },
  { id: "chapters", label: "Chapters", icon: "📑" },
  { id: "characters", label: "Characters", icon: "👤" },
  { id: "arcs", label: "Plot Arcs", icon: "📈" },
  { id: "themes", label: "Themes", icon: "💡" },
  { id: "timeline", label: "Timeline", icon: "⏳" },
  { id: "relationships", label: "Relationships", icon: "🕸️" },
  { id: "quotes", label: "Quotes", icon: "✍️" },
  { id: "search", label: "Search", icon: "🔍" },
  { id: "pov", label: "POV Mode", icon: "👁️" },
];

const GENRES = ["Fiction", "Non-Fiction", "Sci-Fi", "Fantasy", "Mystery", "Romance", "Thriller", "Historical", "Philosophy", "Biography", "Horror", "Literary"];

async function callClaude(prompt, systemPrompt = "") {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 4000,
        system: systemPrompt || "You are a literary analysis AI. Always respond with valid JSON only. No markdown, no backticks, no preamble.",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await res.json();
    const text = data.content?.map(c => c.text || "").join("") || "";
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch (e) {
    console.error("Claude API error:", e);
    return null;
  }
}

function truncateText(text, maxLen = 12000) {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + "\n...[truncated for analysis]...";
}

// ============================================================
// STYLES
// ============================================================
const css = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600&family=Crimson+Pro:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap');

:root {
  --bg-darkest: #1a1410;
  --bg-dark: #2a2118;
  --bg-medium: #3d3229;
  --bg-warm: #4a3c30;
  --bg-shelf: #5c4a3a;
  --bg-light: #6b5744;
  --bg-parchment: #f4e8d1;
  --bg-parchment-dark: #e8d5b5;
  --text-light: #f0e6d6;
  --text-muted: #b8a48e;
  --text-warm: #d4c4a8;
  --text-dark: #2a2118;
  --accent-gold: #c9a84c;
  --accent-gold-light: #e0c878;
  --accent-copper: #b87333;
  --accent-burgundy: #8b2252;
  --accent-forest: #2d5a27;
  --accent-navy: #1e3a5f;
  --shadow-deep: rgba(0,0,0,0.5);
  --shadow-warm: rgba(201,168,76,0.15);
  --grain: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body, #root {
  background: var(--bg-darkest);
  color: var(--text-light);
  font-family: 'Crimson Pro', Georgia, serif;
  min-height: 100vh;
  overflow-x: hidden;
}

.app-container {
  min-height: 100vh;
  background: 
    var(--grain),
    radial-gradient(ellipse at 30% 20%, rgba(201,168,76,0.06) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 80%, rgba(184,115,51,0.04) 0%, transparent 50%),
    linear-gradient(180deg, var(--bg-darkest) 0%, #1f1a14 50%, var(--bg-darkest) 100%);
}

/* HEADER */
.lib-header {
  padding: 2rem 3rem 1.5rem;
  border-bottom: 1px solid rgba(201,168,76,0.15);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(180deg, rgba(42,33,24,0.8) 0%, transparent 100%);
}

.lib-logo {
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
}

.lib-logo-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--accent-gold), var(--accent-copper));
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  box-shadow: 0 4px 12px rgba(201,168,76,0.3);
}

.lib-title {
  font-family: 'Playfair Display', serif;
  font-size: 1.8rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--accent-gold-light), var(--accent-gold), var(--accent-copper));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 0.02em;
}

.lib-subtitle {
  font-size: 0.85rem;
  color: var(--text-muted);
  font-style: italic;
  letter-spacing: 0.05em;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

/* BUTTONS */
.btn {
  font-family: 'Crimson Pro', serif;
  font-size: 0.95rem;
  padding: 0.6rem 1.4rem;
  border: 1px solid rgba(201,168,76,0.3);
  background: rgba(201,168,76,0.08);
  color: var(--accent-gold-light);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  letter-spacing: 0.03em;
}
.btn:hover {
  background: rgba(201,168,76,0.18);
  border-color: var(--accent-gold);
  box-shadow: 0 0 20px rgba(201,168,76,0.15);
}
.btn-primary {
  background: linear-gradient(135deg, var(--accent-gold), var(--accent-copper));
  color: var(--bg-darkest);
  border: none;
  font-weight: 600;
}
.btn-primary:hover {
  box-shadow: 0 4px 24px rgba(201,168,76,0.4);
  transform: translateY(-1px);
}
.btn-small {
  padding: 0.35rem 0.9rem;
  font-size: 0.85rem;
}

/* LIBRARY VIEW */
.library-view {
  padding: 2rem 3rem;
}

.section-title {
  font-family: 'Playfair Display', serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--accent-gold-light);
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.section-title::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, rgba(201,168,76,0.3), transparent);
}

/* BOOKSHELVES */
.bookshelf {
  margin-bottom: 3rem;
  position: relative;
}

.shelf-row {
  display: flex;
  gap: 0;
  padding: 1.5rem 1.5rem 0;
  min-height: 200px;
  align-items: flex-end;
  position: relative;
  z-index: 1;
  flex-wrap: wrap;
}

.shelf-plank {
  width: 100%;
  height: 22px;
  background: linear-gradient(180deg, #7a6350 0%, #5c4a3a 40%, #4a3c30 100%);
  border-radius: 0 0 3px 3px;
  box-shadow: 
    0 6px 20px rgba(0,0,0,0.5),
    inset 0 2px 0 rgba(255,255,255,0.05),
    0 2px 4px rgba(0,0,0,0.3);
  position: relative;
}
.shelf-plank::before {
  content: '';
  position: absolute;
  top: -3px;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(180deg, rgba(0,0,0,0.3), transparent);
}

/* BOOK SPINES */
.book-spine {
  width: 46px;
  min-height: 160px;
  border-radius: 3px 5px 5px 3px;
  cursor: pointer;
  position: relative;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-origin: bottom center;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 
    2px 0 4px rgba(0,0,0,0.3),
    inset -2px 0 4px rgba(0,0,0,0.2),
    inset 2px 0 4px rgba(255,255,255,0.05);
  margin: 0 2px;
}

.book-spine:hover {
  transform: translateY(-16px) scale(1.02);
  box-shadow: 
    2px 8px 20px rgba(0,0,0,0.4),
    inset -2px 0 4px rgba(0,0,0,0.2),
    inset 2px 0 4px rgba(255,255,255,0.1),
    0 0 30px rgba(201,168,76,0.15);
  z-index: 10;
}

.spine-title {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  font-family: 'EB Garamond', serif;
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  color: rgba(255,255,255,0.85);
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  padding: 0.5rem 0;
  max-height: 140px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.add-book-spine {
  width: 46px;
  min-height: 160px;
  border: 2px dashed rgba(201,168,76,0.3);
  border-radius: 3px 5px 5px 3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  margin: 0 2px;
  background: rgba(201,168,76,0.03);
}
.add-book-spine:hover {
  border-color: var(--accent-gold);
  background: rgba(201,168,76,0.08);
  transform: translateY(-8px);
}
.add-book-plus {
  font-size: 1.5rem;
  color: var(--accent-gold);
  writing-mode: vertical-rl;
}

/* UPLOAD MODAL */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }

.modal {
  background: linear-gradient(135deg, var(--bg-dark), var(--bg-medium));
  border: 1px solid rgba(201,168,76,0.2);
  border-radius: 16px;
  padding: 2.5rem;
  width: 90%;
  max-width: 560px;
  box-shadow: 0 24px 80px rgba(0,0,0,0.6);
  animation: slideUp 0.4s ease;
}

.modal h2 {
  font-family: 'Playfair Display', serif;
  font-size: 1.6rem;
  color: var(--accent-gold-light);
  margin-bottom: 1.5rem;
}

.upload-zone {
  border: 2px dashed rgba(201,168,76,0.3);
  border-radius: 12px;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(201,168,76,0.03);
  margin-bottom: 1.5rem;
}
.upload-zone:hover, .upload-zone.dragover {
  border-color: var(--accent-gold);
  background: rgba(201,168,76,0.08);
}
.upload-zone-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}
.upload-zone p {
  color: var(--text-muted);
  font-size: 1rem;
}
.upload-zone .formats {
  font-size: 0.8rem;
  color: var(--text-muted);
  opacity: 0.7;
  margin-top: 0.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}
.form-group label {
  display: block;
  font-size: 0.9rem;
  color: var(--text-warm);
  margin-bottom: 0.4rem;
  font-weight: 500;
}
.form-input {
  width: 100%;
  padding: 0.65rem 1rem;
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(201,168,76,0.2);
  border-radius: 8px;
  color: var(--text-light);
  font-family: 'Crimson Pro', serif;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.3s;
}
.form-input:focus {
  border-color: var(--accent-gold);
}
.form-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23c9a84c' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  padding-right: 2.5rem;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

/* BOOK DASHBOARD */
.dashboard {
  display: flex;
  min-height: calc(100vh - 80px);
}

.dash-sidebar {
  width: 240px;
  min-width: 240px;
  background: linear-gradient(180deg, var(--bg-dark) 0%, rgba(42,33,24,0.95) 100%);
  border-right: 1px solid rgba(201,168,76,0.1);
  padding: 1.5rem 0;
  overflow-y: auto;
}

.dash-book-info {
  padding: 0 1.25rem 1.25rem;
  border-bottom: 1px solid rgba(201,168,76,0.1);
  margin-bottom: 0.75rem;
}

.dash-book-title {
  font-family: 'Playfair Display', serif;
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--accent-gold-light);
  line-height: 1.4;
}

.dash-book-author {
  font-size: 0.85rem;
  color: var(--text-muted);
  font-style: italic;
  margin-top: 0.2rem;
}

.dash-nav-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.6rem 1.25rem;
  cursor: pointer;
  font-size: 0.92rem;
  color: var(--text-muted);
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
}
.dash-nav-item:hover {
  color: var(--text-light);
  background: rgba(201,168,76,0.05);
}
.dash-nav-item.active {
  color: var(--accent-gold-light);
  background: rgba(201,168,76,0.08);
  border-left-color: var(--accent-gold);
}

/* SPOILER TOGGLE */
.spoiler-control {
  padding: 1rem 1.25rem;
  border-top: 1px solid rgba(201,168,76,0.1);
  margin-top: auto;
}
.spoiler-label {
  font-size: 0.82rem;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
}
.spoiler-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}
.toggle-track {
  width: 36px;
  height: 20px;
  border-radius: 10px;
  background: rgba(255,255,255,0.15);
  position: relative;
  transition: background 0.3s;
}
.toggle-track.on {
  background: var(--accent-gold);
}
.toggle-knob {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform 0.3s;
}
.toggle-track.on .toggle-knob {
  transform: translateX(16px);
}
.chapter-select {
  margin-top: 0.5rem;
  width: 100%;
  padding: 0.4rem 0.6rem;
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(201,168,76,0.2);
  border-radius: 6px;
  color: var(--text-light);
  font-family: 'Crimson Pro', serif;
  font-size: 0.85rem;
}

/* MAIN CONTENT */
.dash-main {
  flex: 1;
  padding: 2rem 2.5rem;
  overflow-y: auto;
  max-height: calc(100vh - 80px);
}

/* CARDS */
.card {
  background: linear-gradient(135deg, rgba(61,50,41,0.6), rgba(42,33,24,0.8));
  border: 1px solid rgba(201,168,76,0.12);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.25rem;
  transition: border-color 0.3s;
}
.card:hover {
  border-color: rgba(201,168,76,0.25);
}
.card-title {
  font-family: 'Playfair Display', serif;
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--accent-gold-light);
  margin-bottom: 0.75rem;
}
.card-text {
  font-size: 1rem;
  line-height: 1.75;
  color: var(--text-warm);
}

/* TAGS */
.tag {
  display: inline-block;
  padding: 0.25rem 0.7rem;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 500;
  margin: 0.2rem;
}
.tag-gold { background: rgba(201,168,76,0.15); color: var(--accent-gold-light); border: 1px solid rgba(201,168,76,0.25); }
.tag-copper { background: rgba(184,115,51,0.15); color: #e0a060; border: 1px solid rgba(184,115,51,0.25); }
.tag-burgundy { background: rgba(139,34,82,0.15); color: #d06090; border: 1px solid rgba(139,34,82,0.25); }
.tag-forest { background: rgba(45,90,39,0.15); color: #70b868; border: 1px solid rgba(45,90,39,0.25); }
.tag-navy { background: rgba(30,58,95,0.15); color: #6090c0; border: 1px solid rgba(30,58,95,0.25); }

/* GRID */
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
.grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.25rem; }

/* CHARACTER CARD */
.char-card {
  cursor: pointer;
}
.char-card:hover {
  border-color: var(--accent-gold);
  box-shadow: 0 4px 24px rgba(201,168,76,0.12);
}
.char-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  font-family: 'Playfair Display', serif;
  font-weight: 700;
  color: white;
  margin-bottom: 0.75rem;
}
.char-name {
  font-family: 'Playfair Display', serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-light);
}
.char-role {
  font-size: 0.85rem;
  color: var(--text-muted);
  font-style: italic;
  margin-top: 0.15rem;
}
.char-traits {
  margin-top: 0.6rem;
}

/* TIMELINE */
.timeline {
  position: relative;
  padding-left: 2rem;
}
.timeline::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(180deg, var(--accent-gold), var(--accent-copper), transparent);
}
.timeline-item {
  position: relative;
  margin-bottom: 1.5rem;
  padding-left: 1rem;
}
.timeline-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--accent-gold);
  position: absolute;
  left: -1.65rem;
  top: 0.35rem;
  box-shadow: 0 0 10px rgba(201,168,76,0.4);
}
.timeline-chapter {
  font-size: 0.78rem;
  color: var(--accent-gold);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.timeline-event {
  font-size: 0.95rem;
  color: var(--text-warm);
  margin-top: 0.25rem;
  line-height: 1.6;
}

/* RELATIONSHIP GRAPH */
.rel-graph-container {
  background: rgba(0,0,0,0.2);
  border-radius: 12px;
  padding: 1rem;
  min-height: 400px;
  position: relative;
  overflow: hidden;
}
.rel-node {
  position: absolute;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, var(--bg-warm), var(--bg-medium));
  border: 1px solid rgba(201,168,76,0.3);
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--accent-gold-light);
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 2;
  white-space: nowrap;
}
.rel-node:hover {
  border-color: var(--accent-gold);
  box-shadow: 0 0 20px rgba(201,168,76,0.3);
  transform: scale(1.05);
}

/* QUOTE CARD */
.quote-card {
  border-left: 3px solid var(--accent-gold);
  padding-left: 1.25rem;
}
.quote-text {
  font-family: 'EB Garamond', serif;
  font-size: 1.1rem;
  font-style: italic;
  color: var(--text-light);
  line-height: 1.7;
}
.quote-meta {
  font-size: 0.82rem;
  color: var(--text-muted);
  margin-top: 0.5rem;
}

/* SEARCH */
.search-bar {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}
.search-input {
  flex: 1;
  padding: 0.75rem 1.25rem;
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(201,168,76,0.2);
  border-radius: 8px;
  color: var(--text-light);
  font-family: 'Crimson Pro', serif;
  font-size: 1rem;
  outline: none;
}
.search-input:focus {
  border-color: var(--accent-gold);
}
.search-input::placeholder {
  color: var(--text-muted);
  opacity: 0.6;
}

/* PROCESSING */
.processing-overlay {
  text-align: center;
  padding: 4rem 2rem;
}
.processing-spinner {
  width: 60px;
  height: 60px;
  border: 3px solid rgba(201,168,76,0.2);
  border-top-color: var(--accent-gold);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1.5rem;
}
@keyframes spin { to { transform: rotate(360deg); } }
.processing-text {
  font-family: 'Playfair Display', serif;
  font-size: 1.2rem;
  color: var(--accent-gold-light);
}
.processing-sub {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-top: 0.5rem;
}

/* PROGRESS BAR */
.progress-bar {
  width: 300px;
  height: 6px;
  background: rgba(201,168,76,0.15);
  border-radius: 3px;
  margin: 1.5rem auto 0;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-gold), var(--accent-copper));
  border-radius: 3px;
  transition: width 0.5s ease;
}

/* EMPTY STATE */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}
.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}
.empty-text {
  font-family: 'Playfair Display', serif;
  font-size: 1.3rem;
  color: var(--text-muted);
}
.empty-sub {
  font-size: 0.95rem;
  color: var(--text-muted);
  opacity: 0.7;
  margin-top: 0.5rem;
}

/* POV NARRATIVE */
.pov-narrative {
  font-family: 'EB Garamond', serif;
  font-size: 1.1rem;
  line-height: 1.85;
  color: var(--text-warm);
  max-width: 700px;
}
.pov-narrative p {
  margin-bottom: 1rem;
  text-indent: 1.5em;
}

/* ARC VISUAL */
.arc-bar {
  height: 8px;
  border-radius: 4px;
  margin: 0.5rem 0;
  position: relative;
  overflow: hidden;
}
.arc-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.8s ease;
}
.arc-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 0.2rem;
}

/* SCROLLBAR */
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: var(--bg-darkest); }
::-webkit-scrollbar-thumb {
  background: var(--bg-warm);
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover { background: var(--bg-light); }

/* RESPONSIVE */
@media (max-width: 900px) {
  .grid-2, .grid-3 { grid-template-columns: 1fr; }
  .dashboard { flex-direction: column; }
  .dash-sidebar { width: 100%; min-width: unset; flex-direction: row; overflow-x: auto; }
  .dash-main { max-height: unset; }
  .lib-header { padding: 1rem 1.5rem; }
  .library-view { padding: 1.5rem; }
}

/* Locked/spoiler content */
.spoiler-locked {
  position: relative;
  filter: blur(6px);
  user-select: none;
  pointer-events: none;
}
.spoiler-badge {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0,0,0,0.8);
  color: var(--accent-gold);
  padding: 0.5rem 1.5rem;
  border-radius: 8px;
  font-family: 'Playfair Display', serif;
  z-index: 5;
  filter: none;
  pointer-events: auto;
}

.fade-in {
  animation: fadeIn 0.5s ease;
}
`;

// ============================================================
// BOOK COLORS for spines
// ============================================================
const BOOK_COLORS = [
  "linear-gradient(180deg, #8b2252, #6b1a42)",
  "linear-gradient(180deg, #1e3a5f, #152d4a)",
  "linear-gradient(180deg, #2d5a27, #1f4020)",
  "linear-gradient(180deg, #8b6914, #6b5010)",
  "linear-gradient(180deg, #5a2d6b, #421f50)",
  "linear-gradient(180deg, #6b3a2a, #502818)",
  "linear-gradient(180deg, #1a5a5a, #104040)",
  "linear-gradient(180deg, #4a4a6b, #333350)",
  "linear-gradient(180deg, #8b4513, #6b3410)",
  "linear-gradient(180deg, #2f4f4f, #1a3535)",
];

const CHAR_COLORS = ["#8b2252", "#1e3a5f", "#2d5a27", "#8b6914", "#5a2d6b", "#6b3a2a", "#1a5a5a", "#b87333"];

function getBookColor(index) {
  return BOOK_COLORS[index % BOOK_COLORS.length];
}

function getCharColor(index) {
  return CHAR_COLORS[index % CHAR_COLORS.length];
}

function getBookHeight(title) {
  const base = 150;
  const extra = (title?.length || 5) % 5;
  return base + extra * 12;
}

// ============================================================
// MAIN APP COMPONENT
// ============================================================
export default function BookIntelligencePlatform() {
  const [view, setView] = useState("library"); // library | dashboard
  const [books, setBooks] = useState([]);
  const [activeBook, setActiveBook] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showUpload, setShowUpload] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processStep, setProcessStep] = useState("");
  const [processProgress, setProcessProgress] = useState(0);
  const [spoilerMode, setSpoilerMode] = useState(false);
  const [spoilerChapter, setSpoilerChapter] = useState(999);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [selectedChar, setSelectedChar] = useState(null);
  const [povChar, setPovChar] = useState(null);
  const [povNarrative, setPovNarrative] = useState(null);
  const [povLoading, setPovLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Upload form state
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadAuthor, setUploadAuthor] = useState("");
  const [uploadGenre, setUploadGenre] = useState("Fiction");
  const fileInputRef = useRef(null);

  // ── File reading ──
  const readFileAsText = useCallback((file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => resolve("");
      reader.readAsText(file);
    });
  }, []);

  const handleFileSelect = useCallback((file) => {
    if (!file) return;
    setUploadFile(file);
    const name = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
    if (!uploadTitle) setUploadTitle(name);
  }, [uploadTitle]);

  // ── AI Analysis Pipeline ──
  const analyzeBook = useCallback(async (bookText, title, author) => {
    const excerpt = truncateText(bookText, 10000);
    setProcessing(true);

    // Step 1: Extract structure
    setProcessStep("Detecting chapters and structure...");
    setProcessProgress(10);
    const structure = await callClaude(
      `Analyze this book excerpt and identify chapters. Return JSON: {"chapters": [{"number": 1, "title": "Chapter Title", "summary": "2-3 sentence overview"}], "totalChapters": number}\n\nBook: "${title}" by ${author}\n\n${excerpt}`,
    );

    // Step 2: Deep chapter summaries
    setProcessStep("Generating detailed chapter summaries...");
    setProcessProgress(25);
    const summaries = await callClaude(
      `For the book "${title}" by ${author}, write detailed narrative summaries for each chapter. Cover major events, character decisions, emotional developments, new information revealed, key dialogue implications, and conflict progression. The writing should be smooth, engaging, and narratively structured — like a clear retelling.\n\nReturn JSON: {"chapters": [{"number": 1, "title": "string", "summary": "detailed 200+ word narrative summary", "keyEvents": ["event1"], "emotionalTone": "string"}]}\n\nExcerpt:\n${excerpt}`,
    );

    // Step 3: Characters
    setProcessStep("Analyzing characters...");
    setProcessProgress(40);
    const characters = await callClaude(
      `Analyze all characters in "${title}" by ${author}. Return JSON: {"characters": [{"name": "string", "role": "protagonist/antagonist/supporting/minor", "description": "physical description", "personality": ["trait1"], "motivations": "string", "fears": "string", "goals": "string", "firstAppearance": 1, "majorChapters": [1,2,3], "developmentArc": "string"}]}\n\nExcerpt:\n${excerpt}`,
    );

    // Step 4: Relationships
    setProcessStep("Mapping character relationships...");
    setProcessProgress(55);
    const relationships = await callClaude(
      `Map all character relationships in "${title}" by ${author}. Return JSON: {"relationships": [{"character1": "name", "character2": "name", "type": "friendship/rivalry/family/romance/alliance/mentor", "description": "brief description of their dynamic", "evolution": "how it changes"}]}\n\nExcerpt:\n${excerpt}`,
    );

    // Step 5: Plot arcs
    setProcessStep("Detecting plot arcs and story structure...");
    setProcessProgress(65);
    const arcs = await callClaude(
      `Identify plot arcs in "${title}" by ${author}. Return JSON: {"mainArc": {"title": "string", "setup": "string", "risingAction": "string", "climax": "string", "resolution": "string", "chapters": [1,2,3]}, "subplots": [{"title": "string", "description": "string", "chapters": [1,2], "resolution": "string"}], "turningPoints": [{"chapter": 1, "event": "string", "significance": "string"}]}\n\nExcerpt:\n${excerpt}`,
    );

    // Step 6: Themes
    setProcessStep("Extracting themes and symbolism...");
    setProcessProgress(78);
    const themes = await callClaude(
      `Identify all themes in "${title}" by ${author}. Return JSON: {"themes": [{"name": "string", "description": "detailed explanation", "chapters": [1,2], "significance": "string"}], "motifs": [{"name": "string", "description": "string", "occurrences": ["string"]}], "symbolism": [{"symbol": "string", "meaning": "string", "appearances": ["string"]}]}\n\nExcerpt:\n${excerpt}`,
    );

    // Step 7: Timeline
    setProcessStep("Building narrative timeline...");
    setProcessProgress(88);
    const timeline = await callClaude(
      `Create a chronological timeline of events for "${title}" by ${author}. Return JSON: {"events": [{"chapter": 1, "event": "string", "significance": "major/moderate/minor", "characters": ["name"], "consequence": "string"}]}\n\nExcerpt:\n${excerpt}`,
    );

    // Step 8: Quotes
    setProcessStep("Extracting memorable quotes...");
    setProcessProgress(95);
    const quotes = await callClaude(
      `Extract meaningful quotes from "${title}" by ${author}. Return JSON: {"quotes": [{"text": "the quote", "speaker": "character name or narrator", "chapter": 1, "category": "philosophical/emotional/character-defining/plot-revealing", "context": "brief context"}]}\n\nExcerpt:\n${excerpt}`,
    );

    setProcessProgress(100);
    setProcessStep("Analysis complete!");

    return {
      structure: structure || { chapters: [], totalChapters: 0 },
      summaries: summaries || { chapters: [] },
      characters: characters || { characters: [] },
      relationships: relationships || { relationships: [] },
      arcs: arcs || { mainArc: {}, subplots: [], turningPoints: [] },
      themes: themes || { themes: [], motifs: [], symbolism: [] },
      timeline: timeline || { events: [] },
      quotes: quotes || { quotes: [] },
    };
  }, []);

  // ── Upload handler ──
  const handleUpload = useCallback(async () => {
    if (!uploadFile) return;
    const text = await readFileAsText(uploadFile);
    if (!text.trim()) {
      alert("Could not extract text from file. Please try a .txt file.");
      return;
    }

    setShowUpload(false);
    const analysis = await analyzeBook(text, uploadTitle || "Unknown", uploadAuthor || "Unknown");

    const newBook = {
      id: Date.now(),
      title: uploadTitle || "Untitled",
      author: uploadAuthor || "Unknown Author",
      genre: uploadGenre,
      text: text,
      analysis,
      addedAt: new Date().toISOString(),
    };

    setBooks((prev) => [...prev, newBook]);
    setProcessing(false);
    setUploadFile(null);
    setUploadTitle("");
    setUploadAuthor("");

    // Auto-open
    setActiveBook(newBook);
    setActiveTab("overview");
    setView("dashboard");
  }, [uploadFile, uploadTitle, uploadAuthor, uploadGenre, readFileAsText, analyzeBook]);

  const openBook = useCallback((book) => {
    setActiveBook(book);
    setActiveTab("overview");
    setView("dashboard");
    setSpoilerChapter(999);
    setSelectedChar(null);
    setPovChar(null);
    setPovNarrative(null);
  }, []);

  const goHome = useCallback(() => {
    setView("library");
    setActiveBook(null);
    setSelectedChar(null);
    setPovChar(null);
    setPovNarrative(null);
  }, []);

  // ── Spoiler filter ──
  const filterBySpoiler = useCallback((items, chapterKey = "chapter") => {
    if (!spoilerMode) return items;
    return (items || []).filter((item) => {
      const ch = item[chapterKey] || item.number || 0;
      return ch <= spoilerChapter;
    });
  }, [spoilerMode, spoilerChapter]);

  // ── Semantic search ──
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || !activeBook) return;
    setSearchResults({ loading: true });
    const excerpt = truncateText(activeBook.text, 8000);
    const result = await callClaude(
      `Search the book "${activeBook.title}" for: "${searchQuery}"\n\nReturn JSON: {"results": [{"type": "scene/quote/character/theme", "chapter": 1, "content": "description of the match", "relevance": "high/medium"}]}\n\nExcerpt:\n${excerpt}`,
    );
    setSearchResults(result || { results: [] });
  }, [searchQuery, activeBook]);

  // ── POV reconstruction ──
  const generatePOV = useCallback(async (charName) => {
    if (!activeBook) return;
    setPovChar(charName);
    setPovLoading(true);
    setPovNarrative(null);
    const excerpt = truncateText(activeBook.text, 8000);
    const result = await callClaude(
      `Reconstruct the story of "${activeBook.title}" from the perspective of ${charName}. Include only scenes they experience, their decisions, emotional progression, and knowledge at each point. Write it as a narrative — engaging, personal, first-person style.\n\nReturn JSON: {"narrative": "the full POV retelling as multiple paragraphs", "scenes": [{"chapter": 1, "description": "what they experience"}]}${spoilerMode ? `\n\nIMPORTANT: Only include events up to chapter ${spoilerChapter}.` : ""}\n\nExcerpt:\n${excerpt}`,
    );
    setPovNarrative(result);
    setPovLoading(false);
  }, [activeBook, spoilerMode, spoilerChapter]);

  // ── Computed data ──
  const analysis = activeBook?.analysis;
  const chapters = analysis?.summaries?.chapters || analysis?.structure?.chapters || [];
  const chars = analysis?.characters?.characters || [];
  const rels = analysis?.relationships?.relationships || [];
  const allThemes = analysis?.themes?.themes || [];
  const motifs = analysis?.themes?.motifs || [];
  const symbols = analysis?.themes?.symbolism || [];
  const mainArc = analysis?.arcs?.mainArc || {};
  const subplots = analysis?.arcs?.subplots || [];
  const turningPoints = analysis?.arcs?.turningPoints || [];
  const events = analysis?.timeline?.events || [];
  const quotes = analysis?.quotes?.quotes || [];

  // ============================================================
  // RENDER: Processing overlay
  // ============================================================
  if (processing) {
    return (
      <div className="app-container">
        <style>{css}</style>
        <div className="processing-overlay" style={{ paddingTop: "20vh" }}>
          <div className="processing-spinner" />
          <div className="processing-text">Analyzing Your Book</div>
          <div className="processing-sub">{processStep}</div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${processProgress}%` }} />
          </div>
          <div style={{ marginTop: "1rem", fontSize: "0.82rem", color: "var(--text-muted)" }}>
            {processProgress}% complete
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER: Library View
  // ============================================================
  if (view === "library") {
    return (
      <div className="app-container">
        <style>{css}</style>

        {/* Header */}
        <header className="lib-header">
          <div className="lib-logo">
            <div className="lib-logo-icon">📚</div>
            <div>
              <div className="lib-title">Bookbriefs</div>
              <div className="lib-subtitle">AI-Powered Book Intelligence</div>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
              + Add Book
            </button>
          </div>
        </header>

        {/* Library */}
        <div className="library-view">
          {books.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📖</div>
              <div className="empty-text">Your library awaits</div>
              <div className="empty-sub">
                Upload a book to begin your journey of deep literary exploration
              </div>
              <button
                className="btn btn-primary"
                style={{ marginTop: "1.5rem" }}
                onClick={() => setShowUpload(true)}
              >
                Upload Your First Book
              </button>
            </div>
          ) : (
            <div className="bookshelf">
              <h2 className="section-title">Your Collection</h2>
              <div className="shelf-row">
                {books.map((book, i) => (
                  <div
                    key={book.id}
                    className="book-spine"
                    style={{
                      background: getBookColor(i),
                      minHeight: getBookHeight(book.title),
                    }}
                    onClick={() => openBook(book)}
                    title={`${book.title} — ${book.author}`}
                  >
                    <span className="spine-title">{book.title}</span>
                  </div>
                ))}
                <div className="add-book-spine" onClick={() => setShowUpload(true)}>
                  <span className="add-book-plus">+</span>
                </div>
              </div>
              <div className="shelf-plank" />
            </div>
          )}
        </div>

        {/* Upload Modal */}
        {showUpload && (
          <div className="modal-overlay" onClick={() => setShowUpload(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>Add a Book</h2>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.pdf,.epub,.mobi,.docx"
                style={{ display: "none" }}
                onChange={(e) => handleFileSelect(e.target.files[0])}
              />
              <div
                className={`upload-zone ${dragOver ? "dragover" : ""}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFileSelect(e.dataTransfer.files[0]);
                }}
              >
                <div className="upload-zone-icon">📄</div>
                {uploadFile ? (
                  <p style={{ color: "var(--accent-gold-light)" }}>{uploadFile.name}</p>
                ) : (
                  <p>
                    Drop a book file here or click to browse
                  </p>
                )}
                <div className="formats">TXT, PDF, EPUB, MOBI, DOCX</div>
              </div>

              <div className="form-group">
                <label>Title</label>
                <input
                  className="form-input"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Book title"
                />
              </div>
              <div className="form-group">
                <label>Author</label>
                <input
                  className="form-input"
                  value={uploadAuthor}
                  onChange={(e) => setUploadAuthor(e.target.value)}
                  placeholder="Author name"
                />
              </div>
              <div className="form-group">
                <label>Genre</label>
                <select
                  className="form-input form-select"
                  value={uploadGenre}
                  onChange={(e) => setUploadGenre(e.target.value)}
                >
                  {GENRES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button className="btn" onClick={() => setShowUpload(false)}>Cancel</button>
                <button
                  className="btn btn-primary"
                  disabled={!uploadFile}
                  onClick={handleUpload}
                >
                  Analyze Book
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // RENDER: Book Dashboard
  // ============================================================
  const filteredChapters = spoilerMode
    ? chapters.filter((c) => (c.number || 0) <= spoilerChapter)
    : chapters;
  const filteredEvents = filterBySpoiler(events);
  const filteredQuotes = filterBySpoiler(quotes);
  const filteredTurningPoints = filterBySpoiler(turningPoints);

  return (
    <div className="app-container">
      <style>{css}</style>

      {/* Header */}
      <header className="lib-header">
        <div className="lib-logo" onClick={goHome}>
          <div className="lib-logo-icon">📚</div>
          <div>
            <div className="lib-title">Bookbriefs</div>
            <div className="lib-subtitle">AI-Powered Book Intelligence</div>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn" onClick={goHome}>← Library</button>
        </div>
      </header>

      <div className="dashboard">
        {/* Sidebar */}
        <aside className="dash-sidebar">
          <div className="dash-book-info">
            <div className="dash-book-title">{activeBook?.title}</div>
            <div className="dash-book-author">{activeBook?.author}</div>
            <span className="tag tag-gold" style={{ marginTop: "0.5rem" }}>{activeBook?.genre}</span>
          </div>

          {TABS.map((tab) => (
            <div
              key={tab.id}
              className={`dash-nav-item ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedChar(null);
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </div>
          ))}

          {/* Spoiler Control */}
          <div className="spoiler-control">
            <div className="spoiler-label">Spoiler Protection</div>
            <div
              className="spoiler-toggle"
              onClick={() => setSpoilerMode(!spoilerMode)}
            >
              <div className={`toggle-track ${spoilerMode ? "on" : ""}`}>
                <div className="toggle-knob" />
              </div>
              <span style={{ fontSize: "0.85rem", color: spoilerMode ? "var(--accent-gold-light)" : "var(--text-muted)" }}>
                {spoilerMode ? "On" : "Off"}
              </span>
            </div>
            {spoilerMode && (
              <select
                className="chapter-select"
                value={spoilerChapter}
                onChange={(e) => setSpoilerChapter(Number(e.target.value))}
              >
                {chapters.map((c) => (
                  <option key={c.number} value={c.number}>
                    Up to Ch. {c.number}{c.title ? `: ${c.title}` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="dash-main">
          {/* ── OVERVIEW ── */}
          {activeTab === "overview" && (
            <div className="fade-in">
              <h2 className="section-title">Book Overview</h2>

              <div className="grid-2">
                <div className="card">
                  <div className="card-title">📊 At a Glance</div>
                  <div className="card-text">
                    <div style={{ marginBottom: "0.5rem" }}>
                      <strong>Chapters:</strong> {chapters.length}
                    </div>
                    <div style={{ marginBottom: "0.5rem" }}>
                      <strong>Characters:</strong> {chars.length}
                    </div>
                    <div style={{ marginBottom: "0.5rem" }}>
                      <strong>Themes:</strong> {allThemes.length}
                    </div>
                    <div>
                      <strong>Genre:</strong> {activeBook?.genre}
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-title">🎭 Main Arc</div>
                  <div className="card-text">
                    {mainArc.title && <div style={{ marginBottom: "0.5rem" }}><strong>{mainArc.title}</strong></div>}
                    {mainArc.setup && <div style={{ marginBottom: "0.3rem" }}><em>Setup:</em> {mainArc.setup}</div>}
                    {mainArc.climax && <div><em>Climax:</em> {mainArc.climax}</div>}
                  </div>
                </div>
              </div>

              {/* Key characters preview */}
              <div className="card">
                <div className="card-title">👤 Key Characters</div>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                  {chars.slice(0, 6).map((c, i) => (
                    <div
                      key={i}
                      style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}
                      onClick={() => { setActiveTab("characters"); setSelectedChar(c); }}
                    >
                      <div
                        className="char-avatar"
                        style={{
                          background: getCharColor(i),
                          width: 32,
                          height: 32,
                          fontSize: "0.85rem",
                        }}
                      >
                        {c.name?.[0]}
                      </div>
                      <div>
                        <div style={{ fontSize: "0.9rem", fontWeight: 500 }}>{c.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}>{c.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Themes preview */}
              <div className="card">
                <div className="card-title">💡 Themes</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.5rem" }}>
                  {allThemes.map((t, i) => (
                    <span key={i} className={`tag ${["tag-gold", "tag-copper", "tag-burgundy", "tag-forest", "tag-navy"][i % 5]}`}>
                      {t.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── CHAPTERS ── */}
          {activeTab === "chapters" && (
            <div className="fade-in">
              <h2 className="section-title">Chapter Summaries</h2>
              {filteredChapters.map((ch, i) => (
                <div key={i} className="card">
                  <div className="card-title">
                    Chapter {ch.number || i + 1}{ch.title ? `: ${ch.title}` : ""}
                  </div>
                  {ch.emotionalTone && (
                    <span className="tag tag-copper" style={{ marginBottom: "0.5rem", display: "inline-block" }}>
                      {ch.emotionalTone}
                    </span>
                  )}
                  <div className="card-text" style={{ whiteSpace: "pre-wrap" }}>
                    {ch.summary}
                  </div>
                  {ch.keyEvents?.length > 0 && (
                    <div style={{ marginTop: "0.75rem" }}>
                      <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--accent-gold)", marginBottom: "0.3rem" }}>
                        Key Events
                      </div>
                      {ch.keyEvents.map((ev, j) => (
                        <div key={j} style={{ fontSize: "0.9rem", color: "var(--text-muted)", paddingLeft: "0.75rem", borderLeft: "2px solid rgba(201,168,76,0.2)", marginBottom: "0.3rem" }}>
                          {ev}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {spoilerMode && chapters.length > filteredChapters.length && (
                <div className="card" style={{ textAlign: "center", opacity: 0.6 }}>
                  <div style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>🔒</div>
                  <div style={{ fontStyle: "italic", color: "var(--text-muted)" }}>
                    {chapters.length - filteredChapters.length} chapter(s) hidden — spoiler protection active
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── CHARACTERS ── */}
          {activeTab === "characters" && !selectedChar && (
            <div className="fade-in">
              <h2 className="section-title">Characters</h2>
              <div className="grid-2">
                {chars.map((c, i) => (
                  <div key={i} className="card char-card" onClick={() => setSelectedChar(c)}>
                    <div className="char-avatar" style={{ background: getCharColor(i) }}>
                      {c.name?.[0]}
                    </div>
                    <div className="char-name">{c.name}</div>
                    <div className="char-role">{c.role}</div>
                    {c.personality?.length > 0 && (
                      <div className="char-traits">
                        {c.personality.slice(0, 3).map((t, j) => (
                          <span key={j} className="tag tag-gold">{t}</span>
                        ))}
                      </div>
                    )}
                    <div className="card-text" style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
                      {c.description?.slice(0, 120)}{c.description?.length > 120 ? "..." : ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── CHARACTER DETAIL / JOURNEY ── */}
          {activeTab === "characters" && selectedChar && (
            <div className="fade-in">
              <button className="btn btn-small" onClick={() => setSelectedChar(null)} style={{ marginBottom: "1rem" }}>
                ← All Characters
              </button>
              <h2 className="section-title">{selectedChar.name}'s Journey</h2>

              <div className="grid-2">
                <div className="card">
                  <div className="card-title">Profile</div>
                  <div className="card-text">
                    {selectedChar.description && <div style={{ marginBottom: "0.5rem" }}><strong>Description:</strong> {selectedChar.description}</div>}
                    {selectedChar.motivations && <div style={{ marginBottom: "0.3rem" }}><strong>Motivations:</strong> {selectedChar.motivations}</div>}
                    {selectedChar.fears && <div style={{ marginBottom: "0.3rem" }}><strong>Fears:</strong> {selectedChar.fears}</div>}
                    {selectedChar.goals && <div><strong>Goals:</strong> {selectedChar.goals}</div>}
                  </div>
                </div>
                <div className="card">
                  <div className="card-title">Personality</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                    {(selectedChar.personality || []).map((t, i) => (
                      <span key={i} className="tag tag-gold">{t}</span>
                    ))}
                  </div>
                  {selectedChar.developmentArc && (
                    <div className="card-text" style={{ marginTop: "0.75rem" }}>
                      <strong>Character Arc:</strong> {selectedChar.developmentArc}
                    </div>
                  )}
                </div>
              </div>

              {/* Appearance timeline */}
              <div className="card">
                <div className="card-title">Narrative Appearances</div>
                <div className="timeline" style={{ marginTop: "0.75rem" }}>
                  {(selectedChar.majorChapters || [])
                    .filter((ch) => !spoilerMode || ch <= spoilerChapter)
                    .map((ch, i) => {
                      const chData = chapters.find((c) => c.number === ch);
                      return (
                        <div key={i} className="timeline-item">
                          <div className="timeline-dot" />
                          <div className="timeline-chapter">Chapter {ch}</div>
                          <div className="timeline-event">
                            {chData?.title || chData?.summary?.slice(0, 100) || "Appears in this chapter"}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Relationships */}
              <div className="card">
                <div className="card-title">Relationships</div>
                {rels
                  .filter((r) => r.character1 === selectedChar.name || r.character2 === selectedChar.name)
                  .map((r, i) => (
                    <div key={i} style={{ marginBottom: "0.75rem", paddingBottom: "0.75rem", borderBottom: "1px solid rgba(201,168,76,0.1)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span className={`tag ${r.type === "rivalry" ? "tag-burgundy" : r.type === "romance" ? "tag-copper" : r.type === "family" ? "tag-forest" : "tag-gold"}`}>
                          {r.type}
                        </span>
                        <strong style={{ color: "var(--text-light)" }}>
                          {r.character1 === selectedChar.name ? r.character2 : r.character1}
                        </strong>
                      </div>
                      <div className="card-text" style={{ marginTop: "0.25rem", fontSize: "0.9rem" }}>
                        {r.description}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ── PLOT ARCS ── */}
          {activeTab === "arcs" && (
            <div className="fade-in">
              <h2 className="section-title">Plot Arcs</h2>

              <div className="card">
                <div className="card-title">Main Story Arc</div>
                {mainArc.title && <div style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--text-light)", marginBottom: "0.75rem" }}>{mainArc.title}</div>}

                {["setup", "risingAction", "climax", "resolution"].map((phase) => (
                  mainArc[phase] && (
                    <div key={phase} style={{ marginBottom: "0.75rem" }}>
                      <span className="tag tag-gold" style={{ textTransform: "capitalize" }}>
                        {phase === "risingAction" ? "Rising Action" : phase}
                      </span>
                      <div className="card-text" style={{ marginTop: "0.25rem" }}>{mainArc[phase]}</div>
                    </div>
                  )
                ))}

                <div className="arc-bar" style={{ background: "rgba(201,168,76,0.1)", marginTop: "1rem" }}>
                  <div className="arc-fill" style={{ width: "100%", background: "linear-gradient(90deg, var(--accent-forest), var(--accent-gold), var(--accent-burgundy), var(--accent-navy))" }} />
                </div>
                <div className="arc-labels">
                  <span>Setup</span>
                  <span>Rising Action</span>
                  <span>Climax</span>
                  <span>Resolution</span>
                </div>
              </div>

              {subplots.length > 0 && (
                <>
                  <h3 className="section-title" style={{ fontSize: "1.2rem", marginTop: "1.5rem" }}>Subplots</h3>
                  {subplots.map((sp, i) => (
                    <div key={i} className="card">
                      <div className="card-title">{sp.title}</div>
                      <div className="card-text">{sp.description}</div>
                      {sp.resolution && (
                        <div className="card-text" style={{ marginTop: "0.5rem" }}>
                          <em>Resolution:</em> {sp.resolution}
                        </div>
                      )}
                      {sp.chapters?.length > 0 && (
                        <div style={{ marginTop: "0.5rem" }}>
                          {sp.chapters.map((ch) => (
                            <span key={ch} className="tag tag-navy">Ch. {ch}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}

              {filteredTurningPoints.length > 0 && (
                <>
                  <h3 className="section-title" style={{ fontSize: "1.2rem", marginTop: "1.5rem" }}>Turning Points</h3>
                  <div className="timeline">
                    {filteredTurningPoints.map((tp, i) => (
                      <div key={i} className="timeline-item">
                        <div className="timeline-dot" style={{ background: "var(--accent-burgundy)" }} />
                        <div className="timeline-chapter">Chapter {tp.chapter}</div>
                        <div className="timeline-event">{tp.event}</div>
                        {tp.significance && (
                          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic", marginTop: "0.2rem" }}>
                            {tp.significance}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── THEMES ── */}
          {activeTab === "themes" && (
            <div className="fade-in">
              <h2 className="section-title">Themes & Symbolism</h2>

              {allThemes.map((t, i) => (
                <div key={i} className="card">
                  <div className="card-title">{t.name}</div>
                  <div className="card-text">{t.description}</div>
                  {t.significance && (
                    <div className="card-text" style={{ marginTop: "0.5rem", fontStyle: "italic" }}>{t.significance}</div>
                  )}
                  {t.chapters?.length > 0 && (
                    <div style={{ marginTop: "0.5rem" }}>
                      {t.chapters.filter((ch) => !spoilerMode || ch <= spoilerChapter).map((ch) => (
                        <span key={ch} className="tag tag-gold">Ch. {ch}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {motifs.length > 0 && (
                <>
                  <h3 className="section-title" style={{ fontSize: "1.2rem", marginTop: "1.5rem" }}>Recurring Motifs</h3>
                  <div className="grid-2">
                    {motifs.map((m, i) => (
                      <div key={i} className="card">
                        <div className="card-title">{m.name}</div>
                        <div className="card-text">{m.description}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {symbols.length > 0 && (
                <>
                  <h3 className="section-title" style={{ fontSize: "1.2rem", marginTop: "1.5rem" }}>Symbolism</h3>
                  <div className="grid-2">
                    {symbols.map((s, i) => (
                      <div key={i} className="card">
                        <div className="card-title">{s.symbol}</div>
                        <div className="card-text">{s.meaning}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── TIMELINE ── */}
          {activeTab === "timeline" && (
            <div className="fade-in">
              <h2 className="section-title">Story Timeline</h2>
              <div className="timeline">
                {filteredEvents.map((ev, i) => (
                  <div key={i} className="timeline-item">
                    <div
                      className="timeline-dot"
                      style={{
                        background: ev.significance === "major" ? "var(--accent-burgundy)" : ev.significance === "moderate" ? "var(--accent-gold)" : "var(--bg-light)",
                        width: ev.significance === "major" ? 16 : 12,
                        height: ev.significance === "major" ? 16 : 12,
                      }}
                    />
                    <div className="timeline-chapter">
                      Chapter {ev.chapter}
                      {ev.significance && <span className={`tag ${ev.significance === "major" ? "tag-burgundy" : "tag-gold"}`} style={{ marginLeft: "0.5rem" }}>{ev.significance}</span>}
                    </div>
                    <div className="timeline-event">{ev.event}</div>
                    {ev.consequence && (
                      <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic", marginTop: "0.15rem" }}>
                        → {ev.consequence}
                      </div>
                    )}
                    {ev.characters?.length > 0 && (
                      <div style={{ marginTop: "0.3rem" }}>
                        {ev.characters.map((c, j) => (
                          <span key={j} className="tag tag-navy">{c}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── RELATIONSHIPS ── */}
          {activeTab === "relationships" && (
            <div className="fade-in">
              <h2 className="section-title">Character Relationships</h2>

              {/* Force-directed-ish layout */}
              <div className="rel-graph-container" style={{ minHeight: Math.max(400, chars.length * 60) }}>
                <svg
                  width="100%"
                  height="100%"
                  style={{ position: "absolute", top: 0, left: 0 }}
                  viewBox={`0 0 700 ${Math.max(400, chars.length * 60)}`}
                >
                  {rels.map((r, i) => {
                    const c1Idx = chars.findIndex((c) => c.name === r.character1);
                    const c2Idx = chars.findIndex((c) => c.name === r.character2);
                    if (c1Idx < 0 || c2Idx < 0) return null;
                    const angle1 = (c1Idx / chars.length) * Math.PI * 2;
                    const angle2 = (c2Idx / chars.length) * Math.PI * 2;
                    const cx = 350, cy = Math.max(200, chars.length * 30);
                    const rx = 250, ry = Math.max(150, chars.length * 20);
                    const x1 = cx + rx * Math.cos(angle1);
                    const y1 = cy + ry * Math.sin(angle1);
                    const x2 = cx + rx * Math.cos(angle2);
                    const y2 = cy + ry * Math.sin(angle2);
                    const colors = {
                      rivalry: "#8b2252",
                      romance: "#b87333",
                      family: "#2d5a27",
                      friendship: "#c9a84c",
                      alliance: "#1e3a5f",
                      mentor: "#5a2d6b",
                    };
                    return (
                      <g key={i}>
                        <line
                          x1={x1} y1={y1} x2={x2} y2={y2}
                          stroke={colors[r.type] || "#c9a84c"}
                          strokeWidth="1.5"
                          strokeOpacity="0.5"
                        />
                        <text
                          x={(x1 + x2) / 2}
                          y={(y1 + y2) / 2 - 6}
                          textAnchor="middle"
                          fill={colors[r.type] || "#c9a84c"}
                          fontSize="10"
                          fontFamily="Crimson Pro"
                          opacity="0.7"
                        >
                          {r.type}
                        </text>
                      </g>
                    );
                  })}
                </svg>
                {chars.map((c, i) => {
                  const angle = (i / chars.length) * Math.PI * 2;
                  const cx = 350, cy = Math.max(200, chars.length * 30);
                  const rx = 250, ry = Math.max(150, chars.length * 20);
                  const x = cx + rx * Math.cos(angle);
                  const y = cy + ry * Math.sin(angle);
                  return (
                    <div
                      key={i}
                      className="rel-node"
                      style={{ left: x - 40, top: y - 14 }}
                      onClick={() => { setActiveTab("characters"); setSelectedChar(c); }}
                    >
                      {c.name}
                    </div>
                  );
                })}
              </div>

              {/* Relationship list */}
              <div style={{ marginTop: "1.5rem" }}>
                {rels.map((r, i) => (
                  <div key={i} className="card" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <span className={`tag ${r.type === "rivalry" ? "tag-burgundy" : r.type === "romance" ? "tag-copper" : r.type === "family" ? "tag-forest" : "tag-gold"}`}>
                      {r.type}
                    </span>
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--text-light)" }}>
                        {r.character1} ↔ {r.character2}
                      </div>
                      <div className="card-text" style={{ fontSize: "0.9rem" }}>{r.description}</div>
                      {r.evolution && (
                        <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                          Evolution: {r.evolution}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── QUOTES ── */}
          {activeTab === "quotes" && (
            <div className="fade-in">
              <h2 className="section-title">Notable Quotes</h2>
              {filteredQuotes.map((q, i) => (
                <div key={i} className="card quote-card">
                  <div className="quote-text">"{q.text}"</div>
                  <div className="quote-meta">
                    <span className={`tag ${q.category === "philosophical" ? "tag-gold" : q.category === "emotional" ? "tag-copper" : q.category === "character-defining" ? "tag-forest" : "tag-burgundy"}`}>
                      {q.category}
                    </span>
                    {q.speaker && <span style={{ marginLeft: "0.5rem" }}>— {q.speaker}</span>}
                    {q.chapter && <span style={{ marginLeft: "0.5rem" }}>• Chapter {q.chapter}</span>}
                  </div>
                  {q.context && (
                    <div style={{ marginTop: "0.4rem", fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                      {q.context}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── SEARCH ── */}
          {activeTab === "search" && (
            <div className="fade-in">
              <h2 className="section-title">Semantic Search</h2>
              <div className="search-bar">
                <input
                  className="search-input"
                  placeholder="Search for scenes, characters, themes, quotes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <button className="btn btn-primary" onClick={handleSearch}>Search</button>
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                Try: "scenes about betrayal", "moments of doubt", "dialogue between rivals"
              </div>

              {searchResults?.loading && (
                <div style={{ textAlign: "center", padding: "2rem" }}>
                  <div className="processing-spinner" />
                  <div style={{ color: "var(--text-muted)" }}>Searching...</div>
                </div>
              )}

              {searchResults?.results && (
                <div>
                  {searchResults.results.map((r, i) => (
                    <div key={i} className="card">
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
                        <span className={`tag ${r.type === "scene" ? "tag-gold" : r.type === "quote" ? "tag-copper" : r.type === "character" ? "tag-forest" : "tag-navy"}`}>
                          {r.type}
                        </span>
                        {r.chapter && <span className="tag tag-gold">Ch. {r.chapter}</span>}
                        {r.relevance && <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>• {r.relevance} relevance</span>}
                      </div>
                      <div className="card-text">{r.content}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── POV MODE ── */}
          {activeTab === "pov" && (
            <div className="fade-in">
              <h2 className="section-title">Character POV Reconstruction</h2>
              <div className="card-text" style={{ marginBottom: "1.5rem" }}>
                Experience the story from a single character's perspective. Select a character to see the narrative reconstructed through their eyes.
              </div>

              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "2rem" }}>
                {chars.map((c, i) => (
                  <button
                    key={i}
                    className={`btn ${povChar === c.name ? "btn-primary" : ""}`}
                    onClick={() => generatePOV(c.name)}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {povLoading && (
                <div style={{ textAlign: "center", padding: "2rem" }}>
                  <div className="processing-spinner" />
                  <div style={{ color: "var(--text-muted)" }}>
                    Reconstructing the story from {povChar}'s perspective...
                  </div>
                </div>
              )}

              {povNarrative && !povLoading && (
                <div className="card">
                  <div className="card-title">The Story Through {povChar}'s Eyes</div>
                  <div className="pov-narrative">
                    {(povNarrative.narrative || "")
                      .split("\n")
                      .filter(Boolean)
                      .map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                  </div>

                  {povNarrative.scenes?.length > 0 && (
                    <div style={{ marginTop: "1.5rem" }}>
                      <div className="card-title" style={{ fontSize: "1rem" }}>Scene Breakdown</div>
                      <div className="timeline">
                        {povNarrative.scenes
                          .filter((s) => !spoilerMode || s.chapter <= spoilerChapter)
                          .map((s, i) => (
                            <div key={i} className="timeline-item">
                              <div className="timeline-dot" />
                              <div className="timeline-chapter">Chapter {s.chapter}</div>
                              <div className="timeline-event">{s.description}</div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
