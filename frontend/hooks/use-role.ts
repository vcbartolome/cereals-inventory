import { useUser } from "@/context/UserContext";

export const useRole = () => {
  const { user, profile, loading } = useUser();

  const hasRole = (requiredRole: string | string[]): boolean => {
    if (!profile) return false;

    if (typeof requiredRole === "string") {
      return profile.role === requiredRole;
    }

    return requiredRole.includes(profile.role);
  };

  const isAdmin = () => hasRole("admin");
  const isUser = () => hasRole("user");
  const isAgtech = () => hasRole("agtech");
  const isApproved = () => profile?.approved || false;

  return {
    user,
    profile,
    loading,
    hasRole,
    isAdmin,
    isAgtech,
    isUser,
    isApproved,
    role: profile?.role,
  };
};
