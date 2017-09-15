var fs = require('fs');
var fs_existsSync = function(path) {
                          return fs.existsSync(path);
                        };
var fs_readFileSync = function(path) {
                          return fs.readFileSync(path);
                        };
var fs_readFileSyncBinary = function(path) {
                          return fs.readFileSync(path);
                        };
var fs_writeFileSync = function(path, content) {
                          return fs.writeFileSync(path, content);
                        };
var fs_appendFileSync = function(path, content) {
                          return fs.appendFileSync(path, content);
                        };
var fs_listTreeSync = function(path) {
                          var glob = require("glob");
                          var options = {
                            //nodir: true,
                            cwd: path
                          };
                          var rootPath = "**";
                          var files = glob.sync(rootPath, options);
                          return files;
                        };
var fs_unlinkSync = function(path) {
                          return fs.unlinkSync(path);
                        };

var getArgv = function() {
                          return process.argv.slice(1);
                        };

var getEnv = function() {
                          return process.env;
                        };

var exitProcess = function(code) {
                          process.exit(code);
                        };

function readJSON(filename) {
  return JSON.parse(fs_readFileSync(filename));
}

exports.getArgv = getArgv;
exports.getEnv = getEnv;
exports.exitProcess = exitProcess;
exports.readJSON = readJSON;
exports.fs_existsSync = fs_existsSync;
exports.fs_readFileSync = fs_readFileSync;
exports.fs_readFileSyncBinary = fs_readFileSyncBinary;
exports.fs_writeFileSync = fs_writeFileSync;
exports.fs_appendFileSync = fs_appendFileSync;
exports.fs_listTreeSync = fs_listTreeSync;
exports.fs_unlinkSync = fs_unlinkSync;

