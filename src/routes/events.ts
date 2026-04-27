import Router from "@koa/router";
import { Kafka, Producer } from "kafkajs";
import { EventTracker } from "../services/tracker";

const router = new Router({ prefix: "/api/events" });

const kafka = new Kafka({ clientId: "analytics", brokers: ["localhost:9092"] });
const producer: Producer = kafka.producer();
const tracker = new EventTracker();

router.post("/track", async (ctx) => {
  const { userId, event, properties, timestamp } = ctx.request.body as any;
  const enriched = tracker.enrichEvent({ userId, event, properties, timestamp });

  await producer.send({
    topic: "analytics.events",
    messages: [{ key: userId, value: JSON.stringify(enriched) }],
  });

  ctx.body = { tracked: true, eventId: enriched.id };
});

router.post("/batch", async (ctx) => {
  const { events } = ctx.request.body as any;
  const enriched = events.map((e: any) => tracker.enrichEvent(e));

  await producer.sendBatch({
    topicMessages: [{
      topic: "analytics.events",
      messages: enriched.map((e: any) => ({ key: e.userId, value: JSON.stringify(e) })),
    }],
  });

  ctx.body = { tracked: enriched.length };
});

router.get("/", async (ctx) => {
  const { userId, event, limit = "50" } = ctx.query;
  ctx.body = { events: [], total: 0 };
});

export { router as eventsRouter };
