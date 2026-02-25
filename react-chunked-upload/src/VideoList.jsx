import React, { useState, useEffect } from "react";

const BASE_URL = "http://127.0.0.1:8000";
const VIDEOS_URL = `${BASE_URL}/api/videos/`;

const VideoList = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeVideo, setActiveVideo] = useState(null);

  const fetchVideos = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(VIDEOS_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setVideos(data);
    } catch (err) {
      setError(`Failed to load videos: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const getVideoUrl = (video) => {
    if (video.file?.startsWith("http")) return video.file;
    return `${BASE_URL}${video.file}`;
  };

  return (
    <div style={{ marginTop: "40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>Uploaded Videos</h2>
        <button
          onClick={fetchVideos}
          style={{
            padding: "8px 16px",
            border: "none",
            borderRadius: "6px",
            background: "#4a90d9",
            color: "#fff",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Refresh
        </button>
      </div>

      {loading && <p style={{ color: "#888", marginTop: "16px" }}>Loading videos...</p>}

      {error && (
        <div
          style={{
            marginTop: "16px",
            padding: "12px",
            borderRadius: "6px",
            background: "#ffebee",
            color: "#c62828",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && videos.length === 0 && (
        <p style={{ color: "#888", marginTop: "16px" }}>No videos uploaded yet.</p>
      )}

      {activeVideo && (
        <div
          style={{
            marginTop: "20px",
            background: "#000",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          <video
            key={activeVideo.id}
            controls
            autoPlay
            style={{ width: "100%", maxHeight: "500px", display: "block" }}
          >
            <source src={getVideoUrl(activeVideo)} />
            Your browser does not support the video tag.
          </video>
          <div
            style={{
              padding: "12px 16px",
              background: "#1a1a1a",
              color: "#fff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>{activeVideo.filename}</span>
            <button
              onClick={() => setActiveVideo(null)}
              style={{
                padding: "6px 12px",
                border: "1px solid #555",
                borderRadius: "4px",
                background: "transparent",
                color: "#fff",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {!loading && videos.length > 0 && (
        <div
          style={{
            marginTop: "20px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: "16px",
          }}
        >
          {videos.map((video) => (
            <div
              key={video.id}
              onClick={() => setActiveVideo(video)}
              style={{
                border: activeVideo?.id === video.id ? "2px solid #4a90d9" : "1px solid #ddd",
                borderRadius: "8px",
                overflow: "hidden",
                cursor: "pointer",
                transition: "box-shadow 0.2s",
                background: "#fafafa",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)")}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
            >
              <div
                style={{
                  height: "140px",
                  background: "#000",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                <video
                  src={getVideoUrl(video)}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  muted
                  preload="metadata"
                />
                <div
                  style={{
                    position: "absolute",
                    width: "48px",
                    height: "48px",
                    background: "rgba(0,0,0,0.6)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      width: 0,
                      height: 0,
                      borderTop: "10px solid transparent",
                      borderBottom: "10px solid transparent",
                      borderLeft: "16px solid #fff",
                      marginLeft: "4px",
                    }}
                  />
                </div>
              </div>
              <div style={{ padding: "10px 12px" }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: "14px",
                    fontWeight: 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {video.filename}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoList;
