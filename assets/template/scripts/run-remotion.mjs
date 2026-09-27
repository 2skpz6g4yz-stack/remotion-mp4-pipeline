/**
 * 在工程内运行 Remotion CLI：把临时目录固定到 <工程>/.tmp,
 * 免得无头 Chrome 的配置目录散落到系统 %TEMP%（每个 10-100MB）。
 *
 *   node scripts/run-remotion.mjs render DeepSeekEpic out/video.mp4
 *   node scripts/run-remotion.mjs studio
 *
 * 运行前后各清空一次 .tmp（里面全是临时产物）, 渲染结束不留残留。
 * 正在被占用的目录删不掉（Windows 会拒绝）, 留到下次运行开头再清。
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TMP = path.join(ROOT, ".tmp");
const CLI = path.join(ROOT, "node_modules", "@remotion", "cli", "remotion-cli.js");
const MB = 1024 * 1024;

const sizeOf = (target) => {
  const stat = fs.statSync(target);
  if (!stat.isDirectory()) return stat.size;
  return fs.readdirSync(target).reduce((sum, name) => sum + sizeOf(path.join(target, name)), 0);
};

const cleanTmp = () => {
  let count = 0;
  let bytes = 0;
  for (const name of fs.readdirSync(TMP)) {
    const full = path.join(TMP, name);
    try {
      bytes += sizeOf(full);
      fs.rmSync(full, { recursive: true, force: true });
      count++;
    } catch {}
  }
  return { count, bytes };
};

fs.mkdirSync(TMP, { recursive: true });

const before = cleanTmp();
if (before.count > 0) {
  console.log(`[run-remotion] 清掉上次残留 ${before.count} 项 / ${(before.bytes / MB).toFixed(0)} MB`);
}

console.log(`[run-remotion] TEMP -> ${TMP}`);

const child = spawn(process.execPath, [CLI, ...process.argv.slice(2)], {
  stdio: "inherit",
  env: { ...process.env, TEMP: TMP, TMP: TMP, TMPDIR: TMP },
});

child.on("exit", (code, signal) => {
  // Chrome 关得比子进程慢, 等它把临时目录写完再清, 否则会漏一个。
  setTimeout(() => {
    const after = cleanTmp();
    if (after.count > 0) {
      console.log(`[run-remotion] 清空 .tmp: ${after.count} 项 / ${(after.bytes / MB).toFixed(0)} MB`);
    }
    process.exit(signal ? 1 : code ?? 1);
  }, 1500);
});