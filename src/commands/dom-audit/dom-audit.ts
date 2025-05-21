import { Command } from "commander";
import { spawn } from "node:child_process";

type DomAuditOptions = {
  readonly args?: string[];
};

/**
 * DOM audit command - wrapper for @alexberriman/visual-dom-auditor
 */
export function domAuditCommand(): Command {
  const command = new Command("dom-audit");

  command
    .description("Run visual DOM audits on web pages using @alexberriman/visual-dom-auditor")
    .usage("[options] -- [passthrough args]")
    .option("--help", "Show help for dom-audit command")
    .allowUnknownOption()
    .action(async (options: DomAuditOptions, command) => {
      // Get all arguments passed to the command
      const args = command.args || [];

      // Run the underlying package with all arguments passed through
      const child = spawn("npx", ["@alexberriman/visual-dom-auditor", ...args], {
        stdio: "inherit", // Inherit stdio to show output in the terminal
        shell: true,
      });

      // Handle the process exit
      child.on("close", (code) => {
        process.exit(code || 0);
      });
    });

  return command;
}
