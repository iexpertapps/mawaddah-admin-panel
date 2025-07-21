// cypress.config.ts

/** @type {import('cypress').CypressConfig} */
const config = {
  e2e: {
    baseUrl: 'http://localhost:5177', // Frontend dev server
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,ts}',
  },
  env: {
    apiUrl: 'http://localhost:8000', // Backend API
  },
};

module.exports = config; 