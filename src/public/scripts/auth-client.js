(function attachAuthClient(windowObject) {
  const TOKEN_KEY = "auth_token";

  async function requestJson(url, options) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));

    return { response, data };
  }

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  }

  async function restoreSession() {
    const token = getToken();

    if (!token) {
      return {
        clearToken: false,
        isAuthenticated: false,
        user: null
      };
    }

    const { response, data } = await requestJson("/session", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok || !data.isAuthenticated) {
      if (data.clearToken) {
        clearToken();
      }

      return {
        clearToken: Boolean(data.clearToken),
        isAuthenticated: false,
        user: null
      };
    }

    return data;
  }

  async function register(payload) {
    return requestJson("/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
  }

  async function login(payload) {
    return requestJson("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
  }

  async function logout() {
    const token = getToken();

    const result = await requestJson("/logout", {
      method: "POST",
      headers: token
        ? {
            Authorization: `Bearer ${token}`
          }
        : {}
    });

    clearToken();

    return result;
  }

  windowObject.authClient = {
    clearToken,
    getToken,
    login,
    logout,
    register,
    requestJson,
    restoreSession,
    setToken
  };
})(window);
