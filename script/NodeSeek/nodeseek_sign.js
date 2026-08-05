/**
 * NodeSeek 签到 — Surge 版本
 * 转换自 Nullwhy/Egern v1.1.2 (@Curtinp118)
 * Cookie: http-request 拦截 getInfo 自动保存
 * 签到: cron 定时 POST /api/attendance
 * 默认随机鸡腿 (random=true)，改固定: 把下面 FIXED_LEGS 改 "true"
 */

const SCRIPT_NAME = "NodeSeek🎉";
const STORE_KEY = "nodeseek_headers";
const ATTEND_BASE = "https://www.nodeseek.com/api/attendance";
const FIXED_LEGS = "false"; // "true"=固定5鸡腿, "false"=随机

const DEFAULT_HEADERS = {
  "Connection": "keep-alive",
  "Accept-Encoding": "gzip, deflate, br",
  "Priority": "u=3, i",
  "Content-Type": "text/plain;charset=UTF-8",
  "Origin": "https://www.nodeseek.com",
  "refract-sign": "",
  "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15",
  "refract-key": "",
  "Sec-Fetch-Mode": "cors",
  "Cookie": "",
  "Host": "www.nodeseek.com",
  "Referer": "https://www.nodeseek.com/",
  "Accept-Language": "zh-CN,zh-Hans;q=0.9",
  "Accept": "*/*"
};

const HEADER_KEYS = Object.keys(DEFAULT_HEADERS);

function headerVal(src, k) {
  return src[k] || (src[k.toLowerCase()] || src[k.toUpperCase()]) || "";
}

function pickHeaders(src) {
  const out = {};
  for (const k of HEADER_KEYS) {
    const v = headerVal(src, k);
    if (v) out[k] = v;
  }
  return out;
}

function buildHeaders(saved) {
  const h = {};
  for (const k of HEADER_KEYS) {
    h[k] = (saved && saved[k]) || DEFAULT_HEADERS[k];
  }
  return h;
}

// === http-request 阶段：捕获 Cookie ===
if (typeof $request !== "undefined") {
  const saved = pickHeaders($request.headers || {});
  if (!saved.Cookie) {
    $notification.post(SCRIPT_NAME, "Cookie获取失败", "未提取到Cookie，请重新访问个人页面");
  } else {
    $persistentStore.write(JSON.stringify(saved), STORE_KEY);
    $notification.post(SCRIPT_NAME, "Cookie获取成功 ✓", "已保存，签到将在定时任务自动运行");
  }
  $done({});
}

// === cron 阶段：签到 ===
else {
  const raw = $persistentStore.read(STORE_KEY);
  if (!raw) {
    $notification.post(SCRIPT_NAME, "签到失败", "请先打开NodeSeek个人页面获取Cookie");
    $done();
  } else {
    let saved;
    try { saved = JSON.parse(raw); } catch (e) {
      $notification.post(SCRIPT_NAME, "签到失败", "存储数据损坏，请重新获取Cookie");
      $done();
      return;
    }

    const url = ATTEND_BASE + "?random=" + (FIXED_LEGS === "true" ? "false" : "true");
    const req = {
      url: url,
      method: "POST",
      headers: buildHeaders(saved),
      body: ""
    };

    $task.fetch(req).then(
      (resp) => {
        const s = resp.statusCode;
        let msg = "";
        try { msg = JSON.parse(resp.body || "{}").message || ""; } catch (e) {}

        const tag = FIXED_LEGS === "true" ? "固定" : "随机";
        if (s === 403) $notification.post(SCRIPT_NAME, "被风控(403)", "稍后重试");
        else if (s === 500) $notification.post(SCRIPT_NAME, "服务器错误(500)", "");
        else if (s >= 200 && s < 300) $notification.post(SCRIPT_NAME, "签到成功(" + tag + ")", msg || "签到完成");
        else $notification.post(SCRIPT_NAME, "请求异常 HTTP " + s, msg || "");
        $done();
      },
      (err) => {
        $notification.post(SCRIPT_NAME, "网络错误", String(err && err.error ? err.error : err || ""));
        $done();
      }
    );
  }
}
