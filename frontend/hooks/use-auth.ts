import { getAuth, signOut } from "firebase/auth";
import { app } from "@/backend/firebase";
import { toast } from "sonner";

export const useAuth = () => {
  const handleSignOut = async () => {
    try {
      const auth = getAuth(app);
      await signOut(auth);
      toast.success("Signed out successfully");
    } catch (error) {
      toast.error("Error signing out");
    }
  };

  return { handleSignOut };
};

