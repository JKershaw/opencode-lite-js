export function createMockProvider(responses = []) {
  let index = 0

  return {
    async complete() {
      const response = responses[index]
      index += 1

      if (!response) {
        throw new Error("Mock provider has no more responses")
      }

      return normalizeProviderResponse(response)
    },
  }
}

export function createOpenRouterProvider({
  apiKey,
  model,
  baseUrl = "https://openrouter.ai/api/v1/chat/completions",
  title = "OpenCode Lite JS",
} = {}) {
  if (!apiKey) {
    throw new Error("OpenRouter API key is required")
  }

  if (!model) {
    throw new Error("OpenRouter model is required")
  }

  return {
    async complete({ messages, tools = [] }) {
      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          Authorization: "Bearer " + apiKey,
          "Content-Type": "application/json",
          "HTTP-Referer": globalThis.location?.href ?? "http://localhost",
          "X-Title": title,
        },
        body: JSON.stringify({
          model,
          messages,
          tools: tools.length
            ? tools.map((tool) => ({
                type: "function",
                function: tool,
              }))
            : undefined,
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenRouter request failed with ${response.status}`)
      }

      const payload = await response.json()
      const choice = payload.choices?.[0]
      const message = choice?.message ?? {
        role: "assistant",
        content: "",
      }

      return normalizeProviderResponse({
        text: getMessageText(message),
        message: {
          role: message.role ?? "assistant",
          content: getMessageText(message),
          toolCalls: message.tool_calls?.map((toolCall) => ({
            id: toolCall.id,
            name: toolCall.function?.name,
            arguments: toolCall.function?.arguments,
          })),
        },
        toolCalls: message.tool_calls?.map((toolCall) => ({
          id: toolCall.id,
          name: toolCall.function?.name,
          arguments: toolCall.function?.arguments,
        })),
        usage: payload.usage,
        finishReason: choice?.finish_reason ?? "stop",
      })
    },
  }
}

export function normalizeProviderResponse(response = {}) {
  const message = response.message ?? {
    role: "assistant",
    content: response.text ?? "",
  }

  return {
    text: response.text ?? getMessageText(message),
    message: {
      role: message.role ?? "assistant",
      content: getMessageText(message),
      ...(message.toolCalls ? { toolCalls: message.toolCalls } : {}),
    },
    toolCalls: response.toolCalls ?? message.toolCalls ?? [],
    usage: response.usage,
    finishReason: response.finishReason ?? "stop",
  }
}

function getMessageText(message = {}) {
  if (typeof message.content === "string") {
    return message.content
  }

  if (!Array.isArray(message.content)) {
    return ""
  }

  return message.content
    .flatMap((part) => {
      if (typeof part === "string") {
        return [part]
      }

      if (part?.type === "text" && typeof part.text === "string") {
        return [part.text]
      }

      return []
    })
    .join("\n")
}
