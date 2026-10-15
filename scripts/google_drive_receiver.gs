/**
 * ==============================================================================
 * Google Apps Script - Tiyul Validation Log Receiver ($0 Total Cost Policy)
 * ==============================================================================
 * 
 * מדריך התקנה מהיר (3 דקות בלבד - 0$ עלות):
 * 1. היכנס עם חשבון הגוגל שלך לכתובת: https://script.google.com
 * 2. לחץ על "פרויקט חדש" (New project) והדבק את כל תוכן הקובץ הזה במקום Code.gs.
 * 3. לחץ על כפתור "פריסה" (Deploy) בכחול למעלה -> "פריסה חדשה" (New deployment).
 * 4. בחר בסוג: "יישום אינטרנט" (Web app):
 *    - תיאור: Tiyul Log Receiver
 *    - הפעלה בתור: אני (Execute as: Me)
 *    - למי יש גישה: כל אחד (Who has access: Anyone)
 * 5. לחץ על "פריסה" ואשר את ההרשאות (גישה ל-Drive של החשבון שלך).
 * 6. העתק את ה-Web App URL שנוצר (משהו בסגנון: https://script.google.com/macros/s/.../exec).
 * 7. את הכתובת הזו ניתן להדביק באפליקציה ביומן הולידציה או להגדיר כברירת מחדל לסנכרון.
 * 
 * תוצאה:
 * בכל פעם שמשתמש בוחן את הסוכן, הקובץ נוצר אוטומטית בתיקייה "Tiyul_Validation_Logs"
 * ב-Google Drive האישי שלך עם Timestamp מדויק, מוכן לניתוח ע"י סוכן הבדיקה!
 * ==============================================================================
 */

const FOLDER_NAME = 'Tiyul_Validation_Logs';

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ error: 'No payload received' }, 400);
    }

    const payload = JSON.parse(e.postData.contents);
    const logId = payload.log_id || ('log_' + Date.now());
    const timestamp = payload.client_timestamp || new Date().toISOString();
    const safeDate = timestamp.replace(/[:.]/g, '-');
    const fileName = safeDate + '_' + logId + '.json';

    // Locate or create target folder in Google Drive
    const folder = getOrCreateFolder(FOLDER_NAME);

    // Save formatted JSON file into Google Drive
    const formattedJson = JSON.stringify(payload, null, 2);
    const file = folder.createFile(fileName, formattedJson, MimeType.PLAIN_TEXT);

    return createJsonResponse({
      status: 'SUCCESS',
      message: 'Log successfully saved to Google Drive',
      folder_name: FOLDER_NAME,
      file_name: fileName,
      file_id: file.getId(),
      received_at: new Date().toISOString()
    }, 200);

  } catch (err) {
    return createJsonResponse({
      status: 'ERROR',
      error: err.toString()
    }, 500);
  }
}

function doGet(e) {
  return createJsonResponse({
    status: 'ONLINE',
    service: 'Tiyul Validation Log Receiver',
    folder: FOLDER_NAME,
    timestamp: new Date().toISOString()
  }, 200);
}

function getOrCreateFolder(folderName) {
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(folderName);
}

function createJsonResponse(data, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
