// 95598 $httpClient 诊断脚本 - 测试 Egern 的 $httpClient 模拟是否完整
(() => {
  const tests = [];
  let done = 0;

  function check(name, ok, msg) {
    tests.push({ name, ok, msg });
  }

  // Test 1: $httpClient exists
  check('$httpClient exists', typeof globalThis.$httpClient !== 'undefined',
    typeof globalThis.$httpClient);

  // Test 2: $httpClient.get exists
  check('$httpClient.get exists', typeof globalThis.$httpClient?.get === 'function',
    typeof globalThis.$httpClient?.get);

  // Test 3: $httpClient.post exists
  check('$httpClient.post exists', typeof globalThis.$httpClient?.post === 'function',
    typeof globalThis.$httpClient?.post);

  // Test 4: $httpClient GET request - check response
  globalThis.$httpClient?.get('https://httpbin.org/get', (error, response, body) => {
    check('$httpClient.get no error', !error, error ? String(error) : 'no error');
    check('$httpClient.get response.status', response && typeof response.status === 'number',
      response ? response.status : 'no response');
    check('$httpClient.get body is string', body && typeof body === 'string',
      typeof body + (body ? ' len=' + body.length : ''));
    check('$httpClient.get body has data', body && body.length > 0,
      body ? body.substring(0, 80) : 'empty');
    done++;
    if (done >= 2) printResults();
  });

  // Test 5: $httpClient POST request - check response
  globalThis.$httpClient?.post('https://httpbin.org/post', {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ test: 'ok' })
  }, (error, response, body) => {
    check('$httpClient.post no error', !error, error ? String(error) : 'no error');
    check('$httpClient.post response.status', response && typeof response.status === 'number',
      response ? response.status : 'no response');
    check('$httpClient.post body is string', body && typeof body === 'string',
      typeof body + (body ? ' len=' + body.length : ''));
    check('$httpClient.post body has data', body && body.length > 0,
      body ? body.substring(0, 80) : 'empty');
    done++;
    if (done >= 2) printResults();
  });

  function printResults() {
    const report = tests.map(t => (t.ok ? '✅' : '❌') + ' ' + t.name + ': ' + t.msg).join('\n');
    const allOk = tests.every(t => t.ok);
    console.log('=== $httpClient 诊断结果 ===');
    console.log(report);
    console.log('');
    console.log(allOk ? '✅ 所有测试通过，$httpClient 正常' : '❌ $httpClient 有问题');
    $done();
  }
})();
