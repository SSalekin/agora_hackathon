pub mod constants;
pub mod error;
pub mod events;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use error::*;
pub use events::*;
pub use instructions::*;
pub use state::*;

declare_id!("9nWcd1EWhogJsBtk1Q43GP9eVvn6K9TgaSG5JyhnTp6X");

#[program]
pub mod escrow {
    use super::*;

    pub fn initialize_config(context: Context<InitializeConfig>, moderator: Pubkey) -> Result<()> {
        instructions::handle_initialize_config(context, moderator)
    }

    pub fn create_agreement(
        context: Context<CreateAgreement>,
        listing_hash: [u8; 32],
        deposit_lamports: u64,
        inspection_deadline: i64,
    ) -> Result<()> {
        instructions::handle_create_agreement(
            context,
            listing_hash,
            deposit_lamports,
            inspection_deadline,
        )
    }

    pub fn approve_agreement(context: Context<ApproveAgreement>) -> Result<()> {
        instructions::handle_approve_agreement(context)
    }

    pub fn cancel_agreement(context: Context<CancelAgreement>) -> Result<()> {
        instructions::handle_cancel_agreement(context)
    }

    pub fn fund_agreement(context: Context<FundAgreement>) -> Result<()> {
        instructions::handle_fund_agreement(context)
    }

    pub fn open_dispute(
        context: Context<OpenDispute>,
        reason_code: u8,
        evidence_hash: [u8; 32],
    ) -> Result<()> {
        instructions::handle_open_dispute(context, reason_code, evidence_hash)
    }

    pub fn release_by_tenant(context: Context<ReleaseByTenant>) -> Result<()> {
        instructions::handle_release_by_tenant(context)
    }

    pub fn release_after_deadline(context: Context<ReleaseAfterDeadline>) -> Result<()> {
        instructions::handle_release_after_deadline(context)
    }

    pub fn resolve_dispute(
        context: Context<ResolveDispute>,
        release_to_landlord: bool,
    ) -> Result<()> {
        instructions::handle_resolve_dispute(context, release_to_landlord)
    }
}
