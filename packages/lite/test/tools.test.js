import { describe, expect, test } from "bun:test"
import { defineTool, executeToolCall, getToolDefinitions } from "../tools.js"

describe("tools", () => {
  test("normalizes tool definitions for providers", () => {
    const tools = [
      defineTool({
        name: "echo",
        description: "Echo a value",
        parameters: {
          type: "object",
        },
        execute: async () => "unused",
      }),
    ]

    expect(getToolDefinitions(tools)).toEqual([
      {
        name: "echo",
        description: "Echo a value",
        parameters: {
          type: "object",
        },
      },
    ])
  })

  test("parses stringified arguments before executing tools", async () => {
    const tool = defineTool({
      name: "echo",
      description: "Echo a value",
      execute: async (args) => ({
        value: args.value,
      }),
    })

    await expect(
      executeToolCall({
        call: {
          id: "tool-1",
          name: "echo",
          arguments: JSON.stringify({
            value: "hello",
          }),
        },
        tools: [tool],
      }),
    ).resolves.toEqual({
      value: "hello",
    })
  })
})
