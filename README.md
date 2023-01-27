# papertrail-winston-transport

A Papertrail transport for [winston v3][0].

Papertrail [recommends][2] that you use [Syslog][3] for use with winston v3, however that has some drawbacks.
Namely, Syslog has its own set of log levels, lacking levels like 'silly' and 'verbose'. This library attempts
to simplify the Papertrail connection, and can be used as a simple Winston v3 transport.

This is based off of [winston-papertrail][1], which stopped working for winston v3.


## Installation

### Installing

``` bash
  $ npm i papertrail-winston-transport
```

There are a few required options for logging to Papertrail:

* __host:__ FQDN or IP Address of the Papertrail Service Endpoint
* __port:__ The Endpoint TCP Port


## Usage
```typescript
  import winston from "winston"
  import { PapertrailTransport } from "papertrail-winston-transport

  const logger = winston.createLogger({
    transports: [
      new PapertrailTransport({
        format: winston.format.combine(
          winston.format.colorize({
            level: true,
          }),
          winston.format.simple(),
        ),
        host: "logs.papertrailapp.com",
        port: 12345,
      }),
    ],
  })

  logger.silly("Silly log statement")
  logger.debug("Debug log statement")
```

#### Author: [Mike Richards](https://twitter.com/MMRichards)

[0]: https://www.npmjs.com/package/winston
[1]: https://www.npmjs.com/package/winston-papertrail
[2]: https://www.papertrail.com/help/configuring-centralized-logging-from-nodejs-apps/
[3]: https://www.npmjs.com/package/winston-syslog
