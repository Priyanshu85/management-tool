import { forwardRef } from "react";
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
  isDragging?: boolean;
}

export const TaskCard = forwardRef<HTMLDivElement, TaskCardProps>(
  function TaskCard({ id, title, priority, deadline, assignee, tags, projectId, isDragging, ...props }, ref) {
    const formattedDeadline = deadline
      ? new Date(deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : null;

    const isOverdue = deadline ? new Date(deadline) < new Date() : false;

    return (
      <div ref={ref} {...props}>
        <Link
          href={`/projects/${projectId}/tasks/${id}`}
          className={`block rounded-lg border bg-white p-3 shadow-sm transition hover:shadow-md ${
            isDragging ? "border-blue-400 shadow-lg ring-2 ring-blue-200" : "border-gray-200"
          }`}
        >
          <h4 className="mb-2 text-sm font-medium text-gray-900">{title}</h4>
          <div className="flex flex-wrap gap-1 mb-2">
            {tags.map((tag) => (
              <span key={tag.id} className="rounded-full px-2 py-0.5 text-xs text-white" style={{ backgroundColor: tag.color }}>
                {tag.name}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className={`rounded-full px-2 py-0.5 ${priorityColors[priority]}`}>{priority}</span>
            <div className="flex items-center gap-2">
              {formattedDeadline && (
                <span className={isOverdue ? "text-red-500" : "text-gray-400"}>{formattedDeadline}</span>
              )}
              {assignee && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-700" title={assignee.name ?? assignee.email}>
                  {(assignee.name ?? assignee.email)[0]?.toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </Link>
      </div>
    );
  },
);
