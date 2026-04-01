const { google } = require('googleapis');
const stream = require('stream');

// --- BẮT ĐẦU PHẦN SỬA ĐỔI: DÙNG OAUTH2 THAY CHO SERVICE ACCOUNT ---
const oauth2Client = new google.auth.OAuth2(
  process.env.DRIVE_CLIENT_ID,
  process.env.DRIVE_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);

oauth2Client.setCredentials({
  refresh_token: process.env.DRIVE_REFRESH_TOKEN,
});

const drive = google.drive({ version: 'v3', auth: oauth2Client });
// --- KẾT THÚC PHẦN SỬA ĐỔI ---

/**
 * Hàm hỗ trợ: Tìm thư mục theo tên và ID thư mục cha, nếu chưa có thì tạo mới
 */
const getOrCreateFolder = async (folderName, parentFolderId) => {
  try {
    let query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
    
    if (parentFolderId) {
      query += ` and '${parentFolderId}' in parents`;
    } else {
      query += ` and 'root' in parents`;
    }

    const response = await drive.files.list({
      q: query,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    if (response.data.files && response.data.files.length > 0) {
      return response.data.files[0].id;
    }

    const folderMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentFolderId ? [parentFolderId] : [],
    };

    const folder = await drive.files.create({
      requestBody: folderMetadata,
      fields: 'id',
    });

    return folder.data.id;
  } catch (error) {
    console.error(`[Google Drive] Lỗi tại thư mục "${folderName}":`, error.message);
    throw error;
  }
};

/**
 * Hàm upload chính
 */
const uploadToDrive = async (fileBuffer, originalName, mimeType, userId, folderType) => {
  try {
    const currentYear = new Date().getFullYear().toString();
    const ROOT_FOLDER_ID = process.env.DRIVE_ROOT_FOLDER_ID;

    if (!ROOT_FOLDER_ID) {
      throw new Error("DRIVE_ROOT_FOLDER_ID không được cấu hình trong .env");
    }

    const yearFolderId = await getOrCreateFolder(currentYear, ROOT_FOLDER_ID);
    const safeUserId = userId ? String(userId) : "unknown";
    const userFolderId = await getOrCreateFolder(safeUserId, yearFolderId);
    const finalFolderId = await getOrCreateFolder(folderType, userFolderId);

    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileBuffer);

    const fileMetadata = {
      name: `${Date.now()}_${originalName}`,
      parents: [finalFolderId],
    };

    const uploadedFile = await drive.files.create({
      requestBody: fileMetadata,
      media: { mimeType, body: bufferStream },
      fields: 'id, webViewLink, webContentLink',
    });

    await drive.permissions.create({
      fileId: uploadedFile.data.id,
      requestBody: { role: 'reader', type: 'anyone' },
    });

    return {
      fileId: uploadedFile.data.id,
      url: uploadedFile.data.webViewLink,
      downloadUrl: uploadedFile.data.webContentLink
    };
  } catch (error) {
    console.error("[Google Drive] Chi tiết lỗi:", error.message);
    throw new Error("Không thể lưu ảnh lên Google Drive");
  }
};

const getFileStream = async (fileId) => {
  try {
    const response = await drive.files.get(
      { fileId: fileId, alt: 'media' },
      { responseType: 'stream' }
    );
    return response.data;
  } catch (error) {
    console.error("[Google Drive] Lỗi khi lấy file stream:", error.message);
    throw new Error("Không thể tải ảnh từ Google Drive");
  }
};

module.exports = { uploadToDrive, getFileStream };