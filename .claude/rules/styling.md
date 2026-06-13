---
description: UI styling rules — TailwindCSS only, dark theme, mobile-first
globs: ["frontend/**/*.ts", "frontend/**/*.html"]
---

# Styling Rules

- TailwindCSS utility classes only. No custom CSS files, no CSS-in-JS, no other styling libraries.
- Dark theme by default. Use `bg-gray-900`, `text-white`, etc. as base palette.
- Mobile-first design. Minimize taps during workout logging — large touch targets, minimal navigation depth.
- Responsive breakpoints via Tailwind (`sm:`, `md:`, `lg:`) when needed, but optimize for phone use.