import { Command } from "commander";
import { spawn } from "node:child_process";

type AuditOutput = {
  metadata?: {
    criticalIssues?: number;
  };
};

/**
 * DOM audit command - wrapper for @alexberriman/visual-dom-auditor
 */
export function domAuditCommand(): Command {
  const command = new Command("dom-audit");

  command
    .description("Run visual DOM audits on web pages using @alexberriman/visual-dom-auditor")
    .option("--no-fail", "Always exit with success code even if critical issues found")
    .option("--error-message <message>", "Custom error message when critical issues are found")
    .allowUnknownOption()
    .allowExcessArguments(true)
    .action(async (options, cmd) => {
      // Get all parsed arguments and options
      const args = cmd.args || [];
      const opts = cmd.opts();

      // Extract our custom options
      const { fail, errorMessage, ...restOpts } = opts;
      const noFail = fail === false; // --no-fail sets fail to false

      // Convert remaining options back to command line arguments
      const optionArgs: string[] = [];
      for (const [key, value] of Object.entries(restOpts)) {
        if (value !== undefined && key !== "fail") {
          // Skip the "fail" key from --no-fail
          optionArgs.push(`--${key}`);
          if (value !== true) {
            optionArgs.push(String(value));
          }
        }
      }

      // Combine options and positional arguments
      const allArgs = [...optionArgs, ...args];

      // Run the underlying package and capture output
      const child = spawn("npx", ["@alexberriman/visual-dom-auditor", ...allArgs], {
        stdio: ["inherit", "pipe", "inherit"], // Capture stdout but inherit stdin/stderr
        shell: true,
      });

      let output = "";
      child.stdout?.on("data", (data) => {
        const chunk = data.toString();
        output += chunk;
        process.stdout.write(chunk); // Still show output to user
      });

      // Handle the process exit
      child.on("close", (code) => {
        if (code !== 0) {
          process.exit(code || 1);
          return;
        }

        // If --no-fail is set, always exit with success
        if (noFail) {
          process.exit(0);
          return;
        }

        // Try to parse the output to check for critical issues
        let criticalIssues = 0;
        try {
          const auditResult: AuditOutput = JSON.parse(output.trim());
          criticalIssues = auditResult.metadata?.criticalIssues ?? 0;
        } catch {
          // If we can't parse the output, assume it's not JSON format
          // In this case, just exit with success since the underlying command succeeded
        }

        if (criticalIssues > 0) {
          const message =
            errorMessage ||
            `DOM audit failed: ${criticalIssues} critical issue${criticalIssues === 1 ? "" : "s"} found`;
          console.error(message);
          process.exit(1);
        }

        process.exit(0);
      });
    });

  return command;
}
