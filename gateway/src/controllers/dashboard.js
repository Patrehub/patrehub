const home = () => async (req, res, next) => {
  console.log("SESSION", req.session);
  console.log("sessionID", req.sessionID);
  console.log("USER", req.user);

  if (!req.user) {
    return res.render("home");
  }

  return res.render("dashboard", { user: req.user });
};

module.exports = {
  home,
};
