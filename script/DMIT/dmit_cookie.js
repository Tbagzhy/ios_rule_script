// DMIT Cookie 提取器 — 登录 dmit.io 后弹窗显示 Cookie
if (typeof $request !== "undefined" && $request.headers) {
  const cookie = $request.headers.Cookie || $request.headers.cookie || "";
  if (cookie) {
    $notification.post("DMIT Cookie", "已捕获", "请在通知中长按复制，或查看 Surge 日志");
    console.log("DMIT_COOKIE:" + cookie);
  }
}
$done({});