// Add Cypress custom command type for loginAs
/// <reference types="cypress" />

// NOTE: The actual implementation of cy.loginAs should be in cypress/support/commands.js or commands.ts

declare module 'cypress' {
  interface Chainable {
    loginAs(email: string, password: string): Chainable;
  }
}

describe('Admin Wallet Flow', () => {
  before(() => {
    // Custom command or direct API to login as admin
    cy.loginAs('admin@test.com', 'testpass');
  });

  it('can filter withdrawal requests by status', () => {
    cy.visit('/admin/wallet');
    cy.get('select').select('Pending');
    cy.get('table').contains('Pending');
    cy.get('select').select('Approved');
    cy.get('table').contains('Approved');
  });

  it('can approve a pending withdrawal', () => {
    cy.visit('/admin/wallet');
    cy.get('table').contains('Approve').click();
    cy.contains('Are you sure?');
    cy.contains('Confirm').click();
    cy.contains('Request processed successfully.');
    cy.get('table').contains('Approved');
  });

  it('can reject a pending withdrawal', () => {
    cy.visit('/admin/wallet');
    cy.get('table').contains('Reject').click();
    cy.contains('Are you sure?');
    cy.contains('Confirm').click();
    cy.contains('Request processed successfully.');
    cy.get('table').contains('Rejected');
  });
}); 