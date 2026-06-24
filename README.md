# NanoPicasso - Dual-Model Image Generation Client SDK

[English](#english) | [简体中文](#简体中文)

---

<a name="english"></a>
## English Documentation

A lightweight, robust, and zero-dependency cross-platform SDK client for AI image generation, specifically optimized for `gpt-image-2` and `gemini-3.1-flash-image` models.

This SDK is designed for **Browser Extensions (Chrome/Edge)** and **Node.js** hybrid environments. It uses native `fetch`, `Blob`, and `FormData` without Node.js-exclusive dependencies like `Buffer` or `fs`.

### 🚀 Features
* **Multi-Model Routing**: Smoothly handles protocol differences between `gpt-image-2` (OpenAI-compatible) and `gemini-3.1-flash-image` (multi-modal chat completion).
* **Text-to-Image & Image-to-Image**: Provides a unified public API for all generation modes. Image-to-image supports both Base64 inputs and public HTTP URLs.
* **Auto Format Translation**: Features a built-in format converter. Regardless of whether the API returns a Base64 string or an HTTP URL, the SDK automatically translates it to your requested `responseFormat` (`url` or `b64_json`), preventing `undefined` errors.
* **Bilingual Documentation**: Built-in support for both English and Simplified Chinese setups.

### 📦 Files
* `index.ts`: TypeScript source code with comprehensive type definitions.
* `index.js`: Standard JavaScript source code supporting CommonJS, ESM, and direct browser script tags.
* `example.js`: A demo testing script executing text-to-image and image-to-image workflows.

### 🛠️ Quick Start

#### 1. Initialize Client
```javascript
import { ImageGeneratorClient } from './index.js';

const client = new ImageGeneratorClient({
  apiKey: 'YOUR_API_KEY',
  baseUrl: 'YOUR_BASE_URL' // e.g., 'http://localhost:30317/v1'
});
```

#### 2. Text to Image
```javascript
const imageUrl = await client.textToImage(
  'gpt-image-2', 
  'A futuristic cybercity cat at night, digital art', 
  { responseFormat: 'url' }
);
console.log(imageUrl); // returns data:image/png;base64,... or a URL link
```

#### 3. Image to Image (Image Editing)
```javascript
const base64Reference = 'data:image/png;base64,...';
const resultBase64 = await client.imageToImage(
  'gemini-3.1-flash-image', 
  base64Reference, 
  'Add snowy landscape details', 
  { responseFormat: 'b64_json' }
);
console.log(resultBase64); // returns pure base64 string
```

### 💡 Model Routing & Under-the-hood Logic

| Model Name | Text-to-Image Endpoint | Image-to-Image Endpoint | Payload Transmission Format |
| :--- | :--- | :--- | :--- |
| **gpt-image-2** | `POST /v1/images/generations` | `POST /v1/images/edits` | Uses standard multipart `FormData` uploads. |
| **gemini-3.1-flash-image** | `POST /v1/chat/completions` | `POST /v1/chat/completions` | Bundles text and image_url payloads into multi-modal chat `messages`. |

---

<a name="简体中文"></a>
## 简体中文文档

一个轻量、健壮且零依赖的图像生成 (文生图/图生图) 跨平台客户端 SDK，专门适配并优化了 `gpt-image-2` 与 `gemini-3.1-flash-image` 两个图像模型。

该 SDK 专为**浏览器插件 (Chrome/Edge Extension)** 和 **Node.js** 混合环境设计，采用原生 `fetch`、`Blob` 和 `FormData` 实现，避开了 Node.js 特有全局变量（如 `Buffer`、`fs`），完美做到开箱即用。

### 🚀 特性
- **多模型适配**：平滑封装 `gpt-image-2` (OpenAI 兼容图像接口) 与 `gemini-3.1-flash-image` (多模态对话接口) 的底层协议差异。
- **文生图 & 图生图全支持**：统一且简易的公开接口，图生图模式支持本地 Base64 图像与公网图片 URL 传入。
- **自动格式转换容错层**：内置数据转换适配器，不管服务端支持哪种响应类型（Base64 或 HTTP URL），SDK 均能按您的配置（`url` 或 `b64_json`）自动完成内部转换，避免 `undefined` 异常。

### 📦 项目文件说明
- `index.ts`：TypeScript 客户端模块，拥有完善的类型推导。
- `index.js`：原生 JavaScript 客户端模块，同时支持 CommonJS、ES Module 以及浏览器全局挂载。
- `example.js`：包含两个模型文生图、图生图四种场景的完整测试与使用范例。

### 🛠️ 快速开始

#### 1. 初始化客户端
```javascript
import { ImageGeneratorClient } from './index.js';

const client = new ImageGeneratorClient({
  apiKey: 'YOUR_API_KEY',
  baseUrl: 'YOUR_BASE_URL' // 请替换为您的真实 API 基础地址
});
```

#### 2. 文生图
```javascript
const imageUrl = await client.textToImage(
  'gpt-image-2', 
  'A futuristic cybercity cat at night, digital art', 
  { responseFormat: 'url' }
);
console.log(imageUrl); // 返回 data:image/png;base64,... 或 http://...
```

#### 3. 图生图
```javascript
const base64Reference = 'data:image/png;base64,...';
const resultBase64 = await client.imageToImage(
  'gemini-3.1-flash-image', 
  base64Reference, 
  '让背景变成冬日雪景', 
  { responseFormat: 'b64_json' }
);
console.log(resultBase64); // 返回纯 Base64 数据字符
```

### 💡 模型差异及底层原理

| 模型名 | 文生图底层端点 | 图生图底层端点 | 参数及流传输形式 |
| :--- | :--- | :--- | :--- |
| **gpt-image-2** | `POST /v1/images/generations` | `POST /v1/images/edits` | 图生图采用标准的 `multipart/form-data` 上传文件 Blob。 |
| **gemini-3.1-flash-image** | `POST /v1/chat/completions` | `POST /v1/chat/completions` | 图生图以多模态对话形式将图片与文本合并组装为 `messages` 发送。 |

---

## ⚙️ Browser Extension Guide / 浏览器插件兼容性指南

本 SDK 没有引入任何打包工具的 Polyfill 依赖（例如 `process`, `path`, `Buffer`），所以在浏览器插件的 `popup.js`, `background.js` (Service Worker) 或者是 `content.js` 中可以直接运行。

### 方式一：直接以 `<script>` 引入
在您的 Popup 页面或 Option 页面 HTML 中直接加载 `index.js`：
```html
<script src="index.js"></script>
<script>
  const client = new window.ImageGeneratorClient({ apiKey: '...', baseUrl: '...' });
</script>
```

### 方式二：ES Module 导入
如果在 Service Worker 或支持现代 JS 的插件环境下，可以配合 `type="module"` 导入：
```javascript
import { ImageGeneratorClient } from './index.js';
```

---

## 📄 License / 授权许可

Based on MIT License. / 基于 MIT 许可授权使用。
