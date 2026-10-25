<div align="center">
  <img src="logo/logo.png" alt="Xeno.JS Logo" width="140" />

  <h1>Xeno.JS Pino</h1>
  <p><strong>A Typescript application framework architecture for Node.js, designed for lower technical debt, and faster infrastructure migrations.</strong></p>
  <p>Build long-lived applications with explicit dependency injection, DDD, CQRS, and transport-independent business logic.</p>

  <p>
    <a href="https://www.npmjs.com/package/@xeno-js/pino"><img src="https://img.shields.io/npm/v/@xeno-js/pino?style=flat-square" alt="NPM Version" /></a>
    <a href="https://github.com/xeno-js/pino"><img src="https://img.shields.io/badge/Powered%20by-Xeno-blueviolet?style=flat-square" alt="Powered by Xeno" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License: MIT" /></a>
    <a href="https://buymeacoffee.com/xenojs">
      <img src="https://img.shields.io/badge/Buy%20Me%20A%20Coffee-Support-FFdd00?style=flat-square&logo=buy-me-a-coffee&logoColor=black" alt="Buy Me A Coffee" />
    </a>
  </p>
</div>

---

---

`@xeno-js/pino` integrates [Pino](https://github.com/pinojs/pino) as the structured logging provider for the Xeno.JS ecosystem. It acts as an adapter implementing core logging contracts, ensuring applications produce high-performance JSON logs with built-in data masking.

## Installation

```bash
npm install @xeno-js/pino pino pino-pretty

```

The package requires `@xeno-js/core` and `@xeno-js/shared` as peer dependencies.

---

## 1. Logger Plugin Configuration and Pino Integration

**Problem.** Enterprise applications require fast, structured logging with built-in protection against leaking sensitive data (such as passwords, tokens, and authorization headers) into log files.

**Principle.** Logging infrastructure must be configured explicitly through the application builder, decoupling logging providers from business logic while enforcing global redaction and transport options.

**Mechanism.** The `withPinoLogger` function exposes a logger plugin that uses `PinoLoggerFactory` to instantiate a configured `PinoLogger` client, registering it into the framework via `LoggerSetup`.

**Implementation:**

```ts
import { XenoAppBuilder } from '@xeno-js/core';
import { withPinoLogger } from '@xeno-js/pino';

const app = await new XenoAppBuilder()
  .addLogger(
    withPinoLogger((options, config) => {
      options.isEnabled = true;
      options.logLevel = 'info';
      options.prettyPrint = true; // Useful for development
      options.destination = 'stdout';
    })
  )
  .build();

```

**Behavior:** During bootstrap, the plugin evaluates configuration options, configures default and custom redaction paths (masking fields like `password`, `token`, and `authorization` with `[REDACTED]`), and directs output streams to either standard output or log files.

**Boundary:** This package handles logging serialization, formatting, and stream transport. It does not manage log aggregation services or external log collector daemons.

---

## 2. Structured Logging and Level Filtering (`PinoLogger`)

**Problem.** Unfiltered log verbosity impacts performance and fills log storage with low-priority debug events during production runs.

**Principle.** Log messages must be filtered based on minimum threshold levels and support structured context payloads alongside optional error objects.

**Mechanism:** `PinoLogger` implements the `ILoggerClient` interface, mapping severity levels (`DEBUG`, `INFO`, `WARN`, `ERROR`) and filtering out events below the configured `minLevel`. It normalizes error objects using Pino standard serializers.

**Implementation:**

The logger is resolved automatically by the framework or injected into services:

```ts
import { TOKENS, LOG_LEVEL } from '@xeno-js/core';

// Inside a service or handler
const logger = container.resolve(TOKENS.LOGGER);
logger.track(LOG_LEVEL.INFO, 'User logged in successfully', { userId: 'usr_123' });

```

**Behavior:** When `track` is invoked, `PinoLogger` checks if the message severity meets or exceeds the minimum threshold. If approved, it merges contextual data, appends serialized errors if present, and delegates output to the underlying Pino instance.

**Boundary:** `PinoLogger` translates application log calls into Pino format. It relies on the underlying Pino library for stream writing and output formatting.

---

## License

Released under the MIT [License](LICENSE).
