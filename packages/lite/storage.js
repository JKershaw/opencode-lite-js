export function createMemoryStorage(initialSessions = {}) {
  const sessions = new Map(
    Object.entries(initialSessions).map(([sessionId, messages]) => [sessionId, structuredClone(messages)]),
  )

  return {
    async loadMessages(sessionId = "default") {
      return structuredClone(sessions.get(sessionId) ?? [])
    },
    async saveMessages(sessionId = "default", messages = []) {
      const nextMessages = structuredClone(messages)
      sessions.set(sessionId, nextMessages)
      return structuredClone(nextMessages)
    },
  }
}

export function createLocalStorageStorage({ keyPrefix = "opencode-lite" } = {}) {
  const storage = globalThis.localStorage

  if (!storage) {
    throw new Error("localStorage is not available in this runtime")
  }

  return {
    async loadMessages(sessionId = "default") {
      return JSON.parse(storage.getItem(`${keyPrefix}:${sessionId}`) ?? "[]")
    },
    async saveMessages(sessionId = "default", messages = []) {
      storage.setItem(`${keyPrefix}:${sessionId}`, JSON.stringify(messages))
      return structuredClone(messages)
    },
  }
}
