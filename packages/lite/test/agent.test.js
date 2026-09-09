import assert from "node:assert/strict"
import { describe, test } from "node:test"
import { createAgent } from "../agent.js"
import { createMemoryStorage } from "../storage.js"
import { defineTool } from "../tools.js"
import { createMemoryWorkspace } from "../workspace.js"

describe("createAgent", () => {
  test("returns plain model output when no tools are requested", async () => {
    const storage = createMemoryStorage()
    const provider = {
      complete: async ({ messages, tools }) => {
        assert.equal(messages.length, 1)
        assert.deepEqual(messages[0], {
          role: "user",
          content: "hello",
        })
        assert.deepEqual(tools, [])
        return {
          text: "done",
          message: {
            role: "assistant",
            content: "done",
          },
          toolCalls: [],
          finishReason: "stop",
        }
      },
    }

    const agent = createAgent({
      provider,
      storage,
    })

    assert.equal(await agent.run("hello"), "done")
    assert.deepEqual(await storage.loadMessages("default"), [
      {
        role: "user",
        content: "hello",
      },
      {
        role: "assistant",
        content: "done",
      },
    ])
  })

  test("executes tools and appends tool results before the next provider call", async () => {
    const calls = []
    const provider = {
      complete: async ({ messages, tools }) => {
        calls.push({
          messages: structuredClone(messages),
          tools: structuredClone(tools),
        })

        if (calls.length === 1) {
          return {
            text: "",
            message: {
              role: "assistant",
              content: "",
              toolCalls: [
                {
                  id: "tool-1",
                  name: "echo",
                  arguments: {
                    value: "from tool",
                  },
                },
              ],
            },
            toolCalls: [
              {
                id: "tool-1",
                name: "echo",
                arguments: {
                  value: "from tool",
                },
              },
            ],
            finishReason: "tool_calls",
          }
        }

        assert.deepEqual(messages.at(-1), {
          role: "tool",
          toolCallId: "tool-1",
          content: JSON.stringify({
            echoed: "from tool",
          }),
        })
        return {
          text: "finished",
          message: {
            role: "assistant",
            content: "finished",
          },
          toolCalls: [],
          finishReason: "stop",
        }
      },
    }
    const storage = createMemoryStorage()
    const workspace = createMemoryWorkspace()
    const tool = defineTool({
      name: "echo",
      description: "Echo a value",
      parameters: {
        type: "object",
        properties: {
          value: {
            type: "string",
          },
        },
        required: ["value"],
      },
      execute: async (args) => ({
        echoed: args.value,
      }),
    })
    const agent = createAgent({
      provider,
      storage,
      workspace,
      tools: [tool],
    })

    assert.equal(await agent.run("use a tool"), "finished")
    assert.equal(calls.length, 2)
    assert.deepEqual(calls[0].tools, [
      {
        name: "echo",
        description: "Echo a value",
        parameters: {
          type: "object",
          properties: {
            value: {
              type: "string",
            },
          },
          required: ["value"],
        },
      },
    ])
  })

  test("blocks tool execution when permissions deny it", async () => {
    const provider = {
      complete: async () => ({
        text: "",
        message: {
          role: "assistant",
          content: "",
        },
        toolCalls: [
          {
            id: "tool-1",
            name: "write",
            arguments: {
              path: "note.txt",
              content: "hello",
            },
          },
        ],
        finishReason: "tool_calls",
      }),
    }
    const storage = createMemoryStorage()
    const workspace = createMemoryWorkspace()
    const writeTool = defineTool({
      name: "write",
      description: "Write a file",
      execute: async (args, { workspace }) => workspace.write(args.path, args.content),
    })
    const agent = createAgent({
      provider,
      storage,
      workspace,
      tools: [writeTool],
      permissions: {
        write: "deny",
      },
    })

    await assert.rejects(agent.run("write a file"), /Permission denied for tool "write"/)
  })
})
