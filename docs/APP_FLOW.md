# Gym Helper Application Flow

## Document Information

| Field        | Value            |
| ------------ | ---------------- |
| Document     | Application Flow |
| Product      | Gym Helper       |
| Version      | MVP v1           |
| Status       | Active           |
| Last Updated | June 2026        |

---

# 1. Purpose

This document defines user journeys, screen hierarchy, navigation behavior, and application flow for Gym Helper.

The objective is to ensure a predictable and efficient experience across mobile and desktop devices.

---

# 2. Application Structure

```text
Public

├── Landing
├── Login
├── Register
└── Forgot Password

Authenticated

├── Dashboard
├── Workout
├── Exercises
├── Analytics
└── Profile
```

---

# 3. Public User Flows

## First Time Visitor

Landing
→ Register
→ Create Account
→ Login
→ Dashboard

---

## Returning User

Landing
→ Login
→ Dashboard

---

## Password Recovery

Login
→ Forgot Password
→ Email Verification
→ Reset Password
→ Login
→ Dashboard

---

# 4. Main Navigation

Authenticated users can access:

Dashboard
↔ Workout
↔ Exercises
↔ Analytics
↔ Profile

Navigation should be accessible from all primary screens.

---

# 5. Dashboard Flow

Purpose:

Provide a high-level overview of training activity.

Entry Points:

* Login Success
* Navigation Menu

Available Actions:

* Start Workout
* View Recent Workouts
* Open Analytics
* Open Exercise Library
* Open Profile

Possible Navigation:

Dashboard
├── Workout
├── Exercises
├── Analytics
└── Profile

---

# 6. Workout Flow

## Start Workout

Dashboard
→ Start Workout

or

Workout
→ New Workout

---

## Workout Session

Workout Session
→ Select Exercise
→ Add Sets
→ Update Reps
→ Update Weight
→ Continue Logging

Repeat until workout completion.

---

## Complete Workout

Workout Session
→ Finish Workout
→ Workout Summary
→ Dashboard

---

## Cancel Workout

Workout Session
→ Cancel Workout
→ Confirmation
→ Dashboard

---

# 7. Exercise Flow

## Browse Exercises

Exercises
→ Exercise List

Available Actions:

* Search
* Filter
* View Details

---

## Exercise Details

Exercise List
→ Exercise Details

Available Actions:

* View Instructions
* View Target Muscles
* View Performance History
* Add To Workout

---

## Add Exercise To Workout

Exercise Details
→ Active Workout Session

---

# 8. Workout History Flow

Dashboard
→ Recent Workout

or

Profile
→ Workout History

---

Workout History
→ Workout Details

Available Actions:

* Review Exercises
* Review Sets
* Review Performance

---

# 9. Analytics Flow

Dashboard
→ Analytics

Available Sections:

* Workout Frequency
* Personal Records
* Volume Trends
* Consistency Tracking

---

Analytics
→ Exercise Progress

Analytics
→ PR History

Analytics
→ Volume Analysis

---

# 10. Profile Flow

Dashboard
→ Profile

Available Actions:

* Update Profile
* Change Password
* View Statistics
* Logout

---

## Logout

Profile
→ Logout
→ Login

---

# 11. Primary User Journey

Register
→ Login
→ Dashboard
→ Start Workout
→ Add Exercises
→ Log Sets
→ Complete Workout
→ Review Summary
→ View Analytics
→ Continue Training

---

# 12. Edge Case Flows

## Session Expired

Any Screen
→ Session Expired
→ Login
→ Previous Screen

---

## Network Failure

Any Screen
→ Error State
→ Retry
→ Continue Flow

---

## Empty State

No Workouts
→ Dashboard Empty State
→ Start First Workout

No Analytics
→ Analytics Empty State
→ Complete First Workout

---

# 13. Navigation Rules

Rules:

* Dashboard is the primary entry point after authentication.
* Workout logging requires the fewest possible navigation steps.
* Users must be able to return to Dashboard from any primary screen.
* Active workout sessions must remain accessible until completed or cancelled.
* Navigation patterns must remain consistent across mobile and desktop devices.

---

# 14. MVP Screen Inventory

Public Screens:

* Landing
* Login
* Register
* Forgot Password

Authenticated Screens:

* Dashboard
* Workout
* Workout Session
* Workout Summary
* Exercises
* Exercise Details
* Analytics
* Profile
* Workout History
* Workout Details
