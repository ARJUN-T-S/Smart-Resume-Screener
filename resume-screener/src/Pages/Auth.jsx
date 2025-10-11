import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  GoogleAuthProvider 
} from 'firebase/auth';
import { auth } from '../fireabse/config';
import { setIdToken, setUser } from '../store/authSlice';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const googleProvider = new GoogleAuthProvider();

  const API_BASE_URL = 'http://localhost:5000';

  // Make API call to backend with Bearer token only
  const makeApiCall = async (endpoint, method = 'POST', idToken = null) => {
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

    try {
      console.log(`Making ${method} request to: ${API_BASE_URL}${endpoint}`);

      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      
      // Check if response is HTML (error page)
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        await response.text();
        throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}`);
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
  const handleSuccessfulAuth = (userCredential, idToken, name = '') => {
    const userData = {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: userCredential.user.displayName || name,
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
    
    try {
      let userCredential;
      
      if (isLogin) {
        // Login with email/password
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('Firebase sign in successful');

        // Get the ID token
        const idToken = await userCredential.user.getIdToken();
        console.log('Firebase ID Token:', idToken);

        // For login: Use GET /recruiter to verify user exists and get details
        try {
          const apiResponse = await makeApiCall('/recruiter', 'GET', idToken);
          console.log('Login API response:', apiResponse);
        } catch (apiError) {
          // If GET /recruiter fails with 404, user might not exist in DB yet
          // But we'll still allow login since Firebase auth succeeded
          console.log('User might not exist in DB yet, but Firebase auth succeeded',apiError);
        }

        handleSuccessfulAuth(userCredential, idToken);

      } else {
        // Sign up with email/password
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log('Firebase account created successfully');

        // Get the ID token
        const idToken = await userCredential.user.getIdToken();
        console.log('Firebase ID Token:', idToken);

        // For signup: Use POST /recruiter/postRecruiter to create recruiter in DB
        const apiResponse = await makeApiCall('/recruiter/postRecruiter', 'POST', idToken);
        console.log('Signup API response:', apiResponse);

        handleSuccessfulAuth(userCredential, idToken, name);
      }

    } catch (error) {
      console.error('Authentication error:', error.message);
      
      // Show user-friendly error message
      if (error.message.includes('HTML instead of JSON')) {
        alert('Backend server error. Please try again or contact support.');
      } else if (error.message.includes('invalid-email')) {
        alert('Please enter a valid email address.');
      } else if (error.message.includes('user-not-found') || error.message.includes('wrong-password')) {
        alert('Invalid email or password.');
      } else if (error.message.includes('email-already-in-use')) {
        alert('An account with this email already exists. Please login instead.');
      } else {
        alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Google authentication
  const handleGoogleAuth = async (isSignUp = false) => {
    setLoading(true);
    
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      console.log('Google authentication successful');
      
      const idToken = await userCredential.user.getIdToken();
      console.log('Firebase ID Token:', idToken);

      if (isSignUp) {
        // For Google signup: Use POST /recruiter/postRecruiter
        const apiResponse = await makeApiCall('/recruiter/postRecruiter', 'POST', idToken);
        console.log('Google signup API response:', apiResponse);
      } else {
        // For Google login: Use GET /recruiter to verify user
        try {
          const apiResponse = await makeApiCall('/recruiter', 'GET', idToken);
          console.log('Google login API response:', apiResponse);
        } catch (apiError) {
          // If GET /recruiter fails, user might not exist in DB yet
          console.log('Google user might not exist in DB yet, but Firebase auth succeeded',apiError);
        }
      }

      handleSuccessfulAuth(userCredential, idToken);

    } catch (error) {
      console.error('Google authentication error:', error.message);
      
      if (error.message.includes('popup-closed-by-user')) {
        // User closed the Google popup, no need to show error
        console.log('Google sign-in cancelled by user');
      } else if (error.message.includes('HTML instead of JSON')) {
        alert('Backend server error. Please try again or contact support.');
      } else {
        alert(error.message);
      }
    } finally {
      setLoading(false);
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

      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 w-full max-w-md mx-4 border border-white/20 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Resume<span className="text-blue-300">Screener</span>
          </h1>
          <p className="text-blue-100">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </p>
        </div>

        {/* Google Sign In Button */}
        <button
          onClick={() => handleGoogleAuth(!isLogin)}
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
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 rounded-md transition-all ${
              isLogin ? 'bg-blue-600 text-white' : 'text-blue-100'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
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
            onClick={() => setIsLogin(!isLogin)}
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