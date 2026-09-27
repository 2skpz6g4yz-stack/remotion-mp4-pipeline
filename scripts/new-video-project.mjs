/**
 * 从 assets/template 复制出一个新的 Remotion 视频工程。
 *
 *   node scripts/new-video-project.mjs <目标目录> [--name my-video] [--install]
 *
 * 复制时会跳过 node_modules / .tmp / out 和已生成的画面板、贴图、配乐,
 * 让新工程从"干净模板"开始。--install 会顺手跑 npm install。
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE = path.resolve(HERE, "..", "assets", "template");

const SKIP_DIRS = new Set(["node_modules", ".tmp", "out", ".raw", ".git"]);
const SKIP_FILES = [/\.wav$/i, /^grain\.png$/i, /^paper\.jpg$/i];

const args = process.argv.slice(2);
let target = null;
let name = null;
let install = false;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--name") {
    name = args[++i] ?? null;
    continue;
  }
  if (args[i] === "--install") {
    install = true;
    continue;
  }
  if (!target) {
    target = args[i];
    continue;
  }
  console.error(`多余的参数: ${args[i]}`);
  process.exit(2);
}

if (!target) {
  console.error("用法: node scripts/new-video-project.mjs <目标目录> [--name my-video] [--install]");
  process.exit(2);
}

const dest = path.resolve(target);
if (fs.existsSync(dest) && fs.readdirSync(dest).length > 0) {
  console.error(`目标目录非空, 先清空或换个路径: ${dest}`);
  process.exit(1);
}

const projectName = name ?? path.basename(dest);


let copied = 0;
const copy = (from, to) => {
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      if (entry.name === "art" && path.basename(from) === "public") {
        fs.mkdirSync(path.join(to, entry.name), { recursive: true });
        continue;
      }
      fs.mkdirSync(path.join(to, entry.name), { recursive: true });
      copy(path.join(from, entry.name), path.join(to, entry.name));
      continue;
    }
    if (SKIP_FILES.some((re) => re.test(entry.name))) continue;
    fs.copyFileSync(path.join(from, entry.name), path.join(to, entry.name));
    copied++;
  }
};

fs.mkdirSync(dest, { recursive: true });
copy(TEMPLATE, dest);

const pkgPath = path.join(dest, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
pkg.name = projectName;
pkg.description = `${projectName} —— Remotion 视频工程`;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

for (const dir of ["public/art", "public/tex", "public/audio", "out"]) {
  fs.mkdirSync(path.join(dest, dir), { recursive: true });
}

console.log(`已生成 ${dest}（${copied} 个文件）`);

if (install) {
  console.log("npm install ...");
  const r = spawnSync("npm", ["install", "--no-audit", "--no-fund"], { cwd: dest, stdio: "inherit", shell: true });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

console.log(`
接下来:
  cd ${dest}
  npm install                       # 没加 --install 的话
  python tools/make-placeholder-art.py   # 先用占位画面板跑通
  python tools/make-tex.py
  node scripts/make-audio.mjs
  npm run dev                       # 预览
  npm run render -- Film out/video.mp4
`);