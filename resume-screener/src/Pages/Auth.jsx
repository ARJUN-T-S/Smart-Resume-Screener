import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile 
} from 'firebase/auth';
import { auth } from '../fireabse/config';
import { setIdToken, setUser } from '../store/authSlice';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [googleUserData, setGoogleUserData] = useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const googleProvider = new GoogleAuthProvider();

  const API_BASE_URL = 'https://smart-resume-screener-r6s0.onrender.com';

  // Make API call to backend with Bearer token
  const makeApiCall = async (endpoint, method = 'POST', idToken = null, body = null) => {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (idToken) {
      headers['Authorization'] = `Bearer ${idToken}`;
    }

    const config = {
      method,
      headers,
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      config.body = JSON.stringify(body);
    }

    try {
      console.log(`Making ${method} request to: ${API_BASE_URL}${endpoint}`);

      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Non-JSON response:', textResponse);
        throw new Error(`Server error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || `API call failed with status ${response.status}`);
      }
      
      return result;
    } catch (error) {
      console.error('API call error:', error);
      throw error;
    }
  };

  // Handle successful authentication
  const handleSuccessfulAuth = (userCredential, idToken, userName = '') => {
    const userData = {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: userCredential.user.displayName || userName,
    };
    
    dispatch(setIdToken(idToken));
    dispatch(setUser(userData));

    localStorage.setItem('idToken', idToken);
    localStorage.setItem('user', JSON.stringify(userData));

    // Navigate to landing page
    navigate('/landing');
  };

  // Handle email/password authentication
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Validation
    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (!isLogin && !name) {
      setError('Please enter your name');
      setLoading(false);
      return;
    }
    
    try {
      let userCredential;
      
      if (isLogin) {
        // LOGIN: Send email and password to Firebase
        console.log('Attempting login with:', { email, password });
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('Firebase sign in successful');

        // Get the ID token
        const idToken = await userCredential.user.getIdToken();
        console.log('Firebase ID Token received');

        // Verify user exists in backend
        try {
          await makeApiCall('/recruiter', 'GET', idToken);
          console.log('User verified in backend');
        } catch (apiError) {
          console.log('User might not exist in DB yet, but Firebase auth succeeded'+apiError);
          // Continue with login since Firebase auth worked
        }

        handleSuccessfulAuth(userCredential, idToken);

      } else {
        // SIGNUP: First create Firebase account with email and password
        console.log('Attempting signup with:', { email, password, name });
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log('Firebase account created successfully');

        // Update profile with name
        if (name) {
          await updateProfile(userCredential.user, {
            displayName: name
          });
          console.log('Profile updated with name:', name);
        }

        // Get the ID token
        const idToken = await userCredential.user.getIdToken();
        console.log('Firebase ID Token received');

        // Create user in backend with name and email
        console.log('Creating user in backend...');
        const apiResponse = await makeApiCall(
          '/recruiter/postRecruiter', 
          'POST', 
          idToken, 
          {
            name: name,
            email: email
          }
        );
        console.log('Signup API response:', apiResponse);

        handleSuccessfulAuth(userCredential, idToken, name);
      }

    } catch (error) {
      console.error('Authentication error:', error);
      setError(getUserFriendlyError(error));
    } finally {
      setLoading(false);
    }
  };

  // Handle Google authentication
  const handleGoogleAuth = async () => {
    setLoading(true);
    setError('');
    
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      console.log('Google authentication successful');
      
      const idToken = await userCredential.user.getIdToken();
      console.log('Firebase ID Token received');

      if (!isLogin) {
        // GOOGLE SIGNUP: Check if user has a name from Google
        if (!userCredential.user.displayName) {
          // Store user data and show name modal
          setGoogleUserData({ userCredential, idToken });
          setShowNameModal(true);
          setLoading(false);
          return;
        }

        // For Google signup: Create user in backend with Google profile data
        console.log('Creating Google user in backend...');
        const apiResponse = await makeApiCall(
          '/recruiter/postRecruiter', 
          'POST', 
          idToken, 
          {
            name: userCredential.user.displayName,
            email: userCredential.user.email
          }
        );
        console.log('Google signup API response:', apiResponse);
      } else {
        // GOOGLE LOGIN: Verify user exists in backend
        try {
          await makeApiCall('/recruiter', 'GET', idToken);
          console.log('Google user verified in backend');
        } catch (apiError) {
          console.log('Google user might not exist in DB yet, but Firebase auth succeeded'+apiError);
          // Continue with login since Firebase auth worked
        }
      }

      handleSuccessfulAuth(userCredential, idToken);

    } catch (error) {
      console.error('Google authentication error:', error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        // User closed the popup, no need to show error
        console.log('Google sign-in cancelled by user');
      } else {
        setError(getUserFriendlyError(error));
      }
      setLoading(false);
    }
  };

  // Handle Google signup with custom name
  const handleGoogleSignupWithName = async (userName) => {
    setLoading(true);
    
    try {
      const { userCredential, idToken } = googleUserData;

      // Update profile with the provided name
      if (userName) {
        await updateProfile(userCredential.user, {
          displayName: userName
        });
        console.log('Google profile updated with name:', userName);
      }

      // Create recruiter in backend with the provided name
      console.log('Creating Google user with custom name in backend...');
      const apiResponse = await makeApiCall(
        '/recruiter/postRecruiter', 
        'POST', 
        idToken, 
        {
          name: userName,
          email: userCredential.user.email
        }
      );
      console.log('Google signup with name API response:', apiResponse);

      handleSuccessfulAuth(userCredential, idToken, userName);
      
      // Clean up
      setShowNameModal(false);
      setGoogleUserData(null);
      
    } catch (error) {
      console.error('Google signup with name error:', error);
      setError(getUserFriendlyError(error));
      setLoading(false);
    }
  };

  // Get user-friendly error messages
  const getUserFriendlyError = (error) => {
    const errorCode = error.code || error.message;
    
    if (errorCode.includes('auth/invalid-email')) {
      return 'Please enter a valid email address.';
    } else if (errorCode.includes('auth/user-not-found')) {
      return 'No account found with this email. Please sign up first.';
    } else if (errorCode.includes('auth/wrong-password')) {
      return 'Invalid password. Please try again.';
    } else if (errorCode.includes('auth/email-already-in-use')) {
      return 'An account with this email already exists. Please login instead.';
    } else if (errorCode.includes('auth/weak-password')) {
      return 'Password should be at least 6 characters.';
    } else if (errorCode.includes('auth/network-request-failed')) {
      return 'Network error. Please check your internet connection.';
    } else if (errorCode.includes('auth/popup-blocked')) {
      return 'Popup was blocked by your browser. Please allow popups for this site.';
    } else if (errorCode.includes('auth/unauthorized-domain')) {
      return 'Authentication error: Please refresh the page and try again.';
    } else if (error.message.includes('HTML instead of JSON') || error.message.includes('Server error')) {
      return 'Backend server error. Please try again in a few moments.';
    } else {
      return error.message || 'An error occurred. Please try again.';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-32 h-32 bg-white rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-blue-300 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-purple-300 rounded-full blur-xl"></div>
      </div>

      {/* Floating Icons */}
      <div className="absolute top-1/4 right-1/4 text-white opacity-20 text-6xl">📄</div>
      <div className="absolute bottom-1/3 left-1/4 text-white opacity-20 text-6xl">🔍</div>
      <div className="absolute top-1/3 left-1/2 text-white opacity-20 text-6xl">💼</div>

      {/* Name Modal for Google Signup */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Complete Your Profile</h2>
            <p className="text-gray-600 mb-6">Please provide your name to complete the signup process.</p>
            
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors mb-6"
              required
            />
            
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setShowNameModal(false);
                  setGoogleUserData(null);
                  setLoading(false);
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleGoogleSignupWithName(name)}
                disabled={!name.trim()}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Please wait...' : 'Complete Signup'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 w-full max-w-md mx-4 border border-white/20 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Resume<span className="text-blue-300">Screener</span>
          </h1>
          <p className="text-blue-100">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full bg-white text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:transform-none flex items-center justify-center space-x-3 mb-6"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>
            {loading ? 'Please wait...' : `Continue with Google ${isLogin ? 'Login' : 'Sign Up'}`}
          </span>
        </button>

        <div className="flex items-center mb-6">
          <div className="flex-1 border-t border-white/20"></div>
          <span className="mx-4 text-blue-200 text-sm">OR</span>
          <div className="flex-1 border-t border-white/20"></div>
        </div>

        {/* Toggle Switch */}
        <div className="flex bg-white/10 rounded-lg p-1 mb-6">
          <button
            onClick={() => {
              setIsLogin(true);
              setError('');
            }}
            className={`flex-1 py-2 rounded-md transition-all ${
              isLogin ? 'bg-blue-600 text-white' : 'text-blue-100'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => {
              setIsLogin(false);
              setError('');
            }}
            className={`flex-1 py-2 rounded-md transition-all ${
              !isLogin ? 'bg-blue-600 text-white' : 'text-blue-100'
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          {/* Name field only for signup */}
          {!isLogin && (
            <div>
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:border-blue-400 focus:bg-white/10 transition-colors"
                required={!isLogin}
              />
            </div>
          )}
          
          <div>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:border-blue-400 focus:bg-white/10 transition-colors"
              required
            />
          </div>
          
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:border-blue-400 focus:bg-white/10 transition-colors"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-blue-900 py-3 rounded-lg font-semibold hover:bg-blue-50 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:transform-none"
          >
            {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Create Account')}
          </button>
        </form>

        <p className="text-center text-blue-200 mt-6 text-sm">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-white font-semibold hover:underline"
          >
            {isLogin ? 'Sign up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;