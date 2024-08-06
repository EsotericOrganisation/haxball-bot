import { ChatInputCommandInteraction, Client, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder } from "discord.js";
import { ControlPanel } from "../ControlPanel";

export type Command = {
    data: SlashCommandBuilder|SlashCommandOptionsOnlyBuilder|Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">,
    execute (interaction: ChatInputCommandInteraction, client: Client, panel: ControlPanel): Promise<unknown>
}
