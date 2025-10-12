import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const GroupPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { group } = location.state || {};
  const { idToken } = useSelector((state) => state.auth);
  
  const [resumes, setResumes] = useState([]);
  const [jobDescriptions, setJobDescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jdDetails, setJdDetails] = useState({});
  const [loadingJds, setLoadingJds] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  // Fetch resumes for this group
  const fetchResumes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/resume/getAllResumesForGroups/${group._id}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch resumes');
      }

      const result = await response.json();
      if (result.success) {
        setResumes(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching resumes:', error);
      alert('Failed to load resumes');
    } finally {
      setLoading(false);
    }
  };

  // Fetch job descriptions for comparison
  const fetchJobDescriptions = async () => {
    try {
      setLoadingJds(true);
      const response = await fetch(`http://localhost:5000/job-desc/getGroupsForJd/${group._id}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch job descriptions');
      }

      const result = await response.json();
      if (result.success) {
        setJobDescriptions(result.data || []);
        // Fetch details for each job description
        fetchJdDetails(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching job descriptions:', error);
    } finally {
      setLoadingJds(false);
    }
  };

  // Fetch details for each job description
  const fetchJdDetails = async (jds) => {
    const details = {};
    for (const jd of jds) {
      try {
        const response = await fetch(`http://localhost:5000/job-desc/${jd.jobId}`, {
          headers: {
            'Authorization': `Bearer ${idToken}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            details[jd.jobId] = result.data;
          }
        }
      } catch (error) {
        console.error(`Error fetching JD details for ${jd.jobId}:`, error);
      }
    }
    setJdDetails(details);
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Filter only PDF files
    const pdfFiles = selectedFiles.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length !== selectedFiles.length) {
      alert('Some files were not PDFs and were filtered out.');
    }
    
    setFiles(pdfFiles);
    
    // Initialize upload progress
    const progress = {};
    pdfFiles.forEach(file => {
      progress[file.name] = 0;
    });
    setUploadProgress(progress);
  };

  // Upload resumes one by one
  const uploadResumes = async () => {
    if (files.length === 0) {
      alert('Please select PDF files to upload');
      return;
    }

    setUploading(true);
    const results = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        // Update progress
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: 10
        }));

        const formData = new FormData();
        formData.append('pdf', file);
formData.append('groupId', group._id);

        const response = await fetch('http://localhost:5000/resume/extract-text', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${idToken}`,
          },
          body: formData,
        });

        // Update progress
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: 50
        }));

        if (response.ok) {
          const result = await response.json();
          results.push({ file: file.name, success: true, data: result });
          
          // Update progress to complete
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: 100
          }));
        } else {
          const errorText = await response.text();
          results.push({ file: file.name, success: false, error: errorText });
          
          // Update progress to error
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: -1
          }));
        }
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        results.push({ file: file.name, success: false, error: error.message });
        
        // Update progress to error
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: -1
        }));
      }

      // Small delay to prevent overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setUploading(false);
    
    // Show results summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    if (failed === 0) {
      alert(`All ${successful} resumes uploaded successfully!`);
    } else {
      alert(`Upload completed: ${successful} successful, ${failed} failed. Check console for details.`);
    }
    
    console.log('Upload results:', results);
    
    // Refresh resumes list and reset form
    fetchResumes();
    setFiles([]);
    setShowUploadForm(false);
    setUploadProgress({});
  };

  // Handle resume click
  const handleResumeClick = (resume) => {
    navigate('/resume-data', { state: { resume } });
  };

  // Handle JD click
  const handleJdClick = (jd) => {
    const jdDetail = jdDetails[jd.jobId];
    if (jdDetail) {
      navigate('/job-description', { state: { jobDescription: jdDetail } });
    }
  };

  // Handle show comparisons
  const handleShowComparisons = (jd) => {
    navigate('/comparison', { state: { groupId: group._id, jdId: jd.jobId } });
  };

  useEffect(() => {
    if (group && group._id) {
      fetchResumes();
      fetchJobDescriptions();
    }
  }, [group?._id, idToken]);

  // Early return if no group data
  if (!group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center relative overflow-hidden">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">No Group Data</h1>
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
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-purple-300 rounded-full blur-xl"></div>
      </div>

      {/* Floating Icons */}
      <div className="absolute top-1/4 right-1/4 text-white opacity-20 text-6xl">📄</div>
      <div className="absolute bottom-1/3 left-1/4 text-white opacity-20 text-6xl">🔍</div>
      <div className="absolute top-1/3 left-1/2 text-white opacity-20 text-6xl">💼</div>

      <div className="relative z-10">
        {/* Header */}
        <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/landing')}
                  className="text-blue-200 hover:text-white transition-colors"
                >
                  ← Back to Landing
                </button>
                <h1 className="text-2xl font-bold text-white">
                  Group: <span className="text-blue-300">{group.groupName}</span>
                </h1>
              </div>
              <div className="text-blue-200">
                Group ID: {group._id}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Resumes Section */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-white">Resumes</h2>
                  {resumes.length === 0 && (
                    <button
                      onClick={() => setShowUploadForm(true)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Upload Resumes
                    </button>
                  )}
                </div>

                {/* Upload Form */}
                {showUploadForm && (
                  <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/20">
                    <h3 className="text-lg font-medium text-white mb-3">Upload Multiple Resumes</h3>
                    <div className="space-y-3">
                      <div className="border-2 border-dashed border-white/30 rounded-lg p-4 text-center">
                        <input
                          type="file"
                          accept=".pdf"
                          multiple
                          onChange={handleFileChange}
                          className="hidden"
                          id="resumeFiles"
                        />
                        <label htmlFor="resumeFiles" className="cursor-pointer">
                          {files.length > 0 ? (
                            <div className="text-green-400">
                              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className="font-medium">{files.length} PDF files selected</p>
                              <p className="text-sm text-blue-200">Click to change files</p>
                            </div>
                          ) : (
                            <div className="text-blue-200">
                              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              <p className="font-medium">Click to select PDF files</p>
                              <p className="text-sm">Select multiple PDF resumes</p>
                            </div>
                          )}
                        </label>
                      </div>

                      {/* File List with Progress */}
                      {files.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-white">Selected Files:</h4>
                          {files.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded">
                              <span className="text-blue-200 text-sm truncate flex-1 mr-2">
                                {file.name}
                              </span>
                              <div className="w-20 bg-white/10 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    uploadProgress[file.name] === -1 ? 'bg-red-500' :
                                    uploadProgress[file.name] === 100 ? 'bg-green-500' : 'bg-blue-500'
                                  }`}
                                  style={{ width: `${Math.abs(uploadProgress[file.name])}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-blue-200 ml-2 w-8">
                                {uploadProgress[file.name] === -1 ? 'Error' : 
                                 uploadProgress[file.name] === 100 ? 'Done' : 
                                 `${uploadProgress[file.name]}%`}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex space-x-2">
                        <button
                          onClick={uploadResumes}
                          disabled={uploading || files.length === 0}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
                        >
                          {uploading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <span>Upload {files.length} Resumes</span>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setShowUploadForm(false);
                            setFiles([]);
                            setUploadProgress({});
                          }}
                          className="bg-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/20 border border-white/20"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Resumes List */}
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
                    <p className="text-blue-200 mt-2">Loading resumes...</p>
                  </div>
                ) : resumes.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-blue-200 mb-4">No resumes found in this group.</p>
                    <button
                      onClick={() => setShowUploadForm(true)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Upload Your First Resumes
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {resumes.map((resume) => (
                      <div
                        key={resume._id}
                        onClick={() => handleResumeClick(resume)}
                        className="p-4 bg-white/5 border border-white/20 rounded-lg hover:border-blue-400 hover:bg-white/10 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                              <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-white">
                              {resume.candidateName || 'Unknown Candidate'}
                            </h3>
                            <p className="text-sm text-blue-200">
                              {resume.email || 'No email provided'}
                            </p>
                            {resume.totalExperience > 0 && (
                              <p className="text-xs text-blue-300 mt-1">
                                Experience: {resume.totalExperience} years
                              </p>
                            )}
                            {resume.skills && resume.skills.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {resume.skills.slice(0, 3).map((skill, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-white/10 text-blue-200 text-xs rounded"
                                  >
                                    {skill}
                                  </span>
                                ))}
                                {resume.skills.length > 3 && (
                                  <span className="px-2 py-1 bg-white/10 text-blue-200 text-xs rounded">
                                    +{resume.skills.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Job Descriptions Section */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-white mb-6">Job Descriptions</h2>
                
                {loadingJds ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto"></div>
                    <p className="text-blue-200 mt-2">Loading job descriptions...</p>
                  </div>
                ) : jobDescriptions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-blue-200">No job descriptions found for comparison.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {jobDescriptions.map((jd) => {
                      const jdDetail = jdDetails[jd.jobId];
                      return (
                        <div
                          key={jd.jobId}
                          className="p-4 bg-white/5 border border-white/20 rounded-lg"
                        >
                          <div className="flex items-start justify-between">
                            <div 
                              className="flex-1 cursor-pointer"
                              onClick={() => handleJdClick(jd)}
                            >
                              <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0">
                                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                                    </svg>
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-medium text-white">
                                    {jdDetail?.title || 'Job Description'}
                                  </h3>
                                  <p className="text-sm text-blue-200">
                                    Match Score: <span className="text-green-300">{jd.matchScore}%</span>
                                  </p>
                                  <p className="text-sm text-blue-200">
                                    Skill Overlap: <span className="text-yellow-300">{jd.SkillOverLap}%</span>
                                  </p>
                                  {jdDetail?.companyName && (
                                    <p className="text-xs text-blue-300 mt-1">
                                      Company: {jdDetail.companyName}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleShowComparisons(jd)}
                              className="ml-4 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm transition-colors"
                            >
                              Show Comparisons
                            </button>
                          </div>
                          
                          {jd.Justification && (
                            <div className="mt-3 p-3 bg-white/5 rounded-lg">
                              <p className="text-sm text-blue-200">
                                <strong>Justification:</strong> {jd.Justification}
                              </p>
                            </div>
                          )}
                          
                          {(jd.pros?.length > 0 || jd.cons?.length > 0) && (
                            <div className="mt-3 grid grid-cols-2 gap-3">
                              {jd.pros?.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-medium text-green-300 mb-1">Pros</h4>
                                  <ul className="text-xs text-blue-200 space-y-1">
                                    {jd.pros.slice(0, 2).map((pro, index) => (
                                      <li key={index}>• {pro}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {jd.cons?.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-medium text-red-300 mb-1">Cons</h4>
                                  <ul className="text-xs text-blue-200 space-y-1">
                                    {jd.cons.slice(0, 2).map((con, index) => (
                                      <li key={index}>• {con}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default GroupPage;