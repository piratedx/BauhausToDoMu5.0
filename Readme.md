# 🏛️ Bauhaus To-Do v4.9

A clean, fast, local-first daily planning tool inspired by Bauhaus design principles. Built with vanilla JavaScript, HTML, and CSS. Your data lives in a JSON file you own.

---

## ✨ Features

### 📋 Task Management
- **Three sections:** HOME, WORK, TEAM
- **Rich task details:** Title, description, tags, categories, deadlines
- **Quick actions:** Complete, edit, delete, snooze to tomorrow
- **Priority flags:** Mark important tasks
- **Drag & drop:** Reorder tasks and sections

### 📝 Smart Notes
- **Rich text editor:** Bold, italic, bullets, links, colors
- **Persistent notes:** Same notes across all days
- **Ctrl/Cmd+K:** Quick link insertion
- **Ctrl/Cmd+Click:** Open links while editing

### 👥 Team Management
- **Assign to team members:** Track who does what
- **Deadlines with alerts:** Visual 🔥 indicator
- **Filter by member:** Focus on specific assignments

### 🗓️ Views
- **Day View:** Your primary workspace
- **Week View:** See the week ahead
- **Month View:** Monthly overview with stats

### 💾 Data Sync (Stage 2)
- **Auto-load on startup:** Finds `bauhaus-data.json` automatically
- **Folder picker with memory:** Choose save location once
- **Ctrl/Cmd+S:** Quick-save to remembered folder
- **localStorage backup:** Dual storage for safety
- **Cloud sync ready:** Works with Dropbox/Drive/iCloud

---

## 🚀 Quick Start

### 1. Download Files
Get these three files:
- `index.html`
- `app.js`
- `app.css`

### 2. Choose Your Setup

**Option A: Local Use**
1. Put files in any folder
2. Open `index.html` in your browser
3. Start adding tasks!

**Option B: Cloud Sync (Recommended)**
1. Create folder: `~/Dropbox/bauhaus/` (or Drive/iCloud)
2. Put the three files there
3. Open `index.html` from that folder
4. Click "📁 Save Location" → pick same folder
5. Press Ctrl/Cmd+S to save
6. Now syncs across all devices! ✨

### 3. Start Working
- Add tasks with Enter key
- Complete with checkboxes
- Edit by clicking tasks
- Save with Ctrl/Cmd+S
- Close browser - your data persists!

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Ctrl/Cmd+S** | Save to JSON |
| **Ctrl/Cmd+Z** | Undo last change |
| **Ctrl/Cmd+K** | Create link (in editors) |
| **Enter** | Add task (in input fields) |

---

## 💾 How Data Works

### Storage System (Hybrid)
1. **JSON File:** `bauhaus-data.json` (your primary data)
2. **localStorage:** Automatic backup in browser
3. **On startup:** Loads from JSON if found, else localStorage
4. **On changes:** Saves to both instantly

### Save Location Memory
1. First save: Browser asks where to save
2. You pick a folder (e.g., Dropbox)
3. Every save after: Goes to same folder automatically
4. Change location: Click "📁 Save Location" button

### Multi-Device Sync
```
Computer A:
- Work, save (Ctrl+S)
- Dropbox syncs bauhaus-data.json

Computer B:
- Open app from Dropbox folder
- Auto-loads bauhaus-data.json
- All changes from Computer A are here!
- Continue working, save
- Dropbox syncs back

Perfect handoff! 🎉
```

---

## 📂 File Structure

```
your-folder/
├── index.html           # Main app
├── app.js              # Application logic
├── app.css             # Styling
└── bauhaus-data.json   # Your data (created on first save)
```

---

## 🎯 Key Workflows

### Daily Planning
1. Open app (auto-loads your data)
2. Add today's tasks to HOME/WORK/TEAM
3. Work through your day, save with Ctrl/Cmd+S

### Team Coordination
1. Add task to TEAM section
2. Assign to team member(s), set deadline
3. Filter by member using tabs

---

## 🌐 Browser Support

**✅ Full Features:** Chrome 86+, Edge 86+, Opera 72+
**⚠️ Limited:** Firefox, Safari (files download to Downloads folder)

All browsers support localStorage backup!

---

## 🔧 Settings & Customization

- **Team Members:** Click ⋯ in TEAM section → Add/remove/reorder
- **Work Categories:** Click ⋯ in WORK section → Add/remove/reorder
- **Section Order:** Drag section headers with ⋮⋮ handle
- **Save Location:** Click "📁 Save Location" button

---

## 🗑️ Recently Deleted

Deleted tasks stored for 30 days. Click "🗑️ Recently Deleted" to view/restore.

---

## 🆘 Troubleshooting

**App won't load data:** Check `bauhaus-data.json` exists in same folder
**Save button missing:** Make a change to trigger it
**Folder picker not working:** Upgrade to Chrome/Edge 86+
**Data not syncing:** Ensure files in cloud folder, verify cloud service running
**Lost data:** Check localStorage or cloud version history (30 days)

---

## 📊 What's New in v4.9

- ✅ Auto-load from `bauhaus-data.json` on startup
- ✅ Folder picker with location memory
- ✅ Visual status indicator (saved/unsaved)
- ✅ Ctrl/Cmd+S quick-save keyboard shortcut
- ✅ Fixed filename (no timestamps) for reliable auto-load
- ✅ "📁 Save Location" button to change folder
- ✅ Dual storage (JSON + localStorage) for safety
- ✅ Browser compatibility fallbacks

---

## 🎓 Philosophy

**Local-First:** Your data lives in a file you own. No accounts, no servers, no tracking.

**Simple:** Just HTML, CSS, and JavaScript. No frameworks, no build tools, no dependencies.

**Portable:** Copy three files and your JSON anywhere. It just works.

**Yours:** Inspect the data, version control it, back it up however you want.

---

## 📚 Documentation

- **QUICKSTART.md:** 60-second setup guide
- **STAGE2-GUIDE.md:** Migration and troubleshooting
- **FOLDER-PICKER-GUIDE.md:** How folder saving works
- **FUTURE-STAGES-ROADMAP.md:** What comes next

---

## 🤝 Contributing

This is a personal productivity tool, but ideas are welcome! 

Found a bug? Check browser console and report what you see.

Want a feature? Describe your use case in detail.

---

## 📄 License

Use freely for personal or commercial use. Attribution appreciated but not required.

---

## 🎉 Get Started

1. Download the three files
2. Put them in a cloud folder (optional but recommended)
3. Open `index.html`
4. Click "📁 Save Location" and pick the same folder
5. Start planning your day!

**You're ready!** Press Ctrl/Cmd+S to save as you work. Your data syncs across devices automatically if you're using a cloud folder.

Happy planning! 🚀

---

*Built with ❤️ and Bauhaus principles*