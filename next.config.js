/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client']
  },
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    SEED_SECRET: process.env.SEED_SECRET,
    PAYOUT_WALLET: process.env.PAYOUT_WALLET,
  }
}

module.exports = nextConfig
