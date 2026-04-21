import Introduction from "./introduction";
import QuickStart from "./quick-start";
import Installation from "./installation";
import Overview from "./overview";
import Monorepo from "./monorepo";
import Frontend from "./frontend";
import Backend from "./backend";
import Realtime from "./realtime";
import ApiProtocol from "./api-protocol";
import Deployment from "./deployment";
import Configuration from "./configuration";
import Agents from "./agents";
import Contributing from "./contributing";
import Testing from "./testing";
import Debugging from "./debugging";

const docContent: Record<string, React.ComponentType> = {
  introduction: Introduction,
  "quick-start": QuickStart,
  installation: Installation,
  overview: Overview,
  monorepo: Monorepo,
  frontend: Frontend,
  backend: Backend,
  realtime: Realtime,
  "api-protocol": ApiProtocol,
  deployment: Deployment,
  configuration: Configuration,
  agents: Agents,
  contributing: Contributing,
  testing: Testing,
  debugging: Debugging,
};

export default docContent;
