# Prompt Raise 💡

AI Prompt Marketplace - Raise your use of AI

## 🚀 Features

- 🎯 Browse and search AI prompts for different models (GPT, Claude, Grok, etc.)
- 💰 Buy and sell prompts using Solana blockchain
- 🔍 Advanced filtering by purpose, type, and task
- ⭐ Save favorite prompts
- 📱 Responsive design with modern UI
- 🔒 Wallet integration for secure payments

## 🛠 Tech Stack

- **Frontend**: Next.js 13, React
- **Styling**: CSS with modern animations
- **Blockchain**: Solana Web3.js, Wallet Adapter
- **Database**: Prisma ORM
- **Deployment**: Vercel

## 🏃‍♂️ Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 🎨 Design

- Purple theme (#6D3F5B) with white backgrounds
- Horizontal navigation with model-specific pills
- Animated prompt cards with hover effects
- Modern modal dialogs
- Simple in-memory API for prompts (create, list)
- Client pages to add prompts and mark as paid

Assumptions:
- Prototype uses in-memory store (not production-ready)
- Payments are simulated via wallet signatures and not a full smart contract

To run locally:
1. npm install
2. npm run dev

Notes:
- This is a starting point for integration and testing. For production, add persistent DB, backend payment handling, and Solana program for on-chain ownership.
