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
