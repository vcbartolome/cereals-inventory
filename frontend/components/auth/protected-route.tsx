"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { useAuth } from "@/hooks/use-auth";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireApproval?: boolean;
  requiredRole?: string | string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireApproval = true,
  requiredRole,
}) => {
  const { user, profile, loading } = useUser();
  const { handleSignOut } = useAuth();
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
      // If no user is logged in, redirect to login
      if (!user) {
        router.push("/");
        return;
      }

      // If user is logged in but no profile exists, redirect to login
      if (!profile) {
        router.push("/");
        return;
      }

      // If approval is required and user is not approved, redirect to login
      if (requireApproval && !profile.approved) {
        router.push("/");
        return;
      }

      // If specific role is required and user doesn't have it, redirect to dashboard
      if (requiredRole && !hasRequiredRole(profile.role, requiredRole)) {
        router.push("/dashboard");
        return;
      }
    }
  }, [user, profile, loading, router, requireApproval, requiredRole]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  // If user is not authenticated, don't render the protected content
  if (!user || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  // If approval is required and user is not approved, show approval pending message
  if (requireApproval && !profile.approved) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md p-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Account Pending Approval</h2>
          <p className="text-gray-600 mb-6">
            Your account is awaiting admin approval. Please contact an
            administrator.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Signed in as: {user.email}
          </p>
          <Button onClick={handleSignOut} variant="outline">
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  // If specific role is required and user doesn't have it, show access denied message
  if (requiredRole && !hasRequiredRole(profile.role, requiredRole)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md p-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You don't have the required permissions to access this page.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Your role: {profile.role}
          </p>
          <Button onClick={() => router.push("/dashboard")} variant="outline">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
