import { db } from '@/lib/firebase';
import { collection, addDoc, doc, getDoc, deleteDoc, serverTimestamp, query, where, getDocs, orderBy } from 'firebase/firestore';

export interface Poll {
    id?: string;
    userId: string;
    creatorName: string;
    names: string[];
    createdAt: any;
    status: 'active' | 'closed';
    title?: string;
    voteCount?: number; // Computed field for UI
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
    },

    /**
     * Get all polls for a user with vote counts
     */
    getUserPollsWithVotes: async (userId: string) => {
        try {
            const q = query(
                collection(db, 'polls'),
                where('userId', '==', userId),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            
            // Fetch vote counts for each poll
            const pollsWithVotes = await Promise.all(
                snapshot.docs.map(async (docSnap) => {
                    const pollData = { id: docSnap.id, ...docSnap.data() } as Poll;
                    
                    // Get vote count
                    const votesSnapshot = await getDocs(collection(db, `polls/${docSnap.id}/votes`));
                    pollData.voteCount = votesSnapshot.size;
                    
                    return pollData;
                })
            );
            
            return pollsWithVotes;
        } catch (error) {
            console.error("Error fetching user polls with votes:", error);
            throw error;
        }
    },

    /**
     * Delete a poll and all its votes
     */
    deletePoll: async (pollId: string, userId: string) => {
        try {
            // First verify ownership
            const pollDoc = await getDoc(doc(db, 'polls', pollId));
            if (!pollDoc.exists()) {
                throw new Error('Poll not found');
            }
            
            const pollData = pollDoc.data();
            if (pollData.userId !== userId) {
                throw new Error('Not authorized to delete this poll');
            }

            // Delete all votes first (subcollection)
            const votesSnapshot = await getDocs(collection(db, `polls/${pollId}/votes`));
            const deletePromises = votesSnapshot.docs.map(voteDoc => 
                deleteDoc(doc(db, `polls/${pollId}/votes`, voteDoc.id))
            );
            await Promise.all(deletePromises);

            // Delete the poll document
            await deleteDoc(doc(db, 'polls', pollId));
            
            return true;
        } catch (error) {
            console.error("Error deleting poll:", error);
            throw error;
        }
    }
};
