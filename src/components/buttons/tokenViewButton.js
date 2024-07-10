const {
	spoiler,
	time,
	TimestampStyles,
	EmbedBuilder,
	ButtonInteraction,
	Client
} = require("discord.js");

module.exports = {
	name: "token-view",
	/**
	 * @param {ButtonInteraction} interaction
	 * @param {Client} client
	 */
	async execute(interaction, client) {
		const token = client.tokens.get(interaction.user.id);

		const embed = EmbedBuilder.from(
			interaction.message.embeds[0]
		).setDescription(
			`Your token will expire <t:${
				Math.floor(Date.now() / 1000) + 30
			}:R>\n${spoiler(token)}`
		);

		await interaction.message.edit({
			embeds: [embed],
			components: []
		});

		setTimeout(async () => {
			client.tokens.delete(interaction.user.id);

			await interaction.message.edit({
				embeds: [
					embed.setDescription(
						"Your token has expired. Please contact an admin for support."
					)
				]
			});
		}, 30_000);

		await interaction.deferUpdate();
	}
};
