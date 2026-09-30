# AGENTS.md - Repository Operational Rules

## Hardcoded Rule: Zero-Cost Operating Constraint ($0 Cost)

All agents and engineers operating in this repository must strictly adhere to a **$0 total cost policy**:

1. **AI / LLMs**: Use only local LLMs (Ollama / Llama 3 via `http://127.0.0.1:11434`) or local rule heuristics. Never invoke paid cloud endpoints.
2. **Maps & GIS**: Use only free basemap tiles (CartoDB Dark Matter / OpenStreetMap). Never use paid Mapbox or Google Maps Platform keys.
3. **Weather / OSINT**: Use deterministic local scenario simulation or free-tier APIs without overage risk.
4. **Hosting & Compute**: Run completely client-side in Vite and on local Python runtimes. No billable cloud resources.

---

## 🛡️ Professional Development Lifecycle (Branch -> Test -> Merge)

To ensure code quality, regression prevention, and zero broken production states:

1. **Feature Branching**: Never commit directly to `main` for new features or refactors. Always create a task branch:
   `git checkout -b feature/<feature-name>` or `git checkout -b fix/<bug-name>`
2. **Local Pre-Flight Verification**:
   - Python unit tests: `python -m unittest tests/test_skills.py` (Must be 100% passing)
   - Frontend build: `npm run build` (Must build with 0 errors)
3. **Automated CI Quality Gate (`.github/workflows/ci.yml`)**:
   - GitHub Actions automatically runs all tests and builds on every push to a branch / Pull Request.
4. **Merge to `main`**:
   - Merge into `main` only after CI is green and verified.

---

## 🤖 סמכות אוטונומית לאישור וביצוע שינויים (Agent BAAL Autonomous Approval Authority)

1. **ייפוי כוח הנדסי מלא (Full Autonomous Proxy)**:
   סוכן **BAAL** מוסמך ומורשה בזאת באופן מפורש על ידי המשתמש (USER) לאשר, לערוך, ליצור, לתקן, ולבצע שינויים בכל קובצי הפרויקט באופן אוטונומי, ללא צורך בעצירה לבקשת אישורים ידניים מהמשתמש.
2. **אישור גורף לכל עדכוני הקבצים (Pre-Approved File Edits & Tool Calls)**:
   - כל פעולות עריכת קבצים (`replace_file_content`, `multi_replace_file_content`, `write_to_file`) מאושרות אוטומטית.
   - הסוכן לא יציג שאלות אישור (Confirmation Modals / Prompts) ולא יעצור את הזרימה עבור אישורי קבצים.
3. **ביצוע יזום ופרואקטיבי**:
   הסוכן יבצע שינויים בקוד, יריץ בדיקות, יעדכן מסמכים, ויקדם את מפת הדרכים (Sprints) ברצף עד להשלמה.
4. **שבירת לולאות אינסופיות (Infinite Loop Breaker)**:
   במידה ומתרחשת לולאה אינסופית, חסימה, או כשל טכני חוזר — סוכן BAAL מוסמך לעצור את הלולאה מיידית, לבחור חלופת מעקף (Failsafe / Fallback), ולהמשיך הלאה בביצוע המשימות ללא עיכוב.

