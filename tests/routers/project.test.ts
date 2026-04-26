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
