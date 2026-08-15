/* Surge subscription traffic panel — Minis build */
const args = parseArgs(typeof $argument === "string" ? $argument : "");
const title = args.name || "机场流量";
const icon = args.icon || "externaldrive.fill.badge.icloud";
const color = args.color || "#5AC8FA";
const timeoutMessage = "请检查订阅地址、URL 编码及机场响应头";

(async () => {
  try {
    if (!args.url) throw new Error("未填写订阅 URL");
    const header = await fetchUserInfo(args.url, args.method || "auto");
    const info = parseUserInfo(header);
    if (info.total == null) throw new Error("响应头缺少 total");

    const used = (info.upload || 0) + (info.download || 0);
    const remain = Math.max(0, info.total - used);
    const percent = info.total > 0 ? Math.min(100, used / info.total * 100) : 0;
    const lines = [
      `剩余：${formatBytes(remain)}  |  ${Math.max(0, 100 - percent).toFixed(1)}%`,
      `已用：${formatBytes(used)}  |  总量：${formatBytes(info.total)}`
    ];

    const resetDay = Number(args.reset_day || args.reset || 0);
    if (resetDay >= 1 && resetDay <= 31) lines.push(`重置：${daysUntilReset(resetDay)} 天后`);

    const expire = args.expire || info.expire;
    if (expire && String(expire).toLowerCase() !== "false" && Number(expire) !== 0) {
      lines.push(`到期：${formatExpire(expire)}`);
    }

    $done({
      title: `${title}  ${clock()}`,
      content: lines.join("\n"),
      icon,
      "icon-color": color
    });
  } catch (e) {
    console.log(`[SubInfo] ${String(e)}`);
    $done({
      title: `${title}  查询失败`,
      content: `${String(e.message || e)}\n${timeoutMessage}`,
      icon: "exclamationmark.triangle.fill",
      "icon-color": "#FF3B30"
    });
  }
})();

function parseArgs(raw) {
  const out = {};
  for (const part of raw.split("&")) {
    if (!part) continue;
    const i = part.indexOf("=");
    const key = i < 0 ? part : part.slice(0, i);
    const value = i < 0 ? "" : part.slice(i + 1);
    try { out[decodeURIComponent(key)] = decodeURIComponent(value.replace(/\+/g, "%20")); }
    catch (_) { out[key] = value; }
  }
  return out;
}

function request(method, url) {
  return new Promise((resolve, reject) => {
    const req = { url, headers: { "User-Agent": args.ua || "Surge/5" } };
    $httpClient[method](req, (err, resp, body) => {
      if (err) return reject(new Error(`网络错误：${err}`));
      const status = Number(resp && (resp.status || resp.statusCode) || 0);
      if (status < 200 || status >= 400) return reject(new Error(`HTTP ${status || "未知"}`));
      const headers = (resp && resp.headers) || {};
      const key = Object.keys(headers).find(k => k.toLowerCase() === "subscription-userinfo");
      if (!key || !headers[key]) return reject(new Error(`${method.toUpperCase()} 响应无 subscription-userinfo`));
      resolve(String(headers[key]));
    });
  });
}

async function fetchUserInfo(url, method) {
  method = String(method).toLowerCase();
  if (method === "get") return request("get", url);
  if (method === "head") return request("head", url);
  try { return await request("head", url); }
  catch (headError) {
    console.log(`[SubInfo] HEAD failed: ${headError.message}; fallback GET`);
    return request("get", url);
  }
}

function parseUserInfo(raw) {
  const out = {};
  const re = /(?:^|[;\s])([a-zA-Z_]+)\s*=\s*([^;\s]+)/g;
  let m;
  while ((m = re.exec(raw))) {
    const key = m[1].toLowerCase();
    const value = m[2];
    out[key] = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value) ? Number(value) : value;
  }
  return out;
}

function formatBytes(value) {
  value = Number(value) || 0;
  if (value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(value) / Math.log(1024)));
  return `${(value / Math.pow(1024, i)).toFixed(i >= 3 ? 2 : 1)} ${units[i]}`;
}

function formatExpire(value) {
  let date;
  if (/^\d+(?:\.\d+)?$/.test(String(value))) {
    let ts = Number(value);
    if (ts < 1e12) ts *= 1000;
    date = new Date(ts);
  } else date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function daysUntilReset(day) {
  const now = new Date();
  let target = new Date(now.getFullYear(), now.getMonth(), Math.min(day, daysInMonth(now.getFullYear(), now.getMonth())));
  target.setHours(0, 0, 0, 0);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (target < today) {
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    target = new Date(next.getFullYear(), next.getMonth(), Math.min(day, daysInMonth(next.getFullYear(), next.getMonth())));
  }
  return Math.ceil((target - today) / 86400000);
}

function daysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }
function clock() { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; }
function pad(n) { return String(n).padStart(2, "0"); }
