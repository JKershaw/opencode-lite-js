import assert from "node:assert/strict"
import { describe, test } from "node:test"
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

    assert.deepEqual(getToolDefinitions(tools), [
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

    assert.deepEqual(
      await executeToolCall({
        call: {
          id: "tool-1",
          name: "echo",
          arguments: JSON.stringify({
            value: "hello",
          }),
        },
        tools: [tool],
      }),
      {
        value: "hello",
      },
    )
  })
})
