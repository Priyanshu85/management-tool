import { type GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { useRouter } from "next/router";
import Link from "next/link";
import { authOptions } from "~/server/auth";
import { api } from "~/utils/api";
import { TaskBoard } from "~/components/tasks/TaskBoard";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) return { redirect: { destination: "/auth/signin", permanent: false } };
  return { props: {} };
};

export default function ProjectBoardPage() {
  const router = useRouter();
  const projectId = router.query.projectId as string;

  const { data: project, isLoading: projectLoading } = api.project.getById.useQuery(
    { id: projectId },
    { enabled: !!projectId },
  );

  const { data: tasks, isLoading: tasksLoading } = api.task.list.useQuery(
    { projectId },
    { enabled: !!projectId },
  );

  if (projectLoading || tasksLoading) {
    return <p className="text-gray-500">Loading...</p>;
  }

  if (!project) {
    return <p className="text-red-500">Project not found</p>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          {project.description && (
            <p className="mt-1 text-sm text-gray-500">{project.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Link
            href={`/projects/${projectId}/settings`}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Settings
          </Link>
        </div>
      </div>
      <TaskBoard projectId={projectId} tasks={tasks ?? []} />
    </div>
  );
}
