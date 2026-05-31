import fs from "node:fs";

const cssPath = process.env.UI_BACKGROUND_CSS_PATH ?? "apps/web/app/globals.css";
const css = fs.readFileSync(cssPath, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

const output = process.env.GITHUB_OUTPUT;

function writeOutput(name, value) {
  if (output) {
    fs.appendFileSync(output, `${name}=${value}\n`);
  }
}

function parseRootVariables(source) {
  const variables = new Map();
  const rootBlocks = source.matchAll(/:root\s*\{([\s\S]*?)\}/g);
  for (const block of rootBlocks) {
    for (const declaration of block[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
      variables.set(declaration[1].toLowerCase(), declaration[2].trim());
    }
  }
  return variables;
}

function bodyBackgroundDeclarations(source) {
  const declarations = [];
  const bodyBlocks = source.matchAll(/body\s*\{([\s\S]*?)\}/g);
  for (const block of bodyBlocks) {
    const properties = block[1].matchAll(/(background(?:-color)?)\s*:\s*([^;]+);/g);
    for (const property of properties) {
      declarations.push(property[2].trim());
    }
  }
  return declarations;
}

function resolveVariables(value, variables) {
  let resolved = value;
  for (let depth = 0; depth < 5; depth += 1) {
    const next = resolved.replace(/var\(\s*(--[\w-]+)\s*\)/gi, (_match, name) => {
      return variables.get(name.toLowerCase()) ?? _match;
    });
    if (next === resolved) {
      break;
    }
    resolved = next;
  }
  return resolved.trim();
}

function hexToRgb(value) {
  const hex = value.replace("#", "").trim();
  if (/^[0-9a-f]{3}$/i.test(hex)) {
    return hex.split("").map((character) => parseInt(character + character, 16));
  }
  if (/^[0-9a-f]{6}$/i.test(hex)) {
    return [0, 2, 4].map((index) => parseInt(hex.slice(index, index + 2), 16));
  }
  return null;
}

function rgbFromDirectColor(value) {
  const normalized = value.toLowerCase().replace(/\s*!important\s*$/, "").trim();
  const named = {
    red: [255, 0, 0],
    green: [0, 128, 0],
    lime: [0, 255, 0],
    yellow: [255, 255, 0]
  };

  if (named[normalized]) {
    return named[normalized];
  }

  if (normalized.startsWith("#")) {
    return hexToRgb(normalized);
  }

  const rgbMatch = normalized.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/);
  if (rgbMatch) {
    return rgbMatch.slice(1, 4).map(Number);
  }

  return null;
}

function familyFromRgb(rgb) {
  if (!rgb) {
    return "neutral";
  }

  const [red, green, blue] = rgb;
  if (red >= 180 && green <= 120 && blue <= 120) {
    return "red";
  }
  if (green >= 120 && green > red * 1.15 && green > blue * 1.15) {
    return "green";
  }
  if (red >= 180 && green >= 150 && blue <= 120) {
    return "yellow";
  }
  return "neutral";
}

function classifyBackground(value, variables) {
  const original = value.toLowerCase();
  const variableMatch = original.match(/^var\(\s*(--[\w-]+)\s*\)$/);
  if (variableMatch) {
    const variableName = variableMatch[1].toLowerCase();
    if (variableName.includes("red")) return "red";
    if (variableName.includes("green")) return "green";
    if (variableName.includes("yellow")) return "yellow";
  }

  const resolved = resolveVariables(value, variables)
    .toLowerCase()
    .replace(/\s*!important\s*$/, "")
    .trim();

  if (/(gradient|url\(|image-set\(|,)/.test(resolved)) {
    return "neutral";
  }

  return familyFromRgb(rgbFromDirectColor(resolved));
}

const variables = parseRootVariables(css);
const declarations = bodyBackgroundDeclarations(css);
const background = declarations.at(-1) ?? "";
const decision = classifyBackground(background, variables);

writeOutput("decision", decision);
writeOutput("background", background.replace(/\r?\n/g, " "));

if (decision === "red") {
  console.error(`UI background policy refused this change: body background is red (${background}).`);
  process.exit(1);
}

if (decision === "yellow") {
  console.log(`UI background policy detected yellow (${background}); admin approval is required.`);
} else if (decision === "green") {
  console.log(`UI background policy accepted green (${background}).`);
} else {
  console.log(`UI background policy found no red/yellow/green body background override (${background || "none"}).`);
}
