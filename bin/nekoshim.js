#! /usr/bin/env node
(function prelude(content, deps, entry) {
  var cache = {}

  function load (file) {
    var d = deps[file]
    if(cache[file]) return cache[file].exports
    if(!d) return require(file)
    var fn = content[d[0]] //the actual module
    var module = cache[file] = {exports: {}, parent: file !== entry}
    cache[file] = module
    var resolved = require('path').resolve(file)
    var dirname = require('path').dirname(resolved)
    fn(
      function (m) {
        if(!d[1][m]) return require(m)
        else         return load (d[1][m])
      },
      module,
      module.exports,
      dirname,
      resolved
    )
    return cache[file].exports
  }

  return load(entry)
})({
"/PWO1pM5lLwyqdlyaovRHUOu+lELk9nNqLmH97GuFYg=":
function (require, module, exports, __dirname, __filename) {
'use strict'

// tar -x
const hlo = require('./high-level-opt.js')
const Unpack = require('./unpack.js')
const fs = require('fs')
const path = require('path')

const x = module.exports = (opt_, files, cb) => {
  if (typeof opt_ === 'function')
    cb = opt_, files = null, opt_ = {}
  else if (Array.isArray(opt_))
    files = opt_, opt_ = {}

  if (typeof files === 'function')
    cb = files, files = null

  if (!files)
    files = []
  else
    files = Array.from(files)

  const opt = hlo(opt_)

  if (opt.sync && typeof cb === 'function')
    throw new TypeError('callback not supported for sync tar functions')

  if (!opt.file && typeof cb === 'function')
    throw new TypeError('callback only supported with file option')

  if (files.length)
    filesFilter(opt, files)

  return opt.file && opt.sync ? extractFileSync(opt)
    : opt.file ? extractFile(opt, cb)
    : opt.sync ? extractSync(opt)
    : extract(opt)
}

// construct a filter that limits the file entries listed
// include child entries if a dir is included
const filesFilter = (opt, files) => {
  const map = new Map(files.map(f => [f.replace(/\/+$/, ''), true]))
  const filter = opt.filter

  const mapHas = (file, r) => {
    const root = r || path.parse(file).root || '.'
    const ret = file === root ? false
      : map.has(file) ? map.get(file)
      : mapHas(path.dirname(file), root)

    map.set(file, ret)
    return ret
  }

  opt.filter = filter
    ? (file, entry) => filter(file, entry) && mapHas(file.replace(/\/+$/, ''))
    : file => mapHas(file.replace(/\/+$/, ''))
}

const extractFileSync = opt => {
  const u = new Unpack.Sync(opt)

  const file = opt.file
  let threw = true
  let fd
  try {
    const stat = fs.statSync(file)
    const readSize = opt.maxReadSize || 16*1024*1024
    if (stat.size < readSize)
      u.end(fs.readFileSync(file))
    else {
      let pos = 0
      const buf = Buffer.allocUnsafe(readSize)
      fd = fs.openSync(file, 'r')
      while (pos < stat.size) {
        let bytesRead = fs.readSync(fd, buf, 0, readSize, pos)
        pos += bytesRead
        u.write(buf.slice(0, bytesRead))
      }
      u.end()
      fs.closeSync(fd)
    }
    threw = false
  } finally {
    if (threw && fd)
      try { fs.closeSync(fd) } catch (er) {}
  }
}

const extractFile = (opt, cb) => {
  const u = new Unpack(opt)
  const readSize = opt.maxReadSize || 16*1024*1024

  const file = opt.file
  const p = new Promise((resolve, reject) => {
    u.on('error', reject)
    u.on('close', resolve)

    fs.stat(file, (er, stat) => {
      if (er)
        reject(er)
      else if (stat.size < readSize)
        fs.readFile(file, (er, data) => {
          if (er)
            return reject(er)
          u.end(data)
        })
      else {
        const stream = fs.createReadStream(file, {
          highWaterMark: readSize
        })
        stream.on('error', reject)
        stream.pipe(u)
      }
    })
  })
  return cb ? p.then(cb, cb) : p
}

const extractSync = opt => {
  return new Unpack.Sync(opt)
}

const extract = opt => {
  return new Unpack(opt)
}

},
"1YryHLBRiGTQxQV0LRr3HlteHxQvTA8nNTqg9DGmFtQ=":
function (require, module, exports, __dirname, __filename) {
/* eslint-disable node/no-deprecated-api */
var buffer = require('buffer')
var Buffer = buffer.Buffer

// alternative to using Object.keys for old browsers
function copyProps (src, dst) {
  for (var key in src) {
    dst[key] = src[key]
  }
}
if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
  module.exports = buffer
} else {
  // Copy properties from require('buffer')
  copyProps(buffer, exports)
  exports.Buffer = SafeBuffer
}

function SafeBuffer (arg, encodingOrOffset, length) {
  return Buffer(arg, encodingOrOffset, length)
}

// Copy static methods from Buffer
copyProps(Buffer, SafeBuffer)

SafeBuffer.from = function (arg, encodingOrOffset, length) {
  if (typeof arg === 'number') {
    throw new TypeError('Argument must not be a number')
  }
  return Buffer(arg, encodingOrOffset, length)
}

SafeBuffer.alloc = function (size, fill, encoding) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  var buf = Buffer(size)
  if (fill !== undefined) {
    if (typeof encoding === 'string') {
      buf.fill(fill, encoding)
    } else {
      buf.fill(fill)
    }
  } else {
    buf.fill(0)
  }
  return buf
}

SafeBuffer.allocUnsafe = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return Buffer(size)
}

SafeBuffer.allocUnsafeSlow = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return buffer.SlowBuffer(size)
}

},
"2AFNYz4lSXwSlQQf3/eWu6omuc8tXeaHDhk7oeZQsP4=":
function (require, module, exports, __dirname, __filename) {
'use strict'

// tar -c
const hlo = require('./high-level-opt.js')

const Pack = require('./pack.js')
const fs = require('fs')
const t = require('./list.js')
const path = require('path')

const c = module.exports = (opt_, files, cb) => {
  if (typeof files === 'function')
    cb = files

  if (Array.isArray(opt_))
    files = opt_, opt_ = {}

  if (!files || !Array.isArray(files) || !files.length)
    throw new TypeError('no files or directories specified')

  files = Array.from(files)

  const opt = hlo(opt_)

  if (opt.sync && typeof cb === 'function')
    throw new TypeError('callback not supported for sync tar functions')

  if (!opt.file && typeof cb === 'function')
    throw new TypeError('callback only supported with file option')

  return opt.file && opt.sync ? createFileSync(opt, files)
    : opt.file ? createFile(opt, files, cb)
    : opt.sync ? createSync(opt, files)
    : create(opt, files)
}

const createFileSync = (opt, files) => {
  const p = new Pack.Sync(opt)

  let threw = true
  let fd
  try {
    fd = fs.openSync(opt.file, 'w', opt.mode || 0o666)
    p.on('data', chunk => fs.writeSync(fd, chunk, 0, chunk.length))
    p.on('end', _ => fs.closeSync(fd))
    addFilesSync(p, files)
    threw = false
  } finally {
    if (threw)
      try { fs.closeSync(fd) } catch (er) {}
  }
}

const createFile = (opt, files, cb) => {
  const p = new Pack(opt)
  const stream = fs.createWriteStream(opt.file, { mode: opt.mode || 0o666 })
  p.pipe(stream)

  const promise = new Promise((res, rej) => {
    stream.on('error', rej)
    stream.on('close', res)
    p.on('error', rej)
  })

  addFilesAsync(p, files)

  return cb ? promise.then(cb, cb) : promise
}

const addFilesSync = (p, files) => {
  files.forEach(file => {
    if (file.charAt(0) === '@')
      t({
        file: path.resolve(p.cwd, file.substr(1)),
        sync: true,
        noResume: true,
        onentry: entry => p.add(entry)
      })
    else
      p.add(file)
  })
  p.end()
}

const addFilesAsync = (p, files) => {
  while (files.length) {
    const file = files.shift()
    if (file.charAt(0) === '@')
      return t({
        file: path.resolve(p.cwd, file.substr(1)),
        noResume: true,
        onentry: entry => p.add(entry)
      }).then(_ => addFilesAsync(p, files))
    else
      p.add(file)
  }
  p.end()
}

const createSync = (opt, files) => {
  const p = new Pack.Sync(opt)
  addFilesSync(p, files)
  return p
}

const create = (opt, files) => {
  const p = new Pack(opt)
  addFilesAsync(p, files)
  return p
}

},
"2qKOuoyDrIbn3tXU28MnQI6TzoWc0B5TyIq68LcLqd4=":
function (require, module, exports, __dirname, __filename) {
'use strict'

// XXX: This shares a lot in common with extract.js
// maybe some DRY opportunity here?

// tar -t
const hlo = require('./high-level-opt.js')
const Parser = require('./parse.js')
const fs = require('fs')
const path = require('path')

const t = module.exports = (opt_, files, cb) => {
  if (typeof opt_ === 'function')
    cb = opt_, files = null, opt_ = {}
  else if (Array.isArray(opt_))
    files = opt_, opt_ = {}

  if (typeof files === 'function')
    cb = files, files = null

  if (!files)
    files = []
  else
    files = Array.from(files)

  const opt = hlo(opt_)

  if (opt.sync && typeof cb === 'function')
    throw new TypeError('callback not supported for sync tar functions')

  if (!opt.file && typeof cb === 'function')
    throw new TypeError('callback only supported with file option')

  if (files.length)
    filesFilter(opt, files)

  if (!opt.noResume)
    onentryFunction(opt)

  return opt.file && opt.sync ? listFileSync(opt)
    : opt.file ? listFile(opt, cb)
    : list(opt)
}

const onentryFunction = opt => {
  const onentry = opt.onentry
  opt.onentry = onentry ? e => {
    onentry(e)
    e.resume()
  } : e => e.resume()
}

// construct a filter that limits the file entries listed
// include child entries if a dir is included
const filesFilter = (opt, files) => {
  const map = new Map(files.map(f => [f.replace(/\/+$/, ''), true]))
  const filter = opt.filter

  const mapHas = (file, r) => {
    const root = r || path.parse(file).root || '.'
    const ret = file === root ? false
      : map.has(file) ? map.get(file)
      : mapHas(path.dirname(file), root)

    map.set(file, ret)
    return ret
  }

  opt.filter = filter
    ? (file, entry) => filter(file, entry) && mapHas(file.replace(/\/+$/, ''))
    : file => mapHas(file.replace(/\/+$/, ''))
}

const listFileSync = opt => {
  const p = list(opt)
  const file = opt.file
  let threw = true
  let fd
  try {
    const stat = fs.statSync(file)
    const readSize = opt.maxReadSize || 16*1024*1024
    if (stat.size < readSize) {
      p.end(fs.readFileSync(file))
    } else {
      let pos = 0
      const buf = Buffer.allocUnsafe(readSize)
      fd = fs.openSync(file, 'r')
      while (pos < stat.size) {
        let bytesRead = fs.readSync(fd, buf, 0, readSize, pos)
        pos += bytesRead
        p.write(buf.slice(0, bytesRead))
      }
      p.end()
    }
    threw = false
  } finally {
    if (threw && fd)
      try { fs.closeSync(fd) } catch (er) {}
  }
}

const listFile = (opt, cb) => {
  const parse = new Parser(opt)
  const readSize = opt.maxReadSize || 16*1024*1024

  const file = opt.file
  const p = new Promise((resolve, reject) => {
    parse.on('error', reject)
    parse.on('end', resolve)

    fs.stat(file, (er, stat) => {
      if (er)
        reject(er)
      else if (stat.size < readSize)
        fs.readFile(file, (er, data) => {
          if (er)
            return reject(er)
          parse.end(data)
        })
      else {
        const stream = fs.createReadStream(file, {
          highWaterMark: readSize
        })
        stream.on('error', reject)
        stream.pipe(parse)
      }
    })
  })
  return cb ? p.then(cb, cb) : p
}

const list = opt => new Parser(opt)

},
"39auA/ChIrXzl5bJCoTtocYeasO+Ss+LyEMmA9wcX/U=":
function (require, module, exports, __dirname, __filename) {
var fs = require('fs');
var util = require('util');
var stream = require('stream');
var Readable = stream.Readable;
var Writable = stream.Writable;
var PassThrough = stream.PassThrough;
var Pend = require('pend');
var EventEmitter = require('events').EventEmitter;

exports.createFromBuffer = createFromBuffer;
exports.createFromFd = createFromFd;
exports.BufferSlicer = BufferSlicer;
exports.FdSlicer = FdSlicer;

util.inherits(FdSlicer, EventEmitter);
function FdSlicer(fd, options) {
  options = options || {};
  EventEmitter.call(this);

  this.fd = fd;
  this.pend = new Pend();
  this.pend.max = 1;
  this.refCount = 0;
  this.autoClose = !!options.autoClose;
}

FdSlicer.prototype.read = function(buffer, offset, length, position, callback) {
  var self = this;
  self.pend.go(function(cb) {
    fs.read(self.fd, buffer, offset, length, position, function(err, bytesRead, buffer) {
      cb();
      callback(err, bytesRead, buffer);
    });
  });
};

FdSlicer.prototype.write = function(buffer, offset, length, position, callback) {
  var self = this;
  self.pend.go(function(cb) {
    fs.write(self.fd, buffer, offset, length, position, function(err, written, buffer) {
      cb();
      callback(err, written, buffer);
    });
  });
};

FdSlicer.prototype.createReadStream = function(options) {
  return new ReadStream(this, options);
};

FdSlicer.prototype.createWriteStream = function(options) {
  return new WriteStream(this, options);
};

FdSlicer.prototype.ref = function() {
  this.refCount += 1;
};

FdSlicer.prototype.unref = function() {
  var self = this;
  self.refCount -= 1;

  if (self.refCount > 0) return;
  if (self.refCount < 0) throw new Error("invalid unref");

  if (self.autoClose) {
    fs.close(self.fd, onCloseDone);
  }

  function onCloseDone(err) {
    if (err) {
      self.emit('error', err);
    } else {
      self.emit('close');
    }
  }
};

util.inherits(ReadStream, Readable);
function ReadStream(context, options) {
  options = options || {};
  Readable.call(this, options);

  this.context = context;
  this.context.ref();

  this.start = options.start || 0;
  this.endOffset = options.end;
  this.pos = this.start;
  this.destroyed = false;
}

ReadStream.prototype._read = function(n) {
  var self = this;
  if (self.destroyed) return;

  var toRead = Math.min(self._readableState.highWaterMark, n);
  if (self.endOffset != null) {
    toRead = Math.min(toRead, self.endOffset - self.pos);
  }
  if (toRead <= 0) {
    self.destroyed = true;
    self.push(null);
    self.context.unref();
    return;
  }
  self.context.pend.go(function(cb) {
    if (self.destroyed) return cb();
    var buffer = new Buffer(toRead);
    fs.read(self.context.fd, buffer, 0, toRead, self.pos, function(err, bytesRead) {
      if (err) {
        self.destroy(err);
      } else if (bytesRead === 0) {
        self.destroyed = true;
        self.push(null);
        self.context.unref();
      } else {
        self.pos += bytesRead;
        self.push(buffer.slice(0, bytesRead));
      }
      cb();
    });
  });
};

ReadStream.prototype.destroy = function(err) {
  if (this.destroyed) return;
  err = err || new Error("stream destroyed");
  this.destroyed = true;
  this.emit('error', err);
  this.context.unref();
};

util.inherits(WriteStream, Writable);
function WriteStream(context, options) {
  options = options || {};
  Writable.call(this, options);

  this.context = context;
  this.context.ref();

  this.start = options.start || 0;
  this.endOffset = (options.end == null) ? Infinity : +options.end;
  this.bytesWritten = 0;
  this.pos = this.start;
  this.destroyed = false;

  this.on('finish', this.destroy.bind(this));
}

WriteStream.prototype._write = function(buffer, encoding, callback) {
  var self = this;
  if (self.destroyed) return;

  if (self.pos + buffer.length > self.endOffset) {
    var err = new Error("maximum file length exceeded");
    err.code = 'ETOOBIG';
    self.destroy();
    callback(err);
    return;
  }
  self.context.pend.go(function(cb) {
    if (self.destroyed) return cb();
    fs.write(self.context.fd, buffer, 0, buffer.length, self.pos, function(err, bytes) {
      if (err) {
        self.destroy();
        cb();
        callback(err);
      } else {
        self.bytesWritten += bytes;
        self.pos += bytes;
        self.emit('progress');
        cb();
        callback();
      }
    });
  });
};

WriteStream.prototype.destroy = function() {
  if (this.destroyed) return;
  this.destroyed = true;
  this.context.unref();
};

util.inherits(BufferSlicer, EventEmitter);
function BufferSlicer(buffer) {
  EventEmitter.call(this);

  this.refCount = 0;
  this.buffer = buffer;
}

BufferSlicer.prototype.read = function(buffer, offset, length, position, callback) {
  var end = position + length;
  var delta = end - this.buffer.length;
  var written = (delta > 0) ? delta : length;
  this.buffer.copy(buffer, offset, position, end);
  setImmediate(function() {
    callback(null, written);
  });
};

BufferSlicer.prototype.write = function(buffer, offset, length, position, callback) {
  buffer.copy(this.buffer, position, offset, offset + length);
  setImmediate(function() {
    callback(null, length, buffer);
  });
};

BufferSlicer.prototype.createReadStream = function(options) {
  options = options || {};
  var readStream = new PassThrough(options);
  readStream.start = options.start || 0;
  readStream.endOffset = options.end;
  readStream.pos = readStream.endOffset || this.buffer.length; // yep, we're already done
  readStream.destroyed = false;
  readStream.write(this.buffer.slice(readStream.start, readStream.pos));
  readStream.end();
  readStream.destroy = function() {
    readStream.destroyed = true;
  };
  return readStream;
};

BufferSlicer.prototype.createWriteStream = function(options) {
  var bufferSlicer = this;
  options = options || {};
  var writeStream = new Writable(options);
  writeStream.start = options.start || 0;
  writeStream.endOffset = (options.end == null) ? this.buffer.length : +options.end;
  writeStream.bytesWritten = 0;
  writeStream.pos = writeStream.start;
  writeStream.destroyed = false;
  writeStream._write = function(buffer, encoding, callback) {
    if (writeStream.destroyed) return;

    var end = writeStream.pos + buffer.length;
    if (end > writeStream.endOffset) {
      var err = new Error("maximum file length exceeded");
      err.code = 'ETOOBIG';
      writeStream.destroyed = true;
      callback(err);
      return;
    }
    buffer.copy(bufferSlicer.buffer, writeStream.pos, 0, buffer.length);

    writeStream.bytesWritten += buffer.length;
    writeStream.pos = end;
    writeStream.emit('progress');
    callback();
  };
  writeStream.destroy = function() {
    writeStream.destroyed = true;
  };
  return writeStream;
};

BufferSlicer.prototype.ref = function() {
  this.refCount += 1;
};

BufferSlicer.prototype.unref = function() {
  this.refCount -= 1;

  if (this.refCount < 0) {
    throw new Error("invalid unref");
  }
};

function createFromBuffer(buffer) {
  return new BufferSlicer(buffer);
}

function createFromFd(fd, options) {
  return new FdSlicer(fd, options);
}

},
"3cvmAZk8FK1SBh8Ge8NUCWlDUWArxUeTcVe2v8XYctY=":
function (require, module, exports, __dirname, __filename) {
'use strict'

const assert = require('assert')
const EE = require('events').EventEmitter
const Parser = require('./parse.js')
const fs = require('fs')
const path = require('path')
const mkdir = require('./mkdir.js')
const mkdirSync = mkdir.sync
const wc = require('./winchars.js')

const ONENTRY = Symbol('onEntry')
const CHECKFS = Symbol('checkFs')
const MAKEFS = Symbol('makeFs')
const FILE = Symbol('file')
const DIRECTORY = Symbol('directory')
const LINK = Symbol('link')
const SYMLINK = Symbol('symlink')
const HARDLINK = Symbol('hardlink')
const UNSUPPORTED = Symbol('unsupported')
const UNKNOWN = Symbol('unknown')
const CHECKPATH = Symbol('checkPath')
const MKDIR = Symbol('mkdir')
const ONERROR = Symbol('onError')
const PENDING = Symbol('pending')
const PEND = Symbol('pend')
const UNPEND = Symbol('unpend')
const ENDED = Symbol('ended')
const MAYBECLOSE = Symbol('maybeClose')
const SKIP = Symbol('skip')
const DOCHOWN = Symbol('doChown')
const UID = Symbol('uid')
const GID = Symbol('gid')

class Unpack extends Parser {
  constructor (opt) {
    if (!opt)
      opt = {}

    opt.ondone = _ => {
      this[ENDED] = true
      this[MAYBECLOSE]()
    }

    super(opt)

    this.writable = true
    this.readable = false

    this[PENDING] = 0
    this[ENDED] = false

    this.dirCache = opt.dirCache || new Map()

    if (typeof opt.uid === 'number' || typeof opt.gid === 'number') {
      // need both or neither
      if (typeof opt.uid !== 'number' || typeof opt.gid !== 'number')
        throw new TypeError('cannot set owner without number uid and gid')
      if (opt.preserveOwner)
        throw new TypeError(
          'cannot preserve owner in archive and also set owner explicitly')
      this.uid = opt.uid
      this.gid = opt.gid
      this.setOwner = true
    } else {
      this.uid = null
      this.gid = null
      this.setOwner = false
    }

    // default true for root
    if (opt.preserveOwner === undefined && typeof opt.uid !== 'number')
      this.preserveOwner = process.getuid && process.getuid() === 0
    else
      this.preserveOwner = !!opt.preserveOwner

    this.processUid = (this.preserveOwner || this.setOwner) && process.getuid ?
      process.getuid() : null
    this.processGid = (this.preserveOwner || this.setOwner) && process.getgid ?
      process.getgid() : null

    // turn ><?| in filenames into 0xf000-higher encoded forms
    this.win32 = !!opt.win32 || process.platform === 'win32'

    // do not unpack over files that are newer than what's in the archive
    this.newer = !!opt.newer

    // do not unpack over ANY files
    this.keep = !!opt.keep

    // do not set mtime/atime of extracted entries
    this.noMtime = !!opt.noMtime

    // allow .., absolute path entries, and unpacking through symlinks
    // without this, warn and skip .., relativize absolutes, and error
    // on symlinks in extraction path
    this.preservePaths = !!opt.preservePaths

    // unlink files and links before writing. This breaks existing hard
    // links, and removes symlink directories rather than erroring
    this.unlink = !!opt.unlink

    this.cwd = path.resolve(opt.cwd || process.cwd())
    this.strip = +opt.strip || 0
    this.processUmask = process.umask()
    this.umask = typeof opt.umask === 'number' ? opt.umask : this.processUmask
    // default mode for dirs created as parents
    this.dmode = opt.dmode || (0o0777 & (~this.umask))
    this.fmode = opt.fmode || (0o0666 & (~this.umask))
    this.on('entry', entry => this[ONENTRY](entry))
  }

  [MAYBECLOSE] () {
    if (this[ENDED] && this[PENDING] === 0) {
      this.emit('prefinish')
      this.emit('finish')
      this.emit('end')
      this.emit('close')
    }
  }

  [CHECKPATH] (entry) {
    if (this.strip) {
      const parts = entry.path.split(/\/|\\/)
      if (parts.length < this.strip)
        return false
      entry.path = parts.slice(this.strip).join('/')
    }

    if (!this.preservePaths) {
      const p = entry.path
      if (p.match(/(^|\/|\\)\.\.(\\|\/|$)/)) {
        this.warn('path contains \'..\'', p)
        return false
      }

      // absolutes on posix are also absolutes on win32
      // so we only need to test this one to get both
      if (path.win32.isAbsolute(p)) {
        const parsed = path.win32.parse(p)
        this.warn('stripping ' + parsed.root + ' from absolute path', p)
        entry.path = p.substr(parsed.root.length)
      }
    }

    // only encode : chars that aren't drive letter indicators
    if (this.win32) {
      const parsed = path.win32.parse(entry.path)
      entry.path = parsed.root === '' ? wc.encode(entry.path)
        : parsed.root + wc.encode(entry.path.substr(parsed.root.length))
    }

    if (path.isAbsolute(entry.path))
      entry.absolute = entry.path
    else
      entry.absolute = path.resolve(this.cwd, entry.path)

    return true
  }

  [ONENTRY] (entry) {
    if (!this[CHECKPATH](entry))
      return entry.resume()

    assert.equal(typeof entry.absolute, 'string')

    switch (entry.type) {
      case 'Directory':
      case 'GNUDumpDir':
        if (entry.mode)
          entry.mode = entry.mode | 0o700

      case 'File':
      case 'OldFile':
      case 'ContiguousFile':
      case 'Link':
      case 'SymbolicLink':
        return this[CHECKFS](entry)

      case 'CharacterDevice':
      case 'BlockDevice':
      case 'FIFO':
        return this[UNSUPPORTED](entry)
    }
  }

  [ONERROR] (er, entry) {
    // Cwd has to exist, or else nothing works. That's serious.
    // Other errors are warnings, which raise the error in strict
    // mode, but otherwise continue on.
    if (er.name === 'CwdError')
      this.emit('error', er)
    else {
      this.warn(er.message, er)
      this[UNPEND]()
      entry.resume()
    }
  }

  [MKDIR] (dir, mode, cb) {
    mkdir(dir, {
      uid: this.uid,
      gid: this.gid,
      processUid: this.processUid,
      processGid: this.processGid,
      umask: this.processUmask,
      preserve: this.preservePaths,
      unlink: this.unlink,
      cache: this.dirCache,
      cwd: this.cwd,
      mode: mode
    }, cb)
  }

  [DOCHOWN] (entry) {
    // in preserve owner mode, chown if the entry doesn't match process
    // in set owner mode, chown if setting doesn't match process
    return this.preserveOwner &&
      ( typeof entry.uid === 'number' && entry.uid !== this.processUid ||
        typeof entry.gid === 'number' && entry.gid !== this.processGid )
      ||
      ( typeof this.uid === 'number' && this.uid !== this.processUid ||
        typeof this.gid === 'number' && this.gid !== this.processGid )
  }

  [UID] (entry) {
    return typeof this.uid === 'number' ? this.uid
      : typeof entry.uid === 'number' ? entry.uid
      : this.processUid
  }

  [GID] (entry) {
    return typeof this.gid === 'number' ? this.gid
      : typeof entry.gid === 'number' ? entry.gid
      : this.processGid
  }

  [FILE] (entry) {
    const mode = entry.mode & 0o7777 || this.fmode
    const stream = fs.createWriteStream(entry.absolute, { mode: mode })
    stream.on('error', er => this[ONERROR](er, entry))

    const queue = []
    const processQueue = _ => {
      const action = queue.shift()
      if (action)
        action(processQueue)
      else
        this[UNPEND]()
    }

    stream.on('close', _ => {
      if (entry.mtime && !this.noMtime)
        queue.push(cb =>
          fs.utimes(entry.absolute, entry.atime || new Date(), entry.mtime, cb))
      if (this[DOCHOWN](entry))
        queue.push(cb =>
          fs.chown(entry.absolute, this[UID](entry), this[GID](entry), cb))
      processQueue()
    })
    entry.pipe(stream)
  }

  [DIRECTORY] (entry) {
    const mode = entry.mode & 0o7777 || this.dmode
    this[MKDIR](entry.absolute, mode, er => {
      if (er)
        return this[ONERROR](er, entry)

      const queue = []
      const processQueue = _ => {
        const action = queue.shift()
        if (action)
          action(processQueue)
        else {
          this[UNPEND]()
          entry.resume()
        }
      }

      if (entry.mtime && !this.noMtime)
        queue.push(cb =>
          fs.utimes(entry.absolute, entry.atime || new Date(), entry.mtime, cb))
      if (this[DOCHOWN](entry))
        queue.push(cb =>
          fs.chown(entry.absolute, this[UID](entry), this[GID](entry), cb))

      processQueue()
    })
  }

  [UNSUPPORTED] (entry) {
    this.warn('unsupported entry type: ' + entry.type, entry)
    entry.resume()
  }

  [SYMLINK] (entry) {
    this[LINK](entry, entry.linkpath, 'symlink')
  }

  [HARDLINK] (entry) {
    this[LINK](entry, path.resolve(this.cwd, entry.linkpath), 'link')
  }

  [PEND] () {
    this[PENDING]++
  }

  [UNPEND] () {
    this[PENDING]--
    this[MAYBECLOSE]()
  }

  [SKIP] (entry) {
    this[UNPEND]()
    entry.resume()
  }

  // check if a thing is there, and if so, try to clobber it
  [CHECKFS] (entry) {
    this[PEND]()
    this[MKDIR](path.dirname(entry.absolute), this.dmode, er => {
      if (er)
        return this[ONERROR](er, entry)
      fs.lstat(entry.absolute, (er, st) => {
        if (st && (this.keep || this.newer && st.mtime > entry.mtime))
          this[SKIP](entry)
        else if (er || (entry.type === 'File' && !this.unlink && st.isFile()))
          this[MAKEFS](null, entry)
        else if (st.isDirectory()) {
          if (entry.type === 'Directory') {
            if (!entry.mode || (st.mode & 0o7777) === entry.mode)
              this[MAKEFS](null, entry)
            else
              fs.chmod(entry.absolute, entry.mode, er => this[MAKEFS](er, entry))
          } else
            fs.rmdir(entry.absolute, er => this[MAKEFS](er, entry))
        } else
          fs.unlink(entry.absolute, er => this[MAKEFS](er, entry))
      })
    })
  }

  [MAKEFS] (er, entry) {
    if (er)
      return this[ONERROR](er, entry)

    switch (entry.type) {
      case 'File':
      case 'OldFile':
      case 'ContiguousFile':
        return this[FILE](entry)

      case 'Link':
        return this[HARDLINK](entry)

      case 'SymbolicLink':
        return this[SYMLINK](entry)

      case 'Directory':
      case 'GNUDumpDir':
        return this[DIRECTORY](entry)
    }
  }

  [LINK] (entry, linkpath, link) {
    // XXX: get the type ('file' or 'dir') for windows
    fs[link](linkpath, entry.absolute, er => {
      if (er)
        return this[ONERROR](er, entry)
      this[UNPEND]()
      entry.resume()
    })
  }
}

class UnpackSync extends Unpack {
  constructor (opt) {
    super(opt)
  }

  [CHECKFS] (entry) {
    const er = this[MKDIR](path.dirname(entry.absolute), this.dmode)
    if (er)
      return this[ONERROR](er, entry)
    try {
      const st = fs.lstatSync(entry.absolute)
      if (this.keep || this.newer && st.mtime > entry.mtime)
        return this[SKIP](entry)
      else if (entry.type === 'File' && !this.unlink && st.isFile())
        return this[MAKEFS](null, entry)
      else {
        try {
          if (st.isDirectory()) {
            if (entry.type === 'Directory') {
              if (entry.mode && (st.mode & 0o7777) !== entry.mode)
                fs.chmodSync(entry.absolute, entry.mode)
            } else
              fs.rmdirSync(entry.absolute)
          } else
            fs.unlinkSync(entry.absolute)
          return this[MAKEFS](null, entry)
        } catch (er) {
          return this[ONERROR](er, entry)
        }
      }
    } catch (er) {
      return this[MAKEFS](null, entry)
    }
  }

  [FILE] (entry) {
    const mode = entry.mode & 0o7777 || this.fmode
    try {
      const fd = fs.openSync(entry.absolute, 'w', mode)
      entry.on('data', buf => fs.writeSync(fd, buf, 0, buf.length, null))
      entry.on('end', _ => {
        if (entry.mtime && !this.noMtime) {
          try {
            fs.futimesSync(fd, entry.atime || new Date(), entry.mtime)
          } catch (er) {}
        }
        if (this[DOCHOWN](entry)) {
          try {
            fs.fchownSync(fd, this[UID](entry), this[GID](entry))
          } catch (er) {}
        }
        try { fs.closeSync(fd) } catch (er) { this[ONERROR](er, entry) }
      })
    } catch (er) { this[ONERROR](er, entry) }
  }

  [DIRECTORY] (entry) {
    const mode = entry.mode & 0o7777 || this.dmode
    const er = this[MKDIR](entry.absolute, mode)
    if (er)
      return this[ONERROR](er, entry)
    if (entry.mtime && !this.noMtime) {
      try {
        fs.utimesSync(entry.absolute, entry.atime || new Date(), entry.mtime)
      } catch (er) {}
    }
    if (this[DOCHOWN](entry)) {
      try {
        fs.chownSync(entry.absolute, this[UID](entry), this[GID](entry))
      } catch (er) {}
    }
    entry.resume()
  }

  [MKDIR] (dir, mode) {
    try {
      return mkdir.sync(dir, {
        uid: this.uid,
        gid: this.gid,
        processUid: this.processUid,
        processGid: this.processGid,
        umask: this.processUmask,
        preserve: this.preservePaths,
        unlink: this.unlink,
        cache: this.dirCache,
        cwd: this.cwd,
        mode: mode
      })
    } catch (er) {
      return er
    }
  }

  [LINK] (entry, linkpath, link) {
    try {
      fs[link + 'Sync'](linkpath, entry.absolute)
      entry.resume()
    } catch (er) {
      return this[ONERROR](er, entry)
    }
  }
}

Unpack.Sync = UnpackSync
module.exports = Unpack

},
"4Qo/V2sAfYSCXwRWGyedb6H4upRdwnVV4faxt79hltM=":
function (require, module, exports, __dirname, __filename) {
'use strict'
// wrapper around mkdirp for tar's needs.

// TODO: This should probably be a class, not functionally
// passing around state in a gazillion args.

const mkdirp = require('mkdirp')
const fs = require('fs')
const path = require('path')
const chownr = require('chownr')

class SymlinkError extends Error {
  constructor (symlink, path) {
    super('Cannot extract through symbolic link')
    this.path = path
    this.symlink = symlink
  }

  get name () {
    return 'SylinkError'
  }
}

class CwdError extends Error {
  constructor (path, code) {
    super(code + ': Cannot cd into \'' + path + '\'')
    this.path = path
    this.code = code
  }

  get name () {
    return 'CwdError'
  }
}

const mkdir = module.exports = (dir, opt, cb) => {
  // if there's any overlap between mask and mode,
  // then we'll need an explicit chmod
  const umask = opt.umask
  const mode = opt.mode | 0o0700
  const needChmod = (mode & umask) !== 0

  const uid = opt.uid
  const gid = opt.gid
  const doChown = typeof uid === 'number' &&
    typeof gid === 'number' &&
    ( uid !== opt.processUid || gid !== opt.processGid )

  const preserve = opt.preserve
  const unlink = opt.unlink
  const cache = opt.cache
  const cwd = opt.cwd

  const done = (er, created) => {
    if (er)
      cb(er)
    else {
      cache.set(dir, true)
      if (created && doChown)
        chownr(created, uid, gid, er => done(er))
      else if (needChmod)
        fs.chmod(dir, mode, cb)
      else
        cb()
    }
  }

  if (cache && cache.get(dir) === true)
    return done()

  if (dir === cwd)
    return fs.lstat(dir, (er, st) => {
      if (er || !st.isDirectory())
        er = new CwdError(dir, er && er.code || 'ENOTDIR')
      done(er)
    })

  if (preserve)
    return mkdirp(dir, mode, done)

  const sub = path.relative(cwd, dir)
  const parts = sub.split(/\/|\\/)
  mkdir_(cwd, parts, mode, cache, unlink, cwd, null, done)
}

const mkdir_ = (base, parts, mode, cache, unlink, cwd, created, cb) => {
  if (!parts.length)
    return cb(null, created)
  const p = parts.shift()
  const part = base + '/' + p
  if (cache.get(part))
    return mkdir_(part, parts, mode, cache, unlink, cwd, created, cb)
  fs.mkdir(part, mode, onmkdir(part, parts, mode, cache, unlink, cwd, created, cb))
}

const onmkdir = (part, parts, mode, cache, unlink, cwd, created, cb) => er => {
  if (er) {
    if (er.path && path.dirname(er.path) === cwd &&
        (er.code === 'ENOTDIR' || er.code === 'ENOENT'))
      return cb(new CwdError(cwd, er.code))

    fs.lstat(part, (statEr, st) => {
      if (statEr)
        cb(statEr)
      else if (st.isDirectory())
        mkdir_(part, parts, mode, cache, unlink, cwd, created, cb)
      else if (unlink)
        fs.unlink(part, er => {
          if (er)
            return cb(er)
          fs.mkdir(part, mode, onmkdir(part, parts, mode, cache, unlink, cwd, created, cb))
        })
      else if (st.isSymbolicLink())
        return cb(new SymlinkError(part, part + '/' + parts.join('/')))
      else
        cb(er)
    })
  } else {
    created = created || part
    mkdir_(part, parts, mode, cache, unlink, cwd, created, cb)
  }
}

const mkdirSync = module.exports.sync = (dir, opt) => {
  // if there's any overlap between mask and mode,
  // then we'll need an explicit chmod
  const umask = opt.umask
  const mode = opt.mode | 0o0700
  const needChmod = (mode & umask) !== 0

  const uid = opt.uid
  const gid = opt.gid
  const doChown = typeof uid === 'number' &&
    typeof gid === 'number' &&
    ( uid !== opt.processUid || gid !== opt.processGid )

  const preserve = opt.preserve
  const unlink = opt.unlink
  const cache = opt.cache
  const cwd = opt.cwd

  const done = (created) => {
    cache.set(dir, true)
    if (created && doChown)
      chownr.sync(created, uid, gid)
    if (needChmod)
      fs.chmodSync(dir, mode)
    cache.set(dir, true)
  }

  if (cache && cache.get(dir) === true)
    return done()

  if (dir === cwd) {
    let ok = false
    let code = 'ENOTDIR'
    try {
      ok = fs.lstatSync(dir).isDirectory()
    } catch (er) {
      code = er.code
    } finally {
      if (!ok)
        throw new CwdError(dir, code)
    }
    done()
    return
  }

  if (preserve)
    return done(mkdirp.sync(dir, mode))

  const sub = path.relative(cwd, dir)
  const parts = sub.split(/\/|\\/)
  let created = null
  for (let p = parts.shift(), part = cwd;
       p && (part += '/' + p);
       p = parts.shift()) {

    if (cache.get(part))
      continue

    try {
      fs.mkdirSync(part, mode)
      created = created || part
      cache.set(part, true)
    } catch (er) {
      if (er.path && path.dirname(er.path) === cwd &&
          (er.code === 'ENOTDIR' || er.code === 'ENOENT'))
        return new CwdError(cwd, er.code)

      const st = fs.lstatSync(part)
      if (st.isDirectory()) {
        cache.set(part, true)
        continue
      } else if (unlink) {
        fs.unlinkSync(part)
        fs.mkdirSync(part, mode)
        created = created || part
        cache.set(part, true)
        continue
      } else if (st.isSymbolicLink())
        return new SymlinkError(part, part + '/' + parts.join('/'))
    }
  }

  return done(created)
}

},
"56qWjByKztF5uZPT3/DJRKRxgtAKle3Xm5h2aKcXSRU=":
function (require, module, exports, __dirname, __filename) {
'use strict'

// A readable tar stream creator
// Technically, this is a transform stream that you write paths into,
// and tar format comes out of.
// The `add()` method is like `write()` but returns this,
// and end() return `this` as well, so you can
// do `new Pack(opt).add('files').add('dir').end().pipe(output)
// You could also do something like:
// streamOfPaths().pipe(new Pack()).pipe(new fs.WriteStream('out.tar'))

class PackJob {
  constructor (path, absolute) {
    this.path = path || './'
    this.absolute = absolute
    this.entry = null
    this.stat = null
    this.readdir = null
    this.pending = false
    this.ignore = false
    this.piped = false
  }
}

const MiniPass = require('minipass')
const zlib = require('minizlib')
const ReadEntry = require('./read-entry.js')
const WriteEntry = require('./write-entry.js')
const WriteEntrySync = WriteEntry.Sync
const WriteEntryTar = WriteEntry.Tar
const Yallist = require('yallist')
const EOF = Buffer.alloc(1024)
const ONSTAT = Symbol('onStat')
const ENDED = Symbol('ended')
const QUEUE = Symbol('queue')
const CURRENT = Symbol('current')
const PROCESS = Symbol('process')
const PROCESSING = Symbol('processing')
const PROCESSJOB = Symbol('processJob')
const JOBS = Symbol('jobs')
const JOBDONE = Symbol('jobDone')
const ADDFSENTRY = Symbol('addFSEntry')
const ADDTARENTRY = Symbol('addTarEntry')
const STAT = Symbol('stat')
const READDIR = Symbol('readdir')
const ONREADDIR = Symbol('onreaddir')
const PIPE = Symbol('pipe')
const ENTRY = Symbol('entry')
const ENTRYOPT = Symbol('entryOpt')
const WRITEENTRYCLASS = Symbol('writeEntryClass')
const WRITE = Symbol('write')
const ONDRAIN = Symbol('ondrain')

const fs = require('fs')
const path = require('path')
const warner = require('./warn-mixin.js')

const Pack = warner(class Pack extends MiniPass {
  constructor (opt) {
    super(opt)
    opt = opt || Object.create(null)
    this.opt = opt
    this.cwd = opt.cwd || process.cwd()
    this.maxReadSize = opt.maxReadSize
    this.preservePaths = !!opt.preservePaths
    this.strict = !!opt.strict
    this.noPax = !!opt.noPax
    this.prefix = (opt.prefix || '').replace(/(\\|\/)+$/, '')
    this.linkCache = opt.linkCache || new Map()
    this.statCache = opt.statCache || new Map()
    this.readdirCache = opt.readdirCache || new Map()
    this[WRITEENTRYCLASS] = WriteEntry
    if (typeof opt.onwarn === 'function')
      this.on('warn', opt.onwarn)

    this.zip = null
    if (opt.gzip) {
      if (typeof opt.gzip !== 'object')
        opt.gzip = {}
      this.zip = new zlib.Gzip(opt.gzip)
      this.zip.on('data', chunk => super.write(chunk))
      this.zip.on('end', _ => super.end())
      this.zip.on('drain', _ => this[ONDRAIN]())
      this.on('resume', _ => this.zip.resume())
    } else
      this.on('drain', this[ONDRAIN])

    this.portable = !!opt.portable
    this.noDirRecurse = !!opt.noDirRecurse
    this.follow = !!opt.follow

    this.filter = typeof opt.filter === 'function' ? opt.filter : _ => true

    this[QUEUE] = new Yallist
    this[JOBS] = 0
    this.jobs = +opt.jobs || 4
    this[PROCESSING] = false
    this[ENDED] = false
  }

  [WRITE] (chunk) {
    return super.write(chunk)
  }

  add (path) {
    this.write(path)
    return this
  }

  end (path) {
    if (path)
      this.write(path)
    this[ENDED] = true
    this[PROCESS]()
    return this
  }

  write (path) {
    if (this[ENDED])
      throw new Error('write after end')

    if (path instanceof ReadEntry)
      this[ADDTARENTRY](path)
    else
      this[ADDFSENTRY](path)
    return this.flowing
  }

  [ADDTARENTRY] (p) {
    const absolute = path.resolve(this.cwd, p.path)
    if (this.prefix)
      p.path = this.prefix + '/' + p.path.replace(/^\.(\/+|$)/, '')

    // in this case, we don't have to wait for the stat
    if (!this.filter(p.path, p))
      p.resume()
    else {
      const job = new PackJob(p.path, absolute, false)
      job.entry = new WriteEntryTar(p, this[ENTRYOPT](job))
      job.entry.on('end', _ => this[JOBDONE](job))
      this[JOBS] += 1
      this[QUEUE].push(job)
    }

    this[PROCESS]()
  }

  [ADDFSENTRY] (p) {
    const absolute = path.resolve(this.cwd, p)
    if (this.prefix)
      p = this.prefix + '/' + p.replace(/^\.(\/+|$)/, '')

    this[QUEUE].push(new PackJob(p, absolute))
    this[PROCESS]()
  }

  [STAT] (job) {
    job.pending = true
    this[JOBS] += 1
    const stat = this.follow ? 'stat' : 'lstat'
    fs[stat](job.absolute, (er, stat) => {
      job.pending = false
      this[JOBS] -= 1
      if (er)
        this.emit('error', er)
      else
        this[ONSTAT](job, stat)
    })
  }

  [ONSTAT] (job, stat) {
    this.statCache.set(job.absolute, stat)
    job.stat = stat

    // now we have the stat, we can filter it.
    if (!this.filter(job.path, stat))
      job.ignore = true

    this[PROCESS]()
  }

  [READDIR] (job) {
    job.pending = true
    this[JOBS] += 1
    fs.readdir(job.absolute, (er, entries) => {
      job.pending = false
      this[JOBS] -= 1
      if (er)
        return this.emit('error', er)
      this[ONREADDIR](job, entries)
    })
  }

  [ONREADDIR] (job, entries) {
    this.readdirCache.set(job.absolute, entries)
    job.readdir = entries
    this[PROCESS]()
  }

  [PROCESS] () {
    if (this[PROCESSING])
      return

    this[PROCESSING] = true
    for (let w = this[QUEUE].head;
         w !== null && this[JOBS] < this.jobs;
         w = w.next) {
      this[PROCESSJOB](w.value)
      if (w.value.ignore) {
        const p = w.next
        this[QUEUE].removeNode(w)
        w.next = p
      }
    }

    this[PROCESSING] = false

    if (this[ENDED] && !this[QUEUE].length && this[JOBS] === 0) {
      if (this.zip)
        this.zip.end(EOF)
      else {
        super.write(EOF)
        super.end()
      }
    }
  }

  get [CURRENT] () {
    return this[QUEUE] && this[QUEUE].head && this[QUEUE].head.value
  }

  [JOBDONE] (job) {
    this[QUEUE].shift()
    this[JOBS] -= 1
    this[PROCESS]()
  }

  [PROCESSJOB] (job) {
    if (job.pending)
      return

    if (job.entry) {
      if (job === this[CURRENT] && !job.piped)
        this[PIPE](job)
      return
    }

    if (!job.stat) {
      if (this.statCache.has(job.absolute))
        this[ONSTAT](job, this.statCache.get(job.absolute))
      else
        this[STAT](job)
    }
    if (!job.stat)
      return

    // filtered out!
    if (job.ignore)
      return

    if (!this.noDirRecurse && job.stat.isDirectory() && !job.readdir) {
      if (this.readdirCache.has(job.absolute))
        this[ONREADDIR](job, this.readdirCache.get(job.absolute))
      else
        this[READDIR](job)
      if (!job.readdir)
        return
    }

    // we know it doesn't have an entry, because that got checked above
    job.entry = this[ENTRY](job)
    if (!job.entry) {
      job.ignore = true
      return
    }

    if (job === this[CURRENT] && !job.piped)
      this[PIPE](job)
  }

  [ENTRYOPT] (job) {
    return {
      onwarn: (msg, data) => {
        this.warn(msg, data)
      },
      noPax: this.noPax,
      cwd: this.cwd,
      absolute: job.absolute,
      preservePaths: this.preservePaths,
      maxReadSize: this.maxReadSize,
      strict: this.strict,
      portable: this.portable,
      linkCache: this.linkCache,
      statCache: this.statCache
    }
  }

  [ENTRY] (job) {
    this[JOBS] += 1
    try {
      return new this[WRITEENTRYCLASS](
        job.path, this[ENTRYOPT](job)).on('end', _ => {
          this[JOBDONE](job)
        }).on('error', er => this.emit('error', er))
    } catch (er) {
      this.emit('error', er)
    }
  }

  [ONDRAIN] () {
    if (this[CURRENT] && this[CURRENT].entry)
      this[CURRENT].entry.resume()
  }

  // like .pipe() but using super, because our write() is special
  [PIPE] (job) {
    job.piped = true

    if (job.readdir)
      job.readdir.forEach(entry => {
        const p = this.prefix ?
          job.path.slice(this.prefix.length + 1) || './'
          : job.path

        const base = p === './' ? '' : p.replace(/\/*$/, '/')
        this[ADDFSENTRY](base + entry)
      })

    const source = job.entry
    const zip = this.zip

    if (zip)
      source.on('data', chunk => {
        if (!zip.write(chunk))
          source.pause()
      })
    else
      source.on('data', chunk => {
        if (!super.write(chunk))
          source.pause()
      })
  }

  pause () {
    if (this.zip)
      this.zip.pause()
    return super.pause()
  }
})

class PackSync extends Pack {
  constructor (opt) {
    super(opt)
    this[WRITEENTRYCLASS] = WriteEntrySync
  }

  // pause/resume are no-ops in sync streams.
  pause () {}
  resume () {}

  [STAT] (job) {
    const stat = this.follow ? 'statSync' : 'lstatSync'
    this[ONSTAT](job, fs[stat](job.absolute))
  }

  [READDIR] (job, stat) {
    this[ONREADDIR](job, fs.readdirSync(job.absolute))
  }

  // gotta get it all in this tick
  [PIPE] (job) {
    const source = job.entry
    const zip = this.zip

    if (job.readdir)
      job.readdir.forEach(entry => {
        const p = this.prefix ?
          job.path.slice(this.prefix.length + 1) || './'
          : job.path


        const base = p === './' ? '' : p.replace(/\/*$/, '/')
        this[ADDFSENTRY](base + entry)
      })

    if (zip)
      source.on('data', chunk => {
        zip.write(chunk)
      })
    else
      source.on('data', chunk => {
        super[WRITE](chunk)
      })
  }
}

Pack.Sync = PackSync

module.exports = Pack

},
"9nOtlymYR2mZaEkDDe8csLjach1JKjub7t/jbbxr4Rc=":
function (require, module, exports, __dirname, __filename) {
var Buffer = require('buffer').Buffer;

var CRC_TABLE = [
  0x00000000, 0x77073096, 0xee0e612c, 0x990951ba, 0x076dc419,
  0x706af48f, 0xe963a535, 0x9e6495a3, 0x0edb8832, 0x79dcb8a4,
  0xe0d5e91e, 0x97d2d988, 0x09b64c2b, 0x7eb17cbd, 0xe7b82d07,
  0x90bf1d91, 0x1db71064, 0x6ab020f2, 0xf3b97148, 0x84be41de,
  0x1adad47d, 0x6ddde4eb, 0xf4d4b551, 0x83d385c7, 0x136c9856,
  0x646ba8c0, 0xfd62f97a, 0x8a65c9ec, 0x14015c4f, 0x63066cd9,
  0xfa0f3d63, 0x8d080df5, 0x3b6e20c8, 0x4c69105e, 0xd56041e4,
  0xa2677172, 0x3c03e4d1, 0x4b04d447, 0xd20d85fd, 0xa50ab56b,
  0x35b5a8fa, 0x42b2986c, 0xdbbbc9d6, 0xacbcf940, 0x32d86ce3,
  0x45df5c75, 0xdcd60dcf, 0xabd13d59, 0x26d930ac, 0x51de003a,
  0xc8d75180, 0xbfd06116, 0x21b4f4b5, 0x56b3c423, 0xcfba9599,
  0xb8bda50f, 0x2802b89e, 0x5f058808, 0xc60cd9b2, 0xb10be924,
  0x2f6f7c87, 0x58684c11, 0xc1611dab, 0xb6662d3d, 0x76dc4190,
  0x01db7106, 0x98d220bc, 0xefd5102a, 0x71b18589, 0x06b6b51f,
  0x9fbfe4a5, 0xe8b8d433, 0x7807c9a2, 0x0f00f934, 0x9609a88e,
  0xe10e9818, 0x7f6a0dbb, 0x086d3d2d, 0x91646c97, 0xe6635c01,
  0x6b6b51f4, 0x1c6c6162, 0x856530d8, 0xf262004e, 0x6c0695ed,
  0x1b01a57b, 0x8208f4c1, 0xf50fc457, 0x65b0d9c6, 0x12b7e950,
  0x8bbeb8ea, 0xfcb9887c, 0x62dd1ddf, 0x15da2d49, 0x8cd37cf3,
  0xfbd44c65, 0x4db26158, 0x3ab551ce, 0xa3bc0074, 0xd4bb30e2,
  0x4adfa541, 0x3dd895d7, 0xa4d1c46d, 0xd3d6f4fb, 0x4369e96a,
  0x346ed9fc, 0xad678846, 0xda60b8d0, 0x44042d73, 0x33031de5,
  0xaa0a4c5f, 0xdd0d7cc9, 0x5005713c, 0x270241aa, 0xbe0b1010,
  0xc90c2086, 0x5768b525, 0x206f85b3, 0xb966d409, 0xce61e49f,
  0x5edef90e, 0x29d9c998, 0xb0d09822, 0xc7d7a8b4, 0x59b33d17,
  0x2eb40d81, 0xb7bd5c3b, 0xc0ba6cad, 0xedb88320, 0x9abfb3b6,
  0x03b6e20c, 0x74b1d29a, 0xead54739, 0x9dd277af, 0x04db2615,
  0x73dc1683, 0xe3630b12, 0x94643b84, 0x0d6d6a3e, 0x7a6a5aa8,
  0xe40ecf0b, 0x9309ff9d, 0x0a00ae27, 0x7d079eb1, 0xf00f9344,
  0x8708a3d2, 0x1e01f268, 0x6906c2fe, 0xf762575d, 0x806567cb,
  0x196c3671, 0x6e6b06e7, 0xfed41b76, 0x89d32be0, 0x10da7a5a,
  0x67dd4acc, 0xf9b9df6f, 0x8ebeeff9, 0x17b7be43, 0x60b08ed5,
  0xd6d6a3e8, 0xa1d1937e, 0x38d8c2c4, 0x4fdff252, 0xd1bb67f1,
  0xa6bc5767, 0x3fb506dd, 0x48b2364b, 0xd80d2bda, 0xaf0a1b4c,
  0x36034af6, 0x41047a60, 0xdf60efc3, 0xa867df55, 0x316e8eef,
  0x4669be79, 0xcb61b38c, 0xbc66831a, 0x256fd2a0, 0x5268e236,
  0xcc0c7795, 0xbb0b4703, 0x220216b9, 0x5505262f, 0xc5ba3bbe,
  0xb2bd0b28, 0x2bb45a92, 0x5cb36a04, 0xc2d7ffa7, 0xb5d0cf31,
  0x2cd99e8b, 0x5bdeae1d, 0x9b64c2b0, 0xec63f226, 0x756aa39c,
  0x026d930a, 0x9c0906a9, 0xeb0e363f, 0x72076785, 0x05005713,
  0x95bf4a82, 0xe2b87a14, 0x7bb12bae, 0x0cb61b38, 0x92d28e9b,
  0xe5d5be0d, 0x7cdcefb7, 0x0bdbdf21, 0x86d3d2d4, 0xf1d4e242,
  0x68ddb3f8, 0x1fda836e, 0x81be16cd, 0xf6b9265b, 0x6fb077e1,
  0x18b74777, 0x88085ae6, 0xff0f6a70, 0x66063bca, 0x11010b5c,
  0x8f659eff, 0xf862ae69, 0x616bffd3, 0x166ccf45, 0xa00ae278,
  0xd70dd2ee, 0x4e048354, 0x3903b3c2, 0xa7672661, 0xd06016f7,
  0x4969474d, 0x3e6e77db, 0xaed16a4a, 0xd9d65adc, 0x40df0b66,
  0x37d83bf0, 0xa9bcae53, 0xdebb9ec5, 0x47b2cf7f, 0x30b5ffe9,
  0xbdbdf21c, 0xcabac28a, 0x53b39330, 0x24b4a3a6, 0xbad03605,
  0xcdd70693, 0x54de5729, 0x23d967bf, 0xb3667a2e, 0xc4614ab8,
  0x5d681b02, 0x2a6f2b94, 0xb40bbe37, 0xc30c8ea1, 0x5a05df1b,
  0x2d02ef8d
];

if (typeof Int32Array !== 'undefined') {
  CRC_TABLE = new Int32Array(CRC_TABLE);
}

function ensureBuffer(input) {
  if (Buffer.isBuffer(input)) {
    return input;
  }

  var hasNewBufferAPI =
      typeof Buffer.alloc === "function" &&
      typeof Buffer.from === "function";

  if (typeof input === "number") {
    return hasNewBufferAPI ? Buffer.alloc(input) : new Buffer(input);
  }
  else if (typeof input === "string") {
    return hasNewBufferAPI ? Buffer.from(input) : new Buffer(input);
  }
  else {
    throw new Error("input must be buffer, number, or string, received " +
                    typeof input);
  }
}

function bufferizeInt(num) {
  var tmp = ensureBuffer(4);
  tmp.writeInt32BE(num, 0);
  return tmp;
}

function _crc32(buf, previous) {
  buf = ensureBuffer(buf);
  if (Buffer.isBuffer(previous)) {
    previous = previous.readUInt32BE(0);
  }
  var crc = ~~previous ^ -1;
  for (var n = 0; n < buf.length; n++) {
    crc = CRC_TABLE[(crc ^ buf[n]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ -1);
}

function crc32() {
  return bufferizeInt(_crc32.apply(null, arguments));
}
crc32.signed = function () {
  return _crc32.apply(null, arguments);
};
crc32.unsigned = function () {
  return _crc32.apply(null, arguments) >>> 0;
};

module.exports = crc32;

},
"AXYSixFtOIB2lrgAygjrBP4PjSGE3C+ADZiHzezUAGo=":
function (require, module, exports, __dirname, __filename) {
'use strict'
const EE = require('events')
const Yallist = require('yallist')
const EOF = Symbol('EOF')
const MAYBE_EMIT_END = Symbol('maybeEmitEnd')
const EMITTED_END = Symbol('emittedEnd')
const CLOSED = Symbol('closed')
const READ = Symbol('read')
const FLUSH = Symbol('flush')
const doIter = process.env._MP_NO_ITERATOR_SYMBOLS_  !== '1'
const ASYNCITERATOR = doIter && Symbol.asyncIterator || Symbol('asyncIterator not implemented')
const ITERATOR = doIter && Symbol.iterator || Symbol('iterator not implemented')
const FLUSHCHUNK = Symbol('flushChunk')
const SD = require('string_decoder').StringDecoder
const ENCODING = Symbol('encoding')
const DECODER = Symbol('decoder')
const FLOWING = Symbol('flowing')
const RESUME = Symbol('resume')
const BUFFERLENGTH = Symbol('bufferLength')
const BUFFERPUSH = Symbol('bufferPush')
const BUFFERSHIFT = Symbol('bufferShift')
const OBJECTMODE = Symbol('objectMode')

// Buffer in node 4.x < 4.5.0 doesn't have working Buffer.from
// or Buffer.alloc, and Buffer in node 10 deprecated the ctor.
// .M, this is fine .\^/M..
let B = Buffer
/* istanbul ignore next */
if (!B.alloc) {
  B = require('safe-buffer').Buffer
}

module.exports = class MiniPass extends EE {
  constructor (options) {
    super()
    this[FLOWING] = false
    this.pipes = new Yallist()
    this.buffer = new Yallist()
    this[OBJECTMODE] = options && options.objectMode || false
    if (this[OBJECTMODE])
      this[ENCODING] = null
    else
      this[ENCODING] = options && options.encoding || null
    if (this[ENCODING] === 'buffer')
      this[ENCODING] = null
    this[DECODER] = this[ENCODING] ? new SD(this[ENCODING]) : null
    this[EOF] = false
    this[EMITTED_END] = false
    this[CLOSED] = false
    this.writable = true
    this.readable = true
    this[BUFFERLENGTH] = 0
  }

  get bufferLength () { return this[BUFFERLENGTH] }

  get encoding () { return this[ENCODING] }
  set encoding (enc) {
    if (this[OBJECTMODE])
      throw new Error('cannot set encoding in objectMode')

    if (this[ENCODING] && enc !== this[ENCODING] &&
        (this[DECODER] && this[DECODER].lastNeed || this[BUFFERLENGTH]))
      throw new Error('cannot change encoding')

    if (this[ENCODING] !== enc) {
      this[DECODER] = enc ? new SD(enc) : null
      if (this.buffer.length)
        this.buffer = this.buffer.map(chunk => this[DECODER].write(chunk))
    }

    this[ENCODING] = enc
  }

  setEncoding (enc) {
    this.encoding = enc
  }

  write (chunk, encoding, cb) {
    if (this[EOF])
      throw new Error('write after end')

    if (typeof encoding === 'function')
      cb = encoding, encoding = 'utf8'

    if (!encoding)
      encoding = 'utf8'

    // fast-path writing strings of same encoding to a stream with
    // an empty buffer, skipping the buffer/decoder dance
    if (typeof chunk === 'string' && !this[OBJECTMODE] &&
        // unless it is a string already ready for us to use
        !(encoding === this[ENCODING] && !this[DECODER].lastNeed)) {
      chunk = B.from(chunk, encoding)
    }

    if (B.isBuffer(chunk) && this[ENCODING])
      chunk = this[DECODER].write(chunk)

    try {
      return this.flowing
        ? (this.emit('data', chunk), this.flowing)
        : (this[BUFFERPUSH](chunk), false)
    } finally {
      this.emit('readable')
      if (cb)
        cb()
    }
  }

  read (n) {
    try {
      if (this[BUFFERLENGTH] === 0 || n === 0 || n > this[BUFFERLENGTH])
        return null

      if (this[OBJECTMODE])
        n = null

      if (this.buffer.length > 1 && !this[OBJECTMODE]) {
        if (this.encoding)
          this.buffer = new Yallist([
            Array.from(this.buffer).join('')
          ])
        else
          this.buffer = new Yallist([
            B.concat(Array.from(this.buffer), this[BUFFERLENGTH])
          ])
      }

      return this[READ](n || null, this.buffer.head.value)
    } finally {
      this[MAYBE_EMIT_END]()
    }
  }

  [READ] (n, chunk) {
    if (n === chunk.length || n === null)
      this[BUFFERSHIFT]()
    else {
      this.buffer.head.value = chunk.slice(n)
      chunk = chunk.slice(0, n)
      this[BUFFERLENGTH] -= n
    }

    this.emit('data', chunk)

    if (!this.buffer.length && !this[EOF])
      this.emit('drain')

    return chunk
  }

  end (chunk, encoding, cb) {
    if (typeof chunk === 'function')
      cb = chunk, chunk = null
    if (typeof encoding === 'function')
      cb = encoding, encoding = 'utf8'
    if (chunk)
      this.write(chunk, encoding)
    if (cb)
      this.once('end', cb)
    this[EOF] = true
    this.writable = false
    if (this.flowing)
      this[MAYBE_EMIT_END]()
  }

  // don't let the internal resume be overwritten
  [RESUME] () {
    this[FLOWING] = true
    this.emit('resume')
    if (this.buffer.length)
      this[FLUSH]()
    else if (this[EOF])
      this[MAYBE_EMIT_END]()
    else
      this.emit('drain')
  }

  resume () {
    return this[RESUME]()
  }

  pause () {
    this[FLOWING] = false
  }

  get flowing () {
    return this[FLOWING]
  }

  [BUFFERPUSH] (chunk) {
    if (this[OBJECTMODE])
      this[BUFFERLENGTH] += 1
    else
      this[BUFFERLENGTH] += chunk.length
    return this.buffer.push(chunk)
  }

  [BUFFERSHIFT] () {
    if (this.buffer.length) {
      if (this[OBJECTMODE])
        this[BUFFERLENGTH] -= 1
      else
        this[BUFFERLENGTH] -= this.buffer.head.value.length
    }
    return this.buffer.shift()
  }

  [FLUSH] () {
    do {} while (this[FLUSHCHUNK](this[BUFFERSHIFT]()))

    if (!this.buffer.length && !this[EOF])
      this.emit('drain')
  }

  [FLUSHCHUNK] (chunk) {
    return chunk ? (this.emit('data', chunk), this.flowing) : false
  }

  pipe (dest, opts) {
    if (dest === process.stdout || dest === process.stderr)
      (opts = opts || {}).end = false
    const p = { dest: dest, opts: opts, ondrain: _ => this[RESUME]() }
    this.pipes.push(p)

    dest.on('drain', p.ondrain)
    this[RESUME]()
    return dest
  }

  addListener (ev, fn) {
    return this.on(ev, fn)
  }

  on (ev, fn) {
    try {
      return super.on(ev, fn)
    } finally {
      if (ev === 'data' && !this.pipes.length && !this.flowing)
        this[RESUME]()
      else if (ev === 'end' && this[EMITTED_END]) {
        super.emit('end')
        this.removeAllListeners('end')
      }
    }
  }

  get emittedEnd () {
    return this[EMITTED_END]
  }

  [MAYBE_EMIT_END] () {
    if (!this[EMITTED_END] && this.buffer.length === 0 && this[EOF]) {
      this.emit('end')
      this.emit('prefinish')
      this.emit('finish')
      if (this[CLOSED])
        this.emit('close')
    }
  }

  emit (ev, data) {
    if (ev === 'data') {
      if (!data)
        return

      if (this.pipes.length)
        this.pipes.forEach(p => p.dest.write(data) || this.pause())
    } else if (ev === 'end') {
      if (this[EMITTED_END] === true)
        return

      this[EMITTED_END] = true
      this.readable = false

      if (this[DECODER]) {
        data = this[DECODER].end()
        if (data) {
          this.pipes.forEach(p => p.dest.write(data))
          super.emit('data', data)
        }
      }

      this.pipes.forEach(p => {
        p.dest.removeListener('drain', p.ondrain)
        if (!p.opts || p.opts.end !== false)
          p.dest.end()
      })
    } else if (ev === 'close') {
      this[CLOSED] = true
      // don't emit close before 'end' and 'finish'
      if (!this[EMITTED_END])
        return
    }

    const args = new Array(arguments.length)
    args[0] = ev
    args[1] = data
    if (arguments.length > 2) {
      for (let i = 2; i < arguments.length; i++) {
        args[i] = arguments[i]
      }
    }

    try {
      return super.emit.apply(this, args)
    } finally {
      if (ev !== 'end')
        this[MAYBE_EMIT_END]()
      else
        this.removeAllListeners('end')
    }
  }

  // const all = await stream.collect()
  collect () {
    return new Promise((resolve, reject) => {
      const buf = []
      this.on('data', c => buf.push(c))
      this.on('end', () => resolve(buf))
      this.on('error', reject)
    })
  }

  // for await (let chunk of stream)
  [ASYNCITERATOR] () {
    const next = () => {
      const res = this.read()
      if (res !== null)
        return Promise.resolve({ done: false, value: res })

      if (this[EOF])
        return Promise.resolve({ done: true })

      let resolve = null
      let reject = null
      const onerr = er => {
        this.removeListener('data', ondata)
        this.removeListener('end', onend)
        reject(er)
      }
      const ondata = value => {
        this.removeListener('error', onerr)
        this.removeListener('end', onend)
        this.pause()
        resolve({ value: value, done: !!this[EOF] })
      }
      const onend = () => {
        this.removeListener('error', onerr)
        this.removeListener('data', ondata)
        resolve({ done: true })
      }
      return new Promise((res, rej) => {
        reject = rej
        resolve = res
        this.once('error', onerr)
        this.once('end', onend)
        this.once('data', ondata)
        this.resume()
      })
    }

    return { next }
  }

  // for (let chunk of stream)
  [ITERATOR] () {
    const next = () => {
      const value = this.read()
      const done = value === null
      return { value, done }
    }
    return { next }
  }
}

},
"HlQMn+6CRplIWO/zPKPBER/PEkKfj5VpRsywSQMazVA=":
function (require, module, exports, __dirname, __filename) {



// Generated by Haxe 4.0.0 (git build development @ 3018ab1)
(function () { "use strict";
var $estr = function() { return js_Boot.__string_rec(this,''); };
function $extend(from, fields) {
	function Inherit() {} Inherit.prototype = from; var proto = new Inherit();
	for (var name in fields) proto[name] = fields[name];
	if( fields.toString !== Object.prototype.toString ) proto.toString = fields.toString;
	return proto;
}
var HxOverrides = function() { };
HxOverrides.__name__ = true;
HxOverrides.strDate = function(s) {
	var _g = s.length;
	switch(_g) {
	case 8:
		var k = s.split(":");
		var d = new Date();
		d["setTime"](0);
		d["setUTCHours"](k[0]);
		d["setUTCMinutes"](k[1]);
		d["setUTCSeconds"](k[2]);
		return d;
	case 10:
		var k1 = s.split("-");
		return new Date(k1[0],k1[1] - 1,k1[2],0,0,0);
	case 19:
		var k2 = s.split(" ");
		var y = k2[0].split("-");
		var t = k2[1].split(":");
		return new Date(y[0],y[1] - 1,y[2],t[0],t[1],t[2]);
	default:
		throw new js__$Boot_HaxeError("Invalid date format : " + s);
	}
};
HxOverrides.cca = function(s,index) {
	var x = s.charCodeAt(index);
	if(x != x) {
		return undefined;
	}
	return x;
};
HxOverrides.substr = function(s,pos,len) {
	if(len == null) {
		len = s.length;
	} else if(len < 0) {
		if(pos == 0) {
			len = s.length + len;
		} else {
			return "";
		}
	}
	return s.substr(pos,len);
};
HxOverrides.remove = function(a,obj) {
	var i = a.indexOf(obj);
	if(i == -1) {
		return false;
	}
	a.splice(i,1);
	return true;
};
HxOverrides.iter = function(a) {
	return { cur : 0, arr : a, hasNext : function() {
		return this.cur < this.arr.length;
	}, next : function() {
		return this.arr[this.cur++];
	}};
};
Math.__name__ = true;
var Reflect = function() { };
Reflect.__name__ = true;
Reflect.field = function(o,field) {
	try {
		return o[field];
	} catch( e ) {
		var e1 = (e instanceof js__$Boot_HaxeError) ? e.val : e;
		return null;
	}
};
Reflect.fields = function(o) {
	var a = [];
	if(o != null) {
		var hasOwnProperty = Object.prototype.hasOwnProperty;
		for( var f in o ) {
		if(f != "__id__" && f != "hx__closures__" && hasOwnProperty.call(o,f)) {
			a.push(f);
		}
		}
	}
	return a;
};
Reflect.copy = function(o) {
	var o2 = { };
	var _g = 0;
	var _g1 = Reflect.fields(o);
	while(_g < _g1.length) {
		var f = _g1[_g];
		++_g;
		o2[f] = Reflect.field(o,f);
	}
	return o2;
};
var Std = function() { };
Std.__name__ = true;
Std.string = function(s) {
	return js_Boot.__string_rec(s,"");
};
Std.parseInt = function(x) {
	var v = parseInt(x,10);
	if(v == 0 && (HxOverrides.cca(x,1) == 120 || HxOverrides.cca(x,1) == 88)) {
		v = parseInt(x);
	}
	if(isNaN(v)) {
		return null;
	}
	return v;
};
var StringTools = function() { };
StringTools.__name__ = true;
StringTools.startsWith = function(s,start) {
	if(s.length >= start.length) {
		return HxOverrides.substr(s,0,start.length) == start;
	} else {
		return false;
	}
};
StringTools.endsWith = function(s,end) {
	var elen = end.length;
	var slen = s.length;
	if(slen >= elen) {
		return HxOverrides.substr(s,slen - elen,elen) == end;
	} else {
		return false;
	}
};
StringTools.lpad = function(s,c,l) {
	if(c.length <= 0) {
		return s;
	}
	while(s.length < l) s = c + s;
	return s;
};
StringTools.replace = function(s,sub,by) {
	return s.split(sub).join(by);
};
var Sys = function() { };
Sys.__name__ = true;
Sys.println = function(v) {
	process.stdout.write(Std.string(v));
	process.stdout.write("\n");
};
Sys.systemName = function() {
	var _g = process.platform;
	switch(_g) {
	case "darwin":
		return "Mac";
	case "freebsd":
		return "BSD";
	case "linux":
		return "Linux";
	case "win32":
		return "Windows";
	default:
		var other = _g;
		return other;
	}
};
var haxe_io_Output = function() { };
haxe_io_Output.__name__ = true;
haxe_io_Output.prototype = {
	writeByte: function(c) {
		throw new js__$Boot_HaxeError("Not implemented");
	}
	,writeBytes: function(s,pos,len) {
		if(pos < 0 || len < 0 || pos + len > s.length) {
			throw new js__$Boot_HaxeError(haxe_io_Error.OutsideBounds);
		}
		var b = s.b;
		var k = len;
		while(k > 0) {
			this.writeByte(b[pos]);
			++pos;
			--k;
		}
		return len;
	}
	,writeFullBytes: function(s,pos,len) {
		while(len > 0) {
			var k = this.writeBytes(s,pos,len);
			pos += k;
			len -= k;
		}
	}
	,writeString: function(s) {
		var b = haxe_io_Bytes.ofString(s);
		this.writeFullBytes(b,0,b.length);
	}
};
var _$Sys_FileOutput = function(fd) {
	this.fd = fd;
};
_$Sys_FileOutput.__name__ = true;
_$Sys_FileOutput.__super__ = haxe_io_Output;
_$Sys_FileOutput.prototype = $extend(haxe_io_Output.prototype,{
	writeByte: function(c) {
		js_node_Fs.writeSync(this.fd,String.fromCharCode(c));
	}
	,writeBytes: function(s,pos,len) {
		var data = s.b;
		return js_node_Fs.writeSync(this.fd,new js_node_buffer_Buffer(data.buffer,data.byteOffset,s.length),pos,len);
	}
	,writeString: function(s) {
		js_node_Fs.writeSync(this.fd,s);
	}
});
var haxe_StackItem = { __ename__ : true, __constructs__ : ["CFunction","Module","FilePos","Method","LocalFunction"] };
haxe_StackItem.CFunction = ["CFunction",0];
haxe_StackItem.CFunction.toString = $estr;
haxe_StackItem.CFunction.__enum__ = haxe_StackItem;
haxe_StackItem.Module = function(m) { var $x = ["Module",1,m]; $x.__enum__ = haxe_StackItem; $x.toString = $estr; return $x; };
haxe_StackItem.FilePos = function(s,file,line,column) { var $x = ["FilePos",2,s,file,line,column]; $x.__enum__ = haxe_StackItem; $x.toString = $estr; return $x; };
haxe_StackItem.Method = function(classname,method) { var $x = ["Method",3,classname,method]; $x.__enum__ = haxe_StackItem; $x.toString = $estr; return $x; };
haxe_StackItem.LocalFunction = function(v) { var $x = ["LocalFunction",4,v]; $x.__enum__ = haxe_StackItem; $x.toString = $estr; return $x; };
var haxe_IMap = function() { };
haxe_IMap.__name__ = true;
var haxe_Timer = function(time_ms) {
	var me = this;
	this.id = setInterval(function() {
		me.run();
	},time_ms);
};
haxe_Timer.__name__ = true;
haxe_Timer.delay = function(f,time_ms) {
	var t = new haxe_Timer(time_ms);
	t.run = function() {
		t.stop();
		f();
	};
	return t;
};
haxe_Timer.prototype = {
	stop: function() {
		if(this.id == null) {
			return;
		}
		clearInterval(this.id);
		this.id = null;
	}
	,run: function() {
	}
};
var haxe_ds_Option = { __ename__ : true, __constructs__ : ["Some","None"] };
haxe_ds_Option.Some = function(v) { var $x = ["Some",0,v]; $x.__enum__ = haxe_ds_Option; $x.toString = $estr; return $x; };
haxe_ds_Option.None = ["None",1];
haxe_ds_Option.None.toString = $estr;
haxe_ds_Option.None.__enum__ = haxe_ds_Option;
var haxe_ds_StringMap = function() {
	this.h = { };
};
haxe_ds_StringMap.__name__ = true;
haxe_ds_StringMap.__interfaces__ = [haxe_IMap];
haxe_ds_StringMap.prototype = {
	setReserved: function(key,value) {
		if(this.rh == null) {
			this.rh = { };
		}
		this.rh["$" + key] = value;
	}
	,getReserved: function(key) {
		if(this.rh == null) {
			return null;
		} else {
			return this.rh["$" + key];
		}
	}
	,keys: function() {
		return HxOverrides.iter(this.arrayKeys());
	}
	,arrayKeys: function() {
		var out = [];
		for( var key in this.h ) {
		if(this.h.hasOwnProperty(key)) {
			out.push(key);
		}
		}
		if(this.rh != null) {
			for( var key in this.rh ) {
			if(key.charCodeAt(0) == 36) {
				out.push(key.substr(1));
			}
			}
		}
		return out;
	}
};
var haxe_io_Bytes = function(data) {
	this.length = data.byteLength;
	this.b = new Uint8Array(data);
	this.b.bufferValue = data;
	data.hxBytes = this;
	data.bytes = this.b;
};
haxe_io_Bytes.__name__ = true;
haxe_io_Bytes.alloc = function(length) {
	return new haxe_io_Bytes(new ArrayBuffer(length));
};
haxe_io_Bytes.ofString = function(s) {
	var a = [];
	var i = 0;
	while(i < s.length) {
		var c = s.charCodeAt(i++);
		if(55296 <= c && c <= 56319) {
			c = c - 55232 << 10 | s.charCodeAt(i++) & 1023;
		}
		if(c <= 127) {
			a.push(c);
		} else if(c <= 2047) {
			a.push(192 | c >> 6);
			a.push(128 | c & 63);
		} else if(c <= 65535) {
			a.push(224 | c >> 12);
			a.push(128 | c >> 6 & 63);
			a.push(128 | c & 63);
		} else {
			a.push(240 | c >> 18);
			a.push(128 | c >> 12 & 63);
			a.push(128 | c >> 6 & 63);
			a.push(128 | c & 63);
		}
	}
	return new haxe_io_Bytes(new Uint8Array(a).buffer);
};
haxe_io_Bytes.ofData = function(b) {
	var hb = b.hxBytes;
	if(hb != null) {
		return hb;
	}
	return new haxe_io_Bytes(b);
};
haxe_io_Bytes.fastGet = function(b,pos) {
	return b.bytes[pos];
};
haxe_io_Bytes.prototype = {
	sub: function(pos,len) {
		if(pos < 0 || len < 0 || pos + len > this.length) {
			throw new js__$Boot_HaxeError(haxe_io_Error.OutsideBounds);
		}
		return new haxe_io_Bytes(this.b.buffer.slice(pos + this.b.byteOffset,pos + this.b.byteOffset + len));
	}
};
var haxe_io_Error = { __ename__ : true, __constructs__ : ["Blocked","Overflow","OutsideBounds","Custom"] };
haxe_io_Error.Blocked = ["Blocked",0];
haxe_io_Error.Blocked.toString = $estr;
haxe_io_Error.Blocked.__enum__ = haxe_io_Error;
haxe_io_Error.Overflow = ["Overflow",1];
haxe_io_Error.Overflow.toString = $estr;
haxe_io_Error.Overflow.__enum__ = haxe_io_Error;
haxe_io_Error.OutsideBounds = ["OutsideBounds",2];
haxe_io_Error.OutsideBounds.toString = $estr;
haxe_io_Error.OutsideBounds.__enum__ = haxe_io_Error;
haxe_io_Error.Custom = function(e) { var $x = ["Custom",3,e]; $x.__enum__ = haxe_io_Error; $x.toString = $estr; return $x; };
var haxe_io_Path = function(path) {
	switch(path) {
	case ".":case "..":
		this.dir = path;
		this.file = "";
		return;
	}
	var c1 = path.lastIndexOf("/");
	var c2 = path.lastIndexOf("\\");
	if(c1 < c2) {
		this.dir = HxOverrides.substr(path,0,c2);
		path = HxOverrides.substr(path,c2 + 1,null);
		this.backslash = true;
	} else if(c2 < c1) {
		this.dir = HxOverrides.substr(path,0,c1);
		path = HxOverrides.substr(path,c1 + 1,null);
	} else {
		this.dir = null;
	}
	var cp = path.lastIndexOf(".");
	if(cp != -1) {
		this.ext = HxOverrides.substr(path,cp + 1,null);
		this.file = HxOverrides.substr(path,0,cp);
	} else {
		this.ext = null;
		this.file = path;
	}
};
haxe_io_Path.__name__ = true;
haxe_io_Path.directory = function(path) {
	var s = new haxe_io_Path(path);
	if(s.dir == null) {
		return "";
	}
	return s.dir;
};
haxe_io_Path.join = function(paths) {
	var paths1 = paths.filter(function(s) {
		if(s != null) {
			return s != "";
		} else {
			return false;
		}
	});
	if(paths1.length == 0) {
		return "";
	}
	var path = paths1[0];
	var _g1 = 1;
	var _g = paths1.length;
	while(_g1 < _g) {
		var i = _g1++;
		path = haxe_io_Path.addTrailingSlash(path);
		path += paths1[i];
	}
	return haxe_io_Path.normalize(path);
};
haxe_io_Path.normalize = function(path) {
	var slash = "/";
	path = path.split("\\").join(slash);
	if(path == slash) {
		return slash;
	}
	var target = [];
	var _g = 0;
	var _g1 = path.split(slash);
	while(_g < _g1.length) {
		var token = _g1[_g];
		++_g;
		if(token == ".." && target.length > 0 && target[target.length - 1] != "..") {
			target.pop();
		} else if(token != ".") {
			target.push(token);
		}
	}
	var tmp = target.join(slash);
	var regex_r = new RegExp("([^:])/+","g".split("u").join(""));
	var result = tmp.replace(regex_r,"$1" + slash);
	var acc_b = "";
	var colon = false;
	var slashes = false;
	var _g11 = 0;
	var _g2 = tmp.length;
	while(_g11 < _g2) {
		var i = _g11++;
		var _g21 = tmp.charCodeAt(i);
		switch(_g21) {
		case 47:
			if(!colon) {
				slashes = true;
			} else {
				var i1 = _g21;
				colon = false;
				if(slashes) {
					acc_b += "/";
					slashes = false;
				}
				acc_b += String.fromCharCode(i1);
			}
			break;
		case 58:
			acc_b += ":";
			colon = true;
			break;
		default:
			var i2 = _g21;
			colon = false;
			if(slashes) {
				acc_b += "/";
				slashes = false;
			}
			acc_b += String.fromCharCode(i2);
		}
	}
	return acc_b;
};
haxe_io_Path.addTrailingSlash = function(path) {
	if(path.length == 0) {
		return "/";
	}
	var c1 = path.lastIndexOf("/");
	var c2 = path.lastIndexOf("\\");
	if(c1 < c2) {
		if(c2 != path.length - 1) {
			return path + "\\";
		} else {
			return path;
		}
	} else if(c1 != path.length - 1) {
		return path + "/";
	} else {
		return path;
	}
};
haxe_io_Path.removeTrailingSlashes = function(path) {
	_hx_loop1: while(true) {
		var _g = HxOverrides.cca(path,path.length - 1);
		if(_g == null) {
			break;
		} else {
			switch(_g) {
			case 47:case 92:
				path = HxOverrides.substr(path,0,-1);
				break;
			default:
				break _hx_loop1;
			}
		}
	}
	return path;
};
var haxeshim__$Env_Env_$Impl_$ = {};
haxeshim__$Env_Env_$Impl_$.__name__ = true;
haxeshim__$Env_Env_$Impl_$.ofVars = function(vars) {
	var this1 = { };
	var ret = this1;
	var _g = 0;
	var _g1 = Reflect.fields(vars);
	while(_g < _g1.length) {
		var k = _g1[_g];
		++_g;
		ret[haxeshim_Os.IS_WINDOWS ? k.toUpperCase() : k] = vars[k];
	}
	var this2 = ret;
	return this2;
};
haxeshim__$Env_Env_$Impl_$.ofMap = function(map) {
	var this1 = { };
	var ret = this1;
	var k = map.keys();
	while(k.hasNext()) {
		var k1 = k.next();
		ret[haxeshim_Os.IS_WINDOWS ? k1.toUpperCase() : k1] = __map_reserved[k1] != null ? map.getReserved(k1) : map.h[k1];
	}
	var this2 = ret;
	return this2;
};
haxeshim__$Env_Env_$Impl_$.vars = function(this1) {
	return this1;
};
haxeshim__$Env_Env_$Impl_$.toVars = function(this1) {
	return Reflect.copy(this1);
};
haxeshim__$Env_Env_$Impl_$.get = function(this1,s) {
	return this1[haxeshim_Os.IS_WINDOWS ? s.toUpperCase() : s];
};
haxeshim__$Env_Env_$Impl_$.mergeInto = function(this1,that) {
	var _g = haxeshim__$Env_Env_$Impl_$.vars(that);
	if(this1 == null) {
		var v = _g;
		var this2 = v;
		return this2;
	} else if(_g == null) {
		var v1 = this1;
		var this3 = v1;
		return this3;
	} else {
		var a = this1;
		var b = _g;
		var this4 = { };
		var ret = this4;
		var _g1 = 0;
		var _g11 = [b,a];
		while(_g1 < _g11.length) {
			var vars = _g11[_g1];
			++_g1;
			var _g2 = 0;
			var _g3 = Reflect.fields(vars);
			while(_g2 < _g3.length) {
				var k = _g3[_g2];
				++_g2;
				ret[k] = vars[k];
			}
		}
		var this5 = ret;
		return this5;
	}
};
var haxeshim_Exec = function() { };
haxeshim_Exec.__name__ = true;
haxeshim_Exec.mergeEnv = function(env) {
	return haxeshim__$Env_Env_$Impl_$.mergeInto(env,haxeshim__$Env_Env_$Impl_$.ofVars(process.env));
};
haxeshim_Exec.sync = function(cmd,cwd,args,env) {
	var _g = js_node_ChildProcess.spawnSync(cmd,args,{ cwd : cwd, stdio : "inherit", env : haxeshim__$Env_Env_$Impl_$.toVars(haxeshim_Exec.mergeEnv(env))});
	var x = _g;
	if(x.error == null) {
		return tink_core_Outcome.Success(x.status);
	} else {
		var e = _g.error;
		return tink_core_Outcome.Failure(new tink_core_TypedError(null,"Failed to call " + cmd + " because " + Std.string(e),{ fileName : "haxeshim/Exec.hx", lineNumber : 39, className : "haxeshim.Exec", methodName : "sync"}));
	}
};
var haxeshim_Fs = function() { };
haxeshim_Fs.__name__ = true;
haxeshim_Fs.ensureDir = function(dir) {
	var isDir = StringTools.endsWith(dir,"/") || StringTools.endsWith(dir,"\\");
	if(isDir) {
		dir = haxe_io_Path.removeTrailingSlashes(dir);
	}
	var parent = haxe_io_Path.directory(dir);
	if(haxe_io_Path.removeTrailingSlashes(parent) == dir) {
		return;
	}
	if(!sys_FileSystem.exists(parent)) {
		haxeshim_Fs.ensureDir(haxe_io_Path.addTrailingSlash(parent));
	}
	if(isDir && !sys_FileSystem.exists(dir)) {
		sys_FileSystem.createDirectory(dir);
	}
};
haxeshim_Fs.peel = function(file,depth) {
	var start = 0;
	var _g1 = 0;
	var _g = depth;
	while(_g1 < _g) {
		var i = _g1++;
		var _g2 = file.indexOf("/",start);
		if(_g2 == -1) {
			return haxe_ds_Option.None;
		} else {
			var v = _g2;
			start = v + 1;
		}
	}
	return haxe_ds_Option.Some(HxOverrides.substr(file,start,null));
};
var haxeshim_Os = function() { };
haxeshim_Os.__name__ = true;
haxeshim_Os.slashes = function(path) {
	if(haxeshim_Os.IS_WINDOWS) {
		return StringTools.replace(path,"/","\\");
	} else {
		return path;
	}
};
var tink_core__$Lazy_LazyObject = function() { };
tink_core__$Lazy_LazyObject.__name__ = true;
var tink_core__$Lazy_LazyConst = function(value) {
	this.value = value;
};
tink_core__$Lazy_LazyConst.__name__ = true;
tink_core__$Lazy_LazyConst.__interfaces__ = [tink_core__$Lazy_LazyObject];
tink_core__$Lazy_LazyConst.prototype = {
	get: function() {
		return this.value;
	}
	,map: function(f) {
		var _gthis = this;
		return new tink_core__$Lazy_LazyFunc(function() {
			return f(_gthis.value);
		});
	}
};
var haxeshim_Scope = function() { };
haxeshim_Scope.__name__ = true;
haxeshim_Scope.env = function(s) {
	var _g = process.env[s];
	if(_g == null) {
		return haxe_ds_Option.None;
	} else if(_g == "") {
		return haxe_ds_Option.None;
	} else {
		var v = _g;
		return haxe_ds_Option.Some(v);
	}
};
var haxeshim_Neko = function() { };
haxeshim_Neko.__name__ = true;
haxeshim_Neko.setEnv = function() {
	if(haxeshim_Neko.isset) {
		if(haxeshim_Os.IS_WINDOWS) {
			var _g = 0;
			var this1 = haxeshim_Neko.ENV;
			var _g1 = this1 == null ? [] : Reflect.fields(this1);
			while(_g < _g1.length) {
				var k = _g1[_g];
				++_g;
				var v = haxeshim__$Env_Env_$Impl_$.get(haxeshim_Neko.ENV,k);
				process.env[k] = v;
			}
		}
		haxeshim_Neko.isset = false;
	}
};
var haxeshim_NekoCli = function() { };
haxeshim_NekoCli.__name__ = true;
haxeshim_NekoCli.main = function() {
	haxeshim_Neko.setEnv();
	var binary = haxeshim_Os.IS_WINDOWS ? "neko.exe" : "neko";
	var code;
	var _g = haxeshim_Exec.sync(haxeshim_Neko.PATH + ("/" + binary),process.cwd(),process.argv.slice(2),haxeshim_Neko.ENV);
	switch(_g[1]) {
	case 0:
		var c = _g[2];
		code = c;
		break;
	case 1:
		var e = _g[2];
		code = e.code;
		break;
	}
	process.exit(code);
};
var js__$Boot_HaxeError = function(val) {
	Error.call(this);
	this.val = val;
	if(Error.captureStackTrace) {
		Error.captureStackTrace(this,js__$Boot_HaxeError);
	}
};
js__$Boot_HaxeError.__name__ = true;
js__$Boot_HaxeError.wrap = function(val) {
	if((val instanceof Error)) {
		return val;
	} else {
		return new js__$Boot_HaxeError(val);
	}
};
js__$Boot_HaxeError.__super__ = Error;
js__$Boot_HaxeError.prototype = $extend(Error.prototype,{
});
var js_Boot = function() { };
js_Boot.__name__ = true;
js_Boot.__string_rec = function(o,s) {
	if(o == null) {
		return "null";
	}
	if(s.length >= 5) {
		return "<...>";
	}
	var t = typeof(o);
	if(t == "function" && (o.__name__ || o.__ename__)) {
		t = "object";
	}
	switch(t) {
	case "function":
		return "<function>";
	case "object":
		if((o instanceof Array)) {
			if(o.__enum__) {
				if(o.length == 2) {
					return o[0];
				}
				var str = o[0] + "(";
				s += "\t";
				var _g1 = 2;
				var _g = o.length;
				while(_g1 < _g) {
					var i = _g1++;
					if(i != 2) {
						str += "," + js_Boot.__string_rec(o[i],s);
					} else {
						str += js_Boot.__string_rec(o[i],s);
					}
				}
				return str + ")";
			}
			var l = o.length;
			var i1;
			var str1 = "[";
			s += "\t";
			var _g11 = 0;
			var _g2 = l;
			while(_g11 < _g2) {
				var i2 = _g11++;
				str1 += (i2 > 0 ? "," : "") + js_Boot.__string_rec(o[i2],s);
			}
			str1 += "]";
			return str1;
		}
		var tostr;
		try {
			tostr = o.toString;
		} catch( e ) {
			var e1 = (e instanceof js__$Boot_HaxeError) ? e.val : e;
			return "???";
		}
		if(tostr != null && tostr != Object.toString && typeof(tostr) == "function") {
			var s2 = o.toString();
			if(s2 != "[object Object]") {
				return s2;
			}
		}
		var k = null;
		var str2 = "{\n";
		s += "\t";
		var hasp = o.hasOwnProperty != null;
		for( var k in o ) {
		if(hasp && !o.hasOwnProperty(k)) {
			continue;
		}
		if(k == "prototype" || k == "__class__" || k == "__super__" || k == "__interfaces__" || k == "__properties__") {
			continue;
		}
		if(str2.length != 2) {
			str2 += ", \n";
		}
		str2 += s + k + " : " + js_Boot.__string_rec(o[k],s);
		}
		s = s.substring(1);
		str2 += "\n" + s + "}";
		return str2;
	case "string":
		return o;
	default:
		return String(o);
	}
};
var js_node_ChildProcess = require("child_process");
var js_node_Fs = require("fs");
var js_node_Http = require("http");
var js_node_Https = require("https");
var js_node_Path = require("path");
var js_node_Url = require("url");
var js_node_buffer_Buffer = require("buffer").Buffer;
var js_node_buffer__$Buffer_Helper = function() { };
js_node_buffer__$Buffer_Helper.__name__ = true;
js_node_buffer__$Buffer_Helper.bytesOfBuffer = function(b) {
	var o = Object.create(haxe_io_Bytes.prototype);
	o.length = b.byteLength;
	o.b = b;
	b.bufferValue = b;
	b.hxBytes = o;
	b.bytes = b;
	return o;
};
var js_node_stream_PassThrough = require("stream").PassThrough;
var lix_cli_Command = function() { };
lix_cli_Command.__name__ = true;
lix_cli_Command.attempt = function(p,andThen) {
	var f = tink_core__$Promise_Recover_$Impl_$.ofSync(lix_cli_Command.reportError);
	var ret = p.flatMap(function(o) {
		switch(o[1]) {
		case 0:
			var d = o[2];
			return new tink_core__$Future_SyncFuture(new tink_core__$Lazy_LazyConst(d));
		case 1:
			var e = o[2];
			return f(e);
		}
	});
	ret.gather().handle(andThen);
};
lix_cli_Command.reportError = function(e) {
	new _$Sys_FileOutput(2).writeString(e.message + "\n\n");
	process.exit(e.code);
	return null;
};
var lix_cli_NekoCmd = function() { };
lix_cli_NekoCmd.__name__ = true;
lix_cli_NekoCmd.ensure = function() {
	return lix_client_haxe_Switcher.ensureNeko(Sys.println);
};
lix_cli_NekoCmd.main = function() {
	lix_cli_Command.attempt(lix_cli_NekoCmd.ensure(),tink_core__$Callback_Callback_$Impl_$.fromNiladic(haxeshim_NekoCli.main));
};
var lix_client_Download = function() { };
lix_client_Download.__name__ = true;
lix_client_Download.buffered = function(r) {
	return tink_core__$Future_Future_$Impl_$.async(function(cb) {
		var ret = [];
		r.on("data",$bind(ret,$arrayPush));
		r.on("end",function() {
			var tmp = tink_core_Outcome.Success(js_node_buffer__$Buffer_Helper.bytesOfBuffer(js_node_buffer_Buffer.concat(ret)));
			cb(tmp);
		});
	});
};
lix_client_Download.unzip = function(src,into,peel,res,events) {
	tink_core__$Promise_Promise_$Impl_$.next(lix_client_Download.buffered(res),function(bytes) {
		return tink_core__$Future_Future_$Impl_$.async(function(cb) {
			var pos = bytes.length - 4;
			while(pos-- > 0) if(bytes.b[pos] == 80 && bytes.b[pos + 1] == 75 && bytes.b[pos + 2] == 5 && bytes.b[pos + 3] == 6) {
				bytes.b[pos + 20] = 0;
				bytes.b[pos + 21] = 0;
				bytes = bytes.sub(0,pos + 22);
				break;
			}
			if(pos == 0) {
				var this1 = tink_core_Outcome.Failure(new tink_core_TypedError(422,"Unzip failed to find central directory in " + src,{ fileName : "Download.hx", lineNumber : 70, className : "lix.client.Download", methodName : "unzip"}));
				cb(this1);
				return;
			}
			var data = bytes.b;
			lix_client_uncompress_Yauzl.fromBuffer(new js_node_buffer_Buffer(data.buffer,data.byteOffset,bytes.length),function(err,zip) {
				var saved = -1;
				var done = function() {
					saved += 1;
					events.onProgress(saved,zip.entryCount,false);
					if(saved == zip.entryCount) {
						var f = cb;
						var a1 = tink_core_Outcome.Success(into);
						haxe_Timer.delay(function() {
							f(a1);
						},100);
					}
				};
				if(err != null) {
					var this2 = tink_core_Outcome.Failure(new tink_core_TypedError(422,"Failed to unzip " + src + " because " + Std.string(err),{ fileName : "Download.hx", lineNumber : 83, className : "lix.client.Download", methodName : "unzip"}));
					cb(this2);
				}
				zip.on("entry",function(entry) {
					var _g = haxeshim_Fs.peel(entry.fileName,peel);
					switch(_g[1]) {
					case 0:
						var f1 = _g[2];
						var path = "" + into + "/" + f1;
						if(StringTools.endsWith(path,"/")) {
							done();
						} else {
							haxeshim_Fs.ensureDir(path);
							zip.openReadStream(entry,function(e,stream) {
								var out = js_node_Fs.createWriteStream(path);
								stream.pipe(out,{ end : true});
								out.on("close",done);
							});
						}
						break;
					case 1:
						break;
					}
				});
				zip.on("end",function() {
					zip.close();
					done();
				});
			});
		});
	}).handle($bind(events,events.done));
};
lix_client_Download.untar = function(src,into,peel,res,events) {
	return tink_core__$Future_Future_$Impl_$.async(function(cb) {
		var total = 0;
		var written = 0;
		var symlinks = [];
		var update = function() {
			events.onProgress(written,total + 1,true);
		};
		var pending = 1;
		var done = function(progress) {
			if(progress == null) {
				progress = 0;
			}
			written += progress;
			update();
			haxe_Timer.delay(function() {
				if((pending -= 1) <= 0) {
					events.onProgress(total,total,true);
					var _g = [];
					var _g1 = 0;
					while(_g1 < symlinks.length) {
						var link = [symlinks[_g1]];
						++_g1;
						_g.push(tink_core__$Future_Future_$Impl_$.async((function(link1) {
							return function(cb1) {
								js_node_Fs.unlink(link1[0].to,(function(link2) {
									return function(_) {
										js_node_Fs.symlink(link2[0].from,link2[0].to,(function() {
											return function(e) {
												var this1 = e == null ? tink_core_Outcome.Success(tink_core_Noise.Noise) : tink_core_Outcome.Failure(new tink_core_TypedError(null,e.message,{ fileName : "Download.hx", lineNumber : 130, className : "lix.client.Download", methodName : "untar"}));
												cb1(this1);
											};
										})());
									};
								})(link1));
							};
						})(link)));
					}
					tink_core__$Promise_Promise_$Impl_$.next(tink_core__$Promise_Promise_$Impl_$.inParallel(_g),function(_1) {
						return tink_core__$Promise_Promise_$Impl_$.ofOutcome(tink_core_Outcome.Success(into));
					}).handle(cb);
				}
			},100);
		};
		var error = null;
		var fail = function(message) {
			error = new tink_core_TypedError(null,message,{ fileName : "Download.hx", lineNumber : 142, className : "lix.client.Download", methodName : "untar"});
			cb(tink_core_Outcome.Failure(error));
		};
		lix_client_uncompress_Tar.parse(res,function(entry) {
			if(error != null) {
				return;
			}
			total += entry.size;
			update();
			var skip = function() {
				entry.on("data",function() {
				});
			};
			var _g2 = haxeshim_Fs.peel(entry.path,peel);
			switch(_g2[1]) {
			case 0:
				var f = _g2[2];
				var path = "" + into + "/" + f;
				if(StringTools.endsWith(path,"/")) {
					skip();
				} else {
					haxeshim_Fs.ensureDir(path);
					if(entry.type == "SymbolicLink") {
						skip();
						var this2 = haxe_io_Path.directory(path);
						symlinks.push({ from : haxe_io_Path.join([this2,entry.linkpath]), to : path});
					} else {
						pending += 1;
						var buffer = new js_node_stream_PassThrough();
						var out = js_node_Fs.createWriteStream(path,{ mode : entry.mode});
						entry.pipe(buffer,{ end : true});
						buffer.pipe(out,{ end : true});
						var f1 = done;
						var progress1 = entry.size;
						out.on("close",function() {
							f1(progress1);
						});
					}
				}
				break;
			case 1:
				skip();
				break;
			}
		}).handle(function(o) {
			if(o[1] == 1) {
				var e1 = o[2];
				cb(tink_core_Outcome.Failure(e1));
			} else {
				done();
			}
		});
	}).handle($bind(events,events.done));
};
lix_client_Download.tar = function(url,peel,into,progress) {
	var into1 = into;
	var peel1 = peel;
	return lix_client_Download.download(url,lix_client_Download.withProgress(progress,function(src,res,events) {
		return lix_client_Download.untar(src,into1,peel1,res,events);
	}));
};
lix_client_Download.zip = function(url,peel,into,progress) {
	var into1 = into;
	var peel1 = peel;
	return lix_client_Download.download(url,lix_client_Download.withProgress(progress,function(src,res,events) {
		lix_client_Download.unzip(src,into1,peel1,res,events);
	}));
};
lix_client_Download.withProgress = function(progress,handler) {
	return function(url,msg,cb) {
		if(progress != true || !process.stdout.isTTY) {
			handler(url,msg,{ onProgress : function(_,_1,_2) {
			}, done : cb});
			return;
		}
		var size = Std.parseInt(msg.headers["content-length"]);
		var loaded = 0;
		var saved = 0;
		var total = 1;
		var last = null;
		var progress1 = function(s) {
			if(s == last) {
				return;
			}
			last = s;
			process.stdout.clearLine(0);
			process.stdout.cursorTo(0);
			process.stdout.write(s);
		};
		var pct = function(f) {
			if(!(f <= 1.0)) {
				f = 1;
			}
			var _g = Std.string(Math.round(1000 * f) / 10);
			var pct1;
			var _hx_tmp = _g.indexOf(".");
			if(_hx_tmp == -1) {
				var whole = _g;
				pct1 = "" + whole + ".0";
			} else {
				var v = _g;
				pct1 = v;
			}
			return StringTools.lpad(pct1," ",5) + "%";
		};
		var lastUpdate = new Date(0).getTime();
		var update = function() {
			if(saved == total || saved / total >= 1.0) {
				progress1("Done!\n");
			} else {
				var now = new Date().getTime();
				if(now > lastUpdate + 137) {
					lastUpdate = now;
					var messages = [];
					if(loaded < size) {
						messages.push("Downloaded: " + pct(loaded / size));
					}
					if(saved > 0) {
						messages.push("Saved: " + pct(saved / total));
					}
					var update1 = messages.join("   ");
					progress1(update1);
				}
			}
		};
		msg.on("data",function(buf) {
			loaded += buf.length;
			update();
		});
		var last1 = .0;
		handler(url,msg,{ onProgress : function(_saved,_total,binary) {
			saved = _saved;
			total = _total;
			if(binary) {
				var downloaded = loaded / size;
				var decompressed = saved / total;
				var estimate = downloaded * decompressed;
				if(estimate < last1) {
					estimate = last1;
				}
				last1 = estimate;
				saved = Math.round(estimate * 1000);
				total = 1000;
			}
			update();
		}, done : cb});
	};
};
lix_client_Download.download = function(url,handler) {
	return tink_core__$Future_Future_$Impl_$.async(function(cb) {
		var options = js_node_Url.parse(url);
		options.agent = false;
		if(options.headers == null) {
			options.headers = { };
		}
		options.headers["user-agent"] = lix_client_Download.USER_AGENT;
		var fail = function(e) {
			var fail1 = tink_core_Outcome.Failure(tink_core_TypedError.withData(null,"Failed to download " + url + " because " + e.message,e,{ fileName : "Download.hx", lineNumber : 287, className : "lix.client.Download", methodName : "download"}));
			cb(fail1);
		};
		var req = StringTools.startsWith(url,"https:") ? js_node_Https.get(options) : js_node_Http.get(options);
		req.setTimeout(30000);
		req.on("error",fail);
		req.on("response",function(res) {
			if(res.statusCode >= 400) {
				var tmp = tink_core_Outcome.Failure(tink_core_TypedError.withData(res.statusCode,res.statusMessage,res,{ fileName : "Download.hx", lineNumber : 298, className : "lix.client.Download", methodName : "download"}));
				cb(tmp);
			} else {
				var _g = res.headers["location"];
				if(_g == null) {
					res.on("error",fail);
					handler(url,res,function(v) {
						switch(v[1]) {
						case 0:
							var x = v[2];
							cb(tink_core_Outcome.Success(x));
							break;
						case 1:
							var e1 = v[2];
							cb(tink_core_Outcome.Failure(e1));
							break;
						}
					});
				} else {
					var v1 = _g;
					var _g1 = js_node_Url.parse(v1);
					lix_client_Download.download(_g1.protocol == null ? options.protocol + "//" + options.host + v1 : v1,handler).handle(cb);
				}
			}
		});
	});
};
var lix_client_haxe_Switcher = function() { };
lix_client_haxe_Switcher.__name__ = true;
lix_client_haxe_Switcher.ensureNeko = function(echo) {
	var neko = haxeshim_Neko.PATH;
	if(sys_FileSystem.exists(neko)) {
		return tink_core__$Promise_Promise_$Impl_$.ofOutcome(tink_core_Outcome.Success(neko));
	} else {
		echo("Neko seems to be missing. Attempting download ...");
		var _g = Sys.systemName();
		var tmp;
		switch(_g) {
		case "Mac":
			tmp = lix_client_Download.tar("https://github.com/HaxeFoundation/neko/releases/download/v2-2-0/neko-2.2.0-osx64.tar.gz",1,neko,true);
			break;
		case "Windows":
			tmp = lix_client_Download.zip("https://github.com/HaxeFoundation/neko/releases/download/v2-2-0/neko-2.2.0-win.zip",1,neko,true);
			break;
		default:
			tmp = lix_client_Download.tar("https://github.com/HaxeFoundation/neko/releases/download/v2-2-0/neko-2.2.0-linux64.tar.gz",1,neko,true);
		}
		return tink_core__$Promise_Promise_$Impl_$.next(tmp,function(x) {
			echo("done");
			return tink_core__$Promise_Promise_$Impl_$.ofOutcome(tink_core_Outcome.Success(x));
		});
	}
};
var lix_client_uncompress_Tar = function() { };
lix_client_uncompress_Tar.__name__ = true;
lix_client_uncompress_Tar.parse = function(source,onentry) {
	return tink_core__$Future_Future_$Impl_$.async(function(cb) {
		var parse = new lix_client_uncompress_TarParse({ onentry : onentry});
		source.pipe(parse,{ end : true});
		parse.on("end",function() {
			cb(tink_core_Outcome.Success(tink_core_Noise.Noise));
		});
		parse.on("error",function(e) {
			var tmp = tink_core_Outcome.Failure(new tink_core_TypedError(null,e.message,{ fileName : "Tar.hx", lineNumber : 14, className : "lix.client.uncompress.Tar", methodName : "parse"}));
			cb(tmp);
		});
	});
};
var lix_client_uncompress_TarParse = require("tar").Parse;
var lix_client_uncompress_Yauzl = require("yauzl");
var sys_FileSystem = function() { };
sys_FileSystem.__name__ = true;
sys_FileSystem.exists = function(path) {
	try {
		js_node_Fs.accessSync(path);
		return true;
	} catch( _ ) {
		var _1 = (_ instanceof js__$Boot_HaxeError) ? _.val : _;
		return false;
	}
};
sys_FileSystem.createDirectory = function(path) {
	try {
		js_node_Fs.mkdirSync(path);
	} catch( e ) {
		var e1 = (e instanceof js__$Boot_HaxeError) ? e.val : e;
		if(e1.code == "ENOENT") {
			sys_FileSystem.createDirectory(js_node_Path.dirname(path));
			js_node_Fs.mkdirSync(path);
		} else {
			var stat;
			try {
				stat = js_node_Fs.statSync(path);
			} catch( _ ) {
				var _1 = (_ instanceof js__$Boot_HaxeError) ? _.val : _;
				throw e1;
			}
			if(!stat.isDirectory()) {
				throw e1;
			}
		}
	}
};
var tink_core__$Callback_Callback_$Impl_$ = {};
tink_core__$Callback_Callback_$Impl_$.__name__ = true;
tink_core__$Callback_Callback_$Impl_$.invoke = function(this1,data) {
	if(tink_core__$Callback_Callback_$Impl_$.depth < 1000) {
		tink_core__$Callback_Callback_$Impl_$.depth++;
		this1(data);
		tink_core__$Callback_Callback_$Impl_$.depth--;
	} else {
		var _e = this1;
		var f = function(data1) {
			tink_core__$Callback_Callback_$Impl_$.invoke(_e,data1);
		};
		var data2 = data;
		tink_core__$Callback_Callback_$Impl_$.defer(function() {
			f(data2);
		});
	}
};
tink_core__$Callback_Callback_$Impl_$.fromNiladic = function(f) {
	return f;
};
tink_core__$Callback_Callback_$Impl_$.defer = function(f) {
	process.nextTick(f);
};
var tink_core__$Callback_LinkObject = function() { };
tink_core__$Callback_LinkObject.__name__ = true;
var tink_core__$Callback_CallbackLink_$Impl_$ = {};
tink_core__$Callback_CallbackLink_$Impl_$.__name__ = true;
tink_core__$Callback_CallbackLink_$Impl_$.fromMany = function(callbacks) {
	var this1 = new tink_core__$Callback_SimpleLink(function() {
		var _g = 0;
		while(_g < callbacks.length) {
			var cb = callbacks[_g];
			++_g;
			if(cb != null) {
				cb.cancel();
			}
		}
	});
	return this1;
};
var tink_core__$Callback_SimpleLink = function(f) {
	this.f = f;
};
tink_core__$Callback_SimpleLink.__name__ = true;
tink_core__$Callback_SimpleLink.__interfaces__ = [tink_core__$Callback_LinkObject];
tink_core__$Callback_SimpleLink.prototype = {
	cancel: function() {
		if(this.f != null) {
			this.f();
			this.f = null;
		}
	}
};
var tink_core__$Callback_ListCell = function(cb,list) {
	if(cb == null) {
		throw new js__$Boot_HaxeError("callback expected but null received");
	}
	this.cb = cb;
	this.list = list;
};
tink_core__$Callback_ListCell.__name__ = true;
tink_core__$Callback_ListCell.__interfaces__ = [tink_core__$Callback_LinkObject];
tink_core__$Callback_ListCell.prototype = {
	clear: function() {
		this.list = null;
		this.cb = null;
	}
	,cancel: function() {
		var _g = this.list;
		if(_g != null) {
			var v = _g;
			this.clear();
			HxOverrides.remove(v,this);
		}
	}
};
var tink_core__$Callback_CallbackList_$Impl_$ = {};
tink_core__$Callback_CallbackList_$Impl_$.__name__ = true;
tink_core__$Callback_CallbackList_$Impl_$.add = function(this1,cb) {
	var node = new tink_core__$Callback_ListCell(cb,this1);
	this1.push(node);
	return node;
};
tink_core__$Callback_CallbackList_$Impl_$.invoke = function(this1,data) {
	var _g = 0;
	var _g1 = this1.slice();
	while(_g < _g1.length) {
		var cell = _g1[_g];
		++_g;
		if(cell.cb != null) {
			tink_core__$Callback_Callback_$Impl_$.invoke(cell.cb,data);
		}
	}
};
tink_core__$Callback_CallbackList_$Impl_$.clear = function(this1) {
	var _g = 0;
	var _g1 = this1.splice(0,this1.length);
	while(_g < _g1.length) {
		var cell = _g1[_g];
		++_g;
		cell.clear();
	}
};
var tink_core_TypedError = function(code,message,pos) {
	if(code == null) {
		code = 500;
	}
	this.isTinkError = true;
	this.code = code;
	this.message = message;
	this.pos = pos;
	this.exceptionStack = [];
	this.callStack = [];
};
tink_core_TypedError.__name__ = true;
tink_core_TypedError.withData = function(code,message,data,pos) {
	return tink_core_TypedError.typed(code,message,data,pos);
};
tink_core_TypedError.typed = function(code,message,data,pos) {
	var ret = new tink_core_TypedError(code,message,pos);
	ret.data = data;
	return ret;
};
tink_core_TypedError.ofJsError = function(e,pos) {
	return tink_core_TypedError.withData(500,e.message,e,pos);
};
tink_core_TypedError.asError = function(v) {
	if(v != null && v.isTinkError) {
		return v;
	} else {
		return null;
	}
};
tink_core_TypedError.catchExceptions = function(f,report,pos) {
	try {
		return tink_core_Outcome.Success(f());
	} catch( e ) {
		var e1 = (e instanceof js__$Boot_HaxeError) ? e.val : e;
		var _g = tink_core_TypedError.asError(e1);
		var tmp;
		if(_g == null) {
			tmp = report == null ? tink_core_TypedError.withData(null,"Unexpected Error",e1,pos) : report(e1);
		} else {
			var e2 = _g;
			tmp = e2;
		}
		return tink_core_Outcome.Failure(tmp);
	}
};
tink_core_TypedError.reporter = function(code,message,pos) {
	return function(e) {
		return tink_core_TypedError.withData(code,message,e,pos);
	};
};
tink_core_TypedError.rethrow = function(any) {
	throw js__$Boot_HaxeError.wrap(any);
};
tink_core_TypedError.tryFinally = function(f,cleanup) {
	try { return f(); } finally { cleanup(); }
	return null;
};
var tink_core__$Future_FutureObject = function() { };
tink_core__$Future_FutureObject.__name__ = true;
var tink_core__$Future_SyncFuture = function(value) {
	this.value = value;
};
tink_core__$Future_SyncFuture.__name__ = true;
tink_core__$Future_SyncFuture.__interfaces__ = [tink_core__$Future_FutureObject];
tink_core__$Future_SyncFuture.prototype = {
	flatMap: function(f) {
		var l = this.value.map(f);
		return new tink_core__$Future_SimpleFuture(function(cb) {
			return l.get().handle(cb);
		});
	}
	,handle: function(cb) {
		tink_core__$Callback_Callback_$Impl_$.invoke(cb,this.value.get());
		return null;
	}
	,gather: function() {
		return this;
	}
};
var tink_core_Noise = { __ename__ : true, __constructs__ : ["Noise"] };
tink_core_Noise.Noise = ["Noise",0];
tink_core_Noise.Noise.toString = $estr;
tink_core_Noise.Noise.__enum__ = tink_core_Noise;
var tink_core__$Future_Future_$Impl_$ = {};
tink_core__$Future_Future_$Impl_$.__name__ = true;
tink_core__$Future_Future_$Impl_$.flatten = function(f) {
	return new tink_core__$Future_NestedFuture(f);
};
tink_core__$Future_Future_$Impl_$.async = function(f,lazy) {
	if(lazy == null) {
		lazy = false;
	}
	if(lazy) {
		return new tink_core__$Future_LazyTrigger(f);
	} else {
		var op = new tink_core_FutureTrigger();
		var wrapped = f;
		tink_core__$Callback_Callback_$Impl_$.invoke(wrapped,$bind(op,op.trigger));
		return op;
	}
};
var tink_core__$Future_SimpleFuture = function(f) {
	this.f = f;
};
tink_core__$Future_SimpleFuture.__name__ = true;
tink_core__$Future_SimpleFuture.__interfaces__ = [tink_core__$Future_FutureObject];
tink_core__$Future_SimpleFuture.prototype = {
	handle: function(callback) {
		return this.f(callback);
	}
	,flatMap: function(f) {
		var f1 = f;
		var _gthis = this;
		return tink_core__$Future_Future_$Impl_$.flatten(new tink_core__$Future_SimpleFuture(function(cb) {
			return _gthis.f(function(v) {
				var tmp = f1(v);
				tink_core__$Callback_Callback_$Impl_$.invoke(cb,tmp);
			});
		}));
	}
	,gather: function() {
		if(this.gathered != null) {
			return this.gathered;
		} else {
			return this.gathered = tink_core_FutureTrigger.gatherFuture(this);
		}
	}
};
var tink_core__$Future_NestedFuture = function(outer) {
	this.outer = outer;
};
tink_core__$Future_NestedFuture.__name__ = true;
tink_core__$Future_NestedFuture.__interfaces__ = [tink_core__$Future_FutureObject];
tink_core__$Future_NestedFuture.prototype = {
	flatMap: function(f) {
		var ret = this.outer.flatMap(function(inner) {
			var ret1 = inner.flatMap(f);
			return ret1.gather();
		});
		return ret.gather();
	}
	,gather: function() {
		if(this.gathered != null) {
			return this.gathered;
		} else {
			return this.gathered = tink_core_FutureTrigger.gatherFuture(this);
		}
	}
	,handle: function(cb) {
		var ret = null;
		ret = this.outer.handle(function(inner) {
			ret = inner.handle(function(result) {
				tink_core__$Callback_Callback_$Impl_$.invoke(cb,result);
			});
		});
		return ret;
	}
};
var tink_core_FutureTrigger = function() {
	var this1 = [];
	this.list = this1;
};
tink_core_FutureTrigger.__name__ = true;
tink_core_FutureTrigger.__interfaces__ = [tink_core__$Future_FutureObject];
tink_core_FutureTrigger.gatherFuture = function(f) {
	var op = null;
	var this1 = new tink_core__$Future_SimpleFuture(function(cb) {
		if(op == null) {
			op = new tink_core_FutureTrigger();
			f.handle($bind(op,op.trigger));
			f = null;
		}
		return op.handle(cb);
	});
	return this1;
};
tink_core_FutureTrigger.prototype = {
	handle: function(callback) {
		var _g = this.list;
		if(_g == null) {
			tink_core__$Callback_Callback_$Impl_$.invoke(callback,this.result);
			return null;
		} else {
			var v = _g;
			return tink_core__$Callback_CallbackList_$Impl_$.add(v,callback);
		}
	}
	,flatMap: function(f) {
		var _g = this.list;
		if(_g == null) {
			return f(this.result);
		} else {
			var v = _g;
			var ret = new tink_core_FutureTrigger();
			tink_core__$Callback_CallbackList_$Impl_$.add(this.list,function(v1) {
				f(v1).handle($bind(ret,ret.trigger));
			});
			return ret;
		}
	}
	,gather: function() {
		return this;
	}
	,trigger: function(result) {
		if(this.list == null) {
			return false;
		} else {
			var list = this.list;
			this.list = null;
			this.result = result;
			tink_core__$Callback_CallbackList_$Impl_$.invoke(list,result);
			tink_core__$Callback_CallbackList_$Impl_$.clear(list);
			return true;
		}
	}
};
var tink_core__$Future_LazyTrigger = function(op) {
	this.op = op;
	tink_core_FutureTrigger.call(this);
};
tink_core__$Future_LazyTrigger.__name__ = true;
tink_core__$Future_LazyTrigger.__super__ = tink_core_FutureTrigger;
tink_core__$Future_LazyTrigger.prototype = $extend(tink_core_FutureTrigger.prototype,{
	eager: function() {
		if(this.op != null) {
			var op = this.op;
			this.op = null;
			tink_core__$Callback_Callback_$Impl_$.invoke(op,$bind(this,this.trigger));
		}
		return this;
	}
	,flatMap: function(f) {
		var _gthis = this;
		if(this.op == null) {
			return tink_core_FutureTrigger.prototype.flatMap.call(this,f);
		} else {
			return tink_core__$Future_Future_$Impl_$.async(function(cb) {
				_gthis.handle(function(v) {
					f(v).handle(cb);
				});
			},true);
		}
	}
	,handle: function(cb) {
		this.eager();
		return tink_core_FutureTrigger.prototype.handle.call(this,cb);
	}
});
var tink_core__$Lazy_LazyFunc = function(f) {
	this.f = f;
};
tink_core__$Lazy_LazyFunc.__name__ = true;
tink_core__$Lazy_LazyFunc.__interfaces__ = [tink_core__$Lazy_LazyObject];
tink_core__$Lazy_LazyFunc.prototype = {
	get: function() {
		if(this.f != null) {
			this.result = this.f();
			this.f = null;
		}
		return this.result;
	}
	,map: function(f) {
		var _gthis = this;
		return new tink_core__$Lazy_LazyFunc(function() {
			var tmp = _gthis.get();
			return f(tmp);
		});
	}
};
var tink_core_Outcome = { __ename__ : true, __constructs__ : ["Success","Failure"] };
tink_core_Outcome.Success = function(data) { var $x = ["Success",0,data]; $x.__enum__ = tink_core_Outcome; $x.toString = $estr; return $x; };
tink_core_Outcome.Failure = function(failure) { var $x = ["Failure",1,failure]; $x.__enum__ = tink_core_Outcome; $x.toString = $estr; return $x; };
var tink_core__$Promise_Promise_$Impl_$ = {};
tink_core__$Promise_Promise_$Impl_$.__name__ = true;
tink_core__$Promise_Promise_$Impl_$.next = function(this1,f,gather) {
	if(gather == null) {
		gather = true;
	}
	var ret = this1.flatMap(function(o) {
		switch(o[1]) {
		case 0:
			var d = o[2];
			return f(d);
		case 1:
			var f1 = o[2];
			return new tink_core__$Future_SyncFuture(new tink_core__$Lazy_LazyConst(tink_core_Outcome.Failure(f1)));
		}
	});
	if(gather) {
		return ret.gather();
	} else {
		return ret;
	}
};
tink_core__$Promise_Promise_$Impl_$.ofOutcome = function(o) {
	return new tink_core__$Future_SyncFuture(new tink_core__$Lazy_LazyConst(o));
};
tink_core__$Promise_Promise_$Impl_$.inParallel = function(a,concurrency,lazy) {
	if(a.length == 0) {
		return new tink_core__$Future_SyncFuture(new tink_core__$Lazy_LazyConst(tink_core_Outcome.Success([])));
	} else {
		return tink_core__$Future_Future_$Impl_$.async(function(cb) {
			var result = [];
			var pending = a.length;
			var links = null;
			var linkArray = [];
			var sync = false;
			var i = 0;
			var iter = HxOverrides.iter(a);
			var next = null;
			var done = function(o) {
				if(links == null) {
					sync = true;
				} else if(links != null) {
					links.cancel();
				}
				cb(o);
			};
			var fail = function(e) {
				pending = 0;
				done(tink_core_Outcome.Failure(e));
			};
			var set = function(index,value) {
				result[index] = value;
				if((pending -= 1) == 0) {
					done(tink_core_Outcome.Success(result));
				} else if(iter.hasNext() && pending > 0) {
					next();
				}
			};
			next = function() {
				i += 1;
				var index1 = i - 1;
				var next1 = iter.next().handle(function(o1) {
					switch(o1[1]) {
					case 0:
						var v = o1[2];
						set(index1,v);
						break;
					case 1:
						var e1 = o1[2];
						fail(e1);
						break;
					}
				});
				linkArray.push(next1);
			};
			while(true) {
				var tmp;
				if(iter.hasNext() && pending > 0) {
					if(concurrency != null) {
						concurrency -= 1;
						tmp = concurrency + 1 > 0;
					} else {
						tmp = true;
					}
				} else {
					tmp = false;
				}
				if(!tmp) {
					break;
				}
				next();
			}
			links = tink_core__$Callback_CallbackLink_$Impl_$.fromMany(linkArray);
			if(sync) {
				if(links != null) {
					links.cancel();
				}
			}
		},lazy);
	}
};
var tink_core__$Promise_Recover_$Impl_$ = {};
tink_core__$Promise_Recover_$Impl_$.__name__ = true;
tink_core__$Promise_Recover_$Impl_$.ofSync = function(f) {
	return function(e) {
		return new tink_core__$Future_SyncFuture(new tink_core__$Lazy_LazyConst(f(e)));
	};
};
var $_, $fid = 0;
function $bind(o,m) { if( m == null ) return null; if( m.__id__ == null ) m.__id__ = $fid++; var f; if( o.hx__closures__ == null ) o.hx__closures__ = {}; else f = o.hx__closures__[m.__id__]; if( f == null ) { f = m.bind(o); o.hx__closures__[m.__id__] = f; } return f; }
function $arrayPush(x) { this.push(x); }
String.__name__ = true;
Array.__name__ = true;
Date.__name__ = ["Date"];
var __map_reserved = {};
Object.defineProperty(js__$Boot_HaxeError.prototype,"message",{ get : function() {
	return String(this.val);
}});
haxeshim_Os.IS_WINDOWS = Sys.systemName() == "Windows";
haxeshim_Os.DELIMITER = haxeshim_Os.IS_WINDOWS ? ";" : ":";
haxeshim_Scope.DEFAULT_ROOT = (function($this) {
	var $r;
	var o = haxeshim_Scope.env("HAXE_ROOT");
	var o1 = haxeshim_Scope.env("HAXESHIM_ROOT");
	var l = new tink_core__$Lazy_LazyConst(process.env[haxeshim_Os.IS_WINDOWS ? "APPDATA" : "HOME"] + "/haxe");
	var c;
	if(o1[1] == 0) {
		var v = o1[2];
		c = v;
	} else {
		c = l.get();
	}
	var l1 = new tink_core__$Lazy_LazyConst(c);
	$r = o[1] == 0 ? (function($this) {
		var $r;
		var v1 = o[2];
		$r = v1;
		return $r;
	}($this)) : l1.get();
	return $r;
}(this));
haxeshim_Neko.PATH = haxeshim_Os.slashes(haxeshim_Scope.DEFAULT_ROOT + "/neko");
haxeshim_Neko.isset = false;
haxeshim_Neko.ENV = (function($this) {
	var $r;
	var varName;
	var _g = Sys.systemName();
	switch(_g) {
	case "Mac":
		varName = "DYLD_LIBRARY_PATH";
		break;
	case "Windows":
		varName = "PATH";
		break;
	default:
		varName = "LD_LIBRARY_PATH";
	}
	var _g1 = process.env[varName];
	$r = _g1 == null ? (function($this) {
		var $r;
		var _g11 = new haxe_ds_StringMap();
		{
			var value = haxeshim_Neko.PATH;
			if(__map_reserved[varName] != null) {
				_g11.setReserved(varName,value);
			} else {
				_g11.h[varName] = value;
			}
		}
		$r = haxeshim__$Env_Env_$Impl_$.ofMap(_g11);
		return $r;
	}($this)) : (function($this) {
		var $r;
		var withNeko = _g1;
		$r = withNeko.indexOf(haxeshim_Neko.PATH) != -1 ? haxeshim__$Env_Env_$Impl_$.ofVars({ }) : (function($this) {
			var $r;
			var v = _g1;
			var _g12 = new haxe_ds_StringMap();
			{
				var value1 = v + haxeshim_Os.DELIMITER + haxeshim_Neko.PATH;
				if(__map_reserved[varName] != null) {
					_g12.setReserved(varName,value1);
				} else {
					_g12.h[varName] = value1;
				}
			}
			$r = haxeshim__$Env_Env_$Impl_$.ofMap(_g12);
			return $r;
		}($this));
		return $r;
	}($this));
	return $r;
}(this));
lix_client_Download.USER_AGENT = "switchx";
tink_core__$Callback_Callback_$Impl_$.depth = 0;
lix_cli_NekoCmd.main();
})();

},
"IHzFTXFK768mHhaTa50fJLoNbqriK7aGJ03V/M/piPo=":
function (require, module, exports, __dirname, __filename) {
'use strict'
// parse a 512-byte header block to a data object, or vice-versa
// encode returns `true` if a pax extended header is needed, because
// the data could not be faithfully encoded in a simple header.
// (Also, check header.needPax to see if it needs a pax header.)

const types = require('./types.js')
const pathModule = require('path')
const large = require('./large-numbers.js')

const TYPE = Symbol('type')

class Header {
  constructor (data, off) {
    this.cksumValid = false
    this.needPax = false
    this.nullBlock = false

    this.block = null
    this.path = null
    this.mode = null
    this.uid = null
    this.gid = null
    this.size = null
    this.mtime = null
    this.cksum = null
    this[TYPE] = '0'
    this.linkpath = null
    this.uname = null
    this.gname = null
    this.devmaj = 0
    this.devmin = 0
    this.atime = null
    this.ctime = null

    if (Buffer.isBuffer(data)) {
      this.decode(data, off || 0)
    } else if (data)
      this.set(data)
  }

  decode (buf, off) {
    if (!off)
      off = 0

    if (!buf || !(buf.length >= off + 512))
      throw new Error('need 512 bytes for header')

    this.path = decString(buf, off, 100)
    this.mode = decNumber(buf, off + 100, 8)
    this.uid = decNumber(buf, off + 108, 8)
    this.gid = decNumber(buf, off + 116, 8)
    this.size = decNumber(buf, off + 124, 12)
    this.mtime = decDate(buf, off + 136, 12)
    this.cksum = decNumber(buf, off + 148, 12)

    // old tar versions marked dirs as a file with a trailing /
    this[TYPE] = decString(buf, off + 156, 1)
    if (this[TYPE] === '')
      this[TYPE] = '0'
    if (this[TYPE] === '0' && this.path.substr(-1) === '/')
      this[TYPE] = '5'

    // tar implementations sometimes incorrectly put the stat(dir).size
    // as the size in the tarball, even though Directory entries are
    // not able to have any body at all.  In the very rare chance that
    // it actually DOES have a body, we weren't going to do anything with
    // it anyway, and it'll just be a warning about an invalid header.
    if (this[TYPE] === '5')
      this.size = 0

    this.linkpath = decString(buf, off + 157, 100)
    if (buf.slice(off + 257, off + 265).toString() === 'ustar\u000000') {
      this.uname = decString(buf, off + 265, 32)
      this.gname = decString(buf, off + 297, 32)
      this.devmaj = decNumber(buf, off + 329, 8)
      this.devmin = decNumber(buf, off + 337, 8)
      if (buf[off + 475] !== 0) {
        // definitely a prefix, definitely >130 chars.
        const prefix = decString(buf, off + 345, 155)
        this.path = prefix + '/' + this.path
      } else {
        const prefix = decString(buf, off + 345, 130)
        if (prefix)
          this.path = prefix + '/' + this.path
        this.atime = decDate(buf, off + 476, 12)
        this.ctime = decDate(buf, off + 488, 12)
      }
    }

    let sum = 8 * 0x20
    for (let i = off; i < off + 148; i++) {
      sum += buf[i]
    }
    for (let i = off + 156; i < off + 512; i++) {
      sum += buf[i]
    }
    this.cksumValid = sum === this.cksum
    if (this.cksum === null && sum === 8 * 0x20)
      this.nullBlock = true
  }

  encode (buf, off) {
    if (!buf) {
      buf = this.block = Buffer.alloc(512)
      off = 0
    }

    if (!off)
      off = 0

    if (!(buf.length >= off + 512))
      throw new Error('need 512 bytes for header')

    const prefixSize = this.ctime || this.atime ? 130 : 155
    const split = splitPrefix(this.path || '', prefixSize)
    const path = split[0]
    const prefix = split[1]
    this.needPax = split[2]

    this.needPax = encString(buf, off, 100, path) || this.needPax
    this.needPax = encNumber(buf, off + 100, 8, this.mode) || this.needPax
    this.needPax = encNumber(buf, off + 108, 8, this.uid) || this.needPax
    this.needPax = encNumber(buf, off + 116, 8, this.gid) || this.needPax
    this.needPax = encNumber(buf, off + 124, 12, this.size) || this.needPax
    this.needPax = encDate(buf, off + 136, 12, this.mtime) || this.needPax
    buf[off + 156] = this[TYPE].charCodeAt(0)
    this.needPax = encString(buf, off + 157, 100, this.linkpath) || this.needPax
    buf.write('ustar\u000000', off + 257, 8)
    this.needPax = encString(buf, off + 265, 32, this.uname) || this.needPax
    this.needPax = encString(buf, off + 297, 32, this.gname) || this.needPax
    this.needPax = encNumber(buf, off + 329, 8, this.devmaj) || this.needPax
    this.needPax = encNumber(buf, off + 337, 8, this.devmin) || this.needPax
    this.needPax = encString(buf, off + 345, prefixSize, prefix) || this.needPax
    if (buf[off + 475] !== 0)
      this.needPax = encString(buf, off + 345, 155, prefix) || this.needPax
    else {
      this.needPax = encString(buf, off + 345, 130, prefix) || this.needPax
      this.needPax = encDate(buf, off + 476, 12, this.atime) || this.needPax
      this.needPax = encDate(buf, off + 488, 12, this.ctime) || this.needPax
    }

    let sum = 8 * 0x20
    for (let i = off; i < off + 148; i++) {
      sum += buf[i]
    }
    for (let i = off + 156; i < off + 512; i++) {
      sum += buf[i]
    }
    this.cksum = sum
    encNumber(buf, off + 148, 8, this.cksum)
    this.cksumValid = true

    return this.needPax
  }

  set (data) {
    for (let i in data) {
      if (data[i] !== null && data[i] !== undefined)
        this[i] = data[i]
    }
  }

  get type () {
    return types.name.get(this[TYPE]) || this[TYPE]
  }

  get typeKey () {
    return this[TYPE]
  }

  set type (type) {
    if (types.code.has(type))
      this[TYPE] = types.code.get(type)
    else
      this[TYPE] = type
  }
}

const splitPrefix = (p, prefixSize) => {
  const pathSize = 100
  let pp = p
  let prefix = ''
  let ret
  const root = pathModule.parse(p).root || '.'

  if (Buffer.byteLength(pp) < pathSize)
    ret = [pp, prefix, false]
  else {
    // first set prefix to the dir, and path to the base
    prefix = pathModule.dirname(pp)
    pp = pathModule.basename(pp)

    do {
      // both fit!
      if (Buffer.byteLength(pp) <= pathSize &&
          Buffer.byteLength(prefix) <= prefixSize)
        ret = [pp, prefix, false]

      // prefix fits in prefix, but path doesn't fit in path
      else if (Buffer.byteLength(pp) > pathSize &&
          Buffer.byteLength(prefix) <= prefixSize)
        ret = [pp.substr(0, pathSize - 1), prefix, true]

      else {
        // make path take a bit from prefix
        pp = pathModule.join(pathModule.basename(prefix), pp)
        prefix = pathModule.dirname(prefix)
      }
    } while (prefix !== root && !ret)

    // at this point, found no resolution, just truncate
    if (!ret)
      ret = [p.substr(0, pathSize - 1), '', true]
  }
  return ret
}

const decString = (buf, off, size) =>
  buf.slice(off, off + size).toString('utf8').replace(/\0.*/, '')

const decDate = (buf, off, size) =>
  numToDate(decNumber(buf, off, size))

const numToDate = num => num === null ? null : new Date(num * 1000)

const decNumber = (buf, off, size) =>
  buf[off] & 0x80 ? large.parse(buf.slice(off, off + size))
    : decSmallNumber(buf, off, size)

const nanNull = value => isNaN(value) ? null : value

const decSmallNumber = (buf, off, size) =>
  nanNull(parseInt(
    buf.slice(off, off + size)
      .toString('utf8').replace(/\0.*$/, '').trim(), 8))

// the maximum encodable as a null-terminated octal, by field size
const MAXNUM = {
  12: 0o77777777777,
  8 : 0o7777777
}

const encNumber = (buf, off, size, number) =>
  number === null ? false :
  number > MAXNUM[size] || number < 0
    ? (large.encode(number, buf.slice(off, off + size)), true)
    : (encSmallNumber(buf, off, size, number), false)

const encSmallNumber = (buf, off, size, number) =>
  buf.write(octalString(number, size), off, size, 'ascii')

const octalString = (number, size) =>
  padOctal(Math.floor(number).toString(8), size)

const padOctal = (string, size) =>
  (string.length === size - 1 ? string
  : new Array(size - string.length - 1).join('0') + string + ' ') + '\0'

const encDate = (buf, off, size, date) =>
  date === null ? false :
  encNumber(buf, off, size, date.getTime() / 1000)

// enough to fill the longest string we've got
const NULLS = new Array(156).join('\0')
// pad with nulls, return true if it's longer or non-ascii
const encString = (buf, off, size, string) =>
  string === null ? false :
  (buf.write(string + NULLS, off, size, 'utf8'),
   string.length !== Buffer.byteLength(string) || string.length > size)

module.exports = Header

},
"IRCPAQdxxTPxDSNVEjbpJrDey6YtBZTsHyHy3quzDzk=":
function (require, module, exports, __dirname, __filename) {
'use strict'

// When writing files on Windows, translate the characters to their
// 0xf000 higher-encoded versions.

const raw = [
  '|',
  '<',
  '>',
  '?',
  ':'
]

const win = raw.map(char =>
  String.fromCharCode(0xf000 + char.charCodeAt(0)))

const toWin = new Map(raw.map((char, i) => [char, win[i]]))
const toRaw = new Map(win.map((char, i) => [char, raw[i]]))

module.exports = {
  encode: s => raw.reduce((s, c) => s.split(c).join(toWin.get(c)), s),
  decode: s => win.reduce((s, c) => s.split(c).join(toRaw.get(c)), s)
}

},
"JsqjlmzGxjIc26PeTxJ7qk61X/zSZgNlwZJAKxkOfrA=":
function (require, module, exports, __dirname, __filename) {
'use strict'
var Yallist = require('./yallist.js')

Yallist.prototype[Symbol.iterator] = function* () {
  for (let walker = this.head; walker; walker = walker.next) {
    yield walker.value
  }
}

},
"MkWNBV+mllrIxb3rRAuosAXBArq+K5YFPfuO5n+97QE=":
function (require, module, exports, __dirname, __filename) {
'use strict'
const types = require('./types.js')
const MiniPass = require('minipass')

const SLURP = Symbol('slurp')
module.exports = class ReadEntry extends MiniPass {
  constructor (header, ex, gex) {
    super()
    this.extended = ex
    this.globalExtended = gex
    this.header = header
    this.startBlockSize = 512 * Math.ceil(header.size / 512)
    this.blockRemain = this.startBlockSize
    this.remain = header.size
    this.type = header.type
    this.meta = false
    this.ignore = false
    switch (this.type) {
      case 'File':
      case 'OldFile':
      case 'Link':
      case 'SymbolicLink':
      case 'CharacterDevice':
      case 'BlockDevice':
      case 'Directory':
      case 'FIFO':
      case 'ContiguousFile':
      case 'GNUDumpDir':
        break

      case 'NextFileHasLongLinkpath':
      case 'NextFileHasLongPath':
      case 'OldGnuLongPath':
      case 'GlobalExtendedHeader':
      case 'ExtendedHeader':
      case 'OldExtendedHeader':
        this.meta = true
        break

      // NOTE: gnutar and bsdtar treat unrecognized types as 'File'
      // it may be worth doing the same, but with a warning.
      default:
        this.ignore = true
    }

    this.path = header.path
    this.mode = header.mode
    if (this.mode)
      this.mode = this.mode & 0o7777
    this.uid = header.uid
    this.gid = header.gid
    this.uname = header.uname
    this.gname = header.gname
    this.size = header.size
    this.mtime = header.mtime
    this.atime = header.atime
    this.ctime = header.ctime
    this.linkpath = header.linkpath
    this.uname = header.uname
    this.gname = header.gname

    if (ex) this[SLURP](ex)
    if (gex) this[SLURP](gex, true)
  }

  write (data) {
    const writeLen = data.length
    if (writeLen > this.blockRemain)
      throw new Error('writing more to entry than is appropriate')

    const r = this.remain
    const br = this.blockRemain
    this.remain = Math.max(0, r - writeLen)
    this.blockRemain = Math.max(0, br - writeLen)
    if (this.ignore)
      return true

    if (r >= writeLen)
      return super.write(data)

    // r < writeLen
    return super.write(data.slice(0, r))
  }

  [SLURP] (ex, global) {
    for (let k in ex) {
      // we slurp in everything except for the path attribute in
      // a global extended header, because that's weird.
      if (ex[k] !== null && ex[k] !== undefined &&
          !(global && k === 'path'))
        this[k] = ex[k]
    }
  }
}

},
"S5kSkGgNkCfdeGSTxugWkANVlW2Ir7auTZe1rFo+4PU=":
function (require, module, exports, __dirname, __filename) {
module.exports = Pend;

function Pend() {
  this.pending = 0;
  this.max = Infinity;
  this.listeners = [];
  this.waiting = [];
  this.error = null;
}

Pend.prototype.go = function(fn) {
  if (this.pending < this.max) {
    pendGo(this, fn);
  } else {
    this.waiting.push(fn);
  }
};

Pend.prototype.wait = function(cb) {
  if (this.pending === 0) {
    cb(this.error);
  } else {
    this.listeners.push(cb);
  }
};

Pend.prototype.hold = function() {
  return pendHold(this);
};

function pendHold(self) {
  self.pending += 1;
  var called = false;
  return onCb;
  function onCb(err) {
    if (called) throw new Error("callback called twice");
    called = true;
    self.error = self.error || err;
    self.pending -= 1;
    if (self.waiting.length > 0 && self.pending < self.max) {
      pendGo(self, self.waiting.shift());
    } else if (self.pending === 0) {
      var listeners = self.listeners;
      self.listeners = [];
      listeners.forEach(cbListener);
    }
  }
  function cbListener(listener) {
    listener(self.error);
  }
}

function pendGo(self, fn) {
  fn(pendHold(self));
}

},
"WZHbRSTQGm11s2R0USK+h24ZIkBEXRp7yB4mN1L53QM=":
function (require, module, exports, __dirname, __filename) {
'use strict'
module.exports = Yallist

Yallist.Node = Node
Yallist.create = Yallist

function Yallist (list) {
  var self = this
  if (!(self instanceof Yallist)) {
    self = new Yallist()
  }

  self.tail = null
  self.head = null
  self.length = 0

  if (list && typeof list.forEach === 'function') {
    list.forEach(function (item) {
      self.push(item)
    })
  } else if (arguments.length > 0) {
    for (var i = 0, l = arguments.length; i < l; i++) {
      self.push(arguments[i])
    }
  }

  return self
}

Yallist.prototype.removeNode = function (node) {
  if (node.list !== this) {
    throw new Error('removing node which does not belong to this list')
  }

  var next = node.next
  var prev = node.prev

  if (next) {
    next.prev = prev
  }

  if (prev) {
    prev.next = next
  }

  if (node === this.head) {
    this.head = next
  }
  if (node === this.tail) {
    this.tail = prev
  }

  node.list.length--
  node.next = null
  node.prev = null
  node.list = null
}

Yallist.prototype.unshiftNode = function (node) {
  if (node === this.head) {
    return
  }

  if (node.list) {
    node.list.removeNode(node)
  }

  var head = this.head
  node.list = this
  node.next = head
  if (head) {
    head.prev = node
  }

  this.head = node
  if (!this.tail) {
    this.tail = node
  }
  this.length++
}

Yallist.prototype.pushNode = function (node) {
  if (node === this.tail) {
    return
  }

  if (node.list) {
    node.list.removeNode(node)
  }

  var tail = this.tail
  node.list = this
  node.prev = tail
  if (tail) {
    tail.next = node
  }

  this.tail = node
  if (!this.head) {
    this.head = node
  }
  this.length++
}

Yallist.prototype.push = function () {
  for (var i = 0, l = arguments.length; i < l; i++) {
    push(this, arguments[i])
  }
  return this.length
}

Yallist.prototype.unshift = function () {
  for (var i = 0, l = arguments.length; i < l; i++) {
    unshift(this, arguments[i])
  }
  return this.length
}

Yallist.prototype.pop = function () {
  if (!this.tail) {
    return undefined
  }

  var res = this.tail.value
  this.tail = this.tail.prev
  if (this.tail) {
    this.tail.next = null
  } else {
    this.head = null
  }
  this.length--
  return res
}

Yallist.prototype.shift = function () {
  if (!this.head) {
    return undefined
  }

  var res = this.head.value
  this.head = this.head.next
  if (this.head) {
    this.head.prev = null
  } else {
    this.tail = null
  }
  this.length--
  return res
}

Yallist.prototype.forEach = function (fn, thisp) {
  thisp = thisp || this
  for (var walker = this.head, i = 0; walker !== null; i++) {
    fn.call(thisp, walker.value, i, this)
    walker = walker.next
  }
}

Yallist.prototype.forEachReverse = function (fn, thisp) {
  thisp = thisp || this
  for (var walker = this.tail, i = this.length - 1; walker !== null; i--) {
    fn.call(thisp, walker.value, i, this)
    walker = walker.prev
  }
}

Yallist.prototype.get = function (n) {
  for (var i = 0, walker = this.head; walker !== null && i < n; i++) {
    // abort out of the list early if we hit a cycle
    walker = walker.next
  }
  if (i === n && walker !== null) {
    return walker.value
  }
}

Yallist.prototype.getReverse = function (n) {
  for (var i = 0, walker = this.tail; walker !== null && i < n; i++) {
    // abort out of the list early if we hit a cycle
    walker = walker.prev
  }
  if (i === n && walker !== null) {
    return walker.value
  }
}

Yallist.prototype.map = function (fn, thisp) {
  thisp = thisp || this
  var res = new Yallist()
  for (var walker = this.head; walker !== null;) {
    res.push(fn.call(thisp, walker.value, this))
    walker = walker.next
  }
  return res
}

Yallist.prototype.mapReverse = function (fn, thisp) {
  thisp = thisp || this
  var res = new Yallist()
  for (var walker = this.tail; walker !== null;) {
    res.push(fn.call(thisp, walker.value, this))
    walker = walker.prev
  }
  return res
}

Yallist.prototype.reduce = function (fn, initial) {
  var acc
  var walker = this.head
  if (arguments.length > 1) {
    acc = initial
  } else if (this.head) {
    walker = this.head.next
    acc = this.head.value
  } else {
    throw new TypeError('Reduce of empty list with no initial value')
  }

  for (var i = 0; walker !== null; i++) {
    acc = fn(acc, walker.value, i)
    walker = walker.next
  }

  return acc
}

Yallist.prototype.reduceReverse = function (fn, initial) {
  var acc
  var walker = this.tail
  if (arguments.length > 1) {
    acc = initial
  } else if (this.tail) {
    walker = this.tail.prev
    acc = this.tail.value
  } else {
    throw new TypeError('Reduce of empty list with no initial value')
  }

  for (var i = this.length - 1; walker !== null; i--) {
    acc = fn(acc, walker.value, i)
    walker = walker.prev
  }

  return acc
}

Yallist.prototype.toArray = function () {
  var arr = new Array(this.length)
  for (var i = 0, walker = this.head; walker !== null; i++) {
    arr[i] = walker.value
    walker = walker.next
  }
  return arr
}

Yallist.prototype.toArrayReverse = function () {
  var arr = new Array(this.length)
  for (var i = 0, walker = this.tail; walker !== null; i++) {
    arr[i] = walker.value
    walker = walker.prev
  }
  return arr
}

Yallist.prototype.slice = function (from, to) {
  to = to || this.length
  if (to < 0) {
    to += this.length
  }
  from = from || 0
  if (from < 0) {
    from += this.length
  }
  var ret = new Yallist()
  if (to < from || to < 0) {
    return ret
  }
  if (from < 0) {
    from = 0
  }
  if (to > this.length) {
    to = this.length
  }
  for (var i = 0, walker = this.head; walker !== null && i < from; i++) {
    walker = walker.next
  }
  for (; walker !== null && i < to; i++, walker = walker.next) {
    ret.push(walker.value)
  }
  return ret
}

Yallist.prototype.sliceReverse = function (from, to) {
  to = to || this.length
  if (to < 0) {
    to += this.length
  }
  from = from || 0
  if (from < 0) {
    from += this.length
  }
  var ret = new Yallist()
  if (to < from || to < 0) {
    return ret
  }
  if (from < 0) {
    from = 0
  }
  if (to > this.length) {
    to = this.length
  }
  for (var i = this.length, walker = this.tail; walker !== null && i > to; i--) {
    walker = walker.prev
  }
  for (; walker !== null && i > from; i--, walker = walker.prev) {
    ret.push(walker.value)
  }
  return ret
}

Yallist.prototype.reverse = function () {
  var head = this.head
  var tail = this.tail
  for (var walker = head; walker !== null; walker = walker.prev) {
    var p = walker.prev
    walker.prev = walker.next
    walker.next = p
  }
  this.head = tail
  this.tail = head
  return this
}

function push (self, item) {
  self.tail = new Node(item, self.tail, null, self)
  if (!self.head) {
    self.head = self.tail
  }
  self.length++
}

function unshift (self, item) {
  self.head = new Node(item, null, self.head, self)
  if (!self.tail) {
    self.tail = self.head
  }
  self.length++
}

function Node (value, prev, next, list) {
  if (!(this instanceof Node)) {
    return new Node(value, prev, next, list)
  }

  this.list = list
  this.value = value

  if (prev) {
    prev.next = this
    this.prev = prev
  } else {
    this.prev = null
  }

  if (next) {
    next.prev = this
    this.next = next
  } else {
    this.next = null
  }
}

try {
  // add if support or Symbol.iterator is present
  require('./iterator.js')
} catch (er) {}

},
"bk9dbSa68ZTPS7tNghEARu1iFSBbQSxXp7UJfcFiPqw=":
function (require, module, exports, __dirname, __filename) {
var path = require('path');
var fs = require('fs');
var _0777 = parseInt('0777', 8);

module.exports = mkdirP.mkdirp = mkdirP.mkdirP = mkdirP;

function mkdirP (p, opts, f, made) {
    if (typeof opts === 'function') {
        f = opts;
        opts = {};
    }
    else if (!opts || typeof opts !== 'object') {
        opts = { mode: opts };
    }
    
    var mode = opts.mode;
    var xfs = opts.fs || fs;
    
    if (mode === undefined) {
        mode = _0777 & (~process.umask());
    }
    if (!made) made = null;
    
    var cb = f || function () {};
    p = path.resolve(p);
    
    xfs.mkdir(p, mode, function (er) {
        if (!er) {
            made = made || p;
            return cb(null, made);
        }
        switch (er.code) {
            case 'ENOENT':
                mkdirP(path.dirname(p), opts, function (er, made) {
                    if (er) cb(er, made);
                    else mkdirP(p, opts, cb, made);
                });
                break;

            // In the case of any other error, just see if there's a dir
            // there already.  If so, then hooray!  If not, then something
            // is borked.
            default:
                xfs.stat(p, function (er2, stat) {
                    // if the stat fails, then that's super weird.
                    // let the original error be the failure reason.
                    if (er2 || !stat.isDirectory()) cb(er, made)
                    else cb(null, made);
                });
                break;
        }
    });
}

mkdirP.sync = function sync (p, opts, made) {
    if (!opts || typeof opts !== 'object') {
        opts = { mode: opts };
    }
    
    var mode = opts.mode;
    var xfs = opts.fs || fs;
    
    if (mode === undefined) {
        mode = _0777 & (~process.umask());
    }
    if (!made) made = null;

    p = path.resolve(p);

    try {
        xfs.mkdirSync(p, mode);
        made = made || p;
    }
    catch (err0) {
        switch (err0.code) {
            case 'ENOENT' :
                made = sync(path.dirname(p), opts, made);
                sync(p, opts, made);
                break;

            // In the case of any other error, just see if there's a dir
            // there already.  If so, then hooray!  If not, then something
            // is borked.
            default:
                var stat;
                try {
                    stat = xfs.statSync(p);
                }
                catch (err1) {
                    throw err0;
                }
                if (!stat.isDirectory()) throw err0;
                break;
        }
    }

    return made;
};

},
"h6EJqSy3uNzned17rKduccNvmLOgmW5AXedFxdsPp+s=":
function (require, module, exports, __dirname, __filename) {
'use strict'
const fs = require('fs')
const path = require('path')

/* istanbul ignore next */
const LCHOWN = fs.lchown ? 'lchown' : 'chown'
/* istanbul ignore next */
const LCHOWNSYNC = fs.lchownSync ? 'lchownSync' : 'chownSync'

// fs.readdir could only accept an options object as of node v6
const nodeVersion = process.version
let readdir = (path, options, cb) => fs.readdir(path, options, cb)
let readdirSync = (path, options) => fs.readdirSync(path, options)
/* istanbul ignore next */
if (/^v4\./.test(nodeVersion))
  readdir = (path, options, cb) => fs.readdir(path, cb)

const chownrKid = (p, child, uid, gid, cb) => {
  if (typeof child === 'string')
    return fs.lstat(path.resolve(p, child), (er, stats) => {
      if (er)
        return cb(er)
      stats.name = child
      chownrKid(p, stats, uid, gid, cb)
    })

  if (child.isDirectory()) {
    chownr(path.resolve(p, child.name), uid, gid, er => {
      if (er)
        return cb(er)
      fs[LCHOWN](path.resolve(p, child.name), uid, gid, cb)
    })
  } else
    fs[LCHOWN](path.resolve(p, child.name), uid, gid, cb)
}


const chownr = (p, uid, gid, cb) => {
  readdir(p, { withFileTypes: true }, (er, children) => {
    // any error other than ENOTDIR or ENOTSUP means it's not readable,
    // or doesn't exist.  give up.
    if (er && er.code !== 'ENOTDIR' && er.code !== 'ENOTSUP')
      return cb(er)
    if (er || !children.length) return fs[LCHOWN](p, uid, gid, cb)

    let len = children.length
    let errState = null
    const then = er => {
      if (errState) return
      if (er) return cb(errState = er)
      if (-- len === 0) return fs[LCHOWN](p, uid, gid, cb)
    }

    children.forEach(child => chownrKid(p, child, uid, gid, then))
  })
}

const chownrKidSync = (p, child, uid, gid) => {
  if (typeof child === 'string') {
    const stats = fs.lstatSync(path.resolve(p, child))
    stats.name = child
    child = stats
  }

  if (child.isDirectory())
    chownrSync(path.resolve(p, child.name), uid, gid)

  fs[LCHOWNSYNC](path.resolve(p, child.name), uid, gid)
}

const chownrSync = (p, uid, gid) => {
  let children
  try {
    children = readdirSync(p, { withFileTypes: true })
  } catch (er) {
    if (er && er.code === 'ENOTDIR' && er.code !== 'ENOTSUP')
      return fs[LCHOWNSYNC](p, uid, gid)
    throw er
  }

  if (children.length)
    children.forEach(child => chownrKidSync(p, child, uid, gid))

  return fs[LCHOWNSYNC](p, uid, gid)
}

module.exports = chownr
chownr.sync = chownrSync

},
"hWgHoyC4ICUyk4ZXQMqKFVM8HT2nRBT3U8d54EJfPVM=":
function (require, module, exports, __dirname, __filename) {
'use strict'
// map types from key to human-friendly name
exports.name = new Map([
  ['0', 'File'],
  // same as File
  ['', 'OldFile'],
  ['1', 'Link'],
  ['2', 'SymbolicLink'],
  // Devices and FIFOs aren't fully supported
  // they are parsed, but skipped when unpacking
  ['3', 'CharacterDevice'],
  ['4', 'BlockDevice'],
  ['5', 'Directory'],
  ['6', 'FIFO'],
  // same as File
  ['7', 'ContiguousFile'],
  // pax headers
  ['g', 'GlobalExtendedHeader'],
  ['x', 'ExtendedHeader'],
  // vendor-specific stuff
  // skip
  ['A', 'SolarisACL'],
  // like 5, but with data, which should be skipped
  ['D', 'GNUDumpDir'],
  // metadata only, skip
  ['I', 'Inode'],
  // data = link path of next file
  ['K', 'NextFileHasLongLinkpath'],
  // data = path of next file
  ['L', 'NextFileHasLongPath'],
  // skip
  ['M', 'ContinuationFile'],
  // like L
  ['N', 'OldGnuLongPath'],
  // skip
  ['S', 'SparseFile'],
  // skip
  ['V', 'TapeVolumeHeader'],
  // like x
  ['X', 'OldExtendedHeader']
])

// map the other direction
exports.code = new Map(Array.from(exports.name).map(kv => [kv[1], kv[0]]))

},
"hmnRD7etIIKY8nGARtOEtPwLHJ5n8EdTamzJ/6pL3mg=":
function (require, module, exports, __dirname, __filename) {
'use strict'

// turn tar(1) style args like `C` into the more verbose things like `cwd`

const argmap = new Map([
  ['C', 'cwd'],
  ['f', 'file'],
  ['z', 'gzip'],
  ['P', 'preservePaths'],
  ['U', 'unlink'],
  ['strip-components', 'strip'],
  ['stripComponents', 'strip'],
  ['keep-newer', 'newer'],
  ['keepNewer', 'newer'],
  ['keep-newer-files', 'newer'],
  ['keepNewerFiles', 'newer'],
  ['k', 'keep'],
  ['keep-existing', 'keep'],
  ['keepExisting', 'keep'],
  ['m', 'noMtime'],
  ['no-mtime', 'noMtime'],
  ['p', 'preserveOwner'],
  ['L', 'follow'],
  ['h', 'follow']
])

const parse = module.exports = opt => opt ? Object.keys(opt).map(k => [
  argmap.has(k) ? argmap.get(k) : k, opt[k]
]).reduce((set, kv) => (set[kv[0]] = kv[1], set), Object.create(null)) : {}

},
"i0E8knuUHabWe79/B8YbGgCVTW4N43yTAuri+/11BNk=":
function (require, module, exports, __dirname, __filename) {
'use strict'

// tar -r
const hlo = require('./high-level-opt.js')
const Pack = require('./pack.js')
const Parse = require('./parse.js')
const fs = require('fs')
const t = require('./list.js')
const path = require('path')

// starting at the head of the file, read a Header
// If the checksum is invalid, that's our position to start writing
// If it is, jump forward by the specified size (round up to 512)
// and try again.
// Write the new Pack stream starting there.

const Header = require('./header.js')

const r = module.exports = (opt_, files, cb) => {
  const opt = hlo(opt_)

  if (!opt.file)
    throw new TypeError('file is required')

  if (opt.gzip)
    throw new TypeError('cannot append to compressed archives')

  if (!files || !Array.isArray(files) || !files.length)
    throw new TypeError('no files or directories specified')

  files = Array.from(files)

  return opt.sync ? replaceSync(opt, files)
    : replace(opt, files, cb)
}

const replaceSync = (opt, files) => {
  const p = new Pack.Sync(opt)

  let threw = true
  let fd
  try {
    try {
      fd = fs.openSync(opt.file, 'r+')
    } catch (er) {
      if (er.code === 'ENOENT')
        fd = fs.openSync(opt.file, 'w+')
      else
        throw er
    }

    const st = fs.fstatSync(fd)
    const headBuf = Buffer.alloc(512)
    let position

    POSITION: for (position = 0; position < st.size; position += 512) {
      for (let bufPos = 0, bytes = 0; bufPos < 512; bufPos += bytes) {
        bytes = fs.readSync(
          fd, headBuf, bufPos, headBuf.length - bufPos, position + bufPos
        )

        if (position === 0 && headBuf[0] === 0x1f && headBuf[1] === 0x8b)
          throw new Error('cannot append to compressed archives')

        if (!bytes)
          break POSITION
      }

      let h = new Header(headBuf)
      if (!h.cksumValid)
        break
      let entryBlockSize = 512 * Math.ceil(h.size / 512)
      if (position + entryBlockSize + 512 > st.size)
        break
      // the 512 for the header we just parsed will be added as well
      // also jump ahead all the blocks for the body
      position += entryBlockSize
      if (opt.mtimeCache)
        opt.mtimeCache.set(h.path, h.mtime)
    }

    p.on('data', c => {
      fs.writeSync(fd, c, 0, c.length, position)
      position += c.length
    })
    p.on('end', _ => fs.closeSync(fd))

    addFilesSync(p, files)
    threw = false
  } finally {
    if (threw)
      try { fs.closeSync(fd) } catch (er) {}
  }
}

const replace = (opt, files, cb) => {
  files = Array.from(files)
  const p = new Pack(opt)

  const getPos = (fd, size, cb_) => {
    const cb = (er, pos) => {
      if (er)
        fs.close(fd, _ => cb_(er))
      else
        cb_(null, pos)
    }

    let position = 0
    if (size === 0)
      return cb(null, 0)

    let bufPos = 0
    const headBuf = Buffer.alloc(512)
    const onread = (er, bytes) => {
      if (er)
        return cb(er)
      bufPos += bytes
      if (bufPos < 512 && bytes)
        return fs.read(
          fd, headBuf, bufPos, headBuf.length - bufPos,
          position + bufPos, onread
        )

      if (position === 0 && headBuf[0] === 0x1f && headBuf[1] === 0x8b)
        return cb(new Error('cannot append to compressed archives'))

      // truncated header
      if (bufPos < 512)
        return cb(null, position)

      const h = new Header(headBuf)
      if (!h.cksumValid)
        return cb(null, position)

      const entryBlockSize = 512 * Math.ceil(h.size / 512)
      if (position + entryBlockSize + 512 > size)
        return cb(null, position)

      position += entryBlockSize + 512
      if (position >= size)
        return cb(null, position)

      if (opt.mtimeCache)
        opt.mtimeCache.set(h.path, h.mtime)
      bufPos = 0
      fs.read(fd, headBuf, 0, 512, position, onread)
    }
    fs.read(fd, headBuf, 0, 512, position, onread)
  }

  const promise = new Promise((resolve, reject) => {
    p.on('error', reject)
    const onopen = (er, fd) => {
      if (er) {
        if (er.code === 'ENOENT')
          return fs.open(opt.file, 'w+', onopen)
        return reject(er)
      }
      fs.fstat(fd, (er, st) => {
        if (er)
          return reject(er)
        getPos(fd, st.size, (er, position) => {
          if (er)
            return reject(er)
          const stream = fs.createWriteStream(opt.file, {
            fd: fd,
            flags: 'r+',
            start: position
          })
          p.pipe(stream)
          stream.on('error', reject)
          stream.on('close', resolve)
          addFilesAsync(p, files)
        })
      })
    }
    fs.open(opt.file, 'r+', onopen)
  })

  return cb ? promise.then(cb, cb) : promise
}

const addFilesSync = (p, files) => {
  files.forEach(file => {
    if (file.charAt(0) === '@')
      t({
        file: path.resolve(p.cwd, file.substr(1)),
        sync: true,
        noResume: true,
        onentry: entry => p.add(entry)
      })
    else
      p.add(file)
  })
  p.end()
}

const addFilesAsync = (p, files) => {
  while (files.length) {
    const file = files.shift()
    if (file.charAt(0) === '@')
      return t({
        file: path.resolve(p.cwd, file.substr(1)),
        noResume: true,
        onentry: entry => p.add(entry)
      }).then(_ => addFilesAsync(p, files))
    else
      p.add(file)
  }
  p.end()
}

},
"mf8OAFaZOMvEeUCmNGD49bLJuxVBwZ7aQi9fSVkX2Xs=":
function (require, module, exports, __dirname, __filename) {
'use strict'
const MiniPass = require('minipass')
const Pax = require('./pax.js')
const Header = require('./header.js')
const ReadEntry = require('./read-entry.js')
const fs = require('fs')
const path = require('path')

const types = require('./types.js')
const maxReadSize = 16 * 1024 * 1024
const PROCESS = Symbol('process')
const FILE = Symbol('file')
const DIRECTORY = Symbol('directory')
const SYMLINK = Symbol('symlink')
const HARDLINK = Symbol('hardlink')
const HEADER = Symbol('header')
const READ = Symbol('read')
const LSTAT = Symbol('lstat')
const ONLSTAT = Symbol('onlstat')
const ONREAD = Symbol('onread')
const ONREADLINK = Symbol('onreadlink')
const OPENFILE = Symbol('openfile')
const ONOPENFILE = Symbol('onopenfile')
const CLOSE = Symbol('close')
const warner = require('./warn-mixin.js')
const winchars = require('./winchars.js')

const WriteEntry = warner(class WriteEntry extends MiniPass {
  constructor (p, opt) {
    opt = opt || {}
    super(opt)
    if (typeof p !== 'string')
      throw new TypeError('path is required')
    this.path = p
    // suppress atime, ctime, uid, gid, uname, gname
    this.portable = !!opt.portable
    // until node has builtin pwnam functions, this'll have to do
    this.myuid = process.getuid && process.getuid()
    this.myuser = process.env.USER || ''
    this.maxReadSize = opt.maxReadSize || maxReadSize
    this.linkCache = opt.linkCache || new Map()
    this.statCache = opt.statCache || new Map()
    this.preservePaths = !!opt.preservePaths
    this.cwd = opt.cwd || process.cwd()
    this.strict = !!opt.strict
    this.noPax = !!opt.noPax
    if (typeof opt.onwarn === 'function')
      this.on('warn', opt.onwarn)

    if (!this.preservePaths && path.win32.isAbsolute(p)) {
      // absolutes on posix are also absolutes on win32
      // so we only need to test this one to get both
      const parsed = path.win32.parse(p)
      this.warn('stripping ' + parsed.root + ' from absolute path', p)
      this.path = p.substr(parsed.root.length)
    }

    this.win32 = !!opt.win32 || process.platform === 'win32'
    if (this.win32) {
      this.path = winchars.decode(this.path.replace(/\\/g, '/'))
      p = p.replace(/\\/g, '/')
    }

    this.absolute = opt.absolute || path.resolve(this.cwd, p)

    if (this.path === '')
      this.path = './'

    if (this.statCache.has(this.absolute))
      this[ONLSTAT](this.statCache.get(this.absolute))
    else
      this[LSTAT]()
  }

  [LSTAT] () {
    fs.lstat(this.absolute, (er, stat) => {
      if (er)
        return this.emit('error', er)
      this[ONLSTAT](stat)
    })
  }

  [ONLSTAT] (stat) {
    this.statCache.set(this.absolute, stat)
    this.stat = stat
    if (!stat.isFile())
      stat.size = 0
    this.type = getType(stat)
    this.emit('stat', stat)
    this[PROCESS]()
  }

  [PROCESS] () {
    switch (this.type) {
      case 'File': return this[FILE]()
      case 'Directory': return this[DIRECTORY]()
      case 'SymbolicLink': return this[SYMLINK]()
      // unsupported types are ignored.
      default: return this.end()
    }
  }

  [HEADER] () {
    this.header = new Header({
      path: this.path,
      linkpath: this.linkpath,
      // only the permissions and setuid/setgid/sticky bitflags
      // not the higher-order bits that specify file type
      mode: this.stat.mode & 0o7777,
      uid: this.portable ? null : this.stat.uid,
      gid: this.portable ? null : this.stat.gid,
      size: this.stat.size,
      mtime: this.type === 'Directory' && this.portable
        ? null : this.stat.mtime,
      type: this.type,
      uname: this.portable ? null :
        this.stat.uid === this.myuid ? this.myuser : '',
      atime: this.portable ? null : this.stat.atime,
      ctime: this.portable ? null : this.stat.ctime
    })

    if (this.header.encode() && !this.noPax)
      this.write(new Pax({
        atime: this.portable ? null : this.header.atime,
        ctime: this.portable ? null : this.header.ctime,
        gid: this.portable ? null : this.header.gid,
        mtime: this.header.mtime,
        path: this.path,
        linkpath: this.linkpath,
        size: this.header.size,
        uid: this.portable ? null : this.header.uid,
        uname: this.portable ? null : this.header.uname,
        dev: this.portable ? null : this.stat.dev,
        ino: this.portable ? null : this.stat.ino,
        nlink: this.portable ? null : this.stat.nlink
      }).encode())
    this.write(this.header.block)
  }

  [DIRECTORY] () {
    if (this.path.substr(-1) !== '/')
      this.path += '/'
    this.stat.size = 0
    this[HEADER]()
    this.end()
  }

  [SYMLINK] () {
    fs.readlink(this.absolute, (er, linkpath) => {
      if (er)
        return this.emit('error', er)
      this[ONREADLINK](linkpath)
    })
  }

  [ONREADLINK] (linkpath) {
    this.linkpath = linkpath
    this[HEADER]()
    this.end()
  }

  [HARDLINK] (linkpath) {
    this.type = 'Link'
    this.linkpath = path.relative(this.cwd, linkpath)
    this.stat.size = 0
    this[HEADER]()
    this.end()
  }

  [FILE] () {
    if (this.stat.nlink > 1) {
      const linkKey = this.stat.dev + ':' + this.stat.ino
      if (this.linkCache.has(linkKey)) {
        const linkpath = this.linkCache.get(linkKey)
        if (linkpath.indexOf(this.cwd) === 0)
          return this[HARDLINK](linkpath)
      }
      this.linkCache.set(linkKey, this.absolute)
    }

    this[HEADER]()
    if (this.stat.size === 0)
      return this.end()

    this[OPENFILE]()
  }

  [OPENFILE] () {
    fs.open(this.absolute, 'r', (er, fd) => {
      if (er)
        return this.emit('error', er)
      this[ONOPENFILE](fd)
    })
  }

  [ONOPENFILE] (fd) {
    const blockLen = 512 * Math.ceil(this.stat.size / 512)
    const bufLen = Math.min(blockLen, this.maxReadSize)
    const buf = Buffer.allocUnsafe(bufLen)
    this[READ](fd, buf, 0, buf.length, 0, this.stat.size, blockLen)
  }

  [READ] (fd, buf, offset, length, pos, remain, blockRemain) {
    fs.read(fd, buf, offset, length, pos, (er, bytesRead) => {
      if (er)
        return this[CLOSE](fd, _ => this.emit('error', er))
      this[ONREAD](fd, buf, offset, length, pos, remain, blockRemain, bytesRead)
    })
  }

  [CLOSE] (fd, cb) {
    fs.close(fd, cb)
  }

  [ONREAD] (fd, buf, offset, length, pos, remain, blockRemain, bytesRead) {
    if (bytesRead <= 0 && remain > 0) {
      const er = new Error('unexpected EOF')
      er.path = this.absolute
      er.syscall = 'read'
      er.code = 'EOF'
      this.emit('error', er)
    }

    // null out the rest of the buffer, if we could fit the block padding
    if (bytesRead === remain) {
      for (let i = bytesRead; i < length && bytesRead < blockRemain; i++) {
        buf[i + offset] = 0
        bytesRead ++
        remain ++
      }
    }

    const writeBuf = offset === 0 && bytesRead === buf.length ?
      buf : buf.slice(offset, offset + bytesRead)
    remain -= bytesRead
    blockRemain -= bytesRead
    pos += bytesRead
    offset += bytesRead

    this.write(writeBuf)

    if (!remain) {
      if (blockRemain)
        this.write(Buffer.alloc(blockRemain))
      this.end()
      this[CLOSE](fd, _ => _)
      return
    }

    if (offset >= length) {
      buf = Buffer.allocUnsafe(length)
      offset = 0
    }
    length = buf.length - offset
    this[READ](fd, buf, offset, length, pos, remain, blockRemain)
  }
})

class WriteEntrySync extends WriteEntry {
  constructor (path, opt) {
    super(path, opt)
  }

  [LSTAT] () {
    this[ONLSTAT](fs.lstatSync(this.absolute))
  }

  [SYMLINK] () {
    this[ONREADLINK](fs.readlinkSync(this.absolute))
  }

  [OPENFILE] () {
    this[ONOPENFILE](fs.openSync(this.absolute, 'r'))
  }

  [READ] (fd, buf, offset, length, pos, remain, blockRemain) {
    let threw = true
    try {
      const bytesRead = fs.readSync(fd, buf, offset, length, pos)
      this[ONREAD](fd, buf, offset, length, pos, remain, blockRemain, bytesRead)
      threw = false
    } finally {
      if (threw)
        try { this[CLOSE](fd) } catch (er) {}
    }
  }

  [CLOSE] (fd) {
    fs.closeSync(fd)
  }
}

const WriteEntryTar = warner(class WriteEntryTar extends MiniPass {
  constructor (readEntry, opt) {
    opt = opt || {}
    super(opt)
    this.readEntry = readEntry
    this.type = readEntry.type
    this.path = readEntry.path
    this.mode = readEntry.mode
    if (this.mode)
      this.mode = this.mode & 0o7777
    this.uid = readEntry.uid
    this.gid = readEntry.gid
    this.uname = readEntry.uname
    this.gname = readEntry.gname
    this.size = readEntry.size
    this.mtime = readEntry.mtime
    this.atime = readEntry.atime
    this.ctime = readEntry.ctime
    this.linkpath = readEntry.linkpath
    this.uname = readEntry.uname
    this.gname = readEntry.gname

    this.preservePaths = !!opt.preservePaths
    this.portable = !!opt.portable
    this.strict = !!opt.strict
    this.noPax = !!opt.noPax

    if (typeof opt.onwarn === 'function')
      this.on('warn', opt.onwarn)

    if (path.isAbsolute(this.path) && !this.preservePaths) {
      const parsed = path.parse(this.path)
      this.warn(
        'stripping ' + parsed.root + ' from absolute path',
        this.path
      )
      this.path = this.path.substr(parsed.root.length)
    }

    this.remain = readEntry.size
    this.blockRemain = readEntry.startBlockSize

    this.header = new Header({
      path: this.path,
      linkpath: this.linkpath,
      // only the permissions and setuid/setgid/sticky bitflags
      // not the higher-order bits that specify file type
      mode: this.mode,
      uid: this.portable ? null : this.uid,
      gid: this.portable ? null : this.gid,
      size: this.size,
      mtime: this.mtime,
      type: this.type,
      uname: this.portable ? null : this.uname,
      atime: this.portable ? null : this.atime,
      ctime: this.portable ? null : this.ctime
    })

    if (this.header.encode() && !this.noPax)
      super.write(new Pax({
        atime: this.portable ? null : this.atime,
        ctime: this.portable ? null : this.ctime,
        gid: this.portable ? null : this.gid,
        mtime: this.mtime,
        path: this.path,
        linkpath: this.linkpath,
        size: this.size,
        uid: this.portable ? null : this.uid,
        uname: this.portable ? null : this.uname,
        dev: this.portable ? null : this.readEntry.dev,
        ino: this.portable ? null : this.readEntry.ino,
        nlink: this.portable ? null : this.readEntry.nlink
      }).encode())

    super.write(this.header.block)
    readEntry.pipe(this)
  }

  write (data) {
    const writeLen = data.length
    if (writeLen > this.blockRemain)
      throw new Error('writing more to entry than is appropriate')
    this.blockRemain -= writeLen
    return super.write(data)
  }

  end () {
    if (this.blockRemain)
      this.write(Buffer.alloc(this.blockRemain))
    return super.end()
  }
})

WriteEntry.Sync = WriteEntrySync
WriteEntry.Tar = WriteEntryTar

const getType = stat =>
  stat.isFile() ? 'File'
  : stat.isDirectory() ? 'Directory'
  : stat.isSymbolicLink() ? 'SymbolicLink'
  : 'Unsupported'

module.exports = WriteEntry

},
"nB1sORH0sHB3HwuVwSIfqP+HqxiOeLKDcklHFiMBvGk=":
function (require, module, exports, __dirname, __filename) {
'use strict'

const assert = require('assert')
const Buffer = require('buffer').Buffer
const binding = process.binding('zlib')

const constants = exports.constants = require('./constants.js')
const MiniPass = require('minipass')

class ZlibError extends Error {
  constructor (msg, errno) {
    super('zlib: ' + msg)
    this.errno = errno
    this.code = codes.get(errno)
  }

  get name () {
    return 'ZlibError'
  }
}

// translation table for return codes.
const codes = new Map([
  [constants.Z_OK, 'Z_OK'],
  [constants.Z_STREAM_END, 'Z_STREAM_END'],
  [constants.Z_NEED_DICT, 'Z_NEED_DICT'],
  [constants.Z_ERRNO, 'Z_ERRNO'],
  [constants.Z_STREAM_ERROR, 'Z_STREAM_ERROR'],
  [constants.Z_DATA_ERROR, 'Z_DATA_ERROR'],
  [constants.Z_MEM_ERROR, 'Z_MEM_ERROR'],
  [constants.Z_BUF_ERROR, 'Z_BUF_ERROR'],
  [constants.Z_VERSION_ERROR, 'Z_VERSION_ERROR']
])

const validFlushFlags = new Set([
  constants.Z_NO_FLUSH,
  constants.Z_PARTIAL_FLUSH,
  constants.Z_SYNC_FLUSH,
  constants.Z_FULL_FLUSH,
  constants.Z_FINISH,
  constants.Z_BLOCK
])

const strategies = new Set([
  constants.Z_FILTERED,
  constants.Z_HUFFMAN_ONLY,
  constants.Z_RLE,
  constants.Z_FIXED,
  constants.Z_DEFAULT_STRATEGY
])

// the Zlib class they all inherit from
// This thing manages the queue of requests, and returns
// true or false if there is anything in the queue when
// you call the .write() method.
const _opts = Symbol('opts')
const _chunkSize = Symbol('chunkSize')
const _flushFlag = Symbol('flushFlag')
const _finishFlush = Symbol('finishFlush')
const _handle = Symbol('handle')
const _hadError = Symbol('hadError')
const _buffer = Symbol('buffer')
const _offset = Symbol('offset')
const _level = Symbol('level')
const _strategy = Symbol('strategy')
const _ended = Symbol('ended')
const _writeState = Symbol('writeState')

class Zlib extends MiniPass {
  constructor (opts, mode) {
    super(opts)
    this[_ended] = false
    this[_opts] = opts = opts || {}
    this[_chunkSize] = opts.chunkSize || constants.Z_DEFAULT_CHUNK
    if (opts.flush && !validFlushFlags.has(opts.flush)) {
      throw new TypeError('Invalid flush flag: ' + opts.flush)
    }
    if (opts.finishFlush && !validFlushFlags.has(opts.finishFlush)) {
      throw new TypeError('Invalid flush flag: ' + opts.finishFlush)
    }

    this[_flushFlag] = opts.flush || constants.Z_NO_FLUSH
    this[_finishFlush] = typeof opts.finishFlush !== 'undefined' ?
      opts.finishFlush : constants.Z_FINISH

    if (opts.chunkSize) {
      if (opts.chunkSize < constants.Z_MIN_CHUNK) {
        throw new RangeError('Invalid chunk size: ' + opts.chunkSize)
      }
    }

    if (opts.windowBits) {
      if (opts.windowBits < constants.Z_MIN_WINDOWBITS ||
          opts.windowBits > constants.Z_MAX_WINDOWBITS) {
        throw new RangeError('Invalid windowBits: ' + opts.windowBits)
      }
    }

    if (opts.level) {
      if (opts.level < constants.Z_MIN_LEVEL ||
          opts.level > constants.Z_MAX_LEVEL) {
        throw new RangeError('Invalid compression level: ' + opts.level)
      }
    }

    if (opts.memLevel) {
      if (opts.memLevel < constants.Z_MIN_MEMLEVEL ||
          opts.memLevel > constants.Z_MAX_MEMLEVEL) {
        throw new RangeError('Invalid memLevel: ' + opts.memLevel)
      }
    }

    if (opts.strategy && !(strategies.has(opts.strategy)))
      throw new TypeError('Invalid strategy: ' + opts.strategy)

    if (opts.dictionary) {
      if (!(opts.dictionary instanceof Buffer)) {
        throw new TypeError('Invalid dictionary: it should be a Buffer instance')
      }
    }

    this[_handle] = new binding.Zlib(mode)

    this[_hadError] = false
    this[_handle].onerror = (message, errno) => {
      // there is no way to cleanly recover.
      // continuing only obscures problems.
      this.close()
      this[_hadError] = true

      const error = new ZlibError(message, errno)
      this.emit('error', error)
    }

    const level = typeof opts.level === 'number' ? opts.level
                : constants.Z_DEFAULT_COMPRESSION

    var strategy = typeof opts.strategy === 'number' ? opts.strategy
                 : constants.Z_DEFAULT_STRATEGY

    this[_writeState] = new Uint32Array(2);
    const window = opts.windowBits || constants.Z_DEFAULT_WINDOWBITS
    const memLevel = opts.memLevel || constants.Z_DEFAULT_MEMLEVEL

    // API changed in node v9
    /* istanbul ignore next */
    if (/^v[0-8]\./.test(process.version)) {
      this[_handle].init(window,
                         level,
                         memLevel,
                         strategy,
                         opts.dictionary)
    } else {
      this[_handle].init(window,
                         level,
                         memLevel,
                         strategy,
                         this[_writeState],
                         () => {},
                         opts.dictionary)
    }

    this[_buffer] = Buffer.allocUnsafe(this[_chunkSize])
    this[_offset] = 0
    this[_level] = level
    this[_strategy] = strategy

    this.once('end', this.close)
  }

  close () {
    if (this[_handle]) {
      this[_handle].close()
      this[_handle] = null
      this.emit('close')
    }
  }

  params (level, strategy) {
    if (!this[_handle])
      throw new Error('cannot switch params when binding is closed')

    // no way to test this without also not supporting params at all
    /* istanbul ignore if */
    if (!this[_handle].params)
      throw new Error('not supported in this implementation')

    if (level < constants.Z_MIN_LEVEL ||
        level > constants.Z_MAX_LEVEL) {
      throw new RangeError('Invalid compression level: ' + level)
    }

    if (!(strategies.has(strategy)))
      throw new TypeError('Invalid strategy: ' + strategy)

    if (this[_level] !== level || this[_strategy] !== strategy) {
      this.flush(constants.Z_SYNC_FLUSH)
      assert(this[_handle], 'zlib binding closed')
      this[_handle].params(level, strategy)
      /* istanbul ignore else */
      if (!this[_hadError]) {
        this[_level] = level
        this[_strategy] = strategy
      }
    }
  }

  reset () {
    assert(this[_handle], 'zlib binding closed')
    return this[_handle].reset()
  }

  flush (kind) {
    if (kind === undefined)
      kind = constants.Z_FULL_FLUSH

    if (this.ended)
      return

    const flushFlag = this[_flushFlag]
    this[_flushFlag] = kind
    this.write(Buffer.alloc(0))
    this[_flushFlag] = flushFlag
  }

  end (chunk, encoding, cb) {
    if (chunk)
      this.write(chunk, encoding)
    this.flush(this[_finishFlush])
    this[_ended] = true
    return super.end(null, null, cb)
  }

  get ended () {
    return this[_ended]
  }

  write (chunk, encoding, cb) {
    // process the chunk using the sync process
    // then super.write() all the outputted chunks
    if (typeof encoding === 'function')
      cb = encoding, encoding = 'utf8'

    if (typeof chunk === 'string')
      chunk = new Buffer(chunk, encoding)

    let availInBefore = chunk && chunk.length
    let availOutBefore = this[_chunkSize] - this[_offset]
    let inOff = 0 // the offset of the input buffer
    const flushFlag = this[_flushFlag]
    let writeReturn = true

    assert(this[_handle], 'zlib binding closed')
    do {
      let res = this[_handle].writeSync(
        flushFlag,
        chunk, // in
        inOff, // in_off
        availInBefore, // in_len
        this[_buffer], // out
        this[_offset], //out_off
        availOutBefore // out_len
      )

      if (this[_hadError])
        break

      // API changed in v9
      /* istanbul ignore next */
      let availInAfter = res ? res[0] : this[_writeState][1]
      /* istanbul ignore next */
      let availOutAfter = res ? res[1] : this[_writeState][0]

      const have = availOutBefore - availOutAfter
      assert(have >= 0, 'have should not go down')

      if (have > 0) {
        const out = this[_buffer].slice(
          this[_offset], this[_offset] + have
        )

        this[_offset] += have
        // serve some output to the consumer.
        writeReturn = super.write(out) && writeReturn
      }

      // exhausted the output buffer, or used all the input create a new one.
      if (availOutAfter === 0 || this[_offset] >= this[_chunkSize]) {
        availOutBefore = this[_chunkSize]
        this[_offset] = 0
        this[_buffer] = Buffer.allocUnsafe(this[_chunkSize])
      }

      if (availOutAfter === 0) {
        // Not actually done.  Need to reprocess.
        // Also, update the availInBefore to the availInAfter value,
        // so that if we have to hit it a third (fourth, etc.) time,
        // it'll have the correct byte counts.
        inOff += (availInBefore - availInAfter)
        availInBefore = availInAfter
        continue
      }
      break
    } while (!this[_hadError])

    if (cb)
      cb()
    return writeReturn
  }
}

// minimal 2-byte header
class Deflate extends Zlib {
  constructor (opts) {
    super(opts, constants.DEFLATE)
  }
}

class Inflate extends Zlib {
  constructor (opts) {
    super(opts, constants.INFLATE)
  }
}

// gzip - bigger header, same deflate compression
class Gzip extends Zlib {
  constructor (opts) {
    super(opts, constants.GZIP)
  }
}

class Gunzip extends Zlib {
  constructor (opts) {
    super(opts, constants.GUNZIP)
  }
}

// raw - no header
class DeflateRaw extends Zlib {
  constructor (opts) {
    super(opts, constants.DEFLATERAW)
  }
}

class InflateRaw extends Zlib {
  constructor (opts) {
    super(opts, constants.INFLATERAW)
  }
}

// auto-detect header.
class Unzip extends Zlib {
  constructor (opts) {
    super(opts, constants.UNZIP)
  }
}

exports.Deflate = Deflate
exports.Inflate = Inflate
exports.Gzip = Gzip
exports.Gunzip = Gunzip
exports.DeflateRaw = DeflateRaw
exports.InflateRaw = InflateRaw
exports.Unzip = Unzip

},
"ouOOVcQgZJy+7lpqXJvCMm+hMGK+DyRWlYa6Dbf8gkE=":
function (require, module, exports, __dirname, __filename) {
var fs = require("fs");
var zlib = require("zlib");
var fd_slicer = require("fd-slicer");
var crc32 = require("buffer-crc32");
var util = require("util");
var EventEmitter = require("events").EventEmitter;
var Transform = require("stream").Transform;
var PassThrough = require("stream").PassThrough;
var Writable = require("stream").Writable;

exports.open = open;
exports.fromFd = fromFd;
exports.fromBuffer = fromBuffer;
exports.fromRandomAccessReader = fromRandomAccessReader;
exports.dosDateTimeToDate = dosDateTimeToDate;
exports.ZipFile = ZipFile;
exports.Entry = Entry;
exports.RandomAccessReader = RandomAccessReader;

function open(path, options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = null;
  }
  if (options == null) options = {};
  if (options.autoClose == null) options.autoClose = true;
  if (options.lazyEntries == null) options.lazyEntries = false;
  if (callback == null) callback = defaultCallback;
  fs.open(path, "r", function(err, fd) {
    if (err) return callback(err);
    fromFd(fd, options, function(err, zipfile) {
      if (err) fs.close(fd, defaultCallback);
      callback(err, zipfile);
    });
  });
}

function fromFd(fd, options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = null;
  }
  if (options == null) options = {};
  if (options.autoClose == null) options.autoClose = false;
  if (options.lazyEntries == null) options.lazyEntries = false;
  if (callback == null) callback = defaultCallback;
  fs.fstat(fd, function(err, stats) {
    if (err) return callback(err);
    var reader = fd_slicer.createFromFd(fd, {autoClose: true});
    fromRandomAccessReader(reader, stats.size, options, callback);
  });
}

function fromBuffer(buffer, options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = null;
  }
  if (options == null) options = {};
  options.autoClose = false;
  if (options.lazyEntries == null) options.lazyEntries = false;
  // i got your open file right here.
  var reader = fd_slicer.createFromBuffer(buffer);
  fromRandomAccessReader(reader, buffer.length, options, callback);
}

function fromRandomAccessReader(reader, totalSize, options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = null;
  }
  if (options == null) options = {};
  if (options.autoClose == null) options.autoClose = true;
  if (options.lazyEntries == null) options.lazyEntries = false;
  if (callback == null) callback = defaultCallback;
  if (typeof totalSize !== "number") throw new Error("expected totalSize parameter to be a number");
  if (totalSize > Number.MAX_SAFE_INTEGER) {
    throw new Error("zip file too large. only file sizes up to 2^52 are supported due to JavaScript's Number type being an IEEE 754 double.");
  }

  // the matching unref() call is in zipfile.close()
  reader.ref();

  // eocdr means End of Central Directory Record.
  // search backwards for the eocdr signature.
  // the last field of the eocdr is a variable-length comment.
  // the comment size is encoded in a 2-byte field in the eocdr, which we can't find without trudging backwards through the comment to find it.
  // as a consequence of this design decision, it's possible to have ambiguous zip file metadata if a coherent eocdr was in the comment.
  // we search backwards for a eocdr signature, and hope that whoever made the zip file was smart enough to forbid the eocdr signature in the comment.
  var eocdrWithoutCommentSize = 22;
  var maxCommentSize = 0x10000; // 2-byte size
  var bufferSize = Math.min(eocdrWithoutCommentSize + maxCommentSize, totalSize);
  var buffer = new Buffer(bufferSize);
  var bufferReadStart = totalSize - buffer.length;
  readAndAssertNoEof(reader, buffer, 0, bufferSize, bufferReadStart, function(err) {
    if (err) return callback(err);
    for (var i = bufferSize - eocdrWithoutCommentSize; i >= 0; i -= 1) {
      if (buffer.readUInt32LE(i) !== 0x06054b50) continue;
      // found eocdr
      var eocdrBuffer = buffer.slice(i);

      // 0 - End of central directory signature = 0x06054b50
      // 4 - Number of this disk
      var diskNumber = eocdrBuffer.readUInt16LE(4);
      if (diskNumber !== 0) {
        return callback(new Error("multi-disk zip files are not supported: found disk number: " + diskNumber));
      }
      // 6 - Disk where central directory starts
      // 8 - Number of central directory records on this disk
      // 10 - Total number of central directory records
      var entryCount = eocdrBuffer.readUInt16LE(10);
      // 12 - Size of central directory (bytes)
      // 16 - Offset of start of central directory, relative to start of archive
      var centralDirectoryOffset = eocdrBuffer.readUInt32LE(16);
      // 20 - Comment length
      var commentLength = eocdrBuffer.readUInt16LE(20);
      var expectedCommentLength = eocdrBuffer.length - eocdrWithoutCommentSize;
      if (commentLength !== expectedCommentLength) {
        return callback(new Error("invalid comment length. expected: " + expectedCommentLength + ". found: " + commentLength));
      }
      // 22 - Comment
      // the encoding is always cp437.
      var comment = bufferToString(eocdrBuffer, 22, eocdrBuffer.length, false);

      if (!(entryCount === 0xffff || centralDirectoryOffset === 0xffffffff)) {
        return callback(null, new ZipFile(reader, centralDirectoryOffset, totalSize, entryCount, comment, options.autoClose, options.lazyEntries));
      }

      // ZIP64 format

      // ZIP64 Zip64 end of central directory locator
      var zip64EocdlBuffer = new Buffer(20);
      var zip64EocdlOffset = bufferReadStart + i - zip64EocdlBuffer.length;
      readAndAssertNoEof(reader, zip64EocdlBuffer, 0, zip64EocdlBuffer.length, zip64EocdlOffset, function(err) {
        if (err) return callback(err);

        // 0 - zip64 end of central dir locator signature = 0x07064b50
        if (zip64EocdlBuffer.readUInt32LE(0) !== 0x07064b50) {
          return callback(new Error("invalid zip64 end of central directory locator signature"));
        }
        // 4 - number of the disk with the start of the zip64 end of central directory
        // 8 - relative offset of the zip64 end of central directory record
        var zip64EocdrOffset = readUInt64LE(zip64EocdlBuffer, 8);
        // 16 - total number of disks

        // ZIP64 end of central directory record
        var zip64EocdrBuffer = new Buffer(56);
        readAndAssertNoEof(reader, zip64EocdrBuffer, 0, zip64EocdrBuffer.length, zip64EocdrOffset, function(err) {
          if (err) return callback(err);

          // 0 - zip64 end of central dir signature                           4 bytes  (0x06064b50)
          if (zip64EocdrBuffer.readUInt32LE(0) !== 0x06064b50) {
            return callback(new Error("invalid zip64 end of central directory record signature"));
          }
          // 4 - size of zip64 end of central directory record                8 bytes
          // 12 - version made by                                             2 bytes
          // 14 - version needed to extract                                   2 bytes
          // 16 - number of this disk                                         4 bytes
          // 20 - number of the disk with the start of the central directory  4 bytes
          // 24 - total number of entries in the central directory on this disk         8 bytes
          // 32 - total number of entries in the central directory            8 bytes
          entryCount = readUInt64LE(zip64EocdrBuffer, 32);
          // 40 - size of the central directory                               8 bytes
          // 48 - offset of start of central directory with respect to the starting disk number     8 bytes
          centralDirectoryOffset = readUInt64LE(zip64EocdrBuffer, 48);
          // 56 - zip64 extensible data sector                                (variable size)
          return callback(null, new ZipFile(reader, centralDirectoryOffset, totalSize, entryCount, comment, options.autoClose, options.lazyEntries));
        });
      });
      return;
    }
    callback(new Error("end of central directory record signature not found"));
  });
}

util.inherits(ZipFile, EventEmitter);
function ZipFile(reader, centralDirectoryOffset, fileSize, entryCount, comment, autoClose, lazyEntries) {
  var self = this;
  EventEmitter.call(self);
  self.reader = reader;
  // forward close events
  self.reader.on("error", function(err) {
    // error closing the fd
    emitError(self, err);
  });
  self.reader.once("close", function() {
    self.emit("close");
  });
  self.readEntryCursor = centralDirectoryOffset;
  self.fileSize = fileSize;
  self.entryCount = entryCount;
  self.comment = comment;
  self.entriesRead = 0;
  self.autoClose = !!autoClose;
  self.lazyEntries = !!lazyEntries;
  self.isOpen = true;
  self.emittedError = false;

  if (!self.lazyEntries) self.readEntry();
}
ZipFile.prototype.close = function() {
  if (!this.isOpen) return;
  this.isOpen = false;
  this.reader.unref();
};

function emitErrorAndAutoClose(self, err) {
  if (self.autoClose) self.close();
  emitError(self, err);
}
function emitError(self, err) {
  if (self.emittedError) return;
  self.emittedError = true;
  self.emit("error", err);
}

ZipFile.prototype.readEntry = function() {
  var self = this;
  if (self.entryCount === self.entriesRead) {
    // done with metadata
    setImmediate(function() {
      if (self.autoClose) self.close();
      if (self.emittedError) return;
      self.emit("end");
    });
    return;
  }
  if (self.emittedError) return;
  var buffer = new Buffer(46);
  readAndAssertNoEof(self.reader, buffer, 0, buffer.length, self.readEntryCursor, function(err) {
    if (err) return emitErrorAndAutoClose(self, err);
    if (self.emittedError) return;
    var entry = new Entry();
    // 0 - Central directory file header signature
    var signature = buffer.readUInt32LE(0);
    if (signature !== 0x02014b50) return emitErrorAndAutoClose(self, new Error("invalid central directory file header signature: 0x" + signature.toString(16)));
    // 4 - Version made by
    entry.versionMadeBy = buffer.readUInt16LE(4);
    // 6 - Version needed to extract (minimum)
    entry.versionNeededToExtract = buffer.readUInt16LE(6);
    // 8 - General purpose bit flag
    entry.generalPurposeBitFlag = buffer.readUInt16LE(8);
    // 10 - Compression method
    entry.compressionMethod = buffer.readUInt16LE(10);
    // 12 - File last modification time
    entry.lastModFileTime = buffer.readUInt16LE(12);
    // 14 - File last modification date
    entry.lastModFileDate = buffer.readUInt16LE(14);
    // 16 - CRC-32
    entry.crc32 = buffer.readUInt32LE(16);
    // 20 - Compressed size
    entry.compressedSize = buffer.readUInt32LE(20);
    // 24 - Uncompressed size
    entry.uncompressedSize = buffer.readUInt32LE(24);
    // 28 - File name length (n)
    entry.fileNameLength = buffer.readUInt16LE(28);
    // 30 - Extra field length (m)
    entry.extraFieldLength = buffer.readUInt16LE(30);
    // 32 - File comment length (k)
    entry.fileCommentLength = buffer.readUInt16LE(32);
    // 34 - Disk number where file starts
    // 36 - Internal file attributes
    entry.internalFileAttributes = buffer.readUInt16LE(36);
    // 38 - External file attributes
    entry.externalFileAttributes = buffer.readUInt32LE(38);
    // 42 - Relative offset of local file header
    entry.relativeOffsetOfLocalHeader = buffer.readUInt32LE(42);

    self.readEntryCursor += 46;

    buffer = new Buffer(entry.fileNameLength + entry.extraFieldLength + entry.fileCommentLength);
    readAndAssertNoEof(self.reader, buffer, 0, buffer.length, self.readEntryCursor, function(err) {
      if (err) return emitErrorAndAutoClose(self, err);
      if (self.emittedError) return;
      // 46 - File name
      var isUtf8 = entry.generalPurposeBitFlag & 0x800
      entry.fileName = bufferToString(buffer, 0, entry.fileNameLength, isUtf8);

      // 46+n - Extra field
      var fileCommentStart = entry.fileNameLength + entry.extraFieldLength;
      var extraFieldBuffer = buffer.slice(entry.fileNameLength, fileCommentStart);
      entry.extraFields = [];
      var i = 0;
      while (i < extraFieldBuffer.length - 3) {
        var headerId = extraFieldBuffer.readUInt16LE(i + 0);
        var dataSize = extraFieldBuffer.readUInt16LE(i + 2);
        var dataStart = i + 4;
        var dataEnd = dataStart + dataSize;
        if (dataEnd > extraFieldBuffer.length) return emitErrorAndAutoClose(self, new Error("extra field length exceeds extra field buffer size"));
        var dataBuffer = new Buffer(dataSize);
        extraFieldBuffer.copy(dataBuffer, 0, dataStart, dataEnd);
        entry.extraFields.push({
          id: headerId,
          data: dataBuffer,
        });
        i = dataEnd;
      }

      // 46+n+m - File comment
      entry.fileComment = bufferToString(buffer, fileCommentStart, fileCommentStart + entry.fileCommentLength, isUtf8);

      self.readEntryCursor += buffer.length;
      self.entriesRead += 1;

      if (entry.uncompressedSize            === 0xffffffff ||
          entry.compressedSize              === 0xffffffff ||
          entry.relativeOffsetOfLocalHeader === 0xffffffff) {
        // ZIP64 format
        // find the Zip64 Extended Information Extra Field
        var zip64EiefBuffer = null;
        for (var i = 0; i < entry.extraFields.length; i++) {
          var extraField = entry.extraFields[i];
          if (extraField.id === 0x0001) {
            zip64EiefBuffer = extraField.data;
            break;
          }
        }
        if (zip64EiefBuffer == null) {
          return emitErrorAndAutoClose(self, new Error("expected zip64 extended information extra field"));
        }
        var index = 0;
        // 0 - Original Size          8 bytes
        if (entry.uncompressedSize === 0xffffffff) {
          if (index + 8 > zip64EiefBuffer.length) {
            return emitErrorAndAutoClose(self, new Error("zip64 extended information extra field does not include uncompressed size"));
          }
          entry.uncompressedSize = readUInt64LE(zip64EiefBuffer, index);
          index += 8;
        }
        // 8 - Compressed Size        8 bytes
        if (entry.compressedSize === 0xffffffff) {
          if (index + 8 > zip64EiefBuffer.length) {
            return emitErrorAndAutoClose(self, new Error("zip64 extended information extra field does not include compressed size"));
          }
          entry.compressedSize = readUInt64LE(zip64EiefBuffer, index);
          index += 8;
        }
        // 16 - Relative Header Offset 8 bytes
        if (entry.relativeOffsetOfLocalHeader === 0xffffffff) {
          if (index + 8 > zip64EiefBuffer.length) {
            return emitErrorAndAutoClose(self, new Error("zip64 extended information extra field does not include relative header offset"));
          }
          entry.relativeOffsetOfLocalHeader = readUInt64LE(zip64EiefBuffer, index);
          index += 8;
        }
        // 24 - Disk Start Number      4 bytes
      }

      // check for Info-ZIP Unicode Path Extra Field (0x7075)
      // see https://github.com/thejoshwolfe/yauzl/issues/33
      for (var i = 0; i < entry.extraFields.length; i++) {
        var extraField = entry.extraFields[i];
        if (extraField.id === 0x7075) {
          if (extraField.data.length < 6) {
            // too short to be meaningful
            continue;
          }
          // Version       1 byte      version of this extra field, currently 1
          if (extraField.data.readUInt8(0) !== 1) {
            // > Changes may not be backward compatible so this extra
            // > field should not be used if the version is not recognized.
            continue;
          }
          // NameCRC32     4 bytes     File Name Field CRC32 Checksum
          var oldNameCrc32 = extraField.data.readUInt32LE(1);
          if (crc32.unsigned(buffer.slice(0, entry.fileNameLength)) !== oldNameCrc32) {
            // > If the CRC check fails, this UTF-8 Path Extra Field should be
            // > ignored and the File Name field in the header should be used instead.
            continue;
          }
          // UnicodeName   Variable    UTF-8 version of the entry File Name
          entry.fileName = bufferToString(extraField.data, 5, extraField.data.length, true);
          break;
        }
      }

      // validate file size
      if (entry.compressionMethod === 0) {
        if (entry.compressedSize !== entry.uncompressedSize) {
          var msg = "compressed/uncompressed size mismatch for stored file: " + entry.compressedSize + " != " + entry.uncompressedSize;
          return emitErrorAndAutoClose(self, new Error(msg));
        }
      }

      // validate file name
      if (entry.fileName.indexOf("\\") !== -1) {
        return emitErrorAndAutoClose(self, new Error("invalid characters in fileName: " + entry.fileName));
      }
      if (/^[a-zA-Z]:/.test(entry.fileName) || /^\//.test(entry.fileName)) {
        return emitErrorAndAutoClose(self, new Error("absolute path: " + entry.fileName));
      }
      if (entry.fileName.split("/").indexOf("..") !== -1) {
        return emitErrorAndAutoClose(self, new Error("invalid relative path: " + entry.fileName));
      }
      self.emit("entry", entry);

      if (!self.lazyEntries) self.readEntry();
    });
  });
};

ZipFile.prototype.openReadStream = function(entry, callback) {
  var self = this;
  if (!self.isOpen) return callback(new Error("closed"));
  // make sure we don't lose the fd before we open the actual read stream
  self.reader.ref();
  var buffer = new Buffer(30);
  readAndAssertNoEof(self.reader, buffer, 0, buffer.length, entry.relativeOffsetOfLocalHeader, function(err) {
    try {
      if (err) return callback(err);
      // 0 - Local file header signature = 0x04034b50
      var signature = buffer.readUInt32LE(0);
      if (signature !== 0x04034b50) {
        return callback(new Error("invalid local file header signature: 0x" + signature.toString(16)));
      }
      // all this should be redundant
      // 4 - Version needed to extract (minimum)
      // 6 - General purpose bit flag
      // 8 - Compression method
      // 10 - File last modification time
      // 12 - File last modification date
      // 14 - CRC-32
      // 18 - Compressed size
      // 22 - Uncompressed size
      // 26 - File name length (n)
      var fileNameLength = buffer.readUInt16LE(26);
      // 28 - Extra field length (m)
      var extraFieldLength = buffer.readUInt16LE(28);
      // 30 - File name
      // 30+n - Extra field
      var localFileHeaderEnd = entry.relativeOffsetOfLocalHeader + buffer.length + fileNameLength + extraFieldLength;
      var compressed;
      if (entry.compressionMethod === 0) {
        // 0 - The file is stored (no compression)
        compressed = false;
      } else if (entry.compressionMethod === 8) {
        // 8 - The file is Deflated
        compressed = true;
      } else {
        return callback(new Error("unsupported compression method: " + entry.compressionMethod));
      }
      var fileDataStart = localFileHeaderEnd;
      var fileDataEnd = fileDataStart + entry.compressedSize;
      if (entry.compressedSize !== 0) {
        // bounds check now, because the read streams will probably not complain loud enough.
        // since we're dealing with an unsigned offset plus an unsigned size,
        // we only have 1 thing to check for.
        if (fileDataEnd > self.fileSize) {
          return callback(new Error("file data overflows file bounds: " +
              fileDataStart + " + " + entry.compressedSize + " > " + self.fileSize));
        }
      }
      var readStream = self.reader.createReadStream({start: fileDataStart, end: fileDataEnd});
      var endpointStream = readStream;
      if (compressed) {
        var destroyed = false;
        var inflateFilter = zlib.createInflateRaw();
        readStream.on("error", function(err) {
          // setImmediate here because errors can be emitted during the first call to pipe()
          setImmediate(function() {
            if (!destroyed) inflateFilter.emit("error", err);
          });
        });

        var checkerStream = new AssertByteCountStream(entry.uncompressedSize);
        inflateFilter.on("error", function(err) {
          // forward zlib errors to the client-visible stream
          setImmediate(function() {
            if (!destroyed) checkerStream.emit("error", err);
          });
        });
        checkerStream.destroy = function() {
          destroyed = true;
          inflateFilter.unpipe(checkerStream);
          readStream.unpipe(inflateFilter);
          // TODO: the inflateFilter now causes a memory leak. see Issue #27.
          readStream.destroy();
        };
        endpointStream = readStream.pipe(inflateFilter).pipe(checkerStream);
      }
      callback(null, endpointStream);
    } finally {
      self.reader.unref();
    }
  });
};

function Entry() {
}
Entry.prototype.getLastModDate = function() {
  return dosDateTimeToDate(this.lastModFileDate, this.lastModFileTime);
};

function dosDateTimeToDate(date, time) {
  var day = date & 0x1f; // 1-31
  var month = (date >> 5 & 0xf) - 1; // 1-12, 0-11
  var year = (date >> 9 & 0x7f) + 1980; // 0-128, 1980-2108

  var millisecond = 0;
  var second = (time & 0x1f) * 2; // 0-29, 0-58 (even numbers)
  var minute = time >> 5 & 0x3f; // 0-59
  var hour = time >> 11 & 0x1f; // 0-23

  return new Date(year, month, day, hour, minute, second, millisecond);
}

function readAndAssertNoEof(reader, buffer, offset, length, position, callback) {
  if (length === 0) {
    // fs.read will throw an out-of-bounds error if you try to read 0 bytes from a 0 byte file
    return setImmediate(function() { callback(null, new Buffer(0)); });
  }
  reader.read(buffer, offset, length, position, function(err, bytesRead) {
    if (err) return callback(err);
    if (bytesRead < length) {
      return callback(new Error("unexpected EOF"));
    }
    callback();
  });
}

util.inherits(AssertByteCountStream, Transform);
function AssertByteCountStream(byteCount) {
  Transform.call(this);
  this.actualByteCount = 0;
  this.expectedByteCount = byteCount;
}
AssertByteCountStream.prototype._transform = function(chunk, encoding, cb) {
  this.actualByteCount += chunk.length;
  if (this.actualByteCount > this.expectedByteCount) {
    var msg = "too many bytes in the stream. expected " + this.expectedByteCount + ". got at least " + this.actualByteCount;
    return cb(new Error(msg));
  }
  cb(null, chunk);
};
AssertByteCountStream.prototype._flush = function(cb) {
  if (this.actualByteCount < this.expectedByteCount) {
    var msg = "not enough bytes in the stream. expected " + this.expectedByteCount + ". got only " + this.actualByteCount;
    return cb(new Error(msg));
  }
  cb();
};

util.inherits(RandomAccessReader, EventEmitter);
function RandomAccessReader() {
  EventEmitter.call(this);
  this.refCount = 0;
}
RandomAccessReader.prototype.ref = function() {
  this.refCount += 1;
};
RandomAccessReader.prototype.unref = function() {
  var self = this;
  self.refCount -= 1;

  if (self.refCount > 0) return;
  if (self.refCount < 0) throw new Error("invalid unref");

  self.close(onCloseDone);

  function onCloseDone(err) {
    if (err) return self.emit('error', err);
    self.emit('close');
  }
};
RandomAccessReader.prototype.createReadStream = function(options) {
  var start = options.start;
  var end = options.end;
  if (start === end) {
    var emptyStream = new PassThrough();
    setImmediate(function() {
      emptyStream.end();
    });
    return emptyStream;
  }
  var stream = this._readStreamForRange(start, end);

  var destroyed = false;
  var refUnrefFilter = new RefUnrefFilter(this);
  stream.on("error", function(err) {
    setImmediate(function() {
      if (!destroyed) refUnrefFilter.emit("error", err);
    });
  });
  refUnrefFilter.destroy = function() {
    stream.unpipe(refUnrefFilter);
    refUnrefFilter.unref();
    stream.destroy();
  };

  var byteCounter = new AssertByteCountStream(end - start);
  refUnrefFilter.on("error", function(err) {
    setImmediate(function() {
      if (!destroyed) byteCounter.emit("error", err);
    });
  });
  byteCounter.destroy = function() {
    destroyed = true;
    refUnrefFilter.unpipe(byteCounter);
    refUnrefFilter.destroy();
  };

  return stream.pipe(refUnrefFilter).pipe(byteCounter);
};
RandomAccessReader.prototype._readStreamForRange = function(start, end) {
  throw new Error("not implemented");
};
RandomAccessReader.prototype.read = function(buffer, offset, length, position, callback) {
  var readStream = this.createReadStream({start: position, end: position + length});
  var writeStream = new Writable();
  var written = 0;
  writeStream._write = function(chunk, encoding, cb) {
    chunk.copy(buffer, offset + written, 0, chunk.length);
    written += chunk.length;
    cb();
  };
  writeStream.on("finish", callback);
  readStream.on("error", function(error) {
    callback(error);
  });
  readStream.pipe(writeStream);
};
RandomAccessReader.prototype.close = function(callback) {
  setImmediate(callback);
};

util.inherits(RefUnrefFilter, PassThrough);
function RefUnrefFilter(context) {
  PassThrough.call(this);
  this.context = context;
  this.context.ref();
  this.unreffedYet = false;
}
RefUnrefFilter.prototype._flush = function(cb) {
  this.unref();
  cb();
};
RefUnrefFilter.prototype.unref = function(cb) {
  if (this.unreffedYet) return;
  this.unreffedYet = true;
  this.context.unref();
};

var cp437 = '\u0000☺☻♥♦♣♠•◘○◙♂♀♪♫☼►◄↕‼¶§▬↨↑↓→←∟↔▲▼ !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~⌂ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ ';
function bufferToString(buffer, start, end, isUtf8) {
  if (isUtf8) {
    return buffer.toString("utf8", start, end);
  } else {
    var result = "";
    for (var i = start; i < end; i++) {
      result += cp437[buffer[i]];
    }
    return result;
  }
}

function readUInt64LE(buffer, offset) {
  // there is no native function for this, because we can't actually store 64-bit integers precisely.
  // after 53 bits, JavaScript's Number type (IEEE 754 double) can't store individual integers anymore.
  // but since 53 bits is a whole lot more than 32 bits, we do our best anyway.
  var lower32 = buffer.readUInt32LE(offset);
  var upper32 = buffer.readUInt32LE(offset + 4);
  // we can't use bitshifting here, because JavaScript bitshifting only works on 32-bit integers.
  return upper32 * 0x100000000 + lower32;
  // as long as we're bounds checking the result of this function against the total file size,
  // we'll catch any overflow errors, because we already made sure the total file size was within reason.
}

function defaultCallback(err) {
  if (err) throw err;
}

},
"qf32nrRJcz5ulBOhqaOhbRFR1PGe8tScTbGJRKCNRk0=":
function (require, module, exports, __dirname, __filename) {
'use strict'
const Header = require('./header.js')
const path = require('path')

class Pax {
  constructor (obj, global) {
    this.atime = obj.atime || null
    this.charset = obj.charset || null
    this.comment = obj.comment || null
    this.ctime = obj.ctime || null
    this.gid = obj.gid || null
    this.gname = obj.gname || null
    this.linkpath = obj.linkpath || null
    this.mtime = obj.mtime || null
    this.path = obj.path || null
    this.size = obj.size || null
    this.uid = obj.uid || null
    this.uname = obj.uname || null
    this.dev = obj.dev || null
    this.ino = obj.ino || null
    this.nlink = obj.nlink || null
    this.global = global || false
  }

  encode () {
    const body = this.encodeBody()
    if (body === '')
      return null

    const bodyLen = Buffer.byteLength(body)
    // round up to 512 bytes
    // add 512 for header
    const bufLen = 512 * Math.ceil(1 + bodyLen / 512)
    const buf = Buffer.allocUnsafe(bufLen)

    // 0-fill the header section, it might not hit every field
    for (let i = 0; i < 512; i++) {
      buf[i] = 0
    }

    new Header({
      // XXX split the path
      // then the path should be PaxHeader + basename, but less than 99,
      // prepend with the dirname
      path: ('PaxHeader/' + path.basename(this.path)).slice(0, 99),
      mode: this.mode || 0o644,
      uid: this.uid || null,
      gid: this.gid || null,
      size: bodyLen,
      mtime: this.mtime || null,
      type: this.global ? 'GlobalExtendedHeader' : 'ExtendedHeader',
      linkpath: '',
      uname: this.uname || '',
      gname: this.gname || '',
      devmaj: 0,
      devmin: 0,
      atime: this.atime || null,
      ctime: this.ctime || null
    }).encode(buf)

    buf.write(body, 512, bodyLen, 'utf8')

    // null pad after the body
    for (let i = bodyLen + 512; i < buf.length; i++) {
      buf[i] = 0
    }

    return buf
  }

  encodeBody () {
    return (
      this.encodeField('path') +
      this.encodeField('ctime') +
      this.encodeField('atime') +
      this.encodeField('dev') +
      this.encodeField('ino') +
      this.encodeField('nlink') +
      this.encodeField('charset') +
      this.encodeField('comment') +
      this.encodeField('gid') +
      this.encodeField('gname') +
      this.encodeField('linkpath') +
      this.encodeField('mtime') +
      this.encodeField('size') +
      this.encodeField('uid') +
      this.encodeField('uname')
    )
  }

  encodeField (field) {
    if (this[field] === null || this[field] === undefined)
      return ''
    const v = this[field] instanceof Date ? this[field].getTime() / 1000
      : this[field]
    const s = ' ' +
      (field === 'dev' || field === 'ino' || field === 'nlink'
       ? 'SCHILY.' : '') +
      field + '=' + v + '\n'
    const byteLen = Buffer.byteLength(s)
    // the digits includes the length of the digits in ascii base-10
    // so if it's 9 characters, then adding 1 for the 9 makes it 10
    // which makes it 11 chars.
    let digits = Math.floor(Math.log(byteLen) / Math.log(10)) + 1
    if (byteLen + digits >= Math.pow(10, digits))
      digits += 1
    const len = digits + byteLen
    return len + s
  }
}

Pax.parse = (string, ex, g) => new Pax(merge(parseKV(string), ex), g)

const merge = (a, b) =>
  b ? Object.keys(a).reduce((s, k) => (s[k] = a[k], s), b) : a

const parseKV = string =>
  string
    .replace(/\n$/, '')
    .split('\n')
    .reduce(parseKVLine, Object.create(null))

const parseKVLine = (set, line) => {
  const n = parseInt(line, 10)

  // XXX Values with \n in them will fail this.
  // Refactor to not be a naive line-by-line parse.
  if (n !== Buffer.byteLength(line) + 1)
    return set

  line = line.substr((n + ' ').length)
  const kv = line.split('=')
  const k = kv.shift().replace(/^SCHILY\.(dev|ino|nlink)/, '$1')
  if (!k)
    return set

  const v = kv.join('=')
  set[k] = /^([A-Z]+\.)?([mac]|birth|creation)time$/.test(k)
    ?  new Date(v * 1000)
    : /^[0-9]+$/.test(v) ? +v
    : v
  return set
}

module.exports = Pax

},
"rShkRzOhrA698Po52a5kgqfF/najh4ymb9PcXu4a8ec=":
function (require, module, exports, __dirname, __filename) {
'use strict'

// high-level commands
exports.c = exports.create = require('./lib/create.js')
exports.r = exports.replace = require('./lib/replace.js')
exports.t = exports.list = require('./lib/list.js')
exports.u = exports.update = require('./lib/update.js')
exports.x = exports.extract = require('./lib/extract.js')

// classes
exports.Pack = require('./lib/pack.js')
exports.Unpack = require('./lib/unpack.js')
exports.Parse = require('./lib/parse.js')
exports.ReadEntry = require('./lib/read-entry.js')
exports.WriteEntry = require('./lib/write-entry.js')
exports.Header = require('./lib/header.js')
exports.Pax = require('./lib/pax.js')
exports.types = require('./lib/types.js')

},
"rXIkOPGHC2EtkuoBZn64zUQrB8Iv95aY4me8dO1CqxA=":
function (require, module, exports, __dirname, __filename) {
'use strict'

// this[BUFFER] is the remainder of a chunk if we're waiting for
// the full 512 bytes of a header to come in.  We will Buffer.concat()
// it to the next write(), which is a mem copy, but a small one.
//
// this[QUEUE] is a Yallist of entries that haven't been emitted
// yet this can only get filled up if the user keeps write()ing after
// a write() returns false, or does a write() with more than one entry
//
// We don't buffer chunks, we always parse them and either create an
// entry, or push it into the active entry.  The ReadEntry class knows
// to throw data away if .ignore=true
//
// Shift entry off the buffer when it emits 'end', and emit 'entry' for
// the next one in the list.
//
// At any time, we're pushing body chunks into the entry at WRITEENTRY,
// and waiting for 'end' on the entry at READENTRY
//
// ignored entries get .resume() called on them straight away

const warner = require('./warn-mixin.js')
const path = require('path')
const Header = require('./header.js')
const EE = require('events')
const Yallist = require('yallist')
const maxMetaEntrySize = 1024 * 1024
const Entry = require('./read-entry.js')
const Pax = require('./pax.js')
const zlib = require('minizlib')

const gzipHeader = new Buffer([0x1f, 0x8b])
const STATE = Symbol('state')
const WRITEENTRY = Symbol('writeEntry')
const READENTRY = Symbol('readEntry')
const NEXTENTRY = Symbol('nextEntry')
const PROCESSENTRY = Symbol('processEntry')
const EX = Symbol('extendedHeader')
const GEX = Symbol('globalExtendedHeader')
const META = Symbol('meta')
const EMITMETA = Symbol('emitMeta')
const BUFFER = Symbol('buffer')
const QUEUE = Symbol('queue')
const ENDED = Symbol('ended')
const EMITTEDEND = Symbol('emittedEnd')
const EMIT = Symbol('emit')
const UNZIP = Symbol('unzip')
const CONSUMECHUNK = Symbol('consumeChunk')
const CONSUMECHUNKSUB = Symbol('consumeChunkSub')
const CONSUMEBODY = Symbol('consumeBody')
const CONSUMEMETA = Symbol('consumeMeta')
const CONSUMEHEADER = Symbol('consumeHeader')
const CONSUMING = Symbol('consuming')
const BUFFERCONCAT = Symbol('bufferConcat')
const MAYBEEND = Symbol('maybeEnd')
const WRITING = Symbol('writing')
const ABORTED = Symbol('aborted')
const DONE = Symbol('onDone')

const noop = _ => true

module.exports = warner(class Parser extends EE {
  constructor (opt) {
    opt = opt || {}
    super(opt)

    if (opt.ondone)
      this.on(DONE, opt.ondone)
    else
      this.on(DONE, _ => {
        this.emit('prefinish')
        this.emit('finish')
        this.emit('end')
        this.emit('close')
      })

    this.strict = !!opt.strict
    this.maxMetaEntrySize = opt.maxMetaEntrySize || maxMetaEntrySize
    this.filter = typeof opt.filter === 'function' ? opt.filter : noop

    // have to set this so that streams are ok piping into it
    this.writable = true
    this.readable = false

    this[QUEUE] = new Yallist()
    this[BUFFER] = null
    this[READENTRY] = null
    this[WRITEENTRY] = null
    this[STATE] = 'begin'
    this[META] = ''
    this[EX] = null
    this[GEX] = null
    this[ENDED] = false
    this[UNZIP] = null
    this[ABORTED] = false
    if (typeof opt.onwarn === 'function')
      this.on('warn', opt.onwarn)
    if (typeof opt.onentry === 'function')
      this.on('entry', opt.onentry)
  }

  [CONSUMEHEADER] (chunk, position) {
    const header = new Header(chunk, position)

    if (header.nullBlock)
      this[EMIT]('nullBlock')
    else if (!header.cksumValid)
      this.warn('invalid entry', header)
    else if (!header.path)
      this.warn('invalid: path is required', header)
    else {
      const type = header.type
      if (/^(Symbolic)?Link$/.test(type) && !header.linkpath)
        this.warn('invalid: linkpath required', header)
      else if (!/^(Symbolic)?Link$/.test(type) && header.linkpath)
        this.warn('invalid: linkpath forbidden', header)
      else {
        const entry = this[WRITEENTRY] = new Entry(header, this[EX], this[GEX])

        if (entry.meta) {
          if (entry.size > this.maxMetaEntrySize) {
            entry.ignore = true
            this[EMIT]('ignoredEntry', entry)
            this[STATE] = 'ignore'
          } else if (entry.size > 0) {
            this[META] = ''
            entry.on('data', c => this[META] += c)
            this[STATE] = 'meta'
          }
        } else {

          this[EX] = null
          entry.ignore = entry.ignore || !this.filter(entry.path, entry)
          if (entry.ignore) {
            this[EMIT]('ignoredEntry', entry)
            this[STATE] = entry.remain ? 'ignore' : 'begin'
          } else {
            if (entry.remain)
              this[STATE] = 'body'
            else {
              this[STATE] = 'begin'
              entry.end()
            }

            if (!this[READENTRY]) {
              this[QUEUE].push(entry)
              this[NEXTENTRY]()
            } else
              this[QUEUE].push(entry)
          }
        }
      }
    }
  }

  [PROCESSENTRY] (entry) {
    let go = true

    if (!entry) {
      this[READENTRY] = null
      go = false
    } else if (Array.isArray(entry))
      this.emit.apply(this, entry)
    else {
      this[READENTRY] = entry
      this.emit('entry', entry)
      if (!entry.emittedEnd) {
        entry.on('end', _ => this[NEXTENTRY]())
        go = false
      }
    }

    return go
  }

  [NEXTENTRY] () {
    do {} while (this[PROCESSENTRY](this[QUEUE].shift()))

    if (!this[QUEUE].length) {
      // At this point, there's nothing in the queue, but we may have an
      // entry which is being consumed (readEntry).
      // If we don't, then we definitely can handle more data.
      // If we do, and either it's flowing, or it has never had any data
      // written to it, then it needs more.
      // The only other possibility is that it has returned false from a
      // write() call, so we wait for the next drain to continue.
      const re = this[READENTRY]
      const drainNow = !re || re.flowing || re.size === re.remain
      if (drainNow) {
        if (!this[WRITING])
          this.emit('drain')
      } else
        re.once('drain', _ => this.emit('drain'))
     }
  }

  [CONSUMEBODY] (chunk, position) {
    // write up to but no  more than writeEntry.blockRemain
    const entry = this[WRITEENTRY]
    const br = entry.blockRemain
    const c = (br >= chunk.length && position === 0) ? chunk
      : chunk.slice(position, position + br)

    entry.write(c)

    if (!entry.blockRemain) {
      this[STATE] = 'begin'
      this[WRITEENTRY] = null
      entry.end()
    }

    return c.length
  }

  [CONSUMEMETA] (chunk, position) {
    const entry = this[WRITEENTRY]
    const ret = this[CONSUMEBODY](chunk, position)

    // if we finished, then the entry is reset
    if (!this[WRITEENTRY])
      this[EMITMETA](entry)

    return ret
  }

  [EMIT] (ev, data, extra) {
    if (!this[QUEUE].length && !this[READENTRY])
      this.emit(ev, data, extra)
    else
      this[QUEUE].push([ev, data, extra])
  }

  [EMITMETA] (entry) {
    this[EMIT]('meta', this[META])
    switch (entry.type) {
      case 'ExtendedHeader':
      case 'OldExtendedHeader':
        this[EX] = Pax.parse(this[META], this[EX], false)
        break

      case 'GlobalExtendedHeader':
        this[GEX] = Pax.parse(this[META], this[GEX], true)
        break

      case 'NextFileHasLongPath':
      case 'OldGnuLongPath':
        this[EX] = this[EX] || Object.create(null)
        this[EX].path = this[META].replace(/\0.*/, '')
        break

      case 'NextFileHasLongLinkpath':
        this[EX] = this[EX] || Object.create(null)
        this[EX].linkpath = this[META].replace(/\0.*/, '')
        break

      /* istanbul ignore next */
      default: throw new Error('unknown meta: ' + entry.type)
    }
  }

  abort (msg, error) {
    this[ABORTED] = true
    this.warn(msg, error)
    this.emit('abort')
  }

  write (chunk) {
    if (this[ABORTED])
      return

    // first write, might be gzipped
    if (this[UNZIP] === null && chunk) {
      if (this[BUFFER]) {
        chunk = Buffer.concat([this[BUFFER], chunk])
        this[BUFFER] = null
      }
      if (chunk.length < gzipHeader.length) {
        this[BUFFER] = chunk
        return true
      }
      for (let i = 0; this[UNZIP] === null && i < gzipHeader.length; i++) {
        if (chunk[i] !== gzipHeader[i])
          this[UNZIP] = false
      }
      if (this[UNZIP] === null) {
        const ended = this[ENDED]
        this[ENDED] = false
        this[UNZIP] = new zlib.Unzip()
        this[UNZIP].on('data', chunk => this[CONSUMECHUNK](chunk))
        this[UNZIP].on('error', er =>
          this.abort('zlib error: ' + er.message, er))
        this[UNZIP].on('end', _ => {
          this[ENDED] = true
          this[CONSUMECHUNK]()
        })
        return ended ? this[UNZIP].end(chunk) : this[UNZIP].write(chunk)
      }
    }

    this[WRITING] = true
    if (this[UNZIP])
      this[UNZIP].write(chunk)
    else
      this[CONSUMECHUNK](chunk)
    this[WRITING] = false

    // return false if there's a queue, or if the current entry isn't flowing
    const ret =
      this[QUEUE].length ? false :
      this[READENTRY] ? this[READENTRY].flowing :
      true

    // if we have no queue, then that means a clogged READENTRY
    if (!ret && !this[QUEUE].length)
      this[READENTRY].once('drain', _ => this.emit('drain'))

    return ret
  }

  [BUFFERCONCAT] (c) {
    if (c && !this[ABORTED])
      this[BUFFER] = this[BUFFER] ? Buffer.concat([this[BUFFER], c]) : c
  }

  [MAYBEEND] () {
    if (this[ENDED] && !this[EMITTEDEND] && !this[ABORTED]) {
      this[EMITTEDEND] = true
      const entry = this[WRITEENTRY]
      if (entry && entry.blockRemain) {
        const have = this[BUFFER] ? this[BUFFER].length : 0
        this.warn('Truncated input (needed ' + entry.blockRemain +
                  ' more bytes, only ' + have + ' available)', entry)
        if (this[BUFFER])
          entry.write(this[BUFFER])
        entry.end()
      }
      this[EMIT](DONE)
    }
  }

  [CONSUMECHUNK] (chunk) {
    if (this[CONSUMING]) {
      this[BUFFERCONCAT](chunk)
    } else if (!chunk && !this[BUFFER]) {
      this[MAYBEEND]()
    } else {
      this[CONSUMING] = true
      if (this[BUFFER]) {
        this[BUFFERCONCAT](chunk)
        const c = this[BUFFER]
        this[BUFFER] = null
        this[CONSUMECHUNKSUB](c)
      } else {
        this[CONSUMECHUNKSUB](chunk)
      }

      while (this[BUFFER] && this[BUFFER].length >= 512 && !this[ABORTED]) {
        const c = this[BUFFER]
        this[BUFFER] = null
        this[CONSUMECHUNKSUB](c)
      }
      this[CONSUMING] = false
    }

    if (!this[BUFFER] || this[ENDED])
      this[MAYBEEND]()
  }

  [CONSUMECHUNKSUB] (chunk) {
    // we know that we are in CONSUMING mode, so anything written goes into
    // the buffer.  Advance the position and put any remainder in the buffer.
    let position = 0
    let length = chunk.length
    while (position + 512 <= length && !this[ABORTED]) {
      switch (this[STATE]) {
        case 'begin':
          this[CONSUMEHEADER](chunk, position)
          position += 512
          break

        case 'ignore':
        case 'body':
          position += this[CONSUMEBODY](chunk, position)
          break

        case 'meta':
          position += this[CONSUMEMETA](chunk, position)
          break

        /* istanbul ignore next */
        default:
          throw new Error('invalid state: ' + this[STATE])
      }
    }

    if (position < length) {
      if (this[BUFFER])
        this[BUFFER] = Buffer.concat([chunk.slice(position), this[BUFFER]])
      else
        this[BUFFER] = chunk.slice(position)
    }
  }

  end (chunk) {
    if (!this[ABORTED]) {
      if (this[UNZIP])
        this[UNZIP].end(chunk)
      else {
        this[ENDED] = true
        this.write(chunk)
      }
    }
  }
})

},
"tNtdyqK1JWdq/oww0XjRtZl4oEl/QGtEDpp9xFy/7Kk=":
function (require, module, exports, __dirname, __filename) {
'use strict'

// tar -u

const hlo = require('./high-level-opt.js')
const r = require('./replace.js')
// just call tar.r with the filter and mtimeCache

const u = module.exports = (opt_, files, cb) => {
  const opt = hlo(opt_)

  if (!opt.file)
    throw new TypeError('file is required')

  if (opt.gzip)
    throw new TypeError('cannot append to compressed archives')

  if (!files || !Array.isArray(files) || !files.length)
    throw new TypeError('no files or directories specified')

  files = Array.from(files)

  mtimeFilter(opt)
  return r(opt, files, cb)
}

const mtimeFilter = opt => {
  const filter = opt.filter

  if (!opt.mtimeCache)
    opt.mtimeCache = new Map()

  opt.filter = filter ? (path, stat) =>
    filter(path, stat) && !(opt.mtimeCache.get(path) > stat.mtime)
    : (path, stat) => !(opt.mtimeCache.get(path) > stat.mtime)
}

},
"yTRNZtEc/3P3eRnCZF4s/qxMfpvD3PPosJ5DhDFK+pw=":
function (require, module, exports, __dirname, __filename) {
'use strict'
// Tar can encode large and negative numbers using a leading byte of
// 0xff for negative, and 0x80 for positive.  The trailing byte in the
// section will always be 0x20, or in some implementations 0x00.
// this module encodes and decodes these things.

const encode = exports.encode = (num, buf) => {
  buf[buf.length - 1] = 0x20
  if (num < 0)
    encodeNegative(num, buf)
  else
    encodePositive(num, buf)
  return buf
}

const encodePositive = (num, buf) => {
  buf[0] = 0x80
  for (var i = buf.length - 2; i > 0; i--) {
    if (num === 0)
      buf[i] = 0
    else {
      buf[i] = num % 0x100
      num = Math.floor(num / 0x100)
    }
  }
}

const encodeNegative = (num, buf) => {
  buf[0] = 0xff
  var flipped = false
  num = num * -1
  for (var i = buf.length - 2; i > 0; i--) {
    var byte
    if (num === 0)
      byte = 0
    else {
      byte = num % 0x100
      num = Math.floor(num / 0x100)
    }
    if (flipped)
      buf[i] = onesComp(byte)
    else if (byte === 0)
      buf[i] = 0
    else {
      flipped = true
      buf[i] = twosComp(byte)
    }
  }
}

const parse = exports.parse = (buf) => {
  var post = buf[buf.length - 1]
  var pre = buf[0]
  return pre === 0x80 ? pos(buf.slice(1, buf.length - 1))
   : twos(buf.slice(1, buf.length - 1))
}

const twos = (buf) => {
  var len = buf.length
  var sum = 0
  var flipped = false
  for (var i = len - 1; i > -1; i--) {
    var byte = buf[i]
    var f
    if (flipped)
      f = onesComp(byte)
    else if (byte === 0)
      f = byte
    else {
      flipped = true
      f = twosComp(byte)
    }
    if (f !== 0)
      sum += f * Math.pow(256, len - i - 1)
  }
  return sum * -1
}

const pos = (buf) => {
  var len = buf.length
  var sum = 0
  for (var i = len - 1; i > -1; i--) {
    var byte = buf[i]
    if (byte !== 0)
      sum += byte * Math.pow(256, len - i - 1)
  }
  return sum
}

const onesComp = byte => (0xff ^ byte) & 0xff

const twosComp = byte => ((0xff ^ byte) + 1) & 0xff

},
"yqaFQcV/cROZTUxrrS5nciUxsPBHdi6an7jDb0v6a98=":
function (require, module, exports, __dirname, __filename) {
'use strict'
module.exports = Base => class extends Base {
  warn (msg, data) {
    if (!this.strict)
      this.emit('warn', msg, data)
    else if (data instanceof Error)
      this.emit('error', data)
    else {
      const er = new Error(msg)
      er.data = data
      this.emit('error', er)
    }
  }
}

},
"zKweDZDbztLqts5P+j6/5ZyRUqHj8ji0QqXYIuZmk+g=":
function (require, module, exports, __dirname, __filename) {
module.exports = Object.freeze({
  Z_NO_FLUSH: 0,
  Z_PARTIAL_FLUSH: 1,
  Z_SYNC_FLUSH: 2,
  Z_FULL_FLUSH: 3,
  Z_FINISH: 4,
  Z_BLOCK: 5,
  Z_OK: 0,
  Z_STREAM_END: 1,
  Z_NEED_DICT: 2,
  Z_ERRNO: -1,
  Z_STREAM_ERROR: -2,
  Z_DATA_ERROR: -3,
  Z_MEM_ERROR: -4,
  Z_BUF_ERROR: -5,
  Z_VERSION_ERROR: -6,
  Z_NO_COMPRESSION: 0,
  Z_BEST_SPEED: 1,
  Z_BEST_COMPRESSION: 9,
  Z_DEFAULT_COMPRESSION: -1,
  Z_FILTERED: 1,
  Z_HUFFMAN_ONLY: 2,
  Z_RLE: 3,
  Z_FIXED: 4,
  Z_DEFAULT_STRATEGY: 0,
  ZLIB_VERNUM: 4736,
  DEFLATE: 1,
  INFLATE: 2,
  GZIP: 3,
  GUNZIP: 4,
  DEFLATERAW: 5,
  INFLATERAW: 6,
  UNZIP: 7,
  Z_MIN_WINDOWBITS: 8,
  Z_MAX_WINDOWBITS: 15,
  Z_DEFAULT_WINDOWBITS: 15,
  Z_MIN_CHUNK: 64,
  Z_MAX_CHUNK: Infinity,
  Z_DEFAULT_CHUNK: 16384,
  Z_MIN_MEMLEVEL: 1,
  Z_MAX_MEMLEVEL: 9,
  Z_DEFAULT_MEMLEVEL: 8,
  Z_MIN_LEVEL: -1,
  Z_MAX_LEVEL: 9,
  Z_DEFAULT_LEVEL: -1
})

},

}
,
{
  "bin/nekoshim.js": [
    "HlQMn+6CRplIWO/zPKPBER/PEkKfj5VpRsywSQMazVA=",
    {
      "tar": "node_modules/tar/index.js",
      "yauzl": "node_modules/yauzl/index.js"
    }
  ],
  "node_modules/buffer-crc32/index.js": [
    "9nOtlymYR2mZaEkDDe8csLjach1JKjub7t/jbbxr4Rc=",
    {}
  ],
  "node_modules/chownr/chownr.js": [
    "h6EJqSy3uNzned17rKduccNvmLOgmW5AXedFxdsPp+s=",
    {}
  ],
  "node_modules/fd-slicer/index.js": [
    "39auA/ChIrXzl5bJCoTtocYeasO+Ss+LyEMmA9wcX/U=",
    {
      "pend": "node_modules/pend/index.js"
    }
  ],
  "node_modules/minipass/index.js": [
    "AXYSixFtOIB2lrgAygjrBP4PjSGE3C+ADZiHzezUAGo=",
    {
      "safe-buffer": "node_modules/safe-buffer/index.js",
      "yallist": "node_modules/yallist/yallist.js"
    }
  ],
  "node_modules/minizlib/constants.js": [
    "zKweDZDbztLqts5P+j6/5ZyRUqHj8ji0QqXYIuZmk+g=",
    {}
  ],
  "node_modules/minizlib/index.js": [
    "nB1sORH0sHB3HwuVwSIfqP+HqxiOeLKDcklHFiMBvGk=",
    {
      "./constants.js": "node_modules/minizlib/constants.js",
      "minipass": "node_modules/minipass/index.js"
    }
  ],
  "node_modules/mkdirp/index.js": [
    "bk9dbSa68ZTPS7tNghEARu1iFSBbQSxXp7UJfcFiPqw=",
    {}
  ],
  "node_modules/pend/index.js": [
    "S5kSkGgNkCfdeGSTxugWkANVlW2Ir7auTZe1rFo+4PU=",
    {}
  ],
  "node_modules/safe-buffer/index.js": [
    "1YryHLBRiGTQxQV0LRr3HlteHxQvTA8nNTqg9DGmFtQ=",
    {}
  ],
  "node_modules/tar/index.js": [
    "rShkRzOhrA698Po52a5kgqfF/najh4ymb9PcXu4a8ec=",
    {
      "./lib/create.js": "node_modules/tar/lib/create.js",
      "./lib/extract.js": "node_modules/tar/lib/extract.js",
      "./lib/header.js": "node_modules/tar/lib/header.js",
      "./lib/list.js": "node_modules/tar/lib/list.js",
      "./lib/pack.js": "node_modules/tar/lib/pack.js",
      "./lib/parse.js": "node_modules/tar/lib/parse.js",
      "./lib/pax.js": "node_modules/tar/lib/pax.js",
      "./lib/read-entry.js": "node_modules/tar/lib/read-entry.js",
      "./lib/replace.js": "node_modules/tar/lib/replace.js",
      "./lib/types.js": "node_modules/tar/lib/types.js",
      "./lib/unpack.js": "node_modules/tar/lib/unpack.js",
      "./lib/update.js": "node_modules/tar/lib/update.js",
      "./lib/write-entry.js": "node_modules/tar/lib/write-entry.js"
    }
  ],
  "node_modules/tar/lib/create.js": [
    "2AFNYz4lSXwSlQQf3/eWu6omuc8tXeaHDhk7oeZQsP4=",
    {
      "./high-level-opt.js": "node_modules/tar/lib/high-level-opt.js",
      "./list.js": "node_modules/tar/lib/list.js",
      "./pack.js": "node_modules/tar/lib/pack.js"
    }
  ],
  "node_modules/tar/lib/extract.js": [
    "/PWO1pM5lLwyqdlyaovRHUOu+lELk9nNqLmH97GuFYg=",
    {
      "./high-level-opt.js": "node_modules/tar/lib/high-level-opt.js",
      "./unpack.js": "node_modules/tar/lib/unpack.js"
    }
  ],
  "node_modules/tar/lib/header.js": [
    "IHzFTXFK768mHhaTa50fJLoNbqriK7aGJ03V/M/piPo=",
    {
      "./large-numbers.js": "node_modules/tar/lib/large-numbers.js",
      "./types.js": "node_modules/tar/lib/types.js"
    }
  ],
  "node_modules/tar/lib/high-level-opt.js": [
    "hmnRD7etIIKY8nGARtOEtPwLHJ5n8EdTamzJ/6pL3mg=",
    {}
  ],
  "node_modules/tar/lib/large-numbers.js": [
    "yTRNZtEc/3P3eRnCZF4s/qxMfpvD3PPosJ5DhDFK+pw=",
    {}
  ],
  "node_modules/tar/lib/list.js": [
    "2qKOuoyDrIbn3tXU28MnQI6TzoWc0B5TyIq68LcLqd4=",
    {
      "./high-level-opt.js": "node_modules/tar/lib/high-level-opt.js",
      "./parse.js": "node_modules/tar/lib/parse.js"
    }
  ],
  "node_modules/tar/lib/mkdir.js": [
    "4Qo/V2sAfYSCXwRWGyedb6H4upRdwnVV4faxt79hltM=",
    {
      "chownr": "node_modules/chownr/chownr.js",
      "mkdirp": "node_modules/mkdirp/index.js"
    }
  ],
  "node_modules/tar/lib/pack.js": [
    "56qWjByKztF5uZPT3/DJRKRxgtAKle3Xm5h2aKcXSRU=",
    {
      "./read-entry.js": "node_modules/tar/lib/read-entry.js",
      "./warn-mixin.js": "node_modules/tar/lib/warn-mixin.js",
      "./write-entry.js": "node_modules/tar/lib/write-entry.js",
      "minipass": "node_modules/minipass/index.js",
      "minizlib": "node_modules/minizlib/index.js",
      "yallist": "node_modules/yallist/yallist.js"
    }
  ],
  "node_modules/tar/lib/parse.js": [
    "rXIkOPGHC2EtkuoBZn64zUQrB8Iv95aY4me8dO1CqxA=",
    {
      "./header.js": "node_modules/tar/lib/header.js",
      "./pax.js": "node_modules/tar/lib/pax.js",
      "./read-entry.js": "node_modules/tar/lib/read-entry.js",
      "./warn-mixin.js": "node_modules/tar/lib/warn-mixin.js",
      "minizlib": "node_modules/minizlib/index.js",
      "yallist": "node_modules/yallist/yallist.js"
    }
  ],
  "node_modules/tar/lib/pax.js": [
    "qf32nrRJcz5ulBOhqaOhbRFR1PGe8tScTbGJRKCNRk0=",
    {
      "./header.js": "node_modules/tar/lib/header.js"
    }
  ],
  "node_modules/tar/lib/read-entry.js": [
    "MkWNBV+mllrIxb3rRAuosAXBArq+K5YFPfuO5n+97QE=",
    {
      "./types.js": "node_modules/tar/lib/types.js",
      "minipass": "node_modules/minipass/index.js"
    }
  ],
  "node_modules/tar/lib/replace.js": [
    "i0E8knuUHabWe79/B8YbGgCVTW4N43yTAuri+/11BNk=",
    {
      "./header.js": "node_modules/tar/lib/header.js",
      "./high-level-opt.js": "node_modules/tar/lib/high-level-opt.js",
      "./list.js": "node_modules/tar/lib/list.js",
      "./pack.js": "node_modules/tar/lib/pack.js",
      "./parse.js": "node_modules/tar/lib/parse.js"
    }
  ],
  "node_modules/tar/lib/types.js": [
    "hWgHoyC4ICUyk4ZXQMqKFVM8HT2nRBT3U8d54EJfPVM=",
    {}
  ],
  "node_modules/tar/lib/unpack.js": [
    "3cvmAZk8FK1SBh8Ge8NUCWlDUWArxUeTcVe2v8XYctY=",
    {
      "./mkdir.js": "node_modules/tar/lib/mkdir.js",
      "./parse.js": "node_modules/tar/lib/parse.js",
      "./winchars.js": "node_modules/tar/lib/winchars.js"
    }
  ],
  "node_modules/tar/lib/update.js": [
    "tNtdyqK1JWdq/oww0XjRtZl4oEl/QGtEDpp9xFy/7Kk=",
    {
      "./high-level-opt.js": "node_modules/tar/lib/high-level-opt.js",
      "./replace.js": "node_modules/tar/lib/replace.js"
    }
  ],
  "node_modules/tar/lib/warn-mixin.js": [
    "yqaFQcV/cROZTUxrrS5nciUxsPBHdi6an7jDb0v6a98=",
    {}
  ],
  "node_modules/tar/lib/winchars.js": [
    "IRCPAQdxxTPxDSNVEjbpJrDey6YtBZTsHyHy3quzDzk=",
    {}
  ],
  "node_modules/tar/lib/write-entry.js": [
    "mf8OAFaZOMvEeUCmNGD49bLJuxVBwZ7aQi9fSVkX2Xs=",
    {
      "./header.js": "node_modules/tar/lib/header.js",
      "./pax.js": "node_modules/tar/lib/pax.js",
      "./read-entry.js": "node_modules/tar/lib/read-entry.js",
      "./types.js": "node_modules/tar/lib/types.js",
      "./warn-mixin.js": "node_modules/tar/lib/warn-mixin.js",
      "./winchars.js": "node_modules/tar/lib/winchars.js",
      "minipass": "node_modules/minipass/index.js"
    }
  ],
  "node_modules/yallist/iterator.js": [
    "JsqjlmzGxjIc26PeTxJ7qk61X/zSZgNlwZJAKxkOfrA=",
    {
      "./yallist.js": "node_modules/yallist/yallist.js"
    }
  ],
  "node_modules/yallist/yallist.js": [
    "WZHbRSTQGm11s2R0USK+h24ZIkBEXRp7yB4mN1L53QM=",
    {
      "./iterator.js": "node_modules/yallist/iterator.js"
    }
  ],
  "node_modules/yauzl/index.js": [
    "ouOOVcQgZJy+7lpqXJvCMm+hMGK+DyRWlYa6Dbf8gkE=",
    {
      "buffer-crc32": "node_modules/buffer-crc32/index.js",
      "fd-slicer": "node_modules/fd-slicer/index.js"
    }
  ]
},
"bin/nekoshim.js")
