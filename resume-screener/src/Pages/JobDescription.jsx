import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const JobDescriptions = () => {
  const [jobDescriptions, setJobDescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [comparedGroups, setComparedGroups] = useState({});
  const [groupDetails, setGroupDetails] = useState({});
  const [loadingGroups, setLoadingGroups] = useState({});
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [selectedJD, setSelectedJD] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [comparing, setComparing] = useState(false);
  const { idToken } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  // Fetch job descriptions
  const fetchJobDescriptions = async () => {
    try {
      setLoading(true);
      const response = await fetch(import.meta.env.VITE_API_BASE_URL+'/job-desc/', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch job descriptions');
      }

      const result = await response.json();
      if (result.success) {
        const jds = result.data || [];
        setJobDescriptions(jds);
        
        // Automatically fetch compared groups for each job description
        jds.forEach(jd => {
          fetchComparedGroups(jd._id);
        });
      }
    } catch (error) {
      console.error('Error fetching job descriptions:', error);
      alert('Failed to load job descriptions');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all groups to get group names
  const fetchAllGroups = async () => {
    try {
      const response = await fetch('https://smart-resume-screener-r6s0.onrender.com/groups/', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const groupsMap = {};
          result.data.forEach(group => {
            groupsMap[group._id] = group;
          });
          setGroupDetails(groupsMap);
        }
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  // Fetch compared groups for a specific job description
  const fetchComparedGroups = async (jobId) => {
    try {
      setLoadingGroups(prev => ({ ...prev, [jobId]: true }));
      
      const response = await fetch(`https://smart-resume-screener-r6s0.onrender.com/other/group/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        // If no groups found, it's not an error - just set empty array
        if (response.status === 404) {
          setComparedGroups(prev => ({
            ...prev,
            [jobId]: []
          }));
          return;
        }
        throw new Error('Failed to fetch compared groups');
      }

      const result = await response.json();
      if (result.success) {
        setComparedGroups(prev => ({
          ...prev,
          [jobId]: result.data || []
        }));
      }
    } catch (error) {
      console.error(`Error fetching compared groups for job ${jobId}:`, error);
      // Set empty array even on error to avoid infinite loading
      setComparedGroups(prev => ({
        ...prev,
        [jobId]: []
      }));
    } finally {
      setLoadingGroups(prev => ({ ...prev, [jobId]: false }));
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        alert('Please select a PDF file');
        e.target.value = '';
        return;
      }
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  // Add new job description
  const handleAddJD = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('Please select a PDF file');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('pdf', file);

      const response = await fetch('https://smart-resume-screener-r6s0.onrender.com/job-desc/postJD', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed with status ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setFile(null);
        setFileName('');
        setShowAddForm(false);
        fetchJobDescriptions();
        alert('Job description uploaded successfully!');
      } else {
        throw new Error(result.error || result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading job description:', error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle JD click - pass data via state
  const handleJDClick = (jd) => {
    navigate('/job-description', { state: { jobDescription: jd } });
  };

  // Handle view compared groups
  const handleViewComparedGroups = (jd, groupId) => {
    navigate('/comparison', { 
      state: { 
        groupId: groupId,
        jdId: jd._id,
        jobDescription: jd,
        group: groupDetails[groupId]
      } 
    });
  };

  // Handle compare with group
  const handleCompareWithGroup = (jd) => {
    setSelectedJD(jd);
    setShowComparisonModal(true);
  };

  // Generate comparisons
  const generateComparisons = async () => {
    if (!selectedGroupId || !selectedJD) {
      alert('Please select a group to compare with');
      return;
    }

    try {
      setComparing(true);
      const response = await fetch('https://smart-resume-screener-r6s0.onrender.com/comparison/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          groupId: selectedGroupId,
          jobId: selectedJD._id
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate comparisons');
      }

      const result = await response.json();
      if (result.success) {
        alert(`Successfully generated ${result.data.length} comparisons!`);
        setShowComparisonModal(false);
        setSelectedGroupId('');
        setSelectedJD(null);
        
        // Refresh the compared groups for this JD
        fetchComparedGroups(selectedJD._id);
      }
    } catch (error) {
      console.error('Error generating comparisons:', error);
      alert('Failed to generate comparisons');
    } finally {
      setComparing(false);
    }
  };

  // Toggle compared groups visibility
  const toggleComparedGroups = (jd) => {
    const jobId = jd._id;
    // If groups haven't been loaded yet, fetch them
    if (comparedGroups[jobId] === undefined && !loadingGroups[jobId]) {
      fetchComparedGroups(jobId);
    }
  };

  // Refresh compared groups for a specific JD
  const refreshComparedGroups = (jobId) => {
    fetchComparedGroups(jobId);
  };

  useEffect(() => {
    fetchJobDescriptions();
    fetchAllGroups();
  }, [idToken]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-6 relative overflow-hidden">
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

      <div className="relative z-10">
        {/* Header */}
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">Job Descriptions</h1>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors duration-200 font-medium shadow-lg"
            >
              + Add New JD
            </button>
          </div>

          {/* Upload Form */}
          {showAddForm && (
            <div className="mb-8 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">Upload Job Description</h2>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setFile(null);
                    setFileName('');
                  }}
                  className="text-blue-200 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleAddJD} className="space-y-4">
                <div className="border-2 border-dashed border-white/30 rounded-xl p-6 text-center hover:border-green-400/50 transition-colors duration-200">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="pdfFile"
                    required
                  />
                  <label htmlFor="pdfFile" className="cursor-pointer block">
                    {fileName ? (
                      <div className="text-green-400">
                        <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="font-medium text-lg">{fileName}</p>
                        <p className="text-blue-200 mt-1">Click to change file</p>
                      </div>
                    ) : (
                      <div className="text-blue-200">
                        <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="font-medium text-lg">Click to select PDF file</p>
                        <p className="text-blue-300 mt-1">Only PDF files are accepted</p>
                      </div>
                    )}
                  </label>
                </div>

                {file && (
                  <div className="bg-white/5 rounded-lg p-4 border border-white/20">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-blue-200">File:</span>
                        <p className="text-white font-medium">{file.name}</p>
                      </div>
                      <div>
                        <span className="text-blue-200">Size:</span>
                        <p className="text-white font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={submitting || !file}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium flex items-center justify-center space-x-2"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <span>Upload Job Description</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setFile(null);
                      setFileName('');
                    }}
                    className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg transition-colors duration-200 font-medium border border-white/20"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Job Descriptions List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto"></div>
              <p className="text-blue-200 mt-4 text-lg">Loading job descriptions...</p>
            </div>
          ) : jobDescriptions.length === 0 ? (
            <div className="text-center py-12 bg-white/10 rounded-xl border border-white/20">
              <svg className="w-16 h-16 text-blue-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-xl font-semibold text-blue-200 mb-2">No Job Descriptions</h3>
              <p className="text-blue-300 mb-4">Get started by uploading your first job description</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors duration-200 font-medium"
              >
                Upload First JD
              </button>
            </div>
          ) : (
            <div className="grid gap-6">
              {jobDescriptions.map((jd) => (
                <div key={jd._id} className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-2xl overflow-hidden">
                  {/* JD Main Info */}
                  <div className="p-6 border-b border-white/20">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2">{jd.title || 'Untitled Job Description'}</h3>
                        <div className="flex flex-wrap gap-4 text-blue-200 mb-3">
                          {jd.companyName && (
                            <span className="flex items-center space-x-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2-2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              <span>{jd.companyName}</span>
                            </span>
                          )}
                          {jd.location && (
                            <span className="flex items-center space-x-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span>{jd.location}</span>
                            </span>
                          )}
                        </div>
                        {jd.requriedSkills && jd.requriedSkills.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {jd.requriedSkills.slice(0, 5).map((skill, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm border border-blue-500/30"
                              >
                                {skill}
                              </span>
                            ))}
                            {jd.requriedSkills.length > 5 && (
                              <span className="px-3 py-1 bg-white/10 text-blue-200 rounded-full text-sm border border-white/20">
                                +{jd.requriedSkills.length - 5} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-3 ml-4">
                        {jd.jdUrl && (
                          <span className="inline-flex items-center px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm border border-green-500/30">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            PDF
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex space-x-3 mt-4">
                      <button
                        onClick={() => handleJDClick(jd)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm font-medium"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleCompareWithGroup(jd)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm font-medium flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span>Compare with Group</span>
                      </button>
                    </div>
                  </div>

                  {/* Compared Groups Section */}
                  <div className="border-t border-white/20">
                    <button
                      onClick={() => toggleComparedGroups(jd)}
                      className="w-full p-4 text-left hover:bg-white/5 transition-colors duration-200 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="text-white font-medium">
                          Compared Groups 
                          {comparedGroups[jd._id] !== undefined && (
                            <span className="text-purple-400 ml-2">({comparedGroups[jd._id].length})</span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {loadingGroups[jd._id] && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
                        )}
                        <svg 
                          className={`w-5 h-5 text-blue-200 transition-transform duration-200 ${
                            comparedGroups[jd._id] ? 'rotate-180' : ''
                          }`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {comparedGroups[jd._id] !== undefined && (
                      <div className="bg-white/5 border-t border-white/10 p-4">
                        {loadingGroups[jd._id] ? (
                          <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto"></div>
                            <p className="text-blue-200 mt-2">Loading compared groups...</p>
                          </div>
                        ) : comparedGroups[jd._id].length === 0 ? (
                          <div className="text-center py-6">
                            <svg className="w-12 h-12 text-blue-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-blue-200 mb-2">No groups compared yet</p>
                            <p className="text-blue-300 text-sm">Compare this job description with candidate groups to see matches</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {comparedGroups[jd._id].map((group, index) => {
                              const groupDetail = groupDetails[group.groupId];
                              return (
                                <div
                                  key={group.groupId || index}
                                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 hover:border-purple-400/50 cursor-pointer transition-all duration-200 hover:bg-white/10"
                                  onClick={() => handleViewComparedGroups(jd, group.groupId)}
                                >
                                  <div className="flex-1">
                                    <p className="text-white font-medium">
                                      {groupDetail ? groupDetail.groupName : `Group ${group.groupId}`}
                                    </p>
                                    <p className="text-blue-200 text-sm mt-1">
                                      Group ID: {group.groupId}
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-green-400 text-sm font-medium">View Comparisons</span>
                                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </div>
                                </div>
                              );
                            })}
                            <div className="flex justify-center pt-2">
                              <button
                                onClick={() => refreshComparedGroups(jd._id)}
                                className="text-blue-300 hover:text-white transition-colors duration-200 text-sm flex items-center space-x-1"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span>Refresh</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Comparison Modal */}
      {showComparisonModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-600 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-white mb-4">Compare with Group</h3>
            
            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Select Group to Compare
              </label>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-400"
              >
                <option value="" className="text-gray-400">Choose a group...</option>
                {Object.values(groupDetails).map((group) => (
                  <option key={group._id} value={group._id} className="text-white">
                    {group.groupName}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
              <p className="text-blue-200 text-sm">
                This will generate AI-powered comparisons between all resumes in the selected group and this job description.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={generateComparisons}
                disabled={comparing || !selectedGroupId}
                className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {comparing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <span>Generate Comparisons</span>
                )}
              </button>
              <button
                onClick={() => {
                  setShowComparisonModal(false);
                  setSelectedGroupId('');
                  setSelectedJD(null);
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 border border-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDescriptions;