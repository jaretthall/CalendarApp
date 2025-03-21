import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Divider, 
  Button, 
  TextField, 
  Avatar, 
  IconButton,
  CircularProgress,
  Collapse,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Comment as CommentIcon,
  Send as SendIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Save as SaveIcon,
  Person as PersonIcon,
  NoteAlt as NoteAltIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import RichTextEditor from '../common/RichTextEditor';
import { useNotes } from '../../contexts/NoteContext';
import { useAuth } from '../../contexts/AuthContext';

interface NotesSectionProps {
  date: Date;
}

const NotesSection: React.FC<NotesSectionProps> = ({ date }) => {
  console.log('Rendering NotesSection with date:', date); // Debug log
  const { note, comments, fetchNote, fetchComments, saveNote, addComment, deleteComment, loading } = useNotes();
  const { isAuthenticated, isReadOnly, currentUser } = useAuth();
  
  const [noteContent, setNoteContent] = useState<string>('');
  const [isEditingNote, setIsEditingNote] = useState<boolean>(false);
  const [showComments, setShowComments] = useState<boolean>(true);
  const [newComment, setNewComment] = useState<string>('');
  const [localLoading, setLocalLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [lastFetchedDate, setLastFetchedDate] = useState<string>('');

  // Memoize fetch functions to prevent recreation on each render
  const memoizedFetchNote = useCallback(async (date: Date) => {
    try {
      await fetchNote(date);
    } catch (error) {
      console.error('NotesSection - Error fetching note:', error);
      setError('Failed to load notes');
    }
  }, [fetchNote]);
  
  const memoizedFetchComments = useCallback(async (date: Date) => {
    try {
      await fetchComments(date);
    } catch (error) {
      console.error('NotesSection - Error fetching comments:', error);
      setError('Failed to load comments');
    }
  }, [fetchComments]);

  useEffect(() => {
    // Only fetch when the month/year changes to prevent infinite loops
    const currentDateFormat = format(date, 'yyyy-MM');
    
    if (currentDateFormat !== lastFetchedDate) {
      console.log('NotesSection - Fetching data for date:', date);
      console.log('NotesSection - Date format for fetch:', currentDateFormat);
      
      setLastFetchedDate(currentDateFormat);
      
      // Separate the data fetching operations
      memoizedFetchNote(date);
      memoizedFetchComments(date);
    }
  }, [date, lastFetchedDate, memoizedFetchNote, memoizedFetchComments]);

  useEffect(() => {
    // Update local state when note is loaded from context
    console.log('NotesSection - Note updated in context:', note);
    if (note) {
      setNoteContent(note.content || '');
      console.log('NotesSection - Note content set:', note.content.substring(0, 50) + '...');
    } else {
      setNoteContent('');
      console.log('NotesSection - No note found, content cleared');
    }
  }, [note]);

  const handleNoteChange = (content: string) => {
    console.log('Note content updated');
    setNoteContent(content);
    // Auto-save feature could be added here if desired
  };

  const handleSaveNote = async () => {
    try {
      console.log('Saving note...');
      setLocalLoading(true);
      setError('');
      setSuccess('');
      
      // Check authentication
      if (!isAuthenticated || isReadOnly) {
        console.error('Cannot save note: User not authenticated or in read-only mode');
        setError('You need to log in to save notes');
        return;
      }
      
      const result = await saveNote(noteContent);
      
      if (result) {
        setSuccess('Notes saved successfully');
        setIsEditingNote(false);
        console.log('Note saved successfully');
      } else {
        setError('Failed to save notes. Please try again.');
        console.error('Failed to save notes');
      }
    } catch (error) {
      console.error('NotesSection - Error saving note:', error);
      setError('An error occurred while saving notes');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleAddComment = async () => {
    try {
      console.log('Adding comment...');
      setLocalLoading(true);
      setError('');
      setSuccess('');
      
      // Check authentication
      if (!isAuthenticated || isReadOnly) {
        console.error('Cannot add comment: User not authenticated or in read-only mode');
        setError('You need to log in to add comments');
        return;
      }
      
      if (!newComment.trim()) {
        console.error('Cannot add empty comment');
        setError('Comment cannot be empty');
        return;
      }
      
      const result = await addComment(newComment);
      
      if (result) {
        setSuccess('Comment added successfully');
        setNewComment('');
        console.log('Comment added successfully');
      } else {
        setError('Failed to add comment. Please try again.');
        console.error('Failed to add comment');
      }
    } catch (error) {
      console.error('NotesSection - Error adding comment:', error);
      setError('An error occurred while adding comment');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setLocalLoading(true);
    setError(null);
    
    try {
      await deleteComment(commentId);
    } catch (err) {
      setError('An error occurred while deleting the comment');
      console.error(err);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy h:mm a');
    } catch (err) {
      return 'Invalid date';
    }
  };

  return (
    <Paper 
      sx={{ 
        mt: 4, 
        p: 3, 
        borderTop: '4px solid #1976d2', 
        boxShadow: 3,
        border: '1px solid #1976d2',
        borderRadius: '8px',
        position: 'relative',
        bgcolor: '#f9fbff'
      }}
      id="notes-section"
    >
      <Typography 
        variant="h5" 
        gutterBottom 
        sx={{ 
          color: '#1976d2', 
          mb: 2,
          fontWeight: 'bold',
          textAlign: 'center'
        }}
      >
        Monthly Notes &amp; Comments
      </Typography>
      
      {/* Debugging indicator */}
      <Box 
        sx={{ 
          position: 'absolute', 
          top: 10, 
          right: 10, 
          bgcolor: '#e3f2fd', 
          px: 1, 
          py: 0.5, 
          borderRadius: 1,
          fontSize: '0.75rem'
        }}
      >
        {format(date, 'MMMM yyyy')}
      </Box>
      
      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3, borderBottom: '1px solid #e0e0e0' }}>
        <Tab 
          icon={<NoteAltIcon />} 
          label="Notes" 
          iconPosition="start"
        />
        <Tab 
          icon={<CommentIcon />} 
          label={`Comments (${comments.length})`} 
          iconPosition="start"
        />
      </Tabs>
      
      {activeTab === 0 && (
        <Box>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Notes for {format(date, 'MMMM yyyy')}
            </Typography>
            
            {isAuthenticated && !isReadOnly && !isEditingNote && (
              <Button 
                startIcon={<EditIcon />}
                variant="outlined"
                size="small"
                onClick={() => setIsEditingNote(true)}
              >
                Edit Notes
              </Button>
            )}
            
            {isEditingNote && (
              <Button 
                startIcon={<SaveIcon />}
                variant="contained"
                color="primary"
                size="small"
                onClick={handleSaveNote}
                disabled={localLoading}
              >
                {localLoading ? <CircularProgress size={20} /> : 'Save Notes'}
              </Button>
            )}
          </Box>
          
          {(error || success) && (
            <Box sx={{ mb: 2 }}>
              <Collapse in={!!error || !!success}>
                {error && <Alert severity="error">{error}</Alert>}
                {success && <Alert severity="success">{success}</Alert>}
              </Collapse>
            </Box>
          )}
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              <RichTextEditor 
                content={noteContent}
                onChange={(content) => {
                  console.log('Note content changed');
                  // Force a re-render to ensure editor is responsive when focused
                  if (content === noteContent) {
                    setNoteContent(prev => prev);
                  }
                  handleNoteChange(content);
                }}
                readOnly={!isEditingNote || !isAuthenticated || isReadOnly}
                placeholder="Add notes for this month..."
                height={300}
                toolbarHidden={!isEditingNote || !isAuthenticated || isReadOnly}
              />
              
              {note && note.modifiedAt && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Last updated: {formatDate(note.modifiedAt)}
                </Typography>
              )}
            </Box>
          )}
        </Box>
      )}
      
      {activeTab === 1 && (
        <Box>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Comments for {format(date, 'MMMM yyyy')}
            </Typography>
            
            <IconButton onClick={() => setShowComments(!showComments)}>
              {showComments ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
          
          {error && (
            <Box sx={{ mb: 2 }}>
              <Collapse in={!!error}>
                <Alert severity="error">{error}</Alert>
              </Collapse>
            </Box>
          )}
          
          <Collapse in={showComments}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box>
                {comments.length > 0 ? (
                  <Box sx={{ mb: 3 }}>
                    {comments.map((comment) => (
                      <Box 
                        key={comment.id} 
                        sx={{ 
                          mb: 2, 
                          p: 2, 
                          bgcolor: 'background.paper',
                          borderRadius: 1,
                          border: '1px solid #e0e0e0'
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}>
                              <PersonIcon />
                            </Avatar>
                            <Typography variant="subtitle2">
                              {comment.userName}
                            </Typography>
                          </Box>
                          
                          {isAuthenticated && 
                            (currentUser?.uid === comment.userId || !isReadOnly) && (
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDeleteComment(comment.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                        
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                          {comment.content}
                        </Typography>
                        
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          {formatDate(comment.createdAt)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', my: 3 }}>
                    No comments yet. Be the first to add a comment!
                  </Typography>
                )}
                
                {isAuthenticated && !isReadOnly && (
                  <Box sx={{ mt: 2 }}>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Add a comment
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        multiline
                        rows={3}
                        fullWidth
                        placeholder="Write a comment..."
                        value={newComment}
                        onChange={(e) => {
                          console.log('Comment text changed to:', e.target.value);
                          setNewComment(e.target.value);
                        }}
                        onFocus={() => {
                          console.log('Comment field focused');
                          // Force re-render to ensure field is responsive
                          setNewComment(prev => prev);
                        }}
                        onBlur={() => {
                          console.log('Comment field blur');
                        }}
                        onClick={() => {
                          console.log('Comment field clicked');
                          // Force re-render to ensure field is responsive
                          setNewComment(prev => prev);
                        }}
                        disabled={!isAuthenticated || isReadOnly || localLoading}
                        size="small"
                        id="comment-input-field"
                        sx={{ minHeight: '100px' }}
                      />
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleAddComment}
                        disabled={!isAuthenticated || isReadOnly || !newComment.trim() || localLoading}
                        startIcon={localLoading ? <CircularProgress size={20} /> : <SendIcon />}
                        sx={{ alignSelf: 'flex-end' }}
                      >
                        Post
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </Collapse>
        </Box>
      )}
    </Paper>
  );
};

export default NotesSection; 