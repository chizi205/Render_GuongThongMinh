const axios = require("axios");
const crypto = require("crypto");

const createPaymentLink = async (order) => {
  const orderCode = Number(order.order_code);

  const rawAmount = order.total_amount;
  const amount = Math.round(Number(rawAmount));

  if (isNaN(amount) || amount <= 0) {
    throw new Error(`total_amount không hợp lệ: ${rawAmount}`);
  }
  if (amount < 1000) {
    throw new Error(`Amount quá nhỏ: ${amount} VNĐ (tối thiểu 1000 VNĐ)`);
  }

  const body = {
    orderCode,
    amount,
    description: `IGF-${order.id}`.slice(0, 25),
    returnUrl: `${process.env.PUBLIC_URL}/payment-success`,
    cancelUrl: `${process.env.PUBLIC_URL}/payment-cancel`,
  };

  console.log("Full body gốc:", JSON.stringify(body, null, 2));

  const signData = [
    `amount=${body.amount}`,
    `cancelUrl=${body.cancelUrl}`,
    `description=${body.description}`,
    `orderCode=${body.orderCode}`,
    `returnUrl=${body.returnUrl}`,
  ].join("&");


  const signature = crypto
    .createHmac("sha256", process.env.PAYOS_CHECKSUM_KEY)
    .update(signData)
    .digest("hex");


  const bodyWithSignature = {
    ...body,
    signature,
  };


  try {
    const res = await axios.post(
      "https://api-merchant.payos.vn/v2/payment-requests",
      bodyWithSignature,
      {
        headers: {
          "x-client-id": process.env.PAYOS_CLIENT_ID,
          "x-api-key": process.env.PAYOS_API_KEY,
          "Content-Type": "application/json",
        },
      },
    );


    if (!res.data || res.data.code !== "00") {
      throw new Error(res.data?.desc || "PAYOS_ERROR");
    }

    return res.data.data;
  } catch (err) {
    console.error("Axios error details:", err.response?.data || err.message);
    if (err.response?.data) {
      console.error(
        "Full PayOS error:",
        JSON.stringify(err.response.data, null, 2),
      );
    }
    throw new Error(
      err.response?.data?.desc || err.message || "Lỗi khi tạo link thanh toán",
    );
  }
};

module.exports = {
  createPaymentLink,
};
