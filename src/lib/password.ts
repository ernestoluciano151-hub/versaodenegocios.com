/**
 * password.ts — Utilitário central de hash de senhas
 *
 * Segue o OWASP Password Storage Cheat Sheet (2024):
 *   - Algoritmo: Argon2id
 *   - Salt: gerado automaticamente pela libraria (16 bytes, único por hash)
 *   - Pepper: HMAC-SHA256(password, PASSWORD_PEPPER) antes do hash
 *   - Parâmetros: memoryCost=19456 (19 MiB), timeCost=2, parallelism=1, outputLen=32
 *
 * Migração transparente:
 *   - Hashes bcrypt legados ($2b$/$2a$) continuam a funcionar no verify().
 *   - Na próxima autenticação bem-sucedida, o hash é actualizado para Argon2id.
 *
 * Usa @node-rs/argon2 — binários pré-compilados para macOS, Linux e Windows.
 * Sem node-gyp; compatível com Vercel, Railway e Docker.
 */

import { hash, verify, needsRehash, Algorithm } from '@node-rs/argon2'
import bcrypt from 'bcryptjs'
import { createHmac } from 'crypto'

// ── Parâmetros Argon2id (OWASP mínimo recomendado) ───────────────────────────
const ARGON2_OPTIONS = {
  algorithm: Algorithm.Argon2id,
  memoryCost: 19456,  // 19 MiB
  timeCost: 2,        // 2 iterações
  parallelism: 1,
  outputLen: 32,      // 32 bytes = 256 bits
  saltLength: 16,     // 16 bytes = 128 bits
}

// ── Pepper ────────────────────────────────────────────────────────────────────
// O Pepper NUNCA é salvo na base de dados.
// Deve estar definido em PASSWORD_PEPPER nas variáveis de ambiente.
// Se não estiver definido, o sistema funciona mas sem pepper (menos seguro).
function getPepper(): string {
  const pepper = process.env.PASSWORD_PEPPER
  if (!pepper && process.env.NODE_ENV === 'production') {
    console.warn('[SECURITY] PASSWORD_PEPPER não definido em produção. Configure esta variável de ambiente.')
  }
  return pepper ?? ''
}

/**
 * Aplica HMAC-SHA256 com o pepper antes do hash.
 * Garante que mesmo que a base de dados seja comprometida,
 * as passwords não possam ser atacadas sem o pepper.
 */
function applyPepper(password: string): string {
  const pepper = getPepper()
  if (!pepper) return password
  return createHmac('sha256', pepper).update(password).digest('hex')
}

/**
 * Cria um hash Argon2id da password, com pepper aplicado.
 * O salt é gerado automaticamente e incorporado no hash resultante.
 *
 * @param plainPassword — Password em texto puro
 * @returns Hash Argon2id (formato $argon2id$...)
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  const peppered = applyPepper(plainPassword)
  return hash(peppered, ARGON2_OPTIONS)
}

/**
 * Verifica uma password contra um hash armazenado.
 * Suporta hashes Argon2id (actuais) e bcrypt (legados — migração transparente).
 *
 * @param plainPassword — Password em texto puro
 * @param storedHash    — Hash armazenado na base de dados
 * @returns { valid: boolean, needsRehash: boolean }
 */
export async function verifyPassword(
  plainPassword: string,
  storedHash: string,
): Promise<{ valid: boolean; needsRehash: boolean }> {
  // Detectar hash bcrypt legado
  if (storedHash.startsWith('$2b$') || storedHash.startsWith('$2a$') || storedHash.startsWith('$2y$')) {
    // Hashes bcrypt legados NÃO têm pepper (foram criados antes desta migração)
    const valid = await bcrypt.compare(plainPassword, storedHash)
    return { valid, needsRehash: valid } // Se válido, sinalizar para re-hash com Argon2id
  }

  // Hash Argon2id actual
  const peppered = applyPepper(plainPassword)
  const valid = await verify(storedHash, peppered, ARGON2_OPTIONS)

  // Verificar se os parâmetros precisam de actualização
  const rehash = valid && needsRehash(storedHash, ARGON2_OPTIONS)
  return { valid, needsRehash: rehash }
}

/**
 * Indica se um hash é bcrypt (legado) — útil para forçar rehash no login.
 */
export function isLegacyHash(storedHash: string): boolean {
  return storedHash.startsWith('$2b$') || storedHash.startsWith('$2a$') || storedHash.startsWith('$2y$')
}
