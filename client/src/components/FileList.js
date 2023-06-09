// File: src/components/FileList.js

import React, { useState, useEffect } from "react";
import path from "path-browserify";
import { useNavigate, useLocation } from "react-router-dom";
import "../css/FileList.css";

const DownloadStates = {
  DOWNLOADING: 'downloading',
  DONE: 'done',
  ERROR: 'error',
}

const FileList = ({ currentUser }) => {
  const [files, setFiles] = useState([]);
  const [downloadProgress, setDownloadProgress] = useState({});

  const location = useLocation();
  const navigate = useNavigate();

  const getCurrentDir = () => {
    return decodeURIComponent(location.pathname.slice(1));
  };

  const fetchFilesForCurrentDir = async () => {
    fetchFiles(getCurrentDir());
  };

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
    fetchFilesForCurrentDir();
  }, []);

  useEffect(() => {
    fetchFilesForCurrentDir();
  }, [location]);

  const handleDirectoryClick = async (event, newSubDir) => {
    event.preventDefault();
    const fullDir = path.join(getCurrentDir(), newSubDir);
    navigate(`/${fullDir}`);
    fetchFiles(fullDir);
  };

  const updateDownloadProgress = (fileName, newProgress, newState) => {
    setDownloadProgress((prevProgress) => ({ ...prevProgress, [fileName]: { progress: newProgress, state: newState }}));
  }
  
  const handleFileDownload = async (subDir, fileName) => {
    try {
      updateDownloadProgress(fileName, 0, DownloadStates.DOWNLOADING);
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
        updateDownloadProgress(fileName, Math.round((receivedLength / contentLength) * 100), DownloadStates.DOWNLOADING);
      }
      const blob = new Blob(chunks);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      updateDownloadProgress(fileName, 100, DownloadStates.DONE);
    } catch (error) {
      console.error("Error downloading file:", error);
      updateDownloadProgress(fileName, 0, DownloadStates.ERROR);
    }
  };

  const getProgressObj = (downloadProgress, fileName) => {
    if (!downloadProgress.hasOwnProperty(fileName)) return undefined;
    const progressObj = downloadProgress[fileName];
    if (!progressObj.state) return undefined;
    return progressObj;
  };

  return (
    <div className="FileList">
      <header className="FileList-header">
        <h1>Hello, {currentUser.username}!</h1>
      </header>
      <div className="FileList-content">
        <h2 className="FileList-section-header">{
          (() => {
            const currentDir = getCurrentDir();
            return currentDir.length === 0 ? "Root" : currentDir;
          })()
        }</h2>
        <ul>
        {files.map((file, index) => { 
          const progressObj = getProgressObj(downloadProgress, file.name);
          return (
            <li key={index}>
              <div className="file-info">
                {file.isDir ? (
                  <a href="#" onClick={(evt) => handleDirectoryClick(evt, file.name)}>
                    {file.name}
                  </a>
                ) : (
                  <span>{file.name}</span>
                )}
              </div>
              <div className="file-actions">
                {!file.isDir && (
                  <>
                    <button
                      disabled={progressObj && progressObj.state === DownloadStates.DOWNLOADING}
                      onClick={() => handleFileDownload(getCurrentDir(), file.name)}
                    >Download</button>
                    {progressObj && (
                      <span className="progress-text">
                        {progressObj.state === DownloadStates.DOWNLOADING
                          ? `${progressObj.progress}%`
                          : progressObj.state}
                      </span>
                    )}
                  </>
                )}
              </div>
            </li>
          );
        })}
        </ul>
      </div>
    </div>
  );
};

export default FileList;

