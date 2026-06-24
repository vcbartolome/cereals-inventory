import { ProtectedRoute } from "@/components/auth/protected-route";


export default function ImportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requireApproval={true} requiredRole={["admin","agtech"]}>
      {children}
    </ProtectedRoute>
  );
}
