"use client";

import React, { createContext, useState, useEffect, useContext } from "react";
import { app, db } from "@/backend/firebase";
import {
  getAuth,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export type UserProfile = {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  role: string;
  approved: boolean;
};

type UserContextValue = {
  user?: FirebaseUser | null;
  profile?: UserProfile;
  loading: boolean;
};

const UserContext = createContext<UserContextValue>({ loading: true });

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<FirebaseUser | null>();
  const [profile, setProfile] = useState<UserProfile | null>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (!firebaseUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      setUser(firebaseUser);
      const ref = doc(db, "users", firebaseUser.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setProfile({
          uid: firebaseUser.uid,
          ...(snap.data() as Omit<UserProfile, "uid">),
        });
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <UserContext.Provider
      value={{ user, profile: profile ?? undefined, loading }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);

