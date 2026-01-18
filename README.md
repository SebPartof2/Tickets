# Family Tickets

A mobile-first ticketing platform for family use, built with Next.js 15, Turso, and S-Auth OAuth2.

## Features

- Submit and track support tickets
- Admin dashboard for managing tickets
- Real-time status updates
- Push notifications for ticket updates
- Mobile-first responsive design
- PWA support

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:
- `TURSO_DATABASE_URL` - Your Turso database URL
- `TURSO_AUTH_TOKEN` - Your Turso auth token
- `S_AUTH_CLIENT_ID` - OAuth client ID from S-Auth
- `S_AUTH_CLIENT_SECRET` - OAuth client secret from S-Auth
- `NEXTAUTH_URL` - Your app URL (http://localhost:3000 for development)
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`

### 3. Generate VAPID Keys (for Push Notifications)

```bash
npx web-push generate-vapid-keys
```

Add the generated keys to your `.env.local`:
- `VAPID_EMAIL` - Your email address
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` - Generated public key
- `VAPID_PRIVATE_KEY` - Generated private key

### 4. Setup Database

Push the schema to your Turso database:

```bash
npm run db:push
```

### 5. Add PWA Icons

Add your app icons to `public/icons/`:
- `icon-192.png` (192x192)
- `icon-512.png` (512x512)
- `badge-72.png` (72x72, for notification badge)

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth pages (login)
│   ├── (dashboard)/       # Protected dashboard pages
│   │   ├── tickets/       # Ticket list, new, detail
│   │   ├── admin/         # Admin dashboard
│   │   └── settings/      # User settings
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── layout/           # Layout components
│   └── tickets/          # Ticket-specific components
├── db/                    # Database schema and client
├── lib/                   # Utility functions
└── hooks/                 # React hooks
```

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Turso (SQLite edge) + Drizzle ORM
- **Auth**: Auth.js v5 with S-Auth OIDC
- **UI**: Tailwind CSS v4 + shadcn/ui patterns
- **Push**: Web Push API
- **Deployment**: Vercel
