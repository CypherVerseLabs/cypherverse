<br/> <p align="center"> <img width="500" src="https://lbemedia.net/images/android-chrome-192x192.ico" alt="CypherVerse logo" /> </p> <h3 align="center"> CypherVerse </h3> <h5 align="center"> A platform for building, creating, managing, publishing, and experiencing the 3D Web. </h5> <div align="center">




</div> <p align="center"> <a href="https://cypherverse.space">www.cypherverse.space</a> · <a href="https://github.com/CypherVerseLabs">github</a> · <a href="https://discord.gg/CrbfwhVVq">discord</a> </p> <br/>
CypherVerse

CypherVerse is a platform for creating, managing, publishing, and experiencing interactive 3D worlds on the Web.

It combines:

user accounts and authentication
persistent projects
website templates
database-backed project ownership
a 3D editor
scene persistence
asset uploading
publishing
public project experiences
website management
the cyengine runtime

into one platform for creating 3D experiences.

The goal is simple:

Make creating and publishing a 3D website as accessible as creating a traditional website.

What CypherVerse Provides
Accounts & Authentication

Creators can have persistent accounts and identity.

Authentication supports both:

wallet-based login
email/password authentication

Authenticated users receive ownership of the projects they create.

Project ownership is determined server-side from the authenticated user rather than from client-supplied ownership information.

This prevents one user from simply submitting another user's ID when accessing project data.

Websites & Worlds

CypherVerse treats websites and interactive worlds as persistent projects.

Projects are stored in the database and can contain information such as:

project ID
project name
description
owner
template
scene data
URL slug
publishing state
uploaded assets
timestamps

Projects can be:

created
loaded
updated
deleted
published
managed by their authenticated owner

The project system is backed by the application's existing project store and database layer.

Templates

Creators can begin with different starting experiences.

Current templates include:

Editor

Start with a blank world and build it yourself.

/editor

Found

Begin with a ready-made world and make it your own.

/found


The Found template is currently represented by an idea definition containing its initial scene.

For example, the Found world can contain:

a sky
rain
ground
title text
3D models
links to other experiences
audio

Template data is stored separately from user-created projects so templates can act as starting points rather than becoming a second project-management system.

Template System

Templates are represented by server-side idea definitions.

An idea contains:

id
name
description
route
previewImage
scene


The current server-side catalog includes:

editor
found


The idea loader reads the corresponding:

ideas/<id>/idea.json


file and validates the required fields before returning it.

This keeps template definitions centralized and prevents arbitrary template IDs from being loaded from the filesystem.

Website Creation

The general creation flow is:

Choose Template
      ↓
Name Website
      ↓
Create Project
      ↓
Persist Project
      ↓
Open Editor
      ↓
Build
      ↓
Save
      ↓
Publish


A project can be created with a supported template:

editor
found


The project API validates the template before creating the project.

Project names and descriptions are also validated and size-limited by the server.

Website Management

Authenticated creators can access their existing projects through the account dialogue.

The dialogue flow currently works like this:

Account Menu
      ↓
Manage My Websites
      ↓
manage_websites
      ↓
"Visit the Website Manager."
      ↓
Continue
      ↓
Back to Menu


The dialogue button itself does not perform application routing.

The same applies to the template-selector dialogue:

Create a Website
      ↓
visit_template_selector
      ↓
"Go visit the Template Selector."
      ↓
Continue
      ↓
Back to Menu


The dialogue system provides the conversational UI state.

Actual application navigation is handled separately by the application components.

This separation prevents dialogue buttons from unexpectedly becoming navigation controls.

Project API

Authenticated projects are exposed through:

/api/projects


The project API currently provides:

GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PATCH  /api/projects/:id
DELETE /api/projects/:id
POST   /api/projects/:id/publish


All authenticated project routes require the authentication middleware.

Project Ownership

Project ownership is always determined from the authenticated request.

Conceptually:

JWT
 ↓
authenticateToken
 ↓
req.user.id
 ↓
Project Store
 ↓
Owned Project


The client does not get to choose the ownerId used by project operations.

This applies to:

creating projects
listing projects
loading projectsc
updating projects
deleting projects
publishing projects
Project Creation

A project can be created using:

POST /api/projects


The server validates:

authentication
project name
project description
template

Project names are limited to 200 characters.

Project descriptions are limited to 5000 characters.

Supported templates are:

editor
found


The authenticated user's ID becomes the project's owner.

Project Updates

Projects can be updated using:

PATCH /api/projects/:id


Supported fields include:

name
description
scene
slug


Project names and descriptions are validated before being stored.

Scene data is serialized and checked against a 10 MB size limit.

Project URLs

Projects can have a URL slug.

Slugs are normalized by:

trimming whitespace
converting to lowercase
removing leading/trailing slashes

Valid characters are:

a-z
0-9
-


A slug can contain multiple words separated by hyphens.

The maximum slug length is 60 characters.

For example:

my-world
my-first-website
cypherverse-world


The database enforces slug uniqueness.

If a requested slug is already being used, the API returns:

409 Conflict


with:

That project URL is already in use

Publishing

Publishing is handled through:

POST /api/projects/:id/publish


The publish request uses multipart form data.

The request can contain:

scene
assetManifest
asset-<assetId>


The server:

authenticates the user
verifies project ownership
validates the scene
validates the asset manifest
receives uploaded assets
uploads assets to R2
generates storage keys
rewrites scene asset references
stores the published project state
returns the published project
Scene Publishing

Scenes must contain an object collection.

The publish route validates that the scene contains:

objects


and that it is an array.

Scene JSON is limited to 10 MB.

This prevents unexpectedly large project scenes from being persisted.

Asset Publishing

Published assets are uploaded using the project's asset namespace.

Storage keys follow the general structure:

projects/<projectId>/assets/<generated-id>-<filename>


Uploaded filenames are sanitized before being used in storage keys.

The server records information such as:

original filename
storage key
MIME type
file size

The published scene's original asset references are then replaced with the resulting public asset URLs.

Conceptually:

Editor Asset
     ↓
assetManifest
     ↓
Upload
     ↓
R2
     ↓
Public URL
     ↓
Rewrite Scene
     ↓
Published Project

Cloud Asset Storage

Project publishing uses the application's R2 storage integration.

Assets are uploaded through the server rather than directly trusting arbitrary client-provided public URLs.

This allows the server to control:

storage paths
asset ownership
filenames
MIME information
published scene references
Public Projects

CypherVerse also contains a separate public project route layer.

The server mounts:

/api/public/projects


This is separate from authenticated project management.

The distinction is intentional:

Authenticated Project API
        ↓
Private project management
        ↓
Ownership required


Public Project API
        ↓
Published project access
        ↓
Public experience


This allows a project to have a private editing/management lifecycle while still becoming publicly accessible after publishing.

3D Editor

Creators can build and modify interactive 3D experiences.

The editor works with scene data that can contain objects, transforms, properties, models, links, environments, audio, and other interactive elements.

A scene is fundamentally data describing a world.

For example:

Scene
 ├── Objects
 │    ├── Transform
 │    ├── Type
 │    └── Props
 │
 ├── Models
 ├── Environment
 ├── Audio
 ├── Links
 └── Interactive Content


The scene can be persisted as part of a project and later loaded back into the editor or published experience.

cyengine

CypherVerse uses cyengine as its 3D runtime.

cyengine provides the underlying runtime systems for the 3D Web experience, including things such as:

worlds
players
environments
models
UI
interaction
scene composition

CypherVerse is the platform surrounding the runtime.

CypherVerse
     ↓
Accounts
     ↓
Projects
     ↓
Templates
     ↓
Editor
     ↓
Publishing
     ↓
cyengine
     ↓
3D Experience

Architecture
                         CypherVerse
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
       Accounts            Projects           Templates
          │                   │                   │
          │                   ↓                   │
          │              Project Store            │
          │                   │                   │
          └───────────────────┼───────────────────┘
                              │
                         Database
                              │
                    Website / World Data
                              │
                         3D Editor
                              │
                         Publishing
                              │
                         R2 Assets
                              │
                           cyengine
                              │
                    React Three Fiber
                              │
                          Three.js


The application is intentionally separated into platform, data, editor, publishing, and runtime responsibilities.

Backend Architecture

The backend is an Express application.

Major backend responsibilities include:

Express
 ├── Authentication
 ├── User Profiles
 ├── Projects
 ├── Public Projects
 ├── Ideas / Templates
 ├── AI
 └── Publishing


Important project-related modules include:

routes/auth/projects.ts
stores/projectStore.ts
routes/public/projects.ts
routes/ideas.ts


The project route layer is responsible for HTTP/API validation and authentication.

The project store is responsible for interacting with persistent project data.

The idea system is responsible for loading predefined template/world definitions.

API Security

Authenticated API routes use:

authenticateToken


The backend does not rely on the browser to identify the project owner.

Instead:

Authenticated Token
        ↓
Authenticated User
        ↓
req.user.id
        ↓
Project Ownership


Project access is therefore scoped to the authenticated user.

Validation & Limits

The backend intentionally validates incoming project data.

Current limits include:

Data	Limit
Project name	200 characters
Project description	5000 characters
Project URL slug	60 characters
Scene	10 MB
JSON request body	12 MB
Published asset count	100
Published asset size	20 MB
Multipart field size	12 MB

These limits help prevent accidental or uncontrolled resource usage.

Authentication Routes

The backend includes authentication endpoints for:

POST /auth/nonce
POST /auth/verify
POST /auth/refresh
GET  /auth/me
POST /auth/profile
POST /auth/logout


Email authentication is also mounted through the API authentication layer.

Wallet authentication and email authentication are both part of the creator account system.

Development

Install dependencies:

npm install


Start development:

npm run dev


The application will normally be available at:

http://localhost:3000


Build:

npm run build


Start the production application:

npm run start

Start the production server:

cd/server

Prisma (your database/ORM)

cd server  
yarn server

yarn prisma studio

http://localhost:51212

The backend runs independently according to the project's server configuration.

Project Structure

A simplified structure:

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

server/
│
├── index.ts
│
├── routes/
│   ├── auth/
│   │   ├── projects.ts
│   │   ├── nonce.ts
│   │   ├── verify.ts
│   │   ├── refresh.ts
│   │   └── emailAuth.ts
│   │
│   ├── public/
│   │   └── projects.ts
│   │
│   ├── ideas.ts
│   └── ...
│
├── stores/
│   ├── projectStore.ts
│   ├── userStore.ts
│   └── ...
│
├── middleware/
│   └── authMiddleware.ts
│
└── lib/
    └── r2.ts

ideas/
│
├── editor/
│   └── idea.json
│
└── found/
    └── idea.json


The exact structure can evolve.

The important architectural separation is:

CypherVerse
    ↓
Platform
    ↓
Accounts / Projects / Database / Templates
    ↓
Editor / Management / Publishing
    ↓
Asset Storage
    ↓
cyengine
    ↓
3D Runtime

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
Persistence
    ↓
Publishing
    ↓
Experience


CypherVerse provides the platform.

The project system provides persistence and ownership.

The template system provides starting worlds.

The editor provides creation tools.

The publishing system turns project data and assets into a public experience.

cyengine provides the reality.

Creators provide the worlds.