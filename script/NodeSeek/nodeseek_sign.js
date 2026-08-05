/**
 * NodeSeek 签到 — Surge 通用版本 ($task.fetch)
 * Cookie 获取: 登录后访问个人信息页自动抓取
 * 签到: 每天 0:01 自动执行
 */

const KEY = "ns_headers";
const isRequest = typeof $request !== "undefined";

if (isRequest) {
  // === 获取阶段 ===
  const headers = $request.headers;
  const toSave = {
    Cookie: headers["Cookie"] || headers["cookie"] || "",
    "User-Agent": headers["User-Agent"] || headers["user-agent"] || "",
    "refract-sign": headers["refract-sign"] || "",
    "refract-key": headers["refract-key"] || "",
  };

  if (!toSave.Cookie) {
    $notification.post("NodeSeek Cookie获取失败", "", "未提取到Cookie");
  } else {
    $persistentStore.write(JSON.stringify(toSave), KEY);
    $notification.post("NodeSeek Cookie获取成功", "", "已保存");
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
    $notification.post("NodeSeek签到", "失败", "数据损坏，需重新获取Cookie");
    $done();
    return;
  }

  const myRequest = {
    url: "https://www.nodeseek.com/api/attendance?random=true",
    method: "POST",
    headers: {
      "Cookie": saved.Cookie || "",
      "User-Agent": saved["User-Agent"] || "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)",
      "refract-sign": saved["refract-sign"] || "",
      "refract-key": saved["refract-key"] || "",
      "Content-Type": "text/plain;charset=UTF-8",
      "Origin": "https://www.nodeseek.com",
      "Referer": "https://www.nodeseek.com/",
      "Accept": "*/*"
    },
    body: ""
  };

  $task.fetch(myRequest).then(
    (resp) => {
      const status = resp.statusCode;
      let msg = "";
      try { msg = JSON.parse(resp.body).message || ""; } catch (e) {}
      if (status >= 200 && status < 300) {
        $notification.post("NodeSeek签到", "签到成功", msg || "OK");
      } else {
        $notification.post("NodeSeek签到", "状态 " + status, msg || resp.body.substring(0, 200));
      }
      $done();
    },
    (reason) => {
      $notification.post("NodeSeek签到", "请求错误", String(reason && reason.error ? reason.error : reason));
      $done();
    }
  );
}
