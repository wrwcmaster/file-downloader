// File: src/components/FileList.js

import React, { useState, useEffect } from "react";
import path from "path-browserify";

const FileList = ({ currentUser }) => {
  const [files, setFiles] = useState([]);
  const [subDir, setSubDir] = useState("");
  const [downloadProgress, setDownloadProgress] = useState(null);

  const fetchFiles = async (dir) => {
    try {
      const response = await fetch(`/api/files/${encodeURIComponent(dir)}`);
      const files = await response.json();
      setFiles(files);
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };

  useEffect(() => {  
    fetchFiles(subDir);
  }, []);

  const handleDirectoryClick = async (event, newSubDir) => {
    event.preventDefault();
    setSubDir(newSubDir);
    fetchFiles(newSubDir);
  };

  const handleFileDownload = async (subDir, fileName) => {
    try {
      const response = await fetch(`/api/download/${encodeURIComponent(path.join(subDir, fileName))}`);
      const reader = response.body.getReader();
      const contentLength = +response.headers.get("Content-Length");
      let receivedLength = 0;

      const chunks = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        chunks.push(value);
        receivedLength += value.length;
        setDownloadProgress(Math.round((receivedLength / contentLength) * 100));
      }
      const blob = new Blob(chunks);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      setDownloadProgress(null);
    } catch (error) {
      console.error("Error downloading file:", error);
      setDownloadProgress(null);
    }
  };

  return (
    <div>
      <h1>Hello, {currentUser.username}!</h1>
      <h2>File List - {subDir}</h2>
      <ul>
      {files.map((file, index) => (
        <li key={index}>
          {file.isDir ? (
            <a href="#" onClick={(evt) => handleDirectoryClick(evt, path.join(subDir, file.name))}>
              {file.name}
            </a>
          ) : (
            <span>
              {file.name}
              <button onClick={() => handleFileDownload(subDir, file.name)}>Download</button>
              {downloadProgress !== null && (
                <span> {downloadProgress}%</span>
              )}
            </span>
          )}
        </li>
      ))}
      </ul>
    </div>
  );
};

export default FileList;

