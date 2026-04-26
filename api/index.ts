import { createApp } from "../server/app.ts";

const appPromise = createApp().then(({ app }) => app);

export default async function handler(req: any, res: any) {
  const mod = await import("../server/app.ts");
  const { app } = await mod.createApp();

  return app(req, res);
}