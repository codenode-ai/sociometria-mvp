import "dotenv/config";

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables.');
  process.exit(1);
}

const baseRestUrl = `${SUPABASE_URL}/rest/v1`;
const headers = {
  apikey: SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
};

async function run() {
  console.log('1) Listing first employees...');
  const listEmployees = await fetch(`${baseRestUrl}/sociometria_employees?select=id,name,role,status&limit=5`, {
    headers,
  });
  const employees = await listEmployees.json();
  console.log(employees);

  console.log('\n2) Inserting a house for smoke test...');
  const insertHouse = await fetch(`${baseRestUrl}/sociometria_houses`, {
    method: 'POST',
    headers: {
      ...headers,
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      name: 'Casa Validação Supabase',
      cleaning_type: 'standard',
      size: 'medium',
    }),
  });
  if (!insertHouse.ok) {
    console.error('Failed to insert house', insertHouse.status, await insertHouse.text());
    process.exit(1);
  }
  const [created] = await insertHouse.json();
  console.log('Inserted house:', created);

  console.log('\n3) Cleaning up test record...');
  const deleteHouse = await fetch(`${baseRestUrl}/sociometria_houses?id=eq.${created.id}`, {
    method: 'DELETE',
    headers,
  });
  if (!deleteHouse.ok) {
    console.error('Failed to delete house', deleteHouse.status, await deleteHouse.text());
    process.exit(1);
  }
  console.log('Cleanup done.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
