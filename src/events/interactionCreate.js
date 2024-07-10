const {InteractionType, Interaction, Client} = require("discord.js");

module.exports = {
	name: "interactionCreate",
	/**
	 * @param {Interaction} interaction
	 * @param {Client} client
	 */
	async execute(interaction, client) {
		if (interaction.isChatInputCommand()) {
			const {commands} = client;
			const {commandName} = interaction;
			const command = commands.get(commandName);

			if (!command) return;

			try {
				await command.execute(interaction, client);
			} catch (error) {
				await interaction.reply({
					content: `Something went wrong!`,
					ephemeral: true
				});
				console.error(error);
			}
		} else if (interaction.isButton()) {
			const {buttons} = client;
			const {customId} = interaction;
			const button = buttons.get(customId);
			if (!button)
				return console.error(
					new Error(
						`Unable to find matching file for button ${customId} of collection ${buttons}`
					)
				);

			try {
				await button.execute(interaction, client);
			} catch (err) {
				console.error(err);
			}
		} else if (interaction.type === InteractionType.ModalSubmit) {
			const {modals} = client;
			const {customId} = interaction;
			const modal = modals.get(customId);

			if (!modal)
				return console.error(
					new Error(
						`Unable to find matching file for modal: ${customId} of collection ${modals}`
					)
				);

			try {
				await modal.execute(interaction, client);
			} catch (error) {
				console.error(error);
			}
		} else if (
			interaction.type === InteractionType.ApplicationCommandAutocomplete
		) {
			const {commands} = client;
			const {commandName} = interaction;
			const command = commands.get(commandName);
			if (!command)
				return console.error(
					new Error(
						`Loading autocomplete failed for command: ${commandName} of collection ${commands}`
					)
				);

			try {
				await command.autocomplete(interaction, client);
			} catch (err) {
				console.error(err);
			}
		} else if (interaction.isStringSelectMenu()) {
			const {selectMenus} = client;
			const {customId} = interaction;
			const menu = selectMenus.get(customId);
			if (!menu)
				return console.error(
					new Error(
						`Unable to find matching file for selectMenu: ${customId} of collection ${selectMenus}`
					)
				);

			try {
				await menu.execute(interaction, client);
			} catch (error) {
				console.error(error);
			}
		}
	}
};
