const axios = require("axios");
const ShopRepository = require("../../repositories/shop/shop.repo");
const UserRepository = require("../../repositories/user/info.repo");

const ZALO_API = "https://openapi.zalo.me/v3.0/oa";


class ZaloAuthService {
  static async refreshToken(shopId) {
    const tokenInfo = await ShopRepository.getTokenInfo(shopId);
    const shop = await ShopRepository.findById(shopId);

    if (!tokenInfo?.zalo_refresh_token) {
      throw new Error("Không có refresh token");
    }
    if (!shop?.zalo_app_id) {
      throw new Error("Thiếu Zalo App ID (app_id)");
    }
    if (!shop?.zalo_secret_key) {
      throw new Error("Thiếu Zalo Secret Key");
    }

    const formData = new URLSearchParams();
    formData.append("grant_type", "refresh_token");
    formData.append("refresh_token", tokenInfo.zalo_refresh_token);
    formData.append("app_id", shop.zalo_app_id);

    const res = await axios.post(
      "https://oauth.zaloapp.com/v4/oa/access_token",
      formData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          secret_key: shop.zalo_secret_key,
        },
      },
    );

    const data = res.data;

    if (data.error || data.error_name) {
      console.error("Lỗi refresh token Zalo:", data);
      throw new Error(
        `Zalo error: ${data.error_name || data.error} - ${data.error_description}`,
      );
    }

    await ShopRepository.updateZaloToken(shopId, {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    });

    return data.access_token;
  }
}

class ZaloService {
  static async getAccessToken(shopId) {
    const isExpired = await ShopRepository.isTokenExpired(shopId);

    console.log(isExpired);

    if (isExpired) {
      return await ZaloAuthService.refreshToken(shopId);
    }

    const tokenInfo = await ShopRepository.getTokenInfo(shopId);
    return tokenInfo?.zalo_access_token;
  }

  static async requestWithRetry(shopId, config) {
    let accessToken = await this.getAccessToken(shopId);
    console.log(accessToken);

    try {
      return await axios({
        ...config,
        headers: {
          ...config.headers,
          access_token: accessToken,
          "Content-Type": "application/json",
        },
      });
    } catch (err) {
      const errorCode = err.response?.data?.error;

      if (errorCode === -216 || errorCode === -201) {
        accessToken = await ZaloAuthService.refreshToken(shopId);

        return await axios({
          ...config,
          headers: {
            ...config.headers,
            access_token: accessToken,
            "Content-Type": "application/json",
          },
        });
      }

      throw err;
    }
  }

  static async sendImages(shopId, userId, imageUrls) {
    try {
      if (!Array.isArray(imageUrls)) imageUrls = [imageUrls];

      const zaloUserId = await UserRepository.getZaloUserId(shopId, userId);
      if (!zaloUserId) throw new Error("USER_NOT_LINKED_ZALO");

      const promises = imageUrls.map(async (url) => {
        const res = await this.requestWithRetry(shopId, {
          method: "POST",
          url: `${ZALO_API}/v3.0/oa/message/cs`,
          data: {
            recipient: { user_id: zaloUserId },
            message: {
              attachment: {
                type: "template",
                payload: {
                  template_type: "media",
                  elements: [
                    {
                      media_type: "image",
                      url: url,
                    },
                  ],
                },
              },
            },
          },
        });
        return res.data;
      });

      const results = await Promise.all(promises);

      console.log(`✅ Đã gửi ${imageUrls.length} ảnh bằng media template`);
      return results;
    } catch (err) {
      console.error(
        "Zalo sendImages error:",
        err.response?.data || err.message,
      );
      throw err;
    }
  }
  static async sendText(shopId, userId, text) {
    try {
      const zaloUserId = await UserRepository.getZaloUserId(shopId, userId);
      if (!zaloUserId) {
        throw new Error("USER_NOT_LINKED_ZALO");
      }
      console.log(zaloUserId);
      const res = await this.requestWithRetry(shopId, {
        method: "POST",
        url: `${ZALO_API}/message/cs`,
        data: {
          recipient: { user_id: zaloUserId },
          message: { text },
        },
      });

      return res.data;
    } catch (err) {
      console.error("Zalo sendText error:", err.response?.data || err.message);
      throw err.response?.data || err.message;
    }
  }
}

module.exports = ZaloService;
