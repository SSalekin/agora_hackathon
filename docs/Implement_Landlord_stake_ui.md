Yes. It should be visible to **all three roles**, but with different UI depth.

| Role      | What they should see                                                  |
| --------- | --------------------------------------------------------------------- |
| Tenant    | landlord stake, reputation, dispute history, “verified/staked” badge  |
| Landlord  | own stake balance, stake/unstake buttons, active locked stake         |
| Moderator | stake, escrow history, dispute count, possible slash/penalty controls |

Best structure:

```txt
components/landlord/StakeBadge.tsx
components/landlord/StakeSummaryCard.tsx
components/landlord/LandlordReputationPanel.tsx
components/moderator/LandlordRiskPanel.tsx
```

Where to show it:

```txt
Tenant:
- listing card
- listing details page
- escrow confirmation page

Landlord:
- landlord dashboard
- listing management page
- escrow/agreement page

Moderator:
- dispute review page
- landlord profile page
```

Brutal truth: hiding landlord stake inside a landlord-only dashboard makes the feature nearly useless. The whole point is **tenant trust** and **moderator judgment**.

The clean model is:

```txt
Public read:
- total_staked
- active_stake
- completed_rentals
- disputes_lost
- verification badge

Private/action UI:
- stake button → landlord only
- unstake button → landlord only
- slash/penalty action → moderator only
```

So yes: **visible to tenants, moderators, and the landlord**, but **only editable by the landlord**, and **only punishable/actionable by moderators**.
