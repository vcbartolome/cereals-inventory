"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { House, QrCode, Shield, Upload, UserCircle } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";

export function AppSidebar() {
  const { profile } = useUser();
  const canImport = profile?.role === "admin" || profile?.role === "agtech";

  return (
    <Sidebar
      collapsible="icon"
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/dashboard">
                    <House />
                    <span>Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/scan">
                    <QrCode />
                    <span>QR</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {canImport && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/import">
                      <Upload />
                      <span>Import</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {/* Profile — visible to all users, sits before Admin */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/userprofile">
                    <UserCircle />
                    <span>Profile</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {profile?.role === "admin" && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/admin">
                      <Shield />
                      <span>Admin</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}