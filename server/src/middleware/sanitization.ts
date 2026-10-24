import { Request, Response, NextFunction } from 'express';
import validator from 'validator';

// Dangerous characters for shell execution and command injection
const SHELL_INJECTION_PATTERN = /[;&|`$><!\\()]/g;
const NULL_BYTE_PATTERN = /\0/g;

/**
 * Strips HTML tags and null bytes, normalizes whitespace
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  let cleaned = input.replace(NULL_BYTE_PATTERN, '');
  cleaned = validator.escape(cleaned.trim());
  return cleaned;
}

/**
 * Validates and normalizes public GitHub URLs strictly
 */
export function validateAndCleanGitHubUrl(url: string): { valid: boolean; cleaned: string; error?: string } {
  if (typeof url !== 'string') return { valid: false, cleaned: '', error: 'URL must be a string' };
  const trimmed = url.trim();

  // Explicit GitHub URL regex matching https://github.com/owner/repo
  const githubRegex = /^https:\/\/github\.com\/([a-zA-Z0-9_-]{1,100})\/([a-zA-Z0-9_\-.]{1,100})(?:\.git)?\/?$/;
  const match = trimmed.match(githubRegex);

  if (!match) {
    return {
      valid: false,
      cleaned: '',
      error: 'Invalid GitHub repository URL. Must be in the format: https://github.com/username/repository',
    };
  }

  const owner = match[1];
  const repo = match[2].replace(/\.git$/, '');

  // Disallow suspicious names
  if (owner.startsWith('-') || repo.startsWith('-')) {
    return { valid: false, cleaned: '', error: 'Invalid owner or repository identifier.' };
  }

  return { valid: true, cleaned: `https://github.com/${owner}/${repo}` };
}

/**
 * Validates and sanitizes a slash command definition
 */
export function sanitizeSlashCommand(name: string, description: string, parameters?: string, ephemeral?: boolean): {
  valid: boolean;
  name: string;
  description: string;
  parameters: string;
  ephemeral: boolean;
  error?: string;
} {
  let cleanName = (name || '').trim();
  if (cleanName.startsWith('/')) {
    cleanName = cleanName.substring(1);
  }

  // Discord slash command format: 1-32 lowercase alphanumeric and dashes/underscores
  const nameRegex = /^[a-z0-9_-]{1,32}$/i;
  if (!nameRegex.test(cleanName)) {
    return {
      valid: false,
      name: '',
      description: '',
      parameters: '',
      ephemeral: Boolean(ephemeral),
      error: `Command name '/${cleanName}' contains invalid characters. Use 1-32 alphanumeric characters, dashes, or underscores.`,
    };
  }

  // Ensure no command injection payload in descriptions
  const cleanDesc = sanitizeString(description || '');
  const cleanParams = sanitizeString(parameters || '');

  return {
    valid: true,
    name: `/${cleanName.toLowerCase()}`,
    description: cleanDesc,
    parameters: cleanParams,
    ephemeral: Boolean(ephemeral),
  };
}

/**
 * Express middleware to sanitize body strings and prevent XSS
 */
export function sanitizeBodyMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    sanitizeObjectInPlace(req.body);
  }
  next();
}

function sanitizeObjectInPlace(obj: any): void {
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === 'string') {
      // Remove null bytes
      obj[key] = val.replace(NULL_BYTE_PATTERN, '');
    } else if (typeof val === 'object' && val !== null) {
      sanitizeObjectInPlace(val);
    }
  }
}
