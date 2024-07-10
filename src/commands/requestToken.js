const {
	SlashCommandBuilder,
	PermissionsBitField,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	ActionRowBuilder
} = require("discord.js");

const modal = new ModalBuilder()
	.setTitle("Request Permanent Tokens")
	.setCustomId("token-request-modal")
	.setComponents(
		new ActionRowBuilder().setComponents(
			new TextInputBuilder()
				.setCustomId("token-request-modal-email")
				.setLabel("Email")
				.setPlaceholder("haxballfan123@gmail.com")
				.setRequired(true)
				.setStyle(TextInputStyle.Short)
		),
		new ActionRowBuilder().setComponents(
			new TextInputBuilder()
				.setCustomId("token-request-modal-leagueinfo")
				.setLabel("League/Tournament Information")
				.setPlaceholder("Please include an invite link in your description")
				.setRequired(true)
				.setStyle(TextInputStyle.Paragraph)
		),
		new ActionRowBuilder().setComponents(
			new TextInputBuilder()
				.setCustomId("token-request-modal-reason")
				.setLabel("Why you want permanent tokens")
				.setPlaceholder(
					"Provide a detailed description of why you would need permanent haxball tokens"
				)
				.setRequired(true)
				.setStyle(TextInputStyle.Paragraph)
		),
		new ActionRowBuilder().setComponents(
			new TextInputBuilder()
				.setCustomId("token-request-modal-roomhosting")
				.setLabel("How you currently host your rooms")
				.setPlaceholder(
					"Provide a detailed description of the methods you currently use to host your haxball rooms"
				)
				.setRequired(true)
				.setStyle(TextInputStyle.Paragraph)
		),
		new ActionRowBuilder().setComponents(
			new TextInputBuilder()
				.setCustomId("token-request-modal-roomlist")
				.setLabel("List of your haxball rooms")
				.setPlaceholder(
					"List all your haxball rooms, and specify whether they are private or public"
				)
				.setRequired(true)
				.setStyle(TextInputStyle.Paragraph)
		)
	);

module.exports = {
	data: new SlashCommandBuilder()
		.setName("request-token")
		.setDescription(
			"Fill out a form to make a request for an infinite haxball room token."
		)
		.setDefaultMemberPermissions(PermissionsBitField.Flags.SendMessages),
	async execute(interaction) {
		return interaction.showModal(modal);
	}
};
