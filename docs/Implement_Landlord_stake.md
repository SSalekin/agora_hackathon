Your current repo already has Solana escrow under `programs/escrow`, and README already advertises “Landlord stake: 500 USDC” as a reputation signal, but the on-chain `Agreement` state currently only tracks tenant, landlord, moderator, deposit, deadline, dispute data, and agreement state — no landlord stake field yet. ([GitHub][1]) ([GitHub][2])

## Best implementation

Do **not** mix landlord stake into each rental deposit escrow. That is messy.

Add a separate on-chain `LandlordProfile` PDA:

```txt
LandlordProfile PDA
- landlord: Pubkey
- total_staked_lamports: u64
- active_stake_lamports: u64
- completed_rentals: u32
- disputes_lost: u32
- bump: u8
```

Then your app shows:

```txt
Landlord stake: 500 USDC/SOL equivalent
```

from this profile.

## Step-by-step

### 1. Add new state file

Create:

```txt
programs/escrow/programs/escrow/src/state/landlord_profile.rs
```

```rust
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct LandlordProfile {
    pub landlord: Pubkey,
    pub total_staked_lamports: u64,
    pub active_stake_lamports: u64,
    pub completed_rentals: u32,
    pub disputes_lost: u32,
    pub bump: u8,
}
```

Update:

```txt
programs/escrow/programs/escrow/src/state/mod.rs
```

```rust
mod agreement;
mod config;
mod landlord_profile;

pub use agreement::*;
pub use config::*;
pub use landlord_profile::*;
```

### 2. Add instructions

In:

```txt
programs/escrow/programs/escrow/src/instructions/agreement.rs
```

or preferably a new file:

```txt
programs/escrow/programs/escrow/src/instructions/landlord_profile.rs
```

Add three handlers:

```rust
initialize_landlord_profile()
stake_landlord()
unstake_landlord()
```

For hackathon demo, keep it SOL-based first. USDC staking requires SPL token accounts and makes the implementation longer.

### 3. PDA seed design

Use:

```rust
seeds = [b"landlord-profile", landlord.key().as_ref()]
```

This gives one profile per landlord wallet.

### 4. Add `initialize_landlord_profile`

Purpose: creates the landlord reputation/stake account.

```rust
#[derive(Accounts)]
pub struct InitializeLandlordProfile<'info> {
    #[account(mut)]
    pub landlord: Signer<'info>,

    #[account(
        init,
        payer = landlord,
        space = 8 + LandlordProfile::INIT_SPACE,
        seeds = [b"landlord-profile", landlord.key().as_ref()],
        bump
    )]
    pub landlord_profile: Account<'info, LandlordProfile>,

    pub system_program: Program<'info, System>,
}
```

Handler:

```rust
pub fn handle_initialize_landlord_profile(
    ctx: Context<InitializeLandlordProfile>,
) -> Result<()> {
    let profile = &mut ctx.accounts.landlord_profile;

    profile.landlord = ctx.accounts.landlord.key();
    profile.total_staked_lamports = 0;
    profile.active_stake_lamports = 0;
    profile.completed_rentals = 0;
    profile.disputes_lost = 0;
    profile.bump = ctx.bumps.landlord_profile;

    Ok(())
}
```

### 5. Add `stake_landlord`

Purpose: landlord locks money into their profile PDA.

```rust
pub fn handle_stake_landlord(
    ctx: Context<StakeLandlord>,
    amount: u64,
) -> Result<()> {
    require!(amount > 0, EscrowError::InvalidAmount);

    anchor_lang::system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.landlord.to_account_info(),
                to: ctx.accounts.landlord_profile.to_account_info(),
            },
        ),
        amount,
    )?;

    let profile = &mut ctx.accounts.landlord_profile;
    profile.total_staked_lamports += amount;
    profile.active_stake_lamports += amount;

    Ok(())
}
```

### 6. Add `unstake_landlord`

For demo, allow unstaking only when landlord has no active escrow.

Simpler hackathon version:

```rust
pub fn handle_unstake_landlord(
    ctx: Context<UnstakeLandlord>,
    amount: u64,
) -> Result<()> {
    let profile = &mut ctx.accounts.landlord_profile;

    require!(amount > 0, EscrowError::InvalidAmount);
    require!(
        profile.active_stake_lamports >= amount,
        EscrowError::InsufficientStake
    );

    **profile.to_account_info().try_borrow_mut_lamports()? -= amount;
    **ctx.accounts.landlord.to_account_info().try_borrow_mut_lamports()? += amount;

    profile.total_staked_lamports -= amount;
    profile.active_stake_lamports -= amount;

    Ok(())
}
```

### 7. Add error codes

In:

```txt
programs/escrow/programs/escrow/src/error.rs
```

Add:

```rust
#[msg("Amount must be greater than zero.")]
InvalidAmount,

#[msg("Landlord has insufficient stake.")]
InsufficientStake,

#[msg("Landlord stake is below the required minimum.")]
InsufficientLandlordStake,
```

### 8. Update `lib.rs`

Your current `lib.rs` exposes escrow instructions like `create_agreement`, `fund_agreement`, `resolve_dispute`, etc. Add:

```rust
pub fn initialize_landlord_profile(
    ctx: Context<InitializeLandlordProfile>,
) -> Result<()> {
    instructions::handle_initialize_landlord_profile(ctx)
}

pub fn stake_landlord(
    ctx: Context<StakeLandlord>,
    amount: u64,
) -> Result<()> {
    instructions::handle_stake_landlord(ctx, amount)
}

pub fn unstake_landlord(
    ctx: Context<UnstakeLandlord>,
    amount: u64,
) -> Result<()> {
    instructions::handle_unstake_landlord(ctx, amount)
}
```

Your program already uses this handler-forwarding style. ([GitHub][3])

### 9. Require stake before landlord can approve agreement

Your current flow has `AwaitingLandlordApproval`, then funding, then dispute/release/refund states. ([GitHub][2])

Modify `approve_agreement` so it requires landlord profile:

```rust
require!(
    landlord_profile.active_stake_lamports >= MIN_LANDLORD_STAKE_LAMPORTS,
    EscrowError::InsufficientLandlordStake
);
```

Add constant:

```rust
pub const MIN_LANDLORD_STAKE_LAMPORTS: u64 = 500_000_000; // 0.5 SOL demo stake
```

Brutal truth: don’t claim “500 USDC” unless you actually implement SPL token staking. For hackathon, call it “500 test credits” or “0.5 devnet SOL stake.” Fake USDC will look amateur if judges ask.

### 10. Update frontend

In `apps/nestfind`, you already have `idl`, `hooks`, `components`, and `lib` folders. ([GitHub][4])

Add a landlord dashboard:

```txt
apps/nestfind/app/landlord/page.tsx
```

Show:

```txt
Connect wallet
Initialize landlord profile
Stake devnet SOL
Current stake
Completed rentals
Disputes lost
```

Add a component:

```txt
apps/nestfind/components/landlord-stake-card.tsx
```

Display on listing cards:

```txt
Landlord stake: 0.5 SOL
Completed rentals: 37
Disputes lost: 0
```

### 11. Regenerate IDL

From repo root:

```bash
pnpm run anchor:build
```

Then copy generated IDL into:

```txt
apps/nestfind/idl/
```

### 12. Add tests

In:

```txt
programs/escrow/tests/bankrun.test.ts
```

Test these cases:

```txt
1. Landlord initializes profile
2. Landlord stakes SOL
3. Agreement approval fails if stake too low
4. Agreement approval succeeds if stake high enough
5. Landlord can unstake unused stake
6. Optional: landlord loses dispute -> disputes_lost increments
```

The repo already has escrow tests under `programs/escrow/tests`, so extend those instead of creating a separate test framework. ([GitHub][5])

## Recommended hackathon version

Implement only this:

```txt
LandlordProfile PDA
initialize_landlord_profile()
stake_landlord()
unstake_landlord()
require minimum stake before approve_agreement()
show stake in listing UI
```

Do **not** implement slashing yet. Mark it as TODO.

[1]: https://github.com/SSalekin/agora_hackathon "GitHub - SSalekin/agora_hackathon · GitHub"
[2]: https://raw.githubusercontent.com/SSalekin/agora_hackathon/main/programs/escrow/programs/escrow/src/state/agreement.rs "raw.githubusercontent.com"
[3]: https://raw.githubusercontent.com/SSalekin/agora_hackathon/main/programs/escrow/programs/escrow/src/lib.rs "raw.githubusercontent.com"
[4]: https://github.com/SSalekin/agora_hackathon/tree/main/apps/nestfind "agora_hackathon/apps/nestfind at main · SSalekin/agora_hackathon · GitHub"
[5]: https://github.com/SSalekin/agora_hackathon/tree/main/programs/escrow/tests "agora_hackathon/programs/escrow/tests at main · SSalekin/agora_hackathon · GitHub"
