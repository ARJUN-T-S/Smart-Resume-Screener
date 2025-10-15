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
  const [loadingGroups, setLoadingGroups] = useState({});
  const { idToken } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  // Fetch job descriptions
  const fetchJobDescriptions = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://smart-resume-screener-r6s0.onrender.com/job-desc/', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch job descriptions');
      }

      const result = await response.json();
      console.log(result.data);
      if (result.success) {
        setJobDescriptions(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching job descriptions:', error);
      
    } finally {
      setLoading(false);
    }
  };

  // Fetch compared groups for a specific job description
  const fetchComparedGroups = async (jobId) => {
    try {
      setLoadingGroups(prev => ({ ...prev, [jobId]: true }));
      console.log(jobId);
      const response = await fetch(`https://smart-resume-screener-r6s0.onrender.com/other/group/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
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
      
      // Use the correct field name 'pdf' that your backend expects
      formData.append('pdf', file);

      console.log('Uploading PDF file:', file.name, 'with field name: pdf');

      const response = await fetch('https://smart-resume-screener-r6s0.onrender.com/job-desc/postJD', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
        body: formData,
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
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
        jobDescription: jd
      } 
    });
  };

  // Toggle compared groups visibility
  const toggleComparedGroups = (jd) => {
    const jobId = jd._id;
    if (comparedGroups[jobId] === undefined) {
      fetchComparedGroups(jobId);
    } else {
      setComparedGroups(prev => {
        const newState = { ...prev };
        delete newState[jobId];
        return newState;
      });
    }
  };

  useEffect(() => {
    fetchJobDescriptions();
  }, [idToken]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">Job Descriptions</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Add JD
        </button>
      </div>

      {showAddForm && (
        <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/20">
          <h3 className="text-lg font-medium text-white mb-3">Upload Job Description PDF</h3>
          <form onSubmit={handleAddJD} className="space-y-3">
            <div className="border-2 border-dashed border-white/30 rounded-lg p-4 text-center">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                id="pdfFile"
                required
              />
              <label htmlFor="pdfFile" className="cursor-pointer">
                {fileName ? (
                  <div className="text-green-400">
                    <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="font-medium">{fileName}</p>
                    <p className="text-sm text-blue-200">Click to change file</p>
                  </div>
                ) : (
                  <div className="text-blue-200">
                    <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="font-medium">Click to select PDF file</p>
                    <p className="text-sm">Only PDF files are accepted</p>
                  </div>
                )}
              </label>
            </div>

            {file && (
              <div className="text-sm text-blue-200 bg-white/5 p-3 rounded border border-white/20">
                <p><strong>File:</strong> {file.name}</p>
                <p><strong>Size:</strong> {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <p><strong>Type:</strong> {file.type}</p>
                <p><strong>Field name:</strong> pdf</p>
              </div>
            )}

            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={submitting || !file}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <span>Upload JD</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setFile(null);
                  setFileName('');
                }}
                className="bg-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/20 border border-white/20"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto"></div>
          <p className="text-blue-200 mt-2">Loading job descriptions...</p>
        </div>
      ) : jobDescriptions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-blue-200">No job descriptions found. Upload your first JD!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobDescriptions.map((jd) => (
            <div key={jd._id} className="bg-white/5 border border-white/20 rounded-lg overflow-hidden">
              {/* JD Main Info */}
              <div
                onClick={() => handleJDClick(jd)}
                className="p-4 hover:border-green-400 hover:bg-white/10 cursor-pointer transition-colors"
              >
                <h3 className="font-medium text-white">{jd.title || 'Untitled JD'}</h3>
                <p className="text-sm text-blue-200">
                  {jd.companyName && `${jd.companyName} • `}
                  {jd.location}
                </p>
                {jd.requriedSkills && jd.requriedSkills.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {jd.requriedSkills.slice(0, 3).map((skill, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-white/10 text-blue-200 text-xs rounded"
                      >
                        {skill}
                      </span>
                    ))}
                    {jd.requriedSkills.length > 3 && (
                      <span className="px-2 py-1 bg-white/10 text-blue-200 text-xs rounded">
                        +{jd.requriedSkills.length - 3} more
                      </span>
                    )}
                  </div>
                )}
                {jd.jdUrl && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      PDF Available
                    </span>
                  </div>
                )}
              </div>

              {/* Compared Groups Section */}
              <div className="border-t border-white/20">
                <button
                  onClick={() => toggleComparedGroups(jd)}
                  className="w-full p-3 text-left hover:bg-white/5 transition-colors flex items-center justify-between"
                >
                  <span className="text-blue-200 text-sm font-medium">
                    Compared Groups ({comparedGroups[jd._id]?.length || 0})
                  </span>
                  <svg 
                    className={`w-4 h-4 text-blue-200 transition-transform ${
                      comparedGroups[jd._id] ? 'rotate-180' : ''
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {comparedGroups[jd._id] && (
                  <div className="p-3 bg-white/5 border-t border-white/10">
                    {loadingGroups[jd._id] ? (
                      <div className="text-center py-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400 mx-auto"></div>
                        <p className="text-blue-200 text-xs mt-1">Loading groups...</p>
                      </div>
                    ) : comparedGroups[jd._id].length === 0 ? (
                      <p className="text-blue-200 text-sm text-center py-2">
                        No groups compared yet
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {comparedGroups[jd._id].map((group, index) => (
                          <div
                            key={group.groupId || index}
                            className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/10 hover:border-purple-400 cursor-pointer transition-colors"
                            onClick={() => handleViewComparedGroups(jd, group.groupId)}
                          >
                            <div>
                              <p className="text-white text-sm font-medium">
                                Group ID: {group.groupId}
                              </p>
                              <p className="text-blue-200 text-xs">
                                Click to view comparisons
                              </p>
                            </div>
                            <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        ))}
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
  );
};

export default JobDescriptions;