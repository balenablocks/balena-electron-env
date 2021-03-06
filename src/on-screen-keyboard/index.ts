import { Mutex } from 'async-mutex';
import * as Electron from 'electron';
import { readFileSync } from 'fs';
import { join } from 'path';

import { execFile } from '../utils';

let keyboardVisible = false;

async function setKeyboardVisibility(visible: boolean): Promise<void> {
	await execFile(
		'dbus-send',
		'--type=method_call',
		'--dest=org.onboard.Onboard',
		'/org/onboard/Onboard/Keyboard',
		`org.onboard.Onboard.Keyboard.${visible ? 'Show' : 'Hide'}`,
	);
}

export const focusScript = readFileSync(
	join(__dirname, 'on-screen-keyboard', 'focus.js'),
	{
		encoding: 'utf8',
	},
);

export function init(electron: typeof Electron) {
	const keyboardMutex = new Mutex();

	electron.ipcMain.on('input-focus', async () => {
		const release = await keyboardMutex.acquire();
		if (!keyboardVisible) {
			await setKeyboardVisibility(true);
			keyboardVisible = true;
		}
		release();
	});

	electron.ipcMain.on('input-blur', async () => {
		const release = await keyboardMutex.acquire();
		if (keyboardVisible) {
			await setKeyboardVisibility(false);
			keyboardVisible = false;
		}
		release();
	});
}
