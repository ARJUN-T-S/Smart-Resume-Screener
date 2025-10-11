import React from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const navigate = useNavigate();

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

      <div className="text-center relative z-10">
        <h1 className="text-5xl font-bold text-white mb-6">
          Resume<span className="text-blue-300">Screener</span>
        </h1>
        <p className="text-xl text-blue-100 mb-8 max-w-md mx-auto">
          Smart resume analysis powered by AI
        </p>
        <button 
          onClick={() => navigate('/auth')}
          className="bg-white text-blue-900 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-50 transform hover:scale-105 transition-all duration-300 shadow-2xl"
        >
          Start Screening
        </button>
      </div>
    </div>
  );
};

export default HomePage;