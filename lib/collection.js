
var debug = require('debug');
var EventEmitter = require('events').EventEmitter;

var Collection = function (monk, name) {

  var self = this;

  self.monk = monk;
  self.name = name;
  self.debug = debug('monk2:' + name);

  self.connected = false;
  self._colInstance = null;

  self.monk._db(function (db) {
    self._colInstance = db.collection(self.name);
    self.connected = true;
    self.emit('connected');
  });

}

Collection.prototype = Object.create(EventEmitter.prototype);

Collection.prototype._col = function (cb) {

  var self = this;

  if (self.connected) {
    cb(self._colInstance);
  } else {
    self.once('connected', function () {
      cb(self._colInstance);
    });
  }

};

Collection.prototype._cb = function (cb) {
  var self = this;

  var fn = cb || function (err) {
    if (err) { self.emit('error', err); }
  };

  return function (err, res) {
    self.debug('reply ' + (err?'ERR':'OK'));
    fn(err, res);
  };
};

Collection.prototype._opts = function (opts) {

  opts = opts || {};

  if (!('safe' in opts)) {
    opts.safe = true;
  }

  return opts;
};

Collection.prototype._args = function (opts, cb, fn) {

  if (typeof opts === 'function') {
    cb = this._cb(opts);
    opts = this._opts({});
  } else {
    cb = this._cb(cb);
    opts = this._opts(opts);
  }

  this._col(function (col) {
    fn(col, opts, cb);
  });
}

Collection.prototype.id = function (hexString) {
  return this.monk.id(hexString);
}

Collection.prototype.findById = function (id, opts, cb) {
  this.debug('findById(%s)', id.toString());
  this._findOne({ _id: this.id(id) }, opts, cb);
};

Collection.prototype.findOne = function (query, opts, cb) {
  this.debug('findOne(%o)', query);
  this._findOne(query, opts, cb);
};

Collection.prototype._findOne = function (query, opts, cb) {
  this._args(opts, cb, function (col, opts, cb) {
    col.find(query, null, opts).limit(1).toArray(function (err, docs) {
      if (err) {
        cb(err);
      } else {
        cb(null, docs.length > 0 ? docs[0] : null);
      }
    });
  });
}

Collection.prototype.find = function (query, opts, cb) {
  this.debug('find(%o)', query);
  this._args(opts, cb, function (col, opts, cb) {
    col.find(query, null, opts).toArray(cb);
  });
};

Collection.prototype.count = function (query, opts, cb) {
  this.debug('count(%o)', query);
  this._args(opts, cb, function (col, opts, cb) {
    col.count(query, opts, cb);
  });
};

Collection.prototype.insert = function (obj, opts, cb) {
  this.debug('insert(%o)', obj);
  this._args(opts, cb, function (col, opts, cb) {
    col.insert(obj, opts, function (err, docs) {
      if (err) {
        cb(err);
      } else {
        if (Array.isArray(obj)) {
          cb(null, docs);
        } else {
          cb(null, docs[0] || null);
        }
      }
    });
  });
};

Collection.prototype.update = function (search, update, opts, cb) {
  this.debug('update(%o, %o)', search, update);
  this._args(opts, cb, function (col, opts, cb) {
    col.update(search, update, opts, cb);
  });
};

module.exports = exports = Collection;
