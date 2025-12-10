import { ipcMain, dialog, app, BrowserWindow } from "electron";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
ipcMain.handle("select-directory", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ["openDirectory", "createDirectory"]
  });
  if (canceled || filePaths.length === 0) {
    return null;
  }
  return filePaths[0];
});
ipcMain.handle("create-project", async (_event, payload) => {
  var _a, _b;
  const name = (_a = payload == null ? void 0 : payload.name) == null ? void 0 : _a.trim();
  const location = (_b = payload == null ? void 0 : payload.location) == null ? void 0 : _b.trim();
  if (!name || !location) {
    throw new Error("name and location are required");
  }
  const projectDir = path.join(location, name);
  await fs.mkdir(projectDir, { recursive: true });
  const novelPath = path.join(projectDir, "novel.json");
  const data = {
    name,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    chapters: []
  };
  await fs.writeFile(novelPath, JSON.stringify(data, null, 2), "utf-8");
  return { projectPath: projectDir };
});
ipcMain.handle("get-project-cover", async (_event, projectPath) => {
  if (!projectPath) return null;
  const candidates = ["cover.png", "cover.jpg", "cover.jpeg"];
  for (const file of candidates) {
    const fullPath = path.join(projectPath, file);
    try {
      const content = await fs.readFile(fullPath);
      const ext = path.extname(fullPath).toLowerCase() === ".png" ? "png" : "jpeg";
      const base64 = content.toString("base64");
      return `data:image/${ext};base64,${base64}`;
    } catch {
    }
  }
  return null;
});
function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname$1, "preload.mjs")
    }
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(createWindow);
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
