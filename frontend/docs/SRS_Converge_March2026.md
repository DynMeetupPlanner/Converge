# Software Requirements Specification (SRS)
## Converge Mobile Application

**Document Version:** 1.0 (Final Submission Draft)  
**Reporting Period:** March 1, 2026 to March 22, 2026  
**Prepared For:** Faculty Review  
**Prepared By Team:** Siddhartha, Nikhil, Andrew, Vedhesh

---

## 1. Document Purpose
This SRS documents the implemented scope, requirements, feature status, and team contribution log for the Converge mobile app during the period **March 1, 2026 to March 22, 2026**.

The goal of Converge is to help multiple users find fair midpoint meeting locations, manage discovered places, and personalize app behavior.

---

## 2. Project Scope
The implemented system covers:
- Authentication (sign-in and registration)
- Midpoint discovery home workflow (map + participants + category + search)
- Saved/Visited places management UI
- Settings module with user preferences and logout
- Form/scroll/keyboard usability improvements for mobile reliability

---

## 3. Team and Responsibility Distribution

### 3.1 Team Members
- Siddhartha
- Nikhil
- Andrew
- Vedhesh

### 3.2 Responsibility Matrix (Primary Ownership)
| Module | Primary Owner | Supporting Members |
|---|---|---|
| Authentication flow and routing | Siddhartha | Vedhesh |
| Home screen feature flow and UI modernization | Nikhil | Siddhartha |
| Saved/Visited module and filter UX | Andrew | Nikhil |
| Settings module, preferences, logout flow | Vedhesh | Andrew |
| QA pass, bug triage, integration checks | Siddhartha | All team members |

---

## 4. System Overview
### 4.1 Target Platform
- React Native (Expo Router based mobile app)
- Android-focused testing, with cross-platform style compatibility

### 4.2 Main User Flows
1. User signs in / registers.
2. User enters participant names and locations.
3. User chooses place category and runs search.
4. User views and manages saved/visited places.
5. User updates preferences in settings and can log out.

---

## 5. Functional Requirements (Implemented)

### FR-01 Authentication: Login
- System shall allow user login with email and password.
- Invalid input and API failure states are shown.
- On success, user is routed to app home.

### FR-02 Authentication: Registration
- System shall allow registration with username, name, email, password, and date of birth.
- Validation enforces required fields.
- On success, user is routed back to login.

### FR-03 Keyboard and Form Usability
- Register and login forms shall remain usable while keyboard is open.
- Main form scroll is preserved.
- Date selector tiles support independent scroll behavior.

### FR-04 Home Discovery Workflow
- System shall display midpoint map preview.
- User can add/remove participants.
- User can select category: all, cafe, restaurant, park.
- Search action returns temporary recommendation placeholders.

### FR-05 Home UI Quality
- Home screen shall provide clear hierarchy, readable cards, and improved input grouping.
- Search results are displayed with rating and short metadata.

### FR-06 Saved/Visited Places
- System shall display placeholder place records for saved and visited states.
- User can filter records using All / Saved / Visited controls.

### FR-07 Bottom Action Tray (Saved Screen)
- Saved screen shall provide a fixed control tray above bottom navigation.
- Tray includes segmented filter and primary action button.

### FR-08 Settings and Preferences
- Settings screen shall contain account summary and editable preference toggles.
- Includes default category preference selector and support/privacy links.

### FR-09 Logout
- Settings screen shall include logout button.
- Logout requires confirmation before routing to login.

---

## 6. Non-Functional Requirements (Implemented/Observed)
- **NFR-01 Usability:** Improved spacing, typography hierarchy, and touch targets across Home, Saved, and Settings.
- **NFR-02 Consistency:** Shared theme palette and style patterns across modules.
- **NFR-03 Performance:** Lightweight local state and placeholder data for responsive UI testing.
- **NFR-04 Maintainability:** Separated style files per module and clearer component-level ownership.

---

## 7. Detailed Change Log (Day-Wise, Starting March 1)

| Date (2026) | Work Completed | Owners |
|---|---|---|
| Mar 01 | Sprint kickoff, SRS baseline outline, module breakdown and ownership agreement | Siddhartha, Nikhil, Andrew, Vedhesh |
| Mar 02 | App navigation and feature map finalized (Auth, Home, Saved, Settings) | Siddhartha, Vedhesh |
| Mar 03 | Theme alignment and visual direction approved for dark/light support | Nikhil, Andrew |
| Mar 04 | Auth API contract and request/response expectations finalized | Siddhartha, Vedhesh |
| Mar 05 | Registration screen base form structure completed | Siddhartha, Nikhil |
| Mar 06 | Login flow validation + route transition to app shell completed | Siddhartha |
| Mar 07 | Tab layout and app shell routing finalized for main screens | Andrew, Siddhartha |
| Mar 08 | Home screen first functional version with map and participant inputs | Nikhil, Siddhartha |
| Mar 09 | Category selection and search result placeholders integrated | Nikhil, Andrew |
| Mar 10 | Home screen UX polish pass (card layout, hierarchy, sectioning) | Nikhil |
| Mar 11 | Saved module structure initialized and placeholder data model drafted | Andrew |
| Mar 12 | Settings module wireframe and preference list finalized | Vedhesh, Andrew |
| Mar 13 | Settings UI implementation with account, preference toggles, and links | Vedhesh |
| Mar 14 | Logout flow with confirmation dialog integrated into Settings | Vedhesh, Siddhartha |
| Mar 15 | Auth form keyboard/scroll defect triage across register/login | Siddhartha, Vedhesh |
| Mar 16 | Register/login scroll behavior fixes when keyboard opens | Siddhartha |
| Mar 17 | Date tile independent scroll issue identified and corrected | Siddhartha, Nikhil |
| Mar 18 | Home screen redesign finalized and typed result model stabilized | Nikhil, Siddhartha |
| Mar 19 | Saved screen redesign completed with cards + summary stats | Andrew, Nikhil |
| Mar 20 | Bottom tray added above tab bar with All/Saved/Visited segmented control | Andrew |
| Mar 21 | Saved screen action button and filtered view interaction completed | Andrew, Vedhesh |
| Mar 22 | Final integration QA, cleanup, and SRS compilation for submission | Siddhartha (lead), All team members |

---

## 8. Member-Wise Summary of Work

### Siddhartha
- Authentication workflow implementation and routing integration
- Keyboard/scroll bug fixing and form reliability improvements
- Final integration checks, QA consolidation, and delivery documentation

### Nikhil
- Home screen information architecture and visual redesign
- Input/result card polish and interaction clarity improvements
- Support for auth/date interaction fixes during UI QA

### Andrew
- Saved/Visited data presentation and filter architecture
- Bottom utility tray design above navigation
- Placeholder data curation for demo-ready saved places flow

### Vedhesh
- Settings screen implementation and preferences organization
- Logout confirmation flow
- Functional review and stability support across auth/settings modules

---

## 9. Current Build Status (As of Mar 22, 2026)
- Auth module: Implemented
- Home module: Implemented with polished UI
- Saved module: Implemented with filter tray and placeholders
- Settings module: Implemented with preferences + logout
- Keyboard and scroll issues in auth/date flows: Addressed
- TypeScript compile check: Passing

---

## 10. Known Limitations / Next Phase
- Some sections currently use placeholder data (Saved places, result samples, account labels)
- Preference values are local state and not yet persisted to backend/storage
- Support/privacy links are UI-ready placeholders pending final routes

---

## 11. Approval Statement
This document summarizes the implemented work and contribution distribution for the period **March 1, 2026 to March 22, 2026**, completed collaboratively by:

- Siddhartha
- Nikhil
- Andrew
- Vedhesh

