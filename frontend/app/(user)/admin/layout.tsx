import { ProtectedRoute } from "@/components/auth/protected-route";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requireApproval={true} requiredRole="admin">
      {children}
    </ProtectedRoute>
  );
}
