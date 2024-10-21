const { Sequelize, DataTypes, Model } = require("sequelize");

const sequelize = new Sequelize("sqlite:./data/patrehub.db");

class User extends Model {}

User.init(
  {
    id: {
      allowNull: false,
      autoIncrement: false,
      primaryKey: true,
      type: DataTypes.INTEGER,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    githubUsername: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    // Other model options go here
    sequelize, // We need to pass the connection instance
  }
);

const init = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");

    await sequelize.sync({ force: process.env.DB_SYNC_FORCE === "true" });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

const upsertUser = async (profile) => {
  const user = await User.findByPk(profile.id);
  if (user) {
    return user;
  }

  const createdUser = await User.create({
    id: profile.id,
    name: profile.name,
  });
  return createdUser;
};

const getUserById = async (id) => {
  const user = await User.findByPk(id);
  return user;
};

const connectGitHub = async (user, profile) => {
  user.githubUsername = profile.login;
  await user.save();
};

module.exports = {
  init: init,
  upsertUser: upsertUser,
  getUserById: getUserById,
  connectGitHub: connectGitHub,
};
