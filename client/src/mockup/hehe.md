# Media Review Platform: Design Specification (Updated Colors)

This document provides a comprehensive design framework for the "Media Review" web application, updated with the new light-toned professional palette.

## 1. Design Philosophy
**"Light, Professional & Precise"**
A clean workspace using a professional purple-toned palette. The goal is clarity, readability, and a sophisticated feel for creative professionals.

---

## 2. Visual Style & Theming
Based on the new requested palette.

### Color Palette (The "Lumina Pro" Theme)
- **Background:** `#F3F2F7` (Light lavender-gray) for the main application canvas.
- **Card/Surface:** `#FFFFFF` (Pure White) for sidebar panels, project cards, and comment boxes.
- **Primary Text:** `#2A2F6F` (Deep Navy-Purple) for high contrast and readability.
- **Accent & Interaction:** `#535297` (Primary Purple) for CTAs, active states, and buttons.
- **Highlight:** `#A6A0ED` (Soft Purple) for badges, markers, and secondary highlights.
- **Muted Surfaces:** `#D2CAFF` (Soft Lavender) for backgrounds of less critical UI sections.
- **Borders/Dividers:** `#C5C0E6` (Light Lavender border).

### Typography
- **Typeface:** Inter (Sans-serif)
- **Scale:**
    - **H1 (Header/Screen Title):** 28px, Bold, Tracking -0.02em.
    - **H2 (Section Header):** 20px, Semi-bold.
    - **Body (Standard):** 14px, Regular.
    - **Small (Metadata/Timestamps):** 12px, Medium.

### Iconography
- **Set:** Material Design Icons or Feather Icons.
- **Style:** Outlined for inactive states, Filled with `#535297` for active states.

---

## 3. Key Layout Components
*(Layout structures remain unchanged from initial version, only colors updated)*

### A. Dashboard / Project Library
- **Background:** #F3F2F7.
- **Cards:** #FFFFFF with soft shadows and #C5C0E6 borders.

### B. Video & Image Player
- **Canvas Zone:** Still uses a dark neutral `#2A2F6F` background to ensure media (videos/images) colors remain accurate and prominent.
- **Panels:** #FFFFFF for feedback and toolbars.

### C. Version Comparison
- **Split View:** Symmetrical 50/50.
- **Sync Status:** Highlighted in #535297 when active.

---

## 4. Reusable Design Patterns
- **Feedback Loop:** Selection (Accent Color) -> Annotation -> Sidebar Comment Card (#FFFFFF).
- **Status Indicators:**
    - Approved: Green.
    - In Review: Accent (#A6A0ED).
    - Draft: Muted (#D2CAFF).

---

## 5. Interaction Guidelines
- **Hover:** Gentle shift to #7C78C1 for secondary elements.
- **Elevation:** Cards use a subtle shadow to separate from #F3F2F7 background.