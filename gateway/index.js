require("dotenv").config();

const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const csrf = require("csurf");
const passport = require("passport");
const patreonStrategy = require("passport-patreon").Strategy;

const dashboardController = require("./src/controllers/dashboard");
const authGithubController = require("./src/controllers/authGithub");
const webhooksPatreonController = require("./src/controllers/webhooksPatreon");

passport.use(
  new patreonStrategy(
    {
      clientID: process.env.PATREON_CLIENT_ID,
      clientSecret: process.env.PATREON_CLIENT_SECRET,
      callbackURL: process.env.PATREON_CALLBACK_URL,
    },
    function (accessToken, refreshToken, profile, done) {
      return done(null, { name: profile.name, id: profile.id });
    }
  )
);

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

const app = express();

// view engine setup
app.set("views", path.join(__dirname, "src/views"));
app.set("view engine", "ejs");

app.use(express.text({ type: "*/*" }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(csrf());
app.use(function (req, res, next) {
  res.locals.csrfToken = req.csrfToken();
  next();
});
app.use(passport.initialize());
app.use(passport.session());

app.get("/", dashboardController.home());
app.post("/webhooks/patreon", webhooksPatreonController.create());

app.get("/auth/github", authGithubController.redirect());
app.get("/auth/github/callback", authGithubController.callback());

app.get("/auth/patreon", passport.authenticate("patreon"));
app.get(
  "/auth/patreon/callback",
  passport.authenticate("patreon", { failureRedirect: "/" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/");
  }
);

/* Error handler middleware */
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(err.message, err.stack);
  res.status(statusCode).json({ message: err.message });

  return;
});

app.listen(5600, () => console.log("listening on port: 5600"));
