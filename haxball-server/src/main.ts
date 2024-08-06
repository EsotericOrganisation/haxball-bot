#!/usr/bin/env node
import {Buffer} from "buffer";
import {Config} from "tunnel-ssh";
import {connect} from "./commands/connect";
import fs from "fs";
import {openServer} from "./commands/openServer";
import yargs from "yargs";

const args = yargs(process.argv.slice(2));
args.command({
	command: "open",
	aliases: ["o", "r", "run", "server"],
	describe: "Opens a Haxball server.",
	builder: {
		file: {
			describe: "The config.json file.",
			demandOption: false,
			type: "string",
		},
	},
	handler: (argv) => {
		openServer(argv.file as string);
	},
});

args.command({
	command: "connect",
	aliases: ["c"],
	describe: "Forwards a remote debugging SSH tunnel.",
	builder: {
		host: {
			describe: "The host name or IP address.",
			demandOption: true,
			type: "string",
		},
		user: {
			describe: "The user name.",
			demandOption: true,
			type: "string",
		},
		password: {
			describe: "Password for password-based authentication.",
			demandOption: false,
			type: "string",
			conflicts: "privateKey",
		},
		privateKey: {
			describe: "Private key for key-based authentication.",
			demandOption: false,
			type: "string",
			conflicts: "password",
		},
	},
	handler: async (argv: any) => {
		const params: Config = {
			username: argv.user,
			host: argv.host,
			keepAlive: true,
		};

		if (argv.password) {
			await connect({...params, password: argv.password});
		}

		if (argv.privateKey) {
			fs.readFile(argv.privateKey, {encoding: "utf-8"}, async (err, data) => {
				if (err) {
					return console.error(
						`${err.message}\nError while loading private key file`,
					);
				}

				await connect({...params, privateKey: Buffer.from(data)});
			});
		}
	},
});

args.demandCommand();
args.parse();
