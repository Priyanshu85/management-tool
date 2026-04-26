import { type FormEvent } from "react";
import { type GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { useRouter } from "next/router";
import Link from "next/link";
import { authOptions } from "~/server/auth";
import { api } from "~/utils/api";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) return { redirect: { destination: "/auth/signin", permanent: false } };
  return { props: {} };
};

export default function TaskDetailPage() {
  const router = useRouter();
  const { projectId, taskId } = router.query as { projectId: string; taskId: string };
  const utils = api.useUtils();

  const { data: task, isLoading } = api.task.getById.useQuery(
    { id: taskId },
    { enabled: !!taskId },
  );

  const { data: project } = api.project.getById.useQuery(
    { id: projectId },
    { enabled: !!projectId },
  );

  const { data: tags } = api.tag.list.useQuery(
    { projectId },
    { enabled: !!projectId },
  );

  const update = api.task.update.useMutation({
    onSuccess: () => {
      void utils.task.getById.invalidate({ id: taskId });
    },
  });

  const deleteMutation = api.task.delete.useMutation({
    onSuccess: () => {
      void router.push(`/projects/${projectId}`);
    },
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const deadlineStr = form.get("deadline") as string;
    const selectedTags = form.getAll("tags") as string[];

    update.mutate({
      id: taskId,
      title: form.get("title") as string,
      description: (form.get("description") as string) || null,
      status: form.get("status") as "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE",
      priority: form.get("priority") as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
      deadline: deadlineStr ? new Date(deadlineStr) : null,
      assigneeId: (form.get("assigneeId") as string) || null,
      tagIds: selectedTags,
    });
  };

  if (isLoading) return <p className="text-gray-500">Loading...</p>;
  if (!task) return <p className="text-red-500">Task not found</p>;

  const deadlineValue = task.deadline
    ? new Date(task.deadline).toISOString().split("T")[0]
    : "";

  return (
    <div className="mx-auto max-w-2xl">
      <Link href={`/projects/${projectId}`} className="mb-4 inline-block text-sm text-blue-600 hover:text-blue-800">
        &larr; Back to board
      </Link>

      <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
            <input id="title" name="title" defaultValue={task.title} required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none" />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea id="description" name="description" rows={4} defaultValue={task.description ?? ""} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
              <select id="status" name="status" defaultValue={task.status} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none">
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="DONE">Done</option>
              </select>
            </div>
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
              <select id="priority" name="priority" defaultValue={task.priority} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">Deadline</label>
              <input id="deadline" name="deadline" type="date" defaultValue={deadlineValue} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label htmlFor="assigneeId" className="block text-sm font-medium text-gray-700">Assignee</label>
              <select id="assigneeId" name="assigneeId" defaultValue={task.assignee?.id ?? ""} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none">
                <option value="">Unassigned</option>
                {project?.members.map((m) => (
                  <option key={m.user.id} value={m.user.id}>
                    {m.user.name ?? m.user.email}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {tags && tags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <label key={tag.id} className="flex items-center gap-1 text-sm">
                    <input type="checkbox" name="tags" value={tag.id} defaultChecked={task.tags.some((t) => t.id === tag.id)} />
                    <span className="rounded-full px-2 py-0.5 text-xs text-white" style={{ backgroundColor: tag.color }}>{tag.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-gray-200 pt-4">
            <button type="button" onClick={() => { if (confirm("Delete this task?")) { deleteMutation.mutate({ id: taskId }); } }} className="text-sm text-red-500 hover:text-red-700">
              Delete task
            </button>
            <button type="submit" disabled={update.isPending} className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">
              {update.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
