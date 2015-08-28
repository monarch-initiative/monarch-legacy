// Utility function to determine NodeJS vs RingoJS runtime environment
function isRingoJS() {
  return (typeof(org) != 'undefined' && typeof(org.ringo) != 'undefined' );
}
var fs = require('fs');
var fs_existsSync = isRingoJS() ?
                        function(path) {
                          var result = fs.exists(path);
                          return result;
                        }
                      :
                        function(path) {
                          return fs.existsSync(path);
                        };
var fs_readFileSync = isRingoJS() ?
                        function(path) {
                          var result = fs.read(path);
                          return result;
                        }
                      :
                        function(path) {
                          return fs.readFileSync(path);
                        };
var fs_readFileSyncBinary = isRingoJS() ?
                        function(path) {
                          var result = fs.read(path, {binary:true});
                          return result;
                        }
                      :
                        function(path) {
                          return fs.readFileSync(path);
                        };
var fs_writeFileSync = isRingoJS() ?
                        function(path, content) {
                          var result = fs.write(path, content);
                          return result;
                        }
                      :
                        function(path, content) {
                          return fs.writeFileSync(path, content);
                        };
var fs_listTreeSync = isRingoJS() ?
                        function(path) {
                          var result = fs.listTree(path);
                          if (result && result.length > 0 && result[0] === '') {
                            result.shift();
                          }
                          return result;
                        }
                      :
                        function(path) {
                          var glob = require("glob");
                          var options = {
                            //nodir: true,
                            cwd: path
                          };
                          var rootPath = "**";
                          var files = glob.sync(rootPath, options);
                          return files;
                        };
var fs_unlinkSync = isRingoJS() ?
                        function(path) {
                          var result = fs.remove(path);
                          return result;
                        }
                      :
                        function(path) {
                          return fs.unlinkSync(path);
                        };

exports.isRingoJS = isRingoJS;
exports.fs_existsSync = fs_existsSync;
exports.fs_readFileSync = fs_readFileSync;
exports.fs_readFileSyncBinary = fs_readFileSyncBinary;
exports.fs_writeFileSync = fs_writeFileSync;
exports.fs_listTreeSync = fs_listTreeSync;
exports.fs_unlinkSync = fs_unlinkSync;

