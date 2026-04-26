import { type FormEvent } from "react";
import { type GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "~/server/auth";
import { api } from "~/utils/api";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) return { redirect: { destination: "/auth/signin", permanent: false } };
  return { props: {} };
};

export default function ProfilePage() {
  const utils = api.useUtils();
  const { data: profile, isLoading } = api.user.getProfile.useQuery();

  const update = api.user.updateProfile.useMutation({
    onSuccess: () => {
      void utils.user.getProfile.invalidate();
    },
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    update.mutate({
      name: form.get("name") as string,
      image: (form.get("image") as string) || null,
    });
  };

  if (isLoading) return <p className="text-gray-500">Loading...</p>;
  if (!profile) return <p className="text-red-500">Profile not found</p>;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Profile</h1>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700">
            {profile.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div>
            <p className="font-medium text-gray-900">{profile.name}</p>
            <p className="text-sm text-gray-500">{profile.email}</p>
            <p className="text-xs text-gray-400">
              Member since {new Date(profile.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
            <input id="name" name="name" defaultValue={profile.name ?? ""} required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none" />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input id="email" value={profile.email} disabled className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2" />
          </div>

          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700">Avatar URL (optional)</label>
            <input id="image" name="image" type="url" defaultValue={profile.image ?? ""} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none" />
          </div>

          <button type="submit" disabled={update.isPending} className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">
            {update.isPending ? "Saving..." : "Save Changes"}
          </button>

          {update.isSuccess && (
            <p className="text-sm text-green-600">Profile updated!</p>
          )}
        </form>
      </div>
    </div>
  );
}
