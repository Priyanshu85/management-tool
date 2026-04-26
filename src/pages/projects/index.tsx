import { type GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "~/server/auth";
import { api } from "~/utils/api";
import { ProjectCard } from "~/components/projects/ProjectCard";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) return { redirect: { destination: "/auth/signin", permanent: false } };
  return { props: {} };
};

export default function ProjectsPage() {
  const { data: projects, isLoading } = api.project.list.useQuery();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <Link href="/projects/new" className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
          New Project
        </Link>
      </div>
      {isLoading && <p className="text-gray-500">Loading...</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects?.map((project) => (
          <ProjectCard key={project.id} {...project} />
        ))}
      </div>
      {projects?.length === 0 && !isLoading && (
        <p className="text-center text-gray-500">
          No projects yet.{" "}
          <Link href="/projects/new" className="text-blue-600 hover:text-blue-800">Create one</Link>
        </p>
      )}
    </div>
  );
}
