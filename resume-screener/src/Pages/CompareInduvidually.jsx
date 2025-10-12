import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const CompareInduvidually = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    resume, 
    jobDescription, 
    comparison, 
  } = location.state || {};

  if (!resume || !jobDescription || !comparison) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">No Comparison Data Available</h1>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-blue-200 hover:text-white transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Resume</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white">Detailed Comparison</h1>
            <p className="text-blue-200">Candidate vs Job Description</p>
          </div>
          
          <div className="w-24"></div> {/* Spacer for balance */}
        </div>

        {/* Comparison Overview */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Candidate Info */}
            <div className="bg-blue-500/10 rounded-xl p-6 border border-blue-500/20">
              <h2 className="text-2xl font-bold text-white mb-4">Candidate</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-blue-300 text-sm">Name</p>
                  <p className="text-white font-semibold">{resume.candidateName}</p>
                </div>
                <div>
                  <p className="text-blue-300 text-sm">Email</p>
                  <p className="text-white font-semibold">{resume.email}</p>
                </div>
                <div>
                  <p className="text-blue-300 text-sm">Experience</p>
                  <p className="text-white font-semibold">
                    {resume.totalExperience > 0 ? `${resume.totalExperience} years` : 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-blue-300 text-sm">Education</p>
                  <p className="text-white font-semibold">{resume.education || 'Not specified'}</p>
                </div>
              </div>
            </div>

            {/* Job Description Info */}
            <div className="bg-green-500/10 rounded-xl p-6 border border-green-500/20">
              <h2 className="text-2xl font-bold text-white mb-4">Job Description</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-green-300 text-sm">Title</p>
                  <p className="text-white font-semibold">{jobDescription.title}</p>
                </div>
                <div>
                  <p className="text-green-300 text-sm">Company</p>
                  <p className="text-white font-semibold">{jobDescription.companyName}</p>
                </div>
                <div>
                  <p className="text-green-300 text-sm">Location</p>
                  <p className="text-white font-semibold">{jobDescription.location || 'Not specified'}</p>
                </div>
                {jobDescription.jdUrl && (
                  <div>
                    <p className="text-green-300 text-sm">Job Description PDF</p>
                    <a
                      href={jobDescription.jdUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-300 hover:text-green-200 underline text-sm"
                    >
                      View PDF
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Match Scores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-green-500/20 rounded-xl p-6 text-center border border-green-500/30">
            <div className="text-3xl font-bold text-green-300 mb-2">
              {comparison.matchScore}%
            </div>
            <div className="text-green-200 font-medium">Overall Match</div>
          </div>
          <div className="bg-blue-500/20 rounded-xl p-6 text-center border border-blue-500/30">
            <div className="text-3xl font-bold text-blue-300 mb-2">
              {comparison.SkillOverLap}%
            </div>
            <div className="text-blue-200 font-medium">Skill Overlap</div>
          </div>
          <div className="bg-purple-500/20 rounded-xl p-6 text-center border border-purple-500/30">
            <div className="text-3xl font-bold text-purple-300 mb-2">
              {resume.totalExperience || 'N/A'}
            </div>
            <div className="text-purple-200 font-medium">Years Experience</div>
          </div>
        </div>

        {/* Pros and Cons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Pros */}
          <div className="bg-green-500/10 rounded-xl p-6 border border-green-500/20">
            <h3 className="text-xl font-bold text-green-300 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Strengths ({comparison.pros?.length || 0})
            </h3>
            <ul className="space-y-2">
              {comparison.pros?.map((pro, index) => (
                <li key={index} className="text-green-200 flex items-start">
                  <svg className="w-4 h-4 mr-2 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {pro}
                </li>
              ))}
            </ul>
          </div>

          {/* Cons */}
          <div className="bg-red-500/10 rounded-xl p-6 border border-red-500/20">
            <h3 className="text-xl font-bold text-red-300 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Areas for Improvement ({comparison.cons?.length || 0})
            </h3>
            <ul className="space-y-2">
              {comparison.cons?.map((con, index) => (
                <li key={index} className="text-red-200 flex items-start">
                  <svg className="w-4 h-4 mr-2 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {con}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Justification */}
        {comparison.Justification && (
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">Analysis & Justification</h3>
            <p className="text-blue-200 leading-relaxed whitespace-pre-wrap">
              {comparison.Justification}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompareInduvidually;