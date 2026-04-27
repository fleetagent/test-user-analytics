import Koa from "koa";
import bodyParser from "koa-bodyparser";
import Router from "@koa/router";
import { eventsRouter } from "./routes/events";
import { reportsRouter } from "./routes/reports";
import { funnelRouter } from "./routes/funnels";

const app = new Koa();
const router = new Router();

app.use(bodyParser());

router.get("/health", (ctx) => {
  ctx.body = { status: "ok" };
});

app.use(eventsRouter.routes());
app.use(reportsRouter.routes());
app.use(funnelRouter.routes());
app.use(router.routes());

const PORT = Number(process.env.PORT) || 3006;
app.listen(PORT, () => {
  console.log(`Analytics service on port ${PORT}`);
});

export { app };
