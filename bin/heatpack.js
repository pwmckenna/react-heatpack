#!/usr/bin/env node

var fs = require('fs')
var path = require('path')
var parseArgs  = require('minimist')
var tmp = require('tmp')

var pkg = require('../package.json')
var config = require('../webpack.config')
var server = require('../server')

var args = parseArgs(process.argv.slice(2), {
  alias: {
    h: 'help',
    v: 'version',
    f: 'force'
  }
})

if (args.version) {
  console.log('v' + pkg.version)
  process.exit(0)
}

if (args.help || args._.length === 0) {
  console.log('Usage: heatpack [options] script.js')
  console.log('')
  console.log('Options:')
  console.log('  -f, --force  Force heatpack to run the given script (disables React.render check)')
  process.exit(0)
}

var entryPath = path.join(process.cwd(), args._[0])

if (!args.force) {
  var code = fs.readFileSync(entryPath).toString()
  if (code.indexOf('React.render') === -1) {
    console.log("Couldn't find React.render in " + entryPath + " - assuming it exports a React component.")
    var tempFile = tmp.fileSync({prefix: 'heatpack-', postfix: '.js'})
    var componentPath = entryPath.replace(/\\/g, '\\\\')
    fs.writeSync(tempFile.fd, [
      "var React = require('react')",
      "var Component = require('" + componentPath + "')",
      "React.render(<Component/>, document.querySelector('#app'))"
    ].join('\n'))
    entryPath = tempFile.name
  }
}

config.entry.push(entryPath)
server(config)
