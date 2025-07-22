# Setup script for ADHDAI environment variables
Write-Host "Setting up environment variables for ADHDAI development..." -ForegroundColor Green

# Read the .env file
$envContent = Get-Content .env

# Replace empty values with development defaults
$envContent = $envContent -replace '^AUTH_SECRET=$', 'AUTH_SECRET=adhdai-dev-secret-change-in-production-12345'
$envContent = $envContent -replace '^GOOGLE_CLIENT_ID=$', 'GOOGLE_CLIENT_ID=your-google-client-id-here'
$envContent = $envContent -replace '^GOOGLE_CLIENT_SECRET=$', 'GOOGLE_CLIENT_SECRET=your-google-client-secret-here'
$envContent = $envContent -replace '^GITHUB_OAUTH_TOKEN=$', 'GITHUB_OAUTH_TOKEN=your-github-token-here'
$envContent = $envContent -replace "^DATABASE_URL='postgres://\[user\]:\[password\]@\[neon_hostname\]/\[dbname\]\?sslmode=require'$", 'DATABASE_URL=postgresql://postgres:password@localhost:5432/adhdai_dev'
$envContent = $envContent -replace '^RESEND_API_KEY=$', 'RESEND_API_KEY=your-resend-api-key-here'
$envContent = $envContent -replace '^STRIPE_API_KEY=$', 'STRIPE_API_KEY=sk_test_your-stripe-test-key-here'
$envContent = $envContent -replace '^STRIPE_WEBHOOK_SECRET=$', 'STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret-here'
$envContent = $envContent -replace '^NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PLAN_ID=$', 'NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PLAN_ID=price_test_pro_monthly'
$envContent = $envContent -replace '^NEXT_PUBLIC_STRIPE_PRO_YEARLY_PLAN_ID=$', 'NEXT_PUBLIC_STRIPE_PRO_YEARLY_PLAN_ID=price_test_pro_yearly'
$envContent = $envContent -replace '^NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PLAN_ID=$', 'NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PLAN_ID=price_test_business_monthly'
$envContent = $envContent -replace '^NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PLAN_ID=$', 'NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PLAN_ID=price_test_business_yearly'

# Write back to .env file
$envContent | Set-Content .env

Write-Host "Environment variables have been set up with development defaults!" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT: You'll need to replace the following with real values:" -ForegroundColor Yellow
Write-Host "- GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (for Google OAuth)" -ForegroundColor Yellow
Write-Host "- GITHUB_OAUTH_TOKEN (for GitHub OAuth)" -ForegroundColor Yellow
Write-Host "- DATABASE_URL (set up a PostgreSQL database)" -ForegroundColor Yellow
Write-Host "- RESEND_API_KEY (for email functionality)" -ForegroundColor Yellow
Write-Host "- STRIPE_API_KEY and related Stripe variables (for payments)" -ForegroundColor Yellow
Write-Host ""
Write-Host "For now, you can run the app in development mode with these placeholder values." -ForegroundColor Cyan
