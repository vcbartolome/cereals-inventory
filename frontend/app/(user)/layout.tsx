import { SiteHeader } from "@/components/layout/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { cookies } from "next/headers";

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  return (
    <ProtectedRoute requireApproval={true}>
      <div className="[--header-height:calc(--spacing(14))]">
        <SidebarProvider defaultOpen={defaultOpen} className="flex flex-col">
          <SiteHeader />
          <div className="flex flex-1">
            <AppSidebar />
            <SidebarInset>{children}</SidebarInset>
          </div>
        </SidebarProvider>
      </div>
    </ProtectedRoute>
  );
}
