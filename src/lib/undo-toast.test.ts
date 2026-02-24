import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// vi.hoisted runs before vi.mock hoisting — safe to reference in factory
const { mockToast } = vi.hoisted(() => {
  const mockToast = Object.assign(vi.fn(), {
    error: vi.fn(),
  });
  return { mockToast };
});

vi.mock("sonner", () => ({ toast: mockToast }));

import { undoableAction } from "./undo-toast";

describe("undoableAction", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockToast.mockClear();
    mockToast.error.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows a toast with the message and Undo action", () => {
    undoableAction({
      message: "Item deleted",
      execute: vi.fn(),
      undo: vi.fn(),
    });

    expect(mockToast).toHaveBeenCalledWith("Item deleted", {
      duration: 5000,
      action: {
        label: "Undo",
        onClick: expect.any(Function),
      },
    });
  });

  it("executes the server action after the duration", async () => {
    const execute = vi.fn().mockResolvedValue(undefined);
    const undo = vi.fn();

    undoableAction({
      message: "Deleted",
      execute,
      undo,
      duration: 3000,
    });

    expect(execute).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(3000);

    expect(execute).toHaveBeenCalledOnce();
    expect(undo).not.toHaveBeenCalled();
  });

  it("uses default duration of 5000ms", async () => {
    const execute = vi.fn().mockResolvedValue(undefined);

    undoableAction({
      message: "Deleted",
      execute,
      undo: vi.fn(),
    });

    await vi.advanceTimersByTimeAsync(4999);
    expect(execute).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(execute).toHaveBeenCalledOnce();
  });

  it("calls undo and cancels execute when Undo is clicked", async () => {
    const execute = vi.fn().mockResolvedValue(undefined);
    const undo = vi.fn();

    undoableAction({
      message: "Deleted",
      execute,
      undo,
      duration: 3000,
    });

    // Simulate clicking the Undo button
    const toastCall = mockToast.mock.calls[0];
    const onClickUndo = toastCall[1].action.onClick;
    onClickUndo();

    expect(undo).toHaveBeenCalledOnce();

    // Advance past the timer — execute should NOT fire
    await vi.advanceTimersByTimeAsync(5000);
    expect(execute).not.toHaveBeenCalled();
  });

  it("calls undo and shows error toast when execute fails", async () => {
    const execute = vi.fn().mockRejectedValue(new Error("Network error"));
    const undo = vi.fn();

    undoableAction({
      message: "Deleted",
      execute,
      undo,
      duration: 1000,
    });

    await vi.advanceTimersByTimeAsync(1000);

    expect(execute).toHaveBeenCalledOnce();
    expect(undo).toHaveBeenCalledOnce();
    expect(mockToast.error).toHaveBeenCalledWith("Action failed");
  });

  it("uses custom errorMessage when execute fails", async () => {
    const execute = vi.fn().mockRejectedValue(new Error("fail"));
    const undo = vi.fn();

    undoableAction({
      message: "Deleted",
      execute,
      undo,
      duration: 1000,
      errorMessage: "Failed to delete column",
    });

    await vi.advanceTimersByTimeAsync(1000);

    expect(mockToast.error).toHaveBeenCalledWith("Failed to delete column");
  });

  it("does not call undo when execute succeeds", async () => {
    const execute = vi.fn().mockResolvedValue(undefined);
    const undo = vi.fn();

    undoableAction({
      message: "Deleted",
      execute,
      undo,
      duration: 1000,
    });

    await vi.advanceTimersByTimeAsync(1000);

    expect(execute).toHaveBeenCalledOnce();
    expect(undo).not.toHaveBeenCalled();
    expect(mockToast.error).not.toHaveBeenCalled();
  });
});
