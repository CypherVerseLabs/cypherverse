<br/>
<br/>

<p align="center">
    <img width="500" src="https://lbemedia.net/images/android-chrome-192x192.ico" alt="CypherVerse logo" />
</p>

<h3 align="center">
    CypherVerse
</h3>

<h5 align="center">
    A platform for building, creating, and experiencing the 3D Web.
</h5>

<div align="center">

[![cyengine](https://img.shields.io/npm/v/cyengine?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/cyengine)

[![License](https://img.shields.io/github/license/CypherVerseLabs/cyengine?style=flat&colorA=000000&colorB=000000)](https://github.com/CypherVerseLabs/cyengine)

</div>

<p align="center">
    <a href="https://cypherverse.space">www.cypherverse.space</a>
    ·
    <a href="https://github.com/CypherVerseLabs">github</a>
    ·
    <a href="https://discord.gg/CrbfwhVVq">discord</a>
</p>

<br/>
<br/>

---

# CypherVerse

CypherVerse is a platform for creating and experiencing interactive 3D worlds on the Web.

It combines user accounts, persistent worlds, templates, database-backed projects, and the `cyengine` 3D runtime into one platform for creating 3D experiences.

The goal is simple:

> Make creating and publishing a 3D website as accessible as creating a traditional website.

---

# What CypherVerse Provides

CypherVerse provides the platform around `cyengine`.

### Accounts

Creators can have persistent accounts and identity.

### Worlds

Creators can create and manage their own worlds.

### Templates

Creators can start from a blank Editor world or a ready-made Found world.

### Database

World and account data can persist beyond a single browser session.

### 3D Editor

Creators can build and modify interactive 3D experiences.

### cyengine

The underlying runtime handles the actual 3D Web experience.

---

# Architecture

```text
                    CypherVerse
                         │
        ┌────────────────┼────────────────┐
        │                │                │
     Accounts          Worlds          Templates
        │                │                │
        └────────────────┼────────────────┘
                         │
                      Database
                         │
                    World Editor
                         │
                      cyengine
                         │
                  React Three Fiber
                         │
                       Three.js

                       CypherVerse is the application and platform.

cyengine is the 3D runtime.

Templates

CypherVerse currently provides two starting templates.

Editor

Start with a blank world and build it yourself.

Found

Begin with a ready-made world and make it your own.

The template selector lets the creator switch between templates before choosing one.

Editor


[ preview ]


Start with a blank world and build it yourself.


[ Use Editor ]
[ Select Editor ]

or:

Found


[ preview ]


Begin with a ready-made world and make it your own.


[ Use Found ]
[ Select Found ]
Creating a World

The general creation flow is:

Choose Template
      ↓
Name World
      ↓
Create
      ↓
Save World
      ↓
Open Editor
      ↓
Build World
      ↓
Publish

Templates determine the starting experience.

For example:

Editor → /editor


Found → /found
Technology

CypherVerse is built around:

React
React Three Fiber
Three.js
Drei
cyengine
database-backed persistence
user authentication
Development

Install dependencies:

npm install

Start development:

npm run dev

The application will normally be available at:

http://localhost:3000

See the developer documentation for the application architecture, Cyengine patterns, database, authentication, and development conventions.

Development Guide

Related Projects
cyengine

The standardized 3D Web runtime used by CypherVerse.

https://www.npmjs.com/package/cyengine

CypherVerse

https://cypherverse.space

GitHub

https://github.com/CypherVerseLabs

Discord

https://discord.gg/CrbfwhVVq

Philosophy

The Web made it possible for anyone to publish a page.

CypherVerse is building toward a Web where anyone can publish a world.

Components
     ↓
Data
     ↓
Composition
     ↓
Interaction
     ↓
World
     ↓
Publishing

CypherVerse provides the platform.

cyengine provides the reality.

Creators provide the worlds.



---


# `docs/DEVELOPMENT.md`


```md
# CypherVerse Development Guide


Developer documentation for the CypherVerse application.


---


# Overview


CypherVerse is the application layer built around `cyengine`.


The distinction between the two projects is important.


```text
CypherVerse
    │
    ├── Accounts
    ├── Database
    ├── Worlds
    ├── Templates
    ├── Editor
    └── Publishing
             │
             ▼
          cyengine
             │
             ├── Reality
             ├── Player
             ├── Environment
             ├── Ideas
             ├── UI
             └── Interaction

CypherVerse handles the platform.

cyengine handles the 3D runtime.

Development Principles

CypherVerse follows the same development philosophy as cyengine.

Compose small components

Prefer:

<group>
  <Image />
  <Title />
  <Text />
  <Button />
</group>

over large components containing unrelated functionality.

Keep data separate from presentation

Templates should be represented as data.

type Template = {
  id: "editor" | "found";
  name: string;
  description: string;
  route: string;
  previewImage: string;
};

Then the UI renders that data.

const template = TEMPLATES[index];
Keep platform logic outside 3D primitives

Authentication, database operations, and world persistence belong to the application layer.

3D components should primarily handle:

presentation
scene composition
interaction
visual state
Project Structure

The project should separate platform functionality from 3D Ideas.

A typical structure:

src/
│
├── app/
│   ├── editor/
│   ├── found/
│   └── ...
│
├── ideas/
│   ├── Title.tsx
│   ├── Text.tsx
│   ├── TemplateSelector.tsx
│   └── ...
│
├── components/
│   └── ...
│
├── database/
│   └── ...
│
├── auth/
│   └── ...
│
└── ...

The exact structure can evolve.

The important architectural separation is:

Platform
   ↓
CypherVerse


3D runtime
   ↓
cyengine


Reusable 3D components
   ↓
Ideas
Cyengine

CypherVerse uses cyengine for the 3D runtime.

Import cyengine components directly:

import {
  StandardReality,
  LostWorld,
  Image,
  Model,
  Button,
  TextInput,
} from "cyengine";

A basic world:

export default function World() {
  return (
    <StandardReality>
      <LostWorld />
    </StandardReality>
  );
}

Do not recreate functionality that already belongs to cyengine.

StandardReality

A normal CypherVerse 3D experience should use StandardReality.

<StandardReality>
  <LostWorld />
</StandardReality>

The reality provides the runtime environment for the world.

Ideas

Ideas are reusable 3D React components.

Examples:

src/ideas/


Title.tsx
Text.tsx
TemplateSelector.tsx

An Idea should generally have one clear responsibility.

For example:

<Title position={[1.5, 2.35, -1.55]}>
  {template.name}
</Title>
Title

A project-specific Title Idea can provide consistent typography.

Example:

<Title
  position={[1.5, 2.35, -1.55]}
>
  {template.name}
</Title>

Keep reusable presentation components simple.

Text

For text that does not need a project-specific component, Drei's Text can be used.

import { Text } from "@react-three/drei";

Example:

<Text
  color="white"
  fontSize={0.11}
  maxWidth={2}
  position={[1.5, 1.85, -1.55]}
  anchorX="center"
  anchorY="middle"
>
  {template.description}
</Text>
3D UI

CypherVerse uses cyengine's 3D UI components.

Common components include:

<Image />
<Button />
<TextInput />
<Arrow />
<Model />

Example:

<Button
  position={[0, -0.45, 0]}
  rotation={[0, Math.PI, 0]}
  onClick={useTemplate}
>
  {`Use ${template.name}`}
</Button>

Keep positioning concise and readable.

Prefer:

position={[0, -0.45, 0]}
rotation={[0, Math.PI, 0]}

instead of unnecessarily expanded arrays.

Images

Images use cyengine's Image component.

<Image
  src="https://example.com/image.png"
  size={1}
  framed
/>

For local application assets:

<Image
  src="/editor_preview.png"
  size={1}
  framed
/>

The asset must be publicly accessible to the browser.

Models

Models use cyengine's Model.

<Model
  src="./3dpanelmodel.glb"
  position={[0, 2, -1.5]}
  rotation={[0, Math.PI / 2, 0]}
/>

A model can be rotated using the standard Three.js Euler rotation array:

rotation={[x, y, z]}

For example:

rotation={[0, Math.PI / 2, 0]}

rotates the model 90 degrees around the Y axis.

Template System

Templates are data-driven.

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

The selector maintains the current template index:

const [index, setIndex] = useState(0);

The current template:

const template = TEMPLATES[index];
Cycling Templates

The template selector cycles through the available templates.

const nextTemplate = () => {
  setIndex(
    (current) =>
      (current + 1) % TEMPLATES.length
  );
};

The action button can therefore dynamically display:

{`Use ${template.name}`}

Result:

Use Editor

or:

Use Found
Selecting a Template

Selecting a template stores the currently displayed template.

const useTemplate = () => {
  setSelectedTemplate(template);
  setWorldName("");
  setCreated(false);
};

After selection, the UI moves into the naming stage.

Naming a World

World names are controlled through React state.

const [worldName, setWorldName] = useState("");

The input:

<TextInput
  placeholder="World name"
  value={worldName}
  onChange={setWorldName}
/>

The world should not be created until the name contains non-whitespace characters.

const createWorld = () => {
  const name = worldName.trim();


  if (!name) {
    return;
  }


  // Create world...
};
World Creation

The creation flow should eventually persist the world through the database.

Conceptually:

Template
    ↓
World Name
    ↓
Create
    ↓
Database
    ↓
World ID
    ↓
Editor

The world should belong to the authenticated user.

Authentication

Authentication provides the identity used by the application.

The expected flow is:

User
  ↓
Sign In
  ↓
Authenticated Session
  ↓
CypherVerse
  ↓
User's Worlds

Database operations involving worlds should use the authenticated user as the owner.

Do not trust a client-provided user ID when determining ownership.

Database

The database is the persistent source of truth for CypherVerse.

A conceptual relationship:

User
 │
 ├── World
 │    ├── template
 │    ├── name
 │    ├── scene
 │    └── published
 │
 ├── World
 │
 └── World

Database access should remain in the application/data layer.

Do not put database queries directly inside simple 3D presentation Ideas.

World Routes

Templates determine the starting route.

{
  id: "editor",
  route: "/editor",
}

and:

{
  id: "found",
  route: "/found",
}

The selected template can then determine where the creator goes.

const createWebsite = () => {
  if (!selectedTemplate) {
    return;
  }


  window.location.href =
    selectedTemplate.route;
};
Template Selector Pattern

The selector has three major states.

Selector
   │
   ├── Current Template
   │
   └── Selected Template
          │
          ├── Naming
          │
          └── Created
State 1 — Selector

Shows:

Editor


[ Preview ]


Description


[ Use Editor ]
[ Select Editor ]
State 2 — Naming

Shows:

What world are you dreaming of?


[ World name ]


[ Cancel ] [ Create ]
State 3 — Created

Shows:

[ Create Website ]
Positioning

Cyengine uses normal React Three Fiber / Three.js positioning.

Use concise arrays:

position={[0, -0.45, 0]}
rotation={[0, Math.PI, 0]}

Avoid unnecessarily verbose formatting such as:

position={[
  0,
  -0.45,
  0,
]}

unless the values need individual comments or the formatting genuinely improves readability.

3D Panel Pattern

A common CypherVerse UI pattern is a model acting as a physical panel with UI positioned in front of it.

<Model
  position={[0, 2, -1.5]}
  rotation={[0, Math.PI / 2, 0]}
  src="./3dpanelmodel.glb"
/>

Then place the content slightly in front:

<Image
  src={template.previewImage}
  size={1}
  position={[0, 2, -1.55]}
  rotation={[0, Math.PI, 0]}
  framed
/>

The important idea is that the panel is part of the 3D scene rather than a traditional HTML container.

Public Assets

Static assets can be placed in:

public/

For example:

public/
├── editor_preview.png
├── found_preview.png
└── ...

They can then be referenced by their public URL:

<Image
  src="/editor_preview.png"
/>
Development Workflow

When adding a new feature:

1. Identify whether it belongs to CypherVerse or cyengine.
2. Keep persistent data in the application/database layer.
3. Keep 3D presentation in Ideas/components.
4. Reuse cyengine components where possible.
5. Keep state localized.
6. Keep components small.
7. Test the complete user flow.
Adding a New Template

Add the template to the data definition:

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

The selector automatically uses:

template.name
template.description
template.route
template.previewImage

This keeps the selector generic.

Local Development

Install:

npm install

Run:

npm run dev

Build:

npm run build

Run production:

npm run start
Environment Variables

Create:

.env.local

Add the environment variables required by the current application.

Never commit:

passwords
API secrets
database credentials
authentication secrets
private keys

Example:

DATABASE_URL=...


NEXT_PUBLIC_...
...

The exact variables depend on the services configured for the application.

Debugging

When debugging a 3D component, first isolate:

Position
Rotation
Scale

For example:

<Model
  position={[0, 2, -1.5]}
  rotation={[0, Math.PI / 2, 0]}
  scale={1}
/>

Then adjust one value at a time.

For UI positioning, keep the parent group stable and adjust the child.

<group position={[0, 0.8, 0]}>
  <Image
    position={[0, 2, -1.55]}
  />


  <Button
    position={[0, -0.45, 0]}
  />
</group>

This is generally easier to maintain than changing many unrelated world coordinates.

Important Separation

When working in CypherVerse, always ask:

Is this platform functionality?

Examples:

Authentication
Database
Accounts
World persistence
Publishing
Routing

That belongs to CypherVerse.

Is this 3D runtime functionality?

Examples:

Player
Reality
Physics
Images
Models
Buttons
Interaction
3D UI

That belongs to cyengine.

Is this reusable 3D application presentation?

Examples:

Title
TemplateSelector
WorldCard
WorldPreview
CreatorMenu

That belongs in CypherVerse Ideas/components.

Philosophy

CypherVerse is built on the idea that the 3D Web should be composable.

A world should be made from understandable pieces:

Reality
  │
  ├── Environment
  │
  ├── Player
  │
  ├── World
  │    │
  │    ├── Model
  │    ├── Image
  │    ├── Text
  │    ├── Video
  │    └── Interaction
  │
  └── UI

The application provides the creator and persistence layer.

cyengine provides the runtime.

React provides composition.

Three.js provides the underlying 3D system.

Related Documentation
CypherVerse: https://cypherverse.space
cyengine: https://www.npmjs.com/package/cyengine
CypherVerse GitHub: https://github.com/CypherVerseLabs
Discord: https://discord.gg/CrbfwhVVq


So your repository would now have:


```text
cypherverse/
│
├── README.md
│
├── docs/
│   └── DEVELOPMENT.md
│
├── public/
│   ├── editor_preview.png
│   ├── found_preview.png
│   └── ...
│
├── src/
│   ├── ideas/
│   │   ├── Title.tsx
│   │   ├── Text.tsx
│   │   └── TemplateSelector.tsx
│   │
│   ├── auth/
│   ├── database/
│   └── ...
│
└── package.json

This gives you a public-facing README that isn't overwhelmingly long, while DEVELOPMENT.md becomes the place where developers learn the actual CypherVerse + cyengine pattern.