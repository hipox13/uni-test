import { BadRequestException } from '@nestjs/common';
import { Block, BLOCK_TYPES } from './dto/block.types';

/**
 * Block Registry - validates and manages block types.
 * This is the backend validation for Gutenberg-style blocks.
 */

export interface BlockValidationResult {
  valid: boolean;
  errors?: string[];
}

/**
 * Validate blocks JSON string.
 * Checks that each block has required fields and valid type.
 */
export function validateBlocks(body: string | null | undefined): BlockValidationResult {
  if (!body) {
    return { valid: true }; // Empty body is allowed (page can be created without blocks)
  }

  let blocks: Block[];
  try {
    blocks = JSON.parse(body);
  } catch (error) {
    return {
      valid: false,
      errors: ['Invalid JSON format in body field'],
    };
  }

  if (!Array.isArray(blocks)) {
    return {
      valid: false,
      errors: ['Body must be a JSON array of blocks'],
    };
  }

  const errors: string[] = [];

  blocks.forEach((block, index) => {
    if (!block.id || typeof block.id !== 'string') {
      errors.push(`Block at index ${index}: missing or invalid 'id' field`);
    }

    if (!block.type || typeof block.type !== 'string') {
      errors.push(`Block at index ${index}: missing or invalid 'type' field`);
    } else if (!BLOCK_TYPES.includes(block.type as any)) {
      errors.push(
        `Block at index ${index}: unknown block type '${block.type}'. Allowed types: ${BLOCK_TYPES.join(', ')}`,
      );
    }

    if (block.version === undefined || typeof block.version !== 'number') {
      errors.push(`Block at index ${index}: missing or invalid 'version' field`);
    }

    if (!block.attributes || typeof block.attributes !== 'object') {
      errors.push(`Block at index ${index}: missing or invalid 'attributes' field`);
    }
  });

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Validate blocks and throw BadRequestException if invalid.
 * Use this in service methods.
 */
export function validateBlocksOrThrow(body: string | null | undefined): void {
  const result = validateBlocks(body);
  if (!result.valid) {
    throw new BadRequestException({
      message: 'Invalid blocks structure',
      errors: result.errors,
    });
  }
}
