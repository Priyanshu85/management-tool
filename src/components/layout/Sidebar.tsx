import Link from "next/link";
import { useRouter } from "next/router";
import { signOut, useSession } from "next-auth/react";
import { api } from "~/utils/api";

function SidebarProjectsSkeleton() {
  return (
    <div className="space-y-1">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center rounded-md px-3 py-2">
          <div className="h-4 w-full animate-pulse rounded bg-gray-200" style={{ maxWidth: `${100 - i * 20}px` }} />
        </div>
      ))}
    </div>
  );
}

export function Sidebar() {
  const router = useRouter();
  const { data: session } = useSession();
  const { data: projects, isLoading } = api.project.list.useQuery(undefined, {
    enabled: !!session,
  });

  const isActive = (path: string) => router.pathname === path || router.asPath.startsWith(path + "/");

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-14 items-center border-b border-gray-200 px-4">
        <Link href="/dashboard" className="text-xl font-bold text-gray-900">
          TaskFlow
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <Link
          href="/dashboard"
          className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${
            isActive("/dashboard")
              ? "bg-blue-50 text-blue-700"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          Dashboard
        </Link>

        <div className="pt-4">
          <div className="flex items-center justify-between px-3 pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Projects
            </span>
            <Link
              href="/projects/new"
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              + New
            </Link>
          </div>

          {isLoading && <SidebarProjectsSkeleton />}

          {!isLoading && projects?.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className={`flex items-center rounded-md px-3 py-2 text-sm ${
                router.query.projectId === project.id
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {project.name}
            </Link>
          ))}

          {!isLoading && projects?.length === 0 && (
            <p className="px-3 py-2 text-xs text-gray-400">No projects yet</p>
          )}
        </div>
      </nav>

      <div className="border-t border-gray-200 p-3">
        <Link
          href="/profile"
          className={`flex items-center rounded-md px-3 py-2 text-sm ${
            isActive("/profile")
              ? "bg-blue-50 text-blue-700"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <div className="h-7 w-7 rounded-full bg-blue-100 text-center text-sm leading-7 text-blue-700">
            {session?.user?.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <span className="ml-2 truncate">{session?.user?.name ?? "Profile"}</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
          className="mt-1 w-full rounded-md px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-100"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
