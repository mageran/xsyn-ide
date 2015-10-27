#xsyn-ide

xsyn-ide is a simple, web-based ide for the [node-xsyn](http://github.com/mageran/node-xsyn) package, which provides support for authoring domain-specific languages (DSLs) and integrate them seamlessly into nodejs. In its current version, the xsyn-ide tool is meant to be run in a single-user mode, as it accesses files in your local filesystem. In future version, we will add multi-user capability.

## Quick Start

The package consists of a webserver written in [nodejs](https://nodejs.org) that serves an [Angularjs](https://angularjs.org/)-based client.

### Installation
On the command line use
<code>
npm install
</code>
and
<code>
bower install
</code>
to install the node and bower components used in the package. (Note that for the moment some node packages are installed that are actually not used in the current version, but probably will be in future ones.)

### Starting the server

On the command line use

<code>
node server.js [-p <port>] 
</code>

To start the server and point your browser to http://localhost:9292. You probably have guessed that you can change the port number with the -p option. There are a couple of more options, which we will explain later.

