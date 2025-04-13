import {
    Client,
    GatewayIntentBits,
} from 'discord.js';
import * as dotenv from 'dotenv';

import configData from './config.json';

type NicknameRule = {
    user: string;
    replace: string[];
    with: string;
};

type Config = {
    nicknameRules: Record<string, NicknameRule[]>;
};

const config: Config = configData as Config;

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
    ],
});

client.once('ready', async () => {
    console.log(`Logged in as ${client.user?.tag}!`);

    setInterval(async () => {
        for (const guildId in config.nicknameRules) {
            const guild = await client.guilds.fetch(guildId);
            const guildRules = config.nicknameRules[guildId];

            for (const rule of guildRules) {
                try {
                    const member = await guild.members.fetch(rule.user);

                    if (!member || !member.nickname) continue;

                    console.log("Member currently has nickname: "+ member.nickname);

                    let updatedNick = member.nickname;

                    for (const target of rule.replace) {
                        const regex = new RegExp(target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                        updatedNick = updatedNick.replace(regex, rule.with);
                    }

                    if (updatedNick !== member.nickname) {
                        await member.setNickname(updatedNick, 'Nickname auto-corrected by bot to '+ updatedNick);
                        console.log(`✏️ Changed nickname for ${member.user.tag} to "${updatedNick}"`);
                    }else{
                        console.log("No changes made")
                    }
                } catch (error) {
                    console.error(`❌ Could not update nickname for user ID ${rule.user} in guild ${guildId}:`, (error as Error).message);
                }
            }
        }
    }, 10000);
});

client.login(process.env.DISCORD_TOKEN).catch((error) => {
    console.error('Error logging in:', error);
});