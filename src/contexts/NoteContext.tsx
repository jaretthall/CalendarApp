import React, { createContext, useState, useEffect, useContext } from 'react';
import { format } from 'date-fns';
import databaseService from '../services/DatabaseService';
import { useAuth } from './AuthContext';

// Types
export interface Note {
  monthYear: string; // Format: YYYY-MM
  content: string;
  lastModifiedBy?: string;
  createdAt: string;
  modifiedAt: string;
}

export interface Comment {
  id: string;
  monthYear: string; // Format: YYYY-MM
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

interface NoteContextType {
  note: Note | null;
  comments: Comment[];
  fetchNote: (date: Date) => Promise<void>;
  fetchComments: (date: Date) => Promise<void>;
  saveNote: (content: string) => Promise<boolean>;
  addComment: (content: string) => Promise<boolean>;
  deleteComment: (commentId: string) => Promise<boolean>;
  loading: boolean;
}

const NoteContext = createContext<NoteContextType | undefined>(undefined);

export const NoteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [note, setNote] = useState<Note | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentMonthYear, setCurrentMonthYear] = useState<string>(format(new Date(), 'yyyy-MM'));
  
  const { currentUser, isAuthenticated } = useAuth();

  // Fetch notes for the specified month
  const fetchNote = async (date: Date): Promise<void> => {
    const monthYear = format(date, 'yyyy-MM');
    setCurrentMonthYear(monthYear);
    setLoading(true);
    
    try {
      // In a real implementation, this would call an API/database service
      const result = await databaseService.getNoteForMonth(monthYear);
      setNote(result);
    } catch (error) {
      console.error('Error fetching note:', error);
      setNote(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch comments for the specified month
  const fetchComments = async (date: Date): Promise<void> => {
    const monthYear = format(date, 'yyyy-MM');
    setCurrentMonthYear(monthYear);
    setLoading(true);
    
    try {
      // In a real implementation, this would call an API/database service
      const result = await databaseService.getCommentsForMonth(monthYear);
      setComments(result);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  // Save a note
  const saveNote = async (content: string): Promise<boolean> => {
    if (!isAuthenticated) {
      console.error('User not authenticated to save note');
      return false;
    }
    
    setLoading(true);
    
    try {
      // In a real implementation, this would call an API/database service
      const savedNote = await databaseService.saveNote({
        monthYear: currentMonthYear,
        content,
        lastModifiedBy: currentUser?.uid,
        createdAt: note?.createdAt || new Date().toISOString(),
        modifiedAt: new Date().toISOString()
      });
      
      setNote(savedNote);
      return true;
    } catch (error) {
      console.error('Error saving note:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Add a comment
  const addComment = async (content: string): Promise<boolean> => {
    if (!isAuthenticated || !currentUser) {
      console.error('User not authenticated to add comment');
      return false;
    }
    
    setLoading(true);
    
    try {
      // In a real implementation, this would call an API/database service
      const newComment: Comment = {
        id: Date.now().toString(), // Placeholder ID
        monthYear: currentMonthYear,
        userId: currentUser.uid,
        userName: currentUser.email || 'Unknown User',
        content,
        createdAt: new Date().toISOString()
      };
      
      await databaseService.addComment(newComment);
      
      setComments(prevComments => [...prevComments, newComment]);
      return true;
    } catch (error) {
      console.error('Error adding comment:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete a comment
  const deleteComment = async (commentId: string): Promise<boolean> => {
    if (!isAuthenticated) {
      console.error('User not authenticated to delete comment');
      return false;
    }
    
    setLoading(true);
    
    try {
      // In a real implementation, this would call an API/database service
      await databaseService.deleteComment(commentId);
      
      setComments(prevComments => prevComments.filter(comment => comment.id !== commentId));
      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <NoteContext.Provider
      value={{
        note,
        comments,
        fetchNote,
        fetchComments,
        saveNote,
        addComment,
        deleteComment,
        loading
      }}
    >
      {children}
    </NoteContext.Provider>
  );
};

export const useNotes = () => {
  const context = useContext(NoteContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NoteProvider');
  }
  return context;
}; 