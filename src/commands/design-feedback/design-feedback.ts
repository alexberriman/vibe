import { Command } from "commander";
import { spawn } from "node:child_process";

type DesignFeedbackOptions = {
  readonly args?: string[];
};

/**
 * Design Feedback command - wrapper for @alexberriman/openai-designer-feedback
 */
export function designFeedbackCommand(): Command {
  const command = new Command("design-feedback");

  command
    .description("Get AI-powered design feedback using @alexberriman/openai-designer-feedback")
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
      const child = spawn("npx", ["@alexberriman/openai-designer-feedback", ...allArgs], {
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
