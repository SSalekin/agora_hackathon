use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Config {
    pub moderator: Pubkey,
    pub bump: u8,
}
