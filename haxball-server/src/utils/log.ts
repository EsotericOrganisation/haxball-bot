import {maxLengthLog} from "../Global";
import chalk from "chalk";

export const log = (prefix: string, message: string) => {
	const timestamp = new Date().toLocaleTimeString("pt-BR");

	if (message.length > maxLengthLog) {
		message = `${message.slice(0, maxLengthLog)}...`;
	}

	console.log(chalk.blueBright(`[${timestamp}] [${prefix}] ${message}`));
};
