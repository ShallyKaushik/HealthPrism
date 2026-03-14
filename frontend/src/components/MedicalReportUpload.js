
import React, { useState } from 'react';
import axios from 'axios';
import './MedicalReportUpload.css';

function MedicalReportUpload({ onDataExtracted }) {
    const [file, setFile] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setError(null);
    };

    const handleUpload = async () => {
        if (!file) {
            setError("Please select a file first.");
            return;
        }

        setIsAnalyzing(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
            const response = await axios.post(`${API_URL}/api/analyze-report`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            onDataExtracted(response.data.extracted_data);
            setIsAnalyzing(false);
        } catch (err) {
            console.error("Analysis Error:", err);
            setError(err.response?.data?.error || "Failed to analyze report. Please try again or enter data manually.");
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="report-upload-card">
            <div className="upload-header">
                <span className="upload-icon">📄</span>
                <div className="upload-text">
                    <h4>Analyze Medical Report</h4>
                    <p>Upload a PDF or Image of your test results for automatic extraction.</p>
                </div>
            </div>
            
            <div className="upload-zone">
                <input 
                    type="file" 
                    accept=".pdf,.jpg,.jpeg,.png" 
                    onChange={handleFileChange} 
                    id="report-file-input"
                    className="file-input-hidden"
                />
                
                {!file ? (
                    <label className="drop-zone-label" htmlFor="report-file-input">
                        <span className="plus-icon">+</span>
                        <span>Click to choose or drop file</span>
                        <small>Supports PDF, JPG, PNG</small>
                    </label>
                ) : (
                    <div className="file-info-bar">
                        <span className="file-name">📎 {file.name}</span>
                        <button className="remove-file" onClick={() => setFile(null)} title="Remove file">✕</button>
                    </div>
                )}
            </div>

            <div className="upload-actions">
                <button 
                    onClick={handleUpload} 
                    disabled={!file || isAnalyzing} 
                    className="analyze-btn"
                >
                    {isAnalyzing ? (
                        <><span className="spinner"></span> Analyzing...</>
                    ) : (
                        '✨ Auto-Extract Metrics'
                    )}
                </button>
            </div>

            {error && <div className="upload-error">❌ {error}</div>}
            
            <div className="upload-footer">
                <p>Note: Local extraction only. Your data never leaves your device.</p>
            </div>
        </div>
    );
}

export default MedicalReportUpload;
