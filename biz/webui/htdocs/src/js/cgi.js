var $ = require('jquery');
var util = require('./util');

var auth = util.getQuery().authorization;

function createCgi(url, settings) {
  var self = this;
  if (typeof url == 'string') {
    url = { url: url };
  }
  settings = $.extend({ dataType: 'json' }, settings, url);
  url = url.url;
  var queue = [];
  var jqXhr;

  function cgiFn(data, callback, options) {
    var opts = { url: typeof url == 'function' ? url() : url };
    if (typeof data == 'function') {
      options = callback;
      callback = data;
      data = null;
    } else {
      opts.data = data;
    }

    options = $.extend(true, {}, settings, options, opts);
    if (jqXhr) {
      var mode = options.mode;
      if (mode == 'ignore') {
        return;
      }
      if (mode == 'cancel') {
        jqXhr.abort();
      } else if (mode == 'chain') {
        return queue.push([data, callback, options]);
      }
    }

    var execCallback = function (data, xhr, em) {
      jqXhr = null;
      callback && callback.call(this, data, xhr, em);
      var args = queue.shift();
      args && cgiFn.apply(self, args);
    };
    options.success = function (data, statusText, xhr) {
      execCallback.call(this, data, xhr);
    };
    options.error = function (xhr, em) {
      if (xhr && em) {
        xhr.errMsg = em;
      }
      execCallback.call(this, false, xhr, em);
    };
    opts = options;
    if (auth && typeof opts.url === 'string') {
      opts = $.extend({}, opts);
      opts.url += (opts.url.indexOf('?') === -1 ? '?' : '&') + 'authorization=' + auth;
    }
    return (jqXhr = $.ajax(opts));
  }

  return cgiFn;
}

function create(obj, settings) {
  var cgi = {};
  Object.keys(obj).forEach(function (name) {
    cgi[name] = createCgi(obj[name], settings);
  });
  return cgi;
}

module.exports = create;
module.exports.createCgi = createCgi;
