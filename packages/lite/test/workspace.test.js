import { describe, expect, test } from "bun:test"
import { createMemoryWorkspace } from "../workspace.js"

describe("createMemoryWorkspace", () => {
  test("reads, writes, edits, lists, and searches files", async () => {
    const workspace = createMemoryWorkspace({
      "src/app.js": "console.log('hello')",
    })

    await expect(workspace.read("src/app.js")).resolves.toBe("console.log('hello')")
    await workspace.write("src/note.txt", "hello world")
    await workspace.edit("src/note.txt", "world", "team")

    await expect(workspace.read("src/note.txt")).resolves.toBe("hello team")
    await expect(workspace.list("src")).resolves.toEqual(["app.js", "note.txt"])
    await expect(workspace.search("hello")).resolves.toEqual([
      {
        path: "src/note.txt",
        matches: [1],
      },
    ])
  })
})
