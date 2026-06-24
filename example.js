const { ImageGeneratorClient } = require('./index.js');

// 初始化客户端
const client = new ImageGeneratorClient({
  apiKey: 'YOUR_API_KEY', // 请替换为您的真实 API Key
  baseUrl: 'YOUR_BASE_URL' // 请替换为您的真实 API 基础地址
});

// 用于图生图测试的 1x1 像素透明 PNG base64 数据
const testBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

async function runDemo() {
  console.log('=== 开始执行图像生成客户端功能演示 ===\n');

  // ==========================================
  // 1. gpt-image-2 模型演示
  // ==========================================
  console.log('--- 测试 模型: gpt-image-2 ---');
  try {
    // A. 文生图 (要求返回 URL)
    console.log('[gpt-image-2] 正在调用文生图...');
    const gptTxt2ImgUrl = await client.textToImage('gpt-image-2', 'A futuristic cybercity at night, digital art', {
      responseFormat: 'url'
    });
    console.log(`[gpt-image-2] 文生图成功！图片URL: \n${gptTxt2ImgUrl}\n`);

    // B. 图生图 (要求返回 Base64 数据)
    console.log('[gpt-image-2] 正在调用图生图...');
    const gptImg2ImgBase64 = await client.imageToImage('gpt-image-2', testBase64, 'Add a huge red moon in the sky', {
      responseFormat: 'b64_json'
    });
    console.log(`[gpt-image-2] 图生图成功！返回 Base64 长度: ${gptImg2ImgBase64.length}`);
    console.log(`Base64 预览: data:image/png;base64,${gptImg2ImgBase64.substring(0, 60)}...\n`);
  } catch (error) {
    console.error('[gpt-image-2] 发生错误:', error.message);
  }

  console.log('--------------------------------------------------\n');

  // ==========================================
  // 2. gemini-3.1-flash-image 模型演示
  // ==========================================
  console.log('--- 测试 模型: gemini-3.1-flash-image ---');
  try {
    // A. 文生图 (要求返回 URL)
    console.log('[gemini-3.1-flash-image] 正在调用文生图...');
    const geminiTxt2ImgUrl = await client.textToImage('gemini-3.1-flash-image', 'A cute anime cat wearing headphones', {
      responseFormat: 'url'
    });
    console.log(`[gemini-3.1-flash-image] 文生图成功！图片URL (包含 Base64 编码): \n${geminiTxt2ImgUrl.substring(0, 100)}...\n`);

    // B. 图生图 (要求返回 Base64 数据)
    console.log('[gemini-3.1-flash-image] 正在调用图生图...');
    const geminiImg2ImgBase64 = await client.imageToImage('gemini-3.1-flash-image', testBase64, 'Make it a winter landscape', {
      responseFormat: 'b64_json'
    });
    console.log(`[gemini-3.1-flash-image] 图生图成功！返回 Base64 长度: ${geminiImg2ImgBase64.length}`);
    console.log(`Base64 预览: data:image/png;base64,${geminiImg2ImgBase64.substring(0, 60)}...\n`);
  } catch (error) {
    console.error('[gemini-3.1-flash-image] 发生错误:', error.message);
  }

  console.log('=== 演示执行完毕 ===');
}

runDemo();
