import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NotificationPrompt } from "@/components/notifications/notification-prompt";
import { Providers } from "@/components/providers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const isAdmin = session.user.accessLevel === "admin";

  return (
    <Providers session={session}>
      <div className="min-h-screen flex flex-col">
        <Header
          user={{
            name: session.user.name || "User",
            email: session.user.email || "",
            accessLevel: session.user.accessLevel,
          }}
        />
        <main className="flex-1 pb-20 md:pb-6">{children}</main>
        <MobileNav isAdmin={isAdmin} />
        <NotificationPrompt />
      </div>
    </Providers>
  );
}
