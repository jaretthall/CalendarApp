import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  InputAdornment,
  IconButton,
  Divider
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isReadOnly } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Get the redirect path from location state or default to '/'
  const from = location.state?.from?.pathname || '/';

  // Immediately redirect to home if in read-only mode
  React.useEffect(() => {
    if (isReadOnly) {
      navigate('/', { replace: true });
    }
  }, [isReadOnly, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      const success = await login(username, password);
      
      if (success) {
        navigate(from, { replace: true });
      } else {
        setError('Invalid credentials');
      }
    } catch (error) {
      setError('An error occurred during login');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReadOnlyAccess = async () => {
    try {
      const success = await login(username || 'Guest', '');
      
      if (success) {
        navigate(from, { replace: true });
      } else {
        setError('Failed to access read-only mode');
      }
    } catch (error) {
      setError('An error occurred');
      console.error('Read-only access error:', error);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        p: 2
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 400,
          width: '100%',
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <img 
            src="/assets/logo.png" 
            alt="Provider Schedule Logo" 
            style={{ height: 80, marginBottom: 16 }}
          />
          <Typography variant="h5" component="h1" gutterBottom>
            Provider Schedule
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sign in to manage the application
          </Typography>
          <Alert severity="info" sx={{ mt: 2, textAlign: 'left' }}>
            You are currently in read-only mode. Login to make changes.
          </Alert>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <TextField
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            fullWidth
            margin="normal"
            autoFocus
            required
          />
          
          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            margin="normal"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          
          <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={loading}
            >
              Sign In
            </Button>
            
            <Divider sx={{ my: 2 }}>
              <Typography variant="caption" color="text.secondary">
                OR
              </Typography>
            </Divider>
            
            <Button
              variant="outlined"
              color="secondary"
              fullWidth
              onClick={() => navigate('/')}
              disabled={loading}
            >
              Return to Read-Only View
            </Button>
          </Box>
        </form>
        
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Contact your administrator for login credentials
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginPage; 