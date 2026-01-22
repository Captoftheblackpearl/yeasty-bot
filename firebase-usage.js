// 🔥 FIREBASE ADMIN USAGE EXAMPLES
// This file shows how to use Firebase Admin SDK in the Bread Bot
// These functions use server-side transactions for safe data updates!

import { db } from './firebase-config.js';

// 📋 VAULT REFERENCE
const vaultRef = db.ref('royal_vault');
const usersRef = vaultRef.child('users');
const logsRef = vaultRef.child('logs');

// ==========================================
// 📝 BUTTER POINTS - FIREBASE ADMIN FUNCTIONS
// ==========================================
// Using transactions ensures data integrity!
// If multiple people award butter at same time, it's all tracked correctly!

/**
 * Award butter point to a user (atomic transaction)
 * This is safe even if multiple people award butter simultaneously!
 * @param {string} receiverId - Slack user ID receiving the butter
 * @returns {Promise<number>} New butter point total
 */
export const awardButterPoint = async (receiverId) => {
  try {
    const userRef = usersRef.child(receiverId);

    // Use transaction for atomic update
    const result = await userRef.transaction((currentData) => {
      if (currentData === null) {
        // New user
        return { points: 1, title: 'Flour Peasant', updatedAt: Date.now() };
      }
      // Existing user - increment points
      currentData.points = (currentData.points || 0) + 1;
      currentData.updatedAt = Date.now();
      return currentData;
    });

    if (result.committed) {
      console.log(`✅ Awarded butter to ${receiverId}! New total: ${result.snapshot.val().points}`);
      return result.snapshot.val().points;
    }
    console.log(`⚠️ Transaction aborted for ${receiverId}`);
    return null;
  } catch (error) {
    console.error('❌ Error awarding butter:', error);
    return null;
  }
};

/**
 * Get a user's data from Firebase
 * @param {string} userId - Slack user ID
 * @returns {Promise<Object>} User data or null
 */
export const getUser = async (userId) => {
  try {
    const snapshot = await usersRef.child(userId).once('value');
    if (snapshot.exists()) {
      console.log(`✅ Found ${userId} in Firebase!`);
      return snapshot.val();
    }
    console.log(`⚠️ User ${userId} not found`);
    return null;
  } catch (error) {
    console.error('❌ Error getting user:', error);
    return null;
  }
};

/**
 * Get all users from Firebase
 * @returns {Promise<Object>} All users object
 */
export const getAllUsers = async () => {
  try {
    const snapshot = await usersRef.once('value');
    if (snapshot.exists()) {
      console.log('✅ Fetched all users from Firebase!');
      return snapshot.val();
    }
    console.log('⚠️ No users found');
    return {};
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    return {};
  }
};

/**
 * Manually set a user's title (King only)
 * @param {string} userId - Slack user ID
 * @param {string} title - New title
 */
export const promoteUser = async (userId, title) => {
  try {
    const userRef = usersRef.child(userId);
    const snapshot = await userRef.once('value');

    if (snapshot.exists()) {
      const userData = snapshot.val();
      await userRef.update({ title, updatedAt: Date.now() });
      console.log(`✅ Promoted ${userId} to ${title}!`);
      return true;
    }
    // Create new user with title
    await userRef.set({ points: 0, title, updatedAt: Date.now() });
    console.log(`✅ Created ${userId} with title ${title}!`);
    return true;
  } catch (error) {
    console.error('❌ Error promoting user:', error);
    return false;
  }
};

/**
 * Get leaderboard sorted by butter points
 * @returns {Promise<Array>} Sorted array of users
 */
export const getLeaderboard = async () => {
  try {
    const users = await getAllUsers();

    if (!users || Object.keys(users).length === 0) {
      return [];
    }

    // Convert to array and sort by points descending
    const leaderboard = Object.entries(users)
      .map(([userId, userData]) => ({
        userId,
        points: userData.points || 0,
        title: userData.title || 'Flour Peasant',
        updatedAt: userData.updatedAt,
      }))
      .sort((a, b) => b.points - a.points);

    return leaderboard;
  } catch (error) {
    console.error('❌ Error getting leaderboard:', error);
    return [];
  }
};

/**
 * Check rate limit for butter-up command (3 per day)
 * @param {string} userId - Slack user ID
 * @returns {Promise<boolean>} true if user can award butter, false if limit reached
 */
export const checkButterLimit = async (userId) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const logRef = logsRef.child(userId);
    const snapshot = await logRef.once('value');

    const currentLog = snapshot.val() || { date: today, count: 0 };

    // Reset if it's a new day
    if (currentLog.date !== today) {
      await logRef.set({ date: today, count: 0 });
      return true;
    }

    // Check limit (3 per day)
    if (currentLog.count >= 3) {
      console.log(`⏱️ ${userId} has reached daily butter limit`);
      return false;
    }

    // Increment count
    await logRef.update({ count: currentLog.count + 1 });
    return true;
  } catch (error) {
    console.error('❌ Error checking butter limit:', error);
    return false;
  }
};

/**
 * Delete a user (admin only)
 * @param {string} userId - Slack user ID
 */
export const deleteUser = async (userId) => {
  try {
    await usersRef.child(userId).remove();
    console.log(`✅ Deleted ${userId}`);
    return true;
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    return false;
  }
};

/**
 * Save a user's butter points to Firebase
 * @param {string} userId - Slack user ID
 * @param {number} points - Number of butter points
 * @param {string} title - User's title
 */
export const saveUserToFirebase = async (userId, points, title) => {
  try {
    const userRef = ref(db, `users/${userId}`);
    await set(userRef, {
      points,
      title,
      updatedAt: new Date().toISOString(),
    });
    console.log(`✅ Saved ${userId} to Firebase!`);
  } catch (error) {
    console.error('❌ Error saving user:', error);
  }
};

/**
 * Get a user's data from Firebase
 * @param {string} userId - Slack user ID
 * @returns {Promise<Object>} User data
 */
export const getUserFromFirebase = async (userId) => {
  try {
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      console.log(`✅ Found ${userId} in Firebase!`);
      return snapshot.val();
    }
    console.log(`⚠️ User ${userId} not found in Firebase`);
    return null;
  } catch (error) {
    console.error('❌ Error getting user:', error);
  }
};

/**
 * Get all users from Firebase
 * @returns {Promise<Object>} All users
 */
export const getAllUsersFromFirebase = async () => {
  try {
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);

    if (snapshot.exists()) {
      console.log('✅ Fetched all users from Firebase!');
      return snapshot.val();
    }
    console.log('⚠️ No users found in Firebase');
    return {};
  } catch (error) {
    console.error('❌ Error fetching users:', error);
  }
};

/**
 * Update a user's points in Firebase
 * @param {string} userId - Slack user ID
 * @param {number} newPoints - New butter points value
 */
export const updateUserPointsInFirebase = async (userId, newPoints) => {
  try {
    const userRef = ref(db, `users/${userId}`);
    await update(userRef, {
      points: newPoints,
      updatedAt: new Date().toISOString(),
    });
    console.log(`✅ Updated ${userId}'s points to ${newPoints}!`);
  } catch (error) {
    console.error('❌ Error updating points:', error);
  }
};

/**
 * Delete a user from Firebase
 * @param {string} userId - Slack user ID
 */
export const deleteUserFromFirebase = async (userId) => {
  try {
    const userRef = ref(db, `users/${userId}`);
    await remove(userRef);
    console.log(`✅ Deleted ${userId} from Firebase!`);
  } catch (error) {
    console.error('❌ Error deleting user:', error);
  }
};

// ==========================================
// 📊 USAGE EXAMPLES
// ==========================================

/**
 * Example: Award butter points and save to Firebase
 * Usage: Call this when /butter-up command is used
 */
export const awardButterPointsExample = async (receiverId) => {
  try {
    // Get current user data
    const userData = await getUserFromFirebase(receiverId);

    if (userData) {
      // Increment points
      const newPoints = userData.points + 1;
      await updateUserPointsInFirebase(receiverId, newPoints);
      console.log(`🧈 ${receiverId} now has ${newPoints} butter points!`);
    } else {
      // Create new user with 1 point
      await saveUserToFirebase(receiverId, 1, 'Flour Peasant');
      console.log(`🧈 Created new user ${receiverId} with 1 butter point!`);
    }
  } catch (error) {
    console.error('❌ Error awarding butter:', error);
  }
};

/**
 * Example: Get leaderboard from Firebase
 * Usage: Call this for /court-rankings command
 */
export const getLeaderboardFromFirebase = async () => {
  try {
    const users = await getAllUsersFromFirebase();

    if (!users || Object.keys(users).length === 0) {
      return [];
    }

    // Convert to array and sort by points
    const leaderboard = Object.entries(users)
      .map(([userId, userData]) => ({
        userId,
        ...userData,
      }))
      .sort((a, b) => b.points - a.points);

    return leaderboard;
  } catch (error) {
    console.error('❌ Error getting leaderboard:', error);
    return [];
  }
};
