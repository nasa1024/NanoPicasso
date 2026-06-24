/**
 * ImageGeneratorClient - 图像生成客户端
 * 支持浏览器插件与 Node.js 运行时，兼容 gpt-image-2 与 gemini-3.1-flash-image。
 */
class ImageGeneratorClient {
  /**
   * @param {Object} config 配置选项
   * @param {string} config.apiKey API 密钥
   * @param {string} [config.baseUrl] 基础 API 地址
   */
  constructor(config) {
    if (!config || !config.apiKey) {
      throw new Error('API key is required.');
    }
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'YOUR_BASE_URL';

    if (this.baseUrl.endsWith('/')) {
      this.baseUrl = this.baseUrl.slice(0, -1);
    }
  }

  /**
   * 内部辅助：将 Base64 数据转换为 Blob（兼容浏览器与 Node.js）
   * @private
   */
  _base64ToBlob(base64Data, contentType = '') {
    const base64Content = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    const byteCharacters = atob(base64Content);
    const sliceSize = 1024;
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: contentType });
  }

  /**
   * 将 ArrayBuffer 转换为 Base64 编码的字符串（跨平台兼容）
   * @private
   */
  _arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * 处理响应数据的转换，确保返回正确的格式（url 或 base64）
   * @private
   */
  async _processOutput(item, responseFormat) {
    if (responseFormat === 'url') {
      if (item.url) return item.url;
      if (item.b64_json) return `data:image/png;base64,${item.b64_json}`;
      throw new Error('Neither url nor b64_json found in response.');
    } else {
      if (item.b64_json) return item.b64_json;
      if (item.url) {
        if (item.url.startsWith('data:')) {
          return item.url.split(',')[1];
        }
        // 如果是外部 http/https 链接，则通过 fetch 下载转换为 base64
        const imgRes = await fetch(item.url);
        const buf = await imgRes.arrayBuffer();
        return this._arrayBufferToBase64(buf);
      }
      throw new Error('Neither b64_json nor url found in response.');
    }
  }

  /**
   * 文生图 (Text-to-Image)
   * 
   * @param {string} model 模型名称，如 'gpt-image-2' 或 'gemini-3.1-flash-image'
   * @param {string} prompt 图片的文本描述词
   * @param {Object} [options] 额外参数
   * @param {string} [options.size] 尺寸，例如 '1024x1024'，默认值 '1024x1024'
   * @param {string} [options.responseFormat] 返回格式，'url' 或 'b64_json'，默认 'url'
   * @returns {Promise<string>} 图片链接或 Base64 字符串
   */
  async textToImage(model, prompt, options = {}) {
    const size = options.size || '1024x1024';
    const responseFormat = options.responseFormat || 'url';

    if (model === 'gpt-image-2') {
      const response = await fetch(`${this.baseUrl}/images/generations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          prompt,
          n: 1,
          size,
          response_format: responseFormat
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`gpt-image-2 textToImage failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      if (!data.data || !data.data[0]) {
        throw new Error('Invalid response from gpt-image-2 generations API.');
      }

      return this._processOutput(data.data[0], responseFormat);

    } else if (model === 'gemini-3.1-flash-image') {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`gemini-3.1-flash-image textToImage failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const imageObj = data.choices?.[0]?.message?.images?.[0];
      if (!imageObj || !imageObj.image_url || !imageObj.image_url.url) {
        throw new Error('gemini-3.1-flash-image did not return an image in chat completions.');
      }

      return this._processOutput(imageObj.image_url, responseFormat);

    } else {
      throw new Error(`Unsupported model for textToImage: ${model}`);
    }
  }

  /**
   * 图生图 (Image-to-Image)
   * 
   * @param {string} model 模型名称，如 'gpt-image-2' 或 'gemini-3.1-flash-image'
   * @param {string} base64OrUrl 基础参考图（Base64 编码或公网 URL 地址）
   * @param {string} prompt 图生图微调描述词
   * @param {Object} [options] 额外参数
   * @param {string} [options.size] 尺寸，如 '1024x1024'
   * @param {string} [options.responseFormat] 返回格式，'url' 或 'b64_json'，默认 'url'
   * @returns {Promise<string>} 图片链接或 Base64 字符串
   */
  async imageToImage(model, base64OrUrl, prompt, options = {}) {
    const size = options.size || '1024x1024';
    const responseFormat = options.responseFormat || 'url';

    if (model === 'gpt-image-2') {
      let imageBlob;
      
      if (base64OrUrl.startsWith('data:') || !base64OrUrl.startsWith('http')) {
        let mime = 'image/png';
        const matches = base64OrUrl.match(/^data:([^;]+);/);
        if (matches && matches[1]) {
          mime = matches[1];
        }
        imageBlob = this._base64ToBlob(base64OrUrl, mime);
      } else {
        const imgResponse = await fetch(base64OrUrl);
        if (!imgResponse.ok) {
          throw new Error(`Failed to fetch reference image: ${imgResponse.statusText}`);
        }
        imageBlob = await imgResponse.blob();
      }

      const formData = new FormData();
      formData.append('image', imageBlob, 'image.png');
      formData.append('model', model);
      formData.append('prompt', prompt);
      formData.append('size', size);
      formData.append('response_format', responseFormat);

      const response = await fetch(`${this.baseUrl}/images/edits`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`gpt-image-2 imageToImage failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      if (!data.data || !data.data[0]) {
        throw new Error('Invalid response from gpt-image-2 edits API.');
      }

      return this._processOutput(data.data[0], responseFormat);

    } else if (model === 'gemini-3.1-flash-image') {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: base64OrUrl
                  }
                }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`gemini-3.1-flash-image imageToImage failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const imageObj = data.choices?.[0]?.message?.images?.[0];
      if (!imageObj || !imageObj.image_url || !imageObj.image_url.url) {
        throw new Error('gemini-3.1-flash-image did not return an image in chat completions.');
      }

      return this._processOutput(imageObj.image_url, responseFormat);

    } else {
      throw new Error(`Unsupported model for imageToImage: ${model}`);
    }
  }
}

// 统一导出策略：适配 ES Module、CommonJS (Node) 和全局 Browser 环境
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = { ImageGeneratorClient };
} else if (typeof exports !== 'undefined') {
  exports.ImageGeneratorClient = ImageGeneratorClient;
} else if (typeof window !== 'undefined') {
  window.ImageGeneratorClient = ImageGeneratorClient;
}
export { ImageGeneratorClient };
