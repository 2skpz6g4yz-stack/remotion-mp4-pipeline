import { Config } from "@remotion/cli/config";

// 本机已装 Chrome 时, 设 REMOTION_BROWSER 指向它, 省掉下载 Headless Shell。
//   例: $env:REMOTION_BROWSER = "C:\Program Files\Google\Chrome\Application\chrome.exe"
// 不设就交给 Remotion 自己找/下载。
const browser = process.env.REMOTION_BROWSER;
if (browser) {
  Config.setBrowserExecutable(browser);
}

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setOverwriteOutput(true);
Config.setChromiumOpenGlRenderer("angle");