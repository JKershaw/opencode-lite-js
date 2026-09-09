import { describe, expect, test } from "bun:test"
import { createMemoryStorage } from "../storage.js"

describe("createMemoryStorage", () => {
  test("persists and reloads messages by session id", async () => {
    const storage = createMemoryStorage()
    const messages = [
      {
        role: "user",
        content: "hello",
      },
    ]

    await storage.saveMessages("session-1", messages)

    const loaded = await storage.loadMessages("session-1")
    expect(loaded).toEqual(messages)
    expect(loaded).not.toBe(messages)
  })
})
