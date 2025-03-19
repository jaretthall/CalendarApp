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

// Read-only credentials for regular users
const READ_ONLY_EMAIL = 'readonly@example.com';
const READ_ONLY_PASSWORD = 'readonly';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      
      // Only set authenticated if not in read-only mode
      if (user && !isReadOnly) {
        setIsAuthenticated(true);
      } else if (!user) {
        setIsAuthenticated(false);
      }
      
      // Check if user is admin by email
      if (user && user.email) {
        const admin = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() || 
                      user.email.toLowerCase() === (ADMIN_USERNAME + '@clinicamedicos.org').toLowerCase();
        setIsAdmin(admin);
        console.log('Auth state changed:', { 
          email: user.email,
          isAdmin: admin,
          shouldBeAdmin: user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() || 
                        user.email.toLowerCase() === (ADMIN_USERNAME + '@clinicamedicos.org').toLowerCase(),
          adminEmail: ADMIN_EMAIL,
          adminUsername: ADMIN_USERNAME
        });
      } else {
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
      
      // For read-only access with empty password, use read-only mode without actual authentication
      if (email.trim() !== '' && password === '') {
        console.log('Entering read-only mode (no Firebase authentication)');
        setReadOnlyMode(true);
        return true;
      }
      
      // Regular login
      console.log('Attempting regular login with:', { email });
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // If in read-only mode, just disable it
      if (isReadOnly) {
        setReadOnlyMode(false);
        return;
      }
      
      // Otherwise do a normal signout
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const register = async (email: string, password: string): Promise<boolean> => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };
  
  // Function to enable/disable read-only mode
  const setReadOnlyMode = (enabled: boolean) => {
    setIsReadOnly(enabled);
    setIsAuthenticated(enabled); // In read-only mode, we're authenticated but with limited permissions
    setIsAdmin(false); // Read-only users are never admins
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