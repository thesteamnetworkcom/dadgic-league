Dadgic - MTG Commander League Tracker
A web app and Discord bot for tracking Magic: The Gathering Commander games among friends.
Project Structure

apps/web/ - Next.js web application
apps/discord-bot/ - Discord bot service
packages/database/ - Shared database layer
packages/shared/ - Shared utilities and game logic
packages/ui/ - Shared UI components

Getting Started

Copy environment variables:
bashcp .env.example .env.local

Fill in your Supabase credentials in .env.local
Install dependencies:
bashnpm install

Run the database migration in your Supabase SQL editor
Start development:
bashnpm run dev


Features

Track MTG Commander games
Player statistics and game history
League system with automatic matchmaking
Discord bot integration
Natural language game reporting (planned)
