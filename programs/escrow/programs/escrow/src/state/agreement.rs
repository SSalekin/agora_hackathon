use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Eq, InitSpace, PartialEq)]
pub enum AgreementState {
    AwaitingLandlordApproval,
    AwaitingFunding,
    Funded,
    Disputed,
    Released,
    Refunded,
    Cancelled,
}

#[account]
#[derive(InitSpace)]
pub struct Agreement {
    pub tenant: Pubkey,
    pub landlord: Pubkey,
    pub moderator: Pubkey,
    pub listing_hash: [u8; 32],
    pub deposit_lamports: u64,
    pub inspection_deadline: i64,
    pub created_at: i64,
    pub funded_at: i64,
    pub state: AgreementState,
    pub dispute_reason_code: u8,
    pub evidence_hash: [u8; 32],
    pub bump: u8,
}
