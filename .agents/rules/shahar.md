# Shahar Design System & Frontend Guidelines

## UI Principles
1. **Flat Minimalist Dark Mode**:
   - Primary Background: `bg-slate-900`
   - Card / Panel Background: `bg-slate-800`
   - Log View Background: `bg-slate-950`
   - Borders: `border-slate-700`
   - Text Colors: `text-slate-100` (primary), `text-slate-400` (secondary), `text-slate-500` (muted).

2. **Tailwind CSS Utility Classes**:
   - Use standard Tailwind utility classes exclusively.
   - Do NOT use custom CSS animations, CRT scanline effects, glowing drop-shadows, or custom CSS files.

3. **Layout & Grid**:
   - Fullscreen `100vh` flex layout.
   - Left Panel (70%): Leaflet Map.
   - Right Panel (30%): Standard Sidebar with Top Action Buttons, Middle Asset List, Bottom Agent Log View.
