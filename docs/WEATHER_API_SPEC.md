# מסמך מפרט API: שירות מזג האוויר ושכבות המידע (Weather API Specification)

> **הערה חשובה:** מסמך זה נכתב כחלק ממערכת **"הסוכן המטייל"** ומשמש כמדריך טכני והסברתי על אופן פעולת ה-API של מזג האוויר, שכבות הגיבוי הרב-שכבתיות (Multi-Tier Zero-Cost), ואופן שיקוף **"הערכה בלבד"** בעת פעולה במצב אופליין (Tier 3).

---

## 📚 פרק 1: מושגי יסוד – מה זה API ואיך הוא עובד?

### 1.1 מה זה API?
**API** (ראשי תיבות של **Application Programming Interface** – ממשק תכנות יישומים) הוא "גשר דיגיטלי" או "חוזה עבודה" שמאפשר לשתי תוכנות שונות לתקשר ולהחליף מידע ביניהן דרך רשת האינטרנט.

* **הקליינט (Client - הלקוח):** האפליקציה שלנו (האתר שרץ בדפדפן של המטייל).
* **השרת (Server - ספק השירות):** מחשב מרוחק של חברת מזג האוויר (למשל Tomorrow.io או Open-Meteo) שמחזיק מסד נתונים של לוויינים ומודלים מטאורולוגיים.
* **הבקשה (Request):** הקליינט שואל: *"מה הטמפרטורה בעין גדי?"*.
* **התשובה (Response):** השרת עונה: *"29 מעלות צלזיוס, בהיר"*.

---

### 1.2 אנטומיה של בקשת HTTP (HTTP Request)
כשפונים ל-API ברשת, משתמשים בפרוטוקול **HTTP**. בקשה מורכבת מ-4 רכיבים בסיסיים:

1. **שיטת הבקשה (HTTP Method):**
   * `GET` – מבקש לקרוא/לשלוף מידע מבלי לשנות שום דבר בשרת (זו השיטה שמשמשת לקבלת מזג אוויר).
   * `POST` – שולח מידע חדש לשמירה בשרת.
   * `PUT` / `PATCH` – מעדכן מידע קיים.
   * `DELETE` – מוחק מידע.
2. **כתובת ה-Endpoint (נקודת הקצה):**
   כתובת האינטרנט הספציפית בשרת שאחראית על הפעולה המבוקשת.  
   *דוגמה:* `https://api.tomorrow.io/v4/weather/forecast`
3. **פרמטרי שאילתה (Query Parameters):**
   משתנים שמתווספים לסוף הכתובת אחרי הסימן `?` ומופרדים ב-`&`:
   * `location=31.465,35.388` (איפה בעולם?)
   * `timesteps=1d` (איזו רזולוציית זמן?)
   * `units=metric` (באילו יחידות מידה?)
   * `apikey=secret_key` (מי שואל?)
4. **קודי סטטוס בתשובה (HTTP Status Codes):**
   * `200 OK` – הבקשה הצליחה והמידע חזר בהצלחה!
   * `400 Bad Request` – שגיאה בפרמטרים שנשלחו.
   * `401 Unauthorized` – מפתח ה-API חסר, שגוי או פג תוקף.
   * `429 Too Many Requests` – חריגה ממכסת הבקשות החינמית.
   * `500 Internal Server Error` – תקלה בשרת של הספק החיצוני.

---

## 🏗️ פרק 2: ארכיטקטורת 3 השכבות של המערכת (Multi-Tier Zero-Cost)

כדי להבטיח **100% זמינות** ולעמוד בחוק הברזל של **0$ עלות תפעולית**, שירות מזג האוויר של המערכת בנוי ב-3 שכבות מדורגות:

| שכבה | שם השירות | צורך במפתח (API Key)? | עלות כספית | אופן השיקוף למשתמש |
| :--- | :--- | :---: | :---: | :--- |
| **Tier 1** | **Tomorrow.io** | כן (`VITE_TOMORROW_IO_API_KEY`) | חינם עד 500 קריאות ביום | `🟢 מזג אוויר חי (Tomorrow.io Live)` |
| **Tier 2** | **Open-Meteo** | **לא** (פתוח לכולם) | **0$ תמיד** | `🟢 מזג אוויר חי (Open-Meteo Live)` |
| **Tier 3** | **סימולציית אופליין מקומית** | **לא** (קוד מקומי) | **0$ תמיד** | `⚠️ הערכה בלבד (מצב לא מקוון / Offline)` |

---

## 📡 פרק 3: מפרט API של Tier 1 – Tomorrow.io

### 3.1 פרטי הבקשה (Request Specification)
* **Method:** `GET`
* **Base URL:** `https://api.tomorrow.io/v4/weather/forecast`
* **Headers:** `Accept: application/json`

### 3.2 פרמטרי שאילתה (Query Parameters)
| שם פרמטר | טיפוס | חובה? | דוגמה | הסבר |
| :--- | :--- | :---: | :--- | :--- |
| `location` | `string` | כן | `31.4655,35.3884` | קו רוחב וקו אורך (Latitude, Longitude) מופרדים בפסיק |
| `timesteps` | `string` | כן | `1d` | רזולוציית התחזית (`1d` ליומי, `1h` לשעתי) |
| `apikey` | `string` | כן | `a8b9c0d1e2f3...` | מפתח האימות האישי שלכם |
| `units` | `string` | לא | `metric` | יחידות צלזיוס וקמ"ש (ברירת המחדל היא imperial - פרנהייט) |

### 3.3 דוגמת קריאה מלאה (cURL)
```bash
curl -X GET "https://api.tomorrow.io/v4/weather/forecast?location=31.4655,35.3884&timesteps=1d&units=metric&apikey=YOUR_API_KEY" \
     -H "Accept: application/json"
```

### 3.4 מבנה התשובה (Response Structure - JSON)
```json
{
  "timelines": {
    "daily": [
      {
        "time": "2026-10-12T00:00:00Z",
        "values": {
          "temperatureMax": 29.4,
          "temperatureMin": 20.8,
          "temperatureAvg": 25.1,
          "precipitationProbabilityMax": 0,
          "windSpeedAvg": 4.1,
          "humidityAvg": 48,
          "weatherCodeMax": 1000
        }
      }
    ]
  }
}
```

### 3.5 טבלת מיפוי קודי מזג האוויר של Tomorrow.io לעברית
| קוד מספרי | משמעות מקורית באנגלית | תרגום לעברית במערכת | השפעה על בטיחות הטיול |
| :---: | :--- | :--- | :--- |
| **1000** | Clear, Sunny | **בהיר ושמשי ☀️** | תקין ובטוח |
| **1100** | Mostly Clear | **בהיר ברובו 🌤️** | תקין ובטוח |
| **1101** | Partly Cloudy | **מעונן חלקית ⛅** | תקין ובטוח |
| **1001** | Cloudy | **מעונן ☁️** | תקין ובטוח |
| **4000** | Drizzle | **טפטוף קל 🌦️** | בטוח, זהירות בהחלקה |
| **4001** | Rain | **גשם מקומי 🌧️** | אזהרת שיטפון בנחלי מדבר |
| **4201** | Heavy Rain | **גשם כבד ⛈️** | **פסילה בטיחותית (שיטפונות)** |
| **8000** | Thunderstorm | **סופת רעמים וברקים ⚡** | **סכנת ברקים ושיטפון** |

---

## 🌐 פרק 4: מפרט API של Tier 2 – Open-Meteo (חינמי 100%)

* **Method:** `GET`
* **Base URL:** `https://api.open-meteo.com/v1/forecast`
* **פרמטרים מומלצים:**
  ```text
  ?latitude=31.4655
  &longitude=35.3884
  &daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max
  &timezone=auto
  ```

---

## 🛡️ פרק 5: מפרט Tier 3 – מצב לא מקוון ושקיפות "הערכה בלבד"

> **דרישת שקיפות קריטית:** כאשר האפליקציה פועלת במצב אופליין (ללא קליטה בשטח או כששרתי ה-API אינם זמינים), המערכת **חייבת** להבהיר למטייל בצורה ויזואלית וטקסטואלית חד-משמעית כי **מדובר בהערכה סטטיסטית בלבד ולא בתחזית חיה!**

### 5.1 המבנה שמוחזר מהשכבה המקומית (JavaScript Output)
```javascript
{
  isLive: false,                           // דגל: אינו מידע חי מהרשת
  isSimulated: true,                       // דגל: חושב ע"י אלגוריתם הדמיה
  isEstimateOnly: true,                    // דגל מפורש: הערכה בלבד
  source: 'הערכה בלבד (סימולציית אופליין)',    // מקור המידע
  badgeText: '⚠️ הערכה בלבד (מצב לא מקוון)', // תגית לתצוגה בכרטיסייה
  disclaimer: 'נתוני מזג האוויר מוערכים על בסיס מודל אזורי עקב היעדר תקשורת חיה.',
  temp: '26°C',
  tempMax: 26,
  tempMin: 18,
  precipProb: 5,
  conditions: 'בהיר ונוח',
  heatLoad: 'נוח לטיול'
}
```

### 5.2 כיצד זה משוקף למשתמש בממשק (UI / UX)?
1. **בכרטיסיית המסלול (`FloatingMapCard.jsx`):**
   * במקום תג ירוק של `🟢 מזג אוויר חי`, מופיע תג אזהרה בצבע צהוב-ענבר:  
     `⚠️ הערכה בלבד (מצב לא מקוון / Offline)`
2. **בתשובות של בוט הסוכן המטייל (`AgentRulesEngine.js`):**
   * הנימוק להמלצה מציין במפורש:  
     `26°C (בהיר ונוח) • הערכה בלבד (Offline)`

---

## ⚡ פרק 6: מנגנון הזיכרון המטמון (Caching)

1. **זמן חיים (TTL - Time To Live):** 30 דקות (`30 * 60 * 1000` מילישניות).
2. **מפתח המטמון (Cache Key):** הקואורדינטות מעוגלות ל-3 ספרות אחרי הנקודה (למשל `31.465,35.388`), כך שאתרים סמוכים ייהנו מאותו מטמון.

---

## 💻 פרק 7: דוגמת קוד מעשית למתחילים (Vanilla JavaScript)

```javascript
/**
 * פונקציה פשוטה לשליפת מזג אוויר מ-Tomorrow.io עם גיבוי לשכבת הערכה
 */
async function getTrailWeather(lat, lng, apiKey) {
  const endpoint = `https://api.tomorrow.io/v4/weather/forecast?location=${lat},${lng}&timesteps=1d&units=metric&apikey=${apiKey}`;

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: { "Accept": "application/json" }
    });

    if (!response.ok) {
      throw new Error(`שגיאת שרת: קוד ${response.status}`);
    }

    const data = await response.json();
    const todayValues = data.timelines.daily[0].values;

    return {
      isLive: true,
      isEstimateOnly: false,
      source: "Tomorrow.io Live",
      temperature: Math.round(todayValues.temperatureMax),
      rainChance: todayValues.precipitationProbabilityMax,
      weatherCode: todayValues.weatherCodeMax,
      displayText: `🟢 מזג אוויר חי: ${Math.round(todayValues.temperatureMax)}°C`
    };

  } catch (error) {
    console.warn("⚠️ הפנייה ל-API נכשלה, עובר למצב הערכה:", error.message);
    
    return {
      isLive: false,
      isEstimateOnly: true,
      source: "הערכה בלבד (Offline)",
      temperature: 26,
      rainChance: 0,
      displayText: "⚠️ הערכה בלבד (מצב לא מקוון): כ-26°C"
    };
  }
}
```

---

## 🔒 פרק 8: אבטחת מפתחות API

1. צרי קובץ בשם `.env` בשורש הפרויקט:
   ```env
   VITE_TOMORROW_IO_API_KEY=a1b2c3d4e5f6g7h8...
   ```
2. ודאי שקובץ `.env` רשום בתוך `.gitignore` (כדי שגיט יתעלם ממנו ולא יעלה אותו לענן).
3. בקוד של האפליקציה, קוראים את המפתח דרך משתנה סביבה:
   ```javascript
   const apiKey = import.meta.env.VITE_TOMORROW_IO_API_KEY;
   ```
