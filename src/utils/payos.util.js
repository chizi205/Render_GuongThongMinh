const crypto = require("crypto");

exports.verifyPayOSSignature = (req) => {
  try {
    const signature = req.headers["x-signature"];
    const body = JSON.stringify(req.body);

    const secretKey = process.env.PAYOS_CHECKSUM_KEY;

    const hash = crypto
      .createHmac("sha256", secretKey)
      .update(body)
      .digest("hex");

    return hash === signature;
  } catch (err) {
    return false;
  }
};