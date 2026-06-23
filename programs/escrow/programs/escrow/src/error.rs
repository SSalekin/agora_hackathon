use anchor_lang::prelude::*;

#[error_code]
pub enum EscrowError {
    #[msg("Moderator public key cannot be the default public key")]
    InvalidModerator,
    #[msg("Tenant, landlord, and moderator must be different wallets")]
    RolesMustBeDistinct,
    #[msg("Deposit amount must be greater than zero")]
    InvalidDepositAmount,
    #[msg("Inspection deadline must be in the future")]
    InvalidInspectionDeadline,
    #[msg("Agreement is not in the required state")]
    InvalidAgreementState,
    #[msg("Only the tenant or landlord may perform this action")]
    UnauthorizedParty,
    #[msg("The inspection deadline has passed")]
    InspectionDeadlinePassed,
    #[msg("The inspection deadline has not passed")]
    InspectionDeadlineNotReached,
    #[msg("Dispute reason code must be non-zero")]
    InvalidDisputeReason,
    #[msg("Agreement does not contain enough lamports for the deposit")]
    InsufficientEscrowBalance,
    #[msg("Lamport arithmetic overflowed")]
    LamportOverflow,
}
