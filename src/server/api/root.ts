import { createTRPCRouter } from "~/server/api/trpc";
import { authRouter } from "~/server/api/routers/auth";
import { projectRouter } from "~/server/api/routers/project";
import { taskRouter } from "~/server/api/routers/task";
import { tagRouter } from "~/server/api/routers/tag";
import { userRouter } from "~/server/api/routers/user";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  auth: authRouter,
  project: projectRouter,
  task: taskRouter,
  tag: tagRouter,
  user: userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
