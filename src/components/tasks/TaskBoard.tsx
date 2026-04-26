import { useState, useMemo, useCallback, memo } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { TaskCard } from "./TaskCard";
import { TaskForm } from "./TaskForm";
import { api } from "~/utils/api";

const COLUMNS = [
  { key: "TODO", label: "To Do" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "IN_REVIEW", label: "In Review" },
  { key: "DONE", label: "Done" },
] as const;

type Status = (typeof COLUMNS)[number]["key"];

interface Task {
  id: string;
  title: string;
  status: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  deadline: Date | string | null;
  assignee: { id: string; name: string | null; email: string; image: string | null } | null;
  tags: { id: string; name: string; color: string }[];
}

interface TaskBoardProps {
  projectId: string;
  tasks: Task[];
}

/* ── Memoized column to prevent sibling re-renders during drag ── */
const Column = memo(function Column({
  columnKey,
  label,
  tasks,
  projectId,
}: {
  columnKey: string;
  label: string;
  tasks: Task[];
  projectId: string;
}) {
  return (
    <Droppable droppableId={columnKey}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`rounded-lg p-3 transition-colors duration-150 ${
            snapshot.isDraggingOver
              ? "bg-blue-50 ring-2 ring-blue-200/60"
              : "bg-gray-100"
          }`}
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">{label}</h3>
            <span className="rounded-full bg-gray-200/60 px-1.5 py-0.5 text-xs tabular-nums text-gray-500">
              {tasks.length}
            </span>
          </div>
          <div className="min-h-[40px] space-y-2">
            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(provided, snapshot) => (
                  <TaskCard
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    {...task}
                    projectId={projectId}
                    isDragging={snapshot.isDragging}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <p className="py-4 text-center text-xs text-gray-400">No tasks</p>
            )}
          </div>
        </div>
      )}
    </Droppable>
  );
});

export function TaskBoard({ projectId, tasks }: TaskBoardProps) {
  const [showForm, setShowForm] = useState(false);
  const utils = api.useUtils();

  const updateTask = api.task.update.useMutation({
    onMutate: async ({ id, status }) => {
      await utils.task.list.cancel({ projectId });
      const previousTasks = utils.task.list.getData({ projectId });
      utils.task.list.setData({ projectId }, (old) =>
        old?.map((t) => (t.id === id ? { ...t, status: status ?? t.status } : t)),
      );
      return { previousTasks };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTasks) {
        utils.task.list.setData({ projectId }, context.previousTasks);
      }
    },
    onSettled: () => {
      void utils.task.list.invalidate({ projectId });
    },
  });

  // Pre-group tasks by status so columns don't re-filter on every render
  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    for (const col of COLUMNS) {
      grouped[col.key] = [];
    }
    for (const task of tasks) {
      if (grouped[task.status]) {
        grouped[task.status]!.push(task);
      }
    }
    return grouped;
  }, [tasks]);

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      const { destination, source, draggableId } = result;

      if (!destination) return;
      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      ) {
        return;
      }

      // Even if same column, allow reorder visually (status stays same)
      // Only call API if status actually changed
      if (destination.droppableId !== source.droppableId) {
        const newStatus = destination.droppableId as Status;
        updateTask.mutate({ id: draggableId, status: newStatus });
      }
    },
    [updateTask],
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
        >
          Add Task
        </button>
      </div>
      {showForm && (
        <div className="mb-4">
          <TaskForm
            projectId={projectId}
            onSuccess={() => setShowForm(false)}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-4 gap-4">
          {COLUMNS.map((col) => (
            <Column
              key={col.key}
              columnKey={col.key}
              label={col.label}
              tasks={tasksByStatus[col.key] ?? []}
              projectId={projectId}
            />
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
