const {
	EmbedBuilder,
	bold,
	blockQuote,
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder
} = require("discord.js");

module.exports = {
	name: "token-request-modal",
	async execute(interaction, client) {
		//Extract data
		const email = interaction.fields.getTextInputValue(
			"token-request-modal-email"
		);
		const leagueInfo = interaction.fields.getTextInputValue(
			"token-request-modal-leagueinfo"
		);
		const reason = interaction.fields.getTextInputValue(
			"token-request-modal-reason"
		);
		const roomHosting = interaction.fields.getTextInputValue(
			"token-request-modal-roomhosting"
		);
		const roomList = interaction.fields.getTextInputValue(
			"token-request-modal-roomlist"
		);

		const embed = new EmbedBuilder()
			.setTitle(`${bold("New permanent token request submit")}`)
			.setDescription(
				`${blockQuote(
					"A user has submitted a request for a permanent haxball token. The contents of their form are listed below."
				)}`
			)
			.setColor("Aqua")
			.setAuthor({
				name: "Submitted by: " + interaction.user.username,
				iconURL: interaction.user.displayAvatarURL()
			})
			.setFooter({text: "Haxball Utilities"})
			.setFields(
				{
					name: "Email",
					value: email,
					inline: false
				},
				{
					name: "Discord Id",
					value: interaction.user.toString(),
					inline: false
				},
				{
					name: "League/Tournament Info",
					value: leagueInfo,
					inline: true
				},
				{
					name: "Reason",
					value: reason,
					inline: true
				},
				{
					name: "Current Room Hosting Methods",
					value: roomHosting,
					inline: false
				},
				{
					name: "List of all Rooms",
					value: roomList,
					inline: true
				}
			)
			.setTimestamp();

		const acceptButton = new ButtonBuilder()
			.setCustomId("request-accept")
			.setLabel("Accept Request")
			.setStyle(ButtonStyle.Success);

		const declineButton = new ButtonBuilder()
			.setCustomId("request-decline")
			.setLabel("Decline Request")
			.setStyle(ButtonStyle.Danger);

		await client.channels
			.fetch(process.env.ADMIN_CHANNEL_ID)
			.then(async (channel) => {
				await channel.send({
					embeds: [embed],
					components: [
						new ActionRowBuilder().setComponents(acceptButton, declineButton)
					]
				});
			})

			.catch((error) => console.error(error));

		return interaction.reply({
			content:
				"Your submission was successfully submitted and is now under review!",
			ephemeral: true
		});
	}
};
