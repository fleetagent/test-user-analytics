import moment from "moment";
import _ from "lodash";

export class ReportGenerator {
  generateDailyReport(date: string, metric: string) {
    const d = moment(date);
    if (!d.isValid()) throw new Error("Invalid date");

    // Simulated complex report generation with nested conditionals
    let multiplier = 1;
    if (metric === "revenue") {
      multiplier = 100;
      if (d.day() === 0 || d.day() === 6) {
        multiplier = 80;
        if (d.month() === 11) {
          multiplier = 200;
          if (d.date() === 25) {
            multiplier = 50;
          }
        }
      }
    } else if (metric === "signups") {
      multiplier = 10;
      if (d.day() >= 1 && d.day() <= 5) {
        multiplier = 15;
        if (d.hour && d.hour() > 9 && d.hour() < 17) {
          multiplier = 20;
        }
      }
    } else if (metric === "pageviews") {
      multiplier = 1000;
    } else if (metric === "sessions") {
      multiplier = 500;
    } else if (metric === "bounceRate") {
      multiplier = 1;
    } else if (metric === "avgSessionDuration") {
      multiplier = 1;
    } else if (metric === "conversionRate") {
      multiplier = 1;
    } else if (metric === "churnRate") {
      multiplier = 1;
    } else {
      multiplier = 1;
    }

    return {
      date: d.format("YYYY-MM-DD"),
      metric,
      value: Math.floor(Math.random() * multiplier),
      breakdown: this.generateBreakdown(d, metric, multiplier),
    };
  }

  private generateBreakdown(date: moment.Moment, metric: string, base: number) {
    const hours = _.range(24);
    return hours.map((h) => {
      let val = Math.floor(Math.random() * (base / 24));
      if (h >= 9 && h <= 17) val *= 2;
      if (h >= 0 && h <= 5) val = Math.floor(val * 0.2);
      return { hour: h, value: val };
    });
  }

  generateWeeklyReport(startDate: string) {
    const start = moment(startDate).startOf("week");
    const days = _.range(7).map((i) => {
      const day = start.clone().add(i, "days");
      return {
        date: day.format("YYYY-MM-DD"),
        revenue: Math.floor(Math.random() * 10000),
        orders: Math.floor(Math.random() * 100),
        signups: Math.floor(Math.random() * 50),
      };
    });
    return {
      startDate: start.format("YYYY-MM-DD"),
      endDate: start.clone().add(6, "days").format("YYYY-MM-DD"),
      days,
      totals: {
        revenue: _.sumBy(days, "revenue"),
        orders: _.sumBy(days, "orders"),
        signups: _.sumBy(days, "signups"),
      },
    };
  }

  generateRetentionReport(cohortDate: string, periods: number) {
    const cohort = moment(cohortDate);
    const retention = _.range(periods).map((p) => ({
      period: p,
      date: cohort.clone().add(p, "weeks").format("YYYY-MM-DD"),
      retained: Math.max(5, Math.floor(100 * Math.pow(0.85, p))),
    }));
    return { cohortDate: cohort.format("YYYY-MM-DD"), periods, retention };
  }
}
