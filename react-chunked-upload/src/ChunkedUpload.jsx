import React, { useState, useRef } from "react";

const CHUNK_SIZE = 20 * 1024 * 1024; // 20 MB
const BASE_URL = "http://127.0.0.1:8000";
const API_URL = `${BASE_URL}/api/upload/`;
const COMPLETE_URL = `${BASE_URL}/api/upload/complete/`;

const ChunkedUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [fileInfo, setFileInfo] = useState("");
  const fileInputRef = useRef(null);

  // CSRF cookie
  const getCookie = (name) => {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
      const cookies = document.cookie.split(";");
      for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.startsWith(name + "=")) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  };

  const formatBytes = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
  };

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    const chunks = Math.ceil(file.size / CHUNK_SIZE);
    setFileInfo(`${file.name} | ${formatBytes(file.size)} | Chunks: ${chunks}`);
    setProgress(0);
    setStatus("");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) handleFileSelect(e.dataTransfer.files[0]);
  };

  const uploadFile = async () => {
    if (!selectedFile) return;

    setStatus("Uploading...");
    let uploadId = null;
    const totalChunks = Math.ceil(selectedFile.size / CHUNK_SIZE);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, selectedFile.size);
      const chunk = selectedFile.slice(start, end);

      const formData = new FormData();
      formData.append("file", chunk);
      if (uploadId) formData.append("upload_id", uploadId);
      else formData.append("filename", selectedFile.name);

      try {
        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "X-CSRFToken": getCookie("csrftoken") },
          body: formData,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        uploadId = data.upload_id;
        setProgress(Math.round(((i + 1) / totalChunks) * 100));
      } catch (err) {
        setStatus(`Error on chunk ${i + 1}: ${err.message}`);
        return;
      }
    }

    // Complete upload
    try {
      const completeRes = await fetch(COMPLETE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify({ upload_id: uploadId }),
      });

      if (!completeRes.ok) throw new Error(`HTTP ${completeRes.status}`);
      const result = await completeRes.json();
      setStatus(`Upload complete! File: ${result.upload.filename}`);
    } catch (err) {
      setStatus(`Error completing upload: ${err.message}`);
    }
  };

  return (
    <div className="container">
      <h1>Chunked File Upload</h1>

      <div
        className="drop-zone"
        onClick={() => fileInputRef.current.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        style={{
          border: "2px dashed #ccc",
          borderRadius: "8px",
          padding: "40px 20px",
          textAlign: "center",
          color: "#888",
          cursor: "pointer",
        }}
      >
        <p>Drag & drop a file here or click to select</p>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={(e) => e.target.files.length && handleFileSelect(e.target.files[0])}
        />
      </div>

      {fileInfo && <div className="file-info">{fileInfo}</div>}

      <button
        className="btn"
        disabled={!selectedFile}
        onClick={uploadFile}
        style={{
          marginTop: "20px",
          width: "100%",
          padding: "12px",
          border: "none",
          borderRadius: "8px",
          background: "#4a90d9",
          color: "#fff",
          fontSize: "16px",
          cursor: selectedFile ? "pointer" : "not-allowed",
        }}
      >
        Upload
      </button>

      {progress > 0 && (
        <div className="progress-container" style={{ marginTop: "20px" }}>
          <div
            className="progress-bar"
            style={{
              width: "100%",
              height: "24px",
              background: "#eee",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            <div
              className="progress-fill"
              style={{
                height: "100%",
                background: "linear-gradient(90deg, #4a90d9, #357abd)",
                width: `${progress}%`,
                transition: "width 0.3s",
              }}
            />
          </div>
          <div className="progress-text" style={{ textAlign: "center", marginTop: "8px" }}>
            {progress}%
          </div>
        </div>
      )}

      {status && (
        <div
          className="status"
          style={{
            marginTop: "16px",
            padding: "12px",
            borderRadius: "6px",
            fontSize: "14px",
            background: status.includes("Error") ? "#ffebee" : "#e3f2fd",
            color: status.includes("Error") ? "#c62828" : "#1565c0",
          }}
        >
          {status}
        </div>
      )}
    </div>
  );
};

export default ChunkedUpload;