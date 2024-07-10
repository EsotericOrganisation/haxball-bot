const chalk = require("chalk");

module.exports = {
	name: "ready",
	once: true,
	execute(client) {
		console.log(
			chalk.magenta(`[BOT] Logged in to discord as ${client.user.tag}!`)
		);
	}
};
