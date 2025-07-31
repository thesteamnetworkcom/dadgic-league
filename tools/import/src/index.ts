// tools/import/src/index.ts
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import inquirer from 'inquirer';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { CreatePodInput, db, PodResolved } from '@dadgic/database';

// Load environment variables from the project root
const envPath = path.join(process.cwd(), '../../.env');
const envLocalPath = path.join(process.cwd(), '../../.env.local');

console.log('Looking for env files at:');
console.log('  .env:', envPath, fs.existsSync(envPath) ? '✓' : '✗');
console.log('  .env.local:', envLocalPath, fs.existsSync(envLocalPath) ? '✓' : '✗');

dotenv.config({ path: envPath });
dotenv.config({ path: envLocalPath });

console.log('Environment variables:');
console.log('  SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'NOT SET');
console.log('  NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET');
console.log('  SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
console.log();

interface CSVRow {
	Date: string;
	'Start Time': string;
	'End Time': string;
	Minutes: string;
	Turns: string;
	'Winning Commander': string;
	Pilot: string;
	'Participant Count': string;
	[key: string]: string; // For dynamic player columns
}

interface PlayerMapping {
	csvName: string;
	playerId: string;
	playerName: string;
}

class CSVImporter {
	private playerMappings: PlayerMapping[] = [];
	private allPlayers: any[] = [];

	async run() {
		console.log(chalk.blue.bold('🎴 Dadgic CSV Import Tool\n'));

		try {
			// Step 1: Load existing players
			await this.loadPlayers();

			// Step 2: Get CSV file path
			const csvPath = await this.getCsvPath();

			// Step 3: Parse CSV and find unique player names
			const csvData = await this.parseCSV(csvPath);
			const uniqueNames = this.extractUniquePlayerNames(csvData);

			// Step 4: Create player mappings
			await this.createPlayerMappings(uniqueNames);

			// Step 5: Convert CSV data to pod format
			const pods = this.convertToPods(csvData);

			// Step 6: Preview and confirm
			await this.previewImport(pods);

			// Step 7: Import the data
			await this.importPods(pods);

			console.log(chalk.green.bold('\n✅ Import completed successfully!'));

		} catch (error) {
			console.error(chalk.red.bold('\n❌ Import failed:'), error);
			process.exit(1);
		}
	}

	private async loadPlayers() {
		console.log(chalk.yellow('Loading existing players...'));
		this.allPlayers = await db.players.getAll();
		console.log(chalk.green(`Found ${this.allPlayers.length} existing players\n`));
	}

	private async getCsvPath(): Promise<string> {
		const { csvPath } = await inquirer.prompt([
			{
				type: 'input',
				name: 'csvPath',
				message: 'Enter the path to your CSV file:',
				validate: (input) => {
					if (!fs.existsSync(input)) {
						return 'File does not exist. Please enter a valid path.';
					}
					if (!input.endsWith('.csv')) {
						return 'Please provide a CSV file.';
					}
					return true;
				}
			}
		]);
		return csvPath;
	}

	private async parseCSV(filePath: string): Promise<CSVRow[]> {
		console.log(chalk.yellow('Parsing CSV file...'));

		return new Promise((resolve, reject) => {
			const results: CSVRow[] = [];

			fs.createReadStream(filePath)
				.pipe(csv())
				.on('data', (data) => results.push(data))
				.on('end', () => {
					console.log(chalk.green(`Parsed ${results.length} rows\n`));
					resolve(results);
				})
				.on('error', reject);
		});
	}

	private extractUniquePlayerNames(csvData: CSVRow[]): string[] {
		const names = new Set<string>();

		const standardColumns = [
			'Date', 'Format', 'Pod', 'Start Time', 'End Time', 'Minutes', 'Turns',
			'Winning Commander', 'Pilot', 'Win Con', 'Participants'
		];

		console.log(chalk.blue('Standard columns to skip:'), standardColumns);

		csvData.forEach((row, rowIndex) => {
			// Add the pilot (winner)
			if (row.Pilot) {
				names.add(row.Pilot.trim());
			}

			// Add all players from dynamic columns (assuming player columns contain deck names)
			Object.entries(row).forEach(([key, value]) => {
				// Clean the key and check against cleaned standard columns
				const cleanKey = key.trim();
				const isStandardColumn = standardColumns.some(col => col.trim().toLowerCase() === cleanKey.toLowerCase());

				if (rowIndex === 0) { // Only log for first row to avoid spam
					console.log(chalk.gray(`Checking column "${cleanKey}": isStandard=${isStandardColumn}, hasValue=${!!(value && value.trim())}`));
				}

				if (!isStandardColumn && value && value.trim()) {
					names.add(cleanKey); // The column name is the player name
				}
			});
		});

		const uniqueNames = Array.from(names).sort();
		console.log(chalk.blue('Found unique names:'), uniqueNames);
		return uniqueNames;
	}

	private async createPlayerMappings(uniqueNames: string[]) {
		console.log(chalk.yellow(`Found ${uniqueNames.length} unique player names in CSV:`));
		uniqueNames.forEach(name => console.log(chalk.gray(`  - ${name}`)));
		console.log();

		for (const csvName of uniqueNames) {
			// Check if we already have a player with this exact name
			const existingPlayer = this.allPlayers.find(p =>
				p.name.toLowerCase() === csvName.toLowerCase()
			);

			if (existingPlayer) {
				this.playerMappings.push({
					csvName,
					playerId: existingPlayer.id,
					playerName: existingPlayer.name
				});
				console.log(chalk.green(`✓ Mapped "${csvName}" to existing player "${existingPlayer.name}"`));
			} else {
				// Ask user to map or create
				const { action } = await inquirer.prompt([
					{
						type: 'list',
						name: 'action',
						message: `How should we handle "${csvName}"?`,
						choices: [
							{ name: 'Create new player', value: 'create' },
							{ name: 'Map to existing player', value: 'map' },
							{ name: 'Skip this player', value: 'skip' }
						]
					}
				]);

				if (action === 'create') {
					await this.createNewPlayer(csvName);
				} else if (action === 'map') {
					await this.mapToExistingPlayer(csvName);
				}
				// If skip, just don't add to mappings
			}
		}

		console.log(chalk.blue(`\nCreated ${this.playerMappings.length} player mappings\n`));
	}

	private async createNewPlayer(csvName: string) {
		const { name, discordUsername, email } = await inquirer.prompt([
			{
				type: 'input',
				name: 'name',
				message: `Enter display name for "${csvName}":`,
				default: csvName
			},
			{
				type: 'input',
				name: 'discordUsername',
				message: 'Enter Discord username (optional):'
			},
			{
				type: 'input',
				name: 'email',
				message: 'Enter email (optional):'
			}
		]);

		const newPlayer = await db.players.create({
			name,
			discord_id: null, // Will be populated when they first log in
			discord_username: discordUsername || null,
			email: email || null,
			role: 'player'
		});

		this.playerMappings.push({
			csvName,
			playerId: newPlayer.id,
			playerName: newPlayer.name
		});

		console.log(chalk.green(`✓ Created new player "${newPlayer.name}" with Discord username "${discordUsername || 'none'}"`));
	}

	private async mapToExistingPlayer(csvName: string) {
		const { selectedPlayer } = await inquirer.prompt([
			{
				type: 'list',
				name: 'selectedPlayer',
				message: `Map "${csvName}" to which existing player?`,
				choices: this.allPlayers.map(p => ({
					name: `${p.name} (${p.discord_id || p.email || 'no contact'})`,
					value: p
				}))
			}
		]);

		this.playerMappings.push({
			csvName,
			playerId: selectedPlayer.id,
			playerName: selectedPlayer.name
		});

		console.log(chalk.green(`✓ Mapped "${csvName}" to "${selectedPlayer.name}"`));
	}

	private convertToPods(csvData: CSVRow[]): PodResolved[] {
		console.log(chalk.yellow('Converting CSV data to pod format...'));

		// Debug: Show what columns we actually have
		if (csvData.length > 0) {
			console.log(chalk.blue('CSV Columns found:'), Object.keys(csvData[0]));
			console.log(chalk.blue('First row sample:'), csvData[0]);
		}

		const pods: PodResolved[] = [];

		csvData.forEach((row, index) => {
			try {
				// Get participants from dynamic columns
				const participants: any[] = [];
				const standardColumns = [
					'Date', 'Format', 'Pod', 'Start Time', 'End Time', 'Minutes', 'Turns',
					'Winning Commander', 'Pilot', 'Win Con', 'Participants'
				];

				Object.entries(row).forEach(([playerName, deck]) => {
					if (!standardColumns.includes(playerName) && deck && deck.trim()) {
						const mapping = this.playerMappings.find(m => m.csvName === playerName);
						if (mapping) {
							const isWinner = row.Pilot === playerName;
							participants.push({
								player_id: mapping.playerId,
								commander_deck: deck.trim(),
								result: isWinner ? 'win' : 'lose'
							});
						}
					}
				});

				if (participants.length > 0) {
					pods.push({
						date: this.parseDate(row.Date),
						game_length_minutes: parseInt(row.Minutes) || null,
						turns: parseInt(row.Turns) || null,
						league_id: null,
						notes: null,
						//winning_commander: row['Winning Commander']?.trim() || null,
						participants
					});
				}
			} catch (error) {
				console.warn(chalk.yellow(`Warning: Skipped row ${index + 1} due to error:`, error));
			}
		});

		console.log(chalk.green(`Converted ${pods.length} valid pods\n`));
		return pods;
	}

	private parseDate(dateStr: string): string {
		console.log(chalk.gray(`Parsing date: "${dateStr}"`));

		// Handle formats like "1/2/2023" or "01/02/2023"
		try {
			// First, try to handle M/D/YYYY format specifically
			const parts = dateStr.trim().split('/');
			console.log(chalk.gray(`Date parts:`, parts));

			if (parts.length === 3) {
				const month = parseInt(parts[0]);
				const day = parseInt(parts[1]);
				const year = parseInt(parts[2]);

				console.log(chalk.gray(`Parsed: month=${month}, day=${day}, year=${year}`));

				// Create date object (month is 0-indexed in JS)
				const date = new Date(year, month - 1, day);

				// Verify the date is valid
				if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
					const result = date.toISOString().split('T')[0];
					console.log(chalk.green(`Successfully parsed "${dateStr}" → "${result}"`));
					return result; // YYYY-MM-DD format
				}
			}

			// Fallback: try general date parsing
			const date = new Date(dateStr);
			if (!isNaN(date.getTime())) {
				const result = date.toISOString().split('T')[0];
				console.log(chalk.yellow(`Fallback parse "${dateStr}" → "${result}"`));
				return result;
			}
		} catch (error) {
			console.warn(chalk.red(`Error parsing date "${dateStr}":`, error));
		}

		// Final fallback to today
		const today = new Date().toISOString().split('T')[0];
		console.log(chalk.red(`Failed to parse "${dateStr}", using today: ${today}`));
		return today;
	}

	private async previewImport(pods: PodResolved[]) {
		console.log(chalk.blue.bold('Import Preview:'));
		console.log(chalk.gray(`  - ${pods.length} pods to import`));
		console.log(chalk.gray(`  - Date range: ${pods[0]?.date} to ${pods[pods.length - 1]?.date}`));
		console.log(chalk.gray(`  - Average game length: ${Math.round(pods.reduce((sum, p) => sum + (p.game_length_minutes || 0), 0) / pods.length)} minutes\n`));

		const { confirm } = await inquirer.prompt([
			{
				type: 'confirm',
				name: 'confirm',
				message: 'Proceed with import?',
				default: true
			}
		]);

		if (!confirm) {
			console.log(chalk.yellow('Import cancelled'));
			process.exit(0);
		}
	}

	private async importPods(pods: PodResolved[]) {
		console.log(chalk.yellow('Importing pods...'));

		let successCount = 0;
		let errorCount = 0;

		for (const [index, podData] of pods.entries()) {
			try {
				console.log(chalk.gray(`Importing pod ${index + 1}:`, JSON.stringify(podData, null, 2)));
				await db.pods.create(podData);
				successCount++;
				console.log(chalk.green(`✓ Pod ${index + 1} imported successfully`));

				if ((index + 1) % 10 === 0) {
					console.log(chalk.gray(`  Imported ${index + 1}/${pods.length} pods...`));
				}
			} catch (error) {
				errorCount++;
				console.error(chalk.red(`✗ Error importing pod ${index + 1}:`), error);
				console.error(chalk.red(`Pod data was:`, JSON.stringify(podData, null, 2)));
			}
		}

		console.log(chalk.green(`\n✅ Import summary:`));
		console.log(chalk.green(`  - ${successCount} pods imported successfully`));
		if (errorCount > 0) {
			console.log(chalk.red(`  - ${errorCount} pods failed to import`));
		}
	}
}

// Run the importer
const importer = new CSVImporter();
importer.run();