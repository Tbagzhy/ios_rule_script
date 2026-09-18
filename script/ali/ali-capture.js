// 临时脚本：抓取阿里云盘 refresh_token（用完即删）
(function () {
  try {
    var body = ($response && $response.body) || "";
    body = String(body);
    var r = body.match(/"refresh_token"\s*:\s*"([^"]{8,})"/);
    if (r && r[1]) {
      $persistentStore.write(r[1], "ali_refresh_token");
      console.log("ALI_CAPTURED refresh_token len=" + r[1].length + " host=" + ($request && $request.headers && $request.headers.Host));
    }
    var a = body.match(/"access_token"\s*:\s*"([^"]{8,})"/);
    if (a && a[1]) {
      $persistentStore.write(a[1], "ali_access_token");
    }
  } catch (e) {
    console.log("ALI_CAPTURE_ERR " + e);
  }
  $done({});
})();
