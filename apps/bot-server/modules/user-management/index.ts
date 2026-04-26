import { Bot } from 'grammy';
import { userManagementConfig } from './module.config.js';
import { userManagementAbilities } from './abilities.js';
import { startCommand } from './commands/start.command.js';
import { profileCommand } from './commands/profile.command.js';
import { usersCommand } from './commands/users.command.js';
import { handleCallbackQuery } from './handlers/callback.handler.js';
import { handleTextInput } from './handlers/text.handler.js';

export class UserManagementModule {
  constructor(private bot: Bot) {
    this.registerCommands();
    this.registerCallbacks();
    this.registerTextHandler();
  }

  private registerCommands() {
    this.bot.command('start', startCommand);
    this.bot.command('profile', profileCommand);
    this.bot.command('users', usersCommand);
  }

  private registerCallbacks() {
    this.bot.on('callback_query:data', handleCallbackQuery);
  }

  private registerTextHandler() {
    this.bot.on('message:text', handleTextInput);
  }
}

export { userManagementConfig, userManagementAbilities };
