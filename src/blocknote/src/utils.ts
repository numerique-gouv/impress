// Utility functions for handling markdown conversion and related operations

import { NextFunction, Request, Response } from 'express'
import { ServerBlockNoteEditor } from '@blocknote/server-util'
import Y from 'yjs'

const toBase64 = function (str: Uint8Array) {
  return Buffer.from(str).toString('base64')
}

export const asyncWrapper = (
  asyncFn: (req: Request, res: Response) => Promise<Response>
) => {
  return function (req: Request, res: Response, next: NextFunction) {
    asyncFn(req, res).catch(next)
  }
}

const validateContent = (content: string | undefined): string => {
  if (!content) {
    throw new Error('Content is required')
  }
  return content
}

const parseMarkdownToBlocks = async (
  blockNoteEditor: ServerBlockNoteEditor,
  content: string
) => {
  try {
    const blocks = await blockNoteEditor.tryParseMarkdownToBlocks(content)
    if (!blocks || blocks.length === 0) {
      throw new Error('No valid blocks generated')
    }
    return blocks
  } catch (error) {
    throw new Error('Failed to parse markdown content')
  }
}

const processContentBlocks = (server: ServerBlockNoteEditor, blocks: any[]) => {
  try {
    const yDocument = server.blocksToYDoc(blocks, 'document-store')
    return toBase64(Y.encodeStateAsUpdate(yDocument))
  } catch (error) {
    throw new Error('Failed to process content blocks')
  }
}

export const convertMarkdown = async (req: Request, res: Response) => {
  try {
    const content = validateContent(req.body.content)
    const editor = ServerBlockNoteEditor.create()
    const blocks = await parseMarkdownToBlocks(editor, content)
    const encodedContent = processContentBlocks(editor, blocks)
    return res.send({ content: encodedContent })
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message })
  }
}
