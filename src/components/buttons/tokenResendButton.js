const {
	ButtonInteraction,
	Client,
	ActionRowBuilder,
	ModalBuilder,
	TextInputStyle,
	TextInputBuilder
} = require("discord.js");

module.exports = {
	name: "token-resend",
	/**
	 * @param {ButtonInteraction} interaction
	 * @param {Client} client
	 */
	async execute(interaction, client) {
		if (client.tokens.get(interaction.user.id))
			return interaction.reply({
				content:
					"The user already has a token. This button will only work once their token expires.",
				ephemeral: true
			});

		const mention = interaction.message.embeds[0].data.fields[1].value;

		const modal = new ModalBuilder()
			.setTitle("Send Token")
			.setCustomId("token-submit-modal")
			.setComponents(
				new ActionRowBuilder().setComponents(
					new TextInputBuilder()
						.setCustomId("token-submit-token")
						.setLabel("Token")
						.setPlaceholder("Paste the permanent token here")
						.setRequired(true)
						.setStyle(TextInputStyle.Paragraph)
				),
				new ActionRowBuilder().setComponents(
					new TextInputBuilder()
						.setCustomId("token-submit-user")
						.setLabel("User Id")
						.setPlaceholder("Paste the user's id here")
						.setRequired(true)
						.setStyle(TextInputStyle.Short)
						.setValue(mention.slice(2, mention.length - 1))
				)
			);

		return interaction.showModal(modal);
	}
};
