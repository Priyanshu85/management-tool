import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

const assertProjectMember = async (
  db: any,
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
