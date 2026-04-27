import { EventTracker } from "./tracker";

describe("EventTracker", () => {
  const tracker = new EventTracker();

  describe("enrichEvent", () => {
    it("returns an object with a uuid id", () => {
      const result = tracker.enrichEvent({ userId: "u1", event: "click" });
      // uuid v4 pattern
      expect(result.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it("preserves userId and event from the raw input", () => {
      const result = tracker.enrichEvent({
        userId: "user-42",
        event: "page_view",
      });
      expect(result.userId).toBe("user-42");
      expect(result.event).toBe("page_view");
    });

    it("merges custom properties and adds _enriched and _serverTime", () => {
      const result = tracker.enrichEvent({
        userId: "u1",
        event: "purchase",
        properties: { amount: 99, currency: "EUR" },
      });
      expect(result.properties.amount).toBe(99);
      expect(result.properties.currency).toBe("EUR");
      expect(result.properties._enriched).toBe(true);
      expect(result.properties._serverTime).toBeDefined();
      // _serverTime should be a valid ISO string
      expect(new Date(result.properties._serverTime).toISOString()).toBe(
        result.properties._serverTime,
      );
    });

    it("uses the provided timestamp when present", () => {
      const ts = "2025-01-15T10:00:00.000Z";
      const result = tracker.enrichEvent({
        userId: "u1",
        event: "click",
        timestamp: ts,
      });
      expect(result.timestamp).toBe(ts);
    });

    it("generates a timestamp when none is provided", () => {
      const before = new Date().toISOString();
      const result = tracker.enrichEvent({ userId: "u1", event: "click" });
      const after = new Date().toISOString();
      expect(result.timestamp).toBeDefined();
      expect(result.timestamp >= before).toBe(true);
      expect(result.timestamp <= after).toBe(true);
    });

    it("always sets receivedAt to the current server time", () => {
      const before = new Date().toISOString();
      const result = tracker.enrichEvent({ userId: "u1", event: "click" });
      const after = new Date().toISOString();
      expect(result.receivedAt >= before).toBe(true);
      expect(result.receivedAt <= after).toBe(true);
    });

    it("generates unique ids for each call", () => {
      const a = tracker.enrichEvent({ userId: "u1", event: "a" });
      const b = tracker.enrichEvent({ userId: "u1", event: "b" });
      expect(a.id).not.toBe(b.id);
    });

    it("does not mutate the original properties object", () => {
      const props = { color: "blue" };
      tracker.enrichEvent({ userId: "u1", event: "click", properties: props });
      expect(props).toEqual({ color: "blue" });
    });
  });
});
