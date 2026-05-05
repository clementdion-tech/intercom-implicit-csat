import 'dotenv/config';
import { runBatch, printBatchSummary } from './processor';

async function main() {
  const args = process.argv.slice(2);

  let conversationId: string | undefined;
  let limit: number | undefined;
  let dryRun = false;
  let concurrency: number | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--conversation-id' && args[i + 1]) {
      conversationId = args[++i];
    } else if (args[i] === '--limit' && args[i + 1]) {
      limit = parseInt(args[++i]);
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    } else if (args[i] === '--concurrency' && args[i + 1]) {
      concurrency = parseInt(args[++i]);
    }
  }

  console.log('\n🚀 Implicit CSAT Batch Processor');
  console.log('─'.repeat(50));
  if (dryRun) console.log('🔍 DRY RUN MODE — no data will be written');
  if (conversationId) console.log(`📌 Single conversation: ${conversationId}`);
  else if (limit) console.log(`📦 Limit: ${limit} conversations`);
  else console.log('📦 Processing default batch (up to 500 conversations)');
  console.log('─'.repeat(50) + '\n');

  try {
    const summary = await runBatch({ conversationId, limit, dryRun, concurrency });
    printBatchSummary(summary, dryRun);
    process.exit(summary.failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Batch failed:', err);
    process.exit(1);
  }
}

main();
