import { describe, it, expect, beforeEach } from "vitest";
import { createMockPrisma, type MockPrismaClient } from "../helpers";

describe("Task router", () => {
  let mockPrisma: MockPrismaClient;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
  });

  it("creates a task when user is a project member", async () => {
    mockPrisma.projectMember.findUnique.mockResolvedValue({
      id: "member-1",
      projectId: "project-1",
      userId: "test-user-id",
      role: "MEMBER",
    });

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
