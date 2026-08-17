import { z } from "zod";

export const markSchema = z.object({
  type: z.enum(["rect", "ellipse", "line", "arc", "bar"]),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(0.76),
  width: z.number().min(0.005).max(0.8),
  height: z.number().min(0.005).max(0.55),
  rotation: z.number().min(-180).max(180),
  colorIndex: z.number().int().min(0).max(5),
  opacity: z.number().min(0.2).max(1),
  strokeWidth: z.number().min(0.002).max(0.04),
});

export const compositionSchema = z.object({
  title: z.string().min(3).max(60),
  palette: z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/)).min(3).max(6),
  marks: z.array(markSchema).min(5).max(16),
});

export type Composition = z.infer<typeof compositionSchema>;
export type Format = "editorial" | "presentation" | "square";

export const FORMAT_DIMENSIONS: Record<Format, { width: number; height: number; photoRatio: number; horizontal: boolean }> = {
  editorial: { width: 1200, height: 1800, photoRatio: 0.61, horizontal: false },
  presentation: { width: 1920, height: 1080, photoRatio: 0.62, horizontal: true },
  square: { width: 1600, height: 1600, photoRatio: 0.6, horizontal: false },
};

export function isFormat(value: string): value is Format {
  return value === "editorial" || value === "presentation" || value === "square";
}
