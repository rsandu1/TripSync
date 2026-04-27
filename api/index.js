import apiModule from "../dist/api.cjs";

const handler = apiModule.default ?? apiModule;

export default handler;