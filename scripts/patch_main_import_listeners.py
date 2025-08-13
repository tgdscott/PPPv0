from pathlib import Path
p = Path("podcast-pro-plus/api/main.py")
text = p.read_text(encoding="utf-8")
imp = "import api.db_listeners  # registers SQLAlchemy listeners"
if imp not in text:
    # Put near the top so it's imported when app starts
    text = imp + "\n" + text
    p.write_text(text, encoding="utf-8")
    print("Patched api/main.py to import db_listeners")
else:
    print("db_listeners already imported")
