/**
 * 配置选项，用于初始化客户端
 */
export interface GeneratorConfig {
  /** API 密钥 */
  apiKey: string;
  /** 接口的基础 URL，例如 http://localhost:30317/v1 */
  baseUrl?: string;
}

/**
 * 图像生成的可选参数
 */
export interface ImageGenerationOptions {
  /** 图片尺寸，如 '1024x1024', '512x512' 等。默认 '1024x1024' */
  size?: string;
  /** 返回的数据格式，可选 'url'（链接）或 'b64_json'（Base64 字符串）。默认 'url' */
  responseFormat?: 'url' | 'b64_json';
}

/**
 * 跨平台的图像生成客户端，支持浏览器插件与 Node.js 环境。
 * 兼容模型 gpt-image-2 与 gemini-3.1-flash-image 的文生图及图生图调用。
 */
export class ImageGeneratorClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: GeneratorConfig) {
    if (!config.apiKey) {
      throw new Error('API key is required.');
    }
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'YOUR_BASE_URL';
    
    // 移除尾部斜杠，保证拼接 URL 正确性
    if (this.baseUrl.endsWith('/')) {
      this.baseUrl = this.baseUrl.slice(0, -1);
    }
  }

  /**
   * 将 Base64 图片数据转换为 Blob 对象。
   * 采用纯前端标准方法，同时兼容 Node.js 18+ 与 Chrome/Edge 等浏览器插件环境。
   */
  private base64ToBlob(base64Data: string, contentType: string = ''): Blob {
    const base64Content = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    const byteCharacters = atob(base64Content);
    const sliceSize = 1024;
    const byteArrays: Uint8Array[] = [];

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
   * 将 ArrayBuffer 转换为 Base64 编码的字符串。
   * 采用跨平台安全的 btoa() 实现。
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
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
   */
  private async processOutput(
    item: { url?: string; b64_json?: string },
    responseFormat: 'url' | 'b64_json'
  ): Promise<string> {
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
        return this.arrayBufferToBase64(buf);
      }
      throw new Error('Neither b64_json nor url found in response.');
    }
  }

  /**
   * 文生图 (Text-to-Image)
   * 
   * @param model 使用的图像模型，例如 'gpt-image-2' 或 'gemini-3.1-flash-image'
   * @param prompt 图片的提示词 (Prompt)
   * @param options 可选参数，包括图片尺寸及返回格式
   * @returns 返回生成的图片 URL 或 Base64 数据字符串（取决于 options.responseFormat）
   */
  async textToImage(
    model: 'gpt-image-2' | 'gemini-3.1-flash-image' | string,
    prompt: string,
    options?: ImageGenerationOptions
  ): Promise<string> {
    const size = options?.size || '1024x1024';
    const responseFormat = options?.responseFormat || 'url';

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
        throw new Error('Invalid response from gpt-image-2 API: data list is empty.');
      }

      return this.processOutput(data.data[0], responseFormat);

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

      return this.processOutput(imageObj.image_url, responseFormat);

    } else {
      throw new Error(`Unsupported model for textToImage: ${model}`);
    }
  }

  /**
   * 图生图 (Image-to-Image / Image Editing)
   * 
   * @param model 使用的图像模型，例如 'gpt-image-2' 或 'gemini-3.1-flash-image'
   * @param base64OrUrl 参考图片的 Base64 数据（带或不带 data:image 前缀均支持）或图片的公网 URL 地址
   * @param prompt 图生图微调的提示词 (Prompt)
   * @param options 可选参数，包括图片尺寸及返回格式
   * @returns 返回生成的图片 URL 或 Base64 数据字符串
   */
  async imageToImage(
    model: 'gpt-image-2' | 'gemini-3.1-flash-image' | string,
    base64OrUrl: string,
    prompt: string,
    options?: ImageGenerationOptions
  ): Promise<string> {
    const size = options?.size || '1024x1024';
    const responseFormat = options?.responseFormat || 'url';

    if (model === 'gpt-image-2') {
      let imageBlob: Blob;
      
      if (base64OrUrl.startsWith('data:') || !base64OrUrl.startsWith('http')) {
        let mime = 'image/png';
        const matches = base64OrUrl.match(/^data:([^;]+);/);
        if (matches && matches[1]) {
          mime = matches[1];
        }
        imageBlob = this.base64ToBlob(base64OrUrl, mime);
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
        throw new Error('Invalid response from gpt-image-2 edits API: data list is empty.');
      }

      return this.processOutput(data.data[0], responseFormat);

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

      return this.processOutput(imageObj.image_url, responseFormat);

    } else {
      throw new Error(`Unsupported model for imageToImage: ${model}`);
    }
  }
}
