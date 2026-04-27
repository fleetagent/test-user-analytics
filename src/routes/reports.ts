import Router from "@koa/router";
import { ReportGenerator } from "../services/report-generator";

const router = new Router({ prefix: "/api/reports" });
const generator = new ReportGenerator();

router.get("/daily", async (ctx) => {
  const { date, metric } = ctx.query;
  ctx.body = generator.generateDailyReport(String(date), String(metric));
});

router.get("/weekly", async (ctx) => {
  const { startDate } = ctx.query;
  ctx.body = generator.generateWeeklyReport(String(startDate));
});

router.get("/retention", async (ctx) => {
  const { cohortDate, periods } = ctx.query;
  ctx.body = generator.generateRetentionReport(String(cohortDate), Number(periods) || 8);
});

export { router as reportsRouter };
