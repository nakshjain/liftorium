---
description: UI design, styling, and responsive design conventions
globs: ["frontend/**/*.ts", "frontend/**/*.html"]
---

# UI Style Guide

## Styling

* Use TailwindCSS exclusively.
* Do not introduce custom CSS files unless explicitly required.
* Do not use CSS-in-JS libraries.
* Do not introduce additional styling frameworks.

## Theme

* Dark theme is the default experience.
* Follow the project's established color palette.
* Reuse existing Tailwind color conventions before introducing new colors.
* Maintain consistent spacing, typography, and visual hierarchy.

## Mobile First

* Design for mobile devices first.
* Optimize all primary workflows for phone usage.
* Avoid unnecessary navigation depth.
* Minimize the number of taps required to complete common actions.

## Workout Logging UX

Workout logging is the highest-priority workflow.

Optimize for:

* Fast exercise selection
* Fast set entry
* Large touch targets
* Minimal scrolling
* Clear visual feedback
* One-handed phone usage where practical

## Responsive Design

* Use Tailwind responsive utilities:

    * `sm:`
    * `md:`
    * `lg:`
* Mobile experience takes priority over desktop enhancements.
* Desktop layouts should enhance usability without changing core workflows.

## Components

* Reuse existing UI components before creating new ones.
* Maintain visual consistency across screens.
* Prefer composition over duplicating UI patterns.

## Accessibility

Apply when creating or modifying shared components:

* Use semantic HTML.
* Ensure sufficient color contrast.
* Provide labels for form controls.
* Ensure interactive elements are keyboard accessible.
* Avoid relying solely on color to convey meaning.

Do not proactively add accessibility fixes to unrelated code during other tasks.
