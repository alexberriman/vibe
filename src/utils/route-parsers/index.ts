import type { RouteInfo } from "./jsx-parser.js";
import { parseJSXRoutes } from "./jsx-parser.js";
import { parseObjectRoutes } from "./object-parser.js";
import { parseDataRouterRoutes } from "./data-router-parser.js";

export type { RouteInfo };
export { parseJSXRoutes, parseObjectRoutes, parseDataRouterRoutes };
