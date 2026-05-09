import type { Connector } from "@/lib/imports/types";
import { facebookMarketplaceConnector } from "@/lib/imports/connectors/facebook-marketplace";
import { genericConnector } from "@/lib/imports/connectors/generic";
import { manualConnector } from "@/lib/imports/connectors/manual";
import { merrjepConnector } from "@/lib/imports/connectors/merrjep";
import { njoftimeConnector } from "@/lib/imports/connectors/njoftime";

const REGISTRY: Record<string, Connector> = {
  [genericConnector.key]: genericConnector,
  [manualConnector.key]: manualConnector,
  [merrjepConnector.key]: merrjepConnector,
  [njoftimeConnector.key]: njoftimeConnector,
  [facebookMarketplaceConnector.key]: facebookMarketplaceConnector,
};

export function getConnector(key: string): Connector | null {
  return REGISTRY[key] ?? null;
}

export function listConnectors(): Connector[] {
  return Object.values(REGISTRY);
}

export function registerConnector(connector: Connector) {
  REGISTRY[connector.key] = connector;
}
