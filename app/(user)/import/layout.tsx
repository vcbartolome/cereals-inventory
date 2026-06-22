import { ProtectedRoute } from "@/components/protected-route";

export default function ImportLayout({
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
