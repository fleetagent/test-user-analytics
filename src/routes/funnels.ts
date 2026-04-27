import Router from "@koa/router";

const router = new Router({ prefix: "/api/funnels" });

router.get("/:funnelId", async (ctx) => {
  ctx.body = { funnelId: ctx.params.funnelId, steps: [], conversionRate: 0 };
});

router.post("/", async (ctx) => {
  const { name, steps } = ctx.request.body as any;
  ctx.body = { id: "fnl_001", name, steps, created: true };
});

export { router as funnelRouter };
