import * as fs from 'node:fs'
import * as path from 'node:path'

import type { IFactory, ILoggerClient, LogLevel } from '@xeno-js/shared'
import { Guards, LOG_LEVEL } from '@xeno-js/shared'
import pino from 'pino'
import type SonicBoom from 'sonic-boom'

import { PinoLogger } from '../service/pino.logger'

export interface ExtendedPinoOptions {
  /**
   * @description Pino logger options for customizing the behavior of the Pino logger. This includes options like log level, redaction paths, and more. The options are passed to the Pino logger during initialization.
   * @type {pino.LoggerOptions}
   * @memberof ExtendedPinoOptions
   */
  pinoOptions?: pino.LoggerOptions
  /**
   * @description Flag indicating whether to enable pretty printing for the Pino logger. When set to true, the logger will output log messages in a human-readable format, making it easier to read and debug. Pretty printing is useful during development and testing.
   * @type {boolean}
   * @memberof ExtendedPinoOptions
   */
  prettyPrint?: boolean
  /**
   * @description log level string indicating the minimum log level to be captured by the Pino logger. The log level is defined in the LOG_LEVEL enum, which includes levels like 'debug', 'info', 'warn', 'error'. The logger will only capture log messages with a level equal to or higher than the specified minimum level. For example, if the logLevel is set to 'info', the logger will capture log messages with levels 'info', 'warn', and 'error', but not 'debug'.
   * @type {LogLevel}
   * @memberof ExtendedPinoOptions
   */
  logLevel?: LogLevel
  /**
   * @description Array of redact paths for sensitive data. The redactPaths array contains strings representing the paths of sensitive data that should be redacted (masked) in the log messages. Redacting sensitive data helps protect sensitive information from being logged and potentially exposed. The redactPaths array allows specifying the paths of sensitive data that should be redacted. For example, if the redactPaths array contains ['password', 'creditCard'], any occurrences of 'password' and 'creditCard' in the log messages will be redacted.
   * @type {string[]}
   * @memberof ExtendedPinoOptions
   */
  redactPaths?: string[]
  /**
   * @description Destination for log messages. The destination property specifies the destination for log messages. It can be either 'stdout' or 'file'. If set to 'stdout', log messages will be written to the standard output (console). If set to 'file', log messages will be written to a file specified by the filePath property. The destination property determines where the log messages will be written, providing flexibility in configuring the logging behavior.
   * @type {('stdout' | 'file')}
   * @memberof ExtendedPinoOptions
   */
  destination?: 'stdout' | 'file'
  /**
   * @description File path for log messages. The filePath property specifies the file path where log messages will be written if the destination property is set to 'file'. It determines the location of the log file. The filePath property is only relevant when the destination property is set to 'file'.
   * @type {string} 
   * @memberof ExtendedPinoOptions
   */
  filePath?: string
}

/**
 * @description Factory class responsible for creating instances of PinoLogger based on the provided configuration. It implements the IFactory interface, allowing for easy integration with dependency injection systems. The factory encapsulates the creation logic for the PinoLogger, including the initialization of the underlying Pino instance with the specified configuration options such as log level. This design promotes separation of concerns and allows for flexibility in managing PinoLogger instances across the application.
   * 
   * @author Xeno
   * @version 1.0.0
   * @since 2025-09-30
   * @link https://github.com/xeno-js/xeno-js 
   */
export class PinoLoggerFactory implements IFactory<
  ExtendedPinoOptions,
  ILoggerClient
> {
  public create(options: ExtendedPinoOptions): ILoggerClient {
    const minLevel = options.logLevel ?? LOG_LEVEL.DEBUG

    const defaultRedactPaths = [
      'password',
      'token',
      'authorization',
      'accessToken',
      'refreshToken',
      'secret',
      'cookie',
      'creditCard',
      '*.password',
      '*.token',
      'headers.authorization',
      'headers.cookie'
    ]

    const userRedact = Guards.isDefined(options.pinoOptions?.redact)
      ? (Guards.isArray(options.pinoOptions.redact) ? options.pinoOptions.redact : options.pinoOptions.redact.paths)
      : []

    const combinedRedact = Array.from(new Set([
      ...defaultRedactPaths,
      ...(options.redactPaths ?? []),
      ...(userRedact)
    ]))

    const destStream = this.setDestStream(options)
    const prettyPrint = options.prettyPrint ?? false
    const pinoStream = this.setPrettyPinoStream(prettyPrint, destStream)

    const mergedOptions: pino.LoggerOptions = {
      level: Guards.isNumber(minLevel) ? this.mapLogLevelToString(minLevel) : minLevel,
      ...options.pinoOptions,
      redact: {
        paths: combinedRedact,
        censor: "[REDACTED]",
        ...(Guards.isObject(options.pinoOptions?.redact) ? options.pinoOptions.redact : {}),
      },
      serializers: {
        error: pino.stdSerializers.err,
        err: pino.stdSerializers.err,
        ...(options.pinoOptions?.serializers ?? {}),
      },
    }

    return new PinoLogger(pino(mergedOptions, pinoStream))
  }

  private setPrettyPinoStream(prettyPrint: boolean, pinoStream: SonicBoom) {
    if (prettyPrint) {
      return pino.transport({
        target: 'pino-pretty',
        options: { translateTime: 'SYS:standard' }
      })
    }
    return pinoStream
  }

  private setDestStream(options: ExtendedPinoOptions) {
    if (options.destination === 'file') {
      const logFilePath = options.filePath ?? path.join(process.cwd(), 'logs', 'app.log')
      const logDir = path.dirname(logFilePath)

      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true })
      }
      return pino.destination(logFilePath)
    }
    return pino.destination(1)
  }

  private mapLogLevelToString(level: LogLevel): string {
    switch (level) {
      case LOG_LEVEL.DEBUG: return 'debug'
      case LOG_LEVEL.INFO: return 'info'
      case LOG_LEVEL.WARN: return 'warn'
      case LOG_LEVEL.ERROR: return 'error'
      default: return 'info'
    }
  }
}

