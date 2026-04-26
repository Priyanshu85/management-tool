import { type FormEvent } from "react";
import { type GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { useRouter } from "next/router";
import { authOptions } from "~/server/auth";
import { api } from "~/utils/api";
import { MemberList } from "~/components/projects/MemberList";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) return { redirect: { destination: "/auth/signin", permanent: false } };
  return { props: {} };
};

function SettingsSkeleton() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 h-7 w-40 animate-pulse rounded bg-gray-200" />

      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 space-y-4">
        <div>
          <div className="mb-1 h-4 w-12 animate-pulse rounded bg-gray-200" />
          <div className="h-10 w-full animate-pulse rounded-md bg-gray-200" />
        </div>
        <div>
          <div className="mb-1 h-4 w-20 animate-pulse rounded bg-gray-200" />
          <div className="h-20 w-full animate-pulse rounded-md bg-gray-200" />
        </div>
        <div className="h-9 w-28 animate-pulse rounded-md bg-gray-200" />
      </div>

      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-3 h-5 w-20 animate-pulse rounded bg-gray-200" />
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-14 animate-pulse rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProjectSettingsPage() {
  const router = useRouter();
  const projectId = router.query.projectId as string;
  const utils = api.useUtils();

  const { data: project, isLoading } = api.project.getById.useQuery(
    { id: projectId },
    { enabled: !!projectId },
  );

  const update = api.project.update.useMutation({
    onSuccess: () => {
      void utils.project.getById.invalidate({ id: projectId });
    },
  });

  const deleteMutation = api.project.delete.useMutation({
    onSuccess: () => {
      void utils.project.list.invalidate();
      void router.push("/projects");
    },
  });

  const handleUpdate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    update.mutate({
      id: projectId,
      name: form.get("name") as string,
      description: (form.get("description") as string) || undefined,
    });
  };

  if (isLoading) return <SettingsSkeleton />;
  if (!project) return <p className="text-red-500">Project not found</p>;

  const isOwner = project.currentUserRole === "OWNER";

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Project Settings</h1>

      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
            <input id="name" name="name" defaultValue={project.name} disabled={!isOwner} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-100" />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea id="description" name="description" rows={3} defaultValue={project.description ?? ""} disabled={!isOwner} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-100" />
          </div>
          {isOwner && (
            <button type="submit" disabled={update.isPending} className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">
              {update.isPending ? "Saving..." : "Save Changes"}
            </button>
          )}
        </form>
      </div>

      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
        <MemberList projectId={projectId} members={project.members} isOwner={isOwner} />
      </div>

      {isOwner && (
        <div className="rounded-lg border border-red-200 bg-white p-6">
          <h3 className="mb-2 text-lg font-semibold text-red-600">Danger Zone</h3>
          <p className="mb-4 text-sm text-gray-500">Deleting a project removes all tasks and members permanently.</p>
          <button
            onClick={() => {
              if (confirm("Are you sure? This cannot be undone.")) {
                deleteMutation.mutate({ id: projectId });
              }
            }}
            className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
          >
            Delete Project
          </button>
        </div>
      )}
    </div>
  );
}
