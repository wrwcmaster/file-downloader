// File: src/App.js

import React, { useState, useEffect } from "react";
import LoginForm from "./components/LoginForm";
import FileList from "./components/FileList";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch("/api/current_user");
        if (response.status === 401) {
          setLoggedIn(false);
          setCurrentUser(null);
        } else {
          const user = await response.json();
          setLoggedIn(true);
          setCurrentUser(user);
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };

    fetchCurrentUser();
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
    setLoggedIn(true);
  };
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="*" element={
          loggedIn ? (
            <FileList currentUser={currentUser} />
          ) : (
            <LoginForm onLogin={handleLogin} />
          )}/>
        </Routes>
      </div>
    </Router>
  );
}

export default App;

