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

function BoardSkeleton() {
  return (
    <div>
      {/* Header skeleton */}
      <div className="mb-4 flex items-center justify-between">
        <div className="h-5 w-16 animate-pulse rounded bg-gray-200" />
        <div className="h-8 w-20 animate-pulse rounded-md bg-gray-200" />
      </div>
      {/* Columns skeleton */}
      <div className="grid grid-cols-4 gap-4">
        {["To Do", "In Progress", "In Review", "Done"].map((label) => (
          <div key={label} className="rounded-lg bg-gray-100 p-3">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">{label}</span>
              <div className="h-4 w-4 animate-pulse rounded bg-gray-200" />
            </div>
            <div className="space-y-2">
              {[0, 1].map((i) => (
                <div key={i} className="rounded-lg border border-gray-200 bg-white p-3">
                  <div className="mb-2 h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                  <div className="flex items-center justify-between">
                    <div className="h-5 w-14 animate-pulse rounded-full bg-gray-200" />
                    <div className="h-5 w-5 animate-pulse rounded-full bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HeaderSkeleton() {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <div className="h-7 w-48 animate-pulse rounded bg-gray-200" />
        <div className="mt-2 h-4 w-64 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="h-9 w-20 animate-pulse rounded-md bg-gray-200" />
    </div>
  );
}

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

  const isLoading = projectLoading || tasksLoading;

  if (isLoading) {
    return (
      <div>
        <HeaderSkeleton />
        <BoardSkeleton />
      </div>
    );
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
