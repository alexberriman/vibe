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
    .allowUnknownOption()
    .allowExcessArguments(true)
    .action(async (options, cmd) => {
      // Get all parsed arguments and options
      const args = cmd.args || [];
      const opts = cmd.opts();

      // Convert options back to command line arguments
      const optionArgs: string[] = [];
      for (const [key, value] of Object.entries(opts)) {
        if (value !== undefined) {
          optionArgs.push(`--${key}`);
          if (value !== true) {
            optionArgs.push(String(value));
          }
        }
      }

      // Combine options and positional arguments
      const allArgs = [...optionArgs, ...args];

      // Run the underlying package with all arguments passed through
      const child = spawn("npx", ["@alexberriman/visual-dom-auditor", ...allArgs], {
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
