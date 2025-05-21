import { Command } from "commander";
import { spawn } from "node:child_process";

type ScreenshotOptions = {
  readonly args?: string[];
};

/**
 * Screenshot command - wrapper for @alexberriman/screenshotter
 */
export function screenshotCommand(): Command {
  const command = new Command("screenshot");

  command
    .description("Take screenshots of web pages using @alexberriman/screenshotter")
    .usage("[options] -- [passthrough args]")
    .allowUnknownOption()
    .action(async (options: ScreenshotOptions, command) => {
      // Get all arguments passed to the command
      const args = command.args || [];

      // Run the underlying package with all arguments passed through
      const child = spawn("npx", ["@alexberriman/screenshotter", ...args], {
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
