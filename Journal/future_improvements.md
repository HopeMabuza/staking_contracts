# Future Improvements

## Frontend Overhaul
- Redesign the UI to personal preference (layout, colours, typography)
- Cleaner component structure — one clear action per section
- Better feedback on tx states (pending, success, failed) with toasts or inline messages
- Mobile-friendly layout

## New Feature: Emergency Withdraw & Claim Button
- Add an `emergencyWithdrawAndClaim` flow in the frontend
- Currently `emergencyWithdraw` forfeits rewards — consider adding a contract-level `emergencyWithdrawAndClaim` function that allows claiming any rewards earned before the cooldown, then returning the NFT
- Button should be clearly labelled and warn the user about reward forfeiture if applicable

## Easier Frontend Approach
- Replace current component flow with a single-page step-by-step wizard: Mint → Stake → Wait → Claim/Withdraw
- Show the user exactly what step they are on and what to do next
- Display live cooldown countdown and reward accumulation without needing to refresh
- Reduce the number of inputs the user has to fill in manually (e.g. auto-detect staked NFT IDs)
