/**
 * Comprime una imagen en el navegador antes de subirla a Storage.
 * - Formato: WebP (cuando es soportado)
 * - Resolución max: 1600px (suficiente nitidez para pines y pistas)
 * - Calidad: 0.8
 * - Peso objetivo: ~150-300 KB (desde 4-8 MB nativo)
 *
 * Implementacion manual con Canvas API para evitar problemas de
 * bundling de browser-image-compression con Next.js Turbopack
 * (CustomFileReader is not a constructor).
 */
export async function optimizarFotoParaUpload(file: File): Promise<File> {
  try {
    const bitmap = await loadBitmap(file);
    const targetW = Math.min(bitmap.width, 1600);
    const targetH = (bitmap.height / bitmap.width) * targetW;
    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, targetW, targetH);
    bitmap.close?.();

    const blob = await canvasToBlob(canvas, "image/webp", 0.8);
    if (!blob) return file;

    return new File([blob], file.name.replace(/\.\w+$/, ".webp"), {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error("Error al comprimir imagen, subiendo original:", error);
    return file;
  }
}

async function loadBitmap(file: File): Promise<ImageBitmap> {
  if (typeof createImageBitmap === "function") {
    return await createImageBitmap(file);
  }
  // Fallback para browsers sin createImageBitmap
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img as unknown as ImageBitmap);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}
