import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ResumeData = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { resume } = location.state || {};

  if (!resume) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">No Resume Data</h1>
          <button
            onClick={() => navigate('/landing')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Landing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-32 h-32 bg-white rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-blue-300 rounded-full blur-xl"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 text-blue-200 hover:text-white transition-colors"
        >
          ← Back to Group
        </button>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{resume.candidateName || 'Unknown Candidate'}</h1>
              <p className="text-blue-200">{resume.email || 'No email provided'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-blue-300 mb-2">Experience</h3>
                <p className="text-white">
                  {resume.totalExperience > 0 ? `${resume.totalExperience} years` : 'Not specified'}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-blue-300 mb-2">Education</h3>
                <p className="text-white">{resume.education || 'Not specified'}</p>
              </div>

              {resume.pdfUrl && (
                <div>
                  <h3 className="text-sm font-medium text-blue-300 mb-2">Resume PDF</h3>
                  <a
                    href={resume.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-300 hover:text-blue-200 underline"
                  >
                    View PDF Document
                  </a>
                </div>
              )}
            </div>

            {resume.skills && resume.skills.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-blue-300 mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {resume.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-white/10 text-blue-200 text-sm rounded-full border border-white/20"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {resume.experience && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-blue-300 mb-2">Experience Details</h3>
              <div className="bg-white/5 p-4 rounded-lg">
                <p className="text-white whitespace-pre-wrap">{resume.experience}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeData;