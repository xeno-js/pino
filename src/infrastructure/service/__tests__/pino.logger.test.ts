import { LOG_LEVEL } from '@xeno-js/shared'
import type { Logger } from 'pino'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { PinoLogger } from '../pino.logger'

describe('PinoLogger', () => {
  let mockPinoLogger: Logger
  let sut: PinoLogger // SUT = System Under Test

  beforeEach(() => {
    // Creiamo il mock pulito. Non serve fare spyOn nei test, useremo direttamente questi.
    mockPinoLogger = {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
    } as unknown as Logger
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Level Filtering (minLevel)', () => {
    it('blocks log if tracking level is lower than minimum configured level', () => {
      sut = new PinoLogger(mockPinoLogger, LOG_LEVEL.WARN)

      // Tentiamo di tracciare un DEBUG (che è < WARN)
      sut.track(LOG_LEVEL.DEBUG, 'ignored', { reqId: '1' })

      expect(mockPinoLogger.error).not.toHaveBeenCalled()
      expect(mockPinoLogger.warn).not.toHaveBeenCalled()
      expect(mockPinoLogger.info).not.toHaveBeenCalled()
      expect(mockPinoLogger.debug).not.toHaveBeenCalled()
    })

    it('allows log if tracking level is equal to minimum configured level', () => {
      sut = new PinoLogger(mockPinoLogger, LOG_LEVEL.WARN)

      sut.track(LOG_LEVEL.WARN, 'warn message', { reqId: '1' })

      expect(mockPinoLogger.warn).toHaveBeenCalledOnce()
    })
  })

  describe('Switch Statement Branches', () => {
    it('executes ERROR branch and maps payload correctly', () => {
      sut = new PinoLogger(mockPinoLogger, LOG_LEVEL.DEBUG) // Min level basso per far passare tutto
      const err = new Error('boom')

      sut.track(LOG_LEVEL.ERROR, 'error message', { requestId: 'abc' }, err)

      expect(mockPinoLogger.error).toHaveBeenCalledOnce()
      expect(mockPinoLogger.error).toHaveBeenCalledWith(
        { requestId: 'abc', error: err },
        'error message',
      )
    })

    it('executes WARN branch correctly', () => {
      sut = new PinoLogger(mockPinoLogger, LOG_LEVEL.DEBUG)

      sut.track(LOG_LEVEL.WARN, 'warn message', { user: 'u1' })

      expect(mockPinoLogger.warn).toHaveBeenCalledOnce()
      expect(mockPinoLogger.warn).toHaveBeenCalledWith({ user: 'u1' }, 'warn message')
    })

    it('executes DEBUG branch correctly', () => {
      sut = new PinoLogger(mockPinoLogger, LOG_LEVEL.DEBUG)

      sut.track(LOG_LEVEL.DEBUG, 'debug message', { trace: 't1' })

      expect(mockPinoLogger.debug).toHaveBeenCalledOnce()
      expect(mockPinoLogger.debug).toHaveBeenCalledWith({ trace: 't1' }, 'debug message')
    })

    it('executes DEFAULT branch (INFO) for unmapped or INFO levels', () => {
      sut = new PinoLogger(mockPinoLogger, LOG_LEVEL.DEBUG)

      sut.track(LOG_LEVEL.INFO, 'info message', { session: 's1' })

      expect(mockPinoLogger.info).toHaveBeenCalledOnce()
      expect(mockPinoLogger.info).toHaveBeenCalledWith({ session: 's1' }, 'info message')
    })
  })

  describe('Null/Undefined Handling', () => {
    it('handles missing payload by defaulting to empty object', () => {
      sut = new PinoLogger(mockPinoLogger, LOG_LEVEL.DEBUG)

      // Passiamo null come contesto
      sut.track(LOG_LEVEL.INFO, 'empty payload', null)

      expect(mockPinoLogger.info).toHaveBeenCalledWith({}, 'empty payload')
    })
  })

  describe('Payload Fallback Branches (payload ?? {})', () => {
    it('defaults to empty object for ERROR level when context is null', () => {
      sut = new PinoLogger(mockPinoLogger, LOG_LEVEL.DEBUG)

      sut.track(LOG_LEVEL.ERROR, 'error without context', null)

      expect(mockPinoLogger.error).toHaveBeenCalledOnce()
      expect(mockPinoLogger.error).toHaveBeenCalledWith({}, 'error without context')
    })

    it('defaults to empty object for WARN level when context is undefined', () => {
      sut = new PinoLogger(mockPinoLogger, LOG_LEVEL.DEBUG)

      sut.track(LOG_LEVEL.WARN, 'warn without context', undefined)

      expect(mockPinoLogger.warn).toHaveBeenCalledOnce()
      expect(mockPinoLogger.warn).toHaveBeenCalledWith({}, 'warn without context')
    })

    it('defaults to empty object for DEBUG level when context is null', () => {
      sut = new PinoLogger(mockPinoLogger, LOG_LEVEL.DEBUG)

      sut.track(LOG_LEVEL.DEBUG, 'debug without context', null)

      expect(mockPinoLogger.debug).toHaveBeenCalledOnce()
      expect(mockPinoLogger.debug).toHaveBeenCalledWith({}, 'debug without context')
    })
  })
})
