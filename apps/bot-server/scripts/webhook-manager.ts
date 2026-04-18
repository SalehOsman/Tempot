/* eslint-disable no-console */
/* eslint-disable max-lines-per-function */
import * as dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Bot } from 'grammy';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from workspace root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const BOT_MODE = process.env.BOT_MODE;
const TEST_WEBHOOK_SECRET = process.env.TEST_WEBHOOK_SECRET || 'fallback_secret_token';

if (!BOT_TOKEN) {
  console.error('Error: BOT_TOKEN is missing in environment variables.');
  process.exit(1);
}

const bot = new Bot(BOT_TOKEN);
const action = process.argv[2];

async function main() {
  try {
    switch (action) {
      case 'set':
        if (BOT_MODE !== 'webhook') {
          console.error('Error: BOT_MODE must be set to "webhook" to set a webhook.');
          process.exit(1);
        }
        if (!WEBHOOK_URL) {
          console.error('Error: WEBHOOK_URL is missing in environment variables.');
          process.exit(1);
        }

        console.log(`Setting webhook to ${WEBHOOK_URL}/bot...`);
        await bot.api.setWebhook(`${WEBHOOK_URL}/bot`, {
          secret_token: TEST_WEBHOOK_SECRET,
        });
        console.log('Webhook set successfully.');
        break;

      case 'delete':
        console.log('Deleting webhook...');
        await bot.api.deleteWebhook({ drop_pending_updates: false });
        console.log('Webhook deleted successfully.');
        break;

      case 'info': {
        console.log('Fetching webhook info...');
        const info = await bot.api.getWebhookInfo();
        console.log('\n--- Webhook Info ---');
        console.log(`URL: ${info.url || '(none)'}`);
        console.log(`Has Custom Certificate: ${info.has_custom_certificate}`);
        console.log(`Pending Update Count: ${info.pending_update_count}`);
        if (info.ip_address) console.log(`IP Address: ${info.ip_address}`);
        if (info.last_error_date) {
          console.log(`Last Error Date: ${new Date(info.last_error_date * 1000).toLocaleString()}`);
        }
        if (info.last_error_message) {
          console.log(`Last Error Message: ${info.last_error_message}`);
        }
        if (info.last_synchronization_error_date) {
          console.log(
            `Last Sync Error Date: ${new Date(info.last_synchronization_error_date * 1000).toLocaleString()}`,
          );
        }
        if (info.max_connections) console.log(`Max Connections: ${info.max_connections}`);
        if (info.allowed_updates)
          console.log(`Allowed Updates: ${info.allowed_updates.join(', ')}`);
        console.log('--------------------\n');
        break;
      }

      default:
        console.error(`Error: Unknown action "${action}". Valid actions are: set, delete, info.`);
        process.exit(1);
    }
  } catch (error) {
    console.error('Error executing webhook manager:', error);
    process.exit(1);
  }
}

main();
