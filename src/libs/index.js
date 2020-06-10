'use strict';

var {onAndSyncApis, otherApis, noPromiseApis} = require('./native-apis');
var {merge} = require('../utils/index');

var RequestQueue = {
  MAX_REQUEST: 5,
  queue: [],
  request: function request(options) {
    this.push(options); // 返回request task

    return this.run();
  },
  push: function push(options) {
    this.queue.push(options);
  },
  run: function run() {
    var _this = this;

    if (!this.queue.length) {
      return;
    }

    if (this.queue.length <= this.MAX_REQUEST) {
      var options = this.queue.shift();
      var completeFn = options.complete;

      options.complete = function () {
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        completeFn && completeFn.apply(options, args);

        _this.run();
      };

      return wx.request(options);
    }
  }
}

function request(options, callback) {
  options = options || {};
  callback = callback || function() {};

  if (typeof options === 'string') {
    options = {
      url: options
    };
  }

  var originSuccess = options['success'];
  var originFail = options['fail'];
  var originComplete = options['complete'];
  var requestTask;
  var p = new Promise(function (resolve, reject) {
    options['success'] = function (res) {
      originSuccess && originSuccess(res);
      callback(res.data || res);
      resolve(res.data || res);
    };

    options['fail'] = function (res) {
      originFail && originFail(res);
      reject(res.data || res);
    };

    options['complete'] = function (res) {
      originComplete && originComplete(res.data || res);
    };

    requestTask = RequestQueue.request(options);
  });

  p.abort = function (cb) {
    cb && cb();

    if (requestTask) {
      requestTask.abort();
    }

    return p;
  };

  return p;
}

/**
 * Promisify a callback function
 * @param  {Function} fn     callback function
 * @param  {Object}   caller caller
 * @param  {String}   type   weapp-style|error-first, default to weapp-style
 * @return {Function}        promisified function
 */
function processApis(weapp$) {
  var weApis = Object.assign({}, onAndSyncApis, noPromiseApis, otherApis);

  Object.keys(weApis).forEach(function (key) {
    if (!(key in wx)) {
      weapp$[key] = function () {
        console.warn("\u5FAE\u4FE1\u5C0F\u7A0B\u5E8F\u6682\u4E0D\u652F\u6301 ".concat(key));
      };

      return;
    }

    if (!onAndSyncApis[key] && !noPromiseApis[key]) {
      weapp$[key] = function (options) {
        for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
          args[_key2 - 1] = arguments[_key2];
        }

        options = options || {};
        var task = null;

        if (key === 'showToast' || key === 'showModal' || key === 'showLoading') {
          options.mask = true;
        }

        if (key === 'showToast') {
          options.icon = 'none';
        }

        var obj = Object.assign({}, options);

        if (typeof options === 'string') {
          if (args.length) {
            var _wx;

            return (_wx = wx)[key].apply(_wx, [options].concat(args));
          }

          return wx[key](options);
        }

        var p = new Promise(function (resolve, reject) {
          ['fail', 'success', 'complete'].forEach(function (k) {
            obj[k] = function (res) {
              options[k] && options[k](res);

              if (k === 'success') {
                if (key === 'connectSocket') {
                  resolve(Promise.resolve().then(function () {
                    return Object.assign(task, res);
                  }));
                } else {
                  resolve(res);
                }
              } else if (k === 'fail') {
                reject(res);
              }
            };
          });

          if (args.length) {
            var _wx2;

            task = (_wx2 = wx)[key].apply(_wx2, [obj].concat(args));
          } else {
            task = wx[key](obj);
          }
        });


        if (key === 'uploadFile' || key === 'downloadFile') {
          p.progress = function (cb) {
            if (task) {
              task.onProgressUpdate(cb);
            }

            return p;
          };

          p.abort = function (cb) {
            cb && cb();

            if (task) {
              task.abort();
            }

            return p;
          };
        }

        return p;
      };
    } else {
      weapp$[key] = function () {
        for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
          args[_key3] = arguments[_key3];
        }

        var newArgs = args.concat();

        return wx[key].apply(wx, newArgs);
      };
    }
  });

  return weapp$;
}

var weapp = {
  addInterceptor: function(requestParams = function () {
    return {};
  }, callback = function () {

  }) {
    weapp.requestParams = requestParams();
    weapp.callback = callback;
  },
  request: function (opts) {
    const {requestParams, callback} = weapp;

    const prefix = requestParams?.prefix;
    opts = merge({}, requestParams, opts);

    if (prefix && !/^https*:\/\/.+/g.test(opts.url)) {
      opts.url = `${prefix}${opts.url}`;
      delete opts?.prefix;
    }

    return request(opts, callback);
  },
};

processApis(weapp)
module.exports = weapp;
