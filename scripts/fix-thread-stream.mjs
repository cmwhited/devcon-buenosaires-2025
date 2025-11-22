#!/usr/bin/env node

/**
 * Post-install script to fix Next.js 16 Turbopack bundling issues with thread-stream package
 *
 * The thread-stream package includes test files that reference devDependencies (tap, tape, desm, etc.)
 * that aren't installed in production. Next.js 16's Turbopack tries to bundle these test files,
 * causing build failures.
 *
 * This script removes test and bench directories from all thread-stream installations.
 */

import { rm } from "fs/promises"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

import { globSync } from "glob"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, "..")

async function fixThreadStream() {
  try {
    // Find all problematic files in thread-stream installations
    const patterns = [
      "node_modules/**/thread-stream/test",
      "node_modules/**/thread-stream/bench.js",
      "node_modules/**/thread-stream/LICENSE",
      "node_modules/**/thread-stream/README.md",
    ]

    let filesRemoved = 0

    for (const pattern of patterns) {
      const matches = globSync(pattern, {
        cwd: rootDir,
        absolute: true,
        ignore: [],
        dot: true,
      })

      for (const filePath of matches) {
        try {
          await rm(filePath, { recursive: true, force: true })
          console.log(`Removed ${filePath}`)
          filesRemoved++
        } catch (err) {
          // Ignore errors, file might already be removed
        }
      }
    }

    if (filesRemoved > 0) {
      console.log(`Fixed thread-stream: removed ${filesRemoved} problematic files/directories`)
    }
  } catch (err) {
    console.error("Warning: Could not fix thread-stream package:", err.message)
    // Don't fail the install, just warn
  }
}

fixThreadStream()
