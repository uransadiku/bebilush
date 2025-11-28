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

export interface PollResults {
    rankings: { name: string; points: number; voteCount: number; percentage: number }[];
    voters: { name: string; votedAt: Date; rankedNames: { name: string; rank: number; points: number }[] }[];
    totalPoints: number;
    totalVoters: number;
    leadingName: string | null;
    isDecisive: boolean; // If there's a clear winner (significant point lead)
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
     * Get detailed poll results with rankings and voter info
     * Supports weighted voting: 1st choice = 3pts, 2nd = 2pts, 3rd = 1pt
     * Backwards compatible with old binary votes (value=1 treated as 1pt)
     */
    getPollResults: async (pollId: string): Promise<PollResults> => {
        try {
            const votes = await pollService.getPollVotes(pollId);
            const poll = await pollService.getPoll(pollId);
            
            if (!poll) {
                throw new Error('Poll not found');
            }

            // Calculate point tallies and vote counts per name
            const pointTally: Record<string, number> = {};
            const voteCountTally: Record<string, number> = {};
            poll.names.forEach(name => {
                pointTally[name] = 0;
                voteCountTally[name] = 0;
            });

            // Process all votes
            const voters: PollResults['voters'] = [];
            votes.forEach(vote => {
                const rankedNames: { name: string; rank: number; points: number }[] = [];
                
                // Sort by points descending to determine rank
                const sortedVotes = Object.entries(vote.votes)
                    .filter(([_, value]) => value > 0)
                    .sort((a, b) => b[1] - a[1]);
                
                sortedVotes.forEach(([name, points], idx) => {
                    // Add points to tally
                    pointTally[name] = (pointTally[name] || 0) + points;
                    voteCountTally[name] = (voteCountTally[name] || 0) + 1;
                    
                    // Determine rank based on points (3=1st, 2=2nd, 1=3rd, else legacy)
                    let rank: number;
                    if (points === 3) rank = 1;
                    else if (points === 2) rank = 2;
                    else if (points === 1) rank = 3;
                    else rank = idx + 1; // Legacy fallback
                    
                    rankedNames.push({ name, rank, points });
                });
                
                // Sort by rank for display
                rankedNames.sort((a, b) => a.rank - b.rank);
                
                voters.push({
                    name: vote.voterName,
                    votedAt: vote.createdAt?.toDate?.() || new Date(),
                    rankedNames
                });
            });

            // Sort voters by most recent first
            voters.sort((a, b) => b.votedAt.getTime() - a.votedAt.getTime());

            // Calculate totals
            const totalPoints = Object.values(pointTally).reduce((sum, v) => sum + v, 0);
            const totalVoters = votes.length;

            // Create rankings sorted by points (primary) then vote count (secondary)
            const rankings = Object.entries(pointTally)
                .map(([name, points]) => ({
                    name,
                    points,
                    voteCount: voteCountTally[name],
                    percentage: totalPoints > 0 ? Math.round((points / totalPoints) * 100) : 0
                }))
                .sort((a, b) => {
                    // Primary: sort by points
                    if (b.points !== a.points) return b.points - a.points;
                    // Secondary: sort by vote count
                    return b.voteCount - a.voteCount;
                });

            // Determine if there's a clear leader (>30% more points than 2nd place)
            const leadingName = rankings[0]?.points > 0 ? rankings[0].name : null;
            const isDecisive = rankings.length >= 2 && rankings[0].points > 0
                ? (rankings[0].points > rankings[1].points * 1.3 && rankings[0].points >= 3)
                : rankings[0]?.points >= 3;

            return {
                rankings,
                voters,
                totalPoints,
                totalVoters,
                leadingName,
                isDecisive
            };
        } catch (error) {
            console.error("Error fetching poll results:", error);
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
