Solana Prompts Marketplace - MVP

This is a minimal Next.js application scaffold that demonstrates:

- Solana wallet authentication (Phantom, Solflare) using wallet-adapter
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
