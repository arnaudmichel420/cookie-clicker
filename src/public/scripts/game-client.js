(function attachGameClient(windowObject) {
  function createAuthorizationHeaders() {
    const token = windowObject.authClient.getToken();

    if (!token) {
      return null;
    }

    return {
      Authorization: `Bearer ${token}`
    };
  }

  async function requestWithToken(url, options = {}) {
    const headers = createAuthorizationHeaders();

    if (!headers) {
      return {
        data: {
          error: windowObject.GAME_MESSAGES.missingSession
        },
        response: {
          ok: false
        }
      };
    }

    return windowObject.authClient.requestJson(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    });
  }

  function getState() {
    return requestWithToken(windowObject.GAME_ROUTES.state);
  }

  function clickCookie() {
    return requestWithToken(windowObject.GAME_ROUTES.click, {
      method: "POST"
    });
  }

  windowObject.gameClient = {
    clickCookie,
    getState
  };
})(window);
