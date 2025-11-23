"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion, arrayRemove, getDoc } from "firebase/firestore";

export function useSavedNames() {
    const { user, loading } = useAuth();
    const [savedNames, setSavedNames] = useState<Set<string>>(new Set());
    const [isLoadingNames, setIsLoadingNames] = useState(true);

    // Load from local storage for guest users
    useEffect(() => {
        if (!loading && !user) {
            const localSaved = localStorage.getItem("guest_saved_names");
            if (localSaved) {
                try {
                    const parsed = JSON.parse(localSaved);
                    setSavedNames(new Set(parsed));
                } catch (e) {
                    console.error("Failed to parse local saved names", e);
                }
            }
            setIsLoadingNames(false);
        }
    }, [user, loading]);

    // Sync with Firestore for logged-in users
    useEffect(() => {
        if (!user) return;

        setIsLoadingNames(true);
        const userDocRef = doc(db, "users", user.uid);

        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.savedNames && Array.isArray(data.savedNames)) {
                    setSavedNames(new Set(data.savedNames));
                }
            } else {
                // Create document if it doesn't exist
                setDoc(userDocRef, { savedNames: [], email: user.email }, { merge: true });
            }
            setIsLoadingNames(false);
        });

        return () => unsubscribe();
    }, [user]);

    // Sync local names to Firestore on login
    useEffect(() => {
        const syncLocalToCloud = async () => {
            if (user) {
                const localSaved = localStorage.getItem("guest_saved_names");
                console.log("Syncing local to cloud. User:", user.uid, "Local saved:", localSaved);
                if (localSaved) {
                    try {
                        const localNames = JSON.parse(localSaved);
                        if (localNames.length > 0) {
                            const userDocRef = doc(db, "users", user.uid);
                            // Get current cloud names first to avoid overwriting if snapshot hasn't fired yet
                            const docSnap = await getDoc(userDocRef);

                            if (docSnap.exists()) {
                                await updateDoc(userDocRef, {
                                    savedNames: arrayUnion(...localNames)
                                });
                                console.log("Merged local names to existing doc");
                            } else {
                                await setDoc(userDocRef, {
                                    savedNames: localNames,
                                    email: user.email
                                });
                                console.log("Created new doc with local names");
                            }

                            // Clear local storage after sync
                            localStorage.removeItem("guest_saved_names");
                            console.log("Cleared local storage");
                        }
                    } catch (e: any) {
                        if (e.code === 'permission-denied') {
                            console.error("Sync failed: Permission denied. Check Firestore security rules.");
                        } else if (e.message && e.message.includes("offline")) {
                            console.warn("Sync skipped: Client is offline");
                        } else {
                            console.error("Failed to sync local names to cloud", e);
                        }
                    }
                }
            }
        };

        syncLocalToCloud();
    }, [user]);

    const saveName = async (name: string) => {
        // Optimistic update
        setSavedNames(prev => {
            const newSet = new Set(prev);
            newSet.add(name);
            return newSet;
        });

        if (user) {
            const userDocRef = doc(db, "users", user.uid);
            try {
                await updateDoc(userDocRef, {
                    savedNames: arrayUnion(name)
                });
            } catch (error: any) {
                if (error.code === 'permission-denied') {
                    console.error("Save failed: Permission denied. Check Firestore rules.");
                } else {
                    console.error("Error saving name to cloud:", error);
                }
                // Revert on error
                setSavedNames(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(name);
                    return newSet;
                });
            }
        } else {
            // Save to local storage
            const current = Array.from(savedNames);
            if (!current.includes(name)) {
                const updated = [...current, name];
                localStorage.setItem("guest_saved_names", JSON.stringify(updated));
            }
        }
    };

    const removeName = async (name: string) => {
        // Optimistic update
        setSavedNames(prev => {
            const newSet = new Set(prev);
            newSet.delete(name);
            return newSet;
        });

        if (user) {
            const userDocRef = doc(db, "users", user.uid);
            try {
                await updateDoc(userDocRef, {
                    savedNames: arrayRemove(name)
                });
            } catch (error) {
                console.error("Error removing name from cloud:", error);
                // Revert on error
                setSavedNames(prev => {
                    const newSet = new Set(prev);
                    newSet.add(name);
                    return newSet;
                });
            }
        } else {
            // Update local storage
            const current = Array.from(savedNames);
            const updated = current.filter(n => n !== name);
            localStorage.setItem("guest_saved_names", JSON.stringify(updated));
        }
    };

    return {
        savedNames,
        saveName,
        removeName,
        isLoadingNames
    };
}
