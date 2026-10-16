# 网站访问统计

本站使用 [Umami Cloud](https://cloud.umami.is) 接收匿名访问统计，网站名称为“单板技术手册”，域名为 `jinke.me`。配置文件为 [`analytics-config.json`](../analytics-config.json)；其中 website ID 是公开站点标识，不是管理后台凭据。后台只有账号所有者可以访问，本站没有公开访客看板。

## 查看数据

登录 Umami Cloud 并打开网站，可按日期查看访客、浏览量、实时访问、来源、页面、设备及地域。免费 Hobby 档目前为每月 100,000 事件、1 个网站、6 个月数据留存；浏览量和自定义时长事件都会占用额度。定价核验于 2026-10-16，后续以[官方定价](https://umami.is/pricing)为准。

页面表内的 URL 是**统计用路径**，课程实际分享链接仍使用原有 `#lesson=`，不要直接把统计路径作为访问地址。

| 统计路径 | 含义 |
| --- | --- |
| `/snowboard/` | 首页与总览 |
| `/snowboard/lesson/<课程ID>` | 某门课程；同课经不同路线打开仍合并 |
| `/snowboard/module/<模块ID>` | 模块列表 |
| `/snowboard/routes`、`/snowboard/route/<路线ID>` | 全部路线、某条路线 |
| `/snowboard/glossary`、`/snowboard/sources` | 术语、资料 |
| `/snowboard/additions` | 个人补充栏目，只记栏目名 |
| `/snowboard/3d/` | 独立三维实验室；模式与进度变化不重复计浏览量 |

每次切换到不同页面记一次浏览量；刷新会重新计数。搜索输入、筛选、收藏、学习状态或同页重绘不重复计数。总览中的能力图、技术全景滚动定位归于首页。

## 停留与人数的口径

Umami 自带的 Visit duration 是访问层面的估计，不能当作每页阅读时长。官方定义为访问事件首末时间差；单页访问和最后一页存在遗漏，详见[指标定义](https://docs.umami.is/docs/metric-definitions)。

本站额外发送 `page_visible` 事件，`seconds` 为该页面**新增的可见秒数**。切换课程、页面隐藏、离开网页，以及每 60 秒结算一次；后台标签页时间不计入，重复隐藏/关闭不重复结算。在 Events 中筛选 `page_visible`，再用 URL 筛选课程，在 Properties 中查看 `seconds`。同页可能对应多个增量事件，不能把事件条数当成阅读人数，也不能把所有增量的简单平均当成平均页面停留。总可见时长为各 `seconds` 值乘对应次数后求和；除以同时间段同页面浏览量可得到每次浏览的平均可见时长估计。普通后台的 Visit duration 仍是 Umami 自身口径，没有被改名为阅读时长。

页面可见不代表人在阅读或学会动作；脚本加载慢、被拦截、断网、浏览器直接终止、最后一次尚未结算的时间都可能漏报。加载前最多暂存 32 个事件，15 秒未加载成功即停止本次统计；暂存事件集中发送也会影响 Umami 自带的访问时长，自定义 `seconds` 保留实际可见增量。发送使用 Umami 官方脚本的 keepalive 请求，关闭时尽力上报，不承诺全部送达。时长精度为毫秒。

“访客”采用 Umami 自身的匿名去重口径，是估计值，不是跨设备识别的自然人数。统计从接入后开始，不补历史访问。

## 来源与分享

外部来源仅保留 referrer 的 origin，不发送来源页路径或查询参数。浏览器/应用没有提供来源时会显示直接访问或未知，微信、复制链接等入口不能自动准确区分。

为不同渠道使用 UTM，例如：

```text
https://jinke.me/snowboard/?utm_source=wechat&utm_medium=social&utm_campaign=winter#lesson=s-short-integrated
```

只允许 `utm_source`、`utm_medium`、`utm_campaign`、`utm_content`、`utm_term` 进入统计；不要在 UTM 中填写姓名、邮箱、手机号或个人内容。其他查询参数和原始 hash 不上传，尤其不上传评论登录的 `utterances` 参数。

## 隐私与维护

- 不调用身份识别接口，不发送 GitHub 登录会话、搜索词、个人补充、收藏或学习记录，不启用录屏、热图或输入采集。
- 浏览器开启 Do Not Track 或 Global Privacy Control 时不加载统计脚本。
- 只在 `https://jinke.me/snowboard/` 下的正式入口运行；本地 HTTP、`file:`、其他域名和博客根路径不运行。线上 `snowboard-guide.html` 归并到主站统计。
- 统计脚本按需异步加载，上报失败不影响阅读和三维。没有配置 website ID 时完全禁用；删除 ID 后按正常流程构建发布即可关闭。
- `build.py` 内联主站代码；Vite 在独立原型 HTML 注入同一配置与模块。不要直接修改生成的 HTML。

实现依据：[跟踪配置](https://docs.umami.is/docs/tracker-configuration)、[跟踪函数](https://docs.umami.is/docs/tracker-functions)、[事件属性](https://docs.umami.is/docs/event-data)。
