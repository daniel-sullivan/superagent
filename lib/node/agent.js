'use strict';
/**
 * Module dependencies.
 */

var CookieJar = require('cookiejar').CookieJar;

var CookieAccess = require('cookiejar').CookieAccessInfo;

var parse = require('url').parse;

var methods = require('methods');

var request = require('./request');

var AgentBase = require('../agent-base');
/**
 * Expose `Agent`.
 */

module.exports = Agent;
/**
 * Initialize a new `Agent`.
 *
 * @api public
 */

function Agent(options) {
  if (!(this instanceof Agent)) {
    return new Agent(options);
  }

  AgentBase.call(this);
  this.jar = new CookieJar();

  if (options) {
    if (options.ca) {
      this.ca(options.ca);
    }

    if (options.key) {
      this.key(options.key);
    }

    if (options.pfx) {
      this.pfx(options.pfx);
    }

    if (options.cert) {
      this.cert(options.cert);
    }
  }
}

Agent.prototype = Object.create(AgentBase.prototype);
/**
 * Save the cookies in the given `res` to
 * the agent's cookie jar for persistence.
 *
 * @param {Response} res
 * @api private
 */

Agent.prototype._saveCookies = function(res) {
  var cookies = res.headers['set-cookie'];
  if (cookies) this.jar.setCookies(cookies);
};
/**
 * Attach cookies when available to the given `req`.
 *
 * @param {Request} req
 * @api private
 */

Agent.prototype._attachCookies = function(req) {
  var url = parse(req.url);
  var access = CookieAccess(
    url.hostname,
    url.pathname,
    url.protocol == 'https:'
  );
  var cookies = this.jar.getCookies(access).toValueString();
  req.cookies = cookies;
};

methods.forEach(function(name) {
  var method = name.toUpperCase();

  Agent.prototype[name] = function(url, fn) {
    var req = new request.Request(method, url);
    req.on('response', this._saveCookies.bind(this));
    req.on('redirect', this._saveCookies.bind(this));
    req.on('redirect', this._attachCookies.bind(this, req));

    this._attachCookies(req);

    this._setDefaults(req);

    if (fn) {
      req.end(fn);
    }

    return req;
  };
});
Agent.prototype.del = Agent.prototype.delete;
