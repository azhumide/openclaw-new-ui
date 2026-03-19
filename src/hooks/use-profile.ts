"use client";

import { useState, useEffect } from "react";

export type UserProfile = {
  avatar: string | null;
  nickname: string;
  bio: string;
};

const defaultProfile: UserProfile = {
  avatar: null,
  nickname: "管理员",
  bio: "Admin Session",
};

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);

  useEffect(() => {
    const loadProfile = () => {
      try {
        const stored = localStorage.getItem("openclaw.profile.v1");
        if (stored) {
          setProfile({ ...defaultProfile, ...JSON.parse(stored) });
        }
      } catch (e) {}
    };

    loadProfile();
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "openclaw.profile.v1") loadProfile();
    };

    window.addEventListener("profile-updated", loadProfile);
    window.addEventListener("storage", handleStorageChange);
    
    return () => {
      window.removeEventListener("profile-updated", loadProfile);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const saveProfile = (newProfile: Partial<UserProfile>) => {
    const merged = { ...profile, ...newProfile };
    setProfile(merged);
    localStorage.setItem("openclaw.profile.v1", JSON.stringify(merged));
    window.dispatchEvent(new Event("profile-updated"));
  };

  return { profile, saveProfile };
}
