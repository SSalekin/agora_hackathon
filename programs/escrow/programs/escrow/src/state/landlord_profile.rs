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
