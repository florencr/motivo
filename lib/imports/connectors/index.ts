import type { Connector } from "@/lib/imports/types";
import { genericConnector } from "@/lib/imports/connectors/generic";
import { manualConnector } from "@/lib/imports/connectors/manual";
import { merrjepConnector } from "@/lib/imports/connectors/merrjep";

const REGISTRY: Record<string, Connector> = {
  [genericConnector.key]: genericConnector,
  [manualConnector.key]: manualConnector,
  [merrjepConnector.key]: merrjepConnector,
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
