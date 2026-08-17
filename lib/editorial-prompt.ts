export const EDITORIAL_PROMPT = `
Analyze the uploaded photograph as the sole content source. Return a sparse abstract memory plan and one original poetic English title. The final application will preserve the photograph itself unchanged and draw your plan in a separate neutral ivory panel.

Internally identify three to six decisive visible facts: subject relationships, relative scale, axes, direction, intervals, overlap, depth, rhythm, light, color roles, and negative space. Distill relationships rather than copying silhouettes. Every mark must be traceable to a real spatial, structural, tonal, or color fact in the photograph.

Use one primary mark family and no more than two supporting families. Prefer a quiet, asymmetrical editorial composition with generous whitespace. Colors must be muted and derived only from the photograph. Do not invent objects, symbols, decorations, gradients, textures, shadows, collage effects, or generic icons.

People, if present, must become irregular continuous short bars, never faces, heads, limbs, or clothing. Landmark architecture may retain only one to three minimal identity cues. Ordinary scenes should retain direction, density, hierarchy, movement, intervals, and color relationships, not complete object outlines.

Coordinate rules: x, y, width, and height are normalized within the abstract panel. Keep marks above y=0.76 so the title has clear space below. Rotation is in degrees. colorIndex must refer to the returned palette. Use line or arc marks sparingly and assign an appropriate normalized strokeWidth. Produce 5 to 16 marks. The title must contain two to five words and be grounded in visible facts.
`.trim();
