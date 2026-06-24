# NanoPicasso - Dual-Model Image Generation Client SDK

[简体中文](README.zh.md)

---

A lightweight, robust, and zero-dependency cross-platform SDK client for AI image generation, specifically optimized for `gpt-image-2` and `gemini-3.1-flash-image` models.

This SDK is designed for **Browser Extensions (Chrome/Edge)** and **Node.js** hybrid environments. It uses native `fetch`, `Blob`, and `FormData` without Node.js-exclusive dependencies like `Buffer` or `fs`.

## 🚀 Features
* **Multi-Model Routing**: Smoothly handles protocol differences between `gpt-image-2` (OpenAI-compatible) and `gemini-3.1-flash-image` (multi-modal chat completion).
* **Text-to-Image & Image-to-Image**: Provides a unified public API for all generation modes. Image-to-image supports both Base64 inputs and public HTTP URLs.
* **Auto Format Translation**: Features a built-in format converter. Regardless of whether the API returns a Base64 string or an HTTP URL, the SDK automatically translates it to your requested `responseFormat` (`url` or `b64_json`), preventing `undefined` errors.

## 📦 Files
* `index.ts`: TypeScript source code with comprehensive type definitions.
* `index.js`: Standard JavaScript source code supporting CommonJS, ESM, and direct browser script tags.
* `example.js`: A demo testing script executing text-to-image and image-to-image workflows.

## 🛠️ Quick Start

### 1. Initialize Client
```javascript
import { ImageGeneratorClient } from './index.js';

const client = new ImageGeneratorClient({
  apiKey: 'YOUR_API_KEY',
  baseUrl: 'YOUR_BASE_URL' // e.g., 'http://localhost:30317/v1'
});
```

### 2. Text to Image
```javascript
const imageUrl = await client.textToImage(
  'gpt-image-2', 
  'A futuristic cybercity cat at night, digital art', 
  { responseFormat: 'url' }
);
console.log(imageUrl); // returns data:image/png;base64,... or a URL link
```

### 3. Image to Image (Image Editing)
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

## 💡 Model Routing & Under-the-hood Logic

| Model Name | Text-to-Image Endpoint | Image-to-Image Endpoint | Payload Transmission Format |
| :--- | :--- | :--- | :--- |
| **gpt-image-2** | `POST /v1/images/generations` | `POST /v1/images/edits` | Uses standard multipart `FormData` uploads. |
| **gemini-3.1-flash-image** | `POST /v1/chat/completions` | `POST /v1/chat/completions` | Bundles text and image_url payloads into multi-modal chat `messages`. |

## ⚙️ Browser Extension Guide

This SDK does not introduce any polyfill dependencies for bundlers (e.g. `process`, `path`, `Buffer`), so it can run directly in `popup.js`, `background.js` (Service Worker) or `content.js` of your browser extension.

### Method 1: Include via `<script>` tag
Include `index.js` directly in the HTML of your Popup or Option page:
```html
<script src="index.js"></script>
<script>
  const client = new window.ImageGeneratorClient({ apiKey: '...', baseUrl: '...' });
</script>
```

### Method 2: ES Module Import
In a Service Worker or modern JS extension environment, you can import it with `type="module"`:
```javascript
import { ImageGeneratorClient } from './index.js';
```

## 📄 License

Based on MIT License.
