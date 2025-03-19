import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  User
} from 'firebase/auth';
import { auth } from '../config/firebase-config';

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isReadOnly: boolean;
  currentUser: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (email: string, password: string) => Promise<boolean>;
  setReadOnlyMode: (enabled: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Admin credentials
const ADMIN_EMAIL = 'admin@clinicamedicos.org';
const ADMIN_USERNAME = 'Admin';
const ADMIN_PASSWORD = 'FamMed25!';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize with read-only mode as true by default
  const [isReadOnly, setIsReadOnly] = useState<boolean>(true);
  // Initialize as authenticated in read-only mode
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      
      // If we have a Firebase user and not in read-only mode, set authenticated
      if (user && !isReadOnly) {
        setIsAuthenticated(true);
        
        // Check if user is admin by email
        if (user.email) {
          const admin = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() || 
                        user.email.toLowerCase() === (ADMIN_USERNAME + '@clinicamedicos.org').toLowerCase();
          setIsAdmin(admin);
          console.log('Auth state changed:', { 
            email: user.email,
            isAdmin: admin,
            isReadOnly: isReadOnly,
            shouldBeAdmin: user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() || 
                          user.email.toLowerCase() === (ADMIN_USERNAME + '@clinicamedicos.org').toLowerCase(),
            adminEmail: ADMIN_EMAIL,
            adminUsername: ADMIN_USERNAME
          });
        }
      } else if (!user && !isReadOnly) {
        // If no Firebase user and not in read-only mode, set not authenticated
        setIsAuthenticated(false);
        setIsAdmin(false);
        console.log('Auth state changed: Not logged in or no email');
      }
      
      setLoading(false);
    });
    
    // Clean up subscription
    return () => unsubscribe();
  }, [isReadOnly]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Exit read-only mode when attempting to log in
      setReadOnlyMode(false);
      
      // Special case for admin login - allow both email and username
      if ((email.toLowerCase() === ADMIN_EMAIL.toLowerCase() || 
           email.toLowerCase() === ADMIN_USERNAME.toLowerCase()) && 
          password === ADMIN_PASSWORD) {
        console.log('Attempting admin login with:', { email, adminEmail: ADMIN_EMAIL, adminUsername: ADMIN_USERNAME });
        // Always use the full email for Firebase auth
        const adminEmailToUse = email.includes('@') ? email : `${ADMIN_USERNAME}@clinicamedicos.org`;
        await signInWithEmailAndPassword(auth, adminEmailToUse, ADMIN_PASSWORD);
        return true;
      }
      
      // For read-only access with empty password, switch back to read-only mode
      if (email.trim() !== '' && password === '') {
        console.log('Returning to read-only mode');
        setReadOnlyMode(true);
        return true;
      }
      
      // Regular login
      console.log('Attempting regular login with:', { email });
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      // If login fails, go back to read-only mode
      setReadOnlyMode(true);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // If already in read-only mode, nothing to do
      if (isReadOnly) {
        return;
      }
      
      // Otherwise do a normal signout and go back to read-only mode
      await signOut(auth);
      setReadOnlyMode(true);
    } catch (error) {
      console.error('Logout error:', error);
      // In case of error, still try to go back to read-only mode
      setReadOnlyMode(true);
    }
  };

  const register = async (email: string, password: string): Promise<boolean> => {
    try {
      // Exit read-only mode when registering
      setReadOnlyMode(false);
      await createUserWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      // If registration fails, go back to read-only mode
      setReadOnlyMode(true);
      return false;
    }
  };
  
  // Function to enable/disable read-only mode
  const setReadOnlyMode = (enabled: boolean) => {
    setIsReadOnly(enabled);
    setIsAuthenticated(enabled || (currentUser !== null)); // Authenticated if in read-only mode or if we have a Firebase user
    if (enabled) {
      setIsAdmin(false); // Read-only users are never admins
    } else if (currentUser?.email) {
      // When exiting read-only mode, recheck admin status based on current user
      const admin = currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() || 
                    currentUser.email.toLowerCase() === (ADMIN_USERNAME + '@clinicamedicos.org').toLowerCase();
      setIsAdmin(admin);
    }
    console.log(`Read-only mode ${enabled ? 'enabled' : 'disabled'}`);
  };

  if (loading) {
    // Return a loading state if authentication is still being determined
    return <div>Loading authentication...</div>;
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isAdmin,
        isReadOnly,
        currentUser,
        login,
        logout,
        register,
        setReadOnlyMode
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 