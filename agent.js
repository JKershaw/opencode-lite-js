import { createMemoryStorage } from "./storage.js"
import { executeToolCall, getToolDefinitions } from "./tools.js"

export function createAgent({
  provider,
  tools = [],
  workspace,
  storage = createMemoryStorage(),
  permissions = {},
} = {}) {
  if (!provider?.complete) {
    throw new Error("A provider with a complete() method is required")
  }

  return {
    async run(prompt, { sessionId = "default" } = {}) {
      const messages = await storage.loadMessages(sessionId)
      messages.push({
        role: "user",
        content: prompt,
      })
      await storage.saveMessages(sessionId, messages)

      while (true) {
        const response = await provider.complete({
          messages: structuredClone(messages),
          tools: getToolDefinitions(tools),
          sessionId,
        })
        const assistantMessage = response.message ?? {
          role: "assistant",
          content: response.text ?? "",
        }

        messages.push(assistantMessage)
        await storage.saveMessages(sessionId, messages)

        if (!(response.toolCalls?.length || assistantMessage.toolCalls?.length)) {
          return response.text ?? assistantMessage.content ?? ""
        }

        for (const call of response.toolCalls ?? assistantMessage.toolCalls ?? []) {
          const result = await executeToolCall({
            call,
            tools,
            workspace,
            permissions,
          })

          messages.push({
            role: "tool",
            toolCallId: call.id,
            content: JSON.stringify(result),
          })
        }

        await storage.saveMessages(sessionId, messages)
      }
    },
  }
}
