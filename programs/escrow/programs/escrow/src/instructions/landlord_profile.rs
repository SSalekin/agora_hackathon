use anchor_lang::{prelude::*, system_program};

use crate::{
    EscrowError, LandlordProfile, LandlordProfileInitialized, LandlordStaked, LandlordUnstaked,
    ANCHOR_DISCRIMINATOR, LANDLORD_PROFILE_SEED,
};

#[derive(Accounts)]
pub struct InitializeLandlordProfile<'info> {
    #[account(mut)]
    pub landlord: Signer<'info>,

    #[account(
        init,
        payer = landlord,
        space = ANCHOR_DISCRIMINATOR + LandlordProfile::INIT_SPACE,
        seeds = [LANDLORD_PROFILE_SEED, landlord.key().as_ref()],
        bump,
    )]
    pub landlord_profile: Account<'info, LandlordProfile>,

    pub system_program: Program<'info, System>,
}

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

    emit!(LandlordProfileInitialized {
        landlord: ctx.accounts.landlord.key(),
        landlord_profile: profile.key(),
    });

    Ok(())
}

#[derive(Accounts)]
pub struct StakeLandlord<'info> {
    #[account(mut)]
    pub landlord: Signer<'info>,

    #[account(
        mut,
        seeds = [LANDLORD_PROFILE_SEED, landlord.key().as_ref()],
        bump = landlord_profile.bump,
        has_one = landlord,
    )]
    pub landlord_profile: Account<'info, LandlordProfile>,

    pub system_program: Program<'info, System>,
}

pub fn handle_stake_landlord(ctx: Context<StakeLandlord>, amount: u64) -> Result<()> {
    require!(amount > 0, EscrowError::InvalidAmount);

    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.key(),
            system_program::Transfer {
                from: ctx.accounts.landlord.to_account_info(),
                to: ctx.accounts.landlord_profile.to_account_info(),
            },
        ),
        amount,
    )?;

    let profile = &mut ctx.accounts.landlord_profile;
    profile.total_staked_lamports += amount;
    profile.active_stake_lamports += amount;

    emit!(LandlordStaked {
        landlord: ctx.accounts.landlord.key(),
        landlord_profile: profile.key(),
        amount,
        total_staked: profile.total_staked_lamports,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct UnstakeLandlord<'info> {
    #[account(mut)]
    pub landlord: Signer<'info>,

    #[account(
        mut,
        seeds = [LANDLORD_PROFILE_SEED, landlord.key().as_ref()],
        bump = landlord_profile.bump,
        has_one = landlord,
    )]
    pub landlord_profile: Account<'info, LandlordProfile>,

    pub system_program: Program<'info, System>,
}

pub fn handle_unstake_landlord(ctx: Context<UnstakeLandlord>, amount: u64) -> Result<()> {
    require!(amount > 0, EscrowError::InvalidAmount);

    let profile = &mut ctx.accounts.landlord_profile;
    require!(
        profile.active_stake_lamports >= amount,
        EscrowError::InsufficientStake
    );

    **profile
        .to_account_info()
        .try_borrow_mut_lamports()? -= amount;
    **ctx
        .accounts
        .landlord
        .to_account_info()
        .try_borrow_mut_lamports()? += amount;

    profile.total_staked_lamports -= amount;
    profile.active_stake_lamports -= amount;

    emit!(LandlordUnstaked {
        landlord: ctx.accounts.landlord.key(),
        landlord_profile: profile.key(),
        amount,
        total_staked: profile.total_staked_lamports,
    });

    Ok(())
}
