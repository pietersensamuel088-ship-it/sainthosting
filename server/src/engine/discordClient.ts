export interface DiscordBotProfile {
  id: string;
  username: string;
  discriminator: string;
  avatarUrl: string;
  isBot: boolean;
  inviteUrl: string;
  maskedToken?: string;
}

export class DiscordBotClient {
  /**
   * Fetches real Discord Bot information from Discord API v10
   */
  public async fetchBotInfo(botToken: string, permissions: string = '8'): Promise<{
    success: boolean;
    bot?: DiscordBotProfile;
    message: string;
  }> {
    if (!botToken || botToken.trim().length < 20) {
      return {
        success: false,
        message: 'Invalid Discord Bot Token format. Tokens are provided in the Discord Developer Portal.',
      };
    }

    const cleanToken = botToken.trim().replace(/^Bot\s+/i, '');

    try {
      const res = await fetch('https://discord.com/api/v10/users/@me', {
        method: 'GET',
        headers: {
          Authorization: `Bot ${cleanToken}`,
          'User-Agent': 'SaintHosting/2.0',
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          return {
            success: false,
            message: 'Discord API 401: Unauthorized. The token provided was rejected by Discord.',
          };
        }
        return {
          success: false,
          message: `Discord API returned error code ${res.status}.`,
        };
      }

      const user: any = await res.json();

      if (!user.bot) {
        return {
          success: false,
          message: 'Security warning: The provided token belongs to a User account, not a Bot account. Saint only hosts bots.',
        };
      }

      const avatarUrl = user.avatar
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`
        : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator || '0', 10) % 5}.png`;

      // Official OAuth2 Bot Invite Link with bot & applications.commands scope
      const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${user.id}&permissions=${permissions}&scope=bot%20applications.commands`;

      const maskedToken = cleanToken.length > 8
        ? `${'•'.repeat(cleanToken.length - 6)}${cleanToken.slice(-6)}`
        : '••••••••••••';

      return {
        success: true,
        message: `Successfully connected to Discord as ${user.username}!`,
        bot: {
          id: user.id,
          username: user.username,
          discriminator: user.discriminator || '0',
          avatarUrl,
          isBot: true,
          inviteUrl,
          maskedToken,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Could not reach Discord API: ${err.message}`,
      };
    }
  }

  /**
   * Generates Discord Bot Invite link from Client ID without token
   */
  public generateInviteLink(clientId: string, permissions: string = '8'): string {
    const cleanId = clientId.trim();
    return `https://discord.com/oauth2/authorize?client_id=${cleanId}&permissions=${permissions}&scope=bot%20applications.commands`;
  }
}

export const discordBotClient = new DiscordBotClient();
