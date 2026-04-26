import { type FormEvent } from "react";
import { api } from "~/utils/api";

interface TaskFormProps {
  projectId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TaskForm({ projectId, onSuccess, onCancel }: TaskFormProps) {
  const utils = api.useUtils();

  const create = api.task.create.useMutation({
    onSuccess: () => {
      void utils.task.list.invalidate({ projectId });
      onSuccess();
    },
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const deadlineStr = form.get("deadline") as string;

    create.mutate({
      projectId,
      title: form.get("title") as string,
      description: (form.get("description") as string) || undefined,
      priority: (form.get("priority") as "LOW" | "MEDIUM" | "HIGH" | "URGENT") ?? "MEDIUM",
      deadline: deadlineStr ? new Date(deadlineStr) : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="space-y-3">
        <input name="title" type="text" required placeholder="Task title" className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
        <textarea name="description" rows={2} placeholder="Description (optional)" className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
        <div className="flex gap-3">
          <select name="priority" defaultValue="MEDIUM" className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none">
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
          <input name="deadline" type="date" className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none" />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={create.isPending} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50">
            {create.isPending ? "Creating..." : "Create Task"}
          </button>
        </div>
      </div>
    </form>
  );
}
