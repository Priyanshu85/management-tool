import { forwardRef, memo, useCallback, useRef } from "react";
import { useRouter } from "next/router";

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
  assignee: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
  tags: { id: string; name: string; color: string }[];
  projectId: string;
  isDragging?: boolean;
}

export const TaskCard = memo(
  forwardRef<HTMLDivElement, TaskCardProps>(function TaskCard(
    { id, title, priority, deadline, assignee, tags, projectId, isDragging, ...props },
    ref,
  ) {
    const router = useRouter();
    const pointerStart = useRef<{ x: number; y: number } | null>(null);

    const formattedDeadline = deadline
      ? new Date(deadline).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      : null;

    const isOverdue = deadline ? new Date(deadline) < new Date() : false;

    // Track pointer start to distinguish click from drag
    const handlePointerDown = useCallback((e: React.PointerEvent) => {
      pointerStart.current = { x: e.clientX, y: e.clientY };
    }, []);

    // Only navigate if pointer didn't move (i.e. it was a click, not a drag)
    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        if (!pointerStart.current) return;
        const dx = Math.abs(e.clientX - pointerStart.current.x);
        const dy = Math.abs(e.clientY - pointerStart.current.y);
        pointerStart.current = null;
        // If pointer moved more than 5px in any direction, it was a drag — don't navigate
        if (dx > 5 || dy > 5) return;
        void router.push(`/projects/${projectId}/tasks/${id}`);
      },
      [router, projectId, id],
    );

    return (
      <div
        ref={ref}
        {...props}
        onPointerDown={handlePointerDown}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        className={isDragging ? "will-change-transform" : ""}
        style={{
          ...(props as Record<string, unknown>).style as React.CSSProperties | undefined,
          cursor: isDragging ? "grabbing" : "grab",
        }}
      >
        <div
          className={`rounded-lg border bg-white p-3 select-none ${
            isDragging
              ? "border-blue-400 shadow-xl ring-2 ring-blue-200/70 scale-[1.02] rotate-[1deg]"
              : "border-gray-200 shadow-sm hover:shadow-md"
          }`}
          style={{
            transition: isDragging ? "none" : "box-shadow 150ms ease, border-color 150ms ease",
          }}
        >
          <h4 className="mb-2 text-sm font-medium text-gray-900">{title}</h4>
          {tags.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1">
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
          )}
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
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-700"
                  title={assignee.name ?? assignee.email}
                >
                  {(assignee.name ?? assignee.email)[0]?.toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }),
);
