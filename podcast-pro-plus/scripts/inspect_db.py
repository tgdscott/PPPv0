import sqlite3, os, pathlib, json
DB=pathlib.Path(__file__).resolve().parents[1]/'database.db'
print('DB path:', DB, 'exists?', DB.is_file())
conn=sqlite3.connect(str(DB))
cur=conn.cursor()
print('Tables:')
for (name,) in cur.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall():
    print(' -', name)

# Try common table names
for table in ('episode','episodes','Episode'):
    try:
        cur.execute(f"PRAGMA table_info({table})")
        cols=cur.fetchall()
        if cols:
            print(f'\nTable {table} columns:', [c[1] for c in cols])
            try:
                cur.execute(f"SELECT id,title,cover_path,final_audio_path,status,processed_at FROM {table} ORDER BY processed_at DESC LIMIT 10")
                rows=cur.fetchall()
                for r in rows:
                    print('Row:', r)
            except Exception as e:
                print('Select fail', e)
    except Exception:
        pass
