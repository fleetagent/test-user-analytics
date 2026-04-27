import { ReportGenerator } from "./report-generator";

describe("ReportGenerator", () => {
  const gen = new ReportGenerator();

  describe("generateDailyReport", () => {
    it("returns the correct date and metric in the output", () => {
      const report = gen.generateDailyReport("2025-03-10", "revenue");
      expect(report.date).toBe("2025-03-10");
      expect(report.metric).toBe("revenue");
    });

    it("includes a numeric value", () => {
      const report = gen.generateDailyReport("2025-03-10", "pageviews");
      expect(typeof report.value).toBe("number");
      expect(report.value).toBeGreaterThanOrEqual(0);
    });

    it("produces a 24-hour breakdown", () => {
      const report = gen.generateDailyReport("2025-03-10", "signups");
      expect(report.breakdown).toHaveLength(24);
      expect(report.breakdown[0]).toHaveProperty("hour", 0);
      expect(report.breakdown[23]).toHaveProperty("hour", 23);
      report.breakdown.forEach((b: any) => {
        expect(typeof b.value).toBe("number");
      });
    });

    it("throws on an invalid date", () => {
      expect(() => gen.generateDailyReport("not-a-date", "revenue")).toThrow(
        "Invalid date",
      );
    });

    it("handles unknown metrics gracefully (multiplier defaults to 1)", () => {
      const report = gen.generateDailyReport("2025-06-01", "unknownMetric");
      // With multiplier 1, Math.floor(Math.random() * 1) is always 0
      expect(report.value).toBe(0);
      expect(report.metric).toBe("unknownMetric");
    });

    it("applies the revenue multiplier for weekday dates", () => {
      // 2025-03-10 is a Monday → base multiplier 100
      // Value should be in range [0, 100)
      const report = gen.generateDailyReport("2025-03-10", "revenue");
      expect(report.value).toBeLessThan(100);
      expect(report.value).toBeGreaterThanOrEqual(0);
    });

    it("applies the weekend revenue multiplier", () => {
      // 2025-03-08 is a Saturday → multiplier 80
      const report = gen.generateDailyReport("2025-03-08", "revenue");
      expect(report.value).toBeLessThan(80);
      expect(report.value).toBeGreaterThanOrEqual(0);
    });

    it("applies the December-25 revenue multiplier", () => {
      // 2025-12-25 is a Thursday (weekday), so it hits multiplier 100 not the Christmas branch
      // Actually let's check: Dec 25, 2025 → day() = 4 (Thursday) → not weekend → multiplier = 100
      // The Christmas branch is only inside the weekend branch, so it only applies on weekend Christmas days
      // Let's use a year where Dec 25 is a Saturday: 2021-12-25 → day() = 6 → weekend → month 11 → date 25 → multiplier 50
      const report = gen.generateDailyReport("2021-12-25", "revenue");
      expect(report.value).toBeLessThan(50);
      expect(report.value).toBeGreaterThanOrEqual(0);
    });
  });

  describe("generateWeeklyReport", () => {
    it("returns 7 days starting from the start of the given week", () => {
      const report = gen.generateWeeklyReport("2025-03-10");
      expect(report.days).toHaveLength(7);
    });

    it("each day has revenue, orders, and signups as numbers", () => {
      const report = gen.generateWeeklyReport("2025-03-10");
      for (const day of report.days) {
        expect(typeof day.revenue).toBe("number");
        expect(typeof day.orders).toBe("number");
        expect(typeof day.signups).toBe("number");
        expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    });

    it("totals equal the sum of daily values", () => {
      const report = gen.generateWeeklyReport("2025-03-10");
      const expectedRevenue = report.days.reduce(
        (s: number, d: any) => s + d.revenue,
        0,
      );
      const expectedOrders = report.days.reduce(
        (s: number, d: any) => s + d.orders,
        0,
      );
      const expectedSignups = report.days.reduce(
        (s: number, d: any) => s + d.signups,
        0,
      );
      expect(report.totals.revenue).toBe(expectedRevenue);
      expect(report.totals.orders).toBe(expectedOrders);
      expect(report.totals.signups).toBe(expectedSignups);
    });

    it("startDate and endDate span exactly 7 days", () => {
      const report = gen.generateWeeklyReport("2025-03-12");
      const start = new Date(report.startDate);
      const end = new Date(report.endDate);
      const diffDays =
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBe(6);
    });
  });

  describe("generateRetentionReport", () => {
    it("returns the correct cohortDate and number of periods", () => {
      const report = gen.generateRetentionReport("2025-01-01", 6);
      expect(report.cohortDate).toBe("2025-01-01");
      expect(report.periods).toBe(6);
    });

    it("has one entry per period", () => {
      const report = gen.generateRetentionReport("2025-01-01", 8);
      expect(report.retention).toHaveLength(8);
    });

    it("period indices start at 0 and increment", () => {
      const report = gen.generateRetentionReport("2025-01-01", 5);
      report.retention.forEach((r: any, i: number) => {
        expect(r.period).toBe(i);
      });
    });

    it("dates are spaced one week apart", () => {
      const report = gen.generateRetentionReport("2025-01-01", 4);
      const dates = report.retention.map((r: any) => new Date(r.date));
      for (let i = 1; i < dates.length; i++) {
        const diffDays =
          (dates[i].getTime() - dates[i - 1].getTime()) /
          (1000 * 60 * 60 * 24);
        expect(diffDays).toBe(7);
      }
    });

    it("retention decreases over periods (following 0.85^p curve)", () => {
      const report = gen.generateRetentionReport("2025-01-01", 10);
      // First period should have highest retention
      expect(report.retention[0].retained).toBeGreaterThanOrEqual(
        report.retention[report.retention.length - 1].retained,
      );
      // Verify the formula: Math.max(5, Math.floor(100 * 0.85^p))
      for (const r of report.retention) {
        const expected = Math.max(
          5,
          Math.floor(100 * Math.pow(0.85, r.period)),
        );
        expect(r.retained).toBe(expected);
      }
    });

    it("retention never drops below 5", () => {
      // With many periods, 0.85^p approaches 0 but floor is 5
      const report = gen.generateRetentionReport("2025-01-01", 50);
      for (const r of report.retention) {
        expect(r.retained).toBeGreaterThanOrEqual(5);
      }
    });
  });
});
