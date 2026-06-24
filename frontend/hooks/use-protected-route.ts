import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const useProtectedRoute = (
  requireApproval: boolean = true,
  requiredRole?: string | string[],
) => {
  const { user, profile, loading } = useUser();
  const router = useRouter();

  // Helper function to check if user has required role
  const hasRequiredRole = (
    userRole: string,
    requiredRole?: string | string[],
  ): boolean => {
    if (!requiredRole) return true;

    if (typeof requiredRole === "string") {
      return userRole === requiredRole;
    }

    return requiredRole.includes(userRole);
  };

  useEffect(() => {
    if (!loading) {
      if (!user || !profile) {
        router.push("/");
        return;
      }

      if (requireApproval && !profile.approved) {
        router.push("/");
        return;
      }

      if (requiredRole && !hasRequiredRole(profile.role, requiredRole)) {
        router.push("/dashboard");
        return;
      }
    }
  }, [user, profile, loading, router, requireApproval, requiredRole]);

  return {
    user,
    profile,
    loading,
    isAuthenticated: !!user && !!profile,
    isApproved: profile?.approved || false,
    hasRole: requiredRole
      ? hasRequiredRole(profile?.role || "", requiredRole)
      : true,
  };
};
