describe('Recipient Wallet Flow', () => {
  before(() => {
    // Custom command or direct API to login as recipient
    cy.loginAs('recipient@test.com', 'testpass');
  });

  it('shows wallet balance', () => {
    cy.visit('/wallet');
    cy.contains('Current Wallet Balance');
    cy.get('[class*=text-green-600]').should('exist');
  });

  it('shows transaction history', () => {
    cy.visit('/wallet');
    cy.contains('Transaction History');
    cy.get('table').contains('Type');
  });

  it('can create a withdrawal request', () => {
    cy.visit('/wallet');
    cy.contains('Request Withdrawal');
    cy.get('input[type=number]').type('100');
    cy.get('select').select('Bank');
    cy.get('textarea').type('Test account details');
    cy.contains('Request Withdrawal').click();
    cy.contains('Withdrawal request submitted successfully.');
  });

  it('shows withdrawal request status', () => {
    cy.visit('/wallet');
    cy.contains('Withdrawal Requests');
    cy.get('table').contains('Pending');
  });
}); 