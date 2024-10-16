var sqlite3 = require("sqlite3");
var mkdirp = require("mkdirp");

mkdirp.sync("./var/db");
const db = new sqlite3.Database("./var/db/todos.db");

const query = () => {
  return {};
};

module.exports = query;
