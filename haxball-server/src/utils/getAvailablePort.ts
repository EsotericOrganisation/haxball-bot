import {Status, checkPortStatus} from "portscanner";

export const getAvailablePort = async (startingPort: number) => {
	let port = startingPort;

	let taken: Status | null = null;

	while (taken !== "closed") {
		taken = await checkPortStatus(port);

		port++;
	}

	return port;
};
