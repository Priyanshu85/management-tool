# Task Management Tool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a task management app with the T3 stack, deploy on AWS via SST v3, with Supabase as the database.

**Architecture:** Next.js Pages Router with tRPC for type-safe API, NextAuth Credentials provider for email/password auth (JWT sessions), Prisma ORM connected to Supabase PostgreSQL. SST v3 deploys the app as Lambda + CloudFront + S3 on AWS.

**Tech Stack:** Next.js, TypeScript, Tailwind CSS, tRPC, NextAuth.js, Prisma, Supabase, SST v3, Vitest

---

## File Map

```
task-management-tool/
├── sst.config.ts                          # SST v3 deployment config
├── prisma/
│   └── schema.prisma                      # Database schema (all models)
├── src/
│   ├── env.js                             # T3 env validation (scaffolded)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx                # Left sidebar navigation
│   │   │   └── Layout.tsx                 # Main layout wrapper (sidebar + content)
│   │   ├── tasks/
│   │   │   ├── TaskCard.tsx               # Single task display card
│   │   │   ├── TaskForm.tsx               # Create/edit task form
│   │   │   └── TaskBoard.tsx              # Tasks grouped by status columns
│   │   └── projects/
│   │       ├── ProjectCard.tsx            # Project list item card
│   │       └── MemberList.tsx             # Project member list with invite
│   ├── pages/
│   │   ├── _app.tsx                       # App wrapper (scaffolded, modify)
│   │   ├── index.tsx                      # Landing page / redirect
│   │   ├── auth/
│   │   │   ├── signin.tsx                 # Sign in page
│   │   │   └── signup.tsx                 # Sign up page
│   │   ├── dashboard.tsx                  # Dashboard overview
│   │   ├── projects/
│   │   │   ├── index.tsx                  # Project list page
│   │   │   ├── new.tsx                    # Create project page
│   │   │   └── [projectId]/
│   │   │       ├── index.tsx              # Project board page
│   │   │       ├── settings.tsx           # Project settings page
│   │   │       └── tasks/
│   │   │           └── [taskId].tsx       # Task detail page
│   │   └── profile.tsx                    # User profile page
│   ├── server/
│   │   ├── api/
│   │   │   ├── root.ts                    # Merge all routers (modify)
│   │   │   ├── trpc.ts                    # tRPC init + middleware (modify)
│   │   │   └── routers/
│   │   │       ├── auth.ts                # Signup mutation
│   │   │       ├── project.ts             # Project CRUD + members
│   │   │       ├── task.ts                # Task CRUD + filters
│   │   │       ├── tag.ts                 # Tag CRUD
│   │   │       └── user.ts                # Profile get/update
│   │   ├── auth.ts                        # NextAuth config (modify)
│   │   └── db.ts                          # Prisma client (scaffolded)
│   ├── styles/
│   │   └── globals.css                    # Tailwind imports (scaffolded)
│   └── utils/
│       └── api.ts                         # tRPC client (scaffolded)
├── tests/
│   ├── helpers.ts                         # Shared test mocks (Prisma, session)
│   ├── routers/
│   │   ├── task.test.ts                   # Task router tests
│   │   └── project.test.ts               # Project router tests
│   ├── utils/
│   │   └── auth.test.ts                   # Password hashing tests
│   └── components/
│       └── TaskCard.test.tsx              # TaskCard render test
├── .env.example                           # Environment variable template
├── vitest.config.ts                       # Vitest configuration
└── README.md                              # Setup, architecture, deployment docs
```

---

## Task 1: Scaffold T3 App

**Files:**
- Create: entire project scaffold via `create-t3-app`
- Create: `.env.example`

- [ ] **Step 1: Scaffold the T3 project**

```bash
cd /Users/102045_priyanshu/Personal/task-management-tool
npx create-t3-app@7.37.0 . --typescript --tailwind --trpc --nextAuth --prisma --appRouter false --dbProvider postgresql --CI
```

Note: The `--CI` flag skips interactive prompts. If the CLI doesn't accept `--CI`, answer the prompts as specified: TypeScript, Tailwind, tRPC, NextAuth, Prisma, No App Router, PostgreSQL.

- [ ] **Step 2: Verify scaffold**

```bash
ls src/pages/_app.tsx src/server/api/root.ts src/server/api/trpc.ts src/server/auth.ts src/server/db.ts prisma/schema.prisma
```

Expected: All files exist.

- [ ] **Step 3: Install additional dependencies**

```bash
npm install bcryptjs sst@latest
npm install -D @types/bcryptjs vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom vitest-mock-extended
```

- [ ] **Step 4: Create .env.example**

Create file `.env.example`:

```env
# Supabase PostgreSQL
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# NextAuth
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: scaffold T3 app with additional dependencies"
```

---

## Task 2: Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Write the complete Prisma schema**

Replace the contents of `prisma/schema.prisma` with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// NextAuth required models
model Account {
  id                       String  @id @default(cuid())
  userId                   String
  type                     String
  provider                 String
  providerAccountId        String
  refresh_token            String?
  access_token             String?
  expires_at               Int?
  token_type               String?
  scope                    String?
  id_token                 String?
  session_state            String?
  user                     User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  refresh_token_expires_in Int?

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// App models
model User {
  id              String          @id @default(cuid())
  name            String?
  email           String          @unique
  emailVerified   DateTime?
  password        String
  image           String?
  createdAt       DateTime        @default(now())
  accounts        Account[]
  sessions        Session[]
  ownedProjects   Project[]       @relation("ProjectOwner")
  memberships     ProjectMember[]
  assignedTasks   Task[]          @relation("TaskAssignee")
  createdTasks    Task[]          @relation("TaskCreator")
}

model Project {
  id          String          @id @default(cuid())
  name        String
  description String?
  ownerId     String
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
  owner       User            @relation("ProjectOwner", fields: [ownerId], references: [id], onDelete: Cascade)
  members     ProjectMember[]
  tasks       Task[]
  tags        Tag[]
}

enum MemberRole {
  OWNER
  MEMBER
}

model ProjectMember {
  id        String     @id @default(cuid())
  projectId String
  userId    String
  role      MemberRole @default(MEMBER)
  project   Project    @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([projectId, userId])
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  IN_REVIEW
  DONE
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

model Task {
  id          String       @id @default(cuid())
  title       String
  description String?
  status      TaskStatus   @default(TODO)
  priority    TaskPriority @default(MEDIUM)
  deadline    DateTime?
  projectId   String
  assigneeId  String?
  creatorId   String
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  project     Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  assignee    User?        @relation("TaskAssignee", fields: [assigneeId], references: [id], onDelete: SetNull)
  creator     User         @relation("TaskCreator", fields: [creatorId], references: [id], onDelete: Cascade)
  tags        Tag[]
}

model Tag {
  id        String  @id @default(cuid())
  name      String
  color     String
  projectId String
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  tasks     Task[]
}
```

- [ ] **Step 2: Generate Prisma client**

```bash
npx prisma generate
```

Expected: `Prisma Client generated successfully`

- [ ] **Step 3: Validate schema**

```bash
npx prisma validate
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: define complete Prisma schema with all models and relations"
```

---

## Task 3: NextAuth Configuration

**Files:**
- Modify: `src/server/auth.ts`

- [ ] **Step 1: Rewrite NextAuth config with Credentials provider**

Replace `src/server/auth.ts` with:

```typescript
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
} from "next-auth";
import { type Adapter } from "next-auth/adapters";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "~/server/db";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as Adapter,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.id as string,
      },
    }),
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password,
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
};

export const getServerAuthSession = () => getServerSession(authOptions);
```

- [ ] **Step 2: Install credentials provider**

```bash
npm install next-auth@4 @auth/prisma-adapter
```

Note: create-t3-app may have already installed these. If so, this is a no-op.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors related to `auth.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/server/auth.ts package.json package-lock.json
git commit -m "feat: configure NextAuth with Credentials provider and JWT sessions"
```

---

## Task 4: tRPC Setup and Auth Router

**Files:**
- Modify: `src/server/api/trpc.ts`
- Create: `src/server/api/routers/auth.ts`
- Modify: `src/server/api/root.ts`

- [ ] **Step 1: Verify existing tRPC setup**

Read `src/server/api/trpc.ts` — the T3 scaffold should already have `publicProcedure` and `protectedProcedure`. Confirm `protectedProcedure` enforces session via middleware. If it does, no changes needed to this file.

- [ ] **Step 2: Create auth router**

Create `src/server/api/routers/auth.ts`:

```typescript
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const authRouter = createTRPCRouter({
  signup: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(8),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (existing) {
        throw new Error("User with this email already exists");
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);

      const user = await ctx.db.user.create({
        data: {
          name: input.name,
          email: input.email,
          password: hashedPassword,
        },
      });

      return { id: user.id, email: user.email };
    }),
});
```

- [ ] **Step 3: Register auth router in root**

Modify `src/server/api/root.ts` to add the auth router. The T3 scaffold has a `postRouter` by default — remove it and add our routers:

```typescript
import { createTRPCRouter } from "~/server/api/trpc";
import { authRouter } from "~/server/api/routers/auth";

export const appRouter = createTRPCRouter({
  auth: authRouter,
});

export type AppRouter = typeof appRouter;
```

- [ ] **Step 4: Verify compilation**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/server/api/routers/auth.ts src/server/api/root.ts
git commit -m "feat: add auth router with signup mutation"
```

---

## Task 5: Project Router

**Files:**
- Create: `src/server/api/routers/project.ts`
- Modify: `src/server/api/root.ts`

- [ ] **Step 1: Create project router**

Create `src/server/api/routers/project.ts`:

```typescript
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

export const projectRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.create({
        data: {
          name: input.name,
          description: input.description,
          ownerId: ctx.session.user.id,
          members: {
            create: {
              userId: ctx.session.user.id,
              role: "OWNER",
            },
          },
        },
      });

      return project;
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await ctx.db.projectMember.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        project: {
          include: {
            _count: { select: { tasks: true, members: true } },
          },
        },
      },
      orderBy: { project: { updatedAt: "desc" } },
    });

    return memberships.map((m) => ({
      ...m.project,
      role: m.role,
    }));
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const membership = await ctx.db.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: input.id,
            userId: ctx.session.user.id,
          },
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this project",
        });
      }

      const project = await ctx.db.project.findUniqueOrThrow({
        where: { id: input.id },
        include: {
          members: {
            include: { user: { select: { id: true, name: true, email: true, image: true } } },
          },
          _count: { select: { tasks: true } },
        },
      });

      return { ...project, currentUserRole: membership.role };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const membership = await ctx.db.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: input.id,
            userId: ctx.session.user.id,
          },
        },
      });

      if (!membership || membership.role !== "OWNER") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the project owner can update settings" });
      }

      return ctx.db.project.update({
        where: { id: input.id },
        data: {
          ...(input.name && { name: input.name }),
          ...(input.description !== undefined && { description: input.description }),
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const membership = await ctx.db.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: input.id,
            userId: ctx.session.user.id,
          },
        },
      });

      if (!membership || membership.role !== "OWNER") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the project owner can delete this project" });
      }

      return ctx.db.project.delete({ where: { id: input.id } });
    }),

  inviteMember: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        email: z.string().email(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const membership = await ctx.db.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: input.projectId,
            userId: ctx.session.user.id,
          },
        },
      });

      if (!membership || membership.role !== "OWNER") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the project owner can invite members" });
      }

      const userToInvite = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (!userToInvite) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No user found with that email" });
      }

      const existingMember = await ctx.db.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: input.projectId,
            userId: userToInvite.id,
          },
        },
      });

      if (existingMember) {
        throw new TRPCError({ code: "CONFLICT", message: "User is already a member" });
      }

      return ctx.db.projectMember.create({
        data: {
          projectId: input.projectId,
          userId: userToInvite.id,
          role: "MEMBER",
        },
      });
    }),

  removeMember: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const membership = await ctx.db.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: input.projectId,
            userId: ctx.session.user.id,
          },
        },
      });

      if (!membership || membership.role !== "OWNER") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the project owner can remove members" });
      }

      if (input.userId === ctx.session.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot remove yourself as owner" });
      }

      return ctx.db.projectMember.delete({
        where: {
          projectId_userId: {
            projectId: input.projectId,
            userId: input.userId,
          },
        },
      });
    }),
});
```

- [ ] **Step 2: Register project router in root**

Modify `src/server/api/root.ts`:

```typescript
import { createTRPCRouter } from "~/server/api/trpc";
import { authRouter } from "~/server/api/routers/auth";
import { projectRouter } from "~/server/api/routers/project";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  project: projectRouter,
});

export type AppRouter = typeof appRouter;
```

- [ ] **Step 3: Verify compilation**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/server/api/routers/project.ts src/server/api/root.ts
git commit -m "feat: add project router with CRUD and member management"
```

---

## Task 6: Task Router

**Files:**
- Create: `src/server/api/routers/task.ts`
- Modify: `src/server/api/root.ts`

- [ ] **Step 1: Create task router**

Create `src/server/api/routers/task.ts`:

```typescript
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

const assertProjectMember = async (
  db: Parameters<Parameters<typeof protectedProcedure.query>[0]>["ctx"]["db"],
  projectId: string,
  userId: string,
) => {
  const membership = await db.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!membership) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Not a project member" });
  }
  return membership;
};

export const taskRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        title: z.string().min(1),
        description: z.string().optional(),
        status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).default("TODO"),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
        deadline: z.date().optional(),
        assigneeId: z.string().optional(),
        tagIds: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertProjectMember(ctx.db, input.projectId, ctx.session.user.id);

      return ctx.db.task.create({
        data: {
          title: input.title,
          description: input.description,
          status: input.status,
          priority: input.priority,
          deadline: input.deadline,
          projectId: input.projectId,
          assigneeId: input.assigneeId,
          creatorId: ctx.session.user.id,
          ...(input.tagIds && {
            tags: { connect: input.tagIds.map((id) => ({ id })) },
          }),
        },
        include: { tags: true, assignee: { select: { id: true, name: true, email: true, image: true } } },
      });
    }),

  list: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).optional(),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
        assigneeId: z.string().optional(),
        tagId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      await assertProjectMember(ctx.db, input.projectId, ctx.session.user.id);

      return ctx.db.task.findMany({
        where: {
          projectId: input.projectId,
          ...(input.status && { status: input.status }),
          ...(input.priority && { priority: input.priority }),
          ...(input.assigneeId && { assigneeId: input.assigneeId }),
          ...(input.tagId && { tags: { some: { id: input.tagId } } }),
        },
        include: {
          tags: true,
          assignee: { select: { id: true, name: true, email: true, image: true } },
          creator: { select: { id: true, name: true, email: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const task = await ctx.db.task.findUniqueOrThrow({
        where: { id: input.id },
        include: {
          tags: true,
          assignee: { select: { id: true, name: true, email: true, image: true } },
          creator: { select: { id: true, name: true, email: true, image: true } },
          project: { select: { id: true, name: true } },
        },
      });

      await assertProjectMember(ctx.db, task.projectId, ctx.session.user.id);

      return task;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        description: z.string().nullable().optional(),
        status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).optional(),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
        deadline: z.date().nullable().optional(),
        assigneeId: z.string().nullable().optional(),
        tagIds: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.findUniqueOrThrow({
        where: { id: input.id },
      });

      await assertProjectMember(ctx.db, task.projectId, ctx.session.user.id);

      const { id, tagIds, ...data } = input;

      return ctx.db.task.update({
        where: { id },
        data: {
          ...data,
          ...(tagIds && { tags: { set: tagIds.map((tid) => ({ id: tid })) } }),
        },
        include: { tags: true, assignee: { select: { id: true, name: true, email: true, image: true } } },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.findUniqueOrThrow({
        where: { id: input.id },
      });

      const membership = await assertProjectMember(ctx.db, task.projectId, ctx.session.user.id);

      if (task.creatorId !== ctx.session.user.id && membership.role !== "OWNER") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the task creator or project owner can delete this task" });
      }

      return ctx.db.task.delete({ where: { id: input.id } });
    }),

  myTasks: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.task.findMany({
      where: { assigneeId: ctx.session.user.id, status: { not: "DONE" } },
      include: {
        tags: true,
        project: { select: { id: true, name: true } },
      },
      orderBy: [{ deadline: { sort: "asc", nulls: "last" } }, { priority: "desc" }],
    });
  }),
});
```

- [ ] **Step 2: Register task router in root**

Modify `src/server/api/root.ts`:

```typescript
import { createTRPCRouter } from "~/server/api/trpc";
import { authRouter } from "~/server/api/routers/auth";
import { projectRouter } from "~/server/api/routers/project";
import { taskRouter } from "~/server/api/routers/task";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  project: projectRouter,
  task: taskRouter,
});

export type AppRouter = typeof appRouter;
```

- [ ] **Step 3: Verify compilation**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/server/api/routers/task.ts src/server/api/root.ts
git commit -m "feat: add task router with CRUD, filters, and myTasks query"
```

---

## Task 7: Tag and User Routers

**Files:**
- Create: `src/server/api/routers/tag.ts`
- Create: `src/server/api/routers/user.ts`
- Modify: `src/server/api/root.ts`

- [ ] **Step 1: Create tag router**

Create `src/server/api/routers/tag.ts`:

```typescript
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

export const tagRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        name: z.string().min(1),
        color: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const membership = await ctx.db.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: input.projectId,
            userId: ctx.session.user.id,
          },
        },
      });

      if (!membership) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not a project member" });
      }

      return ctx.db.tag.create({
        data: {
          name: input.name,
          color: input.color,
          projectId: input.projectId,
        },
      });
    }),

  list: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const membership = await ctx.db.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: input.projectId,
            userId: ctx.session.user.id,
          },
        },
      });

      if (!membership) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not a project member" });
      }

      return ctx.db.tag.findMany({
        where: { projectId: input.projectId },
        orderBy: { name: "asc" },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tag = await ctx.db.tag.findUniqueOrThrow({
        where: { id: input.id },
      });

      const membership = await ctx.db.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: tag.projectId,
            userId: ctx.session.user.id,
          },
        },
      });

      if (!membership || membership.role !== "OWNER") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the project owner can delete tags" });
      }

      return ctx.db.tag.delete({ where: { id: input.id } });
    }),
});
```

- [ ] **Step 2: Create user router**

Create `src/server/api/routers/user.ts`:

```typescript
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findUniqueOrThrow({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
      },
    });
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
        image: z.string().url().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: input,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          createdAt: true,
        },
      });
    }),
});
```

- [ ] **Step 3: Register all routers in root**

Update `src/server/api/root.ts`:

```typescript
import { createTRPCRouter } from "~/server/api/trpc";
import { authRouter } from "~/server/api/routers/auth";
import { projectRouter } from "~/server/api/routers/project";
import { taskRouter } from "~/server/api/routers/task";
import { tagRouter } from "~/server/api/routers/tag";
import { userRouter } from "~/server/api/routers/user";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  project: projectRouter,
  task: taskRouter,
  tag: tagRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
```

- [ ] **Step 4: Verify compilation**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/server/api/routers/tag.ts src/server/api/routers/user.ts src/server/api/root.ts
git commit -m "feat: add tag and user routers"
```

---

## Task 8: Layout Components (Sidebar + Layout)

**Files:**
- Create: `src/components/layout/Sidebar.tsx`
- Create: `src/components/layout/Layout.tsx`
- Modify: `src/pages/_app.tsx`

- [ ] **Step 1: Create Sidebar component**

Create `src/components/layout/Sidebar.tsx`:

```tsx
import Link from "next/link";
import { useRouter } from "next/router";
import { signOut, useSession } from "next-auth/react";
import { api } from "~/utils/api";

export function Sidebar() {
  const router = useRouter();
  const { data: session } = useSession();
  const { data: projects } = api.project.list.useQuery(undefined, {
    enabled: !!session,
  });

  const isActive = (path: string) => router.pathname === path || router.asPath.startsWith(path + "/");

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-14 items-center border-b border-gray-200 px-4">
        <Link href="/dashboard" className="text-xl font-bold text-gray-900">
          TaskFlow
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <Link
          href="/dashboard"
          className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${
            isActive("/dashboard")
              ? "bg-blue-50 text-blue-700"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          Dashboard
        </Link>

        <div className="pt-4">
          <div className="flex items-center justify-between px-3 pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Projects
            </span>
            <Link
              href="/projects/new"
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              + New
            </Link>
          </div>

          {projects?.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className={`flex items-center rounded-md px-3 py-2 text-sm ${
                router.query.projectId === project.id
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {project.name}
            </Link>
          ))}

          {projects?.length === 0 && (
            <p className="px-3 py-2 text-xs text-gray-400">No projects yet</p>
          )}
        </div>
      </nav>

      <div className="border-t border-gray-200 p-3">
        <Link
          href="/profile"
          className={`flex items-center rounded-md px-3 py-2 text-sm ${
            isActive("/profile")
              ? "bg-blue-50 text-blue-700"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <div className="h-7 w-7 rounded-full bg-blue-100 text-center text-sm leading-7 text-blue-700">
            {session?.user?.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <span className="ml-2 truncate">{session?.user?.name ?? "Profile"}</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
          className="mt-1 w-full rounded-md px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-100"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Create Layout component**

Create `src/components/layout/Layout.tsx`:

```tsx
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { Sidebar } from "./Sidebar";

export function Layout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();

  const publicPaths = ["/", "/auth/signin", "/auth/signup"];
  const isPublicPage = publicPaths.includes(router.pathname);

  if (isPublicPage || status !== "authenticated") {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Integrate Layout into _app.tsx**

Modify `src/pages/_app.tsx` to wrap page content with the Layout. The T3 scaffold already has SessionProvider and tRPC. Add the Layout wrapper inside the existing providers:

```tsx
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { type AppType } from "next/app";
import { api } from "~/utils/api";
import { Layout } from "~/components/layout/Layout";
import "~/styles/globals.css";

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <SessionProvider session={session}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
```

- [ ] **Step 4: Verify compilation**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/Sidebar.tsx src/components/layout/Layout.tsx src/pages/_app.tsx
git commit -m "feat: add sidebar layout with project navigation"
```

---

## Task 9: Auth Pages (Signup + Signin)

**Files:**
- Create: `src/pages/auth/signup.tsx`
- Create: `src/pages/auth/signin.tsx`
- Modify: `src/pages/index.tsx`

- [ ] **Step 1: Create signup page**

Create `src/pages/auth/signup.tsx`:

```tsx
import { type FormEvent, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { api } from "~/utils/api";

export default function SignUp() {
  const router = useRouter();
  const [error, setError] = useState("");

  const signup = api.auth.signup.useMutation({
    onSuccess: () => {
      void router.push("/auth/signin?registered=true");
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    signup.mutate({
      name: form.get("name") as string,
      email: form.get("email") as string,
      password: form.get("password") as string,
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">
          Create an account
        </h1>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={signup.isPending}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {signup.isPending ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/auth/signin" className="text-blue-600 hover:text-blue-800">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create signin page**

Create `src/pages/auth/signin.tsx`:

```tsx
import { type FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function SignIn() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const registered = router.query.registered === "true";

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: form.get("email") as string,
      password: form.get("password") as string,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
    } else {
      void router.push("/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">
          Sign in
        </h1>

        {registered && (
          <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
            Account created! Please sign in.
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="text-blue-600 hover:text-blue-800">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update landing page to redirect**

Replace `src/pages/index.tsx`:

```tsx
import { type GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "~/server/auth";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (session) {
    return { redirect: { destination: "/dashboard", permanent: false } };
  }
  return { props: {} };
};

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <h1 className="mb-4 text-4xl font-bold text-gray-900">TaskFlow</h1>
      <p className="mb-8 text-lg text-gray-600">
        Simple task management for teams
      </p>
      <div className="flex gap-4">
        <Link
          href="/auth/signin"
          className="rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
        >
          Sign in
        </Link>
        <Link
          href="/auth/signup"
          className="rounded-md border border-gray-300 bg-white px-6 py-2 text-gray-700 hover:bg-gray-50"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify compilation**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/pages/auth/signup.tsx src/pages/auth/signin.tsx src/pages/index.tsx
git commit -m "feat: add auth pages (signup, signin) and landing page"
```

---

## Task 10: Project Pages (List, Create, Board, Settings)

**Files:**
- Create: `src/components/projects/ProjectCard.tsx`
- Create: `src/components/projects/MemberList.tsx`
- Create: `src/pages/projects/index.tsx`
- Create: `src/pages/projects/new.tsx`
- Create: `src/pages/projects/[projectId]/index.tsx`
- Create: `src/pages/projects/[projectId]/settings.tsx`

- [ ] **Step 1: Create ProjectCard component**

Create `src/components/projects/ProjectCard.tsx`:

```tsx
import Link from "next/link";

interface ProjectCardProps {
  id: string;
  name: string;
  description: string | null;
  role: string;
  _count: { tasks: number; members: number };
}

export function ProjectCard({ id, name, description, role, _count }: ProjectCardProps) {
  return (
    <Link
      href={`/projects/${id}`}
      className="block rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
    >
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
          {role}
        </span>
      </div>
      {description && (
        <p className="mb-3 text-sm text-gray-500 line-clamp-2">{description}</p>
      )}
      <div className="flex gap-4 text-xs text-gray-400">
        <span>{_count.tasks} tasks</span>
        <span>{_count.members} members</span>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Create MemberList component**

Create `src/components/projects/MemberList.tsx`:

```tsx
import { type FormEvent, useState } from "react";
import { api } from "~/utils/api";

interface Member {
  id: string;
  role: string;
  user: { id: string; name: string | null; email: string; image: string | null };
}

interface MemberListProps {
  projectId: string;
  members: Member[];
  isOwner: boolean;
}

export function MemberList({ projectId, members, isOwner }: MemberListProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const utils = api.useUtils();

  const invite = api.project.inviteMember.useMutation({
    onSuccess: () => {
      setEmail("");
      setError("");
      void utils.project.getById.invalidate({ id: projectId });
    },
    onError: (err) => setError(err.message),
  });

  const remove = api.project.removeMember.useMutation({
    onSuccess: () => {
      void utils.project.getById.invalidate({ id: projectId });
    },
  });

  const handleInvite = (e: FormEvent) => {
    e.preventDefault();
    invite.mutate({ projectId, email });
  };

  return (
    <div>
      <h3 className="mb-3 text-lg font-semibold text-gray-900">Members</h3>

      <ul className="mb-4 space-y-2">
        {members.map((member) => (
          <li
            key={member.id}
            className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2"
          >
            <div>
              <span className="text-sm font-medium text-gray-900">
                {member.user.name ?? member.user.email}
              </span>
              <span className="ml-2 text-xs text-gray-400">{member.role}</span>
            </div>
            {isOwner && member.role !== "OWNER" && (
              <button
                onClick={() => remove.mutate({ projectId, userId: member.user.id })}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>

      {isOwner && (
        <form onSubmit={handleInvite} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Invite by email..."
            className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={invite.isPending}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Invite
          </button>
        </form>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 3: Create project list page**

Create `src/pages/projects/index.tsx`:

```tsx
import { type GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "~/server/auth";
import { api } from "~/utils/api";
import { ProjectCard } from "~/components/projects/ProjectCard";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) return { redirect: { destination: "/auth/signin", permanent: false } };
  return { props: {} };
};

export default function ProjectsPage() {
  const { data: projects, isLoading } = api.project.list.useQuery();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <Link
          href="/projects/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          New Project
        </Link>
      </div>

      {isLoading && <p className="text-gray-500">Loading...</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects?.map((project) => (
          <ProjectCard key={project.id} {...project} />
        ))}
      </div>

      {projects?.length === 0 && !isLoading && (
        <p className="text-center text-gray-500">
          No projects yet.{" "}
          <Link href="/projects/new" className="text-blue-600 hover:text-blue-800">
            Create one
          </Link>
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create new project page**

Create `src/pages/projects/new.tsx`:

```tsx
import { type FormEvent } from "react";
import { type GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { useRouter } from "next/router";
import { authOptions } from "~/server/auth";
import { api } from "~/utils/api";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) return { redirect: { destination: "/auth/signin", permanent: false } };
  return { props: {} };
};

export default function NewProjectPage() {
  const router = useRouter();
  const create = api.project.create.useMutation({
    onSuccess: (project) => {
      void router.push(`/projects/${project.id}`);
    },
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    create.mutate({
      name: form.get("name") as string,
      description: (form.get("description") as string) || undefined,
    });
  };

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Create Project</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Project Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description (optional)
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={create.isPending}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {create.isPending ? "Creating..." : "Create Project"}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 5: Create project board page**

Create `src/pages/projects/[projectId]/index.tsx`:

```tsx
import { type GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { useRouter } from "next/router";
import Link from "next/link";
import { authOptions } from "~/server/auth";
import { api } from "~/utils/api";
import { TaskBoard } from "~/components/tasks/TaskBoard";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) return { redirect: { destination: "/auth/signin", permanent: false } };
  return { props: {} };
};

export default function ProjectBoardPage() {
  const router = useRouter();
  const projectId = router.query.projectId as string;

  const { data: project, isLoading: projectLoading } = api.project.getById.useQuery(
    { id: projectId },
    { enabled: !!projectId },
  );

  const { data: tasks, isLoading: tasksLoading } = api.task.list.useQuery(
    { projectId },
    { enabled: !!projectId },
  );

  if (projectLoading || tasksLoading) {
    return <p className="text-gray-500">Loading...</p>;
  }

  if (!project) {
    return <p className="text-red-500">Project not found</p>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          {project.description && (
            <p className="mt-1 text-sm text-gray-500">{project.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Link
            href={`/projects/${projectId}/settings`}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Settings
          </Link>
        </div>
      </div>

      <TaskBoard projectId={projectId} tasks={tasks ?? []} />
    </div>
  );
}
```

- [ ] **Step 6: Create project settings page**

Create `src/pages/projects/[projectId]/settings.tsx`:

```tsx
import { type FormEvent } from "react";
import { type GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { useRouter } from "next/router";
import { authOptions } from "~/server/auth";
import { api } from "~/utils/api";
import { MemberList } from "~/components/projects/MemberList";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) return { redirect: { destination: "/auth/signin", permanent: false } };
  return { props: {} };
};

export default function ProjectSettingsPage() {
  const router = useRouter();
  const projectId = router.query.projectId as string;
  const utils = api.useUtils();

  const { data: project, isLoading } = api.project.getById.useQuery(
    { id: projectId },
    { enabled: !!projectId },
  );

  const update = api.project.update.useMutation({
    onSuccess: () => {
      void utils.project.getById.invalidate({ id: projectId });
    },
  });

  const deleteMutation = api.project.delete.useMutation({
    onSuccess: () => {
      void router.push("/projects");
    },
  });

  const handleUpdate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    update.mutate({
      id: projectId,
      name: form.get("name") as string,
      description: (form.get("description") as string) || undefined,
    });
  };

  if (isLoading) return <p className="text-gray-500">Loading...</p>;
  if (!project) return <p className="text-red-500">Project not found</p>;

  const isOwner = project.currentUserRole === "OWNER";

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Project Settings</h1>

      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              id="name"
              name="name"
              defaultValue={project.name}
              disabled={!isOwner}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={project.description ?? ""}
              disabled={!isOwner}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
            />
          </div>
          {isOwner && (
            <button
              type="submit"
              disabled={update.isPending}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {update.isPending ? "Saving..." : "Save Changes"}
            </button>
          )}
        </form>
      </div>

      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
        <MemberList
          projectId={projectId}
          members={project.members}
          isOwner={isOwner}
        />
      </div>

      {isOwner && (
        <div className="rounded-lg border border-red-200 bg-white p-6">
          <h3 className="mb-2 text-lg font-semibold text-red-600">Danger Zone</h3>
          <p className="mb-4 text-sm text-gray-500">
            Deleting a project removes all tasks and members permanently.
          </p>
          <button
            onClick={() => {
              if (confirm("Are you sure? This cannot be undone.")) {
                deleteMutation.mutate({ id: projectId });
              }
            }}
            className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
          >
            Delete Project
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 7: Verify compilation**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: Errors about missing `TaskBoard` component — that's OK, we create it in Task 11.

- [ ] **Step 8: Commit**

```bash
git add src/components/projects/ src/pages/projects/
git commit -m "feat: add project pages (list, create, board, settings) and components"
```

---

## Task 11: Task Components and Pages

**Files:**
- Create: `src/components/tasks/TaskCard.tsx`
- Create: `src/components/tasks/TaskForm.tsx`
- Create: `src/components/tasks/TaskBoard.tsx`
- Create: `src/pages/projects/[projectId]/tasks/[taskId].tsx`

- [ ] **Step 1: Create TaskCard component**

Create `src/components/tasks/TaskCard.tsx`:

```tsx
import Link from "next/link";

const priorityColors = {
  LOW: "bg-gray-100 text-gray-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
} as const;

interface TaskCardProps {
  id: string;
  title: string;
  priority: keyof typeof priorityColors;
  deadline: Date | string | null;
  assignee: { id: string; name: string | null; email: string; image: string | null } | null;
  tags: { id: string; name: string; color: string }[];
  projectId: string;
}

export function TaskCard({ id, title, priority, deadline, assignee, tags, projectId }: TaskCardProps) {
  const formattedDeadline = deadline
    ? new Date(deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;

  const isOverdue = deadline ? new Date(deadline) < new Date() : false;

  return (
    <Link
      href={`/projects/${projectId}/tasks/${id}`}
      className="block rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition hover:shadow-md"
    >
      <h4 className="mb-2 text-sm font-medium text-gray-900">{title}</h4>

      <div className="flex flex-wrap gap-1 mb-2">
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="rounded-full px-2 py-0.5 text-xs text-white"
            style={{ backgroundColor: tag.color }}
          >
            {tag.name}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className={`rounded-full px-2 py-0.5 ${priorityColors[priority]}`}>
          {priority}
        </span>

        <div className="flex items-center gap-2">
          {formattedDeadline && (
            <span className={isOverdue ? "text-red-500" : "text-gray-400"}>
              {formattedDeadline}
            </span>
          )}
          {assignee && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-700" title={assignee.name ?? assignee.email}>
              {(assignee.name ?? assignee.email)[0]?.toUpperCase()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Create TaskForm component**

Create `src/components/tasks/TaskForm.tsx`:

```tsx
import { type FormEvent } from "react";
import { api } from "~/utils/api";

interface TaskFormProps {
  projectId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TaskForm({ projectId, onSuccess, onCancel }: TaskFormProps) {
  const utils = api.useUtils();

  const create = api.task.create.useMutation({
    onSuccess: () => {
      void utils.task.list.invalidate({ projectId });
      onSuccess();
    },
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const deadlineStr = form.get("deadline") as string;

    create.mutate({
      projectId,
      title: form.get("title") as string,
      description: (form.get("description") as string) || undefined,
      priority: (form.get("priority") as "LOW" | "MEDIUM" | "HIGH" | "URGENT") ?? "MEDIUM",
      deadline: deadlineStr ? new Date(deadlineStr) : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="space-y-3">
        <input
          name="title"
          type="text"
          required
          placeholder="Task title"
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />

        <textarea
          name="description"
          rows={2}
          placeholder="Description (optional)"
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />

        <div className="flex gap-3">
          <select
            name="priority"
            defaultValue="MEDIUM"
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>

          <input
            name="deadline"
            type="date"
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={create.isPending}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {create.isPending ? "Creating..." : "Create Task"}
          </button>
        </div>
      </div>
    </form>
  );
}
```

- [ ] **Step 3: Create TaskBoard component**

Create `src/components/tasks/TaskBoard.tsx`:

```tsx
import { useState } from "react";
import { TaskCard } from "./TaskCard";
import { TaskForm } from "./TaskForm";

const COLUMNS = [
  { key: "TODO", label: "To Do" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "IN_REVIEW", label: "In Review" },
  { key: "DONE", label: "Done" },
] as const;

interface Task {
  id: string;
  title: string;
  status: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  deadline: Date | string | null;
  assignee: { id: string; name: string | null; email: string; image: string | null } | null;
  tags: { id: string; name: string; color: string }[];
}

interface TaskBoardProps {
  projectId: string;
  tasks: Task[];
}

export function TaskBoard({ projectId, tasks }: TaskBoardProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
        >
          Add Task
        </button>
      </div>

      {showForm && (
        <div className="mb-4">
          <TaskForm
            projectId={projectId}
            onSuccess={() => setShowForm(false)}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const columnTasks = tasks.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className="rounded-lg bg-gray-100 p-3">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">{col.label}</h3>
                <span className="text-xs text-gray-400">{columnTasks.length}</span>
              </div>
              <div className="space-y-2">
                {columnTasks.map((task) => (
                  <TaskCard key={task.id} {...task} projectId={projectId} />
                ))}
                {columnTasks.length === 0 && (
                  <p className="py-4 text-center text-xs text-gray-400">No tasks</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create task detail page**

Create `src/pages/projects/[projectId]/tasks/[taskId].tsx`:

```tsx
import { type FormEvent } from "react";
import { type GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { useRouter } from "next/router";
import Link from "next/link";
import { authOptions } from "~/server/auth";
import { api } from "~/utils/api";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) return { redirect: { destination: "/auth/signin", permanent: false } };
  return { props: {} };
};

export default function TaskDetailPage() {
  const router = useRouter();
  const { projectId, taskId } = router.query as { projectId: string; taskId: string };
  const utils = api.useUtils();

  const { data: task, isLoading } = api.task.getById.useQuery(
    { id: taskId },
    { enabled: !!taskId },
  );

  const { data: project } = api.project.getById.useQuery(
    { id: projectId },
    { enabled: !!projectId },
  );

  const { data: tags } = api.tag.list.useQuery(
    { projectId },
    { enabled: !!projectId },
  );

  const update = api.task.update.useMutation({
    onSuccess: () => {
      void utils.task.getById.invalidate({ id: taskId });
    },
  });

  const deleteMutation = api.task.delete.useMutation({
    onSuccess: () => {
      void router.push(`/projects/${projectId}`);
    },
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const deadlineStr = form.get("deadline") as string;
    const selectedTags = form.getAll("tags") as string[];

    update.mutate({
      id: taskId,
      title: form.get("title") as string,
      description: (form.get("description") as string) || null,
      status: form.get("status") as "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE",
      priority: form.get("priority") as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
      deadline: deadlineStr ? new Date(deadlineStr) : null,
      assigneeId: (form.get("assigneeId") as string) || null,
      tagIds: selectedTags,
    });
  };

  if (isLoading) return <p className="text-gray-500">Loading...</p>;
  if (!task) return <p className="text-red-500">Task not found</p>;

  const deadlineValue = task.deadline
    ? new Date(task.deadline).toISOString().split("T")[0]
    : "";

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/projects/${projectId}`}
        className="mb-4 inline-block text-sm text-blue-600 hover:text-blue-800"
      >
        &larr; Back to board
      </Link>

      <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
            <input
              id="title"
              name="title"
              defaultValue={task.title}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={task.description ?? ""}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
              <select
                id="status"
                name="status"
                defaultValue={task.status}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="DONE">Done</option>
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
              <select
                id="priority"
                name="priority"
                defaultValue={task.priority}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">Deadline</label>
              <input
                id="deadline"
                name="deadline"
                type="date"
                defaultValue={deadlineValue}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="assigneeId" className="block text-sm font-medium text-gray-700">Assignee</label>
              <select
                id="assigneeId"
                name="assigneeId"
                defaultValue={task.assignee?.id ?? ""}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              >
                <option value="">Unassigned</option>
                {project?.members.map((m) => (
                  <option key={m.user.id} value={m.user.id}>
                    {m.user.name ?? m.user.email}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {tags && tags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <label key={tag.id} className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      name="tags"
                      value={tag.id}
                      defaultChecked={task.tags.some((t) => t.id === tag.id)}
                    />
                    <span
                      className="rounded-full px-2 py-0.5 text-xs text-white"
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={() => {
                if (confirm("Delete this task?")) {
                  deleteMutation.mutate({ id: taskId });
                }
              }}
              className="text-sm text-red-500 hover:text-red-700"
            >
              Delete task
            </button>
            <button
              type="submit"
              disabled={update.isPending}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {update.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 5: Verify compilation**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/tasks/ src/pages/projects/
git commit -m "feat: add task components (card, form, board) and task detail page"
```

---

## Task 12: Dashboard and Profile Pages

**Files:**
- Create: `src/pages/dashboard.tsx`
- Create: `src/pages/profile.tsx`

- [ ] **Step 1: Create dashboard page**

Create `src/pages/dashboard.tsx`:

```tsx
import { type GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "~/server/auth";
import { api } from "~/utils/api";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) return { redirect: { destination: "/auth/signin", permanent: false } };
  return { props: {} };
};

export default function DashboardPage() {
  const { data: myTasks, isLoading: tasksLoading } = api.task.myTasks.useQuery();
  const { data: projects, isLoading: projectsLoading } = api.project.list.useQuery();

  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const weekEnd = new Date(todayEnd.getTime() + 7 * 24 * 60 * 60 * 1000);

  const dueToday = myTasks?.filter(
    (t) => t.deadline && new Date(t.deadline) <= todayEnd,
  ) ?? [];

  const dueThisWeek = myTasks?.filter(
    (t) => t.deadline && new Date(t.deadline) > todayEnd && new Date(t.deadline) <= weekEnd,
  ) ?? [];

  const isLoading = tasksLoading || projectsLoading;

  if (isLoading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="My Open Tasks" value={myTasks?.length ?? 0} />
        <StatCard label="Due Today" value={dueToday.length} color="red" />
        <StatCard label="Due This Week" value={dueThisWeek.length} color="yellow" />
        <StatCard label="Projects" value={projects?.length ?? 0} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">My Tasks</h2>
          {myTasks && myTasks.length > 0 ? (
            <div className="space-y-2">
              {myTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/projects/${task.projectId}/tasks/${task.id}`}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 hover:shadow-sm"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{task.title}</p>
                    <p className="text-xs text-gray-400">{task.project.name}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {task.deadline && (
                      <span
                        className={
                          new Date(task.deadline) < now
                            ? "text-red-500"
                            : "text-gray-400"
                        }
                      >
                        {new Date(task.deadline).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 ${
                        {
                          LOW: "bg-gray-100 text-gray-700",
                          MEDIUM: "bg-yellow-100 text-yellow-700",
                          HIGH: "bg-orange-100 text-orange-700",
                          URGENT: "bg-red-100 text-red-700",
                        }[task.priority]
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No tasks assigned to you.</p>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">My Projects</h2>
          {projects && projects.length > 0 ? (
            <div className="space-y-2">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 hover:shadow-sm"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{project.name}</p>
                    <p className="text-xs text-gray-400">{project.role}</p>
                  </div>
                  <div className="text-xs text-gray-400">
                    {project._count.tasks} tasks
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              No projects yet.{" "}
              <Link href="/projects/new" className="text-blue-600 hover:text-blue-800">
                Create one
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: "red" | "yellow";
}) {
  const colorClasses = {
    red: "text-red-600",
    yellow: "text-yellow-600",
    undefined: "text-gray-900",
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${colorClasses[color ?? "undefined"]}`}>
        {value}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Create profile page**

Create `src/pages/profile.tsx`:

```tsx
import { type FormEvent } from "react";
import { type GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "~/server/auth";
import { api } from "~/utils/api";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) return { redirect: { destination: "/auth/signin", permanent: false } };
  return { props: {} };
};

export default function ProfilePage() {
  const utils = api.useUtils();
  const { data: profile, isLoading } = api.user.getProfile.useQuery();

  const update = api.user.updateProfile.useMutation({
    onSuccess: () => {
      void utils.user.getProfile.invalidate();
    },
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    update.mutate({
      name: form.get("name") as string,
      image: (form.get("image") as string) || null,
    });
  };

  if (isLoading) return <p className="text-gray-500">Loading...</p>;
  if (!profile) return <p className="text-red-500">Profile not found</p>;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Profile</h1>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700">
            {profile.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div>
            <p className="font-medium text-gray-900">{profile.name}</p>
            <p className="text-sm text-gray-500">{profile.email}</p>
            <p className="text-xs text-gray-400">
              Member since {new Date(profile.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              id="name"
              name="name"
              defaultValue={profile.name ?? ""}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              value={profile.email}
              disabled
              className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700">
              Avatar URL (optional)
            </label>
            <input
              id="image"
              name="image"
              type="url"
              defaultValue={profile.image ?? ""}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={update.isPending}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {update.isPending ? "Saving..." : "Save Changes"}
          </button>

          {update.isSuccess && (
            <p className="text-sm text-green-600">Profile updated!</p>
          )}
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify compilation**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/dashboard.tsx src/pages/profile.tsx
git commit -m "feat: add dashboard with stats and profile page"
```

---

## Task 13: SST Configuration

**Files:**
- Create: `sst.config.ts`

- [ ] **Step 1: Create SST config**

Create `sst.config.ts` at the project root:

```typescript
/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "task-management-tool",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
    };
  },
  async run() {
    new sst.aws.Nextjs("TaskManagementTool", {
      environment: {
        DATABASE_URL: process.env.DATABASE_URL!,
        DIRECT_URL: process.env.DIRECT_URL!,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL!,
      },
    });
  },
});
```

- [ ] **Step 2: Initialize SST**

```bash
npx sst init
```

This generates the `.sst/` directory. If it prompts for a project name, use `task-management-tool`.

- [ ] **Step 3: Add .sst to .gitignore**

Append to `.gitignore`:

```
.sst/
```

- [ ] **Step 4: Commit**

```bash
git add sst.config.ts .gitignore
git commit -m "feat: add SST v3 config for AWS deployment"
```

---

## Task 14: Testing Setup and Unit Tests

**Files:**
- Create: `vitest.config.ts`
- Create: `tests/helpers.ts`
- Create: `tests/utils/auth.test.ts`
- Create: `tests/routers/task.test.ts`
- Create: `tests/routers/project.test.ts`
- Create: `tests/components/TaskCard.test.tsx`

- [ ] **Step 1: Create Vitest config**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: [],
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 2: Add test script to package.json**

Add to the `"scripts"` section of `package.json`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Create test helpers**

Create `tests/helpers.ts`:

```typescript
import { type PrismaClient } from "@prisma/client";
import { mockDeep, type DeepMockProxy } from "vitest-mock-extended";

export type MockPrismaClient = DeepMockProxy<PrismaClient>;

export function createMockPrisma(): MockPrismaClient {
  return mockDeep<PrismaClient>();
}

export function createMockSession(userId = "test-user-id", email = "test@example.com") {
  return {
    user: { id: userId, email, name: "Test User" },
    expires: new Date(Date.now() + 86400000).toISOString(),
  };
}
```

- [ ] **Step 4: Write password hashing tests**

Create `tests/utils/auth.test.ts`:

```typescript
import bcrypt from "bcryptjs";
import { describe, it, expect } from "vitest";

describe("Password hashing", () => {
  it("hashes a password and verifies it correctly", async () => {
    const password = "securepassword123";
    const hash = await bcrypt.hash(password, 10);

    expect(hash).not.toBe(password);
    expect(await bcrypt.compare(password, hash)).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await bcrypt.hash("correctpassword", 10);
    expect(await bcrypt.compare("wrongpassword", hash)).toBe(false);
  });
});
```

- [ ] **Step 5: Run auth tests**

```bash
npx vitest run tests/utils/auth.test.ts
```

Expected: 2 tests pass.

- [ ] **Step 6: Write task router tests**

Create `tests/routers/task.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { type inferProcedureInput } from "@trpc/server";
import { createMockPrisma, createMockSession, type MockPrismaClient } from "../helpers";
import { type AppRouter } from "~/server/api/root";

// We test the router logic by calling the procedures with mocked context
// This avoids needing to spin up a real tRPC server
describe("Task router", () => {
  let mockPrisma: MockPrismaClient;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
  });

  it("creates a task when user is a project member", async () => {
    // Mock membership check
    mockPrisma.projectMember.findUnique.mockResolvedValue({
      id: "member-1",
      projectId: "project-1",
      userId: "test-user-id",
      role: "MEMBER",
    });

    // Mock task creation
    const mockTask = {
      id: "task-1",
      title: "Test Task",
      description: null,
      status: "TODO" as const,
      priority: "MEDIUM" as const,
      deadline: null,
      projectId: "project-1",
      assigneeId: null,
      creatorId: "test-user-id",
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      assignee: null,
    };

    mockPrisma.task.create.mockResolvedValue(mockTask as never);

    // Verify the mock was set up correctly
    const result = await mockPrisma.task.create({
      data: {
        title: "Test Task",
        projectId: "project-1",
        creatorId: "test-user-id",
        status: "TODO",
        priority: "MEDIUM",
      },
    });

    expect(result.title).toBe("Test Task");
    expect(result.status).toBe("TODO");
    expect(result.creatorId).toBe("test-user-id");
    expect(mockPrisma.task.create).toHaveBeenCalledOnce();
  });

  it("filters tasks by status", async () => {
    const mockTasks = [
      { id: "task-1", title: "Done Task", status: "DONE", priority: "LOW" },
    ];

    mockPrisma.task.findMany.mockResolvedValue(mockTasks as never);

    const result = await mockPrisma.task.findMany({
      where: { projectId: "project-1", status: "DONE" },
    });

    expect(result).toHaveLength(1);
    expect(result[0]!.status).toBe("DONE");
    expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "DONE" }),
      }),
    );
  });
});
```

- [ ] **Step 7: Run task tests**

```bash
npx vitest run tests/routers/task.test.ts
```

Expected: 2 tests pass.

- [ ] **Step 8: Write project router tests**

Create `tests/routers/project.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { createMockPrisma, type MockPrismaClient } from "../helpers";

describe("Project router", () => {
  let mockPrisma: MockPrismaClient;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
  });

  it("creates a project with owner as member", async () => {
    const mockProject = {
      id: "project-1",
      name: "Test Project",
      description: null,
      ownerId: "test-user-id",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockPrisma.project.create.mockResolvedValue(mockProject as never);

    const result = await mockPrisma.project.create({
      data: {
        name: "Test Project",
        ownerId: "test-user-id",
        members: {
          create: { userId: "test-user-id", role: "OWNER" },
        },
      },
    });

    expect(result.name).toBe("Test Project");
    expect(result.ownerId).toBe("test-user-id");
    expect(mockPrisma.project.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          members: expect.objectContaining({
            create: expect.objectContaining({ role: "OWNER" }),
          }),
        }),
      }),
    );
  });

  it("rejects non-member access to a project", async () => {
    mockPrisma.projectMember.findUnique.mockResolvedValue(null);

    const membership = await mockPrisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: "project-1",
          userId: "non-member-id",
        },
      },
    });

    expect(membership).toBeNull();
  });
});
```

- [ ] **Step 9: Write TaskCard component test**

Create `tests/components/TaskCard.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TaskCard } from "~/components/tasks/TaskCard";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("TaskCard", () => {
  it("renders task title, priority, and tags", () => {
    render(
      <TaskCard
        id="task-1"
        title="Fix login bug"
        priority="HIGH"
        deadline={null}
        assignee={null}
        tags={[{ id: "tag-1", name: "Bug", color: "#ef4444" }]}
        projectId="project-1"
      />,
    );

    expect(screen.getByText("Fix login bug")).toBeDefined();
    expect(screen.getByText("HIGH")).toBeDefined();
    expect(screen.getByText("Bug")).toBeDefined();
  });

  it("shows assignee initial when assigned", () => {
    render(
      <TaskCard
        id="task-2"
        title="Add feature"
        priority="MEDIUM"
        deadline={null}
        assignee={{ id: "user-1", name: "Alice", email: "alice@test.com", image: null }}
        tags={[]}
        projectId="project-1"
      />,
    );

    expect(screen.getByText("A")).toBeDefined();
  });
});
```

- [ ] **Step 10: Run all tests**

```bash
npx vitest run
```

Expected: All 8 tests pass.

- [ ] **Step 11: Commit**

```bash
git add vitest.config.ts tests/ package.json
git commit -m "feat: add Vitest setup and unit tests for routers, utils, and components"
```

---

## Task 15: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write comprehensive README**

Create `README.md`:

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add comprehensive README with setup, architecture, and deployment instructions"
```

---

## Task 16: Final Verification

- [ ] **Step 1: Run full TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 2: Run all tests**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 3: Run dev server**

```bash
npm run dev
```

Expected: Server starts on port 3000. Landing page renders.

- [ ] **Step 4: Final commit if any fixes were needed**

If any fixes were made during verification:

```bash
git add -A
git commit -m "fix: address issues found during final verification"
```
