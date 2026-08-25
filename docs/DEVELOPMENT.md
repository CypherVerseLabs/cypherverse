````md
# CypherVerse Development Guide

Developer documentation for building and maintaining CypherVerse.

---

# Development Principles

CypherVerse follows a simple architectural rule:

> Keep platform logic, data, and 3D presentation separated.

The application should remain composable.

Prefer small components with clear responsibilities.

---

# Platform vs Runtime

Always determine where new functionality belongs.

## CypherVerse

Platform functionality includes:

- authentication
- accounts
- database operations
- project persistence
- websites
- templates
- publishing
- routing
- project management

## cyengine

3D runtime functionality includes:

- Reality
- Player
- Environment
- Models
- 3D UI
- interaction
- scene utilities

## CypherVerse Ideas

Application-specific 3D presentation includes:

- Title
- WorldCard
- TemplateSelector
- ManageSite
- custom characters
- project-specific UI

---

# Project Structure

A typical structure:

```text
src/
│
├── app/
│   ├── editor/
│   ├── found/
│   └── ...
│
├── ideas/
│   ├── Dialogues/
│   │   ├── useApiDialogue.ts
│   │   └── ...
│   │
│   ├── TemplateSelector.tsx
│   ├── ManageSite.tsx
│   ├── WorldCard.tsx
│   ├── Title.tsx
│   ├── Text.tsx
│   └── ...
│
├── context/
│   └── ...
│
├── projects/
│   └── ...
│
├── database/
│   └── ...
│
└── editor/
    └── ...
````

The exact structure can evolve.

The responsibility boundaries should remain clear.

---

# Component Composition

Prefer:

```tsx
<group>
  <Image />
  <Title />
  <Text />
  <Button />
</group>
```

over a large component containing unrelated functionality.

A component should generally have one primary responsibility.

---

# State

Keep state as close as practical to the component that owns it.

For example:

```tsx
const [worldName, setWorldName] = useState("");
```

belongs with the world-naming interface.

Persistent project state belongs in the project/data layer.

Authentication state belongs in `AuthContext`.

Dialogue state belongs in the dialogue hook.

---

# Project Data

When project data already exists higher in the component tree, pass it down.

Example:

```tsx
const {
  projects,
  loading: projectsLoading,
  error: projectsError,
} = useProjects();
```

Then:

```tsx
<ManageSite
  projects={projects}
  loading={projectsLoading}
  error={projectsError}
/>
```

Do not call `useProjects()` again inside `ManageSite` unless there is a specific architectural reason to do so.

---

# ManageSite

`ManageSite.tsx` is the presentation/management entry point for existing websites.

The intended architecture is:

```text
useProjects()
      │
      ▼
Starter.tsx
      │
      ├── existing project display
      │
      └── ManageSite
              │
              ▼
          WorldCard
```

The account dialogue provides navigation:

```text
Manage My Websites
        ↓
manage_websites
        ↓
ManageSite
```

The dialogue should not recreate the project table.

`ManageSite` should not recreate the template selector.

There should be one project data source.

---

# DialogueFSM

The account dialogue is implemented in:

```text
src/ideas/Dialogues/useApiDialogue.ts
```

The dialogue contains states such as:

```text
init
menu
login_email
login_password
login_submit
signup_email
signup_password
signup_submit
login_wallet
logout
about
about_how
about_future
manage_websites
```

The `manage_websites` state is intentionally simple:

```text
Manage My Websites
        ↓
manage_websites
        ↓
ManageSite
```

The dialogue handles navigation.

The component handles presentation.

---

# Templates

The template selector is already owned by the starter experience.

Do not create a second selector inside `ManageSite`.

The general template flow is:

```text
Template
   ↓
Selection
   ↓
Name
   ↓
Create
   ↓
Persist
   ↓
Editor
```

---

# World Cards

Existing projects with scenes can be represented by `WorldCard`.

Example:

```tsx
<WorldCard
  key={project.id}
  name={project.name}
  scene={project.scene as Scene}
  position={[
    (column - 1) * 3.5,
    -row * 4,
    0,
  ]}
  projectId={project.id}
/>
```

Always pass the real project ID.

Do not use:

```tsx
projectId=""
```

when the actual ID is available.

The ID is required for future project operations such as:

* opening
* editing
* deleting
* publishing
* updating

---

# Authentication

Authentication is accessed through the application's authentication context.

Example:

```tsx
const {
  walletAddress,
  loginWithWallet,
  logout,
  loading,
} = useAuthContext();
```

Authentication state should not be duplicated inside unrelated components.

---

# Validation

Input validation should occur before sending data to the server.

For example:

```ts
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```

Password validation should remain centralized rather than duplicated throughout components.

---

# Error Handling

Errors should be converted into user-readable state.

Example:

```ts
catch (err) {
  const message =
    err instanceof Error
      ? err.message
      : "Operation failed.";

  setError(message);
}
```

Do not render an arbitrary `unknown` error directly as a React child.

Prefer a typed value:

```ts
error?: string | null;
```

---

# 3D Positioning

Use normal Three.js / React Three Fiber transforms.

Prefer:

```tsx
position={[0, 2, -1.5]}
rotation={[0, Math.PI / 2, 0]}
```

over unnecessarily expanded arrays.

Keep parent groups stable when possible.

Example:

```tsx
<group position={[0, 0.8, 0]}>
  <Image
    position={[0, 2, -1.55]}
  />

  <Button
    position={[0, -0.45, 0]}
  >
    Create
  </Button>
</group>
```

This makes scene layout easier to maintain.

---

# 3D Panels

A physical 3D panel can be composed from a model and UI.

Example:

```tsx
<Model
  position={[0, 2, -1.5]}
  rotation={[0, Math.PI / 2, 0]}
  src="./3dpanelmodel.glb"
/>
```

Then place UI slightly in front of the model.

```tsx
<Image
  src="/preview.png"
  size={1}
  position={[0, 2, -1.55]}
  rotation={[0, Math.PI, 0]}
  framed
/>
```

---

# cyengine

Reuse `cyengine` functionality whenever it already provides the required behavior.

Example:

```tsx
import {
  StandardReality,
  LostWorld,
  Model,
  Button,
  Dialogue,
} from "cyengine";
```

Do not recreate runtime primitives inside CypherVerse unless there is a clear application-specific requirement.

---

# Adding an Idea

When adding a new reusable 3D component:

1. Give it one clear responsibility.
2. Keep its API small.
3. Accept data through props.
4. Avoid unnecessary data fetching.
5. Reuse cyengine primitives.
6. Keep persistent operations outside the presentation component.

Example:

```tsx
type WorldCardProps = {
  name: string;
  projectId: string;
};
```

---

# Adding a New Template

Add the template to the template data definition.

Example:

```ts
const TEMPLATES: Template[] = [
  {
    id: "editor",
    name: "Editor",
    description:
      "Start with a blank world and build it yourself.",
    route: "/editor",
    previewImage: "/editor_preview.png",
  },

  {
    id: "found",
    name: "Found",
    description:
      "Begin with a ready-made world and make it your own.",
    route: "/found",
    previewImage: "/found_preview.png",
  },
];
```

The selector should consume the data dynamically.

Do not create a separate component for every template unless the templates genuinely require different behavior.

---

# Adding a Dialogue State

Dialogue states should have:

```text
key
text
input (when required)
decisions
effect (when required)
```

Example:

```ts
{
  key: "manage_websites",

  text:
    "Manage your websites.",

  decisions: [
    {
      name: "Back to Menu",
      nextKey: "menu",
    },
  ],
}
```

Keep dialogue states focused on navigation and interaction.

---

# Database Development

Database operations belong in the application/data layer.

Do not put raw database queries inside:

```text
Title.tsx
Text.tsx
Button-based presentation
WorldCard.tsx
ManageSite.tsx
```

unless the component is explicitly designed as a data/container component.

Prefer:

```text
Database
   ↓
Data Hook
   ↓
Application Component
   ↓
Presentation Component
```

---

# Development Workflow

When implementing a feature:

## 1. Identify ownership

Ask:

```text
Is this platform logic?
Is this project data?
Is this dialogue navigation?
Is this 3D presentation?
Is this cyengine functionality?
```

## 2. Find existing functionality

Before creating a new component, check whether the functionality already exists.

Do not duplicate:

* template selectors
* project fetching
* authentication
* database operations
* cyengine primitives

## 3. Add the smallest required component

Prefer extending an existing architecture over introducing a parallel system.

## 4. Connect data

Pass existing data through props when appropriate.

## 5. Test the complete flow

For example:

```text
Login
 ↓
Account Menu
 ↓
Manage My Websites
 ↓
manage_websites
 ↓
ManageSite
 ↓
Existing Project
 ↓
Open / Manage
```

---

# Local Development

Install dependencies:

```bash
npm install
```

Run development:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Run production:

```bash
npm run start
```

---

# Environment Variables

Use:

```text
.env.local
```

for local development.

Never commit:

```text
passwords
private keys
database credentials
API secrets
authentication secrets
```

---

# Debugging

When debugging a 3D object, isolate:

```text
Position
Rotation
Scale
```

Example:

```tsx
<Model
  position={[0, 2, -1.5]}
  rotation={[0, Math.PI / 2, 0]}
  scale={1}
/>
```

Change one value at a time.

For UI, adjust child positions rather than repeatedly moving the entire world.

---

# Production Checklist

Before considering a feature complete:

* [ ] TypeScript builds without errors.
* [ ] No duplicated data fetching.
* [ ] Existing components are reused.
* [ ] Authentication ownership is respected.
* [ ] Database operations remain in the data layer.
* [ ] Project IDs are passed correctly.
* [ ] Loading states exist where necessary.
* [ ] Error states exist where necessary.
* [ ] Empty states exist where necessary.
* [ ] 3D positioning has been tested.
* [ ] Existing template functionality has not been duplicated.
* [ ] Dialogue navigation reaches the correct state.
* [ ] The complete user flow has been tested.

---

# Core Rule

When adding functionality, prefer:

```text
Existing Data
      ↓
Existing Architecture
      ↓
Small Component
      ↓
Clear Responsibility
```

over:

```text
New Data Fetch
      ↓
New State System
      ↓
Duplicate UI
      ↓
Duplicate Logic
```

CypherVerse should grow by composition rather than duplication.

```
```
