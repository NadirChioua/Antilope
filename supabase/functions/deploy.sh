#!/bin/bash

# Deploy Supabase Edge Functions
# Make sure you have the Supabase CLI installed and are logged in

echo "Deploying Supabase Edge Functions..."

# Deploy the process-sale function
supabase functions deploy process-sale

echo "Edge Functions deployed successfully!"
echo ""
echo "To test the function:"
echo "curl -X POST 'https://your-project-ref.supabase.co/functions/v1/process-sale' \\"
echo "  -H 'Authorization: Bearer YOUR_ANON_KEY' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"clientId\":\"...\",\"serviceId\":\"...\",\"staffId\":\"...\",\"products\":[...],\"totalAmount\":150.00,\"paymentMethod\":\"cash\"}'"
