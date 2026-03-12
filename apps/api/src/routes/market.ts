import type { FastifyPluginAsync } from "fastify";
import type { MarketService } from "../modules/market-service";
import type { EventBus } from "../lib/event-bus";
import { env } from "../config/env";

interface MarketRouteOptions {
  service: MarketService;
  eventBus: EventBus;
}

export const marketRoutes: FastifyPluginAsync<MarketRouteOptions> = async (app, options) => {
  app.get("/summary", async () => options.service.getSummary());

  app.get(
    "/stream",
    { websocket: true },
    (socket, request) => {
      // validar token antes de aceitar conexão
      const url = new URL(request.url, `http://${request.hostname}`);
      const token = url.searchParams.get("token");

      if (token !== env.INTERNAL_API_TOKEN) {
        socket.close(4001, "Unauthorized");
        return;
      }

      const sendSnapshot = async (): Promise<void> => {
        socket.send(
          JSON.stringify({
            type: "market.summary",
            payload: await options.service.getSummary()
          })
        );
      };

      // snapshot inicial ao conectar
      void sendSnapshot();

      // push imediato ao receber eventos do mercado
      const onOfferCreated = () => void sendSnapshot();
      const onOfferFilled = () => void sendSnapshot();
      const onAmmSwap = () => void sendSnapshot();

      options.eventBus.on("offer.created", onOfferCreated);
      options.eventBus.on("offer.filled", onOfferFilled);
      options.eventBus.on("amm.swap", onAmmSwap);

      socket.on("close", () => {
        options.eventBus.off("offer.created", onOfferCreated);
        options.eventBus.off("offer.filled", onOfferFilled);
        options.eventBus.off("amm.swap", onAmmSwap);
      });
    }
  );
};
