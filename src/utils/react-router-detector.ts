/**
 * Re-export the router detection functionality from the new modular implementation
 */
export {
  type RouterFileType,
  type RouterFileInfo,
  detectRouterFile,
  findRouterDefinitionFiles,
} from "./router-detectors/index.js";
