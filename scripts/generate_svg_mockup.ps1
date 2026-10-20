# PowerShell script to generate high-fidelity main-screen-mockup.svg with base64 embedded pixel-perfect capture and editable Figma vector layers

$imgPath = "public/main-window-capture.png"
if (-not (Test-Path $imgPath)) {
    Write-Error "Screenshot $imgPath not found"
    exit 1
}

$bytes = [System.IO.File]::ReadAllBytes($imgPath)
$base64 = [System.Convert]::ToBase64String($bytes)

$svgContent = @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1536 711" width="1536" height="711" style="background:#0c1017; font-family:'Assistant', -apple-system, sans-serif; direction:rtl;">
  <defs>
    <filter id="panelShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="-2" dy="4" stdDeviation="12" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
    <filter id="pillShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="6" flood-color="#000000" flood-opacity="0.25"/>
    </filter>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Assistant:wght@300;400;500;600;700;800;900&amp;display=swap');
      text { font-family: 'Assistant', sans-serif; }
    </style>
  </defs>

  <!-- 1. Pixel-Perfect Real App Screen Capture (Exact Map, Markers, and UI State) -->
  <g id="App-Screen-Real-Capture" opacity="1">
    <image href="data:image/png;base64,$base64" width="1536" height="711" />
  </g>

  <!-- 2. Figma-Editable Vector Overlay for Top Bar (Row 1 & Row 2) -->
  <g id="Figma-Editable-TopBar" opacity="0.01">
    <!-- Top Row Brand -->
    <rect id="Brand-Area" x="1270" y="10" width="250" height="42" fill="#0c1017" rx="8" />
    <text x="1430" y="38" font-size="22" font-weight="900" fill="#ffffff" text-anchor="end">לאן נטייל?</text>
    <text x="1330" y="36" font-size="14" font-weight="800" fill="#2dd4bf" text-anchor="middle">126 / 126 אתרים</text>

    <!-- Top Row Search -->
    <rect id="Search-Input-Box" x="120" y="10" width="1135" height="42" fill="#111620" stroke="#ffffff" stroke-opacity="0.14" rx="12" />
    <text x="1200" y="36" font-size="16" font-weight="700" fill="#94a3b8" text-anchor="end">חיפוש חכם וחופשי: 'מעיין בצפון', 'עגלות', 'ילד בן 4', 'שמורת טבע בשרון'...</text>

    <!-- Top Row Reset -->
    <rect id="Reset-Button" x="20" y="10" width="85" height="42" fill="#ffffff" fill-opacity="0.06" rx="12" />
    <text x="55" y="36" font-size="16" font-weight="700" fill="#ffffff" text-anchor="middle">איפוס</text>

    <!-- Bottom Row Filters Toolbar -->
    <rect id="Filters-Toolbar-Bar" x="20" y="62" width="1496" height="52" fill="#181d27" stroke="#ffffff" stroke-opacity="0.08" rx="12" />
    <text x="1460" y="85" font-size="11" font-weight="700" fill="#94a3b8" text-anchor="end">אזור בארץ</text>
    <text x="1460" y="103" font-size="15" font-weight="700" fill="#ffffff" text-anchor="end">כל האזורים</text>

    <text x="1170" y="85" font-size="11" font-weight="700" fill="#94a3b8" text-anchor="end">סוג שמורה</text>
    <text x="1170" y="103" font-size="15" font-weight="700" fill="#ffffff" text-anchor="end">כל השמורות</text>

    <text x="880" y="85" font-size="11" font-weight="700" fill="#94a3b8" text-anchor="end">רמת קושי וגיל</text>
    <text x="880" y="103" font-size="15" font-weight="700" fill="#ffffff" text-anchor="end">כל הרמות והגילאים</text>

    <text x="590" y="85" font-size="11" font-weight="700" fill="#94a3b8" text-anchor="end">מועד ביקור מתוכנן</text>
    <text x="590" y="103" font-size="15" font-weight="700" fill="#ffffff" text-anchor="end">10/20/2026</text>
  </g>

  <!-- 3. Figma-Editable Vector Overlay for ChatBot Panel -->
  <g id="Figma-Editable-ChatBot" opacity="0.01">
    <rect id="ChatBot-Panel-Card" x="1150" y="125" width="370" height="570" fill="#ffffff" rx="16" filter="url(#panelShadow)" />
    
    <!-- ChatBot Header -->
    <text x="1470" y="160" font-size="16" font-weight="800" fill="#0f172a" text-anchor="end">סוכן הטיולים</text>
    <text x="1370" y="159" font-size="11" font-weight="800" fill="#0d9488" text-anchor="middle">AI GUIDE</text>
    <text x="1470" y="178" font-size="11" font-weight="500" fill="#64748b" text-anchor="end">תכנון מסלולים מונחה בטיחות ונתוני שטח</text>

    <!-- Bot Message Bubble -->
    <rect id="Bot-Bubble" x="1170" y="200" width="330" height="110" fill="#f1f5f9" rx="16" />
    <text x="1480" y="230" font-size="14" font-weight="700" fill="#1e293b" text-anchor="end">שלום וברוכים הבאים! אני סוכן הטיולים החכם שלכם.</text>
    <text x="1480" y="260" font-size="13" font-weight="500" fill="#334155" text-anchor="end">ספרו לי: לאן תרצו לטייל ומתי? (למשל: "רוצים לטייל מחר</text>
    <text x="1480" y="280" font-size="13" font-weight="500" fill="#334155" text-anchor="end">בצפון עם ילדים קטנים בני 3, מחפשים מים").</text>

    <!-- Option Buttons -->
    <rect id="Option-1" x="1270" y="325" width="80" height="30" rx="15" fill="#e6fffa" stroke="#99f6e4" />
    <text x="1310" y="345" font-size="12" font-weight="700" fill="#0d9488" text-anchor="middle">הפתע אותי!</text>

    <rect id="Option-2" x="1360" y="325" width="140" height="30" rx="15" fill="#e6fffa" stroke="#99f6e4" />
    <text x="1430" y="345" font-size="12" font-weight="700" fill="#0d9488" text-anchor="middle">טיול מים בצפון למחר (גיל 4+)</text>

    <!-- Chat Input Box -->
    <rect id="Chat-Input" x="1170" y="635" width="330" height="44" rx="22" fill="#ffffff" stroke="#e2e8f0" />
    <text x="1450" y="662" font-size="13" font-weight="500" fill="#94a3b8" text-anchor="end">כתבו בקשה חופשית... (למשל: טיול מים מחר בצפון לגיל 4)</text>
  </g>
</svg>
"@

[System.IO.File]::WriteAllText("public/main-screen-mockup.svg", $svgContent, [System.Text.Encoding]::UTF8)
Write-Output "Successfully generated public/main-screen-mockup.svg"
