const { format: formatUrl } = require("url");
const formurlencoded = require("form-urlencoded");
const crypt = require("../lib/crypt");

const encrypter = new crypt(process.env.ENCRYPTION_KEY);
const db = require("../data/db");
const gh = require("../services/github");

function errMap(err, params) {
  if (err === "invalid_grant") {
    return `Invalid grant_type: ${params.grant_type}`;
  } else if (err === "invalid_client") {
    return `Invalid client_id: ${params.client_id}`;
  } else {
    return `Unknown error: ${err}`;
  }
}

const getAccessToken = async (code) => {
  const params = {
    client_id: process.env.GITHUB_CLIENT_ID,
    client_secret: process.env.GITHUB_CLIENT_SECRET,
    redirect_uri: process.env.GITHUB_CALLBACK_URL,
    grant_type: "authorization_code",
    code,
  };

  const tokenUrl = formatUrl({
    protocol: "https",
    host: "github.com",
    pathname: "/login/oauth/access_token",
  });

  const tokenResp = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Accept: "application/json",
    },
    body: formurlencoded(params),
    params: params,
    credentials: "include",
    compress: false,
  });

  const status = tokenResp.status;
  if (status >= 300) {
    const err = await tokenResp.text();
    throw new Error(errMap(err, params));
  }

  const result = await tokenResp.json();
  if (result.error) {
    throw new Error(errMap(result.error, params));
  }

  return result;
};

const getProfile = async ({ access_token }) => {
  const tokenUrl = formatUrl({
    protocol: "https",
    host: "api.github.com",
    pathname: "/user",
  });

  const tokenResp = await fetch(tokenUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${access_token}`,
    },
    credentials: "include",
    compress: false,
  });

  const status = tokenResp.status;
  if (status >= 300) {
    const err = await tokenResp.text();
    throw new Error(errMap(err, params));
  }

  const result = await tokenResp.json();
  if (result.error) {
    throw new Error(errMap(result.error, params));
  }

  return result;
};

const redirect = () => async (req, res, next) => {
  if (!req.user) {
    return res.redirect("/");
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirect = process.env.GITHUB_CALLBACK_URL;
  const state = encrypter.encrypt(req.user.id.toString());

  const loginUrl = formatUrl({
    protocol: "https",
    host: "github.com",
    pathname: "/login/oauth/authorize",
    query: {
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirect,
      state,
    },
  });

  return res.redirect(loginUrl);
};

const callback = () => async (req, res, next) => {
  try {
    const { code, state } = req.query;
    const userId = encrypter.decrypt(state);
    const user = await db.getUserById(userId);
    const token = await getAccessToken(code);
    const profile = await getProfile(token);

    await db.connectGitHub(user, profile);
    await gh.syncUser(user);

    res.redirect("/");
  } catch (err) {
    console.error(`Error while creating programming language`, err.message);
    next(err);
  }
};

module.exports = {
  redirect,
  callback,
};
