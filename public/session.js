/**
 * Shared WMS session guard (vanilla JS, no modules).
 *
 * Authentication is done on the login screen (login.html), which stores the
 * user's public data in sessionStorage under the key "wms_user" and the Bearer
 * token under "wms_token". The other protected screens call requireSession() at
 * the start of the page script and use apiFetch() for every /api request, which
 * attaches the token automatically.
 */
(function () {
  'use strict';

  var SESSION_KEY = 'wms_user';
  var TOKEN_KEY = 'wms_token';

  /**
   * Reads the current session. If there is no authenticated user, redirects to
   * the login ("/") and returns null (the caller must abort rendering).
   * @returns {{id:string,name:string,login:string,role:string}|null}
   */
  function requireSession() {
    var raw = null;
    try {
      raw = sessionStorage.getItem(SESSION_KEY);
    } catch (e) {
      raw = null;
    }

    if (!raw) {
      window.location.href = '/';
      return null;
    }

    try {
      var user = JSON.parse(raw);
      if (!user || typeof user !== 'object' || !user.id) {
        sessionStorage.removeItem(SESSION_KEY);
        window.location.href = '/';
        return null;
      }
      return user;
    } catch (e) {
      try {
        sessionStorage.removeItem(SESSION_KEY);
      } catch (e2) {
        /* sessionStorage unavailable — proceed to the redirect anyway. */
      }
      window.location.href = '/';
      return null;
    }
  }

  /** Ends the session: clears the storage and returns to login. */
  function logout() {
    clearSession();
    window.location.href = '/';
  }

  /** Removes both the user data and the token from sessionStorage. */
  function clearSession() {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch (e) {
      /* Ignore: even if it cannot clear, the redirect below protects access. */
    }
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch (e) {
      /* Ignore. */
    }
  }

  /** Reads the stored Bearer token, or null if there is none. */
  function getToken() {
    try {
      return sessionStorage.getItem(TOKEN_KEY);
    } catch (e) {
      return null;
    }
  }

  /**
   * fetch() wrapper for authenticated /api calls. Attaches
   * `Authorization: Bearer <token>` to every request and, on a 401 (missing,
   * invalid or expired token), clears the session and redirects to the login.
   * Other statuses (including 403) flow through so the caller can show them.
   * @param {string} url
   * @param {RequestInit} [options]
   * @returns {Promise<Response>}
   */
  function apiFetch(url, options) {
    var opts = options || {};
    var headers = {};
    if (opts.headers) {
      Object.keys(opts.headers).forEach(function (key) {
        headers[key] = opts.headers[key];
      });
    }

    var token = getToken();
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }

    var finalOpts = {};
    Object.keys(opts).forEach(function (key) {
      finalOpts[key] = opts[key];
    });
    finalOpts.headers = headers;

    return fetch(url, finalOpts).then(function (response) {
      if (response.status === 401) {
        clearSession();
        window.location.href = '/';
      }
      return response;
    });
  }

  window.requireSession = requireSession;
  window.logout = logout;
  window.getToken = getToken;
  window.apiFetch = apiFetch;
})();
