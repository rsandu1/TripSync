import { createApp } from "./app";

const appPromise = createApp().then(({ app }) => app);

export default async function handler(req: any, res: any) {
  const app = await appPromise;
  return app(req, res);
}