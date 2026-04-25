import { Bot } from 'grammy';
import { userManagementConfig } from './module.config';
import { userManagementAbilities } from './abilities';
import { startCommand } from './commands/start.command';
import { profileCommand } from './commands/profile.command';
import { usersCommand } from './commands/users.command';
import { handleCallbackQuery } from './handlers/callback.handler';
import { handleTextInput } from './handlers/text.handler';

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
