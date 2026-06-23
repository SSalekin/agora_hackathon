use anchor_lang::{prelude::*, system_program};

use crate::{
    Agreement, AgreementCancelled, AgreementCreated, AgreementState, Config, DepositFunded,
    DepositRefunded, DepositReleased, DisputeOpened, EscrowError, LandlordApproved, AGREEMENT_SEED,
    ANCHOR_DISCRIMINATOR, CONFIG_SEED,
};

#[derive(Accounts)]
#[instruction(listing_hash: [u8; 32])]
pub struct CreateAgreement<'info> {
    #[account(mut)]
    pub tenant: Signer<'info>,

    pub landlord: SystemAccount<'info>,

    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, Config>,

    #[account(
        init,
        payer = tenant,
        space = ANCHOR_DISCRIMINATOR + Agreement::INIT_SPACE,
        seeds = [
            AGREEMENT_SEED,
            tenant.key().as_ref(),
            landlord.key().as_ref(),
            listing_hash.as_ref(),
        ],
        bump,
    )]
    pub agreement: Account<'info, Agreement>,

    pub system_program: Program<'info, System>,
}

pub fn handle_create_agreement(
    context: Context<CreateAgreement>,
    listing_hash: [u8; 32],
    deposit_lamports: u64,
    inspection_deadline: i64,
) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let tenant = context.accounts.tenant.key();
    let landlord = context.accounts.landlord.key();
    let moderator = context.accounts.config.moderator;

    require!(deposit_lamports > 0, EscrowError::InvalidDepositAmount);
    require!(
        inspection_deadline > now,
        EscrowError::InvalidInspectionDeadline
    );
    require!(
        tenant != landlord && tenant != moderator && landlord != moderator,
        EscrowError::RolesMustBeDistinct
    );

    context.accounts.agreement.set_inner(Agreement {
        tenant,
        landlord,
        moderator,
        listing_hash,
        deposit_lamports,
        inspection_deadline,
        created_at: now,
        funded_at: 0,
        state: AgreementState::AwaitingLandlordApproval,
        dispute_reason_code: 0,
        evidence_hash: [0; 32],
        bump: context.bumps.agreement,
    });

    emit!(AgreementCreated {
        agreement: context.accounts.agreement.key(),
        tenant,
        landlord,
        listing_hash,
        deposit_lamports,
        inspection_deadline,
    });
    Ok(())
}

#[derive(Accounts)]
pub struct ApproveAgreement<'info> {
    pub landlord: Signer<'info>,

    #[account(
        mut,
        has_one = landlord,
        seeds = [
            AGREEMENT_SEED,
            agreement.tenant.as_ref(),
            agreement.landlord.as_ref(),
            agreement.listing_hash.as_ref(),
        ],
        bump = agreement.bump,
    )]
    pub agreement: Account<'info, Agreement>,
}

pub fn handle_approve_agreement(context: Context<ApproveAgreement>) -> Result<()> {
    require!(
        context.accounts.agreement.state == AgreementState::AwaitingLandlordApproval,
        EscrowError::InvalidAgreementState
    );

    context.accounts.agreement.state = AgreementState::AwaitingFunding;
    emit!(LandlordApproved {
        agreement: context.accounts.agreement.key(),
        landlord: context.accounts.landlord.key(),
    });
    Ok(())
}

#[derive(Accounts)]
pub struct CancelAgreement<'info> {
    pub authority: Signer<'info>,

    #[account(mut)]
    pub tenant: SystemAccount<'info>,

    pub landlord: SystemAccount<'info>,

    #[account(
        mut,
        close = tenant,
        has_one = tenant,
        has_one = landlord,
        seeds = [
            AGREEMENT_SEED,
            agreement.tenant.as_ref(),
            agreement.landlord.as_ref(),
            agreement.listing_hash.as_ref(),
        ],
        bump = agreement.bump,
    )]
    pub agreement: Account<'info, Agreement>,
}

pub fn handle_cancel_agreement(context: Context<CancelAgreement>) -> Result<()> {
    let agreement = &mut context.accounts.agreement;
    let authority = context.accounts.authority.key();
    let authorized = match agreement.state {
        AgreementState::AwaitingLandlordApproval => {
            authority == agreement.tenant || authority == agreement.landlord
        }
        AgreementState::AwaitingFunding => {
            authority == agreement.tenant || authority == agreement.landlord
        }
        _ => false,
    };
    require!(authorized, EscrowError::UnauthorizedParty);

    agreement.state = AgreementState::Cancelled;
    emit!(AgreementCancelled {
        agreement: agreement.key(),
        cancelled_by: authority,
    });
    Ok(())
}

#[derive(Accounts)]
pub struct FundAgreement<'info> {
    #[account(mut)]
    pub tenant: Signer<'info>,

    #[account(
        mut,
        has_one = tenant,
        seeds = [
            AGREEMENT_SEED,
            agreement.tenant.as_ref(),
            agreement.landlord.as_ref(),
            agreement.listing_hash.as_ref(),
        ],
        bump = agreement.bump,
    )]
    pub agreement: Account<'info, Agreement>,

    pub system_program: Program<'info, System>,
}

pub fn handle_fund_agreement(context: Context<FundAgreement>) -> Result<()> {
    let agreement = &context.accounts.agreement;
    require!(
        agreement.state == AgreementState::AwaitingFunding,
        EscrowError::InvalidAgreementState
    );

    let now = Clock::get()?.unix_timestamp;
    require!(
        now <= agreement.inspection_deadline,
        EscrowError::InspectionDeadlinePassed
    );
    let deposit_lamports = agreement.deposit_lamports;

    system_program::transfer(
        CpiContext::new(
            context.accounts.system_program.key(),
            system_program::Transfer {
                from: context.accounts.tenant.to_account_info(),
                to: context.accounts.agreement.to_account_info(),
            },
        ),
        deposit_lamports,
    )?;

    let agreement = &mut context.accounts.agreement;
    agreement.funded_at = now;
    agreement.state = AgreementState::Funded;
    emit!(DepositFunded {
        agreement: agreement.key(),
        tenant: agreement.tenant,
        deposit_lamports,
        funded_at: now,
    });
    Ok(())
}

#[derive(Accounts)]
pub struct OpenDispute<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [
            AGREEMENT_SEED,
            agreement.tenant.as_ref(),
            agreement.landlord.as_ref(),
            agreement.listing_hash.as_ref(),
        ],
        bump = agreement.bump,
    )]
    pub agreement: Account<'info, Agreement>,
}

pub fn handle_open_dispute(
    context: Context<OpenDispute>,
    reason_code: u8,
    evidence_hash: [u8; 32],
) -> Result<()> {
    let agreement = &mut context.accounts.agreement;
    let authority = context.accounts.authority.key();
    require!(
        agreement.state == AgreementState::Funded,
        EscrowError::InvalidAgreementState
    );
    require!(
        authority == agreement.tenant || authority == agreement.landlord,
        EscrowError::UnauthorizedParty
    );
    require!(
        Clock::get()?.unix_timestamp <= agreement.inspection_deadline,
        EscrowError::InspectionDeadlinePassed
    );
    require!(reason_code > 0, EscrowError::InvalidDisputeReason);

    agreement.state = AgreementState::Disputed;
    agreement.dispute_reason_code = reason_code;
    agreement.evidence_hash = evidence_hash;
    emit!(DisputeOpened {
        agreement: agreement.key(),
        opened_by: authority,
        reason_code,
        evidence_hash,
    });
    Ok(())
}

#[derive(Accounts)]
pub struct ReleaseByTenant<'info> {
    #[account(mut)]
    pub tenant: Signer<'info>,

    #[account(mut)]
    pub landlord: SystemAccount<'info>,

    #[account(
        mut,
        close = tenant,
        has_one = tenant,
        has_one = landlord,
        seeds = [
            AGREEMENT_SEED,
            agreement.tenant.as_ref(),
            agreement.landlord.as_ref(),
            agreement.listing_hash.as_ref(),
        ],
        bump = agreement.bump,
    )]
    pub agreement: Account<'info, Agreement>,
}

pub fn handle_release_by_tenant(context: Context<ReleaseByTenant>) -> Result<()> {
    require!(
        context.accounts.agreement.state == AgreementState::Funded,
        EscrowError::InvalidAgreementState
    );

    let deposit_lamports = context.accounts.agreement.deposit_lamports;
    transfer_deposit(
        &context.accounts.agreement.to_account_info(),
        &context.accounts.landlord.to_account_info(),
        deposit_lamports,
    )?;
    context.accounts.agreement.state = AgreementState::Released;
    emit!(DepositReleased {
        agreement: context.accounts.agreement.key(),
        landlord: context.accounts.landlord.key(),
        deposit_lamports,
        released_by: context.accounts.tenant.key(),
    });
    Ok(())
}

#[derive(Accounts)]
pub struct ReleaseAfterDeadline<'info> {
    #[account(mut)]
    pub landlord: Signer<'info>,

    #[account(mut)]
    pub tenant: SystemAccount<'info>,

    #[account(
        mut,
        close = tenant,
        has_one = tenant,
        has_one = landlord,
        seeds = [
            AGREEMENT_SEED,
            agreement.tenant.as_ref(),
            agreement.landlord.as_ref(),
            agreement.listing_hash.as_ref(),
        ],
        bump = agreement.bump,
    )]
    pub agreement: Account<'info, Agreement>,
}

pub fn handle_release_after_deadline(context: Context<ReleaseAfterDeadline>) -> Result<()> {
    require!(
        context.accounts.agreement.state == AgreementState::Funded,
        EscrowError::InvalidAgreementState
    );
    require!(
        Clock::get()?.unix_timestamp > context.accounts.agreement.inspection_deadline,
        EscrowError::InspectionDeadlineNotReached
    );

    let deposit_lamports = context.accounts.agreement.deposit_lamports;
    transfer_deposit(
        &context.accounts.agreement.to_account_info(),
        &context.accounts.landlord.to_account_info(),
        deposit_lamports,
    )?;
    context.accounts.agreement.state = AgreementState::Released;
    emit!(DepositReleased {
        agreement: context.accounts.agreement.key(),
        landlord: context.accounts.landlord.key(),
        deposit_lamports,
        released_by: context.accounts.landlord.key(),
    });
    Ok(())
}

#[derive(Accounts)]
pub struct ResolveDispute<'info> {
    pub moderator: Signer<'info>,

    #[account(mut)]
    pub tenant: SystemAccount<'info>,

    #[account(mut)]
    pub landlord: SystemAccount<'info>,

    #[account(
        mut,
        close = tenant,
        has_one = tenant,
        has_one = landlord,
        has_one = moderator,
        seeds = [
            AGREEMENT_SEED,
            agreement.tenant.as_ref(),
            agreement.landlord.as_ref(),
            agreement.listing_hash.as_ref(),
        ],
        bump = agreement.bump,
    )]
    pub agreement: Account<'info, Agreement>,
}

pub fn handle_resolve_dispute(
    context: Context<ResolveDispute>,
    release_to_landlord: bool,
) -> Result<()> {
    require!(
        context.accounts.agreement.state == AgreementState::Disputed,
        EscrowError::InvalidAgreementState
    );

    let agreement_key = context.accounts.agreement.key();
    let deposit_lamports = context.accounts.agreement.deposit_lamports;
    if release_to_landlord {
        transfer_deposit(
            &context.accounts.agreement.to_account_info(),
            &context.accounts.landlord.to_account_info(),
            deposit_lamports,
        )?;
        context.accounts.agreement.state = AgreementState::Released;
        emit!(DepositReleased {
            agreement: agreement_key,
            landlord: context.accounts.landlord.key(),
            deposit_lamports,
            released_by: context.accounts.moderator.key(),
        });
    } else {
        context.accounts.agreement.state = AgreementState::Refunded;
        emit!(DepositRefunded {
            agreement: agreement_key,
            tenant: context.accounts.tenant.key(),
            deposit_lamports,
            resolved_by: context.accounts.moderator.key(),
        });
    }
    Ok(())
}

fn transfer_deposit(
    agreement: &AccountInfo<'_>,
    recipient: &AccountInfo<'_>,
    deposit_lamports: u64,
) -> Result<()> {
    let agreement_balance = agreement.lamports();
    require!(
        agreement_balance >= deposit_lamports,
        EscrowError::InsufficientEscrowBalance
    );
    let recipient_balance = recipient.lamports();

    **agreement.try_borrow_mut_lamports()? = agreement_balance
        .checked_sub(deposit_lamports)
        .ok_or(EscrowError::LamportOverflow)?;
    **recipient.try_borrow_mut_lamports()? = recipient_balance
        .checked_add(deposit_lamports)
        .ok_or(EscrowError::LamportOverflow)?;
    Ok(())
}
