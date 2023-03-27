// File: src/components/FileList.js

import React, { useState, useEffect } from "react";

const FileList = ({ currentUser }) => {
  const [files, setFiles] = useState([]);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await fetch("/api/files");
        const files = await response.json();
        setFiles(files);
      } catch (error) {
        console.error("Error fetching files:", error);
      }
    };

    fetchFiles();
  }, []);

  const handleFileDownload = async (fileName) => {
    try {
      const response = await fetch(`/api/files/download/${fileName}`);
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
      <h2>File List</h2>
      <ul>
      {files.map((file, index) => (
        <li key={index}>
          {file.isDir ? (
            <span>{file.name} (Directory)</span>
          ) : (
            <span>
              {file.name}
              <button onClick={() => handleFileDownload(file.name)}>Download</button>
            </span>
          )}
        </li>
      ))}
      </ul>
    </div>
  );
};

export default FileList;

