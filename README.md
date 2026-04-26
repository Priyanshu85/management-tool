# TaskFlow — Task Management Tool

A full-stack task management application built with the T3 stack, deployed serverlessly on AWS using SST v3 (Serverless Stack), with Supabase as the PostgreSQL database.

## Tech Stack

- **Framework**: Next.js (Pages Router) with TypeScript
- **Styling**: Tailwind CSS
- **API**: tRPC (end-to-end type-safe)
- **Auth**: NextAuth.js (Credentials provider, email/password, JWT sessions)
- **ORM**: Prisma
- **Database**: Supabase (PostgreSQL)
- **Deployment**: SST v3 on AWS (Lambda + CloudFront + S3 via OpenNext)
- **Testing**: Vitest + React Testing Library

## Architecture

```
                         ┌────────────────────────────────────────┐
                         │              AWS (via SST)             │
                         │                                        │
  Browser ──────────────►│  CloudFront CDN                       │
                         │       │                                │
                         │       ├── Static assets ──► S3 Bucket │
                         │       │                                │
                         │       └── Server routes ──► Lambda     │
                         │              │                         │
                         └──────────────┼─────────────────────────┘
                                        │
                                        ▼
                              ┌──────────────────┐
                              │  Supabase        │
                              │  PostgreSQL      │
                              │  (managed)       │
                              └──────────────────┘
```

**How it works:**

- **SST v3** compiles the Next.js app using **OpenNext** and deploys it to AWS
- **AWS Lambda** handles server-side rendering and API routes (tRPC)
- **CloudFront** serves as CDN — routes static assets to S3, dynamic requests to Lambda
- **S3** stores static assets (JS bundles, CSS, images)
- **Supabase** provides managed PostgreSQL — Prisma connects via connection pooler
- **NextAuth** handles email/password auth with JWT sessions (no server-side session storage needed)

## Features

- **Task Management**: Create, assign, track tasks with priorities (Low/Medium/High/Urgent), deadlines, and tags
- **Drag-and-Drop Kanban Board**: Smooth drag-and-drop between status columns (To Do, In Progress, In Review, Done)
- **Project Organization**: Create projects, invite members by email, role-based access control
- **Dashboard**: Personalized overview with stats, due-today alerts, task list, and project summary
- **User Profiles**: Manage personal information and preferences
- **Skeleton Loading**: Shimmer loading states across all pages

## Project Setup

### Prerequisites

- Node.js 18+
- npm
- A [Supabase](https://supabase.com) account (free tier works)
- An [AWS](https://aws.amazon.com) account (for deployment)

### 1. Clone and Install

```bash
git clone https://github.com/Priyanshu85/management-tool.git
cd management-tool
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Wait for the project to be ready
3. Go to **Settings → Database → Connection string**
4. You need two connection strings:
   - **Transaction mode** (port `6543`) → use as `DATABASE_URL`
   - **Session mode / Direct** (port `5432`) → use as `DIRECT_URL`

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Supabase (replace with your actual values)
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# NextAuth (generate a secret)
NEXTAUTH_SECRET="run-openssl-rand-base64-32"
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

This creates all tables (User, Project, ProjectMember, Task, Tag, etc.) in your Supabase database.

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

| Area | Tests | What's Tested |
|------|-------|---------------|
| **Router: Task** | 2 | Task creation, filtering by status |
| **Router: Project** | 2 | Project creation with owner, non-member access rejection |
| **Utility: Auth** | 2 | Password hashing, incorrect password rejection |
| **Component: TaskCard** | 2 | Renders title/priority/tags, shows assignee initial |

## Deployment to AWS

The application is deployed as a serverless application on AWS using **SST v3** (Serverless Stack). SST uses **OpenNext** to compile the Next.js app and provisions:

- **AWS Lambda** — Server-side rendering + API routes
- **Amazon CloudFront** — CDN distribution
- **Amazon S3** — Static asset storage

### Step 1: Install AWS CLI

```bash
# macOS
brew install awscli

# Windows
winget install Amazon.AWSCLI

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

Verify:

```bash
aws --version
```

### Step 2: Create IAM User for Deployment

1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Click **Users → Create user**
3. Name: `sst-deployer`
4. Attach policy: **AdministratorAccess** (SST needs broad permissions to create Lambda, CloudFront, S3, IAM roles, etc.)
5. Go to **Security credentials → Create access key**
6. Choose **Command Line Interface (CLI)**
7. Save the **Access Key ID** and **Secret Access Key**

### Step 3: Configure AWS CLI

```bash
aws configure
```

Enter:
- **AWS Access Key ID**: (from step 2)
- **AWS Secret Access Key**: (from step 2)
- **Default region**: `ap-south-1` (or your preferred region)
- **Default output format**: `json`

Verify credentials work:

```bash
aws sts get-caller-identity
```

Should return your account ID and user ARN.

### Step 4: First Deployment

Make sure your `.env` file has all required variables set, then:

```bash
# Deploy to dev stage first (recommended)
npm run deploy:dev
```

SST will:
1. Build the Next.js app with OpenNext
2. Create a CloudFormation stack
3. Provision Lambda, CloudFront, S3
4. Output the **CloudFront URL**

First deployment takes 3-5 minutes. Subsequent deployments are faster (~1-2 min).

### Step 5: Update NEXTAUTH_URL

After the first deploy, SST outputs a URL like:
```
url: https://dxxxxxxxxx.cloudfront.net
```

Update your `.env` file:
```env
NEXTAUTH_URL="https://dxxxxxxxxx.cloudfront.net"
```

Then redeploy:
```bash
npm run deploy:dev
```

### Step 6: Deploy to Production

```bash
npm run deploy
```

This deploys to the `production` stage with `removal: retain` (resources won't be deleted on `sst remove`).

### Step 7: SST Dev Mode (Optional)

For development with live Lambda debugging:

```bash
npm run sst:dev
```

This starts the SST dev multiplexer — your local changes are deployed instantly to AWS with live Lambda invocation.

### Deployment Commands Reference

| Command | Description |
|---------|-------------|
| `npm run deploy` | Deploy to production stage |
| `npm run deploy:dev` | Deploy to dev stage |
| `npm run sst:dev` | Start SST dev mode (live Lambda) |
| `npm run remove` | Remove production stack from AWS |
| `npx sst remove --stage dev` | Remove dev stack from AWS |

### Troubleshooting Deployment

**"Missing credentials"**
```bash
aws configure  # Re-enter credentials
aws sts get-caller-identity  # Verify
```

**"NEXTAUTH_URL mismatch"**
- Ensure `NEXTAUTH_URL` in `.env` matches the CloudFront URL from the deploy output
- Redeploy after updating

**"Prisma: Can't reach database server"**
- Check that `DATABASE_URL` points to Supabase's pooler (port `6543`)
- Ensure Supabase project is active (paused projects on free tier need to be unpaused)

**"Build failed: env validation"**
- Set `SKIP_ENV_VALIDATION=1` in your environment, or ensure all env vars are present

## Database Schema

| Model | Purpose |
|-------|---------|
| User | App users with email/password auth |
| Project | Task containers with invite-only access |
| ProjectMember | User ↔ Project join table with role (OWNER / MEMBER) |
| Task | Work items with status, priority, deadline, assignee |
| Tag | Color-coded labels scoped per project |

## Project Structure

```
task-management-tool/
├── sst.config.ts              # SST deployment configuration
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── components/
│   │   ├── layout/            # Sidebar, Layout wrapper
│   │   ├── tasks/             # TaskCard, TaskForm, TaskBoard (drag-and-drop)
│   │   └── projects/          # ProjectCard, MemberList
│   ├── pages/
│   │   ├── auth/              # Sign in, Sign up
│   │   ├── projects/          # Project list, board, settings, task detail
│   │   ├── dashboard.tsx      # Overview page
│   │   └── profile.tsx        # User profile
│   ├── server/
│   │   ├── api/routers/       # tRPC routers (auth, project, task, tag, user)
│   │   ├── auth.ts            # NextAuth configuration
│   │   └── db.ts              # Prisma client
│   └── utils/
│       └── api.ts             # tRPC client
├── tests/                     # Vitest unit tests
├── .env.example               # Environment variable template
└── README.md
```
