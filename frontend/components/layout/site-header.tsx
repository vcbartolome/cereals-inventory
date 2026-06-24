"use client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/ui/sidebar";
import { Menu, MoreVertical } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@/context/UserContext";
import { app } from "@/backend/firebase";
import { getAuth, signOut } from "firebase/auth";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function SiteHeader() {
  const { toggleSidebar } = useSidebar();
  const router = useRouter();
  const { profile } = useUser();

  // derive user's display name and initials
  const userName = profile?.displayName ?? "";
  const initials = userName
    ? userName
        .split(" ")
        .map((part) => part[0])
        .join("")
    : undefined;

  const handleLogout = async () => {
    const auth = getAuth(app);
    try {
      // Clear cached inventory data on logout
      localStorage.removeItem("inventoryData");
      localStorage.removeItem("inventoryDataUpdatedAt");
      await signOut(auth);
      toast("Signed out successfully.");
      router.push("/");
    } catch (error) {
      toast("Failed to sign out.");
    }
  };

  return (
    <header className="bg-background sticky top-0 z-50 flex w-full items-center border-b">
      <div className="flex h-(--header-height) w-full items-center justify-between gap-2 px-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={toggleSidebar}>
            <Menu />
          </Button>
          <Image src="/up-banner.png" alt="UP Banner" width={120} height={32} />
          <span className="hidden sm:inline whitespace-nowrap">
            Cereals Inventory
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarImage src={profile?.photoURL} alt="User Avatar" />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline text-sm font-medium">
            {userName}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost">
                <MoreVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleLogout} variant="destructive">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

