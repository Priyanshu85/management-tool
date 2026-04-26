import Link from "next/link";

interface ProjectCardProps {
  id: string;
  name: string;
  description: string | null;
  role: string;
  _count: { tasks: number; members: number };
}

export function ProjectCard({ id, name, description, role, _count }: ProjectCardProps) {
  return (
    <Link
      href={`/projects/${id}`}
      className="block rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
    >
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
          {role}
        </span>
      </div>
      {description && (
        <p className="mb-3 text-sm text-gray-500 line-clamp-2">{description}</p>
      )}
      <div className="flex gap-4 text-xs text-gray-400">
        <span>{_count.tasks} tasks</span>
        <span>{_count.members} members</span>
      </div>
    </Link>
  );
}
