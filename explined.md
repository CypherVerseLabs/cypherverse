What CypherVerse actually is

At its core, CypherVerse is a platform for creating and publishing 3D websites/worlds, rather than simply being a 3D game or a 3D editor.

The important distinction is:

CypherVerse
    │
    ├── Accounts / Authentication
    │
    ├── Website / Project Management
    │
    ├── Templates / Ideas
    │
    ├── 3D Editor
    │
    ├── Publishing
    │
    └── Public Websites / Worlds
             │
             ▼
          cyengine
             │
             ▼
       Three.js / R3F

So CypherVerse is the platform layer, while cyengine is the runtime that actually renders and operates the 3D world.
1. Accounts and authentication

You already have a fairly substantial authentication system.

The server supports:

    Wallet authentication
    Email login
    Email signup
    JWT authentication
    Refresh-token handling
    Current-user lookup
    Profile updates
    Logout
    Authenticated API requests

Your project ownership is also tied to the authenticated user.

That's important because your project API doesn't trust something like:

ownerId: req.body.ownerId

Instead, it uses:

req.user.id

So the architecture is essentially:

User logs in
    ↓
JWT
    ↓
authenticateToken
    ↓
req.user
    ↓
Project ownership

That gives you a proper foundation for multiple creators having their own websites.
2. Projects are the central data object

One of the biggest things your README could explain better is that a website/world is represented as a project.

Your API has:

/api/projects

with:

GET     /api/projects
POST    /api/projects
GET     /api/projects/:id
PATCH   /api/projects/:id
DELETE  /api/projects/:id
POST    /api/projects/:id/publish

That means the platform already has a proper CRUD lifecycle:

Create
  ↓
Read
  ↓
Edit
  ↓
Publish
  ↓
Manage
  ↓
Delete

A project can contain things like:

id
name
description
template
slug
scene
owner
published data
assets

So this isn't just storing a temporary editor state in React.

The project becomes persistent application data.
3. Templates are actually "starting worlds"

You currently have two catalogued ideas:

const IDEA_IDS = [
  "editor",
  "found",
] as const;

Those correspond to:
Editor

A blank starting point.

Editor
  ↓
Empty/starting world
  ↓
Creator builds it

Found

A pre-built starting world.

Your found/idea.json contains an actual scene.

It has:

    cloudy sky
    rain
    ground
    title
    CypherVerse logo
    multiplayer link
    Decentral Station link
    workshop link
    speaker/audio

So Found isn't merely a name in the UI.

It's an actual scene template.
4. Your idea system is becoming a template catalog

This part of the README is a little behind the code.

You have an idea loader that reads:

ideas/
    editor/
        idea.json

    found/
        idea.json

And the server validates each idea.

Each idea needs:

id
name
description
route
previewImage
scene

So you're building toward a system like:

Template Selector
       │
       ├── Editor
       │
       ├── Found
       │
       ├── Portfolio
       │
       ├── Business
       │
       ├── Game
       │
       └── Blog

Your own comment in the code already anticipates this.

That's a significant architectural direction for CypherVerse.
5. Website creation

Your intended creation flow is:

Create a Website
        ↓
Template Selector
        ↓
Choose template
        ↓
Name website
        ↓
Create project
        ↓
Open editor
        ↓
Build
        ↓
Save
        ↓
Publish

The backend already supports the template value:

template === "editor"

or:

template === "found"

So the selected template isn't just a frontend visual choice.

It becomes part of the project creation data.
6. Website management

This is another area we've recently changed.

The account dialogue contains:

Create a Website
Manage My Websites
Logout

The important thing we corrected is that the dialogue buttons don't directly perform navigation.

Instead:

Create a Website
      ↓
visit_template_selector
      ↓
"Go visit the Template Selector."
      ↓
Continue
      ↓
menu

And:

Manage My Websites
      ↓
manage_websites
      ↓
"Visit the Website Manager."
      ↓
Continue
      ↓
menu

That was intentional.

The dialogue is acting as a conversation/state layer, not as the router itself.

So manage_websites isn't supposed to secretly navigate somewhere.

The actual website manager can be opened by the appropriate application/UI layer.

That's a good separation.
7. ManageSite has a specific architectural role

Your README says:

DialogueFSM
    ↓
manage_websites
    ↓
ManageSite
    ↓
Existing Project Data

That is an important design decision.

You don't want:

Dialogue
    ↓
new project API

and then:

ManageSite
    ↓
another project API

Instead, there should be one project data system.

Conceptually:

                 Project API
                     │
          ┌──────────┴──────────┐
          │                     │
     Create Website        Manage Websites
          │                     │
    Template Selector       ManageSite
          │                     │
          └──────────┬──────────┘
                     ↓
                 Projects

That avoids two competing sources of truth.
8. Slugs / website URLs

This is something your README is missing.

You have added project URL/slug support.

The PATCH route accepts:

slug

and normalizes it.

For example:

My Cool World

would need to become something like:

my-cool-world

You restrict the value to:

letters
numbers
hyphens

and limit it to 60 characters.

You also handle Prisma's unique constraint.

If somebody tries to use an existing project URL, you now return:

409
That project URL is already in use

rather than allowing it to become an unexplained server error.

This is directly related to the idea of giving creators their own publishable website URLs.
9. Publishing is much more than "save"

This is probably the biggest technical feature that the README undersells.

You have:

POST /api/projects/:id/publish

The publish request can contain:

scene
assetManifest
asset files

The server then:

    Authenticates the user.
    Gets the project ID.
    Verifies project ownership.
    Parses the scene.
    Validates the scene.
    Parses the asset manifest.
    Finds uploaded assets.
    Uploads assets to R2.
    Creates storage keys.
    Rewrites scene references.
    Saves the published project state.
    Returns the published project.

So publishing is essentially:

Editor
   │
   │ scene + assets
   ▼
Publish API
   │
   ├── Validate
   │
   ├── Upload assets → R2
   │
   ├── Rewrite asset URLs
   │
   └── Save published state
           │
           ▼
      Public Project

That's a real publishing pipeline.
10. Asset storage

You're also using R2 for project assets.

The server generates storage keys like:

projects/<projectId>/assets/<uuid>-<filename>

That gives assets a project-specific namespace.

You also sanitize uploaded filenames:

sanitizeStorageName()

so unsafe filename characters aren't blindly placed into storage paths.

This is another piece I'd add to the README.
11. Scene data is JSON

Your worlds are represented as scene data.

For example, the Found scene contains:

{
  "objects": [
    {
      "id": "sky-1",
      "type": "cloudySky",
      "transform": {},
      "props": {}
    }
  ]
}

That means your 3D world is fundamentally data-driven.

You aren't hardcoding every world directly into React components.

Instead:

Scene JSON
    ↓
Objects
    ↓
Types
    ↓
Transforms
    ↓
Props
    ↓
cyengine
    ↓
3D World

That's a very important part of the architecture.
12. cyengine is the runtime

The README gets this part right.

CypherVerse isn't trying to reinvent the entire 3D runtime.

It uses cyengine for the underlying 3D experience.

Conceptually:

CypherVerse
    = platform

cyengine
    = runtime

Three.js
    = 3D rendering foundation

So when a project contains:

{
  "type": "model"
}

or:

{
  "type": "rain"
}

or:

{
  "type": "speaker"
}

the runtime is responsible for understanding those objects and creating the actual experience.
13. The public side is important

You also have:

import publicProjectRouter
  from "./routes/public/projects.js";

and:

app.use(
  "/api/public/projects",
  publicProjectRouter
);

This tells me your architecture isn't only:

Creator → private editor

It's also moving toward:

Creator
   ↓
Create project
   ↓
Build
   ↓
Publish
   ↓
Public project
   ↓
Visitor experiences world

That's a core part of the CypherVerse concept.
14. The security model

There's actually a pretty clear security boundary developing.
Private creator APIs

/api/projects

require:

authenticateToken

and ownership is checked.
Public projects

/api/public/projects

are separated from the authenticated project API.

That's good because public visitors shouldn't need creator authentication merely to experience a published world.
15. Validation and limits

Your backend isn't simply accepting arbitrary data.

You have limits for:
Project name

200 characters

Description

5000 characters

Scene

10 MB

Publish upload

100 files
20 MB per file

Multipart field

12 MB

JSON request body

12 MB

And you return appropriate errors such as:

400 Bad Request
401 Unauthorized
404 Not Found
409 Conflict
413 Payload Too Large
500 Internal Server Error

That's worth documenting because it shows the backend isn't just a prototype endpoint with no validation.
16. The overall architecture

Putting everything you've shown me together, I would describe the project like this:

                         CYPHERVERSE
                              │
             ┌────────────────┼────────────────┐
             │                │                │
          Accounts         Projects         Templates
             │                │                │
             │                │                ├── Editor
             │                │                └── Found
             │                │
             │                ├── Scene
             │                ├── Assets
             │                ├── Slug
             │                ├── Ownership
             │                └── Publishing
             │
             ▼
        Authentication
             │
             ▼
        Protected API
             │
             ▼
       Database / Storage
             │
             ├───────────────┐
             │               │
          Projects           R2
             │               │
             └───────┬───────┘
                     ▼
                  Publish
                     │
                     ▼
              Public Project
                     │
                     ▼
                 cyengine
                     │
                     ▼
            React Three Fiber
                     │
                     ▼
                  Three.js
                     │
                     ▼
                3D WORLD

What your README is currently missing

I would add these things to it:

    Project CRUD/API
    Project ownership model
    Project slugs / custom URLs
    Publishing pipeline
    R2 asset storage
    Public project API
    Scene JSON architecture
    Asset manifest system
    Validation/size limits
    Wallet + email authentication
    The distinction between Ideas/Templates and Projects
    The fact that cyengine renders the stored scene data
    The fact that dialogue state and application routing are intentionally separate

One especially important clarification would be:

    An Idea/Template is a starting configuration. A Project is the creator-owned instance created from that starting configuration.

For example:

Found Idea
   ↓
Creator chooses Found
   ↓
New Project
   ↓
Project starts with Found scene
   ↓
Creator modifies it
   ↓
Project becomes their own world

That's a very important distinction in your architecture.
In one sentence

CypherVerse is becoming a creator platform where authenticated users can choose a 3D template, create a persistent project, edit its data-driven world, manage it through a project system, publish its scene and assets, and ultimately expose that world to visitors through cyengine.