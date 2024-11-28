const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.deleteUser = functions.https.onCall(async (data, context) => {
  // Ensure the user is authenticated and has admin privileges
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can delete users.'
    );
  }

  const userId = data.userId;

  try {
    // Delete user from Authentication
    await admin.auth().deleteUser(userId);

    // Optionally delete user data from Firestore
    const db = admin.firestore();
    const userDoc = db.collection('users').doc(userId);
    await userDoc.delete();

    return { success: true, message: 'User deleted successfully.' };
  } catch (error) {
    console.error('Error deleting user:', error.message);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
