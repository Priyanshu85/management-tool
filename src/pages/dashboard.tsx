import { type GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "~/server/auth";
import { api } from "~/utils/api";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) return { redirect: { destination: "/auth/signin", permanent: false } };
  return { props: {} };
};

export default function DashboardPage() {
  const { data: myTasks, isLoading: tasksLoading } = api.task.myTasks.useQuery();
  const { data: projects, isLoading: projectsLoading } = api.project.list.useQuery();

  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const weekEnd = new Date(todayEnd.getTime() + 7 * 24 * 60 * 60 * 1000);

  const dueToday = myTasks?.filter(
    (t) => t.deadline && new Date(t.deadline) <= todayEnd,
  ) ?? [];

  const dueThisWeek = myTasks?.filter(
    (t) => t.deadline && new Date(t.deadline) > todayEnd && new Date(t.deadline) <= weekEnd,
  ) ?? [];

  const isLoading = tasksLoading || projectsLoading;

  if (isLoading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="My Open Tasks" value={myTasks?.length ?? 0} />
        <StatCard label="Due Today" value={dueToday.length} color="red" />
        <StatCard label="Due This Week" value={dueThisWeek.length} color="yellow" />
        <StatCard label="Projects" value={projects?.length ?? 0} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">My Tasks</h2>
          {myTasks && myTasks.length > 0 ? (
            <div className="space-y-2">
              {myTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/projects/${task.projectId}/tasks/${task.id}`}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 hover:shadow-sm"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{task.title}</p>
                    <p className="text-xs text-gray-400">{task.project.name}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {task.deadline && (
                      <span className={new Date(task.deadline) < now ? "text-red-500" : "text-gray-400"}>
                        {new Date(task.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    )}
                    <span className={`rounded-full px-2 py-0.5 ${{
                      LOW: "bg-gray-100 text-gray-700",
                      MEDIUM: "bg-yellow-100 text-yellow-700",
                      HIGH: "bg-orange-100 text-orange-700",
                      URGENT: "bg-red-100 text-red-700",
                    }[task.priority]}`}>
                      {task.priority}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No tasks assigned to you.</p>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">My Projects</h2>
          {projects && projects.length > 0 ? (
            <div className="space-y-2">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 hover:shadow-sm"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{project.name}</p>
                    <p className="text-xs text-gray-400">{project.role}</p>
                  </div>
                  <div className="text-xs text-gray-400">{project._count.tasks} tasks</div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              No projects yet.{" "}
              <Link href="/projects/new" className="text-blue-600 hover:text-blue-800">Create one</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color?: "red" | "yellow" }) {
  const colorClasses = {
    red: "text-red-600",
    yellow: "text-yellow-600",
    undefined: "text-gray-900",
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${colorClasses[color ?? "undefined"]}`}>{value}</p>
    </div>
  );
}
