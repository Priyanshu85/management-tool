import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TaskCard } from "~/components/tasks/TaskCard";

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
