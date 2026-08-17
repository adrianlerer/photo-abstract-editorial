import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const browser = await chromium.launch({
  headless: true,
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";

const errors = [];
const mockComposition = {
  title: "Measured City Light",
  palette: ["#27343A", "#B77B4D", "#767B73", "#D6C5A9"],
  marks: [
    { type: "bar", x: 0.16, y: 0.2, width: 0.08, height: 0.38, rotation: -2, colorIndex: 0, opacity: 0.95, strokeWidth: 0.01 },
    { type: "bar", x: 0.29, y: 0.3, width: 0.06, height: 0.23, rotation: 2, colorIndex: 2, opacity: 0.9, strokeWidth: 0.01 },
    { type: "bar", x: 0.42, y: 0.12, width: 0.1, height: 0.46, rotation: 0, colorIndex: 1, opacity: 0.88, strokeWidth: 0.01 },
    { type: "line", x: 0.12, y: 0.64, width: 0.7, height: 0.02, rotation: -4, colorIndex: 0, opacity: 0.7, strokeWidth: 0.006 },
    { type: "ellipse", x: 0.68, y: 0.28, width: 0.16, height: 0.12, rotation: 0, colorIndex: 3, opacity: 0.85, strokeWidth: 0.01 },
  ],
};

await mkdir("test-results", { recursive: true });

const page = await browser.newPage({ viewport: { width: 1440, height: 1024 }, deviceScaleFactor: 1 });
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(error.message));
await page.route("**/api/analyze", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockComposition) }));
await page.goto(baseUrl, { waitUntil: "networkidle" });

if (!(await page.getByRole("heading", { name: "Photo Abstract Editorial" }).isVisible())) throw new Error("Missing product heading");
if (!(await page.getByRole("button", { name: /Drop a photograph here/ }).isVisible())) throw new Error("Missing upload control");
await page.screenshot({ path: "test-results/home-desktop.png", fullPage: true });

await page.locator("input[type=file]").setInputFiles("assets/examples/case-1.jpg");
await page.getByRole("button", { name: "Create composition" }).click();
await page.getByText("Ready to download").waitFor();
const canvas = page.locator("canvas");
if ((await canvas.getAttribute("width")) !== "1200") throw new Error("Editorial canvas width mismatch");
await page.screenshot({ path: "test-results/composition-desktop.png", fullPage: true });

await page.getByRole("radio", { name: "Presentation" }).click();
if ((await canvas.getAttribute("width")) !== "1920") throw new Error("Presentation canvas width mismatch");
if (!(await page.getByRole("button", { name: /Download PNG/ }).isEnabled())) throw new Error("Download action is disabled");

await page.setViewportSize({ width: 390, height: 844 });
await page.reload({ waitUntil: "networkidle" });
await page.screenshot({ path: "test-results/home-mobile.png", fullPage: true });
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
if (overflow) throw new Error("Mobile layout has horizontal overflow");

console.log(JSON.stringify({ status: "PASS", consoleErrors: errors, screenshots: ["home-desktop.png", "composition-desktop.png", "home-mobile.png"] }));
await browser.close();
