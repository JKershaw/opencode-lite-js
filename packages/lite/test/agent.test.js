import { describe, expect, test } from "bun:test"
import { createAgent } from "../agent.js"
import { createMemoryStorage } from "../storage.js"
import { defineTool } from "../tools.js"
import { createMemoryWorkspace } from "../workspace.js"

describe("createAgent", () => {
  test("returns plain model output when no tools are requested", async () => {
    const storage = createMemoryStorage()
    const provider = {
      complete: async ({ messages, tools }) => {
        expect(messages).toHaveLength(1)
        expect(messages[0]).toEqual({
          role: "user",
          content: "hello",
        })
        expect(tools).toEqual([])
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

    await expect(agent.run("hello")).resolves.toBe("done")
    await expect(storage.loadMessages("default")).resolves.toEqual([
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

        expect(messages.at(-1)).toEqual({
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

    await expect(agent.run("use a tool")).resolves.toBe("finished")
    expect(calls).toHaveLength(2)
    expect(calls[0].tools).toEqual([
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

    await expect(agent.run("write a file")).rejects.toThrow("Permission denied for tool \"write\"")
  })
})
