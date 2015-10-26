#xsyn-ide

xsyn-ide is a simple, web-based ide for the [node-xsyn](http://github.com/mageran/node-xsyn) package, which provides support for authoring domain-specific languages (DSLs) and integrate them seamlessly into nodejs. In its current version, the tools is meant to be run in a single-user mode, as it accesses files in your local filesystem. In future version, we will add multi-user capability.

## Quick Start

The package consists of a webserver written in [nodejs](https://nodejs.org) that serves an [Angularjs](https://angularjs.org/)-based client.