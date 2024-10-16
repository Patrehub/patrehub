const create = () => async (req, res, next) => {
  try {
    const headers = req.headers;
    const signature = headers["x-patreon-signature"];

    if (!isValidateHmac(signature, req.body)) {
      throw new Error("Invalid signature");
    }

    const body = JSON.parse(req.body);
    res.json(await webhook(headers, body));
  } catch (err) {
    console.error(`Error while creating programming language`, err.message);
    next(err);
  }
};

async function isValidateHmac(signature, body) {
  const webhookSecret = process.env.PATREON_WEBHOOK_SECRET;

  const hash = crypto
    .createHmac("md5", webhookSecret)
    .update(body)
    .digest("hex");

  return hash === signature;
}

async function webhook(headers, body) {
  try {
    const patreonEvent = headers["x-patreon-event"];

    console.log(patreonEvent);
    console.log(body);

    return {
      statusCode: 200,
      body: JSON.stringify(body),
    };
  } catch (err) {
    console.error(`Error while creating programming language`, err.message);
    next(err);
  }
}

module.exports = {
  create,
};
