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
