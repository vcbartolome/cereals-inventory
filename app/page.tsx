"use client";

import { Button } from "@/components/ui/button";
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
import { ArrowLeft, LayoutDashboard, QrCode, BarChart3, Shield, Upload, UserCircle } from "lucide-react";
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

  const scannedDataColumns = tableColumns
    .filter((col) => col.id !== "box_number" && col.id !== "shelf_code")
    .map((col) => ({
      ...col,
      meta: {
        ...col.meta,
        editable: col.id === "weight" || col.id === "remarks",
      },
    }));

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
      return url.startsWith("/") || !url.includes("://");
    }
  };

  const handleScan = async (result: any) => {
    if (result && result[0]?.rawValue) {
      const scannedValue = result[0].rawValue;
      setError(null);
      setIsLoading(true);
      try {
        let uuid = "";
        if (scannedValue.includes("/box/")) {
          const parts = scannedValue.split("/box/");
          uuid = parts[1].split("?")[0].split("#")[0];
        } else {
          uuid = scannedValue;
        }
        if (!uuid) {
          setError("Invalid QR code format");
          setIsLoading(false);
          return;
        }
        const qrQuery = query(collection(db, "qrcodes"), where("uuid", "==", uuid));
        const qrSnapshot = await getDocs(qrQuery);
        if (qrSnapshot.empty) {
          setError("Invalid QR code - box not found");
          setIsLoading(false);
          return;
        }
        const qrData = qrSnapshot.docs[0].data() as { box_number: number; uuid: string };
        const foundBox = qrData.box_number;
        const invQuery = query(collection(db, "inventory"), where("box_number", "==", foundBox));
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

  useEffect(() => {
    if (!loading && user && profile?.approved) {
      router.push("/dashboard");
    }
  }, [user, profile, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Spinner className="h-8 w-8 text-white" />
      </div>
    );
  }

  if (user && profile?.approved) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Spinner className="h-8 w-8 text-white" />
      </div>
    );
  }

  if (user && profile && !profile.approved) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="w-full max-w-md p-8 text-center bg-white rounded-2xl shadow-xl mx-4">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⏳</span>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-900">Account Pending Approval</h2>
          <p className="text-gray-500 mb-2">Your account is awaiting admin approval. Please contact an administrator.</p>
          <p className="text-sm text-gray-400 mb-6">Signed in as: {user.email}</p>
          <Button onClick={handleSignOut} variant="outline" className="w-full">Sign Out</Button>
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
      if (!user.email) {
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
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case "auth/cancelled-popup-request":
          case "auth/popup-closed-by-user":
            return;
          case "auth/popup-blocked":
            toast.error("Sign-in popup was blocked by the browser."); break;
          case "auth/network-request-failed":
            toast.error("Network error, please check your connection and try again."); break;
          case "auth/account-exists-with-different-credential":
            toast.error("An account already exists with the same email but different sign-in credentials."); break;
          case "auth/unauthorized-domain":
            toast.error("The application is not authorized to run on this domain."); break;
          case "auth/operation-not-allowed":
            toast.error("Google sign-in is not enabled for this project."); break;
          default:
            toast.error(error.message);
        }
      }
    }
  };

  const features = [
    {
      icon: LayoutDashboard,
      title: "Inventory Dashboard",
      desc: "Search, sort, and manage all cereal seed records with advanced filtering and export.",
    },
    {
      icon: QrCode,
      title: "QR Code Scanning",
      desc: "Scan QR codes to instantly retrieve box inventory or generate new codes for entries.",
    },
    {
      icon: BarChart3,
      title: "Statistics",
      desc: "Visual charts for inventory breakdown, total weight, low stock alerts, and trends.",
    },
    {
      icon: Upload,
      title: "Spreadsheet Import",
      desc: "Bulk import records from Excel files with automatic handling of empty fields.",
    },
    {
      icon: Shield,
      title: "Role-Based Access",
      desc: "Admin, AgTech, and User roles with approval flow to keep data secure.",
    },
    {
      icon: UserCircle,
      title: "User Profiles",
      desc: "Each user has a profile showing their role, position, and account details.",
    },
  ];

  // ── when scanned data or scanner is shown, render over a plain dark bg ──
  if (scannedData || showScanner) {
    return (
      <main className="relative min-h-screen w-full bg-gray-50">
        <nav className="flex items-center gap-3 px-8 py-4 bg-white border-b">
          <Image src="/up-logo.png" alt="UPLB Logo" width={32} height={32} className="object-contain" />
          <Image src="/cropped-IPB-logo.png" alt="IPB Logo" width={28} height={28} className="object-contain" />
          <span className="font-semibold text-gray-900">KernelDB</span>
        </nav>

        <div className="flex items-start justify-center p-6">
          {scannedData ? (
            <div className="w-full max-w-6xl bg-white rounded-2xl p-6 shadow-sm border">
              <div className="mb-6 flex items-center gap-4">
                <Button variant="outline" onClick={resetScanner}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Scanner
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">Box {scannedData.boxNumber} Inventory</h1>
                  <p className="text-gray-600">Showing all inventory items in box {scannedData.boxNumber}</p>
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
                    setScannedData((prev) =>
                      prev ? { ...prev, inventory: prev.inventory.filter((item) => item.id !== updated.id) } : null
                    );
                  } else if (updated) {
                    let prevWeight: any = undefined;
                    let prevRemarks: any = undefined;
                    if (scannedData) {
                      const found = scannedData.inventory.find((item) => item.id === updated.id);
                      prevWeight = found ? found.weight : undefined;
                      prevRemarks = found ? found.remarks : undefined;
                    }
                    setScannedData((prev) =>
                      prev ? { ...prev, inventory: prev.inventory.map((item) => item.id === updated.id ? updated : item) } : null
                    );
                    try {
                      if (!updated.id) throw new Error("Document ID is missing.");
                      const docRef = doc(db, "inventory", updated.id);
                      const updatePayload: any = {};
                      const changes: any = {};
                      if (updated.weight !== prevWeight) {
                        updatePayload.weight = updated.weight;
                        changes.weight = { from: prevWeight, to: updated.weight };
                      }
                      if (updated.remarks !== prevRemarks) {
                        updatePayload.remarks = updated.remarks;
                        changes.remarks = { from: prevRemarks, to: updated.remarks };
                      }
                      if (Object.keys(updatePayload).length > 0) {
                        await updateDoc(docRef, updatePayload);
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
            <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-sm border mt-8">
              <div className="mb-4 flex items-center gap-4">
                <Button variant="outline" onClick={() => setShowScanner(false)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <div>
                  <h2 className="text-lg font-semibold">Scan QR Code</h2>
                  <p className="text-sm text-gray-600">Point your camera at a box QR code</p>
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
                  <span className="text-sm text-gray-600">Loading box data...</span>
                </div>
              )}
              <div className="w-full max-w-sm mx-auto">
                <Scanner
                  onScan={handleScan}
                  constraints={{ width: { ideal: 320 }, height: { ideal: 240 } }}
                  styles={{ container: { width: "100%", maxWidth: "320px", height: "auto" }, video: { width: "100%", height: "auto" } }}
                />
              </div>
            </div>
          )}
        </div>
      </main>
    );
  }

  // ── main landing page ──
  return (
    <main className="relative w-full bg-black overflow-x-hidden">

      {/* ── BACKGROUND with gradient overlay ── */}
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/corn-bg.jpg')" }}
        />
        {/* gradient: darker at top and bottom, slightly lighter in middle */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/45 to-black/85" />
      </div>

      {/* ── TOP NAV ── */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Image src="/up-logo.png" alt="UPLB Logo" width={36} height={36} className="object-contain" />
          <Image src="/cropped-IPB-logo.png" alt="IPB Logo" width={32} height={32} className="object-contain" />
          <span className="text-white font-semibold text-lg ml-1 tracking-tight">KernelDB</span>
        </div>
        <span className="text-white/60 text-sm hidden sm:block">UPLB Institute of Plant Breeding</span>
      </nav>

      {/* ── HERO SECTION ── */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-20 pb-16">
        {/* logos */}
        <div className="flex items-center gap-6 mb-8">
          <Image src="/up-logo.png" alt="UPLB Logo" width={88} height={88} className="object-contain drop-shadow-xl" priority />
          <Image src="/cropped-IPB-logo.png" alt="IPB Logo" width={80} height={80} className="object-contain drop-shadow-xl" priority />
        </div>

        {/* title */}
        <h1 className="text-5xl sm:text-6xl font-bold text-white tracking-tight drop-shadow-lg mb-3">
          KernelDB
        </h1>
        <p className="text-white/60 text-sm font-medium uppercase tracking-widest mb-4">
          IPB Cereals Inventory System
        </p>
        <p className="text-white/75 text-base sm:text-lg max-w-md leading-relaxed mb-10">
          Manage and track cereal crop seed inventory for the Cereal Crops Breeding Section of UPLB-IPB
        </p>

        {/* CTAs */}
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={handleGoogleSignIn}
            className="flex items-center justify-center gap-3 w-full bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3 px-6 rounded-xl transition-colors shadow-lg"
          >
            <svg viewBox="0 0 48 48" className="w-5 h-5 flex-shrink-0">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            Sign in with Google
          </button>
        </div>

        <p className="text-white/40 text-xs mt-5 max-w-xs leading-relaxed">
          For authorized UPLB-IPB Cereal Crops staff only.<br />New accounts require admin approval before access is granted.
        </p>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section className="relative z-10 px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-10">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/40 text-xs uppercase tracking-widest font-medium">Features</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white/[0.08] hover:bg-white/[0.12] border border-white/10 rounded-2xl p-5 backdrop-blur-sm transition-colors"
              >
                <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-white font-semibold text-sm mb-1.5">{f.title}</h3>
                <p className="text-white/55 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-white/10 py-5 text-center">
        <p className="text-white/30 text-xs">
          University of the Philippines Los Banos — Institute of Plant Breeding | Cereal Crops Breeding Section
        </p>
      </footer>
    </main>
  );
}