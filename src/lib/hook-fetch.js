// src/main.js（入口文件，确保在所有 fetch 调用前执行）
const originalFetch = window.fetch;

// 读取 Vite 注入的前缀（优先读取 VITE_ 环境变量，其次读取全局注入的 FETCH_BASE_PREFIX）
// 这里兼容步骤 1 的两种定义方式，可根据实际使用的方式选择其中一种
const VITE_BASE = import.meta.env.VITE_BASE

// 重写全局 fetch 函数
window.fetch = function (input, init) {
  // 1. 解析请求 URL（兼容字符串和 Request 对象）
  let requestUrl;
  let isRequestObject = false;
  if (typeof input === 'string') {
    requestUrl = input;
  } else if (input instanceof Request) {
    requestUrl = input.url;
    isRequestObject = true;
  } else {
    return originalFetch(input, init);
  }

  // 2. 判断是否需要添加前缀（仅根路径请求：以 "/" 开头，且非跨域路径 "//xxx"）
  const shouldAddPrefix = 
    VITE_BASE && // 确保前缀存在（避免未配置时出错）
    requestUrl.startsWith('/') && 
    !requestUrl.startsWith('//');

  if (shouldAddPrefix) {
    // 拼接 Vite 注入的前缀
    const prefixedUrl = `${VITE_BASE}${requestUrl}`;

    // 3. 更新 input（保留原请求配置）
    if (typeof input === 'string') {
      input = prefixedUrl;
    } else if (isRequestObject) {
      input = new Request(prefixedUrl, {
        method: input.method,
        headers: input.headers,
        body: input.body,
        mode: input.mode,
        credentials: input.credentials,
        cache: input.cache,
        redirect: input.redirect,
        referrer: input.referrer,
        integrity: input.integrity,
      });
    }
  }

  // 4. 调用原生 fetch 发送请求
  return originalFetch(input, init);
};