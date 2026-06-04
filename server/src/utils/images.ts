import sharp from "sharp";

export interface CompressOptions {
  /** Max width/height in pixels. Default 1920. */
  maxDimension?: number;
  /** JPEG quality 1-100. Default 80. */
  quality?: number;
}

/**
 * Compress an image buffer using sharp.
 * - Resizes so the largest side is at most `maxDimension`.
 * - Converts to JPEG for smaller file size.
 * - Returns the compressed buffer and updates the mimetype.
 */
export async function compressImage(
  buffer: Buffer,
  mimetype: string,
  options: CompressOptions = {}
): Promise<{ buffer: Buffer; mimetype: string; ext: string }> {
  const { maxDimension = 1920, quality = 80 } = options;

  const isImage = mimetype.startsWith("image/");
  if (!isImage) {
    // Not an image — return as-is
    return { buffer, mimetype, ext: mimetype.split("/").pop() ?? "bin" };
  }

  try {
    const transformer = sharp(buffer)
      .resize(maxDimension, maxDimension, {
        fit: sharp.fit.inside,
        withoutEnlargement: true
      })
      .jpeg({ quality, progressive: true, mozjpeg: true });

    const compressed = await transformer.toBuffer();
    return { buffer: compressed, mimetype: "image/jpeg", ext: "jpg" };
  } catch {
    // If sharp fails (unsupported format, corrupted image, etc.), return original
    const ext = (mimetype.split("/").pop() ?? "jpg").replace(/[^a-z0-9]/g, "");
    return { buffer, mimetype, ext: ext || "jpg" };
  }
}
