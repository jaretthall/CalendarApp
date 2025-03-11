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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Admin credentials
const ADMIN_EMAIL = 'admin@clinicamedicos.org';
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
      setIsAuthenticated(!!user);
      
      // Check if user is admin by email
      if (user && user.email) {
        const admin = user.email === ADMIN_EMAIL;
        setIsAdmin(admin);
        console.log('Auth state changed:', { 
          email: user.email,
          isAdmin: admin,
          shouldBeAdmin: user.email === ADMIN_EMAIL,
          adminEmail: ADMIN_EMAIL
        });
      } else {
        setIsAdmin(false);
        console.log('Auth state changed: Not logged in or no email');
      }
      
      // Set read-only status
      setIsReadOnly(user?.email === READ_ONLY_EMAIL);
      
      setLoading(false);
    });
    
    // Clean up subscription
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Special case for admin login
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        console.log('Attempting admin login with:', { email, adminEmail: ADMIN_EMAIL });
        await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
        return true;
      }
      
      // For read-only access with empty password, use the read-only account
      if (email.trim() !== '' && password === '') {
        console.log('Attempting read-only login with blank password');
        await signInWithEmailAndPassword(auth, READ_ONLY_EMAIL, READ_ONLY_PASSWORD);
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
        register
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