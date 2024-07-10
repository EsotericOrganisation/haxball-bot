const {ActionRowBuilder, ButtonInteraction, Client} = require("discord.js");

module.exports = {
	name: "request-decline",
	/**
	 * @param {ButtonInteraction} interaction
	 * @param {Client} client
	 */
	async execute(interaction, client) {
		interaction.message.components[0].components.forEach((button) => {
			button.data.disabled = true;
		});

		await interaction.message.edit({
			components: [
				new ActionRowBuilder().setComponents(
					interaction.message.components[0].components
				)
			]
		});

		const mention = interaction.message.embeds[0].fields[1].value;
		const userID = mention.slice(2, mention.length - 1);

		await interaction.reply({
			content: `This request by <@${userID}> has been declined by ${interaction.user.toString()}.`
		});

		const user = await client.users.fetch(userID);

		if (user) {
			user.send("Your permanent token request has been declined.");
		}
	}
};
