import { describe, it, expect, vi, beforeEach } from "vitest";
import { execSync } from "node:child_process";
import {
  isTmuxAvailable,
  getTmuxSessions,
  sessionExists,
  parseTmuxTarget,
  buildTmuxTarget,
  TmuxError,
} from "./utils";

// Mock child_process
vi.mock("child_process");

const mockExecSync = vi.mocked(execSync);

describe("tmux utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("isTmuxAvailable", () => {
    it("should return true when tmux is available", () => {
      mockExecSync.mockReturnValue("tmux 3.2a");

      expect(isTmuxAvailable()).toBe(true);
      expect(mockExecSync).toHaveBeenCalledWith("tmux -V", { stdio: "ignore" });
    });

    it("should return false when tmux is not available", () => {
      mockExecSync.mockImplementation(() => {
        throw new Error("Command not found");
      });

      expect(isTmuxAvailable()).toBe(false);
    });
  });

  describe("getTmuxSessions", () => {
    it("should return parsed sessions list", () => {
      mockExecSync
        .mockReturnValueOnce("tmux 3.2a") // isTmuxAvailable check
        .mockReturnValueOnce("session1:2:1\nsession2:1:0\n");

      const sessions = getTmuxSessions();

      expect(sessions).toEqual([
        { name: "session1", windows: 2, attached: true },
        { name: "session2", windows: 1, attached: false },
      ]);
    });

    it("should return empty array when no sessions exist", () => {
      mockExecSync
        .mockReturnValueOnce("tmux 3.2a") // isTmuxAvailable check
        .mockImplementation(() => {
          const error = new Error("no server running");
          error.message = "no server running";
          throw error;
        });

      const sessions = getTmuxSessions();

      expect(sessions).toEqual([]);
    });

    it("should throw TmuxError when tmux is not available", () => {
      mockExecSync.mockImplementation(() => {
        throw new Error("Command not found");
      });

      expect(() => getTmuxSessions()).toThrow(TmuxError);
    });
  });

  describe("sessionExists", () => {
    it("should return true when session exists", () => {
      mockExecSync
        .mockReturnValueOnce("tmux 3.2a") // isTmuxAvailable check
        .mockReturnValueOnce("session1:2:1\nsession2:1:0\n");

      expect(sessionExists("session1")).toBe(true);
    });

    it("should return false when session does not exist", () => {
      mockExecSync
        .mockReturnValueOnce("tmux 3.2a") // isTmuxAvailable check
        .mockReturnValueOnce("session1:2:1\nsession2:1:0\n");

      expect(sessionExists("nonexistent")).toBe(false);
    });
  });

  describe("parseTmuxTarget", () => {
    it("should parse session only", () => {
      expect(parseTmuxTarget("session1")).toEqual({ session: "session1" });
    });

    it("should parse session and window", () => {
      expect(parseTmuxTarget("session1:window1")).toEqual({
        session: "session1",
        window: "window1",
      });
    });

    it("should parse session, window, and pane", () => {
      expect(parseTmuxTarget("session1:window1:pane1")).toEqual({
        session: "session1",
        window: "window1",
        pane: "pane1",
      });
    });

    it("should throw error for too many parts", () => {
      expect(() => parseTmuxTarget("a:b:c:d")).toThrow(TmuxError);
    });
  });

  describe("buildTmuxTarget", () => {
    it("should build session only target", () => {
      expect(buildTmuxTarget({ session: "session1" })).toBe("session1");
    });

    it("should build session and window target", () => {
      expect(buildTmuxTarget({ session: "session1", window: "window1" })).toBe("session1:window1");
    });

    it("should build full target", () => {
      expect(buildTmuxTarget({ session: "session1", window: "window1", pane: "pane1" })).toBe(
        "session1:window1.pane1"
      );
    });
  });
});
