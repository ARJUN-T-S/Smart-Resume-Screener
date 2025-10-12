import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

const Comparisons = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { groupId, jdId, jobDescription, group } = location.state || {};
  const { idToken } = useSelector((state) => state.auth);
  
  const [comparisons, setComparisons] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('all'); // 'all', 'top-match', 'top-skills'
  const [topN, setTopN] = useState(5); // Default value
  const [customTopN, setCustomTopN] = useState(''); // User input
  const [expandedComparison, setExpandedComparison] = useState(null);

  // Fetch comparisons based on view mode
  const fetchComparisons = async () => {
    if (!groupId || !jdId) {
      console.log('Missing groupId or jdId:', { groupId, jdId });
      return;
    }

    try {
      setLoading(true);
      let url = '';

      // Use customTopN if provided, otherwise use topN
      const limitValue = customTopN ? parseInt(customTopN) : topN;
      
      console.log('Fetching comparisons for:', { groupId, jdId, viewMode, limitValue });

      switch (viewMode) {
        case 'top-match':
          url = `${import.meta.env.VITE_API_URL}/other/top-match/${groupId}/${jdId}/${limitValue}`;
          break;
        case 'top-skills':
          url = `${import.meta.env.VITE_API_URL}/other/top-skills/${groupId}/${jdId}/${limitValue}`;
          break;
        default:
          url = `${import.meta.env.VITE_API_URL}/other/${groupId}/${jdId}`;
      }

      console.log('Making request to:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (err) {
          errorMessage = response.statusText || err;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Server response:', result);
      
      if (result.success) {
        if (viewMode === 'all' && result.data && result.data.analytics) {
          setComparisons(result.data.comparisons || []);
          setAnalytics(result.data.analytics);
        } else if (Array.isArray(result.data)) {
          setComparisons(result.data);
          setAnalytics(null);
        } else {
          setComparisons(result.data || []);
          setAnalytics(null);
        }
      } else {
        console.error('Server returned success: false', result);
        alert(result.message || 'Failed to load comparisons');
      }
    } catch (error) {
      console.error('Error fetching comparisons:', error);
      alert(`Failed to load comparisons: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle custom top N input
  const handleCustomTopNChange = (e) => {
    const value = e.target.value;
    // Only allow numbers
    if (value === '' || /^\d+$/.test(value)) {
      setCustomTopN(value);
    }
  };

  // Apply custom top N
  const applyCustomTopN = () => {
    if (customTopN && parseInt(customTopN) > 0) {
      fetchComparisons();
    }
  };

  // Reset to default top N
  const resetToDefaultTopN = () => {
    setCustomTopN('');
    setTopN(5); // Reset to default
    // Don't fetch here, let the useEffect handle it
  };

  // Get score color based on value
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Get score background color
  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-500/20 border-green-500/30';
    if (score >= 60) return 'bg-yellow-500/20 border-yellow-500/30';
    return 'bg-red-500/20 border-red-500/30';
  };

  // Toggle comparison details
  const toggleComparisonDetails = (comparisonId) => {
    setExpandedComparison(expandedComparison === comparisonId ? null : comparisonId);
  };

  // Download comparison report
  const downloadReport = () => {
    const reportData = {
      jobDescription,
      group,
      comparisons,
      analytics,
      generatedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comparison-report-${groupId}-${jdId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchComparisons();
  }, [groupId, jdId, viewMode, topN]); // Remove customTopN from dependencies

  if (!groupId || !jdId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Missing Data</h1>
          <p className="text-blue-200 mb-4">Group ID or Job Description ID not provided</p>
          <button
            onClick={() => navigate('/job-description')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Job Descriptions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-6 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-32 h-32 bg-white rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-blue-300 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-purple-300 rounded-full blur-xl"></div>
      </div>

      {/* Floating Icons */}
      <div className="absolute top-1/4 right-1/4 text-white opacity-20 text-6xl">📊</div>
      <div className="absolute bottom-1/3 left-1/4 text-white opacity-20 text-6xl">🔍</div>
      <div className="absolute top-1/3 left-1/2 text-white opacity-20 text-6xl">🎯</div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <header className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 mb-8">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <button
                onClick={() => navigate('/job-descriptions')}
                className="text-blue-200 hover:text-white transition-colors mb-4 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Job Descriptions</span>
              </button>
              
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">AI-Powered Candidate Comparisons</h1>
                  
                  <div className="flex flex-wrap gap-4 text-blue-200">
                    {jobDescription?.title && (
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                        </svg>
                        <span className="font-semibold">{jobDescription.title}</span>
                      </div>
                    )}
                    {group?.groupName && (
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="font-semibold">{group.groupName}</span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={downloadReport}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download Report</span>
                </button>
              </div>
            </div>
          </div>

          {/* Analytics Summary */}
          {analytics && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/20 text-center">
                <p className="text-blue-200 text-sm">Total Candidates</p>
                <p className="text-white font-bold text-2xl">{analytics.totalComparisons}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/20 text-center">
                <p className="text-blue-200 text-sm">Avg Match Score</p>
                <p className={`font-bold text-2xl ${getScoreColor(analytics.averageMatchScore)}`}>
                  {analytics.averageMatchScore?.toFixed(1)}%
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/20 text-center">
                <p className="text-blue-200 text-sm">Avg Skill Overlap</p>
                <p className={`font-bold text-2xl ${getScoreColor(analytics.averageSkillOverlap)}`}>
                  {analytics.averageSkillOverlap?.toFixed(1)}%
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/20 text-center">
                <p className="text-blue-200 text-sm">Top Match Score</p>
                <p className={`font-bold text-2xl ${getScoreColor(analytics.topMatchScore)}`}>
                  {analytics.topMatchScore}%
                </p>
              </div>
            </div>
          )}
        </header>

        {/* Controls */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 mb-8">
          <div className="flex flex-wrap gap-6 items-center">
            <div>
              <label className="block text-blue-200 text-sm font-medium mb-2">View Mode</label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-400"
              >
                <option value="all">All Candidates</option>
                <option value="top-match">Top by Match Score</option>
                <option value="top-skills">Top by Skill Overlap</option>
              </select>
            </div>

            {/* Default Top N Selection */}
            {(viewMode === 'top-match' || viewMode === 'top-skills') && (
              <div>
                <label className="block text-blue-200 text-sm font-medium mb-2">Show Top</label>
                <select
                  value={topN}
                  onChange={(e) => setTopN(parseInt(e.target.value))}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-400"
                >
                  <option value={3}>Top 3</option>
                  <option value={5}>Top 5</option>
                  <option value={10}>Top 10</option>
                  <option value={20}>Top 20</option>
                  <option value={0}>Custom...</option>
                </select>
              </div>
            )}

            {/* Custom Top N Input */}
            {(viewMode === 'top-match' || viewMode === 'top-skills') && topN === 0 && (
              <div>
                <label className="block text-blue-200 text-sm font-medium mb-2">Custom Number</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={customTopN}
                    onChange={handleCustomTopNChange}
                    placeholder="Enter number"
                    className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-400 w-32"
                  />
                  <button
                    onClick={applyCustomTopN}
                    disabled={!customTopN || parseInt(customTopN) <= 0}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Apply
                  </button>
                  <button
                    onClick={resetToDefaultTopN}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="flex-1"></div>

            <button
              onClick={fetchComparisons}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh Data</span>
            </button>
          </div>

          {/* Current Settings Info */}
          {(viewMode === 'top-match' || viewMode === 'top-skills') && (
            <div className="mt-4 text-blue-200 text-sm">
              Currently showing: <span className="text-white font-medium">
                {topN === 0 && customTopN ? `Top ${customTopN}` : `Top ${topN}`}
              </span> candidates by {viewMode === 'top-match' ? 'match score' : 'skill overlap'}
            </div>
          )}
        </div>

        {/* Rest of your component remains the same */}
        {/* Comparisons List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto"></div>
            <p className="text-blue-200 mt-4 text-lg">Loading AI-powered comparisons...</p>
          </div>
        ) : comparisons.length === 0 ? (
          <div className="text-center py-12 bg-white/10 rounded-2xl border border-white/20">
            <svg className="w-16 h-16 text-blue-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-blue-200 mb-2">No Comparisons Found</h3>
            <p className="text-blue-300 mb-4">No candidate comparisons available for this group and job description.</p>
            <button
              onClick={() => navigate('/job-descriptions')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Back to Job Descriptions
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {comparisons.map((comparison, index) => (
              <div key={comparison._id} className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden">
                {/* Comparison Header */}
                <div className="p-6 border-b border-white/20">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getScoreBgColor(comparison.matchScore)}`}>
                        <span className="text-white font-bold text-lg">#{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-bold text-white">
                              {comparison.resumeId?.candidateName || 'Unknown Candidate'}
                            </h3>
                            <p className="text-blue-200">
                              {comparison.resumeId?.email || 'No email provided'}
                            </p>
                            {comparison.resumeId?.totalExperience > 0 && (
                              <p className="text-blue-300 text-sm mt-1">
                                {comparison.resumeId.totalExperience} years experience
                              </p>
                            )}
                          </div>
                          
                          {/* Scores */}
                          <div className="flex space-x-4">
                            <div className={`text-center p-3 rounded-xl border ${getScoreBgColor(comparison.matchScore)}`}>
                              <p className="text-blue-200 text-sm">Overall Match</p>
                              <p className={`text-2xl font-bold ${getScoreColor(comparison.matchScore)}`}>
                                {comparison.matchScore}%
                              </p>
                            </div>
                            <div className={`text-center p-3 rounded-xl border ${getScoreBgColor(comparison.SkillOverLap)}`}>
                              <p className="text-blue-200 text-sm">Skill Overlap</p>
                              <p className={`text-2xl font-bold ${getScoreColor(comparison.SkillOverLap)}`}>
                                {comparison.SkillOverLap}%
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Skills Preview */}
                        {comparison.resumeId?.skills && comparison.resumeId.skills.length > 0 && (
                          <div className="mt-3">
                            <div className="flex flex-wrap gap-1">
                              {comparison.resumeId.skills.slice(0, 6).map((skill, skillIndex) => (
                                <span
                                  key={skillIndex}
                                  className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded border border-blue-500/30"
                                >
                                  {skill}
                                </span>
                              ))}
                              {comparison.resumeId.skills.length > 6 && (
                                <span className="px-2 py-1 bg-white/10 text-blue-200 text-xs rounded border border-white/20">
                                  +{comparison.resumeId.skills.length - 6} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Assessment */}
                <div className="p-6 border-b border-white/20">
                  <h4 className="text-white font-semibold mb-2">AI Assessment Summary</h4>
                  <p className="text-blue-200">
                    {comparison.Justification}
                  </p>
                </div>

                {/* Expandable Detailed Analysis */}
                <div className="border-b border-white/20">
                  <button
                    onClick={() => toggleComparisonDetails(comparison._id)}
                    className="w-full p-4 text-left hover:bg-white/5 transition-colors duration-200 flex items-center justify-between"
                  >
                    <span className="text-white font-medium">Detailed Analysis</span>
                    <svg 
                      className={`w-5 h-5 text-blue-200 transition-transform duration-200 ${
                        expandedComparison === comparison._id ? 'rotate-180' : ''
                      }`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {expandedComparison === comparison._id && (
                    <div className="p-6 bg-white/5 border-t border-white/10">
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Strengths */}
                        <div>
                          <h5 className="text-green-400 font-semibold mb-3 flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Strengths & Advantages</span>
                          </h5>
                          <ul className="space-y-2">
                            {comparison.pros && comparison.pros.map((pro, proIndex) => (
                              <li key={proIndex} className="flex items-start space-x-2">
                                <svg className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-blue-200 text-sm">{pro}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Areas for Improvement */}
                        <div>
                          <h5 className="text-yellow-400 font-semibold mb-3 flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <span>Areas for Improvement</span>
                          </h5>
                          <ul className="space-y-2">
                            {comparison.cons && comparison.cons.map((con, conIndex) => (
                              <li key={conIndex} className="flex items-start space-x-2">
                                <svg className="w-4 h-4 text-yellow-400 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <span className="text-blue-200 text-sm">{con}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Recommendation */}
                      <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
                        <h5 className="text-purple-400 font-semibold mb-2">AI Recommendation</h5>
                        <p className="text-blue-200 text-sm">
                          {comparison.matchScore >= 80 
                            ? "Strongly recommended - Excellent match for the position"
                            : comparison.matchScore >= 60
                            ? "Recommended - Good potential with some development areas"
                            : "Consider with caution - Significant gaps identified"
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="p-4 flex justify-end space-x-3">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm">
                    View Full Resume
                  </button>
                  <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm">
                    Schedule Interview
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Comparisons;