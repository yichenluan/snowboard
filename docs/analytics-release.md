# 2026-10-16 访问统计接入与发布

本轮只增加访问统计，没有修改课程、个人数据存储或动作模型。功能提交 `5065836abb42ea95bb9457a01f7658d87c8b98e7` 的 [Actions 38871512685](https://github.com/yichenluan/snowboard/actions/runs/38871512685) build/deploy 成功；部署完成于 2026-10-16 16:07:48（Asia/Shanghai）。

## 实现

采用用户创建的 Umami Cloud 网站。主站、线上单文件副本及独立三维入口共用 `analytics.js` 和公开 `analytics-config.json`，不需要新增服务器、数据库或私钥。语义视图按公共课程/模块/路线 ID 归一，搜索和私人数据不参与页面标识；同页重绘不重复计浏览量。

`page_visible.seconds` 按可见时间发送新增秒数，切页、隐藏、关闭和每分钟结算。Umami 自带的访问时长仍保留其官方口径，不能将这两者混为阅读时长。来源只保留外部 origin 与五项 UTM；登录参数、原始 hash、搜索词及本机记录不发送。只在正式 HTTPS 子路径运行，DNT/GPC、本地与离线不加载统计。详见[使用与口径](analytics.md)。

## 实际验证

- 166/166 自动测试通过，含新增 9 项统计生命周期/边界检查和 1 项公共视图归一检查；类型检查、两项 Vite 构建、单文件生成、来源/两项清单/diff 检查通过。没有升级依赖。
- 当前官方 Cloud tracker 与本模块联合 VM 验证：实际执行官方脚本、截获全部 fetch，A 课 PV、A 课 6.5 秒事件、B 课 PV 共三请求，均有 `keepalive:true`；没有自动点击采集，OAuth、未知查询与 hash 未进入请求。本项使用合成 ID 且未实际向采集端发测试请求。
- Chrome 本地检查总览、模块/搜索、课程深链、独立三维可打开，统计脚本数为零，观察范围内无控制台错误。
- 正式站实际打开带 `utm_source=release-check&utm_medium=qa` 的首页，切到小回转课、术语页及独立三维，脚本网站 ID 正确，独立原型仍有画布，观察范围内无控制台错误。
- 已在用户 Umami 后台实际看到本次验证的访客、首页/课程/术语浏览量和 `page_visible` 事件；Properties → seconds 实见首页 16.582 秒、课程 17.506 秒、术语页分段 25.911/5.383 秒及三维入口 60.001 秒增量。这是一次端到端接收核验，不是业务流量增长。
- 主站、线上副本、原型 HTML/JS/CSS 五资源及无查询首页均返回 200，并与本地构建逐字节一致。主站/副本 2,517,073 bytes，SHA-256 `770f7d8cdf78e25b2eb30cedfe073425461b45ffc3654432980215d5b5e2a499`。

本地证据：`.validation/analytics/local-build.json`、`production-verification.json`、`real-tracker-verification.json` 与可复现 `real-tracker-check.mjs`；工程日志为 `log/analytics-*`，不公开提交。

## 边界

未测试实体手机、多地区网络、真实外部平台 referrer、跨设备人数或浏览器强制终止送达。可见时长不证明阅读或学习，拦截/断网会漏报；加载队列与关闭请求均为尽力发送。本轮没有新增动作教学核验，也没有用源码指纹更新自动授予旧画面通过；教学清单保留原有文字审读与历史观察，页面证据因受影响源码变化按规则失效。
