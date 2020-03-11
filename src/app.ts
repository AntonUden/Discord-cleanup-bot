import CleanupBot from "./CleanupBot";

const config: any = require('../config.json');
var channels: string[] = [];

for(let i: number = 0; i < config.channels.length; i++) {
	channels.push(config.channels[i]);
}

const bot = new CleanupBot(config.discord_token, channels, config.scan_interval, config.delete_after, config.fetch_limit);