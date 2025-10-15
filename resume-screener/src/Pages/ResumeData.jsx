import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ResumeData = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { resume } = location.state || {};
  const { idToken } = useSelector((state) => state.auth);
  
  const [jobComparisons, setJobComparisons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch comparisons for this resume
  useEffect(() => {
    const fetchComparisons = async () => {
      if (!resume || !resume.groupId) {
        setError('No resume data or group ID found');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('Fetching comparisons for groupId:', resume.groupId);
        console.log('Current resume ID:', resume._id);

        // Use the correct endpoint: /other/getGroupsForJd/:groupId
        const comparisonsResponse = await fetch(`https://smart-resume-screener-r6s0.onrender.com/other/getGroupsForJd/${resume.groupId}`, {
          headers: {
            'Authorization': `Bearer ${idToken}`,
          },
        });

        console.log('Response status:', comparisonsResponse.status);

        if (!comparisonsResponse.ok) {
          throw new Error(`Failed to fetch comparisons: ${comparisonsResponse.status}`);
        }

        const comparisonsResult = await comparisonsResponse.json();
        console.log('Comparisons result:', comparisonsResult);
        
        if (comparisonsResult.success && comparisonsResult.data) {
          processComparisonsData(comparisonsResult.data);
        } else {
          setError(comparisonsResult.message || 'No comparison data found');
        }
      } catch (err) {
        console.error('Error fetching comparisons:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const processComparisonsData = (comparisonsData) => {
      console.log('Raw comparisons data:', comparisonsData);

      // Filter comparisons for this specific resume - FIXED FILTERING
      const resumeComparisons = comparisonsData.filter(
        comp => {
          const compResumeId = comp.resumeId?._id || comp.resumeId;
          const currentResumeId = resume._id;
          console.log('Comparing:', compResumeId, 'with:', currentResumeId);
          return compResumeId === currentResumeId;
        }
      );

      console.log('Filtered resume comparisons:', resumeComparisons);

      if (resumeComparisons.length === 0) {
        setError('No comparisons found for this resume');
        return;
      }

      // Extract unique job IDs with basic info
      const uniqueJobs = [];
      const seenJobIds = new Set();

      resumeComparisons.forEach(comp => {
        const jobId = comp.jobId?._id || comp.jobId;
        
        if (jobId && !seenJobIds.has(jobId)) {
          seenJobIds.add(jobId);
          
          // Extract job details - handle both object and string formats
          const jobTitle = comp.jobId?.title || 'Untitled Job';
          const companyName = comp.jobId?.companyName || 'Unknown Company';
          
          uniqueJobs.push({
            jobId: jobId,
            title: jobTitle,
            companyName: companyName,
            comparison: {
              matchScore: comp.matchScore,
              SkillOverLap: comp.SkillOverLap,
              Justification: comp.Justification,
              pros: comp.pros,
              cons: comp.cons
            }
          });
        }
      });

      console.log('Final job comparisons:', uniqueJobs);
      setJobComparisons(uniqueJobs);
    };

    fetchComparisons();
  }, [resume, idToken]);

  const handleJobClick = async (jobComparison) => {
    try {
      console.log('Fetching job details for:', jobComparison.jobId);
      
      const response = await fetch(`https://smart-resume-screener-r6s0.onrender.com/job-desc/${jobComparison.jobId}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch job description: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        const detailedJobDesc = result.data;
        
        navigate('/compareInduvidually', {
          state: {
            resumeId: resume._id,
            jobId: jobComparison.jobId,
            resume: resume,
            jobDescription: detailedJobDesc,
            comparison: jobComparison.comparison,
            groupId: resume.groupId
          }
        });
      } else {
        throw new Error(result.message || 'Failed to load job description');
      }
    } catch (err) {
      console.error('Error fetching job details:', err);
      
    }
  };

  const retryFetch = () => {
    setLoading(true);
    setError(null);
  };

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

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 text-blue-200 hover:text-white transition-colors flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Previous</span>
        </button>

        {/* Resume Details Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-6 mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{resume.candidateName || 'Unknown Candidate'}</h1>
              <p className="text-blue-200">{resume.email || 'No email provided'}</p>
              {resume.groupId && (
                <p className="text-blue-300 text-sm mt-1">Group ID: {resume.groupId}</p>
              )}
              <p className="text-blue-300 text-sm mt-1">Resume ID: {resume._id}</p>
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
                    className="text-blue-300 hover:text-blue-200 underline flex items-center space-x-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>View PDF Document</span>
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
        </div>

        {/* Job Comparisons Section */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Job Comparisons</h2>
              <p className="text-blue-200">
                {jobComparisons.length} job{jobComparisons.length !== 1 ? 's' : ''} compared with this resume
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto"></div>
              <p className="text-blue-200 mt-2">Loading comparisons...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-blue-200 mb-4">{error}</p>
              <button
                onClick={retryFetch}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          ) : jobComparisons.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobComparisons.map((jobComp, index) => (
                <div
                  key={jobComp.jobId}
                  onClick={() => handleJobClick(jobComp)}
                  className="bg-white/5 rounded-xl border border-white/10 p-4 hover:bg-white/10 transition-colors cursor-pointer group"
                >
                  {/* Job Basic Info */}
                  <div className="mb-3">
                    <h3 className="text-lg font-bold text-white group-hover:text-blue-200 transition-colors">
                      {jobComp.title}
                    </h3>
                    <p className="text-blue-300 text-sm">
                      {jobComp.companyName}
                    </p>
                  </div>

                  {/* Match Scores */}
                  <div className="flex justify-between items-center">
                    <div className="bg-green-500/20 px-2 py-1 rounded-full border border-green-500/30">
                      <span className="text-green-300 text-sm font-semibold">
                        {jobComp.comparison.matchScore}% Match
                      </span>
                    </div>
                    <div className="bg-blue-500/20 px-2 py-1 rounded-full border border-blue-500/30">
                      <span className="text-blue-300 text-sm font-semibold">
                        {jobComp.comparison.SkillOverLap}% Skills
                      </span>
                    </div>
                  </div>

                  {/* Click Hint */}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-blue-400 text-xs">Click to view detailed comparison</span>
                    <svg className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-blue-200">No job comparisons found for this candidate</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeData;