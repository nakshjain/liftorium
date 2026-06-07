# Gym Helper - AI Agent Instructions

> Use this file before doing anything.

## Project Overview

Build a production-ready gym workout tracking application.

This project is intentionally developed using AI-assisted engineering workflows with Codex agents.

The goal is:

* fast MVP delivery
* clean scalable architecture
* production-quality code
* comprehensive documentation
* AI-driven implementation workflow

---

# Tech Stack

## Frontend

* Angular latest
* TypeScript
* TailwindCSS
* Standalone components
* Angular Signals
* Mobile-first responsive UI

## Backend

* Java 21
* Spring Boot latest stable
* Maven
* MongoDB
* Spring Security
* JWT Authentication
* Lombok
* Spring Validation

---

# Architecture Rules

* Use modular architecture
* Keep files small and reusable
* Avoid monolithic components
* Prefer composition over duplication
* Use strict typing
* Never use `any`
* Generate production-ready code only
* No pseudo code
* Keep naming consistent

---

# Frontend Rules

* Use standalone Angular components
* Use lazy-loaded routes
* Use TailwindCSS only
* Dark theme by default
* Optimize for mobile usage
* Minimize taps during workout logging
* Use Signals where appropriate

---

# Backend Rules

* Use controller/service/repository structure
* Use centralized exception handling
* Validate all requests with Jakarta Validation
* Use Spring Security for protected routes
* Use environment variable placeholders in `application.properties`
* Use JWT auth with refresh tokens
* Use scalable package structure under `com.gymhelper`

---

# Documentation Requirements

Whenever implementing a feature:

1. Update documentation inside `/docs`
2. Create architecture notes if needed
3. Save important prompts in `/docs/prompts`
4. Document APIs in `/docs/api`
5. Document workflows in `/docs/workflows`
6. Update progress logs

---

# Docs Structure

/docs
/architecture
/api
/prompts
/workflows
/progress
/decisions

---

# AI Workflow Rules

Before coding:

* Explain implementation approach briefly

After coding:

* List created files
* Explain architecture decisions
* Mention next recommended steps

---

# Git Rules

After completing a stable feature:

* create clean commits
* use meaningful commit messages

Commit style examples:

* feat: add workout tracking module
* feat: implement JWT authentication
* refactor: optimize exercise service

---

# MVP Priority

Priority order:

1. Authentication
2. Workout tracking
3. Exercise database
4. Workout history
5. Progress analytics
6. PR tracking

Avoid advanced AI features initially.

---

# Product Vision

The app should feel:

* fast
* minimal
* modern
* gym-focused
* mobile-first
* optimized for real workout usage
