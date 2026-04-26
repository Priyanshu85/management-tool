import { type GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { authOptions } from "~/server/auth";
import { api } from "~/utils/api";
import { Skeleton } from "boneyard-js/react";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) return { redirect: { destination: "/auth/signin", permanent: false } };
  return { props: {} };
};

const priorityConfig = {
  LOW: { bg: "bg-gray-50", text: "text-gray-600", dot: "bg-gray-400" },
  MEDIUM: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
  HIGH: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-400" },
  URGENT: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-400" },
} as const;

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data: myTasks, isLoading: tasksLoading } = api.task.myTasks.useQuery();
  const { data: projects, isLoading: projectsLoading } = api.project.list.useQuery();

  const isLoading = tasksLoading || projectsLoading;

  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const weekEnd = new Date(todayEnd.getTime() + 7 * 24 * 60 * 60 * 1000);

  const dueToday = myTasks?.filter(
    (t) => t.deadline && new Date(t.deadline) <= todayEnd,
  ) ?? [];

  const dueThisWeek = myTasks?.filter(
    (t) => t.deadline && new Date(t.deadline) > todayEnd && new Date(t.deadline) <= weekEnd,
  ) ?? [];

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";
  const greeting = getGreeting();

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {greeting}, {firstName}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Here&apos;s what&apos;s happening across your projects.
        </p>
      </div>

      {/* Stats Grid */}
      <Skeleton loading={isLoading} name="dashboard-stats" animate="shimmer" transition={300}>
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Open Tasks"
            value={myTasks?.length ?? 0}
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
              </svg>
            }
            iconColor="text-blue-600 bg-blue-50"
          />
          <StatCard
            label="Due Today"
            value={dueToday.length}
            variant={dueToday.length > 0 ? "warning" : "default"}
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            }
            iconColor="text-red-600 bg-red-50"
          />
          <StatCard
            label="Due This Week"
            value={dueThisWeek.length}
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
            }
            iconColor="text-amber-600 bg-amber-50"
          />
          <StatCard
            label="Projects"
            value={projects?.length ?? 0}
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
              </svg>
            }
            iconColor="text-emerald-600 bg-emerald-50"
          />
        </div>
      </Skeleton>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* My Tasks - 3/5 width */}
        <div className="lg:col-span-3">
          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-900">My Tasks</h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                {myTasks?.length ?? 0}
              </span>
            </div>
            <Skeleton loading={isLoading} name="dashboard-tasks" animate="shimmer" transition={300}>
              <div className="divide-y divide-slate-100">
                {myTasks && myTasks.length > 0 ? (
                  myTasks.slice(0, 8).map((task) => {
                    const pc = priorityConfig[task.priority];
                    const overdue = task.deadline ? new Date(task.deadline) < now : false;
                    return (
                      <Link
                        key={task.id}
                        href={`/projects/${task.projectId}/tasks/${task.id}`}
                        className="flex items-center gap-4 px-5 py-3.5 transition-colors duration-150 hover:bg-slate-50"
                      >
                        <div className={`flex h-2 w-2 flex-shrink-0 rounded-full ${pc.dot}`} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-900">{task.title}</p>
                          <p className="mt-0.5 text-xs text-slate-400">{task.project.name}</p>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-2">
                          {task.deadline && (
                            <span className={`text-xs ${overdue ? "font-medium text-red-600" : "text-slate-400"}`}>
                              {overdue && "Overdue · "}
                              {new Date(task.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          )}
                          <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${pc.bg} ${pc.text}`}>
                            {task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}
                          </span>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <EmptyState
                    message="No tasks assigned to you"
                    description="Tasks assigned to you will appear here."
                  />
                )}
              </div>
            </Skeleton>
          </div>
        </div>

        {/* Sidebar - 2/5 width */}
        <div className="space-y-6 lg:col-span-2">
          {/* Due Today Urgency Card */}
          {dueToday.length > 0 && !isLoading && (
            <div className="rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-orange-50 p-5">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                  <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-red-900">Due Today</h3>
              </div>
              <div className="space-y-2">
                {dueToday.slice(0, 3).map((task) => (
                  <Link
                    key={task.id}
                    href={`/projects/${task.projectId}/tasks/${task.id}`}
                    className="block rounded-lg bg-white/70 px-3 py-2 text-sm text-red-800 transition-colors hover:bg-white"
                  >
                    {task.title}
                  </Link>
                ))}
                {dueToday.length > 3 && (
                  <p className="px-1 text-xs text-red-600">+{dueToday.length - 3} more</p>
                )}
              </div>
            </div>
          )}

          {/* My Projects */}
          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-900">Projects</h2>
              <Link
                href="/projects/new"
                className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-medium text-white transition-colors duration-150 hover:bg-blue-700"
              >
                + New
              </Link>
            </div>
            <Skeleton loading={isLoading} name="dashboard-projects" animate="shimmer" transition={300}>
              <div className="divide-y divide-slate-100">
                {projects && projects.length > 0 ? (
                  projects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="flex items-center justify-between px-5 py-3.5 transition-colors duration-150 hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-600">
                          {project.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{project.name}</p>
                          <p className="text-xs text-slate-400">
                            {project._count.tasks} task{project._count.tasks !== 1 ? "s" : ""} · {project._count.members} member{project._count.members !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <svg className="h-4 w-4 text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                    </Link>
                  ))
                ) : (
                  <EmptyState
                    message="No projects yet"
                    description="Create a project to start managing tasks."
                    action={{ label: "Create project", href: "/projects/new" }}
                  />
                )}
              </div>
            </Skeleton>
          </div>
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function StatCard({
  label,
  value,
  icon,
  iconColor,
  variant = "default",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconColor: string;
  variant?: "default" | "warning";
}) {
  return (
    <div
      className={`rounded-xl border p-4 transition-shadow duration-150 hover:shadow-sm ${
        variant === "warning" && value > 0
          ? "border-red-200 bg-red-50/50"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconColor}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold tabular-nums text-slate-900">{value}</p>
          <p className="text-xs font-medium text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  message,
  description,
  action,
}: {
  message: string;
  description: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="px-5 py-8 text-center">
      <p className="text-sm font-medium text-slate-500">{message}</p>
      <p className="mt-1 text-xs text-slate-400">{description}</p>
      {action && (
        <Link
          href={action.href}
          className="mt-3 inline-block rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
