import assert from "node:assert/strict"
import { describe, test } from "node:test"
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
    assert.deepEqual(loaded, messages)
    assert.notEqual(loaded, messages)
  })
})
