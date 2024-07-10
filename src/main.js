require("dotenv").config();
const {
	Client,
	GatewayIntentBits,
	Partials,
	Collection,
	Routes
} = require("discord.js");
const chalk = require("chalk");
const fs = require("fs");
const {REST} = require("@discordjs/rest");

class Bot extends Client {
	clientToken = process.env.DISCORD_BOT_TOKEN;
	id = process.env.DISCORD_BOT_ID;

	commandArray = [];
	commands = new Collection();
	buttons = new Collection();
	modals = new Collection();
	tokens = new Collection();

	constructor(intents, partials) {
		super({intents, partials});
	}

	async handleEvents() {
		const eventFolder = fs
			.readdirSync(`./src/events`)
			.filter((file) => file.endsWith(".js"));

		for (const file of eventFolder) {
			const event = require(`./events/${file}`);

			event.once
				? this.once(event.name, (...args) => event.execute(...args, this))
				: this.on(event.name, (...args) => event.execute(...args, this));
		}
	}

	async handleCommands() {
		const commandFolder = fs
			.readdirSync("./src/commands")
			.filter((file) => file.endsWith(".js"));

		for (const file of commandFolder) {
			const command = require(`./commands/${file}`);
			this.commands.set(command.data.name, command);
			this.commandArray.push(command.data.toJSON());
		}

		const rest = new REST({version: "10"}).setToken(this.clientToken);

		try {
			Bot.debugLog("Started refreshing application (/) commands!");

			await rest.put(Routes.applicationCommands(this.id), {
				body: this.commandArray
			});

			Bot.debugLog("Successfully refreshed application (/) commands!");
		} catch (error) {
			console.error(error);
		}
	}

	async handleComponents() {
		const componentFolder = fs.readdirSync(`./src/components`);
		for (const folder of componentFolder) {
			const filteredFolder = fs
				.readdirSync(`./src/components/${folder}`)
				.filter((file) => file.endsWith(".js"));

			switch (folder) {
				case "buttons":
					for (const file of filteredFolder) {
						const button = require(`./components/${folder}/${file}`);
						this.buttons.set(button.name, button);
					}

					break;

				case "modals":
					for (const file of filteredFolder) {
						const modal = require(`./components/${folder}/${file}`);
						this.modals.set(modal.name, modal);
					}

					break;

				default:
					break;
			}
		}
	}

	static debugLog(content) {
		console.log(chalk.cyan("[Debug] " + content));
	}
}

const client = new Bot(
	[GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
	[Partials.User]
);

client.handleCommands();
client.handleEvents();
client.handleComponents();
client.login(client.clientToken);
