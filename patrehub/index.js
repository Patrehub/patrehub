require("dotenv").config();

const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const session = require("express-session");
var FileStore = require("session-file-store")(session);
const csrf = require("csurf");
const passport = require("passport");
const patreonStrategy = require("passport-patreon").Strategy;

const dashboardController = require("./src/controllers/dashboard");
const authGithubController = require("./src/controllers/authGithub");
const webhooksPatreonController = require("./src/controllers/webhooksPatreon");

const db = require("./src/data/db");

passport.use(
  new patreonStrategy(
    {
      clientID: process.env.PATREON_CLIENT_ID,
      clientSecret: process.env.PATREON_CLIENT_SECRET,
      callbackURL: process.env.PATREON_CALLBACK_URL,
    },
    async function (accessToken, refreshToken, profile, done) {
      try {
        const user = await db.upsertUser(profile);
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(async function (id, done) {
  try {
    const user = await db.getUserById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

const app = express();

// view engine setup
app.set("views", path.join(__dirname, "src/views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

if (process.env.NODE_ENV === "development") {
  var livereload = require("livereload");
  var connectLiveReload = require("connect-livereload");

  const liveReloadServer = livereload.createServer();
  liveReloadServer.watch(path.join(__dirname, "public"));
  liveReloadServer.server.once("connection", () => {
    setTimeout(() => {
      liveReloadServer.refresh("/");
    }, 100);
  });
  app.use(connectLiveReload());
}

app.use(express.text({ type: "*/*" }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.COOKIE_SECURE === "true" },
    store: new FileStore(),
  })
);
app.use(passport.session());
app.use(csrf());
app.use(function (req, res, next) {
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.get("/", dashboardController.home());
app.get("/sync", dashboardController.sync());
app.post("/webhooks/patreon", webhooksPatreonController.create());

app.get("/auth/github", authGithubController.redirect());
app.get("/auth/github/callback", authGithubController.callback());

app.get("/auth/patreon", passport.authenticate("patreon"));
app.get("/auth/patreon/callback", passport.authenticate("patreon", { failureRedirect: "/" }), function (req, res) {
  // Successful authentication, redirect home.
  res.redirect("/");
});

/* Error handler middleware */
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(err.message, err.stack);
  res.status(statusCode).json({ message: err.message });

  return;
});

const init = async () => {
  await db.init();
  app.listen(5600, () => console.log("listening on port: 5600"));
};

init();
