use anchor_lang::prelude::*;

use crate::{Config, ConfigInitialized, EscrowError, ANCHOR_DISCRIMINATOR, CONFIG_SEED};

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        payer = payer,
        space = ANCHOR_DISCRIMINATOR + Config::INIT_SPACE,
        seeds = [CONFIG_SEED],
        bump,
    )]
    pub config: Account<'info, Config>,

    pub system_program: Program<'info, System>,
}

pub fn handle_initialize_config(
    context: Context<InitializeConfig>,
    moderator: Pubkey,
) -> Result<()> {
    require!(
        moderator != Pubkey::default(),
        EscrowError::InvalidModerator
    );

    context.accounts.config.set_inner(Config {
        moderator,
        bump: context.bumps.config,
    });

    emit!(ConfigInitialized { moderator });
    Ok(())
}
