# 🎁 Gift List 2025

A Next.js application for managing and sharing gift wishlists with family and friends.

## Features

### Admin (Backoffice)
- 🔐 Password-protected admin panel (Password: `DreamTeam@2024`)
- ➕ Add, edit, and delete gifts
- 👥 Generate unique user access links
- 📊 Dashboard with statistics
- 🎯 Gift management with categories, prices, images, and purchase links

### User (Public)
- 🔗 Access via unique hex key URL
- 📱 Browse gift catalog with category filtering
- ❤️ Mark interest in gifts
- 👀 See who else is interested in each gift
- 🛒 Direct links to purchase products

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: Tailwind CSS + ShadCN UI
- **Database**: Supabase (PostgreSQL)
- **Language**: TypeScript
- **Package Manager**: pnpm

## Setup Instructions

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings → API
3. Copy your project URL and anon key

### 3. Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. Update `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
BACKOFFICE_PASSWORD=DreamTeam@2024
```

### 4. Set Up Database Schema

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase-schema.sql`
4. Paste and run the SQL script

This will create:
- `gifts` table - stores gift information
- `users` table - stores user access information
- `interests` table - tracks user interest in gifts
- Necessary indexes and Row Level Security policies

### 5. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Admin Access

1. Navigate to `/backoffice` or the root URL
2. Login with password: `DreamTeam@2024`
3. Use the dashboard to:
   - Add new gifts with title, description, price, image, categories, and purchase link
   - Edit or delete existing gifts
   - Generate user access links

### User Access

1. Admin generates a unique link for each user (e.g., `/gifts/abc123def456`)
2. Share the link with family/friends
3. Users can:
   - Browse all available gifts
   - Filter by categories
   - Mark interest in gifts (❤️ button)
   - See who else is interested
   - Click to view product purchase links

## Project Structure

```
├── app/
│   ├── api/
│   │   └── auth/          # Authentication API routes
│   ├── backoffice/        # Admin panel pages
│   │   ├── gifts/         # Gift management
│   │   ├── users/         # User link generation
│   │   └── login/         # Admin login
│   ├── gifts/
│   │   └── [hexKey]/      # Public gift list page
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page (redirects to backoffice)
├── lib/
│   ├── supabase.ts        # Supabase client & types
│   └── utils.ts           # Utility functions
├── middleware.ts          # Auth middleware
└── supabase-schema.sql    # Database schema
```

## Database Schema

### gifts
- `id` (UUID) - Primary key
- `title` (TEXT) - Gift name
- `description` (TEXT) - Gift description
- `purchase_link` (TEXT) - URL to buy the gift
- `image_url` (TEXT, optional) - Gift image URL
- `price` (DECIMAL) - Gift price in euros
- `categories` (TEXT[]) - Array of category tags
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

### users
- `id` (UUID) - Primary key
- `name` (TEXT) - User display name
- `hex_key` (TEXT, unique) - 16-character hex access key
- `created_at` (TIMESTAMP) - Creation timestamp

### interests
- `id` (UUID) - Primary key
- `gift_id` (UUID) - Foreign key to gifts
- `user_id` (UUID) - Foreign key to users
- `created_at` (TIMESTAMP) - Creation timestamp
- Unique constraint on (gift_id, user_id)

## Security

- Admin panel protected by password authentication
- Session-based auth using HTTP-only cookies
- Supabase Row Level Security (RLS) enabled
- Public read access to gifts and users
- Controlled write access through API routes

## Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linter
pnpm lint
```

## License

Private project for personal use.
