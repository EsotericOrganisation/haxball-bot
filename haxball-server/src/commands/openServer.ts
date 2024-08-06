import {ControlPanel} from "../ControlPanel";
import {Server} from "../Server";

import {loadConfig} from "../utils/loadConfig";

export const openServer = (file?: string) => {
	loadConfig(file)
		.then((config) => {
			const server = new Server(config.server);
			new ControlPanel(server, config.panel);
		})
		.catch((err) => {
			console.error(err.error ? `${err.message}, ${err.error}` : err.message);
			process.exit();
		});
};
