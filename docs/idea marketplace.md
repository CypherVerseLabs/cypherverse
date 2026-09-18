Yes. You can use essentially the same architecture for your Worlds/Ideas and individual components. In fact, your current parcel marketplace structure gives you a good foundation for it.

The important distinction is:

Parcels = physical land in the CypherVerse.
World Ideas/Templates = complete premade scenes users can buy/use.
Components = individual reusable objects such as link, model, speaker, rain, ground, etc.
JSON = the source definition of the world/component, but the database should become the authoritative catalog once you make them marketplace items.
Your current JSON is already very close
For example, this:

{
  "id": "editor",
  "name": "Editor",
  "description": "Begin with a ready-made world and make it your own.",
  "route": "/editor",
  "previewImage": "/editor_preview.png",
  "scene": {
    "objects": [
      {
        "id": "link-2",
        "type": "link",
        "transform": {
          "position": [-1, 0.8, 0],
          "rotation": [0, 0, 0],
          "scale": [1, 1, 1]
        },
        "props": {
          "href": "/decentral_station",
          "text": "Decentral Station"
        }
      }
    ]
  }
}

could become a database record like:

WorldTemplate
-----------------------------
id
name
description
price
status
previewImage
scene
ownerId
createdAt
updatedAt

where scene remains a Prisma Json field.

Then your component marketplace could have something like:

ComponentTemplate
-----------------------------
id
name
description
type
price
status
previewImage
defaultProps
createdAt
updatedAt

And the actual scene would still contain:

{
  "type": "link",
  "transform": {
    "position": [-1, 0.8, 0],
    "rotation": [0, 0, 0],
    "scale": [1, 1, 1]
  },
  "props": {
    "href": "/decentral_station",
    "text": "Decentral Station"
  }
}

And yes, the user could "buy" a world
The flow could be:

Marketplace
     ↓
World Idea
     ↓
Purchase
     ↓
MarketplaceOrder
     ↓
MarketplacePayment
     ↓
MarketplaceEntitlement
     ↓
User owns World Idea
     ↓
"Use in Editor"
     ↓
Copy scene into user's project

That's very similar to what we're building for parcels.

The key difference is ownership doesn't mean the user's copy is the marketplace master record.

For example:

WorldTemplate
    "Cyberpunk City"
          │
          │ purchased
          ↓
MarketplaceEntitlement
          │
          ↓
User
          │
          ↓
Project
    user's editable copy

That is a very good model for your editor.

Components can work the same way
Imagine your marketplace eventually has:

World Ideas

- Cyberpunk City
- Medieval Village
- Space Station
- Tropical Island

and:

Components

- Teleport Link
- 3D Model
- Speaker
- Rain
- Cloudy Sky
- Ground
- Portal
- Billboard
- Light
- Particle Effect

A user could purchase a component and then see:

My Assets

Worlds
  ✓ Cyberpunk City

Components
  ✓ Portal
  ✓ Speaker
  ✓ Neon Sign
  ✓ Teleporter

Then the editor can allow them to drag/use those assets.

One thing I would NOT do
I wouldn't create a separate database column for every possible component property.

Don't turn this:

{
  "type": "link",
  "props": {
    "href": "/decentral_station",
    "text": "Decentral Station"
  }
}

into:

href
text
color
size
positionX
positionY
...

for every component.

Your existing JSON scene format is actually useful.

Keep flexible data as JSON:

scene Json?

and:

defaultProps Json?

That lets you add new component types without redesigning the database every time.

The architecture I'd recommend
Eventually you could have:

                    MARKETPLACE
                         │
          ┌──────────────┼──────────────┐
          ↓              ↓              ↓
       PARCELS        WORLDS       COMPONENTS
          │              │              │
          ↓              ↓              ↓
       Parcel        WorldTemplate   ComponentTemplate
          │              │              │
          └──────────────┼──────────────┘
                         ↓
                 MarketplaceOrder
                         ↓
                 MarketplacePayment
                         ↓
                MarketplaceEntitlement
                         ↓
                        USER
                         ↓
                      PROJECT
                         ↓
                       SCENE

And your existing payment/order/idempotency system can eventually serve all three categories rather than building a completely separate payment system for worlds and components.

That's one of the biggest advantages of what you're doing now.

Your 22,500 parcels are different
Your v1parcel_data.json is essentially world/land source data.

Those 22,500 records represent the actual map:

estate_id
x
y
type
owner
name
...

You are importing those into Parcel.

Your world ideas/components are different kinds of catalog data.

So I'd keep them conceptually separate:

Parcel
    ↓
actual land in CypherVerse

WorldTemplate
    ↓
premade world/scene

ComponentTemplate
    ↓
reusable editor asset

Then marketplace purchasing can connect to all of them.

So yes — what you're doing with parcels can absolutely become the foundation for a much larger CypherVerse marketplace. And because your scene is already JSON-based, you're actually in a good position to do this without having to redesign the editor around the database.


---------------------------------------------------------------------------

Yes. I would build it in stages, and I would not touch your working parcel import/payment flow yet.

1. Keep your existing parcel system
Your current structure stays:

v1parcel_data.json
        ↓
     Prisma
        ↓
      Parcel
        ↓
 Parcel marketplace

Your 22,500 parcels are the actual land grid.

The ParcelListing table is for secondary sales—someone who owns a parcel lists it.

But you told me you also want to create new parcels for sale. That's a separate concept we'll handle later.

2. Add a WorldTemplate table
Your editor JSON becomes a database record.

For example:

enum MarketplaceProductStatus {
  DRAFT
  PUBLISHED
  SOLD_OUT
  ARCHIVED
}

model WorldTemplate {
  id String @id @default(uuid())

  slug String @unique

  name String

  description String?

  previewImage String?

  scene Json

  price Decimal? @db.Decimal(12, 2)

  status MarketplaceProductStatus @default(DRAFT)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([status])
}

So your current:

{
  "id": "editor",
  "name": "Editor",
  "description": "...",
  "route": "/editor",
  "previewImage": "/editor_preview.png",
  "scene": {
    "objects": [...]
  }
}

could become:

WorldTemplate
--------------------------
id:       uuid
slug:     editor
name:     Editor
description: ...
previewImage: /editor_preview.png
scene:    { ...your JSON... }
price:    0.00
status:   PUBLISHED

The entire scene can stay JSON.

3. Add ComponentTemplate
Then make your individual reusable things marketplace assets.

For example:

model ComponentTemplate {
  id String @id @default(uuid())

  slug String @unique

  name String

  description String?

  type String

  previewImage String?

  defaultProps Json?

  price Decimal? @db.Decimal(12, 2)

  status MarketplaceProductStatus @default(DRAFT)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([type])
  @@index([status])
}

Your link becomes something like:

ComponentTemplate

slug:
teleport-link

name:
Teleport Link

type:
link

defaultProps:
{
  "href": "/decentral_station",
  "text": "Decentral Station"
}

price:
5.00

Your editor already knows how to render:

type = "link"

so the marketplace doesn't need to know how to render it.

That's important.

4. Your editor remains the renderer
This is the nice part.

You already have:

{
  "type": "link",
  "transform": {
    "position": [-1, 0.8, 0],
    "rotation": [0, 0, 0],
    "scale": [1, 1, 1]
  },
  "props": {
    "href": "/decentral_station",
    "text": "Decentral Station"
  }
}

The editor loads the scene and says:

type = link
       ↓
render Link component

For another object:

{
  "type": "model"
}

it says:

type = model
       ↓
render Model component

So the marketplace is basically selling data/configuration, while your existing engine handles the actual rendering.

5. Then connect purchases to your existing marketplace
You already have:

MarketplaceOrder
MarketplacePayment
MarketplacePaymentEvent
MarketplaceEntitlement
MarketplaceIdempotencyKey

That's good.

Instead of making a completely new payment system, I'd eventually make the order capable of referring to:

Parcel
WorldTemplate
ComponentTemplate

For example, conceptually:

MarketplaceOrder
       │
       ├── Parcel
       │
       ├── WorldTemplate
       │
       └── ComponentTemplate

Then:

BUY WORLD
   ↓
MarketplaceOrder
   ↓
MarketplacePayment
   ↓
MarketplaceEntitlement
   ↓
User owns WorldTemplate

Same payment infrastructure.

6. But there is one important change
Your current MarketplaceOrder has:

productId String

product Parcel

That means right now every marketplace product is assumed to be a Parcel.

We shouldn't simply stuff world IDs into productId.

Instead, I'd change the marketplace product architecture before adding real purchases for worlds/components.

Something along these lines:

enum MarketplaceProductType {
  PARCEL
  WORLD
  COMPONENT
}

and then design the product relationship properly.

I would do that after your parcel test flow is confirmed, because your current parcel purchase system is already working far enough to reach:

409 Conflict
no active listing

That error actually told us something useful: the purchase endpoint expects a real ParcelListing, not merely:

Parcel.status = for_sale

7. World ownership is slightly different from parcel ownership
Suppose you buy:

Cyberpunk City

You shouldn't modify the original marketplace record.

Instead:

WorldTemplate
    Cyberpunk City
          │
          │ purchase
          ↓
MarketplaceEntitlement
          │
          ↓
User
          │
          │ "Use World"
          ↓
Project
          │
          ↓
scene JSON

The user gets their own editable copy.

For example:

{
  "objects": [
    {
      "id": "sky-1",
      "type": "cloudySky"
    },
    {
      "id": "rain-1",
      "type": "rain"
    },
    {
      "id": "model-1",
      "type": "model"
    }
  ]
}

The original WorldTemplate.scene stays unchanged.

8. Components work similarly
Suppose the user buys:

Teleport Portal

Their editor can do:

Marketplace
     ↓
My Components
     ↓
Teleport Portal
     ↓
Add to Scene

The editor takes the component's defaultProps:

{
  "href": "/decentral_station",
  "text": "Decentral Station"
}

and creates a scene object:

{
  "id": "generated-object-id",
  "type": "link",
  "transform": {
    "position": [0, 0.8, 0],
    "rotation": [0, 0, 0],
    "scale": [1, 1, 1]
  },
  "props": {
    "href": "/decentral_station",
    "text": "Decentral Station"
  }
}

Now the user can edit it.

9. Your data would eventually look like this
server/data/
│
├── v1parcel_data.json
│
├── worlds/
│   ├── editor.json
│   ├── cyberpunk.json
│   └── space_station.json
│
└── components/
    ├── teleport-link.json
    ├── speaker.json
    ├── rain.json
    └── billboard.json

Then seed them:

JSON
 ↓
Prisma seed
 ↓
WorldTemplate / ComponentTemplate

Just like you're currently doing:

v1parcel_data.json
 ↓
22500 Parcel records

10. And this is where it gets powerful
Eventually your marketplace can show:

Land
East District
1,000 CV
BUY

Worlds
Cyberpunk City
25 CV
BUY

Space Station
50 CV
BUY

Components
Teleport Portal
5 CV
BUY

Speaker
3 CV
BUY

Neon Billboard
8 CV
BUY

All three can ultimately use the same:

order
   ↓
payment
   ↓
entitlement

system.

What I recommend we do right now
Don't build all of this at once.

You're currently importing:

22,500 / 22,500

parcels.

Let that seed finish first.

Then we should do this in this order:

Verify all 22,500 parcels imported correctly.
Fix the distinction between Parcel.status = for_sale and an actual ParcelListing.
Get one parcel successfully through your existing TEST payment flow.
Add WorldTemplate.
Import your editor JSON into WorldTemplate.
Add ComponentTemplate.
Import your reusable components.
Connect worlds/components to the existing marketplace order/payment/entitlement system.
Finally build the marketplace UI.
That way we're not mixing land, world templates, components, and payments all at once and making debugging difficult.



