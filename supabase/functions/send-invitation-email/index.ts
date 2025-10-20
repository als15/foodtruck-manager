import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { invitationId } = await req.json()
    console.log('Processing invitation:', invitationId)

    // Check environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const appUrl = Deno.env.get('APP_URL')

    console.log('Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceRoleKey: !!serviceRoleKey,
      hasResendKey: !!RESEND_API_KEY,
      hasAppUrl: !!appUrl
    })

    if (!supabaseUrl || !serviceRoleKey || !RESEND_API_KEY || !appUrl) {
      throw new Error('Missing required environment variables')
    }

    // Create Supabase client
    const supabaseClient = createClient(supabaseUrl, serviceRoleKey)

    // Get invitation details
    const { data: invitation, error } = await supabaseClient
      .from('business_invitations')
      .select(`
        *,
        business:businesses(name)
      `)
      .eq('id', invitationId)
      .single()

    console.log('Invitation query result:', { invitation, error })

    if (error || !invitation) {
      throw new Error(`Invitation not found: ${error?.message || 'No data'}`)
    }

    // Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'noreply@itsnomnoms.com',
        to: [invitation.email],
        subject: `You're invited to join ${invitation.business.name}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
                <h2 style="color: #1890ff; margin-top: 0;">You've been invited!</h2>
                <p style="font-size: 16px;">You've been invited to join <strong>${invitation.business.name}</strong> as a <strong style="text-transform: capitalize;">${invitation.role}</strong>.</p>
                <p style="font-size: 16px;">Click the button below to accept the invitation:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${Deno.env.get('APP_URL')}/invite/${invitation.token}"
                     style="background-color: #1890ff; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500; font-size: 16px;">
                    Accept Invitation
                  </a>
                </div>
                <p style="font-size: 14px; color: #666;">Or copy and paste this link into your browser:</p>
                <p style="font-size: 14px; background-color: #e9ecef; padding: 12px; border-radius: 4px; word-break: break-all;">
                  ${Deno.env.get('APP_URL')}/invite/${invitation.token}
                </p>
                <p style="font-size: 14px; color: #666; margin-top: 30px;">
                  This invitation will expire on <strong>${new Date(invitation.expires_at).toLocaleDateString()}</strong>.
                </p>
                <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
                <p style="font-size: 12px; color: #999;">
                  If you didn't expect this invitation, you can safely ignore this email.
                </p>
              </div>
            </body>
          </html>
        `,
      }),
    })

    const data = await res.json()
    console.log('Resend API response:', { status: res.status, data })

    if (!res.ok) {
      throw new Error(`Resend API error: ${data.message || JSON.stringify(data)}`)
    }

    console.log('Email sent successfully:', data.id)
    return new Response(
      JSON.stringify({ success: true, emailId: data.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Edge Function error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
