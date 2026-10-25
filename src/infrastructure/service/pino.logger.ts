import type { ILoggerClient } from '@xeno-js/shared'
import type { LogLevel, Optional } from '@xeno-js/shared'
import { Guards, LOG_LEVEL } from '@xeno-js/shared'
import type { Logger } from 'pino'

/**
 * @description Class that implements the ILoggerClient interface using the Pino logging library. This class serves as an adapter between the ILoggerClient interface and the Pino logging library, allowing the use of Pino as a logging provider within the application's architecture without directly coupling the code to the specific logging framework.
 * 
 * @author Xeno
 * @version 1.0.0
 * @since 2025-09-30
 * @link https://github.com/xeno-js/xeno-js 
 */
export class PinoLogger implements ILoggerClient {
  /**
   * Constructs a new instance of the PinoTransport class, which takes an optional minimum log level and an optional instance of the Pino logger. If no logger instance is provided, it initializes a new Pino logger with default settings. The minimum log level determines the threshold for logging messages, where messages with a log level below the specified minimum will be ignored.
   * @param _logger The Pino logger instance used for logging messages.
   * @param _minLevel The minimum log level for logging messages. Messages with a log level below this threshold will not be logged. Default is LOG_LEVEL.DEBUG.
   * 
   * @author Xeno
   * @version 1.0.0
   * @since 2025-09-30
   * @link https://github.com/xeno-js/xeno-js 
   */
  constructor(
    private readonly _logger: Logger,
    private readonly _minLevel: LogLevel = LOG_LEVEL.DEBUG,
  ) {}

  public track<T>(
    level: LogLevel,
    message: string,
    context: T,
    error: Optional<unknown> = undefined,
  ): void {
    if (level < this._minLevel) return

    const payload = Guards.isDefined(error) ? { ...context, error } : context

    switch (level) {
      case LOG_LEVEL.ERROR:
        this._logger.error(payload ?? {}, message)
        break
      case LOG_LEVEL.WARN:
        this._logger.warn(payload ?? {}, message)
        break
      case LOG_LEVEL.DEBUG:
        this._logger.debug(payload ?? {}, message)
        break
      default:
        this._logger.info(payload ?? {}, message)
        break
    }
  }
}
