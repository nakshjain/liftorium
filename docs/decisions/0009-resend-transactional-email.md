# ADR 0009: Resend Transactional Email

## Status

Accepted

## Date

2026-06-14

## Context

The OTP registration and password reset flows originally sent email through SMTP and Spring Mail. SMTP requires provider-specific host, port, username, password, and TLS settings, which increases local setup friction and makes production provider changes harder.

## Decision

Use Resend's Email API as the transactional email transport for OTP and password reset emails.

Keep OTP generation, hashing, expiry, rate limiting, API contracts, and error codes inside the Liftorium backend. Configure the provider through `RESEND_API_KEY` and `RESEND_FROM_EMAIL`.

Call Resend over Spring's `RestClient` instead of adding a provider SDK dependency, keeping the integration small and limited to one service.

## Consequences

Production email delivery depends on a Resend API key and a verified sender domain.

The auth API remains unchanged for the frontend.

Provider-specific behavior is isolated in `EmailService`, so future provider changes should not touch auth controller or OTP persistence logic.
