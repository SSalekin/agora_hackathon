use anchor_lang::prelude::*;

#[event]
pub struct ConfigInitialized {
    pub moderator: Pubkey,
}

#[event]
pub struct AgreementCreated {
    pub agreement: Pubkey,
    pub tenant: Pubkey,
    pub landlord: Pubkey,
    pub listing_hash: [u8; 32],
    pub deposit_lamports: u64,
    pub inspection_deadline: i64,
}

#[event]
pub struct LandlordApproved {
    pub agreement: Pubkey,
    pub landlord: Pubkey,
}

#[event]
pub struct DepositFunded {
    pub agreement: Pubkey,
    pub tenant: Pubkey,
    pub deposit_lamports: u64,
    pub funded_at: i64,
}

#[event]
pub struct DisputeOpened {
    pub agreement: Pubkey,
    pub opened_by: Pubkey,
    pub reason_code: u8,
    pub evidence_hash: [u8; 32],
}

#[event]
pub struct DepositReleased {
    pub agreement: Pubkey,
    pub landlord: Pubkey,
    pub deposit_lamports: u64,
    pub released_by: Pubkey,
}

#[event]
pub struct DepositRefunded {
    pub agreement: Pubkey,
    pub tenant: Pubkey,
    pub deposit_lamports: u64,
    pub resolved_by: Pubkey,
}

#[event]
pub struct AgreementCancelled {
    pub agreement: Pubkey,
    pub cancelled_by: Pubkey,
}
