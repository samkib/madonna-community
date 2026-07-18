# TODO

- [x] Update `src/pages/Payments.jsx`
  - [ ] Remove `useNavigate` import and `const navigate = useNavigate()`.
  - [ ] In `submitPayment()`, delete conversation/messages logic from `let conversationId = payment.conversation_id` through the `messages` insert (including `transactionCode`).
  - [ ] Replace `payments` update payload to remove `conversation_id` while keeping `amount_paid`, `mpesa_statement`, `status: 'pending'`, `submitted_at`.
  - [ ] Replace landlady-only notification logic with notification to roles: landlady, chairperson, caretaker.
  - [ ] Use `user.fullName` (not `user.full_name`) in notification body.
- [x] Update `src/context/AuthContext.jsx`
  - [x] Set `canManagePayments` to include `caretaker`.
- [x] Run build/lint/tests to ensure no regressions.




