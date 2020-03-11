import Discord, { Client, Channel, Message, TextChannel, Collection, Snowflake } from 'discord.js'
import sleep from "sleep-promise";

export default class CleanupBot {
	private _client: Client;
	private _channels: string[];
	private _deleteAfter: number;
	private _fetchLimit: number;


	constructor(token: string, channels: string[], scanInterval: number, deleteAfter: number, fetchLimit: number) {
		this._client = new Discord.Client();
		this._channels = channels;
		this._deleteAfter = deleteAfter;
		this._fetchLimit = fetchLimit;

		this._client.on('ready', () => {
			console.log(`Logged in as ${this._client.user.tag}!`);
			this.checkMessages();
		});

		setInterval((function () {
			this.checkMessages();
		}).bind(this), scanInterval);

		this._client.login(token);
	}

	async checkMessages() {
		let deleteAfterDate: Date = new Date();
		let tooOld: Date = new Date();

		deleteAfterDate.setSeconds(deleteAfterDate.getSeconds() - this._deleteAfter);
		tooOld.setHours(tooOld.getHours() - 288); /* 12 days */

		console.log("Deleting all messages after " + deleteAfterDate);
		console.log("Ignoring messages after: " + tooOld);

		for(let i: number = 0; i < this._channels.length; i++) {
			try {
				let cId: string = this._channels[i];
				console.log("Fetching data for channel: " + cId);
				let channel: Channel = await this._client.channels.fetch(cId);

				if(channel.type == "text") {
					let textChannel: TextChannel = (channel as TextChannel);
					console.log("Channel name: " + textChannel.name);

					let lastMessageID: string = null;

					while(true) {
						let filter: any = {limit: this._fetchLimit};

						if(lastMessageID != null) {
							filter["before"] = lastMessageID;
						}
						
						console.log("Fetching messages in channel " + textChannel.name);
						let messages: any = (await textChannel.messages.fetch(filter, false) as any).array();
						
						lastMessageID = null;

						for(let key in messages) {
							let message: Message = messages[key];
							lastMessageID = message.id;

							if(message.createdAt < tooOld) {
								lastMessageID = null;
								console.log("Messages too old");
								break;
							}

							if(message.createdAt >= deleteAfterDate) {
								continue;
							}

							if(message.pinned) {
								continue;
							}

							if(!message.deletable) {
								lastMessageID = null;
								continue;
							}

							console.log("Deleting message in channel " + textChannel.name + " id: " + message.id + " content: " + message.content);
							message.delete();
							await sleep(500);
						}

						if(lastMessageID == null) {
							console.log("No more messages to check");
							break;
						}

						await sleep(500);
					}
				} else {
					console.warn("Channel " + cId + " is not a text channel");
				}
				await sleep(500);
			} catch(err) {
				console.log(err);
			}
		}
	}
}