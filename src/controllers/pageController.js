const { PAGE_VIEWS } = require("../constants/viewData");

function renderPage(pageName) {
  return (_req, res) => {
    res.render(`pages/${pageName}`, PAGE_VIEWS[pageName]);
  };
}

module.exports = {
  renderPage
};
