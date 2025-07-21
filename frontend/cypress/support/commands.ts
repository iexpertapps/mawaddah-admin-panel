// cypress/support/commands.ts

// This export is necessary to declare this file as a module.
// This allows for global type augmentations.
export {};

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to log in a user via API request.
       * This is faster and more reliable than logging in through the UI.
       * @example cy.loginAs('test@example.com', 'password123')
       */
      loginAs(email: string, password: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add('loginAs', (email, password) => {
  cy.request({
    method: 'POST',
    // It's a good practice to use Cypress environment variables for URLs.
    url: `${Cypress.env('apiUrl') || 'http://localhost:8000'}/api/auth/login/`,
    body: { email, password },
  }).then((response) => {
    // NOTE: This assumes your API returns a token and user object.
    // Adjust the property names if your API response is different.
    const { token, user } = response.body;

    // Set token and user data in localStorage to simulate a logged-in session.
    cy.window().then((win) => {
      win.localStorage.setItem('authToken', token);
      win.localStorage.setItem('user', JSON.stringify(user));
    });
  });
}); 