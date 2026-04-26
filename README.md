# TaskFlow — Task Management Tool

A full-stack task management application built with the T3 stack, deployed serverlessly on AWS using SST v3, with Supabase as the database.

## Tech Stack

- **Framework**: Next.js (Pages Router) with TypeScript
- **Styling**: Tailwind CSS
- **API**: tRPC (end-to-end type-safe)
- **Auth**: NextAuth.js (Credentials provider, JWT sessions)
- **ORM**: Prisma
- **Database**: Supabase (PostgreSQL)
- **Deployment**: SST v3 (AWS Lambda + CloudFront + S3)
- **Testing**: Vitest + React Testing Library

## Architecture

```
Browser → Next.js Pages → tRPC Client
                              ↓
                         tRPC Server (API Routes)
                              ↓
                         Prisma ORM
                              ↓
                    Supabase PostgreSQL
```

- **Frontend**: Next.js pages with React components, styled with Tailwind CSS
- **API Layer**: tRPC routers provide type-safe API procedures. Protected routes use JWT-based session middleware.
- **Database**: Prisma schema defines all models. Migrations pushed directly to Supabase via `prisma db push`.
- **Auth**: Email/password authentication via NextAuth's Credentials provider. Passwords are bcrypt-hashed. Sessions use JWT strategy.
- **Deployment**: SST v3 compiles the Next.js app via OpenNext and deploys to AWS Lambda behind CloudFront.

## Features

- **Task Management**: Create, assign, track tasks with priorities (Low/Medium/High/Urgent), deadlines, and tags
- **Project Organization**: Create projects, invite members by email, manage access
- **Kanban Board**: Tasks displayed in status columns (To Do, In Progress, In Review, Done)
- **Dashboard**: Overview of assigned tasks, deadlines, and project stats
- **User Profiles**: Manage personal information and preferences

## Project Setup

### Prerequisites

- Node.js 18+
- npm
- A Supabase account (free tier works)
- AWS account + AWS CLI (for deployment)

### 1. Clone and Install

```bash
git clone https://github.com/Priyanshu85/management-tool.git
cd management-tool
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings → Database → Connection string**
3. Copy the **URI** connection string (Transaction/Session mode for `DATABASE_URL`, Direct for `DIRECT_URL`)

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

Generate a secret:
```bash
openssl rand -base64 32
```

### 4. Push Database Schema

```bash
npx prisma db push
```

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Testing

```bash
# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Run specific test file
npx vitest run tests/routers/task.test.ts
```

### Test Coverage

- **Router tests**: Task creation, filtering, project membership authorization
- **Utility tests**: Password hashing and verification
- **Component tests**: TaskCard rendering with props

## Deployment to AWS

### 1. Install AWS CLI

```bash
# macOS
brew install awscli

# Or download from https://aws.amazon.com/cli/
```

### 2. Configure AWS Credentials

```bash
aws configure
```

Enter your AWS Access Key ID, Secret Access Key, region (e.g., `ap-south-1`), and output format (`json`).

### 3. Deploy with SST

```bash
# Deploy to production
npx sst deploy --stage production
```

SST will output the CloudFront URL. Update `NEXTAUTH_URL` in your environment to match.

### 4. Set Environment Variables

SST reads env vars from your shell or `.env` file during deployment. Ensure all required variables are set:

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (set to the CloudFront URL after first deploy)

## Database Schema

| Model | Purpose |
|-------|---------|
| User | App users with email/password auth |
| Project | Task containers with invite-only access |
| ProjectMember | User ↔ Project join with role (OWNER/MEMBER) |
| Task | Work items with status, priority, deadline, assignee |
| Tag | Color-coded labels scoped to a project |

## Project Structure

```
src/
├── components/          # React components
│   ├── layout/          # Sidebar, Layout wrapper
│   ├── tasks/           # TaskCard, TaskForm, TaskBoard
│   └── projects/        # ProjectCard, MemberList
├── pages/               # Next.js pages (file-based routing)
│   ├── auth/            # Sign in, Sign up
│   ├── projects/        # Project CRUD, board, settings
│   ├── dashboard.tsx    # Overview page
│   └── profile.tsx      # User profile
├── server/
│   ├── api/routers/     # tRPC routers (auth, project, task, tag, user)
│   ├── auth.ts          # NextAuth configuration
│   └── db.ts            # Prisma client
└── utils/
    └── api.ts           # tRPC client
```
