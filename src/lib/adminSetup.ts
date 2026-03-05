import { doc, setDoc, getDoc, getDocs, collection } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Setup admin users in Firestore
 * This should be run once to create the admins collection
 */
export async function setupAdminUsers() {
  console.log('Setting up admin users...');
  
  // List of admin emails that should have access
  const adminEmails = [
    // Add your admin emails here
    'your-email@domain.com'
  ];
  
  try {
    // First, get all users from Firebase Auth (this requires admin SDK)
    // For now, we'll manually add users by their UID
    
    // You need to get the UID from Firebase Authentication
    // Go to Firebase Console -> Authentication -> Users -> Click on user -> Copy UID
    
    const adminUIDs = [
      // Replace with actual UIDs from Firebase Auth
      'user-uid-here-2'
    ];
    
    for (const uid of adminUIDs) {
      await setDoc(doc(db, 'admins', uid), {
        email: 'admin@example.com', // Optional: store email for reference
        role: 'admin',
        createdAt: new Date().toISOString(),
        isActive: true
      });
      
      console.log(`Added admin with UID: ${uid}`);
    }
    
    console.log('Admin setup completed!');
    return true;
  } catch (error) {
    console.error('Error setting up admins:', error);
    return false;
  }
}

/**
 * Check if current user is admin
 */
export async function checkIfAdmin(uid: string): Promise<boolean> {
  try {
    const adminDoc = await doc(db, 'admins', uid);
    const adminSnap = await getDoc(adminDoc);
    return adminSnap.exists();
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Get current admin user info
 */
export async function getCurrentAdmin(uid: string) {
  try {
    const adminDoc = await doc(db, 'admins', uid);
    const adminSnap = await getDoc(adminDoc);
    
    if (adminSnap.exists()) {
      return adminSnap.data();
    }
    
    return null;
  } catch (error) {
    console.error('Error getting admin info:', error);
    return null;
  }
}

/**
 * Instructions for manual setup
 */
export const adminSetupInstructions = `
🔧 ADMIN SETUP INSTRUCTIONS

1. Get User UID:
   - Go to Firebase Console
   - Navigate to Authentication → Users
   - Click on the user you want to make admin
   - Copy the "User ID" (UID)

2. Update adminUIDs array:
   - Open src/lib/adminSetup.ts
   - Replace 'user-uid-here-1' with actual UIDs
   - Add more UIDs as needed

3. Run setup:
   - Call setupAdminUsers() from your app or run in console
   - Or manually create documents in Firestore Console

4. Manual Firestore Console Setup (Alternative):
   - Go to Firestore Database
   - Create collection "admins"
   - Add documents with:
     * Document ID: User UID
     * Fields: email (string), role (string), isActive (boolean)

5. Test:
   - Log in with admin account
   - Try accessing admin panel
   - Check browser console for any permission errors

⚠️  IMPORTANT: 
   - Only users in the admins collection can access admin features
   - Make sure UIDs are correct (no typos)
   - Test with actual Firebase Auth users
`;
