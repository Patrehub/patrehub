const home = () => async (req, res, next) => {
  if (!req.user) {
    return res.render("index");
  }

  return res.render("dashboard", { user: req.user });
};

module.exports = {
  home,
};
