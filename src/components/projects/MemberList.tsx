import { type FormEvent, useState } from "react";
import { api } from "~/utils/api";

interface Member {
  id: string;
  role: string;
  user: { id: string; name: string | null; email: string; image: string | null };
}

interface MemberListProps {
  projectId: string;
  members: Member[];
  isOwner: boolean;
}

export function MemberList({ projectId, members, isOwner }: MemberListProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const utils = api.useUtils();

  const invite = api.project.inviteMember.useMutation({
    onSuccess: () => {
      setEmail("");
      setError("");
      void utils.project.getById.invalidate({ id: projectId });
    },
    onError: (err) => setError(err.message),
  });

  const remove = api.project.removeMember.useMutation({
    onSuccess: () => {
      void utils.project.getById.invalidate({ id: projectId });
    },
  });

  const handleInvite = (e: FormEvent) => {
    e.preventDefault();
    invite.mutate({ projectId, email });
  };

  return (
    <div>
      <h3 className="mb-3 text-lg font-semibold text-gray-900">Members</h3>
      <ul className="mb-4 space-y-2">
        {members.map((member) => (
          <li key={member.id} className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2">
            <div>
              <span className="text-sm font-medium text-gray-900">
                {member.user.name ?? member.user.email}
              </span>
              <span className="ml-2 text-xs text-gray-400">{member.role}</span>
            </div>
            {isOwner && member.role !== "OWNER" && (
              <button
                onClick={() => remove.mutate({ projectId, userId: member.user.id })}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>
      {isOwner && (
        <form onSubmit={handleInvite} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Invite by email..."
            className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
          />
          <button type="submit" disabled={invite.isPending} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50">
            Invite
          </button>
        </form>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
