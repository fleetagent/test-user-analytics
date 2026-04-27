import { v4 as uuid } from "uuid";
import _ from "lodash";
import moment from "moment";

export class EventTracker {
  enrichEvent(raw: any): any {
    return {
      id: uuid(),
      userId: raw.userId,
      event: raw.event,
      properties: _.merge({}, raw.properties, {
        _enriched: true,
        _serverTime: moment().toISOString(),
      }),
      timestamp: raw.timestamp || moment().toISOString(),
      receivedAt: moment().toISOString(),
    };
  }
}
