// Run this with: node restore-access.js
// This script will restore your access to the 'bisalle' business

import { createClient } from '@supabase/supabase-js'

// You'll need to add your Supabase credentials here
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || ''
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function restoreAccess() {
  console.log('🔍 Finding your user ID...')

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('❌ Error getting user:', userError)
    return
  }

  console.log('✅ User ID:', user.id)
  console.log('📧 Email:', user.email)

  // Find all businesses in the database
  const { data: allBusinesses, error: bizError } = await supabase
    .from('businesses')
    .select('id, name, created_at')
    .order('created_at', { ascending: true })

  if (bizError) {
    console.error('❌ Error fetching businesses:', bizError)
    return
  }

  console.log('\n📋 All businesses in database:')
  allBusinesses?.forEach((biz, idx) => {
    console.log(`  ${idx + 1}. ${biz.name} (ID: ${biz.id})`)
  })

  // Check current user_businesses associations
  const { data: userBiz, error: userBizError } = await supabase
    .from('user_businesses')
    .select('business_id, role')
    .eq('user_id', user.id)

  if (userBizError) {
    console.error('❌ Error fetching user businesses:', userBizError)
    return
  }

  console.log('\n🔗 Your current business associations:', userBiz?.length || 0)

  if (!userBiz || userBiz.length === 0) {
    console.log('\n⚠️  You have NO business associations!')
    console.log('🔧 Would restore access to all businesses found.')
    console.log('\n💡 To restore access, you need to:')
    console.log('1. Know which business ID belongs to "bisalle"')
    console.log('2. Run this SQL in Supabase SQL Editor:\n')

    if (allBusinesses && allBusinesses.length > 0) {
      // Find the bisalle business
      const bisalle = allBusinesses.find(b => b.name.toLowerCase().includes('bisalle'))

      if (bisalle) {
        console.log(`INSERT INTO user_businesses (user_id, business_id, role, joined_at)
VALUES ('${user.id}', '${bisalle.id}', 'owner', NOW());`)
      } else {
        console.log('⚠️  Could not find "bisalle" business. Check the business names above.')
        console.log(`\nGeneric template:`)
        console.log(`INSERT INTO user_businesses (user_id, business_id, role, joined_at)
VALUES ('${user.id}', 'BUSINESS_ID_HERE', 'owner', NOW());`)
      }
    }
  } else {
    console.log('✅ You have access to:', userBiz.length, 'business(es)')
  }
}

restoreAccess().catch(console.error)
