# NanoPicasso - 双模型图像生成跨平台 SDK 客户端

一个轻量、健壮且零依赖的图像生成 (文生图/图生图) 跨平台客户端 SDK，专门适配并优化了 `gpt-image-2` 与 `gemini-3.1-flash-image` 两个图像模型。

该 SDK 专为**浏览器插件 (Chrome/Edge Extension)** 和 **Node.js** 混合环境设计，采用原生 `fetch`、`Blob` 和 `FormData` 实现，避开了 Node.js 特有全局变量（如 `Buffer`、`fs`），完美做到开箱即用。

---

## 🚀 特性

- **多模型适配**：平滑封装 `gpt-image-2` (OpenAI 兼容图像接口) 与 `gemini-3.1-flash-image` (多模态对话接口) 的底层协议差异。
- **文生图 & 图生图全支持**：统一且简易的公开接口，图生图模式支持本地 Base64 图像与公网图片 URL 传入。
- **自动格式转换容错层**：内置数据转换适配器，不管服务端支持哪种响应类型（Base64 或 HTTP URL），SDK 均能按您的配置（`url` 或 `b64_json`）自动完成内部转换，避免 `undefined` 异常。
- **双语支持**：同时提供现代 TypeScript 源文件和编译好的单文件原生 JavaScript 脚本。

---

## 📦 项目文件说明

- `index.ts`：TypeScript 客户端模块，拥有完善的类型推导，适合带构建流的 TS 项目。
- `index.js`：原生 JavaScript 客户端模块，同时支持 CommonJS (Node.js)、ES Module (`import`) 以及浏览器全局挂载。
- `example.js`：包含两个模型文生图、图生图四种场景的完整测试与使用范例。

---

## 🛠️ 快速开始

### 1. 初始化客户端

```javascript
import { ImageGeneratorClient } from './index.js'; // 浏览器引入方式
// 或者 Node.js 引入方式：const { ImageGeneratorClient } = require('./index.js');

const client = new ImageGeneratorClient({
  apiKey: 'YOUR_API_KEY',
  baseUrl: 'YOUR_BASE_URL' // 请替换为您的真实 API 基础地址
});
```

### 2. 文生图 (Text to Image)

使用自然语言描述来生成图像。

```javascript
// 生成一张赛博朋克风猫咪的图片，要求返回标准图片链接 (Data URL / HTTP URL)
const imageUrl = await client.textToImage(
  'gpt-image-2', 
  'A futuristic cybercity cat at night, digital art', 
  {
    responseFormat: 'url',
    size: '1024x1024'
  }
);
console.log(imageUrl); // data:image/png;base64,... 或 http://...
```

### 3. 图生图 (Image to Image)

基于参考底图，输入提示词生成微调图像。支持传入本地 Base64 或公网 HTTP 链接。

```javascript
// 传入参考图 base64，以及要添加的元素描述
const base64Reference = 'data:image/png;base64,...';

const resultBase64 = await client.imageToImage(
  'gemini-3.1-flash-image', 
  base64Reference, 
  'Make the landscape winter style with snow falling', 
  {
    responseFormat: 'b64_json' // 要求直接返回纯 base64 数据
  }
);
console.log(resultBase64); // 纯 Base64 数据字符
```

---

## 💡 模型差异及底层原理

由于两个模型在底层 API 实现上的差异，SDK 会自动按需路由：

| 模型名 | 文生图底层端点 | 图生图底层端点 | 参数及流传输形式 |
| :--- | :--- | :--- | :--- |
| **gpt-image-2** | `POST /v1/images/generations` | `POST /v1/images/edits` | 图生图采用标准的 `multipart/form-data` 上传文件 Blob。 |
| **gemini-3.1-flash-image** | `POST /v1/chat/completions` | `POST /v1/chat/completions` | 图生图以多模态对话形式将图片与文本合并组装为 `messages` 发送。 |

---

## ⚙️ 浏览器插件 (Chrome/Edge Extension) 兼容性指南

本 SDK 没有引入任何打包工具的 Polyfill 依赖（例如 `process`, `path`, `Buffer`），所以在浏览器插件的 `popup.js`, `background.js` (Service Worker) 或者是 `content.js` 中可以直接运行。

### 方式一：直接以 <script> 引入
在您的 Popup 页面或 Option 页面 HTML 中直接加载 `index.js`，它会自动将类挂载到全局变量上：
```html
<script src="index.js"></script>
<script>
  const client = new window.ImageGeneratorClient({ apiKey: '...' });
</script>
```

### 方式二：ES Module 导入
如果在 Service Worker 或支持现代 JS 的插件环境下，可以配合 `type="module"` 导入：
```javascript
import { ImageGeneratorClient } from './index.js';
```

---

## 📄 授权与许可

基于 MIT 许可授权使用。
