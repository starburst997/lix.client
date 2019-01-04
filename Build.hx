using haxe.io.Path;

class Build {
  static function main() {
    var cwd = Sys.getCwd();
    Sys.command('haxe', ['haxeshim.hxml']);
    Sys.command('chmod', ['+x', '${cwd}bin/haxelibshim.js']);
    Sys.command('chmod', ['+x', '${cwd}bin/haxeshim.js']);
    Sys.command('chmod', ['+x', '${cwd}bin/lix.js']);
    Sys.command('chmod', ['+x', '${cwd}bin/nekoshim.js']);
    Sys.command('chmod', ['+x', '${cwd}bin/postinstall.js']);
    Sys.command('haxe', ['lix.cli.hxml']);
    for (file in sys.FileSystem.readDirectory('bin')) {
      if(file.extension() == 'js') {
        var file = 'bin/$file';
        var tmp = '$file.bundled';
        Sys.command('npm run --silent noderify $file > $tmp');
        sys.FileSystem.rename(tmp, file);
      }
    }
    Sys.command('chmod', ['+x', '${cwd}bin/haxelibshim.js']);
    Sys.command('chmod', ['+x', '${cwd}bin/haxeshim.js']);
    Sys.command('chmod', ['+x', '${cwd}bin/lix.js']);
    Sys.command('chmod', ['+x', '${cwd}bin/nekoshim.js']);
    Sys.command('chmod', ['+x', '${cwd}bin/postinstall.js']);
  }
}