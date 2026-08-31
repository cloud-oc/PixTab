import { createWriteStream } from "node:fs";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import archiver from "archiver";
import { build, transform } from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = path.join(root, "dist");
const manifest = JSON.parse(await readFile(path.join(root, "manifest.json"), "utf8"));

if (path.dirname(outputRoot) !== root) throw new Error("Refusing to clean an output path outside the repository");
await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });

for (const target of ["chrome", "firefox"]) {
  const directory = path.join(outputRoot, target);
  await mkdir(path.join(directory, "src", "newtab"), { recursive: true });
  await mkdir(path.join(directory, "src", "options"), { recursive: true });
  await mkdir(path.join(directory, "src", "entrypoints"), { recursive: true });
  await Promise.all([
    cp(path.join(root, "_locales"), path.join(directory, "_locales"), { recursive: true }),
    cp(path.join(root, "icons"), path.join(directory, "icons"), { recursive: true }),
    cp(path.join(root, "LICENSE"), path.join(directory, "LICENSE")),
    cp(path.join(root, "THIRD_PARTY_NOTICES"), path.join(directory, "THIRD_PARTY_NOTICES")),
    cp(path.join(root, "src", "newtab", "index.html"), path.join(directory, "src", "newtab", "index.html")),
    cp(path.join(root, "src", "options", "options.html"), path.join(directory, "src", "options", "options.html")),
    minifyCss(path.join(root, "src", "newtab", "style.css"), path.join(directory, "src", "newtab", "style.css")),
    minifyCss(path.join(root, "src", "options", "options.css"), path.join(directory, "src", "options", "options.css"))
  ]);

  const targetManifest = structuredClone(manifest);
  if (target === "firefox") {
    const worker = targetManifest.background.service_worker;
    targetManifest.background = { scripts: [worker], type: "module" };
    targetManifest.action.default_icon = targetManifest.action.default_icon["48"];
    targetManifest.browser_specific_settings.gecko_android = {
      strict_min_version: targetManifest.browser_specific_settings.gecko.strict_min_version
    };
  }
  await writeFile(path.join(directory, "manifest.json"), `${JSON.stringify(targetManifest, null, 2)}\n`);

  const buildOptions = {
    entryNames: "[name]",
    outdir: path.join(directory, "src", "entrypoints"),
    bundle: true,
    format: "esm",
    platform: "browser",
    target: target === "firefox" ? "firefox140" : "chrome120",
    minify: true,
    sourcemap: false,
    legalComments: "eof"
  };
  await Promise.all([
    build({
      ...buildOptions,
      entryPoints: {
        background: path.join(root, "src", "entrypoints", "background.js"),
        options: path.join(root, "src", "entrypoints", "options.js")
      }
    }),
    build({
      ...buildOptions,
      entryPoints: { newtab: path.join(root, "src", "entrypoints", "newtab.js") },
      splitting: true,
      chunkNames: "chunks/[name]-[hash]"
    })
  ]);
}

await Promise.all([
  archive(path.join(outputRoot, "chrome"), path.join(outputRoot, `pixtab-${manifest.version}-chrome.zip`)),
  archive(path.join(outputRoot, "firefox"), path.join(outputRoot, `pixtab-${manifest.version}-firefox.xpi`))
]);

console.log(`Built PixTab ${manifest.version} packages in ${path.relative(root, outputRoot)}`);

function archive(sourceDirectory, destinationFile) {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(destinationFile);
    const zip = archiver("zip", { zlib: { level: 9 } });
    output.on("close", resolve);
    output.on("error", reject);
    zip.on("error", reject);
    zip.pipe(output);
    zip.directory(sourceDirectory, false);
    void zip.finalize();
  });
}

async function minifyCss(sourceFile, destinationFile) {
  const source = await readFile(sourceFile, "utf8");
  const result = await transform(source, { loader: "css", minify: true });
  await writeFile(destinationFile, result.code);
}
