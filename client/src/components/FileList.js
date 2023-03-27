// File: src/components/FileList.js

import React, { useState, useEffect } from "react";
import path from "path-browserify";

const FileList = ({ currentUser }) => {
  const [files, setFiles] = useState([]);
  const [subDir, setSubDir] = useState("");

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
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error("Error downloading file:", error);
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
            </span>
          )}
        </li>
      ))}
      </ul>
    </div>
  );
};

export default FileList;

