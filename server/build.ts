import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm } from "fs/promises";

async function buildAll() {
  await rm("dist", { recursive: true, force: true });
  await rm("api/_bundle.cjs", { force: true });

  console.log("building client...");
  await viteBuild();

  console.log("building vercel api bundle...");
  await esbuild({
    entryPoints: ["server/vercel.ts"],
    bundle: true,
    platform: "node",
    format: "cjs",
    outfile: "api/_bundle.cjs",
    target: "node18",
    logLevel: "info",
  });

  console.log("build complete");
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});