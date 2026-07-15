# TODO

- [ ] Update `src/pages/Payments.jsx` staff actions:
  - [ ] Show staff buttons for all payment statuses (remove `payment.status === 'pending'` condition)
  - [ ] Replace Approve label with `Mark as paid`
  - [ ] Change wrapper to `flex flex-wrap gap-3`
  - [ ] Add `Set pending` button to revert status to pending and clear verification fields
- [ ] Remove unused discussion state + `{discussionOpen && (...)}` block from `Payments.jsx`
- [ ] Run `npm run build` to ensure no compile/runtime errors

