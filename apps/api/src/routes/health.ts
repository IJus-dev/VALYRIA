import type { FastifyPluginAsync } from "fastify";
import type { AccountTopology, XrplGateway } from "../adapters/xrpl/xrpl-gateway";

interface HealthRouteOptions {
  topology: AccountTopology;
  xrplGateway: XrplGateway;
}

export const healthRoutes: FastifyPluginAsync<HealthRouteOptions> = async (app, options) => {
  app.get("/health", async () => {
    const network = await options.xrplGateway.getNetworkStatus();

    return {
      status: "ok",
      service: "valyria-api",
      topology: options.topology,
      network
    };
  });
};
