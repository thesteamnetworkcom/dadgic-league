// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'cdn.discordapp.com', // Discord avatars
      'avatars.githubusercontent.com', // GitHub avatars (if you add GitHub auth later)
    ],
  },
  // Enable transpilation of workspace packages
  transpilePackages: ['@dadgic/database', '@dadgic/shared'],
}

module.exports = nextConfig