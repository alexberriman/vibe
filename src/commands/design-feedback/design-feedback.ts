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
    .usage("[options] -- [passthrough args]")
    .option("--help", "Show help for design-feedback command")
    .allowUnknownOption()
    .action(async (options: DesignFeedbackOptions, command) => {
      // Get all arguments passed to the command
      const args = command.args || [];

      // Run the underlying package with all arguments passed through
      const child = spawn("npx", ["@alexberriman/openai-designer-feedback", ...args], {
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
