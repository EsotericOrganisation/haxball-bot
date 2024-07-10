const {
	EmbedBuilder,
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder,
	ModalSubmitInteraction,
	Client
} = require("discord.js");

module.exports = {
	name: "token-submit-modal",
	/**
	 * @param {ModalSubmitInteraction} interaction
	 * @param {Client} client
	 */
	async execute(interaction, client) {
		// Extract data.
		const tokens = interaction.fields.getTextInputValue("token-submit-token");
		const user = await client.users.fetch(
			interaction.fields.getTextInputValue("token-submit-user")
		);

		const embed = new EmbedBuilder()
			.setTitle("Your permanent token has been granted!")
			.setDescription(
				"Your recently submitted form has been reviewed and accepted. To view your token, click the button below. Once the button is clicked, your token will expire in 30 seconds."
			)
			.setFooter({text: "Haxball Utilities"})
			.setTimestamp()
			.setColor("Aqua");

		const viewButton = new ButtonBuilder()
			.setCustomId("token-view")
			.setLabel("View Token")
			.setStyle(ButtonStyle.Primary);

		client.tokens.set(user.id, tokens);

		const tokenLogChannel = await interaction.guild.channels.fetch(
			process.env.LOG_CHANNEL_ID
		);

		tokenLogChannel.send({
			embeds: [
				{
					title: "Requested Tokens",
					description: `${interaction.user.toString()} has accepted the request of ${user.toString()}.`,
					color: 0x00deed,
					timestamp: new Date(Date.now()).toISOString()
				}
			]
		});

		await user.send({
			embeds: [embed],
			components: [new ActionRowBuilder().setComponents(viewButton)]
		});

		return interaction.reply({
			content: `The token has been sent to ${user.toString()}!`
		});
	}
};
