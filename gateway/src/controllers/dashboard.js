const gh = require("../services/github");

const home = () => async (req, res, next) => {
  if (!req.user) {
    return res.render("index");
  }

  if (!req.user.githubUsername) {
    return res.render("github", { user: req.user });
  }

  return res.render("completed", { user: req.user });
};

const sync = () => async (req, res, next) => {
  if (!req.user || !req.user.githubUsername) {
    return res.redirect("/");
  }

  await gh.syncUser(user);
  res.redirect("/");
};

module.exports = {
  home,
  sync,
};
