// Debug script to test suppliers connection
// You can run this in the browser console on your app

// Test 1: Check if supabase is connected
console.log('=== Testing Supabase Connection ===');

// Test 2: Try to fetch suppliers directly
async function testSuppliersConnection() {
  try {
    console.log('Testing suppliers fetch...');
    
    // Import the service (you might need to adjust the path)
    const { suppliersService } = await import('./src/services/supabaseService.ts');
    
    console.log('suppliersService:', suppliersService);
    
    const suppliers = await suppliersService.getAll();
    console.log('Suppliers data:', suppliers);
    console.log('Number of suppliers:', suppliers.length);
    
    return suppliers;
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    console.error('Error details:', error.message);
    return null;
  }
}

// Test 3: Check the raw Supabase query
async function testRawSupabaseQuery() {
  try {
    console.log('Testing raw Supabase query...');
    
    const { supabase } = await import('./src/lib/supabase.ts');
    
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name', { ascending: true });
      
    if (error) {
      console.error('Raw query error:', error);
    } else {
      console.log('Raw query result:', data);
      console.log('Raw query count:', data?.length || 0);
    }
    
    return { data, error };
  } catch (error) {
    console.error('Error with raw query:', error);
    return null;
  }
}

// Run the tests
console.log('Running tests...');
testRawSupabaseQuery().then(() => {
  testSuppliersConnection();
});