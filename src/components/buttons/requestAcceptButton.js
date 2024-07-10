const {
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	ActionRowBuilder,
	ButtonInteraction,
	ButtonBuilder,
	ButtonStyle
} = require("discord.js");

module.exports = {
	name: "request-accept",
	/**
	 * @param {ButtonInteraction} interaction
	 */
	async execute(interaction) {
		const mention = interaction.message.embeds[0].data.fields[1].value;

		interaction.message.components[0].components.forEach((button) => {
			button.data.disabled = true;
		});

		interaction.message.components[0].components.push(
			new ButtonBuilder()
				.setLabel("Resend Token")
				.setStyle(ButtonStyle.Primary)
				.setCustomId("token-resend")
		);

		await interaction.message.edit({
			components: [
				new ActionRowBuilder().setComponents(
					interaction.message.components[0].components
				)
			]
		});

		const modal = new ModalBuilder()
			.setTitle("Send Token")
			.setCustomId("token-submit-modal")
			.setComponents(
				new ActionRowBuilder().addComponents(
					new TextInputBuilder()
						.setCustomId("token-submit-token")
						.setLabel("Token")
						.setPlaceholder("Paste the permanent token here")
						.setRequired(true)
						.setStyle(TextInputStyle.Paragraph)
				),
				new ActionRowBuilder().addComponents(
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
