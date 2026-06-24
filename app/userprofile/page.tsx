"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { app, db } from "@/lib/firebase";
import {
  getAuth,
  sendPasswordResetEmail,
  deleteUser,
  reauthenticateWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import {
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

// ── small helpers ──────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  agtech: "AgTech",
  user: "User",
};

const ROLE_COLORS: Record<string, string> = {
  admin:  "bg-green-100 text-green-800",
  agtech: "bg-blue-100 text-blue-800",
  user:   "bg-gray-100 text-gray-700",
};

const STATUS_COLORS: Record<string, string> = {
  true:  "bg-green-100 text-green-800",
  false: "bg-yellow-100 text-yellow-800",
};

function getInitials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 3);
}

function formatDate(ts: any) {
  if (!ts) return "—";
  const date = ts?.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString("en-PH", { year: "numeric", month: "long" });
}

// ── confirmation dialog ─────────────────────────────────────────
function ConfirmDialog({
  title,
  message,
  confirmLabel,
  confirmClass,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  confirmClass: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">{title}</h2>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm rounded-lg text-white font-medium transition-colors ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── main page ───────────────────────────────────────────────────
export default function UserProfilePage() {
  const { user, profile, loading } = useUser();
  const router = useRouter();

  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [position, setPosition]       = useState(profile?.position ?? "");
  const [isSaving, setIsSaving]       = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  // dialog state
  const [dialog, setDialog] = useState<"resign" | "delete" | null>(null);

  // sync local state when profile loads
  if (!loading && profile && displayName === "" && profile.displayName) {
    setDisplayName(profile.displayName);
  }
  if (!loading && profile && position === "" && profile.position) {
    setPosition(profile.position);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-700 border-t-transparent" />
      </div>
    );
  }

  if (!user || !profile) {
    router.push("/");
    return null;
  }

  const auth = getAuth(app);

  // ── save changes ──
  const handleSave = async () => {
    if (!displayName.trim()) {
      toast.error("Full name cannot be empty.");
      return;
    }
    setIsSaving(true);
    try {
      const ref = doc(db, "users", profile.uid);
      await updateDoc(ref, {
        displayName: displayName.trim(),
        position: position.trim(),
        updatedAt: serverTimestamp(),
      });
      toast.success("Profile updated successfully.");
    } catch (e) {
      toast.error("Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── password reset ──
  const handlePasswordReset = async () => {
    if (!user.email) return;
    setIsSendingReset(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast.success("Password reset email sent to " + user.email);
    } catch (e) {
      toast.error("Failed to send reset email.");
    } finally {
      setIsSendingReset(false);
    }
  };

  // ── resign as admin ──
  const handleResign = async () => {
    setDialog(null);
    try {
      const ref = doc(db, "users", profile.uid);
      await updateDoc(ref, { role: "user" });
      toast.success("You have resigned as Admin. Your role is now User.");
      router.refresh();
    } catch (e) {
      toast.error("Failed to update role.");
    }
  };

  // ── delete account ──
  const handleDelete = async () => {
    setDialog(null);
    try {
      // re-authenticate first (required by Firebase before deletion)
      if (user.providerData[0]?.providerId === "google.com") {
        const provider = new GoogleAuthProvider();
        await reauthenticateWithPopup(user, provider);
      }
      // delete Firestore doc then Auth user
      await deleteDoc(doc(db, "users", profile.uid));
      await deleteUser(user);
      toast.success("Account deleted.");
      router.push("/");
    } catch (e: any) {
      if (e.code === "auth/popup-closed-by-user") return;
      toast.error("Failed to delete account. Please try again.");
    }
  };

  const initials = getInitials(profile.displayName);
  const memberSince = formatDate(profile.createdAt);

  return (
    <>
      {/* ── dialogs ── */}
      {dialog === "resign" && (
        <ConfirmDialog
          title="Resign as Admin?"
          message="You will be downgraded to a regular User. You will lose access to Admin-only features. This action can only be reversed by another Admin."
          confirmLabel="Yes, resign"
          confirmClass="bg-yellow-600 hover:bg-yellow-700"
          onConfirm={handleResign}
          onCancel={() => setDialog(null)}
        />
      )}
      {dialog === "delete" && (
        <ConfirmDialog
          title="Delete your account?"
          message="This is permanent and cannot be undone. All your account data will be removed. You will be asked to re-authenticate before deletion."
          confirmLabel="Yes, delete my account"
          confirmClass="bg-red-600 hover:bg-red-700"
          onConfirm={handleDelete}
          onCancel={() => setDialog(null)}
        />
      )}

      {/* ── page ── */}
      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* back button */}
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </button>

        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-500 mt-1 mb-8">
          Manage your account information and preferences
        </p>

        {/* ── header card ── */}
        <div className="flex items-center gap-5 mb-8 pb-8 border-b border-gray-100">
          {/* avatar */}
          {profile.photoURL ? (
            <Image
              src={profile.photoURL}
              alt={profile.displayName ?? "Avatar"}
              width={64}
              height={64}
              className="rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-semibold text-xl flex-shrink-0">
              {initials}
            </div>
          )}

          {/* name + badges */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-gray-900 truncate">
              {profile.displayName ?? "—"}
            </h2>
            <p className="text-sm text-gray-500 truncate">{profile.email}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${ROLE_COLORS[profile.role] ?? "bg-gray-100 text-gray-700"}`}>
                {ROLE_LABELS[profile.role] ?? profile.role}
              </span>
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_COLORS[String(profile.approved)]}`}>
                {profile.approved ? "Approved" : "Pending"}
              </span>
            </div>
          </div>

          {/* meta */}
          <div className="text-right text-xs text-gray-400 space-y-1 flex-shrink-0">
            <p>Member since {memberSince}</p>
            <p>Last login: {user.metadata.lastSignInTime
              ? new Date(user.metadata.lastSignInTime).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })
              : "—"}
            </p>
          </div>
        </div>

        {/* ── personal information ── */}
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
          Personal information
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {/* full name */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Full name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent"
            />
          </div>

          {/* email */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Email address</label>
            <input
              type="email"
              value={profile.email ?? ""}
              readOnly
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
            />
            <span className="text-xs text-gray-400">
              Linked to your Google account. Cannot be changed here.
            </span>
          </div>

          {/* role */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Role</label>
            <input
              type="text"
              value={ROLE_LABELS[profile.role] ?? profile.role}
              readOnly
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
            />
            <span className="text-xs text-gray-400">
              Role can only be changed by an administrator.
            </span>
          </div>

          {/* position */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Position</label>
            <input
              type="text"
              placeholder="e.g. Researcher, Intern, Director"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent"
            />
          </div>
          </div>

        {/* ── save / cancel ── */}
        <div className="flex gap-3 items-center mb-12">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 text-sm bg-green-800 hover:bg-green-900 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save changes"}
          </button>
          <button
            onClick={() => {
              setDisplayName(profile.displayName ?? "");
              setPosition(profile.position ?? "");
            }}
            className="px-5 py-2.5 text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* ── danger zone ── */}
        <div className="border border-red-100 rounded-xl p-5 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-red-400 mb-2">
            Danger zone
          </p>

          {profile.role === "admin" && (
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-800">Resign as Admin</p>
                <p className="text-xs text-gray-400">
                  Downgrade your role to User. Reversible only by another Admin.
                </p>
              </div>
              <button
                onClick={() => setDialog("resign")}
                className="px-4 py-2 text-sm border border-yellow-300 text-yellow-700 hover:bg-yellow-50 rounded-lg transition-colors whitespace-nowrap"
              >
                Resign as Admin
              </button>
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-800">Delete account</p>
              <p className="text-xs text-gray-400">
                Permanently remove your account and all associated data. This cannot be undone.
              </p>
            </div>
            <button
              onClick={() => setDialog("delete")}
              className="px-4 py-2 text-sm border border-red-300 text-red-600 hover:bg-red-50 rounded-lg transition-colors whitespace-nowrap"
            >
              Delete account
            </button>
          </div>
        </div>
      </div>
    </>
  );
}