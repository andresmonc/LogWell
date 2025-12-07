/**
 * Web-compatible image picker utility
 * Provides the same interface as react-native-image-picker for web
 */

export interface ImagePickerResponse {
  assets?: Array<{
    base64?: string;
    uri?: string;
    type?: string;
    fileName?: string;
  }>;
  didCancel?: boolean;
  errorMessage?: string;
}

export interface ImagePickerOptions {
  mediaType?: 'photo' | 'video' | 'mixed';
  quality?: number;
  includeBase64?: boolean;
}

/**
 * Convert file to base64
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Launch image library picker (web version)
 */
export function launchImageLibrary(
  options: ImagePickerOptions,
  callback: (response: ImagePickerResponse) => void
): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.style.display = 'none';

  input.onchange = async (event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) {
      callback({ didCancel: true });
      return;
    }

    try {
      let base64: string | undefined;
      if (options.includeBase64) {
        base64 = await fileToBase64(file);
      }

      const objectUrl = URL.createObjectURL(file);

      callback({
        assets: [
          {
            base64,
            uri: objectUrl,
            type: file.type,
            fileName: file.name,
          },
        ],
      });
    } catch (error) {
      callback({
        errorMessage: error instanceof Error ? error.message : 'Failed to process image',
      });
    }

    document.body.removeChild(input);
  };

  input.oncancel = () => {
    callback({ didCancel: true });
    document.body.removeChild(input);
  };

  document.body.appendChild(input);
  input.click();
}

/**
 * Launch camera (web version - uses file input as fallback)
 */
export function launchCamera(
  options: ImagePickerOptions,
  callback: (response: ImagePickerResponse) => void
): void {
  // On web, we can try to use the camera via file input with capture attribute
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.capture = 'environment'; // Use back camera if available
  input.style.display = 'none';

  input.onchange = async (event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) {
      callback({ didCancel: true });
      return;
    }

    try {
      let base64: string | undefined;
      if (options.includeBase64) {
        base64 = await fileToBase64(file);
      }

      const objectUrl = URL.createObjectURL(file);

      callback({
        assets: [
          {
            base64,
            uri: objectUrl,
            type: file.type,
            fileName: file.name,
          },
        ],
      });
    } catch (error) {
      callback({
        errorMessage: error instanceof Error ? error.message : 'Failed to process image',
      });
    }

    document.body.removeChild(input);
  };

  input.oncancel = () => {
    callback({ didCancel: true });
    document.body.removeChild(input);
  };

  document.body.appendChild(input);
  input.click();
}

