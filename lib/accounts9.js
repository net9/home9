var OAuth2 = require('oauth').OAuth2;
var config = require('../config');

function Accounts9() {
  this._accounts9 = new OAuth2(
    config.oauth.clientId,
    config.oauth.clientSecret,
    config.oauth.base,
    config.oauth.authorizePath,
    config.oauth.accessTokenPath
  );
};
module.exports = new Accounts9();

/*
 * Get Authorize Url
 *
 *
 */
Accounts9.prototype.getAuthorizeUrl = function(callbackUrl) {
  return this._accounts9.getAuthorizeUrl({
    redirect_uri: callbackUrl,
  });
};

/*
 * Get Access Token
 *
 * callback(err, access_token, refresh_token)
 *
 */
Accounts9.prototype.getOAuthAccessToken = function(code, callbackUrl, callback) {
  var that = this;
  var params = {
    redirect_uri: callbackUrl,
  };
  this._accounts9.getOAuthAccessToken(code, params, function(err, accessToken, refreshToken) {
    that._accessToken = accessToken;
    that._refreshToken = refreshToken;
    callback(err, accessToken, refreshToken);
  });
};

/*
 * Get Net9 User Information
 *
 * callback(err, user)
 *
 */
Accounts9.prototype.getUser = function(callback) {
  this._accounts9.get(
    config.oauth.base + config.oauth.userPath,
    this._accessToken,
    function(err, result, response) {
      if (err) {
        return callback(err);
      }
      result = JSON.parse(result);
      if (result.err === null) {
        var user = result.user;
        callback(null, user);
      } else {
        callback('fail_to_get_user');
      }
    }
  );
};
