/**
 * Utility functions for downloading and processing images
 */

import sharp from "sharp";

export async function downloadImageAsBase64(
  imageUrl: string
): Promise<string | null> {
  try {
    console.log(`Downloading image from: ${imageUrl}`);

    // Download the image with proper headers to avoid 429 errors
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
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

    // Convert to array buffer
    const arrayBuffer = await response.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    // Process image with Sharp - resize if needed and optimize
    const sharpInstance = sharp(inputBuffer);
    const metadata = await sharpInstance.metadata();

    console.log(
      `Original image dimensions: ${metadata.width}x${metadata.height}`
    );

    let processedBuffer: Buffer;
    let outputFormat = "png"; // Default to PNG for transparency support

    // Check if resizing is needed (max 100x100)
    if (
      metadata.width &&
      metadata.height &&
      (metadata.width > 100 || metadata.height > 100)
    ) {
      console.log(
        `Resizing image from ${metadata.width}x${metadata.height} to fit within 100x100`
      );
      processedBuffer = await sharpInstance
        .resize(100, 100, {
          fit: "inside", // Maintain aspect ratio, fit within bounds
          withoutEnlargement: true, // Don't enlarge if image is smaller
        })
        .png({ quality: 90, compressionLevel: 6 }) // High quality PNG
        .toBuffer();
    } else {
      // Even if no resizing needed, optimize the image
      processedBuffer = await sharpInstance
        .png({ quality: 90, compressionLevel: 6 })
        .toBuffer();
    }

    // Convert processed image to base64
    const base64 = processedBuffer.toString("base64");
    const dataUrl = `data:image/${outputFormat};base64,${base64}`;

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
  if (!url.trim()) return true; // Empty URL is valid (optional field)

  // Allow both Google Play Store URLs and base64 data URLs
  const patterns = [
    /^https:\/\/play-lh\.googleusercontent\.com\/.*$/,
    /^https:\/\/lh3\.googleusercontent\.com\/.*$/,
    /^data:image\/(png|jpg|jpeg|webp|gif);base64,.*$/,
  ];

  return patterns.some((pattern) => pattern.test(url));
}
