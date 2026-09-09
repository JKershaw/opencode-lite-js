import assert from "node:assert/strict"
import { describe, test } from "node:test"
import { createMemoryWorkspace } from "../workspace.js"

describe("createMemoryWorkspace", () => {
  test("reads, writes, edits, lists, and searches files", async () => {
    const workspace = createMemoryWorkspace({
      "src/app.js": "console.log('hello')",
    })

    assert.equal(await workspace.read("src/app.js"), "console.log('hello')")
    await workspace.write("src/note.txt", "hello world")
    await workspace.edit("src/note.txt", "world", "team")

    assert.equal(await workspace.read("src/note.txt"), "hello team")
    assert.deepEqual(await workspace.list("src"), ["app.js", "note.txt"])
    assert.deepEqual(await workspace.search("team"), [
      {
        path: "src/note.txt",
        matches: [1],
      },
    ])
  })
})
