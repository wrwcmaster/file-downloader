import React, { useState, useEffect } from "react";
import LoginForm from "./components/LoginForm";
import FileList from "./components/FileList";

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
    <div className="App">
      {loggedIn ? (
        <FileList currentUser={currentUser} />
      ) : (
        <LoginForm onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;

