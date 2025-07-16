/**
 * Simple test to verify the Judge0 API client works correctly
 * Run this to test basic functionality
 */

import { getAvailableLanguages, judge0Api, LANGUAGE_IDS } from "./index";

async function testBasicFunctionality() {
  console.log("🧪 Testing Judge0 API Client...\n");

  try {
    // Test 1: Get system info
    console.log("📋 Test 1: Getting system configuration...");
    const configResult = await judge0Api.getConfigInfo();
    
    if (configResult.isErr()) {
      console.error("❌ Failed to get config:", configResult.error);
      return;
    }
    
    console.log("✅ Config retrieved successfully");
    console.log(`   CPU Time Limit: ${configResult.value.cpu_time_limit}s`);
    console.log(`   Memory Limit: ${configResult.value.memory_limit}KB`);
    console.log(`   Max Queue Size: ${configResult.value.max_queue_size}\n`);

    // Test 2: Get available languages
    console.log("🌍 Test 2: Getting available languages...");
    const languages = await getAvailableLanguages();
    
    if (!languages) {
      console.error("❌ Failed to get languages");
      return;
    }
    
    console.log(`✅ Found ${languages.length} languages`);
    console.log("   Sample languages:");
    languages.slice(0, 5).forEach(lang => {
      console.log(`   - ${lang.name} (ID: ${lang.id})`);
    });
    console.log();

    // Test 3: Simple code execution
    console.log("⚡ Test 3: Executing simple Hello World...");
    const createResult = await judge0Api.createSubmission({
      source_code: `
        #include <stdio.h>
        int main() {
            printf("Hello from Judge0!\\n");
            return 0;
        }
      `.trim(),
      language_id: LANGUAGE_IDS.C_GCC_9_2_0,
    });

    if (createResult.isErr()) {
      console.error("❌ Failed to create submission:", createResult.error);
      return;
    }

    const token = createResult.value.token;
    if (!token) {
      console.error("❌ No token received");
      return;
    }

    console.log(`✅ Submission created with token: ${token}`);

    // Test 4: Get submission result (with simple polling)
    console.log("📊 Test 4: Getting submission result...");
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const result = await judge0Api.getSubmission(token);
      
      if (result.isErr()) {
        console.error("❌ Failed to get submission:", result.error);
        return;
      }

      const submission = result.value;
      console.log(`   Attempt ${attempts + 1}: Status = ${submission.status?.description || "Unknown"}`);

      if (submission.status && submission.status.id > 2) {
        // Status > 2 means finished (not in queue or processing)
        console.log("✅ Execution completed!");
        console.log(`   Status: ${submission.status.description}`);
        console.log(`   Output: ${submission.stdout || "(no output)"}`);
        console.log(`   Time: ${submission.time || "N/A"}s`);
        console.log(`   Memory: ${submission.memory || "N/A"}KB`);
        break;
      }

      attempts++;
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (attempts >= maxAttempts) {
      console.log("⚠️  Submission still processing after maximum attempts");
    }

    console.log("\n🎉 All tests completed successfully!");

  } catch (error) {
    console.error("💥 Unexpected error:", error);
  }
}

// Export the test function
export { testBasicFunctionality };
