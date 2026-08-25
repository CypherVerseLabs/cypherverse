# CypherVerse Application API

`docs/CYPHERVERSE-API.md`

Developer-facing documentation for the CypherVerse application layer.

This document describes the current CypherVerse architecture, application APIs, authentication flow, project/world management, templates, dialogue, `Starter.tsx`, `ManageSite`, and the data flow between the application, editor, database, and `cyengine`.

---

# 1. Overview

CypherVerse is the application and platform layer built around `cyengine`.

The two projects have different responsibilities.

```text
                    CypherVerse
                         │
          ┌──────────────┼──────────────┐
          │              │              │
      Accounts        Projects       Templates
          │              │              │
          └──────────────┼──────────────┘
                         │
                      Database
                         │
                    World / Scene
                         │
                       Editor
                         │
                      cyengine
                         │
                 React Three Fiber
                         │
                      Three.js
```

CypherVerse owns:

* accounts
* authentication
* projects
* worlds
* templates
* project persistence
* world management
* publishing
* editor application state
* application routing
* creator-facing UI

`cyengine` owns the underlying 3D runtime.

CyEngine provides:

* Three.js / React Three Fiber integration
* `StandardReality`
* world rendering
* player systems
* 3D UI
* interaction
* models
* media
* modifiers
* scene primitives
* animation
* performance utilities
* visual systems

The application should use CyEngine rather than recreating its runtime functionality.

---

# 2. Architectural Boundary

The most important distinction in the codebase is:

```text
CypherVerse
    │
    ├── Authentication
    ├── Accounts
    ├── Projects
    ├── Templates
    ├── Worlds
    ├── Database
    ├── Editor
    ├── Publishing
    └── Creator UI
             │
             ▼
          cyengine
             │
             ├── Reality
             ├── Player
             ├── Models
             ├── Interaction
             ├── Dialogue
             ├── HUD
             ├── Media
             ├── Environment
             └── 3D primitives
```

### CypherVerse asks:

> What world does this user own?

### CyEngine asks:

> How should that world exist and behave in 3D?

This separation should remain intact.

---

# 3. Application Entry / Starter

The primary application composition currently exists in:

```text
Starter.tsx
```

`Starter` acts as the main application/world composition layer.

It currently connects:

* authentication
* API dialogue
* projects
* templates
* world cards
* world scenes
* CyEngine reality
* environment
* editor/world components

Conceptually:

```text
Starter
 │
 ├── AuthContext
 │
 ├── useApiDialogue()
 │
 ├── useProjects()
 │
 ├── TemplateSelector
 │
 ├── WorldCard
 │
 ├── ManageSite
 │
 └── StandardReality
       │
       ├── LostWorld
       ├── CloudySky
       ├── Fog
       ├── Models
       ├── Dialogue
       └── World content
```

---

# 4. Authentication API

Authentication is exposed to application components through:

```ts
useAuthContext()
```

Example:

```ts
const {
  user,
  walletAddress,
  loading,
  isAuthenticated,
  loginWithWallet,
  loginWithEmail,
  signup,
  logout,
} = useAuthContext();
```

The authentication context is currently used by:

```text
src/ideas/context/AuthContext
```

---

# 5. Authentication State

## `user`

Represents the authenticated application user when available.

The user may contain information such as:

```ts
user?.username
user?.email
user?.address
```

Application components should not assume every property exists.

Use optional access:

```ts
user?.username
```

rather than:

```ts
user.username
```

unless the type guarantees the value.

---

## `walletAddress`

Represents the connected wallet address.

Example:

```ts
const {
  walletAddress,
} = useAuthContext();
```

It can be absent when the user is not connected through a wallet.

---

## `loading`

Represents authentication activity.

Example:

```tsx
{loading ? "Loading..." : "Sign In"}
```

Do not assume that `loading` means the user is authenticated.

It only represents the current authentication operation/state.

---

## `isAuthenticated`

Represents whether the application currently considers the user authenticated.

Example:

```ts
if (isAuthenticated) {
  // authenticated application state
}
```

This is preferable to checking only:

```ts
if (walletAddress)
```

because authentication can also happen through email/password.

---

# 6. Authentication Actions

## `loginWithWallet()`

Connects/authenticates a user through a wallet.

Example:

```ts
const user = await loginWithWallet();
```

The returned user can be used immediately rather than depending on React state to update synchronously.

Example:

```ts
const loggedInUser = await loginWithWallet();

if (loggedInUser.address) {
  // use returned address
}
```

This avoids relying on:

```ts
walletAddress
```

immediately after authentication.

---

# 7. `loginWithEmail()`

Authenticates a user through email/password.

```ts
await loginWithEmail(
  email,
  password
);
```

Typical application usage:

```ts
try {
  await loginWithEmail(
    loginEmail,
    loginPassword
  );
} catch (error) {
  // display authentication error
}
```

---

# 8. `signup()`

Creates an account.

```ts
const newUser = await signup(
  email,
  password
);
```

The application currently supports the possibility that signup returns no user.

This can represent a successful signup requiring email verification.

Example:

```ts
const newUser = await signup(
  signupEmail,
  signupPassword
);

if (!newUser) {
  // email verification required
}
```

---

# 9. `logout()`

Logs the current user out.

```ts
await logout();
```

Application state associated with the authenticated user should be cleared or refreshed appropriately after logout.

---

# 10. Authentication Validation

The dialogue layer currently performs client-side validation.

## Email

The application validates email using:

```ts
function validateEmail(
  email: string
): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}
```

Client-side validation is for user experience.

The server must remain responsible for authoritative validation.

---

# 11. Password Validation

The current client-side password policy requires:

* minimum 8 characters
* lowercase character
* uppercase character
* number
* special character

Conceptually:

```text
Password
   │
   ├── 8+ characters
   ├── lowercase
   ├── uppercase
   ├── number
   └── special character
```

The UI should not be considered the security boundary.

Server-side authentication rules remain authoritative.

---

# 12. API Dialogue

The application dialogue is implemented through:

```ts
useApiDialogue()
```

Location:

```text
src/ideas/Dialogues/useApiDialogue.ts
```

The hook returns:

```ts
DialogueFSM
```

Example:

```ts
const dialogue = useApiDialogue();

<Dialogue
  dialogue={dialogue}
/>
```

The dialogue connects CyEngine's world-space dialogue system to CypherVerse application state.

---

# 13. Dialogue Architecture

The dialogue contains application states such as:

```text
init
 │
 ▼
menu
 ├── login_wallet
 ├── login_email
 ├── signup_email
 ├── about
 └── authenticated actions
```

Authenticated users receive additional actions:

```text
menu
 │
 ├── Create a Website
 │       │
 │       ▼
 │   template_selector
 │
 ├── Manage My Websites
 │       │
 │       ▼
 │   manage_websites
 │
 └── Logout
```

---

# 14. Initial Dialogue

The initial state is:

```text
init
```

When authenticated:

```text
Welcome back, <name>!
```

When unauthenticated:

```text
Welcome to Cypherverse. What's your name?
```

The application derives a display name from available identity information.

The order is:

```text
local name
    ↓
username
    ↓
email prefix
    ↓
wallet address
    ↓
friend
```

---

# 15. Main Dialogue Menu

Unauthenticated users see:

```text
Login with Wallet
Login with Email
Signup
What is Cypherverse?
```

Authenticated users see:

```text
Create a Website
Manage My Websites
Logout
```

This means the dialogue is an application navigation layer, not merely a static conversation.

---

# 16. Manage My Websites

The dialogue contains:

```ts
{
  name: "Manage My Websites",
  nextKey: "manage_websites",
}
```

The corresponding state is:

```ts
{
  key: "manage_websites",
  ...
}
```

The purpose of this state is to direct the user toward the application's website/project management interface.

It should **not** duplicate the website/project table.

The intended architecture is:

```text
Dialogue
   │
   ▼
Manage My Websites
   │
   ▼
ManageSite
   │
   ▼
Existing project data
   │
   ▼
Starter / useProjects()
   │
   ▼
World management UI
```

`ManageSite` is an application UI component.

It does not become a second database or second project list.

---

# 17. `ManageSite`

Location:

```text
src/ideas/ManageSite.tsx
```

Purpose:

> Provide a user-facing management panel for existing websites/worlds.

`ManageSite` should consume existing project data rather than recreate project retrieval logic.

The component should not independently duplicate:

```ts
useProjects()
```

unless there is a specific architectural reason to do so.

The preferred architecture is:

```text
useProjects()
       │
       ▼
Starter.tsx
       │
       ├── WorldCard
       │
       └── ManageSite
```

This keeps project data centralized.

---

# 18. Existing Website Table

The current website/world information already exists in the `Starter.tsx` project flow.

Projects are retrieved through:

```ts
useProjects()
```

The result includes:

```ts
projects
projectsLoading
projectsError
refreshProjects
```

Starter then derives projects containing scene data:

```ts
const projectsWithScenes =
  projects.filter(
    (project) =>
      project.scene !== undefined &&
      project.scene !== null
  );
```

This is important.

The management UI should use this existing data rather than create a separate table source.

---

# 19. Projects API

Projects are accessed through:

```ts
useProjects()
```

Example:

```ts
const {
  projects,
  loading,
  error,
  refreshProjects,
} = useProjects();
```

The hook represents the application/data boundary for user projects.

---

# 20. Project Loading State

The application exposes:

```ts
loading
```

for project retrieval.

Example:

```tsx
{loading && (
  <Words>
    Loading your worlds...
  </Words>
)}
```

Project loading should not be confused with authentication loading.

They represent different application states.

---

# 21. Project Error State

The project API can expose an error.

Example:

```tsx
{error && (
  <Words>
    Unable to load your worlds.
  </Words>
)}
```

The UI should avoid rendering project-dependent operations when the project request has failed.

---

# 22. Refreshing Projects

The project API exposes:

```ts
refreshProjects()
```

This allows the application to refresh project data after operations such as:

* creating a project
* deleting a project
* updating a project
* publishing a project
* returning from an editor

The exact refresh behavior depends on the current `useProjects` implementation.

---

# 23. Project Data

A project represents a persisted CypherVerse world/website.

Conceptually:

```ts
type Project = {
  id: string;
  name: string;
  scene?: Scene | null;
  // additional application fields
};
```

The exact interface should remain defined by the application's project API.

Do not duplicate a second incompatible `Project` type inside presentation components.

---

# 24. Scene Data

A project can contain scene information.

Starter currently checks:

```ts
project.scene !== undefined &&
project.scene !== null
```

Projects with scenes are passed to `WorldCard`.

Example:

```tsx
<WorldCard
  key={project.id}
  name={project.name}
  scene={project.scene as Scene}
  projectId={project.id}
/>
```

The scene is the bridge between persistent project data and the 3D editor/world.

---

# 25. Project → Scene → Editor Flow

The current conceptual flow is:

```text
User
 │
 ▼
Authentication
 │
 ▼
useProjects()
 │
 ▼
Project
 │
 ├── id
 ├── name
 └── scene
       │
       ▼
     Scene
       │
       ▼
     Editor
       │
       ▼
     Modify
       │
       ▼
     Save
       │
       ▼
   Database
```

The editor should operate on the project/scene rather than inventing an unrelated world representation.

---

# 26. World Cards

`WorldCard` represents a user's existing world/project in the 3D application.

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

The card receives:

```text
name
scene
projectId
position
```

The project ID is particularly important because it identifies the persistent project associated with the displayed world.

---

# 27. World Grid

Starter currently arranges world cards in three columns.

Conceptually:

```text
       World 1     World 2     World 3

       World 4     World 5     World 6

       World 7     World 8     World 9
```

The column is calculated from:

```ts
const column = index % 3;
```

The row is:

```ts
const row = Math.floor(
  index / 3
);
```

The resulting position is:

```ts
[
  (column - 1) * 3.5,
  -row * 4,
  0
]
```

This is presentation logic and belongs in the application presentation layer.

---

# 28. No Projects State

When there are no projects:

```text
You have not created a world yet.
```

This is displayed only when:

```text
not loading
AND
no error
AND
projects.length === 0
```

---

# 29. Projects Without Scenes

A project may exist without a usable scene.

Starter distinguishes:

```text
projects
```

from:

```text
projectsWithScenes
```

If projects exist but none contain scenes, the UI can display:

```text
Your worlds are being prepared...
```

This distinction is important for asynchronous project/world creation.

---

# 30. Template Selector

The application template creation flow is handled by:

```text
src/ideas/TemplateSelector.tsx
```

Its purpose is to let the creator choose the starting point for a new world.

The current conceptual templates are:

```text
Editor
Found
```

---

# 31. Editor Template

The Editor template represents a blank starting world.

Conceptually:

```ts
{
  id: "editor",
  name: "Editor",
  description:
    "Start with a blank world and build it yourself.",
  route: "/editor",
  previewImage: "/editor_preview.png"
}
```

The exact current template implementation remains the source of truth.

---

# 32. Found Template

The Found template represents a prebuilt starting world.

Conceptually:

```ts
{
  id: "found",
  name: "Found",
  description:
    "Begin with a ready-made world and make it your own.",
  route: "/found",
  previewImage: "/found_preview.png"
}
```

Again, the actual implementation should remain authoritative over this documentation.

---

# 33. Template Flow

The intended creation flow is:

```text
Template Selector
       │
       ▼
Choose Template
       │
       ▼
Name World
       │
       ▼
Create
       │
       ▼
Persist Project
       │
       ▼
Project ID
       │
       ▼
Open Editor
       │
       ▼
Build
       │
       ▼
Save
       │
       ▼
Publish
```

---

# 34. Template State

The selector conceptually has three states.

### State 1 — Selection

```text
Current Template
       │
       ├── Preview
       ├── Description
       └── Use / Select
```

### State 2 — Naming

```text
What world are you dreaming of?

[ World name ]

[ Cancel ] [ Create ]
```

### State 3 — Created

```text
Project created
       │
       ▼
Open Editor
```

The implementation may evolve, but the important architectural principle is that templates are data-driven.

---

# 35. Data-Driven Templates

A template should be represented as data rather than hard-coded into unrelated UI branches.

Conceptually:

```ts
type Template = {
  id: string;
  name: string;
  description: string;
  route: string;
  previewImage: string;
};
```

The UI then consumes:

```ts
template.name
template.description
template.route
template.previewImage
```

This makes adding templates easier.

---

# 36. Starter Project Data Flow

The current `Starter.tsx` follows this general pattern:

```text
useProjects()
     │
     ▼
projects
     │
     ├── loading
     ├── error
     └── data
          │
          ▼
     projectsWithScenes
          │
          ├── WorldCard
          │
          └── ManageSite
```

This is preferable to having every UI component independently query the database.

---

# 37. Recommended Management Architecture

The website management system should follow:

```text
                    useProjects()
                         │
                         ▼
                    Starter.tsx
                         │
              ┌──────────┴──────────┐
              │                     │
          WorldCard             ManageSite
              │                     │
              ▼                     ▼
        World preview         Management panel
                                    │
                                    ├── Open
                                    ├── Edit
                                    ├── Publish
                                    └── Delete
```

The exact actions can be added as the project API supports them.

The important principle is:

> One project data source, multiple presentation surfaces.

---

# 38. ManageSite Must Not Duplicate Data

Do not create:

```ts
const websites = [...]
```

inside `ManageSite` when the same projects already exist in `Starter`.

Do not create a second project query simply to display the same table unless there is a concrete data synchronization requirement.

Instead:

```tsx
<ManageSite
  projects={projects}
  loading={projectsLoading}
  error={projectsError}
/>
```

The component renders the supplied data.

This keeps the component reusable and predictable.

---

# 39. TypeScript Nullability

Application components should distinguish between:

```text
undefined
null
false
```

For example, if a component expects:

```ts
error?: boolean;
```

then:

```ts
error={null}
```

is invalid.

Normalize values at the boundary:

```ts
error={Boolean(error)}
```

or change the prop type when `null` has meaningful semantics:

```ts
error?: string | null;
```

The preferred choice depends on whether the component needs the actual error message.

---

# 40. Unknown Data

Avoid rendering arbitrary values typed as:

```ts
unknown
```

directly as React children.

For example, this is unsafe:

```tsx
<Text>
  {value}
</Text>
```

when:

```ts
value: unknown
```

Instead, narrow the value:

```ts
typeof value === "string"
  ? value
  : String(value)
```

or define the API type correctly.

Application APIs should expose strongly typed data whenever possible.

---

# 41. Starter Authentication Flow

Starter currently obtains:

```ts
const {
  walletAddress,
  loginWithWallet,
  logout,
  loading,
} = useAuthContext();
```

It also provides a direct authentication handler.

Conceptually:

```ts
const handleAuth = async () => {
  if (walletAddress) {
    await logout();
  } else {
    await loginWithWallet();
  }
};
```

The UI can then display:

```text
Loading...
```

or:

```text
Log Out
```

or:

```text
Sign In
```

depending on state.

The dialogue system provides a richer authentication flow through `useApiDialogue`.

---

# 42. Two Authentication UI Layers

CypherVerse currently has two related authentication surfaces.

### Direct Starter authentication

A simple button:

```text
Sign In
```

or:

```text
Log Out
```

### Dialogue authentication

A richer conversational flow:

```text
Login with Wallet
Login with Email
Signup
Logout
```

Both use the same `AuthContext`.

They should not implement separate authentication systems.

---

# 43. Dialogue and Authentication Relationship

The architecture is:

```text
AuthContext
     │
     ▼
useApiDialogue()
     │
     ▼
DialogueFSM
     │
     ▼
CyEngine Dialogue
```

The dialogue is therefore an application adapter around the authentication API.

---

# 44. Error Handling

Application APIs should generally follow:

```ts
try {
  await operation();
} catch (error) {
  const message =
    error instanceof Error
      ? error.message
      : "Operation failed.";

  // display message
}
```

This pattern is currently used by authentication dialogue actions.

Errors should not be silently swallowed.

---

# 45. Logout State Reset

After logout, local dialogue state should be cleared.

The current dialogue resets:

```text
name
loginEmail
loginPassword
signupEmail
signupPassword
error
```

This prevents credentials and previous dialogue state from leaking into a new session.

---

# 46. World Creation Boundary

Creating a world involves application state and persistent data.

The correct conceptual boundary is:

```text
TemplateSelector
       │
       ▼
Application creation API
       │
       ▼
Database
       │
       ▼
Project
       │
       ▼
Scene
       │
       ▼
Editor
```

The template selector should not become the database abstraction.

---

# 47. Database Responsibility

Database operations belong in the application/data layer.

Examples:

```text
create project
load projects
update project
delete project
save scene
publish project
```

They should not be embedded directly inside low-level 3D primitives.

Avoid putting database queries inside components such as:

```text
RoundedBox
Model
Button
FacePlayer
```

Those are CyEngine/runtime concerns.

---

# 48. Scene Responsibility

The scene represents the editable 3D world structure.

Conceptually:

```text
Project
 │
 ├── id
 ├── name
 ├── owner
 ├── template
 ├── scene
 │     │
 │     ├── objects
 │     ├── transforms
 │     ├── components
 │     └── properties
 │
 └── publishing state
```

The exact scene schema is defined by the editor/application implementation.

---

# 49. Editor Boundary

The editor operates on the scene representation.

The editor should not need to know how authentication itself works.

Instead:

```text
AuthContext
     │
     ▼
Project ownership
     │
     ▼
Project
     │
     ▼
Scene
     │
     ▼
Editor
```

This keeps editor functionality separated from identity management.

---

# 50. Publishing

Publishing belongs to CypherVerse rather than CyEngine.

CyEngine renders the world.

CypherVerse determines:

```text
Who owns the world?
Where is it published?
Is it public?
What URL identifies it?
What version is live?
```

Conceptually:

```text
Scene
  │
  ▼
Save
  │
  ▼
Project
  │
  ▼
Publish
  │
  ▼
Public World
```

---

# 51. World Routes

Template routes may determine the initial world experience.

For example:

```text
/editor
/found
```

However, persistent projects should eventually be identified independently by project identity.

A useful conceptual distinction is:

```text
Template route
    =
starting experience

Project ID
    =
persistent world identity
```

---

# 52. CyEngine Integration

CypherVerse uses CyEngine components directly.

For example:

```ts
import {
  StandardReality,
  LostWorld,
  Button,
  Model,
  Dialogue,
  Fog,
} from "cyengine";
```

Starter currently composes these into a world.

Example:

```tsx
<StandardReality>
  <LostWorld />

  <Fog
    color="#00ff00"
    near={10}
    far={50}
  />

  <Model
    src="./cyLogo.glb"
  />
</StandardReality>
```

CypherVerse should prefer these existing primitives rather than rebuilding them.

---

# 53. StandardReality

Normal CypherVerse 3D worlds should use:

```tsx
<StandardReality>
  ...
</StandardReality>
```

This establishes the CyEngine runtime environment.

CypherVerse adds application-specific world content inside it.

---

# 54. LostWorld

Starter currently uses:

```tsx
<LostWorld />
```

This is CyEngine environment/runtime functionality.

It should not be reimplemented in the CypherVerse application layer.

---

# 55. Dialogue Integration

CypherVerse's API dialogue connects directly to CyEngine's:

```tsx
<Dialogue
  dialogue={dialogue}
/>
```

The application owns:

```text
DialogueFSM data
```

CyEngine owns:

```text
Dialogue rendering
interaction
animation
camera-facing behavior
world-space presentation
```

This is a useful example of the application/runtime boundary.

---

# 56. FacePlayer

When CypherVerse uses:

```tsx
<Dialogue
  face
/>
```

the underlying facing behavior comes from CyEngine.

CypherVerse does not need its own camera-facing implementation.

---

# 57. Ideas

Application-specific reusable 3D components belong under:

```text
src/ideas/
```

Examples include:

```text
Title
Words/Text
TemplateSelector
WorldCard
ManageSite
CloudySky
Rain
Speaker
Cyrus
Analytics
```

These are CypherVerse application presentation components.

They can compose CyEngine primitives.

---

# 58. Ideas vs. CyEngine Components

A useful distinction:

```text
CyEngine
 ├── Model
 ├── Button
 ├── Dialogue
 ├── Fog
 ├── FacePlayer
 ├── RoundedBox
 └── Interactable

CypherVerse Ideas
 ├── WorldCard
 ├── ManageSite
 ├── TemplateSelector
 ├── Title
 ├── Cyrus
 └── application-specific UI
```

If a component is generally useful to any CyEngine project, it may belong in CyEngine.

If it represents CypherVerse product behavior, it belongs in CypherVerse.

---

# 59. Component Design

CypherVerse components should generally have one clear responsibility.

Prefer:

```tsx
<ManageSite />
```

for management UI.

Prefer:

```tsx
<WorldCard />
```

for individual world presentation.

Prefer:

```tsx
<TemplateSelector />
```

for template selection.

Avoid one giant component responsible for:

```text
authentication
database
template selection
world rendering
editor state
publishing
```

---

# 60. Data vs. Presentation

Keep persistent data separate from visual presentation.

For example:

```text
Project
   │
   ▼
WorldCard
```

not:

```text
WorldCard
   │
   ├── database query
   ├── authentication
   ├── project creation
   └── scene persistence
```

The more appropriate architecture is:

```text
Data API
   │
   ▼
Application state
   │
   ▼
Presentation component
```

---

# 61. Current Starter Architecture

The current Starter world can be understood as:

```text
StandardReality
 │
 ├── Analytics
 │
 ├── LostWorld
 │
 ├── CloudySky
 │
 ├── Fog
 │
 ├── Starter world
 │    ├── Title
 │    ├── Models
 │    ├── Rain
 │    ├── Speaker
 │    └── Cyrus
 │
 ├── Intro Dialogue
 │
 ├── API Account Dialogue
 │
 ├── TemplateSelector
 │
 └── User Worlds
      │
      ├── Loading
      ├── Error
      ├── Empty
      └── WorldCard[]
```

---

# 62. Current User Journey

The complete creator journey is currently designed around:

```text
Visit CypherVerse
       │
       ▼
Starter
       │
       ▼
Dialogue
       │
       ▼
Authentication
       │
       ▼
Menu
       │
       ├───────────────┐
       │               │
       ▼               ▼
Create Website    Manage Websites
       │               │
       ▼               ▼
TemplateSelector   ManageSite
       │               │
       ▼               ▼
Name World        Existing Projects
       │
       ▼
Create Project
       │
       ▼
Editor
       │
       ▼
Build
       │
       ▼
Save
       │
       ▼
Publish
```

---

# 63. Source of Truth

The following sources should be considered authoritative:

```text
Authentication
    ↓
AuthContext

Dialogue
    ↓
useApiDialogue

Projects
    ↓
useProjects

Templates
    ↓
TemplateSelector / template data

World presentation
    ↓
WorldCard

World management
    ↓
ManageSite

Application composition
    ↓
Starter.tsx

Scene structure
    ↓
editor scene types / editor implementation

3D runtime
    ↓
cyengine
```

Documentation should describe these systems rather than silently inventing alternate APIs.

---

# 64. Recommended Data Flow

The preferred application architecture is:

```text
                    AuthContext
                        │
                        ▼
                   Current User
                        │
                        ▼
                   useProjects
                        │
                        ▼
                     Project
                  ┌─────┴─────┐
                  │           │
                  ▼           ▼
              WorldCard   ManageSite
                  │           │
                  └─────┬─────┘
                        │
                        ▼
                      Scene
                        │
                        ▼
                      Editor
                        │
                        ▼
                       Save
                        │
                        ▼
                    Database
```

---

# 65. Management Flow

`ManageSite` should evolve into the management surface for the creator.

Possible operations include:

```text
Open
Edit
Rename
Duplicate
Delete
Publish
Unpublish
Preview
```

Only actions supported by the current backend should be exposed.

Do not add UI controls for operations that the API cannot actually perform.

---

# 66. Refresh After Mutations

After a successful project mutation:

```text
Create
Update
Delete
Publish
```

the application should refresh or update its local project state.

The existing API provides:

```ts
refreshProjects()
```

for this purpose.

Conceptually:

```ts
await updateProject(...);

await refreshProjects();
```

This keeps:

```text
WorldCard
ManageSite
```

consistent with the persistent data.

---

# 67. Authentication and Project Ownership

Projects belong to authenticated users.

The backend must determine ownership from the authenticated session.

Do not trust arbitrary client-provided ownership identifiers.

Conceptually:

```text
Authenticated Session
        │
        ▼
Current User
        │
        ▼
Owned Projects
```

not:

```text
Client-provided userId
        │
        ▼
Database query
```

The server remains responsible for authorization.

---

# 68. Security Principles

Never expose or commit:

```text
passwords
database credentials
private keys
authentication secrets
server-only API keys
```

Use environment variables for secrets.

Client-visible environment variables must never contain secrets that should remain server-side.

---

# 69. Environment Variables

Local development typically uses:

```text
.env.local
```

Example:

```text
DATABASE_URL=...
NEXT_PUBLIC_...=...
```

The exact environment variables are defined by the current application services.

Do not document fictional environment variables as required configuration.

---

# 70. Development Commands

Install dependencies:

```bash
npm install
```

Development:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Production:

```bash
npm run start
```

The application is normally available locally at:

```text
http://localhost:3000
```

---

# 71. Project Structure

The application currently follows the general pattern:

```text
src/
│
├── ideas/
│   ├── characters/
│   ├── Dialogues/
│   ├── context/
│   ├── projects/
│   ├── TemplateSelector.tsx
│   ├── WorldCard.tsx
│   ├── ManageSite.tsx
│   └── ...
│
├── editor/
│   ├── scene/
│   └── ...
│
└── ...
```

The exact directory structure may evolve.

The architectural responsibilities are more important than the exact folder names.

---

# 72. CypherVerse Ideas Pattern

An Idea should generally:

* have one clear responsibility
* accept data through props
* avoid duplicating application data sources
* compose CyEngine components
* keep presentation separate from persistence

Example:

```tsx
<WorldCard
  name={project.name}
  scene={project.scene}
  projectId={project.id}
/>
```

The project data is supplied by the application.

The card renders it.

---

# 73. Three.js / React Three Fiber

CypherVerse runs its 3D experience through CyEngine, which is built around:

```text
React
React Three Fiber
Three.js
Drei
```

Application components should therefore follow normal React composition while respecting the R3F scene graph.

Example:

```tsx
<group>
  <Title>
    My World
  </Title>

  <Model
    src="./world.glb"
  />
</group>
```

---

# 74. World-Space UI

World-space UI is UI that exists physically inside the 3D world.

Examples:

```text
Dialogue
WorldCard
TemplateSelector
Buttons
Titles
Panels
```

CyEngine provides the underlying primitives.

CypherVerse composes them into application-specific interfaces.

---

# 75. HUD UI

HUD/camera-space UI is different from world-space UI.

Examples include:

```text
editor tools
toolbars
camera-facing controls
```

These belong primarily to CyEngine's HUD/tool systems.

CypherVerse can compose them for its editor.

---

# 76. DOM UI

Traditional HTML/React UI may still be appropriate for application infrastructure such as:

```text
authentication forms
settings
debug panels
administration
developer tools
```

Not every application interface needs to exist in the 3D world.

The UI layer should be selected based on the job.

---

# 77. Three UI Layers

CypherVerse should maintain three explicit UI layers:

```text
DOM UI
   │
   ├── application infrastructure
   ├── settings
   └── traditional forms

HUD / Canvas UI
   │
   ├── editor tools
   ├── toolbars
   └── camera-attached controls

World UI
   │
   ├── dialogue
   ├── world cards
   ├── panels
   └── interactive objects
```

This distinction prevents UI responsibilities from becoming mixed together.

---

# 78. Performance

CyEngine provides performance-oriented utilities such as:

```text
useLimitedFrame
useLimiter
resource cache
geometry cache
```

CypherVerse should use these rather than introducing unnecessary per-frame work.

For example, application components that need camera-facing updates should prefer CyEngine modifiers such as:

```tsx
<FacePlayer>
  ...
</FacePlayer>
```

rather than writing custom frame loops.

---

# 79. Scene Graph Naming

CyEngine provides consistent scene graph naming conventions.

CypherVerse application components can use descriptive names such as:

```text
dialogue
main-dialogue
manage-site
world-card
template-selector
```

Names should help debugging and editor inspection.

---

# 80. Error and Loading UX

Application components should explicitly represent:

```text
loading
success
empty
error
```

For example:

```text
Loading your worlds...

Your worlds

World A
World B

or

You have not created a world yet.

or

Unable to load your worlds.
```

This is preferable to rendering an empty screen while data is unavailable.

---

# 81. Empty State

An empty state is different from an error.

```text
projects.length === 0
```

means:

> The request succeeded, but the user has no projects.

An error means:

> The application could not retrieve the project data.

These should remain visually and semantically distinct.

---

# 82. Current CypherVerse Application Model

The platform can be summarized as:

```text
User
 │
 ├── Authentication
 │
 └── Projects
       │
       ├── Project
       │    ├── Template
       │    ├── Name
       │    ├── Scene
       │    └── Publishing state
       │
       └── Project
```

The project is the persistent application-level representation of a creator's world.

---

# 83. Template vs. Project

A template is not a project.

A template describes how a project begins.

```text
Template
   │
   ▼
Project creation
   │
   ▼
Persistent Project
```

Once created, the project becomes its own persistent entity.

---

# 84. Project vs. Scene

A project is not simply a scene.

A project represents the application-level entity:

```text
Project
 ├── identity
 ├── ownership
 ├── name
 ├── template
 ├── publishing
 └── scene
```

The scene represents the 3D world structure contained by the project.

This separation is important for future features such as:

* publishing
* permissions
* versions
* analytics
* domains
* collaboration

---

# 85. Future Publishing Model

The intended future model can be represented as:

```text
Project
   │
   ▼
Scene
   │
   ▼
Save
   │
   ▼
Version
   │
   ▼
Publish
   │
   ▼
Public URL
```

The exact implementation may change.

The architectural principle is that publishing is an application concern.

---

# 86. CyEngine API Relationship

CypherVerse should not reproduce the entire CyEngine API here.

CyEngine remains responsible for its own runtime documentation.

CypherVerse only documents the integration points it uses.

Examples:

```text
CyEngine
 ├── StandardReality
 ├── LostWorld
 ├── Model
 ├── Button
 ├── Dialogue
 ├── FacePlayer
 ├── Fog
 └── other runtime systems

CypherVerse
 ├── useApiDialogue
 ├── AuthContext
 ├── useProjects
 ├── TemplateSelector
 ├── WorldCard
 ├── ManageSite
 └── Starter
```

---

# 87. CyEngine Principles Used by CypherVerse

CypherVerse follows three major CyEngine principles.

## 1. Composable R3F Components

Everything should be composable.

```tsx
<group>
  <Image />
  <Title />
  <Button />
</group>
```

---

## 2. Behavior Through Modifiers

Behavior should be attached through reusable systems.

Examples:

```tsx
<FacePlayer>
  ...
</FacePlayer>
```

rather than duplicating camera-facing logic.

---

## 3. Explicit UI Layers

World-space UI, HUD UI, and DOM UI should have explicit responsibilities.

---

# 88. Development Principles

When adding functionality, first ask:

### Is this platform functionality?

Examples:

```text
Authentication
Database
Projects
Accounts
Publishing
Ownership
Routing
```

Put this in CypherVerse.

### Is this runtime functionality?

Examples:

```text
Player
Reality
Models
Interaction
Physics
3D UI
Shaders
```

Prefer CyEngine.

### Is this application-specific 3D presentation?

Examples:

```text
WorldCard
ManageSite
TemplateSelector
Title
CreatorMenu
```

Put this in CypherVerse Ideas/components.

---

# 89. Adding a New Application Feature

Use the following process:

```text
1. Define the application data
        ↓
2. Define the API/data operation
        ↓
3. Connect authenticated ownership
        ↓
4. Expose state to the UI
        ↓
5. Build the Idea/component
        ↓
6. Connect it to Starter/editor
        ↓
7. Handle loading/error/empty states
        ↓
8. Test the complete flow
```

Do not start by building visual UI without defining the data flow.

---

# 90. Adding a New World Feature

Use:

```text
Application state
      ↓
Scene data
      ↓
Editor
      ↓
CyEngine component
      ↓
Rendered world
```

If the feature needs persistent information, it must have an appropriate project/scene representation.

---

# 91. Adding a New Template

Add template data rather than duplicating selector logic.

Conceptually:

```ts
{
  id: "new-template",
  name: "New Template",
  description: "...",
  route: "...",
  previewImage: "..."
}
```

The selector should consume the same generic fields.

---

# 92. Adding a New Management Action

For example, if adding Delete:

```text
ManageSite
    │
    ▼
deleteProject(projectId)
    │
    ▼
Database
    │
    ▼
refreshProjects()
    │
    ▼
Updated project list
```

The management UI should not directly manipulate the project array as if it were the persistent database.

---

# 93. Adding a New Editor Action

Editor actions should follow:

```text
Editor action
     │
     ▼
Scene state
     │
     ▼
Save API
     │
     ▼
Project
     │
     ▼
Database
```

The editor should remain independent of the authentication implementation.

---

# 94. Debugging

When debugging application features, identify which layer is failing.

```text
Authentication
     ↓
Project API
     ↓
Application state
     ↓
Component props
     ↓
3D rendering
```

For example:

### User missing

Check:

```text
AuthContext
```

### Projects missing

Check:

```text
useProjects()
```

### Project exists but card missing

Check:

```text
projectsWithScenes
```

### Card exists but does not open

Check:

```text
projectId
WorldCard
routing/editor integration
```

### Scene exists but does not render

Check:

```text
Scene
Editor
CyEngine runtime
```

---

# 95. TypeScript Debugging

When TypeScript reports:

```text
Type 'unknown' is not assignable to type 'ReactNode'
```

the application is attempting to render an insufficiently typed value.

Narrow the value before rendering.

When TypeScript reports:

```text
Type 'string | null' is not assignable to type 'boolean | undefined'
```

the receiving component expects a boolean but the supplied API value can be `null`.

Normalize it:

```ts
Boolean(value)
```

or correct the receiving prop type if `null` is meaningful.

The preferred solution is to make boundaries strongly typed rather than repeatedly casting values.

---

# 96. Production Guidelines

Before considering an application feature production-ready:

* no duplicate data source
* no unhandled async errors
* no secrets in client code
* authenticated operations verify ownership server-side
* loading state exists
* error state exists
* empty state exists where appropriate
* TypeScript types are explicit
* project IDs are preserved
* scene data is validated
* database mutations refresh application state
* UI does not claim functionality that the backend does not support

---

# 97. Current Core APIs

The current CypherVerse application API can be summarized as:

```text
Authentication
    useAuthContext()

Dialogue
    useApiDialogue()

Projects
    useProjects()

Template creation
    TemplateSelector

World presentation
    WorldCard

World management
    ManageSite

Application composition
    Starter

Scene/editor data
    Scene / editor systems
```

---

# 98. Complete Application Data Flow

The overall architecture is:

```text
                         USER
                          │
                          ▼
                   AuthContext
                          │
                          ▼
                 Authenticated User
                          │
                          ▼
                    useProjects()
                          │
                          ▼
                       Projects
                          │
             ┌────────────┼────────────┐
             │            │            │
             ▼            ▼            ▼
        WorldCard     ManageSite   TemplateSelector
             │            │            │
             │            │            ▼
             │            │        Create Project
             │            │            │
             │            │            ▼
             │            │         Database
             │            │            │
             └────────────┴────────────┘
                          │
                          ▼
                       Project
                          │
                          ▼
                        Scene
                          │
                          ▼
                       Editor
                          │
                          ▼
                       cyengine
                          │
                          ▼
                    3D World
                          │
                          ▼
                      Publish
```

---

# 99. The Platform Model

CypherVerse can ultimately be understood as five connected layers:

```text
1. Identity

   User
   Authentication
   Ownership


2. Data

   Projects
   Scenes
   Templates
   Persistence


3. Creation

   TemplateSelector
   Editor
   Scene composition


4. Experience

   cyengine
   3D world
   Interaction
   UI


5. Publishing

   Project
   Public world
   URL
   Distribution
```

These layers should remain loosely coupled.

---

# 100. Final Architectural Principle

CypherVerse provides the platform.

CyEngine provides the reality.

React provides composition.

Three.js provides the underlying 3D system.

Creators provide the worlds.

The intended direction is:

```text
Components
     ↓
Data
     ↓
Composition
     ↓
Interaction
     ↓
Scene
     ↓
World
     ↓
Persistence
     ↓
Publishing
```

The application should remain data-driven and composable.

A creator should eventually be able to move from:

```text
Sign in
```

to:

```text
Create a website
```

to:

```text
Choose a template
```

to:

```text
Name the world
```

to:

```text
Build the world
```

to:

```text
Save
```

to:

```text
Manage the website
```

to:

```text
Publish
```

without the underlying architecture becoming a collection of duplicated data sources and unrelated UI systems.

That is the intended CypherVerse application architecture.

---

# Related Documentation

CyEngine documentation should remain separate and describe the runtime itself.

CypherVerse documentation describes the application layer and its integration with CyEngine.

Recommended documentation structure:

```text
cypherverse/
│
├── README.md
│
├── docs/
│   ├── DEVELOPMENT.md
│   └── CYPHERVERSE-API.md
│
└── src/
    ├── ideas/
    ├── editor/
    └── ...
```

The separation should remain:

```text
docs/DEVELOPMENT.md
    ↓
How developers work on CypherVerse

docs/CYPHERVERSE-API.md
    ↓
What the CypherVerse application APIs and data flows are

CyEngine documentation
    ↓
How the 3D runtime works
```

CypherVerse should reference CyEngine rather than duplicating its entire API documentation.
