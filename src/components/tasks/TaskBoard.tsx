import { useState } from "react";
import { TaskCard } from "./TaskCard";
import { TaskForm } from "./TaskForm";

const COLUMNS = [
  { key: "TODO", label: "To Do" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "IN_REVIEW", label: "In Review" },
  { key: "DONE", label: "Done" },
] as const;

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

export function TaskBoard({ projectId, tasks }: TaskBoardProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
        <button onClick={() => setShowForm(true)} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">
          Add Task
        </button>
      </div>
      {showForm && (
        <div className="mb-4">
          <TaskForm projectId={projectId} onSuccess={() => setShowForm(false)} onCancel={() => setShowForm(false)} />
        </div>
      )}
      <div className="grid grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const columnTasks = tasks.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className="rounded-lg bg-gray-100 p-3">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">{col.label}</h3>
                <span className="text-xs text-gray-400">{columnTasks.length}</span>
              </div>
              <div className="space-y-2">
                {columnTasks.map((task) => (
                  <TaskCard key={task.id} {...task} projectId={projectId} />
                ))}
                {columnTasks.length === 0 && (
                  <p className="py-4 text-center text-xs text-gray-400">No tasks</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
