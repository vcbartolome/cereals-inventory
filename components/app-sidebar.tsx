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
import { House, QrCode, Shield, Upload } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";

const items = [
  {
    title: "Home",
    url: "/dashboard",
    icon: House,
  },
  // {
  //   title: "Import",
  //   url: "/import",
  //   icon: Upload,
  // },
  {
    title: "QR",
    url: "/scan",
    icon: QrCode,
  },
];

export function AppSidebar() {
  const { profile } = useUser();
  return (
    <Sidebar
      collapsible="icon"
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {profile?.role === "admin"  && (
                <SidebarMenuItem key="Import">
                  <SidebarMenuButton asChild>
                    <Link href="/import">
                      <Upload />
                      <span>Import</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {profile?.role === "agtech"  && (
                <SidebarMenuItem key="Import">
                  <SidebarMenuButton asChild>
                    <Link href="/import">
                      <Upload />
                      <span>Import</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {profile?.role === "admin" && (
                <SidebarMenuItem key="Admin">
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
