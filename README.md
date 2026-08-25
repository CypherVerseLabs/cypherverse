````md
<br/>

<p align="center">
  <img
    width="500"
    src="https://lbemedia.net/images/android-chrome-192x192.ico"
    alt="CypherVerse logo"
  />
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

---

# CypherVerse

CypherVerse is a platform for creating, managing, and experiencing interactive 3D worlds on the Web.

It combines:

- user accounts
- persistent worlds
- website templates
- database-backed projects
- a 3D editor
- publishing
- the `cyengine` runtime

into one platform for creating 3D experiences.

The goal is simple:

> Make creating and publishing a 3D website as accessible as creating a traditional website.

---

# What CypherVerse Provides

## Accounts

Creators can have persistent accounts and identity.

Authentication supports the platform's creator experience and determines ownership of created websites and worlds.

## Websites & Worlds

Creators can create and manage their own websites and 3D worlds.

Created projects are persisted so they can be accessed again rather than existing only during a single browser session.

## Templates

Creators can begin with different starting experiences.

Current templates include:

### Editor

Start with a blank world and build it yourself.

### Found

Begin with a ready-made world and make it your own.

The template selector already exists as part of the starter experience.

## Website Management

Authenticated creators can access:

**Manage My Websites**

The management flow is handled through the dialogue system and connects to the existing project data.

The architecture is intentionally separated:

```text
DialogueFSM
    ↓
manage_websites
    ↓
ManageSite
    ↓
Existing Project Data
    ↓
Website / World Management
````

`ManageSite` does not create another template selector or another independent project data source.

## Database

World and account data can persist beyond a single browser session.

Projects can contain information such as:

* name
* template
* scene
* ownership
* publishing state

## 3D Editor

Creators can build and modify interactive 3D experiences.

## cyengine

CypherVerse uses `cyengine` as its 3D runtime.

`cyengine` provides the underlying reality, player, environment, models, UI, and interaction systems.

---

# Architecture

```text
                         CypherVerse
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
       Accounts            Websites            Templates
          │                   │                   │
          └───────────────────┼───────────────────┘
                              │
                           Database
                              │
                    Website / World Data
                              │
                         3D Editor
                              │
                           cyengine
                              │
                    React Three Fiber
                              │
                          Three.js
```

CypherVerse is the application and platform.

`cyengine` is the 3D runtime.

---

# Website Creation

The general creation flow is:

```text
Choose Template
      ↓
Name Website
      ↓
Create
      ↓
Save
      ↓
Open Editor
      ↓
Build
      ↓
Publish
```

Templates determine the initial experience.

For example:

```text
Editor → /editor

Found → /found
```

---

# Website Management

After authentication, creators can access their projects through the account dialogue.

```text
Account Dialogue
      ↓
Manage My Websites
      ↓
manage_websites
      ↓
ManageSite
      ↓
Existing Projects
```

The project data remains owned by the application's existing project/data layer.

This prevents duplicate API calls and duplicate project-management systems.

---

# Technology

CypherVerse is built around:

* React
* React Three Fiber
* Three.js
* Drei
* cyengine
* database-backed persistence
* user authentication
* 3D scene composition
* project/world management

See:

* `docs/TECHNOLOGY.md`
* `docs/DEVELOPMENT.md`

for the technical and developer documentation.

---

# Development

Install dependencies:

```bash
npm install
```

Start development:

```bash
npm run dev
```

The application will normally be available at:

```text
http://localhost:3000
```

Build:

```bash
npm run build
```

Start the production application:

```bash
npm run start
```

---

# Project Structure

A simplified structure:

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
│   ├── TemplateSelector.tsx
│   ├── ManageSite.tsx
│   ├── WorldCard.tsx
│   ├── Title.tsx
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
```

The exact structure can evolve.

The important separation is:

```text
CypherVerse
    ↓
Platform
    ↓
Accounts / Database / Websites / Editor / Publishing
    ↓
Ideas / Components
    ↓
cyengine
    ↓
3D Runtime
```

---

# Related Projects

## cyengine

The standardized 3D Web runtime used by CypherVerse.

https://www.npmjs.com/package/cyengine

## CypherVerse

https://cypherverse.space

## GitHub

https://github.com/CypherVerseLabs

## Discord

https://discord.gg/CrbfwhVVq

---

# Philosophy

The Web made it possible for anyone to publish a page.

CypherVerse is building toward a Web where anyone can publish a world.

```text
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
```

CypherVerse provides the platform.

`cyengine` provides the reality.

Creators provide the worlds.

```
```
