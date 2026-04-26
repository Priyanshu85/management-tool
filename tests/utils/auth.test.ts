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
