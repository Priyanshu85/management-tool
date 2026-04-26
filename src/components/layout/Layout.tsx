import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { Sidebar } from "./Sidebar";

export function Layout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();

  const publicPaths = ["/", "/auth/signin", "/auth/signup"];
  const isPublicPage = publicPaths.includes(router.pathname);

  if (isPublicPage || status !== "authenticated") {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
