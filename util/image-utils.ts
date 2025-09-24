/**
 * Utility functions for downloading and processing images
 */

import Jimp from "jimp";

/**
 * Converts Google Play Store URLs to PNG format to avoid WebP processing issues
 */
function convertToPNGFormat(imageUrl: string): string {
  // Check if it's a Google Play Store URL with WebP format
  if (
    imageUrl.includes("googleusercontent.com") &&
    imageUrl.includes("=s") &&
    imageUrl.includes("-rw")
  ) {
    // Convert from WebP format (e.g., =s96-rw) to PNG format (e.g., =s96)
    return imageUrl.replace(/-rw$/, "");
  }
  return imageUrl;
}

export async function downloadImageAsBase64(
  imageUrl: string
): Promise<string | null> {
  try {
    // Convert to PNG format if it's a Google Play Store URL
    const processedUrl = convertToPNGFormat(imageUrl);
    console.log(`Downloading image from: ${processedUrl}`);

    // Download the image with proper headers to avoid 429 errors
    const response = await fetch(processedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "image/png,image/jpeg,image/*,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      // Add a timeout to avoid hanging
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      console.error(
        `Failed to download image: ${response.status} ${response.statusText}`
      );
      return null;
    }

    // Check if it's actually an image
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.startsWith("image/")) {
      console.error(
        `URL does not return an image. Content-Type: ${contentType}`
      );
      return null;
    }

    // Convert to array buffer and then to buffer
    const arrayBuffer = await response.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    // Process image with Jimp - resize if needed and optimize
    const jimpImage = await Jimp.read(inputBuffer);
    const originalWidth = jimpImage.bitmap.width;
    const originalHeight = jimpImage.bitmap.height;

    console.log(
      `Original image dimensions: ${originalWidth}x${originalHeight}`
    );

    // Check if resizing is needed (max 100x100)
    if (originalWidth > 100 || originalHeight > 100) {
      console.log(
        `Resizing image from ${originalWidth}x${originalHeight} to fit within 100x100`
      );

      // Calculate new dimensions while maintaining aspect ratio
      const aspectRatio = originalWidth / originalHeight;
      let newWidth = 100;
      let newHeight = 100;

      if (aspectRatio > 1) {
        // Landscape: width is limiting factor
        newHeight = Math.round(100 / aspectRatio);
      } else {
        // Portrait or square: height is limiting factor
        newWidth = Math.round(100 * aspectRatio);
      }

      jimpImage.resize(newWidth, newHeight);
    }

    // Set quality and get buffer as PNG
    jimpImage.quality(90); // Set quality to 90%
    const processedBuffer = await jimpImage.getBufferAsync(Jimp.MIME_PNG);

    // Convert processed image to base64
    const base64 = processedBuffer.toString("base64");
    const dataUrl = `data:image/png;base64,${base64}`;

    console.log(
      `Successfully processed image to base64. Final size: ${Math.round(processedBuffer.length / 1024)}KB`
    );
    return dataUrl;
  } catch (error) {
    console.error("Error downloading image:", error);
    return null;
  }
}

export function isValidGooglePlayIconUrl(url: string): boolean {
  if (!url.trim()) {
    return true; // Empty URL is valid (optional field)
  }

  // Allow both Google Play Store URLs and base64 data URLs
  const patterns = [
    /^https:\/\/play-lh\.googleusercontent\.com\/.*$/,
    /^https:\/\/lh3\.googleusercontent\.com\/.*$/,
    /^data:image\/(png|jpg|jpeg|webp|gif);base64,.*$/,
  ];

  return patterns.some((pattern) => pattern.test(url));
}
