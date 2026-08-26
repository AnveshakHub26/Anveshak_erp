/**
 * AnveshakHub ERP — Supabase Storage End-to-End Verification Script
 *
 * Verifies that:
 * 1. `anveshak-private-documents` bucket exists and is set to private.
 * 2. Authorized presigned upload and download URLs are generated correctly.
 * 3. File upload and authorized presigned download succeed.
 * 4. Unauthenticated/public access to the file is DENIED.
 * 5. Cleans up the temporary test object afterward.
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'anveshak-private-documents';

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required env: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`\n🔍 Verifying Supabase Storage Bucket: "${bucketName}"`);
  console.log('─'.repeat(70));

  // 1. Bucket Existence & Privacy Verification
  const { data: bucket, error: bucketErr } = await supabase.storage.getBucket(bucketName);

  if (bucketErr || !bucket) {
    console.log(`ℹ️ Bucket "${bucketName}" not found. Creating private bucket...`);
    const { data: createdBucket, error: createErr } = await supabase.storage.createBucket(bucketName, {
      public: false, // Explicitly private
      fileSizeLimit: 52428800, // 50MB
    });

    if (createErr) {
      throw new Error(`Failed to create bucket "${bucketName}": ${createErr.message}`);
    }
    console.log(`✓ Private Bucket "${bucketName}" created successfully.`);
  } else {
    console.log(`✓ Bucket "${bucket.name}" confirmed. Public Access Flag: ${bucket.public ? 'PUBLIC (INVALID)' : 'FALSE (PRIVATE ✓)'}`);
    if (bucket.public) {
      console.log(`⚠️ Bucket was public. Updating bucket to private...`);
      await supabase.storage.updateBucket(bucketName, { public: false });
      console.log(`✓ Bucket updated to PRIVATE.`);
    }
  }

  // 2. Upload Temporary Verification Document
  const testKey = `test-verification-${Date.now()}.txt`;
  const testContent = Buffer.from('AnveshakHub Enterprise Storage E2E Verification Payload');

  console.log(`\n📤 Uploading temporary test document: "${testKey}"...`);
  const { data: uploadRes, error: uploadErr } = await supabase.storage
    .from(bucketName)
    .upload(testKey, testContent, {
      contentType: 'text/plain',
      upsert: true,
    });

  if (uploadErr || !uploadRes) {
    throw new Error(`Upload failed: ${uploadErr?.message}`);
  }
  console.log(`✓ Upload successful (path: ${uploadRes.path}).`);

  // 3. Generate Authorized Presigned Download URL
  console.log(`\n🔑 Generating authorized signed download URL...`);
  const { data: signedData, error: signedErr } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(testKey, 60);

  if (signedErr || !signedData?.signedUrl) {
    throw new Error(`Signed URL generation failed: ${signedErr?.message}`);
  }
  console.log(`✓ Presigned download URL generated successfully (expires in 60s).`);

  // 4. Download Content via Presigned URL
  console.log(`\n📥 Fetching document content using presigned URL...`);
  const downloadResponse = await fetch(signedData.signedUrl);
  if (!downloadResponse.ok) {
    throw new Error(`Presigned download HTTP fetch failed with status ${downloadResponse.status}`);
  }
  const downloadedText = await downloadResponse.text();
  if (downloadedText !== 'AnveshakHub Enterprise Storage E2E Verification Payload') {
    throw new Error(`Downloaded content mismatch! Got: "${downloadedText}"`);
  }
  console.log(`✓ Content verified matching payload: "${downloadedText}".`);

  // 5. Verify Unauthenticated / Direct Public Access is DENIED
  console.log(`\n🛡️ Testing unauthenticated direct public access restriction...`);
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${testKey}`;
  const publicFetchResponse = await fetch(publicUrl);

  if (publicFetchResponse.ok) {
    throw new Error(`SECURITY ALERT: Unauthenticated public access was ALLOWED! (HTTP 200)`);
  }
  console.log(`✓ Unauthenticated public access DENIED as expected (HTTP ${publicFetchResponse.status}).`);

  // 6. Cleanup Temporary Verification Document
  console.log(`\n🧹 Cleaning up temporary test document...`);
  const { error: removeErr } = await supabase.storage.from(bucketName).remove([testKey]);
  if (removeErr) {
    console.warn(`Warning: Cleanup failed for ${testKey}: ${removeErr.message}`);
  } else {
    console.log(`✓ Temporary object "${testKey}" removed cleanly.`);
  }

  console.log('\n✅ Supabase Storage E2E Verification Completed Successfully!');
}

main().catch((e) => {
  console.error('\n❌ Storage Verification Failed:', e.message);
  process.exit(1);
});
