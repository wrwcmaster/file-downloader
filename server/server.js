// TODO: Download All
// TODO: CSS

// Imports
const express = require("express");
const https = require("https");
const fs = require("fs");
const path = require("path");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");
const bcrypt = require("bcryptjs");

// Load configuration from config.json
const config = require("./config.json");

// Constants
const PORT = process.env.PORT || config.port;
const privateKey = fs.readFileSync("server.key", "utf8");
const certificate = fs.readFileSync("server.crt", "utf8");
const credentials = { key: privateKey, cert: certificate };

// App Setup
const app = express();
app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../client/build")));

// Passport Setup
passport.use(
  new LocalStrategy((username, password, done) => {
    const user = config.users.find((user) => user.username === username);

    if (!user) {
      return done(null, false, { message: "Incorrect username." });
    }

    bcrypt.compare(password, user.password, (err, result) => {
      if (err) {
        return done(err);
      }
      if (!result) {
        return done(null, false, { message: "Incorrect password." });
      }
      return done(null, user);
    });
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  const user = config.users.find((user) => user.id === id);
  done(null, user);
});

// Middleware
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).send("Unauthorized");
}

// Routes
app.post("/api/login", (req, res, next) => {
  console.log("Login route called");
  next();
}, passport.authenticate("local"), (req, res) => {
  res.json({ username: req.user.username });
});

app.get("/api/logout", (req, res) => {
  req.logout();
  res.send("Logged out");
});

app.get("/api/current_user", (req, res) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
});

app.get("/api/files/:subDir?",ensureAuthenticated, (req, res) => {
  const subDir = req.params.subDir ? req.params.subDir : "";
  const filesPath = path.join(__dirname, config.rootFilesPath, subDir);

  // Check if the requested file is located within the rootFilesPath directory
  if (!filesPath.startsWith(path.join(__dirname, config.rootFilesPath))) {
    console.error("Attempted to access outside of rootFilesPath directory");
    return res.status(403).send("Forbidden");
  }

  fs.readdir(filesPath, (err, files) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error reading files");
    } else {
      const fileList = [];
      
      // Add ".." dir
      if (subDir.length > 0) {
        fileList.push({
          name: "..",
          isDir: true
        });
        if (!files.length) {
           res.json(fileList);
           return;
        }
      }
      const startCount = fileList.length;
      files.forEach(file => {
        const filePath = path.join(filesPath, file);

        fs.stat(filePath, (err, stats) => {
          if (err) {
            console.error(err);
            res.status(500).send("Error getting file stats");
            return;
          }

          fileList.push({
            name: file,
            isDir: stats.isDirectory()
          });

          if (fileList.length === files.length + startCount) {
            res.json(fileList);
          }
        });
      });
    }
  });
});

app.get("/api/download/:filename", ensureAuthenticated, (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, config.rootFilesPath, filename);

  // Check if the requested file is located within the rootFilesPath directory
  if (!filePath.startsWith(path.join(__dirname, config.rootFilesPath))) {
    console.error("Attempted to download a file outside of rootFilesPath directory");
    return res.status(403).send("Forbidden");
  }

  res.download(filePath, (err) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error downloading file");
    }
  });
});

// Server
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build", "index.html"));
});

const httpsServer = https.createServer(credentials, app);

httpsServer.listen(PORT, () => {
  console.log(`Server is running on https://localhost:${PORT}`);
});
