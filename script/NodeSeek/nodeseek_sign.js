/**
 * NodeSeek 签到 — Surge 原生版本
 * Cookie 获取: 登录后访问个人信息页自动抓取
 * 签到: 每天 0:01 自动执行
 */

const KEY = "ns_headers";
const isRequest = typeof $request !== "undefined";

if (isRequest) {
  // === 获取阶段 ===
  const headers = $request.headers;
  const toSave = {
    "Cookie": headers["Cookie"] || headers["cookie"] || "",
    "User-Agent": headers["User-Agent"] || headers["user-agent"] || "",
    "refract-sign": headers["refract-sign"] || "",
    "refract-key": headers["refract-key"] || "",
  };

  if (!toSave["Cookie"]) {
    $notification.post("NodeSeek Cookie获取失败", "", "未提取到Cookie，请重新访问个人信息页");
  } else {
    $persistentStore.write(JSON.stringify(toSave), KEY);
    $notification.post("NodeSeek Cookie获取成功", "", "已保存，明天0:01自动签到");
  }
  $done({});
} else {
  // === 签到阶段 ===
  const raw = $persistentStore.read(KEY);
  if (!raw) {
    $notification.post("NodeSeek签到", "失败", "未获取Cookie，请先访问NodeSeek个人信息页");
    $done();
    return;
  }

  let saved;
  try { saved = JSON.parse(raw); } catch (e) {
    $notification.post("NodeSeek签到", "失败", "存储数据损坏，请重新获取Cookie");
    $done();
    return;
  }

  $httpClient.post("https://www.nodeseek.com/api/attendance?random=true", {
    headers: {
      "Cookie": saved["Cookie"] || "",
      "User-Agent": saved["User-Agent"] || "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15",
      "refract-sign": saved["refract-sign"] || "",
      "refract-key": saved["refract-key"] || "",
      "Content-Type": "text/plain;charset=UTF-8",
      "Origin": "https://www.nodeseek.com",
      "Referer": "https://www.nodeseek.com/",
      "Accept": "*/*"
    },
    body: ""
  }, (error, response, body) => {
    if (error) {
      $notification.post("NodeSeek签到", "网络错误", String(error));
    } else {
      let msg = "";
      try { msg = JSON.parse(body).message || ""; } catch (e) {}
      $notification.post("NodeSeek签到", response.status === 200 ? "签到成功" : `状态 ${response.status}`, msg || body.substring(0, 200));
    }
    $done();
  });
}
