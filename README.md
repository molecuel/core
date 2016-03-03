# mlcl_core

Molecuel base server module. This modules activates the basic express.js features to the molecuel CMS boilerplate.

## Logging

To activate logging add
molecuel.log.pathdebug = true;
to your config.

## Events

- mlcl::core::init:server:
Will be emitted when a server listener instance has been created
Arguments: (molecuel: Molecuel, server: Express.e)
