const { pool } = require("../../config/database");
const adRepo = require("../../repositories/advertise/advertise.repo");

const generateRandomAdImages = async (shopId, limit = 5) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const randomProducts = await adRepo.getRandomProductsWithImages(client, shopId, limit);
    if (randomProducts.length === 0) {
      await client.query('ROLLBACK');
      return { eventId: null, images: [] };
    }

    const eventName = `Tự động - ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString()}`;
    const eventData = await adRepo.createAdEvent(client, shopId, eventName, 'auto_random');

    const imagesResult = [];
    for (let i = 0; i < randomProducts.length; i++) {
      const row = randomProducts[i];
      const img = row.image_urls[0];
      await adRepo.createAdEventImage(client, eventData.id, img, row.id, i);
      imagesResult.push({ product_name: row.name, image_url: img });
    }

    await client.query('COMMIT');
    return {
      event_id: eventData.id,
      event_name: eventData.name,
      created_at: eventData.created_at,
      images: imagesResult
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const saveManualSelection = async (shopId, name, variantIds) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const eventData = await adRepo.createAdEvent(client, shopId, name || 'Quảng cáo thủ công', 'manual_selection');
    const variants = await adRepo.getVariantsByIds(client, variantIds);

    const savedImages = [];
    for (let i = 0; i < variants.length; i++) {
      const row = variants[i];
      const img = (row.image_urls && row.image_urls.length > 0) ? row.image_urls[0] : null;
      
      if (img) {
        await adRepo.createAdEventImage(client, eventData.id, img, row.id, i);
        savedImages.push({ variant_id: row.id, image_url: img });
      }
    }

    await client.query('COMMIT');
    return {
      event_id: eventData.id,
      name: eventData.name,
      created_at: eventData.created_at,
      images: savedImages
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  generateRandomAdImages,
  saveManualSelection
};