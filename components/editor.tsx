"use client";

import { ChangeEvent, DragEvent, useCallback, useEffect, useRef, useState } from "react";
import { compositionSchema, FORMAT_DIMENSIONS, Format, type Composition } from "@/lib/composition";

const IVORY = "#f1eee5";
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const formats: Array<{ id: Format; label: string; shape: string }> = [
  { id: "editorial", label: "Editorial", shape: "portrait" },
  { id: "presentation", label: "Presentation", shape: "landscape" },
  { id: "square", label: "Square", shape: "square" },
];

function UploadIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <rect x="7" y="8" width="29" height="29" rx="3" />
      <circle cx="16" cy="17" r="3" />
      <path d="m10 32 9-9 7 7 5-5 5 5" />
      <circle cx="36" cy="35" r="9" className="icon-fill" />
      <path d="M36 30v10M31 35h10" className="icon-accent" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v12m0 0 5-5m-5 5-5-5M5 20h14" />
    </svg>
  );
}

function drawCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = (image.naturalWidth - sourceWidth) / 2;
  const sourceY = (image.naturalHeight - sourceHeight) / 2;
  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

function fitTitle(ctx: CanvasRenderingContext2D, title: string, maxWidth: number, initial: number) {
  let size = initial;
  while (size > 36) {
    ctx.font = `400 ${size}px Georgia, 'Times New Roman', serif`;
    if (ctx.measureText(title).width <= maxWidth) return size;
    size -= 4;
  }
  return size;
}

function drawPanel(ctx: CanvasRenderingContext2D, composition: Composition, x: number, y: number, width: number, height: number) {
  ctx.fillStyle = IVORY;
  ctx.fillRect(x, y, width, height);

  for (const mark of composition.marks) {
    const markX = x + mark.x * width;
    const markY = y + mark.y * height;
    const markWidth = mark.width * width;
    const markHeight = mark.height * height;
    const color = composition.palette[mark.colorIndex % composition.palette.length];
    ctx.save();
    ctx.globalAlpha = mark.opacity;
    ctx.translate(markX + markWidth / 2, markY + markHeight / 2);
    ctx.rotate((mark.rotation * Math.PI) / 180);
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(2, mark.strokeWidth * Math.min(width, height));
    ctx.lineCap = "round";

    if (mark.type === "rect") ctx.fillRect(-markWidth / 2, -markHeight / 2, markWidth, markHeight);
    if (mark.type === "ellipse") {
      ctx.beginPath();
      ctx.ellipse(0, 0, markWidth / 2, markHeight / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (mark.type === "line") {
      ctx.beginPath();
      ctx.moveTo(-markWidth / 2, 0);
      ctx.lineTo(markWidth / 2, 0);
      ctx.stroke();
    }
    if (mark.type === "arc") {
      ctx.beginPath();
      ctx.ellipse(0, markHeight / 2, markWidth / 2, markHeight, 0, Math.PI, Math.PI * 2);
      ctx.stroke();
    }
    if (mark.type === "bar") {
      ctx.beginPath();
      ctx.moveTo(-markWidth / 2, markHeight / 2);
      ctx.lineTo(-markWidth * 0.38, -markHeight / 2);
      ctx.lineTo(markWidth * 0.32, -markHeight * 0.44);
      ctx.lineTo(markWidth / 2, markHeight / 2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  ctx.save();
  ctx.fillStyle = "#211f1c";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const titleSize = fitTitle(ctx, composition.title, width * 0.82, Math.min(width, height) * 0.09);
  ctx.font = `400 ${titleSize}px Georgia, 'Times New Roman', serif`;
  ctx.fillText(composition.title, x + width / 2, y + height * 0.88);
  ctx.restore();
}

async function drawComposition(canvas: HTMLCanvasElement, imageUrl: string, format: Format, composition: Composition) {
  const dimensions = FORMAT_DIMENSIONS[format];
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable.");

  const image = new Image();
  image.src = imageUrl;
  await image.decode();

  ctx.fillStyle = IVORY;
  ctx.fillRect(0, 0, dimensions.width, dimensions.height);
  if (dimensions.horizontal) {
    const photoWidth = Math.round(dimensions.width * dimensions.photoRatio);
    drawCover(ctx, image, 0, 0, photoWidth, dimensions.height);
    drawPanel(ctx, composition, photoWidth, 0, dimensions.width - photoWidth, dimensions.height);
  } else {
    const photoHeight = Math.round(dimensions.height * dimensions.photoRatio);
    drawCover(ctx, image, 0, 0, dimensions.width, photoHeight);
    drawPanel(ctx, composition, 0, photoHeight, dimensions.width, dimensions.height - photoHeight);
  }
}

export function Editor() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [format, setFormat] = useState<Format>("editorial");
  const [composition, setComposition] = useState<Composition | null>(null);
  const [status, setStatus] = useState("Waiting for a photograph");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => {
    if (!canvasRef.current || !previewUrl || !composition) return;
    drawComposition(canvasRef.current, previewUrl, format, composition).catch(() => {
      setError("The preview could not be rendered.");
    });
  }, [composition, format, previewUrl]);

  const acceptFile = useCallback((candidate?: File) => {
    if (!candidate) return;
    setError(null);
    if (!(["image/jpeg", "image/png", "image/webp"] as string[]).includes(candidate.type)) {
      setError("Use a JPG, PNG, or WebP photograph.");
      return;
    }
    if (candidate.size > MAX_FILE_SIZE) {
      setError("The photograph must be 20 MB or smaller.");
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(candidate);
    setPreviewUrl(URL.createObjectURL(candidate));
    setComposition(null);
    setStatus("Ready to create");
  }, [previewUrl]);

  const onInput = (event: ChangeEvent<HTMLInputElement>) => acceptFile(event.target.files?.[0]);
  const onDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    acceptFile(event.dataTransfer.files?.[0]);
  };

  const clearFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setComposition(null);
    setError(null);
    setStatus("Waiting for a photograph");
    if (inputRef.current) inputRef.current.value = "";
  };

  const createComposition = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setStatus("Reading spatial rhythm and color");
    try {
      const body = new FormData();
      body.set("photo", file);
      body.set("format", format);
      const response = await fetch("/api/analyze", { method: "POST", body });
      const data: unknown = await response.json();
      if (!response.ok) {
        const message = typeof data === "object" && data && "error" in data ? String(data.error) : "The composition could not be created.";
        throw new Error(message);
      }
      setComposition(compositionSchema.parse(data));
      setStatus("Ready to download");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The composition could not be created.");
      setStatus("Ready to try again");
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas || !composition) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${composition.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "editorial-composition"}.png`;
      anchor.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  return (
    <main>
      <header className="app-header">
        <h1>Photo Abstract Editorial</h1>
        <p>Private workspace · Images are not stored</p>
      </header>

      <div className="workspace">
        <section className="controls" aria-label="Composition controls">
          <div className="control-block">
            <h2>1. Upload a photograph</h2>
            <input ref={inputRef} className="sr-only" id="photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={onInput} />
            {!previewUrl ? (
              <button className="dropzone" type="button" onClick={() => inputRef.current?.click()} onDrop={onDrop} onDragOver={(event) => event.preventDefault()}>
                <UploadIcon />
                <strong>Drop a photograph here</strong>
                <span>or click to browse your device</span>
                <small>JPG, PNG, WEBP up to 20MB</small>
              </button>
            ) : (
              <div className="photo-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Uploaded photograph preview" />
                <button className="remove-photo" type="button" onClick={clearFile} aria-label="Remove photograph">×</button>
              </div>
            )}
          </div>

          <div className="control-block">
            <h2>2. Choose format</h2>
            <div className="format-grid" role="radiogroup" aria-label="Output format">
              {formats.map((item) => (
                <button key={item.id} type="button" role="radio" aria-checked={format === item.id} className={format === item.id ? "format-option active" : "format-option"} onClick={() => setFormat(item.id)}>
                  <span className={`format-shape ${item.shape}`} />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="error" role="alert">{error}</p>}
          <button className="create-button" type="button" disabled={!file || loading} onClick={createComposition}>
            {loading ? "Creating composition…" : composition ? "Create another variation" : "Create composition"}
          </button>
          <p className="privacy-note">Your photo is sent only for visual analysis and is not saved by this application.</p>
        </section>

        <section className="result" aria-label="Live composition preview">
          <h2>Live preview</h2>
          <div className={`canvas-frame ${format}`}>
            {composition ? (
              <canvas ref={canvasRef} aria-label={`Composition titled ${composition.title}`} />
            ) : (
              <div className="empty-preview">
                <div className="empty-photo" />
                <div className="empty-panel"><span /></div>
                <p>Your composition will appear here</p>
              </div>
            )}
          </div>
          <div className="status" aria-live="polite"><span className={composition ? "ready" : ""} />{status}</div>
          <button className="download-button" type="button" disabled={!composition} onClick={download}>
            <DownloadIcon /> Download PNG
          </button>
        </section>
      </div>

      <footer>Based on the Photo Abstract Editorial skill by @AM. · Personal, educational and non-commercial use</footer>
    </main>
  );
}
