import { db } from '@/lib/firebase';
import { collection, addDoc, doc, getDoc, serverTimestamp, query, where, getDocs, orderBy } from 'firebase/firestore';

export interface Poll {
    id?: string;
    userId: string;
    creatorName: string; // Added creatorName
    names: string[];
    createdAt: any;
    status: 'active' | 'closed';
    title?: string;
}

export interface Vote {
    id?: string;
    voterName: string;
    votes: Record<string, number>; // name -> score (1 or -1)
    createdAt: any;
}

export const pollService = {
    /**
     * Creates a new poll with the given names
     */
    createPoll: async (userId: string, names: string[], creatorName: string, title: string = "Ndihmë për emrin e bebit!") => {
        try {
            const docRef = await addDoc(collection(db, 'polls'), {
                userId,
                creatorName, // Store creator name
                names,
                title,
                status: 'active',
                createdAt: serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error("Error creating poll:", error);
            throw error;
        }
    },

    /**
     * Fetches a poll by ID
     */
    getPoll: async (pollId: string) => {
        try {
            const docRef = doc(db, 'polls', pollId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as Poll;
            } else {
                return null;
            }
        } catch (error) {
            console.error("Error fetching poll:", error);
            throw error;
        }
    },

    /**
     * Submits a vote for a poll
     */
    submitVote: async (pollId: string, voterName: string, votes: Record<string, number>) => {
        try {
            await addDoc(collection(db, 'polls', pollId, 'votes'), {
                voterName,
                votes,
                createdAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error submitting vote:", error);
            throw error;
        }
    },

    /**
     * Gets all votes for a poll (Owner only)
     */
    getPollVotes: async (pollId: string) => {
        try {
            const q = query(collection(db, `polls/${pollId}/votes`));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Vote[];
        } catch (error) {
            console.error("Error fetching votes:", error);
            throw error;
        }
    },

    /**
     * Get all polls for a specific user
     */
    getUserPolls: async (userId: string) => {
        try {
            const q = query(
                collection(db, 'polls'),
                where('userId', '==', userId),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Poll[];
        } catch (error) {
            console.error("Error fetching user polls:", error);
            throw error;
        }
    }
};
