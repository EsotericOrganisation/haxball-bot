import {
	ChatInputCommandInteraction,
	Client,
	Collection,
	EmbedBuilder,
	GatewayIntentBits,
	Partials,
	PermissionsBitField,
	SlashCommandBuilder,
	codeBlock,
	InteractionResponse,
	Routes,
	RESTPostAPIChatInputApplicationCommandsJSONBody,
	REST,
	inlineCode,
	bold,
	underscore
} from "discord.js";

import { Command } from "./utils/types"

import chalk from "chalk";
import fs from "fs";

import  {capitaliseFirstChar } from "./utils/capitaliseFirstChar";

import { Server } from "./Server";
import { CustomSettings, CustomSettingsList, PanelConfig } from "./Global";

import { log } from "./utils/log";

class Bot {
	// eslint-disable-next-line no-useless-constructor
	constructor(
		public name: string,
		public path: string,
		public displayName?: string,
	) { }

	read(): Promise<string> {
		return new Promise((resolve, reject) => {
			fs.readFile(this.path, { encoding: "utf-8" }, async (err, data) => {
				if (err) {
					reject(err);
				} else {
					resolve(data);
				}
			});
		});
	}

	run(
		server: Server,
		data: string,
		tokens: string | string[],
		settings?: CustomSettings,
	): ReturnType<Server["open"]> {
		return new Promise((resolve, reject) => {
			server
				.open(data, tokens, this.displayName, settings)
				.then((e) => resolve(e))
				.catch((err) => reject(err));
		});
	}
}

export class ControlPanel {
	private client = new Client({
		intents: Object.keys(GatewayIntentBits) as unknown as Partials[],
		partials: Object.keys(Partials) as unknown as Partials[],
	});

	// private cpu = os.cpu; DISABLED
	// private mem = os.mem; DISABLED

	//private prefix: string; DEPRECATED
	private token: string;
	private clientId: string;
	private channels: string[];

	private commands = new Collection();
	private commandArray: RESTPostAPIChatInputApplicationCommandsJSONBody[];

	private bots: Bot[] = [];

	private customSettings?: CustomSettingsList | null;

	private maxRooms?: number;

	constructor(
		private server: Server,
		config: PanelConfig,
	) {
		//this.prefix = config.discordPrefix;
		this.token = config.discordToken;
		this.maxRooms = config.maxRooms;
		this.clientId = config.clientId;
		this.commandArray = [];
		this.channels = config.channels;

		if (config.customSettings) this.loadCustomSettings(config.customSettings);
		this.loadBots(config.bots);

		this.client.on("ready", async () => {
			log("DISCORD", chalk.magenta(`Logged in as ${this.client.user?.tag}!`));
			log("DISCORD", chalk.blueBright(`Currently in ${this.client.guilds.cache.size} servers`));
			await this.handleCommands(this);
		});


		this.client.on("interactionCreate", async (interaction) => {
			if (!(interaction instanceof ChatInputCommandInteraction)) return;
			if (!this.channels.includes(interaction.channel?.id as string)) return void await interaction.reply({
				content: "You may not use commands in this channel!",
				ephemeral: true
			});

			try {
				const commandName = interaction.commandName;
				await (this.commands.get(commandName) as Command).execute(interaction, this.client, this);				
			} catch (error) {
				this.logError(error, interaction);
				throw error;
			}
		});

		this.client.login(this.token);
	}

	private transformSetting(setting: CustomSettings, list: CustomSettingsList) {
		if (setting.extends) {
			const extensions =
				typeof setting.extends === "string"
					? [setting.extends]
					: setting.extends;
			let newSetting: CustomSettings = {};

			for (const e of extensions) {
				let ext = list[e];

				if (ext) {
					if (ext.extends) ext = this.transformSetting(ext, list);

					newSetting = { ...newSetting, ...ext };
				}
			}

			newSetting = { ...newSetting, ...setting };

			delete newSetting.extends;

			return newSetting;
		}

		return setting;
	}

	private loadCustomSettings(customSettings: CustomSettingsList) {
		this.customSettings = null;

		for (const entry of Object.entries(customSettings)) {
			const [key, value] = entry;

			customSettings[key] = this.transformSetting(value, customSettings);
		}

		this.customSettings = customSettings;
	}

	private loadBots(bots: PanelConfig["bots"]) {
		this.bots = [];

		if (!Array.isArray(bots)) {
			for (const entry of Object.entries(bots)) {
				const [name, path] = entry;

				this.bots.push(new Bot(name, path));
			}
		} else {
			for (const bot of bots) {
				this.bots.push(new Bot(bot.name, bot.path, bot.displayName));
			}
		}
	}

	private async logError(error: any, interaction: ChatInputCommandInteraction) {
		await interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setTitle("Error Logs")
					.setColor("Red")
					.setDescription(error.message)
					.setFooter({ text: "Error Logging" })
					.setTimestamp()
			],
			ephemeral: true
		});
	}

	private async getRoomNameList() {
		const rooms = [];

		for (const browser of this.server.browsers) {
			const page = (await browser.pages())[0];
			const proxyServer = browser["proxyServer"];

			const pageTitle = await page.title();

            const nameStr = `${pageTitle} (ID: ${page.browser().process()?.pid})`;

			rooms.push({ name: nameStr, proxy: proxyServer });
		}

		if (rooms.length === 0) return "There are no open rooms!";
		if (rooms.every((r) => !r.proxy)) {
			return rooms.map((r) => r.name).join("\n");
		}
		const proxyRooms: { text: string; proxy: string }[] = [];

		for (const room of rooms) {
			const pRoom = proxyRooms.find((r) => r.proxy === room.proxy);

			if (pRoom) {
				pRoom.text += `${room.name}\n`;
			} else {
				proxyRooms.push({ text: room.name + "\n", proxy: room.proxy });
			}
		}

		return proxyRooms.map((r) => `• ${r.proxy}\n${r.text}`).join(`\n`);
	}

	// private async getRoomUsageList() {
	// 	const roomsUsage: { process: pidusage.Status; title: string }[] = [];

	// 	for (const browser of this.server.browsers) {
	// 		const page = (await browser.pages())[0];

	// 		roomsUsage.push({
	// 			process: await pidusage(browser?.process()?.pid as number),
	// 			title: await page.title(),
	// 		});
	// 	}

	// 	return roomsUsage;
	// }

	private async handleCommands(panel: ControlPanel) {
		const commandCollection: Command[] = [
			{
				data: new SlashCommandBuilder()
					.setName("help")
					.setDescription("Having difficulty with the bot? Try this command to get an info panel with a list of all commands.")
					.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles),
				async execute(interaction, client, _panel) {
					const embed = new EmbedBuilder()
						.setTitle("Help")
						.setThumbnail("https://cdn.discordapp.com/attachments/975798151267110914/1075196995142160485/ghs.gif")
						.setColor("Aqua")
						.setTimestamp(Date.now())
						.setFooter({ text: "Haxball Utilities", iconURL: client.user?.displayAvatarURL()})
						.setDescription("Haxball Server is a small server utility for Haxball rooms.",)
						.addFields(
							{
								name: "help",
								value: "Having difficulty with the bot? Try this command to get an info panel with a list of all commands.",
								inline: true,
							},
							{
								name: "info",
								value: "Get info about the haxball server.",
								inline: true,
							},
							{
								name: "open",
								value: "Open a haxball room.",
								inline: true,
							},
							{
								name: "close",
								value: "Close a haxball room.",
								inline: true,
							},
							{
								name: "tokenlink",
								value: "Get a headless token from their website.",
								inline: true,
							},
						);

					await interaction.reply({
						embeds: [embed]
					});
				}
			},
			{
				data: new SlashCommandBuilder()
					.setName("tokenlink")
					.setDescription("Get a headless token from their website.")
					.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles),
				async execute(interaction) {
					const embed = new EmbedBuilder()
						.setTitle("Headless Token")
						.setThumbnail("https://cdn.discordapp.com/attachments/975798151267110914/1075196995142160485/ghs.gif")
						.setColor("Aqua")
						.setTimestamp(Date.now())
                		.setDescription(`[Click here.](https://www.haxball.com/headlesstoken)`);

					await interaction.reply({
						embeds: [embed]
					});
				}
			},
			{
				data: new SlashCommandBuilder()
					.setName("open")
					.setDescription("Open a haxball room.")
					.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles)
					.addStringOption(option =>
						option
						  .setName("bot")
						  .setDescription("Opens the room along with the given haxball bot.")
						  .setRequired(true)
						  .setChoices(...panel.bots.map((bot) => ({ name: bot.name as string, value: bot.name as string }) ))
					)
					.addStringOption(option =>
						option
						  .setName("token")
						  .setDescription("The haxball headless token to use as a key to open the room.")
						  .setRequired(true)
					)
					.addStringOption(option =>
						option
						  .setName("settings")
						  .setDescription("Optional settings for the haxball room.")
						  .setRequired(false)
					),
				async execute(interaction, _client, panel) {
					const embed = new EmbedBuilder()
						.setThumbnail("https://cdn.discordapp.com/attachments/975798151267110914/1075196995142160485/ghs.gif")
						.setColor("Aqua")
						.setTimestamp(Date.now());

					if (panel.maxRooms != null && panel.server.browsers.length >= panel.maxRooms) {
						embed.setThumbnail(null)
						embed.setColor("Red")
						embed.setDescription(`Maximum number of rooms (${panel.maxRooms}) exceeded. Update configuration to change this.`);
		
						return await interaction.reply({ embeds: [embed] });
					}
		
					const bot = panel.bots.find((bot) => bot.name === interaction.options.getString("bot"));
		
					if (!bot) {
						embed.setDescription(`This bot does not exist. Use </info:0> to see the list of available bots.`);
		
						return await interaction.reply({ embeds: [embed] });
					}
		
					let token = interaction.options.getString("token") as string;
		
					if (!token) {
						embed.setDescription(`You have to provide a [headless token](https://www.haxball.com/headlesstoken) as second argument.`,);
		
						return await interaction.reply({ embeds: [embed] });
					}
		
					let settings: CustomSettings;
					let settingsMsg = "No setting has been loaded (not specified or not found).";
		
					if (panel.customSettings) {
						const settingArg = interaction.options.getString("settings") ?? "";

						settings = panel.customSettings[settingArg as string];
		
						if (settings) {
							settingsMsg = `\`${settingArg}\` settings have been loaded.`;
							token = token.replace(settingArg as string, "").trim();
						} else if (panel.customSettings["default"]) {
							settingsMsg = `Default settings have been loaded.`;
							settings = panel.customSettings["default"];
						}
					}
		
					embed.setDescription("> Opening room...");
		
					const message = await interaction.reply({embeds: [embed]}) as InteractionResponse;
		
					await bot
						.read()
						.then(async (script) => {
							await bot
								.run(
									panel.server,
									script,
									[token, token.substring(0, token.lastIndexOf(" "))],
									settings,
								)
								.then(async (e) => {
									const roomName = (await panel.getRoomNameList()).split("\n")[(await panel.getRoomNameList()).split("\n").length - 1].replace(/\([^()]*\)/g, "");
									console.log(roomName);
									await message.edit({
										embeds: [
											embed
												.setDescription(`> ${bold("Room Name:")} ${roomName}\n> ${bold("Room ID:")} \`${e.pid}\`\n> ${bold("Settings:")} ${settingsMsg}\n> ${bold("Room Link:")} ${e?.link}\n`)
												.setTitle("Room Opened")
										],
									});
								})
								.catch(async (err) => {
									await message.edit({
										embeds: [
											embed.setDescription(`Unable to open the room!\n ${codeBlock(err)}`),
										],
									});
								});
						})
						.catch(async (err) => {
							embed.setDescription("Error: " + codeBlock(err));
		
							await message.edit({ embeds: [embed] });
						});
				}
			},
			{
				data: new SlashCommandBuilder()
					.setName("close")
					.setDescription("Close a haxball room.")
					.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles)
					.addStringOption(option =>
						option
							.setName("id")
							.setDescription("The process ID of the room to close, or use 'all' to close all rooms.")
							.setRequired(true)
					),
				async execute(interaction, _client, panel) {
					const embed = new EmbedBuilder()
						.setTitle("Close Rooms")
						.setThumbnail("https://cdn.discordapp.com/attachments/975798151267110914/1075196995142160485/ghs.gif")
						.setColor("Red")
						.setTimestamp(Date.now())
						.setDescription("> Unable to find room.");

					if (interaction.options.getString("id") === "all") {
						let forcedClosedRooms = 0;
						let closedRooms = 0;

						for (const room of panel.server.browsers) {
							const pid = room?.process()?.pid;

							if (pid) {
								await panel.server.close(pid);
							} else {
								await room.close();

								forcedClosedRooms++;
							}

							closedRooms++;
						}

						if (forcedClosedRooms === 0) {
							embed
								.setColor("Aqua")
								.setDescription(`${closedRooms} rooms have been closed.`);
						} else {
							embed
								.setColor("Aqua")
								.setTitle(`${bold(underscore("Closed Room(s):"))} :lock:`)
								.setDescription(`${inlineCode(closedRooms.toString())} rooms have been closed.\n${inlineCode(forcedClosedRooms.toString())} rooms have been force closed.`,);
						}

						return await interaction.reply({ embeds: [embed] });
					}

					const res = await panel.server.close(Number.parseInt(interaction.options.getString("id") as string));

					if (res) embed
						.setColor("Aqua")
						.setDescription(`The room with the id ${interaction.options.getString("id")} has been closed!`)
						.setTitle(`${bold(underscore("Closed Room(s):"))} :lock:`);

					await interaction.reply({embeds: [embed]});
				}
			},
			{
				data: new SlashCommandBuilder()
					.setName("info")
					.setDescription("Get info about the haxball servers.")
					.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles),
				async execute(interaction, _client, panel) {
					const roomList = await panel.getRoomNameList();
					const embed = new EmbedBuilder();

            		embed
					  .setTitle(bold(underscore("Room Info: :information_source:")))
					  .setThumbnail("https://cdn.discordapp.com/attachments/975798151267110914/1075196995142160485/ghs.gif")
					  .setColor("Aqua")
					  .setTimestamp(Date.now())
					  .addFields(
                		{
                    	  name: ":white_check_mark: Opened Room(s)",
                    	  value: roomList as string,
               			},
                		{
                    	  name: "📝 Haxball Bots",
                    	  value: panel.bots.map((bot) => "* " + capitaliseFirstChar(bot.name)).join(`\n`),
                		},
                		{
                    	  name: "⚙️ Custom Settings",
                    	  value: panel.customSettings
                        	? "* " + Object.keys(panel.customSettings).join(`\n`)
                        	: "No custom settings have been specified.",
                		},
            		  );

					await interaction.reply({ embeds: [embed] });
				}
			},
			// {
			// 	data: new SlashCommandBuilder()
			// 		.setName("memoryinfo")
			// 		.setDescription("Get info about the CPU and memory.")
			// 		.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles),
			// 	async execute(interaction, _client, panel) {
			// 		const embed = new EmbedBuilder()
			// 			.setColor("Aqua")
			// 			.setTitle("Information")
			// 			.setDescription("> Loading...");
	
			// 		const message = await interaction.reply({ embeds: [embed] });
	
			// 		const roomsUsage = await panel.getRoomUsageList();
			// 		const memInfo = await panel.mem.info();
			// 		const cpuUsage = await panel.cpu.usage();
	
			// 		embed
			// 			.setTitle("Information")
			// 			.addFields(
			// 				{
			// 					name: "CPUs",
			// 					value: `${panel.cpu.count()}`,
			// 					inline: true,
			// 				},
			// 				{
			// 					name: "CPU usage",
			// 					value: `${cpuUsage}` + "%",
			// 					inline: true,
			// 				},
			// 				{
			// 					name: "Free CPU",
			// 					value: `${100 - cpuUsage}` + "%",
			// 					inline: true,
			// 				},
			// 				{
			// 					name: "Memory",
			// 					value: `${(memInfo.usedMemMb / 1000).toFixed(2)}/${(
			// 						memInfo.totalMemMb / 1000
			// 					).toFixed(2)} GB (${memInfo.freeMemPercentage}% free)`,
			// 					inline: true,
			// 				},
			// 				{
			// 					name: "OS",
			// 					value: await os.os.oos()(),
			// 					inline: true,
			// 				},
			// 				{
			// 					name: "Machine Uptime",
			// 					value: new Date(os.os.uptime() * 1000).toISOString().slice(11, 20),
			// 					inline: true,
			// 				},
			// 			);
	
			// 		const serverPIDUsage = await pidusage(process.pid);
	
			// 		const serverCPUUsage = `CPU server usage: ${serverPIDUsage.cpu.toFixed(2)}%\nMemory server usage: ${(serverPIDUsage.memory * 1e-6).toFixed(2)} MB\n`;
			// 		const roomCPUMessage =
			// 			panel.server.browsers.length > 0
			// 				? "\n" +
			// 				roomsUsage
			// 						.map(
			// 							(room) =>
			// 								`**${room.title} (${
			// 									room.process.pid
			// 								})**:\n${room.process.cpu.toFixed(2)}% CPU\n${(
			// 									room.process.memory * 1e-6
			// 								).toFixed(2)} MB memory\n`,
			// 						)
			// 						.join("\n")
			// 				: "";
		
			// 		embed.setDescription(serverCPUUsage + roomCPUMessage + "\n");
		
			// 		await message.edit({ embeds: [embed] });
			// 	}
			// }
		];

		for (const command of commandCollection) {
			this.commands.set(command.data.name, command);
			this.commandArray.push(command.data.toJSON());
		}

		const rest = new REST({ version: "10" }).setToken(this.token);

		try {
			console.log(chalk.greenBright(`Started refreshing ${this.commands.size} application (/) commands.`));
	
			// The put method is used to fully refresh all commands in the guild with the current set
			await rest.put(Routes.applicationCommands(this.clientId),
				{ body: this.commandArray },	
			);
	
			console.log(chalk.green(`Successfully reloaded application (/) commands.`));
		} catch (error) {
			// And of course, make sure you catch and log any errors!
			console.error(error);
		}

	}
}
