/**
 * Client-side image compression utility
 * Compresses images to stay under 1MB for Firebase storage
 */

const MAX_SIZE_BYTES = 1 * 1024 * 1024; // 1MB
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1080;

/**
 * Compresses an image file to ensure it's under 1MB
 * @param {File} file - The image file to compress
 * @param {Object} options - Compression options
 * @param {number} options.maxSizeBytes - Maximum file size in bytes (default: 1MB)
 * @param {number} options.maxWidth - Maximum width (default: 1920px)
 * @param {number} options.maxHeight - Maximum height (default: 1080px)
 * @param {number} options.quality - Initial quality (0-1, default: 0.9)
 * @returns {Promise<string>} Base64 encoded compressed image
 */
export async function compressImage(file, options = {}) {
    const {
        maxSizeBytes = MAX_SIZE_BYTES,
        maxWidth = MAX_WIDTH,
        maxHeight = MAX_HEIGHT,
        quality = 0.9
    } = options;

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onerror = () => reject(new Error('Failed to read file'));

        reader.onload = (e) => {
            const img = new Image();

            img.onerror = () => reject(new Error('Failed to load image'));

            img.onload = () => {
                try {
                    // Calculate new dimensions while maintaining aspect ratio
                    let { width, height } = img;

                    if (width > maxWidth || height > maxHeight) {
                        const ratio = Math.min(maxWidth / width, maxHeight / height);
                        width = Math.round(width * ratio);
                        height = Math.round(height * ratio);
                    }

                    // Create canvas and draw resized image
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Try different quality levels until we're under size limit
                    let currentQuality = quality;
                    let compressedBase64 = canvas.toDataURL('image/jpeg', currentQuality);

                    // Estimate base64 size (base64 is ~33% larger than binary)
                    let estimatedSize = (compressedBase64.length * 0.75);

                    // Reduce quality if still too large
                    while (estimatedSize > maxSizeBytes && currentQuality > 0.1) {
                        currentQuality -= 0.1;
                        compressedBase64 = canvas.toDataURL('image/jpeg', currentQuality);
                        estimatedSize = (compressedBase64.length * 0.75);
                    }

                    // If still too large even at lowest quality, reduce dimensions further
                    if (estimatedSize > maxSizeBytes) {
                        const scaleFactor = Math.sqrt(maxSizeBytes / estimatedSize);
                        canvas.width = Math.round(width * scaleFactor);
                        canvas.height = Math.round(height * scaleFactor);
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
                    }

                    resolve(compressedBase64);
                } catch (error) {
                    reject(error);
                }
            };

            img.src = e.target.result;
        };

        reader.readAsDataURL(file);
    });
}

/**
 * Get human-readable size from base64 string
 * @param {string} base64 - Base64 encoded image
 * @returns {string} Human-readable size (e.g., "850 KB")
 */
export function getBase64Size(base64) {
    const sizeInBytes = base64.length * 0.75;
    if (sizeInBytes < 1024) {
        return `${Math.round(sizeInBytes)} B`;
    } else if (sizeInBytes < 1024 * 1024) {
        return `${Math.round(sizeInBytes / 1024)} KB`;
    } else {
        return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
    }
}
