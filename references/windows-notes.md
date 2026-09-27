# Windows 与运行环境备注

## Python：用 `py`，不要用 `python`

部分 Windows 机器上的 `python` 是微软应用商店的空壳桩（跑起来直接退出码 9009，什么都不做）。
判断办法：`python --version` 没输出或报 9009，就一律改用 `py`。

## 复用系统 Chrome，别让 Remotion 重复下载

已装 Chrome 的机器设环境变量即可省掉下载 Headless Shell：

```powershell
$env:REMOTION_BROWSER = "C:\Program Files\Google\Chrome\Application\chrome.exe"
```

`remotion.config.ts` 会读它。不设则交给 Remotion 自己找/下载。

## 临时目录必须收进工程内（重要）

Remotion 每次渲染都会让无头 Chrome 在系统临时目录里建一个配置目录（10–100MB）。
反复渲染会在 `%TEMP%` 里攒下上百个目录、几个 GB，且渲染结束不会自己消失 ——
Windows 上文件被占用时还删不掉，只能事后人工清。

所以渲染一律走 `scripts/run-remotion.mjs`：它把 `TEMP/TMP/TMPDIR` 指向工程内 `.tmp/`，
运行前后各清空一次，并在退出后延迟 1.5 秒再清一次（Chrome 关得比子进程慢，不等它会漏一个）。
`npm run render` / `dev` / `still` 已经接到它上面。

## 代理：先确认代理端口真的在监听

若环境里设了 `HTTP_PROXY` / `HTTPS_PROXY` / `ALL_PROXY` 指向本机某个端口（如 `127.0.0.1:15721`），
而那个端口没有服务在监听，`npm install`、下载等网络操作会**静默挂住**（没有报错，就是不动）。
排查与临时绕过：

```powershell
$env:HTTP_PROXY=''; $env:HTTPS_PROXY=''; $env:ALL_PROXY=''
npm install
```

## 路径与编码

- 工程路径可以是中文和空格，Remotion 能处理；但命令行里带空格要加引号。
- npm 脚本里用 `python` 保持跨平台；这台机器上手动跑时记得换成 `py`。