"use client";

import { Button } from "@/components/ui/button";
import { ScanQrCode } from "lucide-react";
import { app } from "@/lib/firebase";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FirebaseError } from "firebase/app";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useUser } from "@/context/UserContext";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { Scanner } from "@yudiel/react-qr-scanner";
import { DataTable } from "@/components/data-table/index";
import { columns } from "@/lib/schemas/columns";
import type { InventoryFormValues } from "@/lib/schemas/inventory";
import type { ColumnDef } from "@tanstack/react-table";
import { collection, getDocs, query, where } from "firebase/firestore";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";

export default function Login() {
  const router = useRouter();
  const [showScanner, setShowScanner] = useState(false);
  const [scannedData, setScannedData] = useState<{
    boxNumber: number;
    inventory: InventoryFormValues[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, profile, loading } = useUser();
  const { handleSignOut } = useAuth();
  const tableColumns = columns as ColumnDef<InventoryFormValues, unknown>[];

  // Create custom columns for scanned data view - only weight and remarks are editable
  const scannedDataColumns = tableColumns
    .filter((col) => col.id !== "box_number" && col.id !== "shelf_code")
    .map((col) => ({
      ...col,
      meta: {
        ...col.meta,
        editable: col.id === "weight" || col.id === "remarks", // Weight and remarks fields are editable
      },
    }));

  // Add: fetch allowed hosts from environment variable
  const ALLOWED_HOSTS = process.env.NEXT_PUBLIC_ALLOWED_HOSTS
    ? process.env.NEXT_PUBLIC_ALLOWED_HOSTS.split(",")
    : [];

  const isLocalLink = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return (
        ALLOWED_HOSTS.includes(urlObj.hostname) ||
        urlObj.protocol === "file:" ||
        urlObj.hostname === window.location.hostname
      );
    } catch {
      // If it's not a valid URL, check if it's a relative path
      return url.startsWith("/") || !url.includes("://");
    }
  };

  const handleScan = async (result: any) => {
    if (result && result[0]?.rawValue) {
      const scannedValue = result[0].rawValue;
      setError(null);
      setIsLoading(true);

      try {
        // Extract UUID from the scanned URL
        let uuid = "";
        if (scannedValue.includes("/box/")) {
          const parts = scannedValue.split("/box/");
          uuid = parts[1].split("?")[0].split("#")[0]; // Remove query params and fragments
        } else {
          // If it's just a UUID
          uuid = scannedValue;
        }

        if (!uuid) {
          setError("Invalid QR code format");
          setIsLoading(false);
          return;
        }

        // Lookup box number from qrcodes collection
        const qrQuery = query(
          collection(db, "qrcodes"),
          where("uuid", "==", uuid),
        );
        const qrSnapshot = await getDocs(qrQuery);

        if (qrSnapshot.empty) {
          setError("Invalid QR code - box not found");
          setIsLoading(false);
          return;
        }

        const qrData = qrSnapshot.docs[0].data() as {
          box_number: number;
          uuid: string;
        };
        const foundBox = qrData.box_number;

        // Fetch inventory for that box
        const invQuery = query(
          collection(db, "inventory"),
          where("box_number", "==", foundBox),
        );
        const snapshot = await getDocs(invQuery);

        const inventory = snapshot.docs.map((doc) => ({
          ...(doc.data() as InventoryFormValues),
          id: doc.id,
        }));

        setScannedData({ boxNumber: foundBox, inventory });
        toast.success(`Found ${inventory.length} items in box ${foundBox}`);
      } catch (error) {
        console.error("Error processing QR code:", error);
        setError("Error loading box data");
        toast.error("Error loading box data");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const resetScanner = () => {
    setShowScanner(false);
    setScannedData(null);
    setError(null);
    setIsLoading(false);
  };
  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user && profile?.approved) {
      router.push("/dashboard");
    }
  }, [user, profile, loading, router]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  // If user is authenticated and approved, don't show login page
  if (user && profile?.approved) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  // If user is authenticated but not approved, show pending approval message
  if (user && profile && !profile.approved) {
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

  const handleGoogleSignIn = async () => {
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Disallow non-UP emails (only partially works, no way to actually block them with Firestore Auth)
      // if (!user.email || !user.email.endsWith("@up.edu.ph")) {
      if (!user.email) {  //comment this out later -- curr test mode
        await auth.signOut();
        toast.error("Only @up.edu.ph email addresses are allowed.");
        return;
      }

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: "user",
          approved: false,
          createdAt: serverTimestamp(),
        });
        toast("Your account is pending approval by the admin.");
        return;
      }

      const userData = userDocSnap.data();
      if (!userData.approved) {
        toast.error("Your account is pending admin approval.");
        return;
      }

      toast.success("Signed in successfully");
      router.push("/dashboard");
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case "auth/popup-closed-by-user":
            errorMessage = "Sign-in popup closed before completing sign in.";
            break;
          case "auth/cancelled-popup-request":
            errorMessage = "Sign-in request was cancelled.";
            break;
          case "auth/popup-blocked":
            errorMessage = "Sign-in popup was blocked by the browser.";
            break;
          case "auth/network-request-failed":
            errorMessage =
              "Network error, please check your connection and try again.";
            break;
          case "auth/account-exists-with-different-credential":
            errorMessage =
              "An account already exists with the same email but different sign-in credentials.";
            break;
          case "auth/unauthorized-domain":
            errorMessage =
              "The application is not authorized to run on this domain.";
            break;
          case "auth/operation-not-allowed":
            errorMessage = "Google sign-in is not enabled for this project.";
            break;
          default:
            errorMessage = error.message;
        }
      }
      toast.error(errorMessage);
    }
  };

  return (
    <main className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      {scannedData ? (
        // Show inventory table for scanned box
        <div className="w-full max-w-6xl">
          <div className="mb-6 flex items-center gap-4">
            <Button variant="outline" onClick={resetScanner}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Scanner
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                Box {scannedData.boxNumber} Inventory
              </h1>
              <p className="text-gray-600">
                Showing all inventory items in box {scannedData.boxNumber}
              </p>
            </div>
          </div>
          <DataTable<InventoryFormValues>
            data={scannedData.inventory}
            columns={scannedDataColumns}
            loading={isLoading}
            stickyActions={true}
            disableDelete={true}
            filterableFields={[
              { label: "Type", fieldName: "type" },
              { label: "Area Planted", fieldName: "area_planted" },
              { label: "Year", fieldName: "year" },
              { label: "Season", fieldName: "season" },
              { label: "Location", fieldName: "location" },
              { label: "Description", fieldName: "description" },
              { label: "Pedigree", fieldName: "pedigree" },
              { label: "Weight", fieldName: "weight" },
            ]}
            onRowUpdate={async (updated: InventoryFormValues) => {
              if (updated && (updated as any).deleted) {
                // Remove the deleted row
                setScannedData((prev) =>
                  prev
                    ? {
                        ...prev,
                        inventory: prev.inventory.filter(
                          (item) => item.id !== updated.id,
                        ),
                      }
                    : null,
                );
              } else if (updated) {
                // Get previous values for history BEFORE updating state
                let prevWeight: any = undefined;
                let prevRemarks: any = undefined;
                if (scannedData) {
                  const found = scannedData.inventory.find(
                    (item) => item.id === updated.id,
                  );
                  prevWeight = found ? found.weight : undefined;
                  prevRemarks = found ? found.remarks : undefined;
                }

                // Update local state immediately
                setScannedData((prev) =>
                  prev
                    ? {
                        ...prev,
                        inventory: prev.inventory.map((item) =>
                          item.id === updated.id ? updated : item,
                        ),
                      }
                    : null,
                );
                // Save the change to Firestore and add to history
                try {
                  if (!updated.id) throw new Error("Document ID is missing.");
                  const docRef = doc(db, "inventory", updated.id);

                  // Only update fields that changed
                  const updatePayload: any = {};
                  const changes: any = {};
                  if (updated.weight !== prevWeight) {
                    updatePayload.weight = updated.weight;
                    changes.weight = { from: prevWeight, to: updated.weight };
                  }
                  if (updated.remarks !== prevRemarks) {
                    updatePayload.remarks = updated.remarks;
                    changes.remarks = {
                      from: prevRemarks,
                      to: updated.remarks,
                    };
                  }

                  if (Object.keys(updatePayload).length > 0) {
                    await updateDoc(docRef, updatePayload);

                    // Add to history subcollection with changes
                    const historyRef = collection(docRef, "history");
                    await setDoc(doc(historyRef), {
                      creatorId: "anonymous",
                      editedAt: serverTimestamp(),
                      editedBy: "Anonymous (logged out user)",
                      changes,
                    });
                  }
                } catch (error) {
                  console.error("Error updating document: ", error);
                  toast.error("Failed to update item.");
                }
              }
            }}
          />
        </div>
      ) : (
        <div className="w-full max-w-sm grid gap-4 justify-items-center">
          {!showScanner ? (
            <>
              {/* UP Logo and Header */}
              <div className="flex flex-col items-center gap-4 mb-2">
                <div className="flex items-center gap-8">
                  <Image
                    src="/up-logo.png"
                    alt="University of the Philippines Logo"
                    width={130}
                    height={130}
                    priority
                    className="object-contain"
                  />
                  <Image
                    src="/cropped-IPB-logo.png"
                    alt="IPB Logo"
                    width={110}
                    height={110}
                    priority
                    className="object-contain"
                  />
                </div>
                <h1 className="text-3xl font-bold text-gray-800 text-center">
                  Cereals Inventory
                </h1>
              </div>

              <Button
                variant="outline"
                type="button"
                onClick={handleGoogleSignIn}
              >
                <svg
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  xmlnsXlink="http://www.w3.org/1999/xlink"
                  viewBox="0 0 48 48"
                  style={{ display: "block" }}
                >
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  ></path>
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  ></path>
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  ></path>
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  ></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
                Continue with Google
              </Button>
              <Button
                variant="outline"
                type="button"
                onClick={() => setShowScanner(true)}
              >
                <ScanQrCode />
                Scan QR
              </Button>
            </>
          ) : (
            <div className="w-full">
              <div className="mb-4 flex items-center gap-4">
                <Button variant="outline" onClick={() => setShowScanner(false)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <div>
                  <h2 className="text-lg font-semibold">Scan QR Code</h2>
                  <p className="text-sm text-gray-600">
                    Point your camera at a box QR code
                  </p>
                </div>
              </div>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
              {isLoading && (
                <div className="mb-4 flex items-center justify-center">
                  <Spinner className="h-6 w-6 mr-2" />
                  <span className="text-sm text-gray-600">
                    Loading box data...
                  </span>
                </div>
              )}
              <div className="w-full max-w-sm mx-auto">
                <Scanner
                  onScan={handleScan}
                  constraints={{
                    width: { ideal: 320 },
                    height: { ideal: 240 },
                  }}
                  styles={{
                    container: {
                      width: "100%",
                      maxWidth: "320px",
                      height: "auto",
                    },
                    video: {
                      width: "100%",
                      height: "auto",
                    },
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
