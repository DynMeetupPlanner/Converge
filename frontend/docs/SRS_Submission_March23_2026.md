# Software Requirements Specification (SRS)
## Converge Mobile Application

**Course Submission:** SRS Document  
**Team Members:** Siddhartha, Nikhil, Andrew, Vedhesh  
**Submission Deadline:** 23 March 2026  
**Document Version:** Final (v1.0)

---

# Chapter 1 (Common to Everyone)

## 1.1 Product Initial Wish List

### High-Priority Wishes (Must Have)
1. User authentication (login and registration).
2. Midpoint finder workflow where multiple people can enter location inputs.
3. Category-based place selection (All, Cafe, Restaurant, Park).
4. Saved and visited place management screen.
5. Settings screen with preference controls and logout.
6. Reliable form scrolling with keyboard open on mobile.

### Medium-Priority Wishes (Should Have)
1. Placeholder recommendation list with ratings and ETA.
2. Better mobile-first visual hierarchy and clean card-based UI.
3. Bottom segmented controls for quick filtering in Saved screen.
4. Theme-based styling consistency across all screens.

### Low-Priority Wishes (Could Have)
1. Persistent settings storage.
2. Real backend-driven saved places.
3. Search and sort in saved places.
4. Real policy/help page routes.

---

## 1.2 Sprint List and Tasks per Sprint

### Sprint 1 (Mar 1 - Mar 6): Foundation + Auth
- Project planning and ownership alignment.
- Route group structure definition (`(auth)` and `(app)`).
- Login and Register base screens.
- API integration for login/register.
- Initial validation and route redirection.

### Sprint 2 (Mar 7 - Mar 12): Core App Flow (Home + Navigation)
- Bottom tab shell (Home, Saved, Settings).
- Home screen baseline with map and participant input.
- Category selector and demo search output.
- Home visual redesign pass.

### Sprint 3 (Mar 13 - Mar 17): Settings + Reliability
- Settings page with account summary and toggles.
- Logout with confirmation dialog.
- Keyboard and scroll bug fixes in auth forms.
- Date-of-birth nested tile scrolling fixes.

### Sprint 4 (Mar 18 - Mar 22): Saved Module + Polishing + Documentation
- Saved/Visited data model and placeholder list.
- All/Saved/Visited segmented filter and summary cards.
- Bottom tray UI above navbar.
- Consistent styling and final QA.
- SRS compilation and final documentation.

---

# Chapter 2 (Individual)
## Daily Scrum (Daily Work Updates and Teammate Feedback)

**Individual Log Owner:** Siddhartha

| Date (2026) | Siddhartha Daily Update | Teammate Feedback (Nikhil / Andrew / Vedhesh) |
|---|---|---|
| Mar 01 | Conducted kickoff, finalized module boundaries and team responsibilities. | Team agreed on sprint-first workflow and split by modules. |
| Mar 02 | Defined auth and app route groups and navigation expectations. | Nikhil suggested a stronger UX-first roadmap; accepted. |
| Mar 03 | Aligned style token usage with existing theme constants. | Andrew recommended shared style patterns for faster UI work. |
| Mar 04 | Reviewed auth API request/response contract and validations. | Vedhesh requested clearer error messaging paths. |
| Mar 05 | Built registration form structure with required inputs. | Nikhil asked for better spacing and cleaner input grouping. |
| Mar 06 | Completed login validation and route transition to Home. | Team requested keyboard-safe behavior for small screens. |
| Mar 07 | Connected tab shell and tested auth-to-app route transitions. | Andrew flagged need for consistent tab labels/icons. |
| Mar 08 | Merged home baseline changes and input state handling. | Nikhil requested better card hierarchy and typography. |
| Mar 09 | Integrated category selection and search placeholder behavior. | Andrew suggested typed result models to avoid TS issues. |
| Mar 10 | Supported home redesign integration and state cleanup. | Nikhil feedback: keep CTA very clear and prominent. |
| Mar 11 | Reviewed saved module baseline and placeholder structure. | Andrew asked for filter-ready data shape from start. |
| Mar 12 | Co-reviewed settings wireframe and toggle grouping. | Vedhesh requested account section at top for clarity. |
| Mar 13 | Supported settings integration testing and route checks. | Team approved sectioned settings card structure. |
| Mar 14 | Integrated logout route behavior and confirmation flow checks. | Vedhesh suggested destructive styling for logout button. |
| Mar 15 | Reproduced keyboard overlap and blocked-scroll bugs in auth. | Team confirmed issue on register + login and requested urgent fix. |
| Mar 16 | Implemented keyboard-safe scroll strategy for auth screens. | Nikhil requested simpler code path after stability confirmed. |
| Mar 17 | Fixed independent nested scroll for DOB day/month/year tiles. | Team confirmed date tile scrolling works correctly after fix. |
| Mar 18 | Merged typed result model fixes and home polish updates. | Andrew requested same visual quality for Saved screen. |
| Mar 19 | Reviewed saved cards/stats work and integration stability. | Nikhil suggested stronger visual grouping for status badges. |
| Mar 20 | Assisted bottom segmented filter integration above navbar. | Andrew feedback: improve tap targets and spacing in tray. |
| Mar 21 | Final QA pass across auth/home/saved/settings modules. | Vedhesh requested final docs to include daily ownership clarity. |
| Mar 22 | Finalized SRS and detailed implementation documents. | Team approved submission-ready document structure. |

---

# Chapter 3 (Common to Everyone)

## Level-1: Design-Workflow Diagram (High-Level Input, Core, Output)

### Level-1 Workflow (Text Diagram)
```
[User Input Layer]
  -> Login/Register Data
  -> Participant Names + Locations
  -> Category Selection
  -> Settings Preferences

          |
          v

[Core Processing Layer]
  -> Auth Validation + API Calls
  -> Midpoint Search Trigger
  -> Placeholder Result Selection by Category
  -> Saved/Visited Filter Processing
  -> Preference Toggle State Handling

          |
          v

[Output Layer]
  -> Auth Success/Failure Feedback
  -> Midpoint Results Cards
  -> Saved/Visited Filtered List
  -> Updated Settings UI State
  -> Route Transitions (Auth <-> App)
```

---

## Level-2: UML Diagrams

### 3.2.1 Interaction Diagram (Actor-System View)
```
Actor: User
  -> Auth Module: login/register
  -> Home Module: add people, choose category, run search
  -> Saved Module: filter all/saved/visited
  -> Settings Module: toggle preferences, logout

System responds with:
  -> Status/error messages
  -> Result cards
  -> Filtered lists
  -> Confirmed logout and route change
```

### 3.2.2 Sequence Diagram
```
User -> AuthScreen: submit credentials
AuthScreen -> Backend API: POST /Auth/login
Backend API -> AuthScreen: success/error response
AuthScreen -> Router: route to /home (on success)

User -> HomeScreen: press "Find Meeting Spot"
HomeScreen -> Local Data Mapper: resolve category results
Local Data Mapper -> HomeScreen: result list
HomeScreen -> UI: render cards
```

### 3.2.3 Activity Diagram
```
Start
  -> Open App
  -> [Authenticated?]
     -> No: Show Login/Register
     -> Yes: Open Home
  -> Enter participants + select category
  -> Trigger search
  -> View results
  -> Optional: Save/visit places
  -> Open Settings
  -> Update preferences / Logout
End
```

### 3.2.4 Class Diagram (Conceptual)
```
Class User
- id
- name
- email
- preferences

Class PersonInput
- name
- location

Class PlaceResult
- name
- rating
- eta
- category

Class SavedPlace
- id
- name
- area
- category
- status (saved|visited)
- lastVisit

Class SettingsState
- notificationsEnabled
- useCurrentLocation
- autoSavePlaces
- defaultCategory

Relationships:
User 1..* PersonInput
User 1..* SavedPlace
HomeScreen uses PersonInput + PlaceResult
SettingsScreen uses SettingsState
```

---

## Level-3: Wireframes (UI Representation, Black & White)

### 3.3.1 Login Wireframe
```
+--------------------------------+
|            Converge            |
|   Sign in to continue          |
| [ Email Input ]                |
| [ Password Input ]             |
| [   Sign In Button   ]         |
| Don't have account? Sign up    |
+--------------------------------+
```

### 3.3.2 Register Wireframe
```
+--------------------------------+
|            Converge            |
|   Register                     |
| [ Username ]                   |
| [ Name ]                       |
| [ Email ]                      |
| [ Password ]                   |
| [ Day ] [ Month ] [ Year ]     |
| [   Sign Up Button   ]         |
+--------------------------------+
```

### 3.3.3 Home Wireframe
```
+--------------------------------+
| Meet in the middle             |
| Find your perfect midpoint     |
| [ Map Card ]                   |
| People Section                 |
|  - Person Cards                |
|  - Add Person                  |
| Category Chips                 |
| [ Find Meeting Spot ]          |
| Results Section                |
+--------------------------------+
```

### 3.3.4 Saved Wireframe
```
+--------------------------------+
| Saved Places                   |
| Stats Cards                    |
| Place Card List                |
|                                |
| [ All | Saved | Visited ]      |
| (Bottom Tray above Navbar)     |
+--------------------------------+
```

### 3.3.5 Settings Wireframe
```
+--------------------------------+
| Settings                       |
| Account Card                   |
| Preferences (Switch rows)      |
| Default Category Chips         |
| Support & Privacy Links        |
| [ Logout Button ]              |
+--------------------------------+
```

---

# Chapter 4 (Common to Everyone)

## 4.1 System Architecture

### Architecture Type
- Client-server oriented mobile architecture.

### Components
1. **Mobile Client (React Native + Expo Router)**
   - Screens: Auth, Home, Saved, Settings
   - Local UI state management (`useState`)
   - Route handling with expo-router
2. **Backend API**
   - Authentication endpoints (`/Auth/login`, `/Auth/register`)
   - JSON request/response contract
3. **Data Layer**
   - Current phase uses placeholder local arrays for search/saved outputs
   - Backend-ready structure maintained for future persistence

### Architecture Diagram (Text)
```
[Mobile App UI]
   |  (HTTP requests)
   v
[Auth API Service]
   |
   v
[Backend + Database Layer]
```

---

## 4.2 System Requirements (Languages and Tools Used)

### Programming Languages
- TypeScript
- JavaScript

### Frameworks and Libraries
- React Native
- Expo
- Expo Router
- React Navigation Tabs
- React Native Maps
- Expo Vector Icons (Ionicons)

### Styling and UI
- Custom `StyleSheet` based component styles
- Shared theme constants (`Colors`, `Fonts`)

### Development Tools
- Node.js / npm
- TypeScript compiler (`npx tsc --noEmit` for validation)
- Git-based source control workflow

### Platform Requirements
- Android emulator/device (primary test path)
- iOS support through Expo setup

### Build/Config Notes
- `softwareKeyboardLayoutMode: resize` configured on Android
- App package identifiers configured in `app.json`

---

## Submission Note
This document is prepared in the required chapter structure and is intended for submission on or before **23 March 2026**.

