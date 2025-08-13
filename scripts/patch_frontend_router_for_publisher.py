from pathlib import Path

# Try common app entry filenames
candidates = [Path("frontend/src/App.jsx"), Path("frontend/src/App.tsx")]
app = next((p for p in candidates if p.exists()), None)

if not app:
    print("SKIP: Could not find frontend/src/App.jsx or App.tsx. Add the route manually.")
    raise SystemExit(0)

text = app.read_text(encoding="utf-8")

# Add imports if missing (use relative, not alias)
import_tool = 'import PodcastPublisherTool from "./components/dashboard/PodcastPublisherTool";'
import_guard = 'import ProtectedRoute from "./components/common/ProtectedRoute";'

changed = False
if import_tool not in text:
    text = import_tool + "\n" + text
    changed = True
if import_guard not in text:
    text = import_guard + "\n" + text
    changed = True

# Insert route line inside a <Routes>...</Routes> block
route_line = '          <Route path="/_publish" element={<ProtectedRoute><PodcastPublisherTool /></ProtectedRoute>} />'
if route_line in text:
    # Already present
    pass
else:
    # Naive insert: after first occurrence of "<Routes>"
    idx = text.find("<Routes>")
    if idx != -1:
        insert_at = idx + len("<Routes>")
        text = text[:insert_at] + "\n" + route_line + text[insert_at:]
        changed = True
    else:
        print("SKIP: Could not find a <Routes> block. Add the route manually:")
        print(route_line)

if changed:
    app.write_text(text, encoding="utf-8")
    print(f"Patched {app}")
else:
    print("No changes needed.")
