🌐 Cypherverse
A full-stack Web3 application and immersive 3D web experience starter built by CypherVerse Labs.

This project combines:

A Next.js frontend with React and Three.js for 3D experiences

An Express backend (TypeScript) supporting Ethereum interaction via ethers.js and JWT authentication

The Cypherverse CyEngine for 3D environment and input abstraction

📁 Project Structure
bash
Copy code
cypherverse/
├── server/           # Express + TypeScript backend
├── frontend/         # Next.js frontend with Three.js + React
├── package.json      # Root package.json (manages frontend + backend)
└── README.md         # You are here
📦 How to Use
Clone the repo

bash
Copy code
git clone https://github.com/CypherVerseLabs/cypherverse.git
cd cypherverse
Install dependencies

bash
Copy code
# Install root dependencies (handles frontend if using workspaces)
yarn install

# Install backend dependencies separately (if needed)
cd server && yarn install
🔧 Environment Setup
Create a .env file inside the server/ directory:

env
Copy code
PORT=5000
JWT_SECRET="mykey"
Make sure the backend port (PORT) doesn’t conflict with the frontend’s default 3000.

🚀 Running the App (Dev Mode)
From the project root:

bash
Copy code
yarn dev
This concurrently runs:

Backend server (Express) at http://localhost:5000

Frontend app (Next.js + 3D world) at http://localhost:3000

🛠️ Useful Scripts
Command	Description
yarn dev	Start both frontend and backend
yarn server	Start backend only
yarn frontend	Start frontend only
yarn build	Build frontend for production
yarn start	Start frontend production server
yarn lint	Fix lint issues
yarn prettier	Check formatting

✨ Features
Full-stack Web3: Ethereum integration via ethers.js

JWT-based authentication on backend

3D immersive world with React and Three.js

CyEngine: Environment + input abstraction layer for Web3 3D apps

Physics integration: via @react-three/cannon

Animations: with react-spring

TypeScript out of the box

Clean code enforced with ESLint and Prettier

🧱 Tech Stack
Frontend:

Next.js (React framework)

Three.js + React (@react-three/fiber)

Helpers: @react-three/drei

Physics: @react-three/cannon

Animations: react-spring

Cypherverse CyEngine (3D environment abstraction)

Backend:

Express.js (TypeScript)

JWT authentication

Ethereum interaction via ethers.js

🧪 Status
This repository is actively maintained by CypherVerse Labs.

📄 License
MIT © 2025 CypherVerse Labs

